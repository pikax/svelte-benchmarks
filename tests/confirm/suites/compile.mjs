/** Compile correctness: per-implementation server render + validity matrix. */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import { render } from "svelte/server";
import { createSuite } from "../lib/harness.mjs";
import { runCompileValidityChildren } from "../../../scripts/lib/compile-validity-gates.mjs";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function outputParts(raw) {
  const result = typeof raw === "string" ? JSON.parse(raw) : raw;
  return {
    js:
      typeof result?.js === "string"
        ? result.js
        : (result?.js?.code ?? result?.code ?? ""),
    css:
      typeof result?.css === "string" ? result.css : (result?.css?.code ?? ""),
  };
}

export async function runCompileSuite() {
  const suite = createSuite("compile");
  const source = `<script>
  let { name = 'World' } = $props();
  let count = $state(2);
</script>
<h1 class="marker-31415">{name}:{count * 2}</h1>
<style>.marker-31415 { color: red; }</style>
`;
  const options = {
    filename: "Confirm31415.svelte",
    generate: "server",
    dev: false,
    css: "external",
    runes: true,
  };
  const official = await import("svelte/compiler");
  const mrwaip = await import("@mrwaip/svelte-rs/compiler");
  const wasm = await import("@rsvelte/compiler");
  const wasmPackage = require.resolve("@rsvelte/compiler/package.json", {
    paths: [rootDir],
  });
  const wasmBytes = readFileSync(
    join(dirname(wasmPackage), "rsvelte_lint_bg.wasm"),
  );
  if (typeof wasm.initSync === "function") wasm.initSync({ module: wasmBytes });
  else await wasm.default({ module: wasmBytes });
  const native = require("@rsvelte/vite-plugin-svelte-native");
  const implementations = [
    ["svelte", official.compile],
    ["svelte-rs", mrwaip.compile],
    ["rsvelte-wasm", wasm.compile],
    ["rsvelte-native", native.compileSync ?? native.compile],
  ];
  const compiledDir = join(rootDir, "work", "confirm", "compiled");
  rmSync(compiledDir, { recursive: true, force: true });
  mkdirSync(compiledDir, { recursive: true });

  for (const [tool, compile] of implementations) {
    await suite.run("server-render", tool, async () => {
      assert.equal(typeof compile, "function", "compile API unavailable");
      const production = outputParts(await compile(source, options));
      const development = outputParts(
        await compile(source, { ...options, dev: true }),
      );
      assert.match(production.js, /svelte\/internal\/server/);
      assert.match(production.css, /marker-31415/);
      assert.doesNotMatch(production.js, /\$state\s*\(/);
      assert.notEqual(
        `${production.js}\n${production.css}`,
        `${development.js}\n${development.css}`,
        "dev option had no observable effect",
      );
      const parsed = ts.createSourceFile(
        `${tool}.mjs`,
        production.js,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.JS,
      );
      assert.equal(parsed.parseDiagnostics.length, 0, "invalid JavaScript");
      const modulePath = join(compiledDir, `${tool}.mjs`);
      writeFileSync(modulePath, production.js);
      const component = await import(
        `${pathToFileURL(modulePath).href}?confirm=${Date.now()}`
      );
      const rendered = await render(component.default, {
        props: { name: "Ada" },
      });
      assert.match(rendered.html ?? rendered.body ?? "", />Ada:4<\/h1>/);
    });
  }
  suite.skip(
    "compile",
    "server-render",
    "verter",
    "No public Svelte runtime compile API; no proxy workload is accepted.",
  );

  // The full runtime semantic plant matrix (the same suite that gates the
  // benchmark rows) as confirmation evidence.
  for (const generate of ["client", "server"]) {
    const results = runCompileValidityChildren({ generate, env: "production" });
    for (const [entrypoint, payload] of Object.entries(results)) {
      suite.run(`validity-${generate}`, entrypoint, () => {
        assert.equal(
          payload.status,
          "PASS",
          `${payload.reason ?? ""} — first failures: ${(payload.results ?? [])
            .filter((r) => r.status === "FAIL")
            .slice(0, 3)
            .map((r) => `${r.id}: ${r.detail ?? ""}`)
            .join(" | ")}`,
        );
      });
    }
  }
  return suite.results;
}
