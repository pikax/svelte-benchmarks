import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "./helpers.mjs";
import {
  compileCellSalt,
  materializeMarkedSource,
  revisionToken,
  applyAdapterParity,
  buildCompileCellVariants,
} from "../../scripts/lib/surfaces/compile.mjs";
import { compileVerterBatch } from "../../scripts/lib/verter-compile.mjs";
import { measureVariants } from "../../scripts/lib/timing.mjs";
import { measureFreshChildVariants } from "../../scripts/lib/compile-fresh-runs.mjs";
import { applyCompileValidityGates } from "../../scripts/lib/compile-validity-gates.mjs";
import { COMPILE_VALIDITY_PLANTS, CSS_VALIDITY_PLANTS, COMPILE_VALIDITY_SUITE_HASH } from "../../scripts/lib/compile-validity-plants.mjs";
import { unknownCompileValidityResults } from "../../scripts/lib/compile-validity-plants.mjs";

const rootDir = join(import.meta.dirname, "../..");

test("Verter calls the published runtime-render API with raw inputs and explicit stateless options", () => {
  const source = '<script>let n = $state(0)</script><p>{n}</p>';
  const outputs = [{ code: "invalid Svelte output", errors: ["unsupported"] }];
  for (const generate of ["client", "server"]) {
    const host = { compileMany(files, options) {
      assert.deepEqual(files, [{ canonicalId: "src/Counter.svelte", source, requestedMode: "stateless" }]);
      assert.equal(options.target, "runtime-render");
      assert.equal(options.defaultMode, "stateless");
      assert.equal(options.compileProfile.ssr, generate === "server");
      assert.equal(options.compileProfile.isProduction, false);
      return outputs;
    } };
    assert.equal(compileVerterBatch(host, [{ filename: "src\\Counter.svelte", source }], { generate, dev: true }), outputs);
  }
});

test("installed Verter publishes warm/fresh diagnostic timings and invalid output stays unranked", async () => {
  const fixtureDir = mkdtempSync(join(tmpdir(), "svelte-verter-compile-"));
  try {
    writeFileSync(join(fixtureDir, "Counter.svelte"), '<script>let count = $state(0);</script><p>{count}</p>');
    const payload = { generate: "client", env: "production", fixtureDir, classes: [{ id: "svelte-5.56.8", files: ["Counter.svelte"] }] };
    const variants = await buildCompileCellVariants(payload);
    const verter = variants.find((v) => v.id.startsWith("verter-"));
    assert.equal(verter.skip, undefined);
    assert.equal(verter.unranked, true);
    const [row] = await measureVariants([verter], { runs: 2, warmups: 1, fileCount: 1, prepareAllBeforeTiming: true });
    assert.equal(row.status, "unranked");
    assert.equal(row.runs.length, 2);
    assert.ok(Number.isFinite(row.medianMs));
    assert.equal(row.throughput, "n/a");
    assert.match(row.notes, /output gate: FAIL/);
    assert.ok(row.metaSamples.every((m) => m.returnedCount === 1 && m.outputValidation.status === "FAIL"));
    assert.notEqual(row.metaSamples[0].inputSourceHash, row.metaSamples[1].inputSourceHash);
    const fresh = measureFreshChildVariants([verter], { runs: 1, payload }).byId[verter.id];
    assert.equal(fresh.freshChildError, undefined);
    assert.ok(Number.isFinite(fresh.freshChildMedianMs));
    assert.equal(fresh.freshChildMetaSamples[0].outputValidation.status, "FAIL");
    assert.notEqual(fresh.freshChildMetaSamples[0].inputSourceHash, row.metaSamples[0].inputSourceHash);
    Object.assign(row, fresh);
    applyAdapterParity([row]);
    assert.equal(row.status, "unranked");
    assert.match(row.notes, /3 distinct input revisions/);
  } finally {
    rmSync(fixtureDir, { recursive: true, force: true });
  }
});

test("revision tokens are fixed-width and unique per pass", () => {
  const salt = compileCellSalt("client-prod", "svelte-5.56.8");
  const warmup = revisionToken(salt, { phase: "warmup", iteration: 0 });
  const measure0 = revisionToken(salt, { phase: "measure", iteration: 0 });
  const measure1 = revisionToken(salt, { phase: "measure", iteration: 1 });
  const fresh = revisionToken(salt, { phase: "fresh-child", iteration: 0 });
  assert.notEqual(warmup, measure0);
  assert.notEqual(measure0, measure1);
  assert.notEqual(measure0, fresh);
  assert.equal(warmup.length, measure0.length);
  assert.equal(measure0.length, measure1.length);
  // Cell/class salts differ so classes cannot lend each other cache entries.
  assert.notEqual(
    compileCellSalt("client-prod", "svelte-5.56.8"),
    compileCellSalt("client-prod", "svelte-5.56.4"),
  );
  assert.notEqual(
    compileCellSalt("client-prod", "svelte-5.56.8"),
    compileCellSalt("server-prod", "svelte-5.56.8"),
  );
});

test("marked sources stay byte-count neutral across passes", () => {
  const source = `<script>\nlet { a } = $props();\n</script>\n\n<div class="x">{a}</div>\n`;
  const salt = "abcd1234";
  const a = materializeMarkedSource(source, revisionToken(salt, { phase: "measure", iteration: 0 }));
  const b = materializeMarkedSource(source, revisionToken(salt, { phase: "measure", iteration: 9 }));
  assert.equal(a.length, b.length);
  assert.match(a, /--svelte-bench-rev: abcd1234:m0000000000/);
  assert.match(b, /--svelte-bench-rev: abcd1234:m0000000009/);
  assert.match(a, /class="svelte-bench-rev"/);
});

test("the emitted CSS really carries the token (official compiler)", async () => {
  const { compile } = await import("svelte/compiler");
  const source = `<script>let { a } = $props();</script>\n\n<div class="x">{a}</div>\n`;
  const token = revisionToken("deadbeef", { phase: "measure", iteration: 3 });
  const marked = materializeMarkedSource(source, token);
  for (const generate of ["client", "server"]) {
    const out = compile(marked, {
      filename: "M.svelte",
      generate,
      dev: false,
      css: "external",
      runes: true,
    });
    const css = typeof out?.css === "string" ? out.css : (out?.css?.code ?? "");
    assert.ok(css.includes(token), `${generate} CSS must carry the pass token`);
  }
});

test("adapter parity unranks rows with duplicated input revisions", () => {
  const rows = [
    {
      id: "healthy",
      status: "ok",
      throughput: "10 files/s",
      notes: "",
      metaSamples: [{ inputSourceHash: "h1", inputCount: 2, inputBytes: 10 }],
      freshChildMetaSamples: [{ inputSourceHash: "h2", inputCount: 2, inputBytes: 10 }],
    },
    {
      id: "reused",
      status: "ok",
      throughput: "10 files/s",
      notes: "",
      metaSamples: [{ inputSourceHash: "same" }, { inputSourceHash: "same" }],
      freshChildMetaSamples: [{ inputSourceHash: "same" }],
    },
  ];
  applyAdapterParity(rows);
  assert.equal(rows[0].status, "ok");
  assert.match(rows[0].notes, /adapter parity/);
  assert.equal(rows[1].status, "unranked");
  assert.match(rows[1].notes, /ADAPTER PARITY FAILED/);
});

test("validity gates: missing verdict, FAIL, and source-map-on all unrank", () => {
  const matrix = {
    "client/production/source-map-off": {
      configuration: { generate: "client", env: "production", sourceMap: false },
      status: "FAIL",
      entrypoints: {
        "svelte-official": {
          status: "PASS",
          passed: 28,
          plantCount: 28,
          exactPath: "svelte/compiler compile()",
          results: [],
        },
        "mrwaip-svelte-rs": {
          status: "FAIL",
          passed: 3,
          plantCount: 28,
          exactPath: "@mrwaip/svelte-rs compile()",
          results: [{ id: "props-defaults-interpolation", status: "FAIL", phase: "plant", detail: "boom" }],
        },
      },
    },
  };
  const semantics = { matrix };
  const rows = [
    { id: "svelte-official-1t-client-prod", label: "official", status: "ok", throughput: "x", notes: "", baseline: true },
    { id: "mrwaip-svelte-rs-client-prod", label: "mrwaip", status: "ok", throughput: "x", notes: "", comparisonClass: "svelte-5.56.4", baseline: true },
    { id: "rsvelte-wasm-1t-client-prod", label: "wasm", status: "ok", throughput: "x", notes: "" },
    { id: "rsvelte-native-1t-client-prod", label: "native", status: "ok", throughput: "x", notes: "" },
    { id: "svelte-official-1t-client-prod-smon", label: "official sm", status: "ok", throughput: "x", notes: "", sourceMap: true },
  ];
  applyCompileValidityGates(rows, semantics, {
    generate: "client",
    env: "production",
    sourceMap: false,
  });
  // official PASSes with an affirmative note
  assert.match(rows[0].notes, /✓ runtime semantic validity/);
  // mrwaip FAILs its own plants AND is its class reference → class invalid
  assert.equal(rows[1].status, "unranked");
  assert.match(rows[1].notes, /RUNTIME SEMANTIC VALIDITY FAIL/);
  // wasm/native have NO verdict for their entrypoint → UNKNOWN, unranked
  assert.equal(rows[2].status, "unranked");
  assert.match(rows[2].notes, /RUNTIME SEMANTIC VALIDITY UNKNOWN/);
  assert.equal(rows[3].status, "unranked");
  // source-map-on rows unrank unconditionally (mapping validity unknown)
  applyCompileValidityGates([rows[4]], semantics, {
    generate: "client",
    env: "production",
    sourceMap: true,
  });
  assert.equal(rows[4].status, "unranked");
  assert.match(rows[4].notes, /SOURCE-MAP MAPPING VALIDITY UNKNOWN/);
});

test("a failed official reference unrankS every candidate in its class", () => {
  const semantics = {
    matrix: {
      "client/production/source-map-off": {
        configuration: { generate: "client", env: "production", sourceMap: false },
        status: "FAIL",
        entrypoints: {
          "svelte-official": { status: "FAIL", passed: 1, plantCount: 28, exactPath: "official", results: [] },
          "rsvelte-wasm": { status: "PASS", passed: 28, plantCount: 28, exactPath: "wasm", results: [] },
        },
      },
    },
  };
  const rows = [
    { id: "svelte-official-1t-client-prod", label: "official", status: "ok", throughput: "x", notes: "", baseline: true },
    { id: "rsvelte-wasm-1t-client-prod", label: "wasm", status: "ok", throughput: "x", notes: "" },
  ];
  applyCompileValidityGates(rows, semantics, {
    generate: "client",
    env: "production",
    sourceMap: false,
  });
  assert.equal(rows[0].status, "unranked");
  // The PASSING candidate is never promoted: the class reference failed.
  assert.equal(rows[1].status, "unranked");
  assert.match(rows[1].notes, /COMPARISON REFERENCE INVALID/);
});

test("the plant suite hash is stable and covers runtime + CSS plants", () => {
  assert.equal(COMPILE_VALIDITY_PLANTS.length + CSS_VALIDITY_PLANTS.length, 33);
  assert.match(COMPILE_VALIDITY_SUITE_HASH, /^[a-f0-9]{64}$/);
  // Unknown results keep per-plant visibility — never silently absent.
  const unknown = unknownCompileValidityResults("suite could not run");
  assert.equal(unknown.length, 33);
  assert.ok(unknown.every((r) => r.status === "UNKNOWN" && r.phase === "not-run"));
});

test("fresh-child runner wiring is fail-closed", () => {
  const runs = readFileSync(join(rootDir, "scripts/lib/compile-fresh-runs.mjs"), "utf8");
  assert.match(runs, /fresh-child-first-timed-row-workload/);
  assert.match(runs, /deterministic/i);
  const child = readFileSync(join(rootDir, "scripts/lib/compile-fresh-child.mjs"), "utf8");
  // The timer covers exactly one measure call; prepare is outside it.
  assert.match(child, /variant\.prepare\?\.\(pass\)/);
  assert.match(child, /performance\.now\(\)/);
  const surface = readFileSync(join(rootDir, "scripts/lib/surfaces/compile.mjs"), "utf8");
  assert.match(surface, /measureFreshChildVariants/);
  assert.match(surface, /prepareAllBeforeTiming: true/);
  assert.match(surface, /runCompileValidityMatrix/);
  // Warm stays primary; fresh child never replaces it.
  assert.match(surface, /never replaces the warm verdict/i);
});
