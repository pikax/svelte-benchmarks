import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { collectSvelteFiles, readSources, totalBytes } from "../fixtures.mjs";
import { measureVariants, timedSync, timedAsync } from "../timing.mjs";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const VERTER_ANALYSIS_LEVEL = process.env.VERTER_ANALYSIS_LEVEL || "full";

function verterCompileGate(results, expectedCount, generate) {
  if (!Array.isArray(results) || results.length !== expectedCount) {
    return {
      ok: false,
      detail: `returned ${results?.length ?? 0}/${expectedCount} outputs`,
    };
  }
  const runtime =
    generate === "server" ? "svelte/internal/server" : "svelte/internal/client";
  for (const result of results) {
    const code = result?.code ?? "";
    if (!code) return { ok: false, detail: "returned empty code" };
    if (/\$state\s*\(/.test(code)) {
      return { ok: false, detail: "left the Svelte $state rune uncompiled" };
    }
    if (!code.includes(runtime)) {
      return {
        ok: false,
        detail: `did not emit the expected ${runtime} runtime import`,
      };
    }
  }
  return {
    ok: true,
    detail: `${expectedCount}/${expectedCount} outputs use ${runtime}`,
  };
}

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

/**
 * Official svelte/compiler: compile(source, options) → { js, css, warnings, ... }
 */
function svelteCompile(
  compile,
  source,
  filename,
  { generate, dev, css, runesOption = { runes: true } },
) {
  const result = compile(source, {
    filename,
    generate, // 'client' | 'server'
    dev,
    css: css ?? "external",
    ...runesOption,
  });
  const jsLen = result?.js?.code?.length ?? 0;
  const cssLen = result?.css?.code?.length ?? 0;
  if (result?.errors?.length) {
    throw new Error(
      `svelte compile error in ${filename}: ${result.errors[0]?.message ?? result.errors[0]}`,
    );
  }
  return jsLen + cssLen;
}

/**
 * Compile surface — Svelte SFC compile throughput.
 *
 * Matrix: generate ∈ {client, server} × env ∈ {production, development}
 * Tools: svelte/compiler (official) · @mrwaip/svelte-rs ·
 *        @rsvelte/compiler (wasm) · @rsvelte/vite-plugin-svelte-native (NAPI) ·
 *        Verter is skipped: no public Svelte runtime compile API.
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
  const runesOption = options.compileRunes === "auto" ? {} : { runes: true };
  const runesLabel = options.compileRunes === "auto" ? "auto" : "true";

  const generates = (options.compileTargets ?? "client,server")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const envs = (options.compileEnvs ?? "production,development")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Official
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

  // rsvelte wasm — prefer initSync with the bundled .wasm bytes so Node does
  // not try to fetch() a file: URL (which fails under undici on Node 22+).
  let rsvelteWasm = null;
  let rsvelteWasmError = null;
  try {
    rsvelteWasm = await import("@rsvelte/compiler");
    const pkgJson = require.resolve("@rsvelte/compiler/package.json", {
      paths: [rootDir],
    });
    const wasmPath = join(dirname(pkgJson), "rsvelte_lint_bg.wasm");
    const wasmBytes = readFileSync(wasmPath);
    if (typeof rsvelteWasm.initSync === "function") {
      rsvelteWasm.initSync({ module: wasmBytes });
    } else if (typeof rsvelteWasm.default === "function") {
      await rsvelteWasm.default({ module: wasmBytes });
    } else if (typeof rsvelteWasm.init === "function") {
      await rsvelteWasm.init({ module: wasmBytes });
    }
  } catch (error) {
    rsvelteWasmError = error instanceof Error ? error.message : String(error);
  }

  // rsvelte NAPI native
  const rsvelteNative = loadOptional("@rsvelte/vite-plugin-svelte-native");

  let mrwaipCompiler;
  try {
    mrwaipCompiler = await import("@mrwaip/svelte-rs/compiler");
  } catch (error) {
    mrwaipCompiler = {
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // Verter
  const verterNative = loadOptional("@verter/native");
  // Current public runtime-render batching is not a Svelte compile API. Keep a
  // skipped row instead of adapting that different workload.
  const verterSvelteRuntimeAvailable = false;
  const hosts = {};

  const groups = [];

  for (const generate of generates) {
    for (const env of envs) {
      {
        const isProd = env === "production";
        const cell = `${generate}-${isProd ? "prod" : "dev"}`;
        const variants = [];
        let officialOutputs = null;
        let mrwaipReferenceOutputs = null;

        // --- Official svelte/compiler ---
        if (
          !svelteCompiler.error &&
          typeof svelteCompiler.compile === "function"
        ) {
          let officialGate;
          try {
            const compileOfficial = (f, dev) =>
              svelteCompiler.compile(f.source, {
                filename: f.filename,
                generate,
                dev,
                css: "external",
                ...runesOption,
              });
            officialOutputs = primarySources.map((f) =>
              compileOfficial(f, !isProd),
            );
            officialGate = mergeGates(
              svelteRuntimeGate(
                officialOutputs,
                primarySources,
                generate,
                officialOutputs,
              ),
              optionSensitivityGate(primarySources, compileOfficial),
            );
          } catch (error) {
            officialGate = {
              ok: false,
              detail: error instanceof Error ? error.message : String(error),
            };
          }
          variants.push({
            id: `svelte-official-1t-${cell}`,
            label: `svelte/compiler 5.56.8 (1T)`,
            package: "svelte",
            target: generate,
            comparisonClass: "svelte-5.56.8",
            env,
            threading: "1t",
            invocation: "in-process",
            fileCount: primaryFiles.length,
            unranked: !officialGate.ok,
            notes: `Official svelte/compiler compile(), generate=${generate}, dev=${!isProd}, css=external, runes=${runesLabel}, single-threaded | runtime gate: ${officialGate.ok ? "✓" : "✗"} ${officialGate.detail}`,
            artifactLabel: "Code bytes",
            measure: async () => {
              let work = 0;
              const { ms } = timedSync(() => {
                for (const f of primarySources) {
                  const produced = svelteCompile(
                    svelteCompiler.compile,
                    f.source,
                    f.filename,
                    {
                      generate,
                      dev: !isProd,
                      css: "external",
                      runesOption,
                    },
                  );
                  if (produced <= 0) {
                    throw new Error(
                      `svelte/compiler produced no code for ${f.filename}`,
                    );
                  }
                  work += produced;
                }
                if (work < primarySources.length) {
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
            fileCount: primaryFiles.length,
            env,
            notes: `Could not load: ${svelteCompiler.error ?? "no compile export"}`,
            skip: true,
          });
        }

        // MrWaip documents byte-parity against Svelte 5.56.4. Keep that
        // official version beside it instead of comparing against 5.56.8.
        if (
          !mrwaipReference.error &&
          typeof mrwaipReference.compile === "function"
        ) {
          let referenceGate;
          try {
            const compileReference = (f, dev) =>
              mrwaipReference.compile(f.source, {
                filename: f.filename,
                generate,
                dev,
                css: "external",
                ...runesOption,
              });
            mrwaipReferenceOutputs = mrwaipSources.map((f) =>
              compileReference(f, !isProd),
            );
            referenceGate = mergeGates(
              svelteRuntimeGate(
                mrwaipReferenceOutputs,
                mrwaipSources,
                generate,
                mrwaipReferenceOutputs,
              ),
              optionSensitivityGate(mrwaipSources, compileReference),
            );
          } catch (error) {
            referenceGate = {
              ok: false,
              detail: error instanceof Error ? error.message : String(error),
            };
          }
          variants.push({
            id: `svelte-mrwaip-reference-${cell}`,
            label: `svelte/compiler 5.56.4 (1T)`,
            package: "svelte-mrwaip-reference",
            target: generate,
            comparisonClass: "svelte-5.56.4",
            env,
            threading: "1t",
            invocation: "in-process",
            fileCount: mrwaipFiles.length,
            unranked: !referenceGate.ok,
            notes: `Pinned official reference for @mrwaip/svelte-rs; generate=${generate}, dev=${!isProd}, css=external | runtime gate: ${referenceGate.ok ? "✓" : "✗"} ${referenceGate.detail}`,
            artifactLabel: "Code bytes",
            measure: async () => {
              let work = 0;
              const { ms } = timedSync(() => {
                for (const f of mrwaipSources) {
                  work += svelteCompile(
                    mrwaipReference.compile,
                    f.source,
                    f.filename,
                    {
                      generate,
                      dev: !isProd,
                      css: "external",
                      runesOption,
                    },
                  );
                }
              });
              return { ms, artifact: work };
            },
          });
        } else {
          variants.push({
            id: `svelte-mrwaip-reference-unavailable-${cell}`,
            label: `svelte/compiler 5.56.4`,
            package: "svelte-mrwaip-reference",
            target: generate,
            comparisonClass: "svelte-5.56.4",
            fileCount: mrwaipFiles.length,
            env,
            notes: mrwaipReference.error ?? "compile export not found",
            skip: true,
          });
        }

        // --- @mrwaip/svelte-rs (native NAPI) ---
        if (
          !mrwaipCompiler.error &&
          typeof mrwaipCompiler.compile === "function"
        ) {
          let mrwaipGate;
          try {
            const outputs = mrwaipSources.map((f) =>
              mrwaipCompiler.compile(f.source, {
                filename: f.filename,
                generate,
                dev: !isProd,
                css: "external",
                ...runesOption,
              }),
            );
            const sensitivity = optionSensitivityGate(mrwaipSources, (f, dev) =>
              mrwaipCompiler.compile(f.source, {
                filename: f.filename,
                generate,
                dev,
                css: "external",
                ...runesOption,
              }),
            );
            mrwaipGate = mergeGates(
              svelteRuntimeGate(
                outputs,
                mrwaipSources,
                generate,
                mrwaipReferenceOutputs,
              ),
              sensitivity,
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
            fileCount: mrwaipFiles.length,
            artifactLabel: "Code bytes",
            unranked: !mrwaipGate.ok,
            notes: `@mrwaip/svelte-rs compile(), generate=${generate}, dev=${!isProd}, css=external | runtime gate: ${mrwaipGate.ok ? "✓" : "✗"} ${mrwaipGate.detail}`,
            measure: async () => {
              let work = 0;
              const { ms } = timedSync(() => {
                for (const f of mrwaipSources) {
                  const result = mrwaipCompiler.compile(f.source, {
                    filename: f.filename,
                    generate,
                    dev: !isProd,
                    css: "external",
                    ...runesOption,
                  });
                  const produced =
                    (result?.js?.code?.length ?? result?.code?.length ?? 0) +
                    (result?.css?.code?.length ?? 0);
                  if (produced <= 0) {
                    throw new Error(
                      `@mrwaip/svelte-rs produced no code for ${f.filename}`,
                    );
                  }
                  work += produced;
                }
              });
              return { ms, artifact: work };
            },
          });
        } else {
          variants.push({
            id: `mrwaip-svelte-rs-unavailable-${cell}`,
            label: `@mrwaip/svelte-rs`,
            package: "@mrwaip/svelte-rs",
            target: generate,
            comparisonClass: "svelte-5.56.4",
            fileCount: mrwaipFiles.length,
            env,
            notes: mrwaipCompiler.error
              ? `Could not load: ${mrwaipCompiler.error}`
              : "compile export not found",
            skip: true,
          });
        }

        // --- @rsvelte/compiler (WASM) ---
        const compileClient =
          rsvelteWasm?.compile_client ?? rsvelteWasm?.compileClient;
        const compileServer =
          rsvelteWasm?.compile_server ?? rsvelteWasm?.compileServer;
        // Prefer the drop-in compile(source, options) API. The convenience
        // compile_client/server calls do not accept environment options,
        // so using them in every matrix cell would label unlike work as equal.
        const compileFn =
          rsvelteWasm?.compile ??
          (generate === "server" ? compileServer : compileClient);

        if (!rsvelteWasmError && typeof compileFn === "function") {
          let wasmGate;
          try {
            const outputs = primarySources.map((f) => {
              if (compileFn === rsvelteWasm?.compile) {
                return decodeRsvelteWasmResult(
                  compileFn(f.source, {
                    filename: f.filename,
                    generate,
                    dev: !isProd,
                    css: "external",
                    ...runesOption,
                  }),
                );
              }
              return compileFn(f.source, f.filename);
            });
            const sensitivity =
              compileFn === rsvelteWasm?.compile
                ? optionSensitivityGate(primarySources, (f, dev) =>
                    decodeRsvelteWasmResult(
                      compileFn(f.source, {
                        filename: f.filename,
                        generate,
                        dev,
                        css: "external",
                        ...runesOption,
                      }),
                    ),
                  )
                : {
                    ok: false,
                    detail: "convenience API cannot represent dev/css options",
                  };
            wasmGate = mergeGates(
              svelteRuntimeGate(
                outputs,
                primarySources,
                generate,
                officialOutputs,
              ),
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
            fileCount: primaryFiles.length,
            unranked: !wasmGate.ok,
            notes: `rsvelte WASM compile(), generate=${generate}, dev=${!isProd}, css=external. ⚠ WASM path — not the NAPI native binding. | runtime gate: ${wasmGate.ok ? "✓" : "✗"} ${wasmGate.detail}`,
            artifactLabel: "Code bytes",
            measure: async () => {
              let work = 0;
              const { ms } = timedSync(() => {
                for (const f of primarySources) {
                  // compile_client/server(source, filename) → CompileResultWasm
                  // with string .js/.css; compile(source, opts) → { js: { code } }.
                  let result;
                  if (compileFn === rsvelteWasm?.compile) {
                    result = compileFn(f.source, {
                      filename: f.filename,
                      generate,
                      dev: !isProd,
                      css: "external",
                      ...runesOption,
                    });
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
                      ? result.css.length
                      : (result?.css?.code?.length ?? 0);
                  const produced = js + css;
                  if (produced <= 0) {
                    throw new Error(
                      `rsvelte wasm produced no code for ${f.filename}`,
                    );
                  }
                  work += produced;
                  // Free wasm-owned handles when present
                  if (typeof result?.free === "function") result.free();
                }
                if (work < primarySources.length) {
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
            fileCount: primaryFiles.length,
            env,
            notes: rsvelteWasmError
              ? `Could not load: ${rsvelteWasmError}`
              : "compile_client/compile_server export not found",
            skip: true,
          });
        }

        // --- @rsvelte/vite-plugin-svelte-native (NAPI) ---
        if (
          !rsvelteNative.error &&
          (typeof rsvelteNative.compile === "function" ||
            typeof rsvelteNative.compileSync === "function")
        ) {
          const nativeCompile =
            rsvelteNative.compileSync ??
            ((source, opts) => {
              // sync wrapper if only async
              throw new Error(
                "async-only native compile needs timedAsync path",
              );
            });
          const hasSync = typeof rsvelteNative.compileSync === "function";
          const hasAsync = typeof rsvelteNative.compile === "function";
          let nativeGate;
          try {
            const outputs = [];
            for (const f of primarySources) {
              outputs.push(
                hasSync
                  ? rsvelteNative.compileSync(f.source, {
                      filename: f.filename,
                      generate,
                      dev: !isProd,
                      css: "external",
                      ...runesOption,
                    })
                  : await rsvelteNative.compile(f.source, {
                      filename: f.filename,
                      generate,
                      dev: !isProd,
                      css: "external",
                      ...runesOption,
                    }),
              );
            }
            const sensitivity = hasSync
              ? optionSensitivityGate(primarySources, (f, dev) =>
                  rsvelteNative.compileSync(f.source, {
                    filename: f.filename,
                    generate,
                    dev,
                    css: "external",
                    ...runesOption,
                  }),
                )
              : await optionSensitivityGateAsync(primarySources, (f, dev) =>
                  rsvelteNative.compile(f.source, {
                    filename: f.filename,
                    generate,
                    dev,
                    css: "external",
                    ...runesOption,
                  }),
                );
            nativeGate = mergeGates(
              svelteRuntimeGate(
                outputs,
                primarySources,
                generate,
                officialOutputs,
              ),
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
            fileCount: primaryFiles.length,
            unranked: !nativeGate.ok,
            notes: `rsvelte NAPI compile${hasSync ? "Sync" : ""}(), generate=${generate}, dev=${!isProd}, css=external | runtime gate: ${nativeGate.ok ? "✓" : "✗"} ${nativeGate.detail}`,
            artifactLabel: "Code bytes",
            measure: async () => {
              let work = 0;
              if (hasSync) {
                const { ms } = timedSync(() => {
                  for (const f of primarySources) {
                    const result = rsvelteNative.compileSync(f.source, {
                      filename: f.filename,
                      generate,
                      dev: !isProd,
                      css: "external",
                      ...runesOption,
                    });
                    const { js, css } = outputParts(result);
                    const produced = js.length + css.length;
                    if (produced <= 0) {
                      throw new Error(
                        `rsvelte native produced no code for ${f.filename}`,
                      );
                    }
                    work += produced;
                  }
                  if (work < primarySources.length) {
                    throw new Error(
                      "rsvelte native produced insufficient code",
                    );
                  }
                });
                return { ms, artifact: work };
              }
              const { ms } = await timedAsync(async () => {
                for (const f of primarySources) {
                  const result = await rsvelteNative.compile(f.source, {
                    filename: f.filename,
                    generate,
                    dev: !isProd,
                    css: "external",
                    ...runesOption,
                  });
                  const { js, css } = outputParts(result);
                  const produced = js.length + css.length;
                  if (produced <= 0) {
                    throw new Error(
                      `rsvelte native produced no code for ${f.filename}`,
                    );
                  }
                  work += produced;
                }
                if (work < primarySources.length) {
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
            fileCount: primaryFiles.length,
            env,
            notes: rsvelteNative.error
              ? `Could not load: ${rsvelteNative.error}`
              : "compile export not found",
            skip: true,
          });
        }

        // --- Verter (experimental Svelte) ---
        if (
          verterSvelteRuntimeAvailable &&
          !verterNative.error &&
          typeof verterNative.VerterHost === "function"
        ) {
          const VerterHost = verterNative.VerterHost;
          const batchInputs = sources.map((f) => ({
            canonicalId: f.path.replace(/\\/g, "/"),
            source: f.source,
            requestedMode: "stateless",
            fileKind: "svelte",
          }));
          // Also support upsert-style with fileKind if compileMany doesn't take fileKind on input
          const renderProfile = {
            isProduction: isProd,
            customElement: false,
            ssr: generate === "server",
            forceJs: true,
            hmrStrategy: isProd ? "none" : "vite",
            runtimeModuleName: "svelte",
          };

          // Untimed artifact-shape gate. A carrier/preprocessor module is not
          // equivalent to compiled Svelte runtime code even when it is non-empty.
          let verterGate;
          try {
            const gateHost = new VerterHost({
              devMode: !isProd,
              analysisLevel: VERTER_ANALYSIS_LEVEL,
            });
            const gateResults = gateHost.compileMany(batchInputs, {
              target: "runtime-render",
              defaultMode: "stateless",
              priority: "interactive",
              compileProfile: renderProfile,
            });
            verterGate = verterCompileGate(
              gateResults,
              sources.length,
              generate,
            );
          } catch (error) {
            verterGate = {
              ok: false,
              detail: `compile gate error: ${error instanceof Error ? error.message : String(error)}`,
            };
          }

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
            unranked: !verterGate.ok,
            notes: `experimental Svelte carrier, runtime-render ssr=${generate === "server"}, isProduction=${isProd}, mode=stateless, analysis=${VERTER_ANALYSIS_LEVEL} | compile gate: ${verterGate.ok ? "✓" : "✗"} ${verterGate.detail}`,
            measure: async () => {
              const host = new VerterHost({
                devMode: !isProd,
                analysisLevel: VERTER_ANALYSIS_LEVEL,
              });
              return timedSync(() => {
                // Prefer compileMany; fall back to upsert+get for svelte fileKind
                let results;
                try {
                  results = host.compileMany(batchInputs, {
                    target: "runtime-render",
                    defaultMode: "stateless",
                    priority: "interactive",
                    compileProfile: renderProfile,
                  });
                } catch (error) {
                  // Fallback: upsert each with fileKind svelte
                  results = [];
                  for (const f of sources) {
                    const id = f.path.replace(/\\/g, "/");
                    host.upsert({
                      inputId: id,
                      source: f.source,
                      fileKind: "svelte",
                    });
                    const ide = host.getIde?.(id) ?? host.getPublicApi?.(id);
                    const code =
                      ide?.code ??
                      ide?.main?.code ??
                      (typeof ide === "string" ? ide : "");
                    results.push({
                      code: code || " ",
                      errors: code ? [] : [String(error)],
                    });
                  }
                }
                const failed = (results ?? []).filter((r) => r.errors?.length);
                if (failed.length === (results?.length ?? 0) && failed.length) {
                  throw new Error(
                    `verter svelte compile failed: ${failed[0].errors[0]}`,
                  );
                }
                if ((results?.length ?? 0) !== sources.length) {
                  throw new Error(
                    `verter returned ${results?.length ?? 0}/${sources.length} compile results`,
                  );
                }
                const empty = (results ?? []).filter(
                  (result) => !(result?.code?.length > 0),
                );
                if (empty.length > 0) {
                  throw new Error(
                    `verter returned empty code for ${empty.length}/${sources.length} files`,
                  );
                }
                const codeBytes = (results ?? []).reduce(
                  (n, r) => n + (r?.code?.length ?? 0),
                  0,
                );
                if (codeBytes < sources.length) {
                  throw new Error("verter svelte returned empty code");
                }
                return {
                  artifact: codeBytes,
                  cacheHits: (results ?? []).filter((r) => r.cacheHit).length,
                };
              });
            },
          });

          variants.push({
            id: `verter-session-${cell}`,
            label: `Verter compileMany (session cache)`,
            package: "@verter/native",
            target: generate,
            comparisonClass: "experimental-svelte",
            env,
            threading: "batch-cached",
            invocation: "in-process",
            artifactLabel: "Code bytes",
            unranked: true,
            notes: `experimental Svelte carrier, session mode, analysis=${VERTER_ANALYSIS_LEVEL} — persistent cross-run cache; measured but unranked because every other row recompiles the corpus | compile gate: ${verterGate.ok ? "✓" : "✗"} ${verterGate.detail}`,
            measure: async () => {
              const key = `session-${cell}`;
              if (!hosts[key]) {
                hosts[key] = new VerterHost({
                  devMode: !isProd,
                  analysisLevel: VERTER_ANALYSIS_LEVEL,
                });
              }
              return timedSync(() => {
                const results = hosts[key].compileMany(
                  batchInputs.map((b) => ({ ...b, requestedMode: "session" })),
                  {
                    target: "runtime-render",
                    defaultMode: "session",
                    priority: "interactive",
                    compileProfile: renderProfile,
                  },
                );
                const failed = results.filter((r) => r.errors?.length);
                if (failed.length === results.length && failed.length) {
                  throw new Error(
                    `verter session failed: ${failed[0].errors[0]}`,
                  );
                }
                if (results.length !== sources.length) {
                  throw new Error(
                    `verter session returned ${results.length}/${sources.length} compile results`,
                  );
                }
                const empty = results.filter(
                  (result) => !(result?.code?.length > 0),
                );
                if (empty.length > 0) {
                  throw new Error(
                    `verter session returned empty code for ${empty.length}/${sources.length} files`,
                  );
                }
                const codeBytes = results.reduce(
                  (n, r) => n + (r?.code?.length ?? 0),
                  0,
                );
                if (codeBytes < sources.length) {
                  throw new Error("verter session returned empty code");
                }
                return {
                  artifact: codeBytes,
                  cacheHits: results.filter((r) => r.cacheHit).length,
                };
              });
            },
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

        const measured = await measureVariants(variants, {
          runs: options.runs,
          warmups: options.warmups,
          fileCount: files.length,
        });

        groups.push({
          id: cell,
          label: `${generate.toUpperCase()} · ${env}`,
          target: generate,
          env,
          variants: measured,
        });
      }
    }
  }

  return {
    id: "compile",
    label: "SFC compile (unique contents)",
    files: files.length,
    bytes,
    groups,
    methodology: [
      "Matrix: generate ∈ {client, server} × env ∈ {production, development}.",
      "Within each pinned compiler-version class, every tool receives the same in-memory Svelte SFC corpus. Real-world eligibility is decided independently by that class's official reference and per-row file counts remain visible.",
      `Official: svelte/compiler compile() with runes=${runesLabel}. Generated fixtures force runes; real-world sources use compiler auto-detection.`,
      "MrWaip: @mrwaip/svelte-rs native compiler through its compatible compile() API.",
      "rsvelte: WASM (@rsvelte/compiler) and NAPI (@rsvelte/vite-plugin-svelte-native) paths are separate rows.",
      "Verter has no public Svelte runtime compile API in the installed package, so it is reported skipped; its different runtime-render batching API is not substituted.",
      "Every compiler must return one non-empty code artifact per input file, emit the expected Svelte client/server runtime import, and remove Svelte runes; aggregate byte totals alone are not accepted as proof of coverage.",
      "Carrier modules that omit the requested Svelte runtime import, or leave runes uncompiled, remain measured but unranked.",
      "Tool order is rotated on every warmup and measured run. A row is unranked unless the measured runs cover every active execution position; ranking metric is the median of warmed runs.",
    ],
  };
}
