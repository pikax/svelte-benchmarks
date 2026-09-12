import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { collectSvelteFiles, readSources, totalBytes } from "../fixtures.mjs";
import { measureVariants, timedSync, timedAsync } from "../timing.mjs";
import { loadRsvelteWasm } from "../rsvelte-wasm.mjs";
import { measureFreshChildVariants } from "../compile-fresh-runs.mjs";
import {
  applyCompileValidityGates,
  runCompileValidityMatrix,
} from "../compile-validity-gates.mjs";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const VERTER_ANALYSIS_LEVEL = process.env.VERTER_ANALYSIS_LEVEL || "full";

/* ------------------------------------------------------------------------- */
/* Anti-output-cache marker materialisation                                   */
/* ------------------------------------------------------------------------- */

/**
 * Fixed-width, semantically neutral per-pass revision markers.
 *
 * Every warmed/fresh pass of every implementation compiles a REVISED corpus:
 * a comment token (fixed width, so byte counts never drift between passes)
 * plus a used CSS rule carrying the token as a custom property. The timed
 * loop then asserts the token reached the emitted CSS — proving this pass's
 * input reached the artifact, so no candidate can win by returning a cached
 * whole-output result from the previous pass. Repeated-identical-input
 * behaviour stays a separate, explicitly non-ranking study
 * (fixtures/N-repeated).
 */
export function compileCellSalt(cellKey, classId) {
  return createHash("sha256")
    .update(`svelte-bench:${cellKey}:${classId}`)
    .digest("hex")
    .slice(0, 8);
}

export function revisionToken(salt, pass) {
  const phaseCode =
    pass.phase === "warmup" ? "w" : pass.phase === "fresh-child" ? "f" : "m";
  return `${salt}:${phaseCode}${String(pass.iteration ?? 0).padStart(10, "0")}`;
}

const MARKER_CLASS = "svelte-bench-rev";
const MARKER_PROPERTY = "--svelte-bench-rev";

/**
 * Inject the per-pass marker into one source. Shape is constant regardless of
 * token value: a JS comment in every <script>, one used CSS rule carrying the
 * token, and a hidden element that keeps that rule "used" (Svelte prunes
 * unused selectors — the pruning is itself a compared semantic).
 */
export function materializeMarkedSource(source, token) {
  let out = source;
  // 1. Script marker: comment right after each <script ...> open tag.
  out = out.replace(
    /(<script\b[^>]*>)/g,
    `$1\n/*svelte-bench:${token}*/`,
  );
  // 2. CSS marker: one USED rule at the top of the first <style>, or a new
  //    block. The leading dot matters — a bare type selector would match
  //    nothing and be pruned (correctly) by unused-selector pruning.
  const rule = `.${MARKER_CLASS} { ${MARKER_PROPERTY}: ${token}; }`;
  if (/<style\b[^>]*>/.test(out)) {
    out = out.replace(/(<style\b[^>]*>)/, `$1\n${rule}`);
  } else {
    out = `${out.trimEnd()}\n\n<style>\n${rule}\n</style>`;
  }
  // 3. Keep the rule used so Svelte's unused-selector pruning cannot drop it.
  return `${out.trimEnd()}\n<span class="${MARKER_CLASS}" hidden></span>\n`;
}

function passMaterializedInputs(sources, salt, pass, cache) {
  const key = `${pass.phase}:${pass.iteration ?? 0}`;
  let entry = cache.get(key);
  if (!entry) {
    const token = revisionToken(salt, pass);
    const marked = sources.map((f) => ({
      filename: f.filename,
      path: f.path,
      source: materializeMarkedSource(f.source, token),
      token,
    }));
    const inputBytes = marked.reduce((n, f) => n + f.source.length, 0);
    entry = {
      inputs: marked,
      token,
      inputCount: marked.length,
      inputBytes,
      inputSourceHash: createHash("sha256")
        .update(marked.map((f) => f.source).join("\u0000"))
        .digest("hex"),
    };
    cache.set(key, entry);
  }
  return entry;
}

/* ------------------------------------------------------------------------- */
/* Untimed artifact-shape gates (unchanged semantics from the first suite)     */
/* ------------------------------------------------------------------------- */

function outputParts(result) {
  const js =
    typeof result?.js === "string"
      ? result.js
      : (result?.js?.code ?? result?.code ?? "");
  const css =
    typeof result?.css === "string" ? result.css : (result?.css?.code ?? "");
  return { js, css };
}

function hasUncompiledStateRune(code) {
  const parsed = ts.createSourceFile(
    "compiled.js",
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  let found = false;
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "$state"
    ) {
      found = true;
      return;
    }
    if (!found) ts.forEachChild(node, visit);
  };
  visit(parsed);
  return found;
}

function svelteRuntimeGate(
  results,
  sources,
  generate,
  referenceResults = results,
) {
  if (!Array.isArray(results) || results.length !== sources.length) {
    return {
      ok: false,
      detail: `returned ${results?.length ?? 0}/${sources.length} outputs`,
    };
  }
  const runtime =
    generate === "server" ? "svelte/internal/server" : "svelte/internal/client";
  for (let index = 0; index < results.length; index += 1) {
    const { js, css } = outputParts(results[index]);
    const source = sources[index];
    if (!js) return { ok: false, detail: "returned empty JavaScript" };
    const parsed = ts.createSourceFile(
      source.filename,
      js,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.JS,
    );
    if (parsed.parseDiagnostics.length > 0) {
      return {
        ok: false,
        detail: `emitted invalid JavaScript for ${source.filename}`,
      };
    }
    if (/\$state\s*\(/.test(source.source) && hasUncompiledStateRune(js)) {
      return {
        ok: false,
        detail: `left the Svelte $state rune uncompiled in ${source.filename}`,
      };
    }
    if (!js.includes(runtime)) {
      return {
        ok: false,
        detail: `did not emit the expected ${runtime} runtime import`,
      };
    }
    const referenceCss = outputParts(referenceResults[index]).css;
    if (referenceCss && !css) {
      return {
        ok: false,
        detail: `did not emit external CSS produced by the official reference for ${source.filename}`,
      };
    }
    const generatedId = /Comp(\d{5})\.svelte$/i.exec(source.filename)?.[1];
    if (generatedId && !`${js}\n${css}`.includes(generatedId)) {
      return {
        ok: false,
        detail: `lost unique fixture marker ${generatedId} for ${source.filename}`,
      };
    }
  }
  return {
    ok: true,
    detail: `${sources.length}/${sources.length} parseable outputs use ${runtime} and match official CSS presence`,
  };
}

function optionSensitivityGate(sources, compileOne) {
  try {
    const differs = sources.some((source) => {
      const prod = outputParts(compileOne(source, false));
      const dev = outputParts(compileOne(source, true));
      return prod.js !== dev.js || prod.css !== dev.css;
    });
    return differs
      ? { ok: true, detail: "dev option changes output" }
      : { ok: false, detail: "dev option produced byte-identical output" };
  } catch (error) {
    return {
      ok: false,
      detail: `option sensitivity error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function optionSensitivityGateAsync(sources, compileOne) {
  try {
    for (const source of sources) {
      const prod = outputParts(await compileOne(source, false));
      const dev = outputParts(await compileOne(source, true));
      if (prod.js !== dev.js || prod.css !== dev.css) {
        return { ok: true, detail: "dev option changes output" };
      }
    }
    return { ok: false, detail: "dev option produced byte-identical output" };
  } catch (error) {
    return {
      ok: false,
      detail: `option sensitivity error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function mergeGates(...gates) {
  return {
    ok: gates.every((gate) => gate.ok),
    detail: gates.map((gate) => gate.detail).join("; "),
  };
}

function decodeRsvelteWasmResult(result) {
  return typeof result === "string" ? JSON.parse(result) : result;
}

function loadOptional(name) {
  try {
    return require(require.resolve(name, { paths: [rootDir] }));
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

/* ------------------------------------------------------------------------- */
/* Implementation loading + cell variant construction (parent & child share)   */
/* ------------------------------------------------------------------------- */

async function loadImplementations() {
  let svelteCompiler = loadOptional("svelte/compiler");
  if (svelteCompiler.error) {
    try {
      svelteCompiler = await import("svelte/compiler");
    } catch (error) {
      svelteCompiler = {
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  let mrwaipReference;
  try {
    mrwaipReference = await import("svelte-mrwaip-reference/compiler");
  } catch (error) {
    mrwaipReference = {
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // rsvelte wasm — shared loader (binary name changed across releases).
  let rsvelteWasm = null;
  let rsvelteWasmError = null;
  try {
    rsvelteWasm = await loadRsvelteWasm();
  } catch (error) {
    rsvelteWasmError = error instanceof Error ? error.message : String(error);
  }

  const rsvelteNative = loadOptional("@rsvelte/vite-plugin-svelte-native");

  let mrwaipCompiler;
  try {
    mrwaipCompiler = await import("@mrwaip/svelte-rs/compiler");
  } catch (error) {
    mrwaipCompiler = {
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // Verter re-probe (executable, not an allowlist): is there a public Svelte
  // runtime compile API on the installed package? Until one exists, the row
  // stays skipped — a different Verter operation is not proxied in its place.
  const verterNative = loadOptional("@verter/native");
  const verterSvelteRuntimeAvailable =
    !verterNative.error &&
    typeof verterNative.VerterHost === "function" &&
    typeof verterNative.VerterHost.prototype?.compileManySvelte === "function";

  return {
    svelteCompiler,
    mrwaipReference,
    rsvelteWasm,
    rsvelteWasmError,
    rsvelteNative,
    mrwaipCompiler,
    verterNative,
    verterSvelteRuntimeAvailable,
  };
}

/**
 * Build the variants for one matrix cell from a SERIALIZABLE payload. Shared
 * by the parent (warm measurement) and the fresh-child process so both run
 * the exact same per-pass materialisation and adapters.
 *
 * payload: { generate, env, fixtureDir, classes: [{id, files}], runes }
 */
export async function buildCompileCellVariants(payload) {
  const { generate, env } = payload;
  const isProd = env === "production";
  const cell = `${generate}-${isProd ? "prod" : "dev"}`;
  const runesOption = payload.runes === "auto" ? {} : { runes: true };
  const runesLabel = payload.runes === "auto" ? "auto" : "true";
  const impls = await loadImplementations();

  const classes = payload.classes.map((cls) => ({
    id: cls.id,
    files: cls.files,
    sources: readSources(payload.fixtureDir, cls.files),
    cache: new Map(),
  }));
  const classById = new Map(classes.map((c) => [c.id, c]));
  const primary = classById.get("svelte-5.56.8") ?? classes[0];
  const mrwaipClass = classById.get("svelte-5.56.4");

  const variants = [];
  // Reference outputs for CSS-presence parity inside a class.
  let officialOutputs = null;
  let mrwaipReferenceOutputs = null;
  if (
    !impls.svelteCompiler.error &&
    typeof impls.svelteCompiler.compile === "function"
  ) {
    officialOutputs = primary.sources.map((f) =>
      impls.svelteCompiler.compile(f.source, {
        filename: f.filename,
        generate,
        dev: !isProd,
        css: "external",
        ...runesOption,
      }),
    );
  }
  if (
    mrwaipClass &&
    !impls.mrwaipReference.error &&
    typeof impls.mrwaipReference.compile === "function"
  ) {
    mrwaipReferenceOutputs = mrwaipClass.sources.map((f) =>
      impls.mrwaipReference.compile(f.source, {
        filename: f.filename,
        generate,
        dev: !isProd,
        css: "external",
        ...runesOption,
      }),
    );
  }

  const saltOf = (cls) => compileCellSalt(cell, cls.id);
  const prepareClass = (cls) => (pass) => {
    const entry = passMaterializedInputs(cls.sources, saltOf(cls), pass, cls.cache);
    return {
      inputSourceHash: entry.inputSourceHash,
      inputCount: entry.inputCount,
      inputBytes: entry.inputBytes,
    };
  };
  /** The per-pass output gate: this pass's token must reach the artifact. */
  const assertTokenIn = (css, token, filename) => {
    if (!String(css ?? "").includes(token)) {
      throw new Error(
        `output-cache gate: pass revision token missing from emitted CSS for ${filename} — the compiler did not process this pass's input`,
      );
    }
  };


  /* --- Official svelte/compiler (baseline of the 5.56.8 class) --- */
  if (officialOutputs) {
    const compileOfficial = (f, dev) =>
      impls.svelteCompiler.compile(f.source, {
        filename: f.filename,
        generate,
        dev,
        css: "external",
        ...runesOption,
      });
    const gate = mergeGates(
      svelteRuntimeGate(officialOutputs, primary.sources, generate, officialOutputs),
      optionSensitivityGate(primary.sources, compileOfficial),
    );
    variants.push({
      id: `svelte-official-1t-${cell}`,
      label: `svelte/compiler 5.56.8 (1T)`,
      package: "svelte",
      target: generate,
      comparisonClass: "svelte-5.56.8",
      baseline: true,
      baselineLabel: "Svelte 5.56.8 (official)",
      env,
      threading: "1t",
      invocation: "in-process",
      fileCount: primary.files.length,
      unranked: !gate.ok,
      notes: `Official svelte/compiler compile(), generate=${generate}, dev=${!isProd}, css=external, runes=${runesLabel} | runtime gate: ${gate.ok ? "✓" : "✗"} ${gate.detail}`,
      artifactLabel: "Code bytes",
      prepare: prepareClass(primary),
      measure: async (pass) => {
        const entry = passMaterializedInputs(
          primary.sources,
          saltOf(primary),
          pass,
          primary.cache,
        );
        let work = 0;
        const { ms } = timedSync(() => {
          for (const f of entry.inputs) {
            const result = impls.svelteCompiler.compile(f.source, {
              filename: f.filename,
              generate,
              dev: !isProd,
              css: "external",
                            ...runesOption,
            });
            if (result?.errors?.length) {
              throw new Error(
                `svelte compile error in ${f.filename}: ${result.errors[0]?.message ?? result.errors[0]}`,
              );
            }
            const jsLen = result?.js?.code?.length ?? 0;
            const cssLen = result?.css?.code?.length ?? 0;
            const produced = jsLen + cssLen;
            if (produced <= 0) {
              throw new Error(
                `svelte/compiler produced no code for ${f.filename}`,
              );
            }
            assertTokenIn(result?.css?.code, entry.token, f.filename);
            work += produced;
          }
          if (work < entry.inputs.length) {
            throw new Error("svelte/compiler produced insufficient code");
          }
        });
        return { ms, artifact: work };
      },
    });
  } else {
    variants.push({
      id: `svelte-official-unavailable-${cell}`,
      label: `svelte/compiler 5.56.8`,
      package: "svelte",
      target: generate,
      comparisonClass: "svelte-5.56.8",
      fileCount: primary.files.length,
      env,
      notes: `Could not load: ${impls.svelteCompiler.error ?? "no compile export"}`,
      skip: true,
    });
  }

  /* --- Pinned official 5.56.4 reference (baseline of the mrwaip class) --- */
  if (mrwaipClass && mrwaipReferenceOutputs) {
    const compileReference = (f, dev) =>
      impls.mrwaipReference.compile(f.source, {
        filename: f.filename,
        generate,
        dev,
        css: "external",
        ...runesOption,
      });
    const gate = mergeGates(
      svelteRuntimeGate(
        mrwaipReferenceOutputs,
        mrwaipClass.sources,
        generate,
        mrwaipReferenceOutputs,
      ),
      optionSensitivityGate(mrwaipClass.sources, compileReference),
    );
    variants.push({
      id: `svelte-mrwaip-reference-${cell}`,
      label: `svelte/compiler 5.56.4 (1T)`,
      package: "svelte-mrwaip-reference",
      target: generate,
      comparisonClass: "svelte-5.56.4",
      baseline: true,
      baselineLabel: "Svelte 5.56.4 (official)",
      env,
      threading: "1t",
      invocation: "in-process",
      fileCount: mrwaipClass.files.length,
      unranked: !gate.ok,
      notes: `Pinned official reference for @mrwaip/svelte-rs; generate=${generate}, dev=${!isProd}, css=external | runtime gate: ${gate.ok ? "✓" : "✗"} ${gate.detail}`,
      artifactLabel: "Code bytes",
      prepare: prepareClass(mrwaipClass),
      measure: async (pass) => {
        const entry = passMaterializedInputs(
          mrwaipClass.sources,
          saltOf(mrwaipClass),
          pass,
          mrwaipClass.cache,
        );
        let work = 0;
        const { ms } = timedSync(() => {
          for (const f of entry.inputs) {
            const result = impls.mrwaipReference.compile(f.source, {
              filename: f.filename,
              generate,
              dev: !isProd,
              css: "external",
                            ...runesOption,
            });
            const jsLen = result?.js?.code?.length ?? 0;
            const cssLen = result?.css?.code?.length ?? 0;
            const produced = jsLen + cssLen;
            if (produced <= 0) {
              throw new Error(
                `svelte/compiler 5.56.4 produced no code for ${f.filename}`,
              );
            }
            assertTokenIn(result?.css?.code, entry.token, f.filename);
            work += produced;
          }
        });
        return { ms, artifact: work };
      },
    });
  } else if (mrwaipClass) {
    variants.push({
      id: `svelte-mrwaip-reference-unavailable-${cell}`,
      label: `svelte/compiler 5.56.4`,
      package: "svelte-mrwaip-reference",
      target: generate,
      comparisonClass: "svelte-5.56.4",
      fileCount: mrwaipClass.files.length,
      env,
      notes: impls.mrwaipReference.error ?? "compile export not found",
      skip: true,
    });
  }

  /* --- @mrwaip/svelte-rs (native NAPI) --- */
  if (mrwaipClass && !impls.mrwaipCompiler.error && typeof impls.mrwaipCompiler.compile === "function") {
    const mrwaipOptions = (f, dev) => ({
      filename: f.filename,
      generate,
      dev,
      css: "external",
            ...runesOption,
    });
    let mrwaipGate;
    try {
      const outputs = mrwaipClass.sources.map((f) =>
        impls.mrwaipCompiler.compile(f.source, mrwaipOptions(f, !isProd)),
      );
      mrwaipGate = mergeGates(
        svelteRuntimeGate(outputs, mrwaipClass.sources, generate, mrwaipReferenceOutputs),
        optionSensitivityGate(mrwaipClass.sources, (f, dev) =>
          impls.mrwaipCompiler.compile(f.source, mrwaipOptions(f, dev)),
        ),
      );
    } catch (error) {
      mrwaipGate = {
        ok: false,
        detail: `compile gate error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
    variants.push({
      id: `mrwaip-svelte-rs-${cell}`,
      label: `@mrwaip/svelte-rs (NAPI)`,
      package: "@mrwaip/svelte-rs",
      target: generate,
      comparisonClass: "svelte-5.56.4",
      env,
      threading: "1t",
      invocation: "in-process",
      fileCount: mrwaipClass.files.length,
      artifactLabel: "Code bytes",
      unranked: !mrwaipGate.ok,
      notes: `@mrwaip/svelte-rs compile(), generate=${generate}, dev=${!isProd}, css=external | runtime gate: ${mrwaipGate.ok ? "✓" : "✗"} ${mrwaipGate.detail}`,
      prepare: prepareClass(mrwaipClass),
      measure: async (pass) => {
        const entry = passMaterializedInputs(
          mrwaipClass.sources,
          saltOf(mrwaipClass),
          pass,
          mrwaipClass.cache,
        );
        let work = 0;
        const { ms } = timedSync(() => {
          for (const f of entry.inputs) {
            const result = impls.mrwaipCompiler.compile(
              f.source,
              mrwaipOptions(f, !isProd),
            );
            const { js, css } = outputParts(result);
            const produced = js.length + css.length;
            if (produced <= 0) {
              throw new Error(
                `@mrwaip/svelte-rs produced no code for ${f.filename}`,
              );
            }
            assertTokenIn(css, entry.token, f.filename);
            work += produced;
          }
        });
        return { ms, artifact: work };
      },
    });
  } else if (mrwaipClass) {
    variants.push({
      id: `mrwaip-svelte-rs-unavailable-${cell}`,
      label: `@mrwaip/svelte-rs`,
      package: "@mrwaip/svelte-rs",
      target: generate,
      comparisonClass: "svelte-5.56.4",
      fileCount: mrwaipClass.files.length,
      env,
      notes: impls.mrwaipCompiler.error
        ? `Could not load: ${impls.mrwaipCompiler.error}`
        : "compile export not found",
      skip: true,
    });
  }

  /* --- @rsvelte/compiler (WASM) --- */
  const compileClient = impls.rsvelteWasm?.compile_client ?? impls.rsvelteWasm?.compileClient;
  const compileServer = impls.rsvelteWasm?.compile_server ?? impls.rsvelteWasm?.compileServer;
  // Prefer the drop-in compile(source, options) API. The convenience
  // compile_client/server calls do not accept environment options, so using
  // them in every matrix cell would label unlike work as equal.
  const compileFn =
    impls.rsvelteWasm?.compile ??
    (generate === "server" ? compileServer : compileClient);

  if (!impls.rsvelteWasmError && typeof compileFn === "function") {
    const wasmOptions = (f, dev) => ({
      filename: f.filename,
      generate,
      dev,
      css: "external",
            ...runesOption,
    });
    let wasmGate;
    try {
      const outputs = primary.sources.map((f) => {
        if (compileFn === impls.rsvelteWasm?.compile) {
          return decodeRsvelteWasmResult(compileFn(f.source, wasmOptions(f, !isProd)));
        }
        return compileFn(f.source, f.filename);
      });
      const sensitivity =
        compileFn === impls.rsvelteWasm?.compile
          ? optionSensitivityGate(primary.sources, (f, dev) =>
              decodeRsvelteWasmResult(compileFn(f.source, wasmOptions(f, dev))),
            )
          : {
              ok: false,
              detail: "convenience API cannot represent dev/css options",
            };
      wasmGate = mergeGates(
        svelteRuntimeGate(outputs, primary.sources, generate, officialOutputs),
        sensitivity,
      );
    } catch (error) {
      wasmGate = {
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
      };
    }
    variants.push({
      id: `rsvelte-wasm-1t-${cell}`,
      label: `@rsvelte/compiler wasm (1T)`,
      package: "@rsvelte/compiler",
      target: generate,
      comparisonClass: "svelte-5.56.8",
      env,
      threading: "1t",
      invocation: "in-process",
      fileCount: primary.files.length,
      unranked: !wasmGate.ok,
      notes: `rsvelte WASM compile(), generate=${generate}, dev=${!isProd}, css=external. ⚠ WASM path — not the NAPI native binding. | runtime gate: ${wasmGate.ok ? "✓" : "✗"} ${wasmGate.detail}`,
      artifactLabel: "Code bytes",
      prepare: prepareClass(primary),
      measure: async (pass) => {
        const entry = passMaterializedInputs(
          primary.sources,
          saltOf(primary),
          pass,
          primary.cache,
        );
        let work = 0;
        const { ms } = timedSync(() => {
          for (const f of entry.inputs) {
            // compile_client/server(source, filename) → CompileResultWasm
            // with string .js/.css; compile(source, opts) → { js: { code } }.
            let result;
            if (compileFn === impls.rsvelteWasm?.compile) {
              result = compileFn(f.source, wasmOptions(f, !isProd));
              result = decodeRsvelteWasmResult(result);
            } else {
              result = compileFn(f.source, f.filename);
            }
            if (result?.success === false || result?.error) {
              throw new Error(
                `rsvelte wasm error in ${f.filename}: ${result.error ?? "success=false"}`,
              );
            }
            const js =
              typeof result?.js === "string"
                ? result.js.length
                : (result?.js?.code?.length ?? 0);
            const css =
              typeof result?.css === "string"
                ? result.css
                : (result?.css?.code ?? "");
            const produced = js + css.length;
            if (produced <= 0) {
              throw new Error(
                `rsvelte wasm produced no code for ${f.filename}`,
              );
            }
            assertTokenIn(css, entry.token, f.filename);
            work += produced;
            // Free wasm-owned handles when present
            if (typeof result?.free === "function") result.free();
          }
          if (work < entry.inputs.length) {
            throw new Error("rsvelte wasm produced insufficient code");
          }
        });
        return { ms, artifact: work };
      },
    });
  } else {
    variants.push({
      id: `rsvelte-wasm-unavailable-${cell}`,
      label: `@rsvelte/compiler wasm`,
      package: "@rsvelte/compiler",
      target: generate,
      comparisonClass: "svelte-5.56.8",
      fileCount: primary.files.length,
      env,
      notes: impls.rsvelteWasmError
        ? `Could not load: ${impls.rsvelteWasmError}`
        : "compile_client/compile_server export not found",
      skip: true,
    });
  }

  /* --- @rsvelte/vite-plugin-svelte-native (NAPI) --- */
  if (
    !impls.rsvelteNative.error &&
    (typeof impls.rsvelteNative.compile === "function" ||
      typeof impls.rsvelteNative.compileSync === "function")
  ) {
    const hasSync = typeof impls.rsvelteNative.compileSync === "function";
    const nativeOptions = (f, dev) => ({
      filename: f.filename,
      generate,
      dev,
      css: "external",
            ...runesOption,
    });
    let nativeGate;
    try {
      const outputs = [];
      for (const f of primary.sources) {
        outputs.push(
          hasSync
            ? impls.rsvelteNative.compileSync(f.source, nativeOptions(f, !isProd))
            : await impls.rsvelteNative.compile(f.source, nativeOptions(f, !isProd)),
        );
      }
      const sensitivity = hasSync
        ? optionSensitivityGate(primary.sources, (f, dev) =>
            impls.rsvelteNative.compileSync(f.source, nativeOptions(f, dev)),
          )
        : await optionSensitivityGateAsync(primary.sources, (f, dev) =>
            impls.rsvelteNative.compile(f.source, nativeOptions(f, dev)),
          );
      nativeGate = mergeGates(
        svelteRuntimeGate(outputs, primary.sources, generate, officialOutputs),
        sensitivity,
      );
    } catch (error) {
      nativeGate = {
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
      };
    }
    variants.push({
      id: `rsvelte-native-1t-${cell}`,
      label: `@rsvelte/native NAPI (1T)`,
      package: "@rsvelte/vite-plugin-svelte-native",
      target: generate,
      comparisonClass: "svelte-5.56.8",
      env,
      threading: "1t",
      invocation: "in-process",
      fileCount: primary.files.length,
      unranked: !nativeGate.ok,
      notes: `rsvelte NAPI compile${hasSync ? "Sync" : ""}(), generate=${generate}, dev=${!isProd}, css=external | runtime gate: ${nativeGate.ok ? "✓" : "✗"} ${nativeGate.detail}`,
      artifactLabel: "Code bytes",
      prepare: prepareClass(primary),
      measure: async (pass) => {
        const entry = passMaterializedInputs(
          primary.sources,
          saltOf(primary),
          pass,
          primary.cache,
        );
        let work = 0;
        if (hasSync) {
          const { ms } = timedSync(() => {
            for (const f of entry.inputs) {
              const result = impls.rsvelteNative.compileSync(
                f.source,
                nativeOptions(f, !isProd),
              );
              const { js, css } = outputParts(result);
              const produced = js.length + css.length;
              if (produced <= 0) {
                throw new Error(
                  `rsvelte native produced no code for ${f.filename}`,
                );
              }
              assertTokenIn(css, entry.token, f.filename);
                work += produced;
            }
            if (work < entry.inputs.length) {
              throw new Error("rsvelte native produced insufficient code");
            }
          });
          return { ms, artifact: work };
        }
        const { ms } = await timedAsync(async () => {
          for (const f of entry.inputs) {
            const result = await impls.rsvelteNative.compile(
              f.source,
              nativeOptions(f, !isProd),
            );
            const { js, css } = outputParts(result);
            const produced = js.length + css.length;
            if (produced <= 0) {
              throw new Error(
                `rsvelte native produced no code for ${f.filename}`,
              );
            }
            assertTokenIn(css, entry.token, f.filename);
            work += produced;
          }
          if (work < entry.inputs.length) {
            throw new Error("rsvelte native produced insufficient code");
          }
        });
        return { ms, artifact: work };
      },
    });
  } else {
    variants.push({
      id: `rsvelte-native-unavailable-${cell}`,
      label: `@rsvelte/native NAPI`,
      package: "@rsvelte/vite-plugin-svelte-native",
      target: generate,
      comparisonClass: "svelte-5.56.8",
      fileCount: primary.files.length,
      env,
      notes: impls.rsvelteNative.error
        ? `Could not load: ${impls.rsvelteNative.error}`
        : "compile export not found",
      skip: true,
    });
  }

  /* --- Verter (experimental Svelte; probed, currently skipped) --- */
  if (impls.verterSvelteRuntimeAvailable) {
    // Reserved: when Verter exposes a public Svelte runtime compile API, the
    // row is benchmarked through THAT API and gated like every other row.
    variants.push({
      id: `verter-stateless-${cell}`,
      label: `Verter compileMany (stateless)`,
      package: "@verter/native",
      target: generate,
      comparisonClass: "experimental-svelte",
      env,
      threading: "batch",
      invocation: "in-process",
      artifactLabel: "Code bytes",
      unranked: true,
      notes: "Verter Svelte runtime compile API detected; wiring not yet validated.",
      skip: true,
    });
  } else {
    variants.push({
      id: `verter-unavailable-${cell}`,
      label: `Verter native`,
      package: "@verter/native",
      target: generate,
      comparisonClass: "experimental-svelte",
      env,
      notes:
        "No public Svelte runtime compile API; the experimental carrier exposes an IDE projection only. No proxy workload is timed.",
      skip: true,
    });
  }

  return variants;
}

/* ------------------------------------------------------------------------- */
/* Fresh-child adapter parity audit                                           */
/* ------------------------------------------------------------------------- */

/**
 * The fresh child must have compiled the same corpus the warm passes did.
 * Meta parity (inputCount/inputBytes) plus distinct per-pass input hashes
 * across BOTH samplers close the whole-output-cache window: every pass of
 * every sampler received a distinct, this-pass input.
 */
export function applyAdapterParity(rows) {
  for (const row of rows) {
    if (row.status === "skipped" || row.status === "error") continue;
    const freshMeta = row.freshChildMetaSamples?.[0];
    const warmMeta = (row.metaSamples ?? []).at(-1);
    const notes = [];
    let failed = false;
    if (freshMeta && warmMeta) {
      if (freshMeta.inputCount !== warmMeta.inputCount) {
        failed = true;
        notes.push(
          `fresh child compiled ${freshMeta.inputCount} files, warm pass compiled ${warmMeta.inputCount}`,
        );
      }
      if (freshMeta.inputBytes !== warmMeta.inputBytes) {
        failed = true;
        notes.push(
          `fresh child input bytes ${freshMeta.inputBytes}, warm pass ${warmMeta.inputBytes}`,
        );
      }
    }
    const hashes = new Set(
      [
        ...(row.metaSamples ?? []),
        ...(row.freshChildMetaSamples ?? []),
      ].map((m) => m.inputSourceHash).filter(Boolean),
    );
    const passes = (row.metaSamples ?? []).length + (row.freshChildMetaSamples ?? []).length;
    if (hashes.size > 0 && hashes.size < passes) {
      failed = true;
      notes.push(
        `only ${hashes.size} distinct input revisions across ${passes} passes — a pass reused a previous input`,
      );
    }
    if (failed) {
      row.status = row.status === "ok" ? "unranked" : row.status;
      if (row.status === "unranked") row.throughput = "n/a";
      row.notes = `${row.notes ? `${row.notes} | ` : ""}⚠ FRESH/WARM ADAPTER PARITY FAILED — ${notes.join("; ")}`;
    } else if (hashes.size > 0) {
      row.notes = `${row.notes ? `${row.notes} | ` : ""}ⓘ adapter parity: ${hashes.size} distinct input revisions across ${passes} passes (warm + fresh child)`;
    }
  }
  return rows;
}

/* ------------------------------------------------------------------------- */
/* Surface entry point                                                        */
/* ------------------------------------------------------------------------- */

/**
 * Compile surface — Svelte SFC compile throughput.
 *
 * Matrix: generate ∈ {client, server} × env ∈ {production, development}
 *         × source-map ∈ {off, on} (off by default; map-on rows never rank —
 *         presence is asserted, mapping correctness is not yet verified).
 * Warm median remains the primary metric. Compiler rows additionally publish
 * a separately sampled FRESH CHILD column: the first timed row workload in a
 * new child process, after excluded process startup/imports/adapter setup.
 */
export async function runCompileSurface(fixtureDir, options) {
  const files = collectSvelteFiles(fixtureDir, options.fileLimit);
  const sources = readSources(fixtureDir, files);
  const bytes = totalBytes(fixtureDir, files);
  const filesForClass = (comparisonClass) => {
    const selected = options.compileFilesByClass?.[comparisonClass];
    if (!selected) return files;
    const known = new Set(files);
    const unknown = selected.filter((file) => !known.has(file));
    if (unknown.length > 0) {
      throw new Error(
        `${comparisonClass} contains unstaged compile inputs: ${unknown.slice(0, 3).join(", ")}`,
      );
    }
    if (selected.length === 0) {
      throw new Error(`${comparisonClass} contains no compile inputs`);
    }
    return selected;
  };
  const primaryFiles = filesForClass("svelte-5.56.8");
  const primarySources = readSources(fixtureDir, primaryFiles);
  const mrwaipFiles = filesForClass("svelte-5.56.4");
  const mrwaipSources = readSources(fixtureDir, mrwaipFiles);

  const generates = (options.compileTargets ?? "client,server")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const envs = (options.compileEnvs ?? "production,development")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const groups = [];
  const validityCells = [];

  for (const generate of generates) {
    for (const env of envs) {
      {
        const payload = {
          generate,
          env,
          fixtureDir,
          runes: options.compileRunes ?? "true",
          classes: [
            { id: "svelte-5.56.8", files: primaryFiles },
            { id: "svelte-5.56.4", files: mrwaipFiles },
          ],
        };
        const variants = await buildCompileCellVariants(payload);

        // Warm measurement — materialisation happens in prepare(), before the
        // timers, so marker cost is outside every timed interval.
        const measured = await measureVariants(variants, {
          runs: options.runs,
          warmups: options.warmups,
          fileCount: files.length,
          prepareAllBeforeTiming: true,
        });

        // Fresh-child sampling (compile rows only). A fresh-child error
        // annotates; it never replaces the warm verdict.
        const freshChild = measureFreshChildVariants(variants, {
          runs: options.runs,
          payload,
        });
        for (const row of measured) {
          const fresh = freshChild.byId[row.id];
          if (!fresh) continue;
          Object.assign(row, fresh);
          if (fresh.freshChildError) {
            row.notes = `${row.notes ? `${row.notes} | ` : ""}⚠ FRESH-CHILD SAMPLE UNAVAILABLE — ${fresh.freshChildError}`;
          }
        }
        applyAdapterParity(measured);

        validityCells.push({ generate, env, sourceMap: false });
        groups.push({
          id: `${generate}-${env === "production" ? "prod" : "dev"}`,
          label: `${generate.toUpperCase()} · ${env}`,
          target: generate,
          env,
          variants: measured,
        });
      }
    }
  }

  // Runtime semantic validity runs AFTER all timing, in isolated children, so
  // correctness checking can never warm the code paths it certifies.
  const compileSemantics = runCompileValidityMatrix(validityCells);
  for (const group of groups) {
    applyCompileValidityGates(group.variants, compileSemantics, {
      generate: group.target,
      env: group.env,
      sourceMap: false,
    });
  }

  const runesLabel = (options.compileRunes ?? "true") === "auto" ? "auto" : "true";
  return {
    id: "compile",
    label: "SFC compile (unique contents)",
    files: files.length,
    bytes,
    groups,
    validation: {
      compileSemantics,
    },
    methodology: [
      "Matrix: generate ∈ {client, server} × env ∈ {production, development} × source-map ∈ {off, on} (off by default).",
      "Within each pinned compiler-version class, every tool receives the same in-memory Svelte SFC corpus. Real-world eligibility is decided independently by that class's official reference and per-row file counts remain visible.",
      `Official: svelte/compiler compile() with runes=${runesLabel}. Generated fixtures force runes; real-world sources use compiler auto-detection.`,
      "MrWaip: @mrwaip/svelte-rs native compiler through its compatible compile() API, ranked inside the pinned svelte-5.56.4 class with svelte/compiler 5.56.4 as the official reference/baseline.",
      "rsvelte: WASM (@rsvelte/compiler) and NAPI (@rsvelte/vite-plugin-svelte-native) paths are separate rows in the svelte-5.56.8 class.",
      "Verter exposes no public Svelte runtime compile API in the installed package (probed at runtime), so it is reported skipped; its different runtime-render batching API is not substituted.",
      "Every warmed/fresh pass compiles a REVISED corpus: a fixed-width comment token plus a used CSS custom-property rule. The timed loop asserts the token reached the emitted CSS, so a cached whole-output result from a previous pass fails the gate. Adapter parity additionally requires every warm and fresh pass to have received a distinct input revision.",
      "Every compiler must return one non-empty code artifact per input file, emit the expected Svelte client/server runtime import, and remove Svelte runes; aggregate byte totals alone are not accepted as proof of coverage.",
      "Fresh child = the first timed row workload in a NEW child process, after excluded Node startup, package imports, adapter construction and input materialisation. It is NOT machine-cold (OS page cache is not flushed) and its ratio never substitutes for the warm verdict.",
      "Source maps: every compared Svelte 5 compiler ALWAYS emits js.map/css.map from compile() (no off/on flag exists — the 'sourcemap' option is a chained-map INPUT), so an off/on matrix would measure the harness, not the tools. Instead the maps' COORDINATE CORRECTNESS gates every row: anchored tokens in generated JS/CSS must trace back to their exact source positions (segment fallback allowed, exact line/column required, sourcesContent equal to the full component), across LF/CRLF and non-BMP-shifted columns. Wrong-file, shifted, stale or byte-counted maps unrank the row.",
      "Runtime semantic validity: a 28-plant Svelte 5 suite (props/state/derived/bindable/bindings/events/each-keyed/await/snippets/stores/actions/context/dynamic components/{@html}/SVG/module script/legacy syntax + CSS semantics) runs per entrypoint per cell in isolated child processes after timing; non-PASS rows unrank, and a failed official reference unrankS every candidate in its compatibility class (no survivor promotion).",
      "Tool order is rotated on every warmup and measured run. A row is unranked unless the measured runs cover every active execution position; ranking metric is the median of warmed runs.",
    ],
    freshChildMeasurement: {
      processModel: "fresh-child-first-timed-row-workload",
      excludes: [
        "child-process-startup",
        "package-import",
        "adapter-construction",
        "input-materialisation",
      ],
      osPageCacheFlushed: false,
      whollyFreshRuntimeStateClaimed: false,
      note: "Fresh child is sampled separately from warm; warm median remains the primary ranking metric.",
    },
  };
}
