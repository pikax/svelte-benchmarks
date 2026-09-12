import assert from "node:assert/strict";
import { test } from "./helpers.mjs";
import { singleSvelteReference } from "../../scripts/lib/docs/svelte-reference.mjs";
import { barsFromVariants } from "../../scripts/lib/docs/render.mjs";
import { variantClasses } from "../../scripts/lib/report.mjs";

test("historical reports use recorded Svelte versions without recycling retired-runtime samples", () => {
  const row = (id, pkg, comparisonClass) => ({
    id, label: id, package: pkg, comparisonClass, status: "ok", medianMs: 10,
    freshChildMedianMs: 20, rssMaxMb: 30, runs: [9, 10, 11], fileCount: 2,
  });
  const variants = [
    { ...row("stale official label", "svelte", "primary"), baseline: true },
    row("candidate", "@rsvelte/compiler", "primary"),
    row("retired official", "svelte-mrwaip-reference", "retired"),
    row("mrwaip", "@mrwaip/svelte-rs", "retired"),
    { ...row("Verter", "@verter/native", "experimental-svelte"), status: "unranked" },
  ];
  const snapshot = {
    versions: { svelte: "5.99.0", "svelte-mrwaip-reference": "5.1.0" },
    surfaces: [{ id: "compile", groups: [{ id: "client-prod", variants }],
      corpus: { configuredFiles: 3, measuredFiles: 3, excluded: 0,
        measuredFilesByClass: { primary: 2, retired: 3 }, excludedByClass: { primary: 1, retired: 0 },
        exclusionExamplesByClass: { primary: [{ file: "Rejected.svelte" }], retired: [] } },
      validation: { compileSemantics: { matrix: { client: { entrypoints: {
        "svelte-official": { status: "PASS" },
        "svelte-mrwaip-reference": { status: "PASS" },
        "mrwaip-svelte-rs": { status: "PASS" },
      } } } } },
    }],
    rows: variants.slice(0, 4).map((r) => ({ ...r, surface: "compile", samples: [{ peakRssMb: 30 }] })),
  };
  const original = structuredClone(snapshot);
  const view = singleSvelteReference(snapshot);
  assert.deepEqual(snapshot, original, "raw evidence must not be mutated");
  const surface = view.surfaces[0];
  const rows = surface.groups[0].variants;
  assert.equal(rows.length, 4);
  assert.equal(rows[0].label, "svelte/compiler 5.99.0", "use the recorded version, never the current install");
  assert.equal(rows[0].baselineLabel, "Svelte 5.99.0 (official)");
  assert.deepEqual(rows[0].runs, variants[0].runs);
  assert.deepEqual(variantClasses(rows).map((c) => c.variants.length).sort(), [1, 3]);
  assert.equal(rows[2].status, "skipped");
  for (const key of ["medianMs", "freshChildMedianMs", "rssMaxMb", "runs", "fileCount"]) assert.equal(rows[2][key], undefined);
  assert.match(rows[2].notes, /Awaiting rerun/);
  assert.equal(rows[3].status, "unranked", "Verter remains timed and unranked");
  assert.ok(barsFromVariants(rows).some((bar) => bar.label === "Verter"));
  assert.ok(!barsFromVariants(rows).some((bar) => bar.label === "mrwaip"));
  assert.equal(surface.corpus.measuredFiles, 2);
  assert.equal(surface.corpus.excluded, 1);
  assert.deepEqual(surface.corpus.exclusionExamples, [{ file: "Rejected.svelte" }]);
  assert.equal(surface.corpus.measuredFilesByClass, undefined);
  const gate = surface.validation.compileSemantics.matrix.client;
  assert.equal(gate.entrypoints["svelte-mrwaip-reference"], undefined);
  assert.equal(gate.entrypoints["mrwaip-svelte-rs"].status, "UNKNOWN");
  assert.equal(gate.status, "UNKNOWN");
  assert.equal(view.versions["svelte-mrwaip-reference"], undefined);
  assert.equal(view.rows.length, 3);
  assert.equal(view.rows[2].samples, undefined, "retired-reference memory is not attached to current timing rows");
  assert.deepEqual(singleSvelteReference(view), view, "the display policy must be idempotent");
});

test("current MrWaip results retain their measurements and runtime verdict", () => {
  const snapshot = { versions: { svelte: "5.99.0" }, surfaces: [{ id: "compile", groups: [{ variants: [
    { id: "official", label: "svelte/compiler 5.99.0", package: "svelte", comparisonClass: "svelte", status: "ok" },
    { id: "mrwaip", package: "@mrwaip/svelte-rs", comparisonClass: "svelte", status: "unranked", medianMs: 4, runs: [4] },
  ] }], validation: { compileSemantics: { matrix: { client: { entrypoints: { "mrwaip-svelte-rs": { status: "FAIL" } } } } } } }] };
  assert.deepEqual(singleSvelteReference(snapshot), snapshot);
});
