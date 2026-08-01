import { createRequire } from "node:module";
import ts from "typescript";
import { collectSvelteFiles, readSources, totalBytes } from "../fixtures.mjs";
import { measureVariants, timedSync } from "../timing.mjs";

const require = createRequire(import.meta.url);

function optionsFor(file) {
  return {
    filename: file.filename,
    isTsFile: /<script\b[^>]*\blang=["']ts["']/.test(file.source),
    mode: "ts",
    version: "5",
  };
}

function normalizedTsx(code) {
  const source = ts.createSourceFile(
    "projection.tsx",
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  if (source.parseDiagnostics.length > 0) {
    throw new Error(
      `invalid TSX: ${source.parseDiagnostics[0]?.messageText ?? "parse error"}`,
    );
  }
  return ts.createPrinter({ removeComments: false }).printFile(source);
}

function gateProjection(transform, sources, reference = null) {
  try {
    for (const file of sources) {
      const output = transform(file.source, optionsFor(file));
      const code = output?.code ?? "";
      if (!code || !code.includes("__sveltets_")) {
        return {
          ok: false,
          detail: `${file.filename} did not emit a Svelte TSX projection`,
        };
      }
      const normalized = normalizedTsx(code);
      if (reference) {
        const expected = reference(file.source, optionsFor(file));
        if (normalized !== normalizedTsx(expected?.code ?? "")) {
          return {
            ok: false,
            detail: `${file.filename} differs structurally from official svelte2tsx output`,
          };
        }
      }
    }
    return {
      ok: true,
      detail: `${sources.length}/${sources.length} valid TSX outputs`,
    };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

function runVerterProjection(VerterHost, sources, { validate = false } = {}) {
  const host = new VerterHost({ analysisLevel: "full" });
  try {
    let artifact = 0;
    for (const file of sources) {
      const id = file.path.replaceAll("\\", "/");
      host.upsert({
        canonicalId: id,
        inputId: id,
        source: Buffer.from(file.source),
        fileKind: "svelte",
      });
      if (host.ensureIdeCompiled(id) !== true) {
        throw new Error(`${file.filename} did not compile an IDE projection`);
      }
      const output = host.getIde(id);
      const code = output?.code ?? "";
      if (!code || !code.includes("@verter/svelte-jsx")) {
        throw new Error(
          `${file.filename} did not emit a Verter Svelte IDE projection`,
        );
      }
      const generatedId = /Comp(\d{5})\.svelte$/i.exec(file.filename)?.[1];
      if (generatedId && !code.includes(generatedId)) {
        throw new Error(
          `${file.filename} lost unique fixture marker ${generatedId}`,
        );
      }
      if (validate) normalizedTsx(code);
      artifact += code.length;
    }
    return artifact;
  } finally {
    host.close?.();
  }
}

function gateVerterProjection(VerterHost, sources) {
  try {
    const artifact = runVerterProjection(VerterHost, sources, {
      validate: true,
    });
    return {
      ok: artifact > 0,
      detail: `${sources.length}/${sources.length} valid Svelte IDE projections`,
    };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function runProjectionSurface(fixtureDir, options) {
  const files = collectSvelteFiles(fixtureDir, options.fileLimit);
  const sources = readSources(fixtureDir, files);
  const bytes = totalBytes(fixtureDir, files);

  let official;
  let rsvelte;
  let verter;
  try {
    official = await import("svelte2tsx");
  } catch (error) {
    official = {
      error: error instanceof Error ? error.message : String(error),
    };
  }
  try {
    rsvelte = await import("@rsvelte/svelte2tsx");
    if (typeof rsvelte.initialize === "function") await rsvelte.initialize();
  } catch (error) {
    rsvelte = { error: error instanceof Error ? error.message : String(error) };
  }
  try {
    verter = require("@verter/native");
  } catch (error) {
    verter = { error: error instanceof Error ? error.message : String(error) };
  }

  const officialTransform = official?.svelte2tsx ?? official?.default;
  const rsvelteTransform = rsvelte?.svelte2tsx ?? rsvelte?.default;
  const variants = [];

  if (typeof officialTransform === "function") {
    const gate = gateProjection(officialTransform, sources);
    variants.push({
      id: "svelte2tsx",
      label: "svelte2tsx",
      package: "svelte2tsx",
      comparisonClass: "svelte2tsx-compatible",
      threading: "1t",
      invocation: "in-process",
      artifactLabel: "TSX bytes",
      unranked: !gate.ok,
      notes: `Official svelte2tsx, Svelte 5 TS projection | gate: ${gate.ok ? "✓" : "✗"} ${gate.detail}`,
      measure: async () => {
        let artifact = 0;
        const { ms } = timedSync(() => {
          for (const file of sources) {
            const output = officialTransform(file.source, optionsFor(file));
            artifact += output.code.length;
          }
        });
        return { ms, artifact };
      },
    });
  } else {
    variants.push({
      id: "svelte2tsx",
      label: "svelte2tsx",
      package: "svelte2tsx",
      skip: true,
      notes: official?.error ?? "svelte2tsx export not found",
    });
  }

  if (
    typeof rsvelteTransform === "function" &&
    typeof officialTransform === "function"
  ) {
    const gate = gateProjection(rsvelteTransform, sources, officialTransform);
    variants.push({
      id: "rsvelte-svelte2tsx",
      label: "@rsvelte/svelte2tsx (Wasm)",
      package: "@rsvelte/svelte2tsx",
      comparisonClass: "svelte2tsx-compatible",
      threading: "1t",
      invocation: "in-process",
      artifactLabel: "TSX bytes",
      unranked: !gate.ok,
      notes: `Rust/Wasm drop-in; TypeScript-printer structural parity against official output | gate: ${gate.ok ? "✓" : "✗"} ${gate.detail}`,
      measure: async () => {
        let artifact = 0;
        const { ms } = timedSync(() => {
          for (const file of sources) {
            const output = rsvelteTransform(file.source, optionsFor(file));
            artifact += output.code.length;
          }
        });
        return { ms, artifact };
      },
    });
  } else {
    variants.push({
      id: "rsvelte-svelte2tsx",
      label: "@rsvelte/svelte2tsx",
      package: "@rsvelte/svelte2tsx",
      skip: true,
      notes:
        rsvelte?.error ??
        (typeof officialTransform !== "function"
          ? "official reference unavailable; parity gate cannot run"
          : "svelte2tsx export not found"),
    });
  }

  if (typeof verter?.VerterHost === "function") {
    const gate = gateVerterProjection(verter.VerterHost, sources);
    variants.push({
      id: "verter-ide-projection",
      label: "Verter IDE projection",
      package: "@verter/native",
      comparisonClass: "verter-ide-projection",
      threading: "1t",
      invocation: "in-process",
      artifactLabel: "Projection bytes",
      unranked: !gate.ok,
      notes: `Native ensureIdeCompiled/getIde Svelte path; separate class because this is Verter's IDE carrier, not a svelte2tsx-compatible schema | gate: ${gate.ok ? "✓" : "✗"} ${gate.detail}`,
      measure: async () => {
        let artifact = 0;
        const { ms } = timedSync(() => {
          artifact = runVerterProjection(verter.VerterHost, sources);
        });
        return { ms, artifact };
      },
    });
  } else {
    variants.push({
      id: "verter-ide-projection",
      label: "Verter IDE projection",
      package: "@verter/native",
      comparisonClass: "verter-ide-projection",
      skip: true,
      notes: verter?.error ?? "VerterHost API unavailable",
    });
  }

  return {
    id: "projection",
    label: "Svelte TypeScript projection",
    files: files.length,
    bytes,
    variants: await measureVariants(variants, {
      runs: options.runs,
      warmups: options.warmups,
      fileCount: files.length,
    }),
    methodology: [
      "This is the type-analysis projection used by Svelte-aware TypeScript tooling; it is not runtime compilation or component documentation.",
      "The svelte2tsx-compatible rows use the synchronous in-process API with identical Svelte 5 options and file order.",
      "Every output must parse as TSX and contain tool-specific Svelte projection helpers.",
      "The rsvelte row must match official output after TypeScript parses and reprints both outputs, ignoring formatting-only whitespace while retaining syntax and comments.",
      "Verter's ensureIdeCompiled/getIde output is a genuine Svelte IDE projection, but its carrier and helper contract differ from svelte2tsx; it is therefore measured in a separate comparison class.",
    ],
  };
}
