import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "./helpers.mjs";
import {
  attachMemoryToBench,
  benchIsPublishable,
  GROUPS,
  loadPublished,
  publishablePlatform,
} from "../../scripts/lib/docs/data.mjs";
import { publishCiResults } from "../../scripts/publish-ci-results.mjs";
import { chartFileName, barChartSvg } from "../../scripts/lib/chart-svg.mjs";
import { updateReadme } from "../../scripts/lib/docs/readme.mjs";

test("platform guard: only Linux snapshots are publishable", () => {
  assert.equal(publishablePlatform("linux"), true);
  assert.equal(publishablePlatform("Linux"), true);
  assert.equal(publishablePlatform("win32"), false);
  assert.equal(publishablePlatform("darwin"), false);
  assert.equal(publishablePlatform("win32", { PUBLISH_ANY_PLATFORM: "1" }), true);
  assert.equal(
    benchIsPublishable({ runner: { platform: "linux" } }),
    true,
  );
  assert.equal(
    benchIsPublishable({ runner: { platform: "linux" }, commit: { dirty: true } }),
    false,
    "a dirty-worktree run is never publishable as reproducible",
  );
});

test("a win32-only repository yields no primary bench", () => {
  const root = mkdtempSync(join(tmpdir(), "svelte-bench-guard-"));
  try {
    mkdirSync(join(root, "results", "benchmarks"), { recursive: true });
    writeFileSync(
      join(root, "results", "benchmarks", "bench-Windows-200-local.json"),
      JSON.stringify({
        generatedAt: "2026-09-12T00:00:00Z",
        runner: { platform: "win32" },
        fileCount: 200,
        surfaces: [],
      }),
    );
    const model = loadPublished(root, {});
    assert.equal(model.bench, null);
    assert.equal(model.benches.length, 1);
    // With --include-local a root-level (run-local) copy becomes visible as
    // the LOCAL fallback primary.
    writeFileSync(
      join(root, "results", "bench-win32-200.json"),
      JSON.stringify({
        generatedAt: "2026-09-12T00:00:00Z",
        runner: { platform: "win32" },
        fileCount: 200,
        surfaces: [],
      }),
    );
    const localModel = loadPublished(root, {}, { includeLocal: true });
    assert.ok(localModel.bench?.local === true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the repeated-input study never becomes the ranking bench", () => {
  const root = mkdtempSync(join(tmpdir(), "svelte-bench-rep-"));
  try {
    mkdirSync(join(root, "results", "benchmarks"), { recursive: true });
    writeFileSync(
      join(root, "results", "benchmarks", "bench-Linux-200-repeated-cache-demo.json"),
      JSON.stringify({ generatedAt: "2026-09-12T00:00:00Z", runner: { platform: "linux" }, fileCount: 200, surfaces: [] }),
    );
    const model = loadPublished(root, {});
    assert.equal(model.bench, null);
    assert.ok(model.repeated);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("partial publication preserves the inactive side", () => {
  const root = mkdtempSync(join(tmpdir(), "svelte-bench-pub-"));
  try {
    const benchmarks = join(root, "results", "benchmarks");
    const realWorld = join(root, "results", "real_world");
    mkdirSync(benchmarks, { recursive: true });
    mkdirSync(realWorld, { recursive: true });
    writeFileSync(
      join(benchmarks, "bench-Linux-200-bench.json"),
      JSON.stringify({ ok: true }),
    );
    writeFileSync(
      join(realWorld, "real-world-Linux-smui.json"),
      JSON.stringify({ ok: true }),
    );
    const from = join(root, "dl");
    mkdirSync(from, { recursive: true });
    writeFileSync(join(from, "bench-Linux-200-bench.json"), JSON.stringify({ ok: true, fresh: true }));

    // Publishing ONLY the bench side must leave real_world untouched.
    publishCiResults({ fromDir: from, root, scope: "bench" });
    assert.ok(existsSync(join(realWorld, "real-world-Linux-smui.json")));
    const benchData = JSON.parse(
      readFileSync(join(benchmarks, "bench-Linux-200-bench.json"), "utf8"),
    );
    assert.equal(benchData.fresh, true, "the new snapshot replaced the old one");
    // Non-Linux artifacts are never published.
    writeFileSync(join(from, "bench-win32-200-full.json"), JSON.stringify({}));
    publishCiResults({ fromDir: from, root, scope: "bench" });
    assert.ok(!existsSync(join(benchmarks, "bench-win32-200-full.json")));
    // Markdown leaves stay run-local.
    writeFileSync(join(from, "bench-Linux-200-bench.md"), "# local");
    publishCiResults({ fromDir: from, root, scope: "bench" });
    assert.ok(!existsSync(join(benchmarks, "bench-Linux-200-bench.md")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("chart filenames are deterministic and collision-safe", () => {
  const a = "compiler-bench-linux-200-bench-compile-client-production-sourcemap-off";
  const b = a + "-x";
  const fa = chartFileName(a);
  const fb = chartFileName(b);
  assert.ok(fa.length <= 72 || /-[a-z0-9]{7}$/.test(fa));
  assert.notEqual(fa, fb, "long sibling names must not overwrite each other");
  assert.equal(chartFileName("Simple"), "simple");
});

test("svg charts render both themes with fixed fills (no media queries)", () => {
  const bars = [
    { label: "tool a", value: 10 },
    { label: "tool b", value: 20, value2: 25 },
    { label: "tool c", value: 5, unranked: true },
  ];
  for (const theme of ["light", "dark"]) {
    const svg = barChartSvg({ title: "T", bars, theme });
    assert.ok(svg.startsWith("<svg"));
    assert.ok(svg.includes('role="img"'));
    assert.ok(svg.includes("CDATA"), "system font stack via CDATA");
    assert.ok(!svg.includes("@media"), "Safari cannot be trusted with media queries inside <img>");
    assert.ok(!svg.includes("prefers-color-scheme"));
  }
});

test("readme splicing only touches marker bodies", () => {
  const before = `# Title

hand-written prose stays

<!-- svelte-bench: begin:RUN_META -->
old
<!-- svelte-bench: end:RUN_META -->

more prose
`;
  const { text, changed } = updateReadme(before, {}, { chartsDir: "/tmp", groups: GROUPS });
  assert.equal(changed, false, "no model input → README untouched");
  const model = {
    bench: {
      name: "bench-Linux-200-bench.json",
      data: {
        generatedAt: "2026-09-12T00:00:00Z",
        fileCount: 200,
        settings: { runs: 5, warmups: 1 },
        runner: { label: "Linux", platform: "linux", arch: "x64", cpuCount: 8, cpuModel: "cpu", totalmem: 16 * 1024 ** 3, node: "v26" },
        commit: { sha: "abcdef1234567890", repository: "pikax/svelte-benchmarks" },
        surfaces: [],
      },
    },
    benches: [],
    realWorld: [],
  };
  const second = updateReadme(before, model, { chartsDir: "/tmp", groups: GROUPS });
  assert.equal(second.changed, true);
  assert.match(second.text, /hand-written prose stays/);
  assert.match(second.text, /bench-Linux-200-bench\.json/);
  assert.match(second.text, /abcdef1/);
});

test("memory probe rows attach Peak RSS onto bench variants", () => {
  const bench = {
    runner: { platform: "linux" },
    surfaces: [
      {
        id: "compile",
        groups: [
          {
            variants: [
              { id: "svelte-official-1t-client-prod", label: "official", package: "svelte" },
              { id: "mrwaip-svelte-rs-client-prod", label: "mrwaip", package: "@mrwaip/svelte-rs" },
            ],
          },
        ],
      },
    ],
  };
  const memory = {
    runner: { platform: "linux" },
    rows: [
      {
        surface: "compile",
        package: "svelte",
        status: "ok",
        samples: [{ peakRssDeltaMb: 42.5, peakRssMb: 80 }],
      },
      {
        surface: "compile",
        package: "@mrwaip/svelte-rs",
        status: "ok",
        samples: [{ peakRssDeltaMb: 12.5, peakRssMb: 30 }],
      },
    ],
  };
  attachMemoryToBench(bench, memory);
  const variants = bench.surfaces[0].groups[0].variants;
  assert.equal(variants[0].rssMaxMb, 80);
  assert.equal(variants[0].rssSource, "memory-probe");
  assert.equal(variants[1].rssMaxMb, 30);
});

test("docs groups stay in sync with the surface registry", () => {
  const bench = readFileSync(join(import.meta.dirname, "../../scripts/bench.mjs"), "utf8");
  for (const group of GROUPS) {
    for (const surfaceId of group.benchSurfaces ?? []) {
      assert.match(
        bench,
        new RegExp(`\\b${surfaceId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`),
        `surface ${surfaceId} of group ${group.id} must exist in bench.mjs`,
      );
    }
  }
});
