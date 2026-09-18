import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "./helpers.mjs";
import { censusVerdict } from "../../scripts/lib/surfaces/vite.mjs";

const rootDir = join(import.meta.dirname, "../..");

test("Vite integration surfaces share one stack and fail closed on coverage", () => {
  const exact = censusVerdict(
    new Map([
      ["A.svelte", { bytes: 10, runtime: true }],
      ["B.svelte", { bytes: 10, runtime: true }],
    ]),
    ["A.svelte", "B.svelte"],
  );
  assert.deepEqual(exact, {
    exact: true,
    runtime: true,
    covered: 2,
    expected: 2,
  });
  assert.equal(
    censusVerdict(new Map([["A.svelte", { bytes: 10, runtime: true }]]), [
      "A.svelte",
      "B.svelte",
    ]).exact,
    false,
  );

  // The official and rsvelte plugins must stay on ONE shared Vite stack —
  // a cross-version ratio measures Vite, not the plugin. Versions are pinned
  // deliberately; changing them re-runs the bundle/hmr surfaces.
  const packageJson = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf8"));
  assert.equal(packageJson.dependencies.vite, "8.3.0");
  assert.equal(
    packageJson.dependencies["@sveltejs/vite-plugin-svelte"],
    "7.3.0",
  );
  assert.equal(
    packageJson.dependencies["@rsvelte/vite-plugin-svelte"],
    "0.5.3",
  );
  assert.match(packageJson.scripts["bench:bundle"], /--surfaces bundle/);
  assert.match(packageJson.scripts["bench:hmr"], /--surfaces hmr/);

  const surface = readFileSync(join(rootDir, "scripts/lib/surfaces/vite.mjs"), "utf8");
  assert.match(
    surface,
    /incremental transform did not contain the changed marker/,
  );
  assert.match(surface, /not labeled an end-to-end HMR round trip/);
  assert.doesNotMatch(surface, /@vitejs\/plugin-vue|\.vue\b/);
});

test("the rsvelte wasm loader tolerates renamed binaries", async () => {
  const { loadRsvelteWasm } = await import("../../scripts/lib/rsvelte-wasm.mjs");
  const mod = await loadRsvelteWasm();
  assert.equal(typeof mod.compile, "function");
});
