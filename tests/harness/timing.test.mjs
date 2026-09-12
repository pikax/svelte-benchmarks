import assert from "node:assert/strict";
import { test } from "./helpers.mjs";
import {
  appendRunBudgetDisclosures,
  effectiveWarmups,
  GATE_IS_THE_WARM_PASS,
  measureVariants,
  NOISE_CV_LIMIT_PCT,
  pairedOrder,
} from "../../scripts/lib/timing.mjs";
import { renderSurfaceMarkdown, NOISE_CV_MIN_SAMPLES } from "../../scripts/lib/report.mjs";

test("mandatory warmup: --warmups 0 is clamped to 1", () => {
  assert.equal(effectiveWarmups(0), 1);
  assert.equal(effectiveWarmups(1), 1);
  assert.equal(effectiveWarmups(3), 3);
});

test("GATE_IS_THE_WARM_PASS sentinel survives the clamp", () => {
  // The sentinel must never be expressible as a number: numeric 0 is CLI
  // --warmups 0 and MUST clamp to 1.
  assert.equal(typeof GATE_IS_THE_WARM_PASS, "string");
  assert.ok(Number.isNaN(Number(GATE_IS_THE_WARM_PASS)));
});

test("sentinel-gated surfaces run zero numeric warmup passes", async () => {
  let warmups = 0;
  let measures = 0;
  await measureVariants(
    [{ id: "a", label: "a", measure: (pass) => (pass.phase === "warmup" ? warmups++ : measures++) }],
    { runs: 1, warmups: GATE_IS_THE_WARM_PASS, fileCount: 1 },
  );
  assert.equal(warmups, 0);
  assert.equal(measures, 1);
});

test("paired order swaps a two-item table on odd iterations", () => {
  assert.deepEqual(pairedOrder(["a", "b"], 0), ["a", "b"]);
  assert.deepEqual(pairedOrder(["a", "b"], 1), ["b", "a"]);
  assert.deepEqual(pairedOrder(["a", "b"], 2), ["b", "a"]);
  assert.deepEqual(pairedOrder(["a", "b"], 3), ["a", "b"]);
});

test("three-sample rows above the CV ceiling serialize unranked", async () => {
  let call = 0;
  const samples = [1, 1, 10, 100];
  const variants = await measureVariants(
    [{ id: "candidate", label: "candidate", measure: () => samples[call++] }],
    { runs: 3, warmups: 1, fileCount: 1 },
  );
  assert.equal(variants[0].status, "unranked");
  assert.equal(variants[0].throughput, "n/a");
  assert.match(variants[0].notes, /TOO NOISY TO RANK/);
  const markdown = renderSurfaceMarkdown({
    id: "test",
    label: "Test",
    files: 1,
    bytes: 1,
    variants,
    methodology: [],
  });
  assert.match(markdown, /TOO NOISY TO RANK — CV/);
  assert.match(markdown, /not ranked/);
});

test("two-sample noisy rows stay flagged but ranked", () => {
  const markdown = renderSurfaceMarkdown({
    id: "test",
    label: "Test",
    files: 1,
    bytes: 1,
    variants: [
      {
        id: "row",
        label: "row",
        status: "ok",
        medianMs: 10,
        minMs: 1,
        stddevMs: 9,
        cvPct: NOISE_CV_LIMIT_PCT + 1,
        runs: [1, 100],
        throughput: "100 files/s",
      },
    ],
    methodology: [],
  });
  assert.doesNotMatch(markdown, /TOO NOISY TO RANK — CV/);
  assert.match(markdown, /\*\*10\.0 ms\*\*/);
});

test("raw samples are preserved on every measured row", async () => {
  const variants = await measureVariants(
    [{ id: "a", label: "a", measure: () => 5 }],
    { runs: 3, warmups: 1, fileCount: 1 },
  );
  assert.deepEqual(variants[0].runs, [5, 5, 5]);
});

test("rssBytes in metas aggregate to rssMaxMb on the row", async () => {
  const variants = await measureVariants(
    [
      {
        id: "a",
        label: "a",
        measure: () => ({ ms: 3, artifact: 10, rssBytes: 50 * 1024 * 1024 }),
      },
    ],
    { runs: 3, warmups: 1, fileCount: 1 },
  );
  assert.equal(variants[0].rssMaxMb, 50);
});

test("baseline flag serializes onto rows", async () => {
  const variants = await measureVariants(
    [
      { id: "ref", label: "ref", baseline: true, baselineLabel: "Svelte", measure: () => 1 },
      { id: "cand", label: "cand", measure: () => 2 },
    ],
    { runs: 2, warmups: 1, fileCount: 1 },
  );
  assert.equal(variants[0].baseline, true);
  assert.equal(variants[0].baselineLabel, "Svelte");
  assert.equal(variants[1].baseline, false);
});

test("incomplete execution-position coverage never ranks", async () => {
  const rows = await measureVariants(
    ["a", "b", "c"].map((id) => ({ id, label: id, measure: () => 1 })),
    { runs: 2, warmups: 1, fileCount: 99 },
  );
  assert.ok(rows.every((row) => row.status === "unranked"));
  assert.ok(rows.every((row) => /INCOMPLETE ORDER COVERAGE/.test(row.notes)));
});

test("balancedShortRuns never bypass the order-coverage rule", async () => {
  // Paired scheduling changes the ORDER, not the coverage contract: with
  // fewer runs than variants the rows still unrank.
  const rows = await measureVariants(
    ["a", "b", "c"].map((id) => ({ id, label: id, measure: () => 1 })),
    { runs: 2, warmups: GATE_IS_THE_WARM_PASS, fileCount: 99, balancedShortRuns: true },
  );
  assert.ok(rows.every((row) => row.status === "unranked"));
});

test("failed variants keep their identity and error, never rank", async () => {
  const rows = await measureVariants(
    [
      { id: "boom", label: "boom", comparisonClass: "cls", measure: () => { throw new Error("native panic"); } },
    ],
    { runs: 1, warmups: 1, fileCount: 1 },
  );
  assert.equal(rows[0].status, "error");
  assert.match(rows[0].error, /native panic/);
  assert.equal(rows[0].comparisonClass, "cls");
});

test("run-budget disclosures are per-row, not per-surface", () => {
  const surface = {
    variants: [
      { id: "one", status: "ok", runs: [1], notes: "", medianMs: 1 },
      { id: "five", status: "ok", runs: [1, 2, 3, 4, 5], notes: "", medianMs: 1 },
    ],
    methodology: [],
  };
  appendRunBudgetDisclosures(surface, { surfaceId: "t", runs: 2, requested: 5 });
  assert.match(surface.variants[0].notes, /SINGLE MEASURED RUN/);
  assert.doesNotMatch(surface.variants[1].notes, /SINGLE MEASURED RUN/);
  assert.ok(surface.methodology.some((m) => /capped at 2/.test(m)));
});

