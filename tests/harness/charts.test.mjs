import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import { test } from "./helpers.mjs";
import { barChartSvg, colorForTool, TOOL_COLORS } from "../../scripts/lib/chart-svg.mjs";
import { groupCharts, compactTable, renderGroupDoc } from "../../scripts/lib/docs/render.mjs";
import { GROUPS, loadPublished, sourcesForGroup } from "../../scripts/lib/docs/data.mjs";
import { renderSurfaceMarkdown } from "../../scripts/lib/report.mjs";
import { updateReadme } from "../../scripts/lib/docs/readme.mjs";
import { pruneCharts } from "../../scripts/generate-docs.mjs";

const compiler = GROUPS.find((g) => g.id === "compiler");
const variant = (label, options = {}) => ({ label, id: label, status: "ok", medianMs: 10, files: 20, ...options });
const surface = (id, variants) => ({ id, label: id, files: 20, bytes: 100, variants });
const snapshot = (name, surfaces, local = false) => ({ name, local, data: { generatedAt: "2026-09-12T10:00:00Z", runner: { platform: local ? "win32" : "linux" }, fileCount: 20, surfaces } });
const withTemp = (fn) => {
  const root = mkdtempSync(join(tmpdir(), "svelte-charts-"));
  try { fn(root); } finally { rmSync(root, { recursive: true, force: true }); }
};

test("chart pruning retains untouched pages and README assets during partial runs", () => withTemp((root) => {
  const charts = join(root, "docs", "charts");
  mkdirSync(charts, { recursive: true });
  for (const name of ["old", "current", "memory", "readme"]) for (const suffix of ["", "-dark"]) writeFileSync(join(charts, `${name}${suffix}.svg`), "<svg/>");
  writeFileSync(join(root, "docs", "compiler.md"), '<img src="charts/current.svg">');
  writeFileSync(join(root, "docs", "memory.md"), '<img src="charts/memory.svg">');
  writeFileSync(join(root, "README.md"), '<img src="docs/charts/readme.svg">');
  writeFileSync(join(charts, "keep.txt"), "not a chart");
  pruneCharts(root);
  assert.equal(existsSync(join(charts, "old.svg")), false);
  assert.equal(existsSync(join(charts, "old-dark.svg")), false);
  for (const name of ["current", "memory", "readme"]) assert.ok(existsSync(join(charts, `${name}-dark.svg`)));
  assert.ok(existsSync(join(charts, "keep.txt")));
}));

test("charts partition repeated compiler names by group and compatibility class", () => {
  const compile = { ...surface("compile", []), groups: ["client-prod", "server-prod"].map((id) => ({
    id, label: id, variants: [variant("official", { comparisonClass: "v1" }), variant("candidate", { comparisonClass: "v1" }), variant("official v2", { comparisonClass: "v2" })],
  })) };
  const charts = groupCharts(compiler, [compile], "bench-Linux");
  assert.equal(charts.length, 4);
  assert.equal(new Set(charts.map((c) => c.fileBase)).size, 4);
  for (const chart of charts) assert.equal(new Set(chart.variants.map((v) => v.comparisonClass)).size, 1);
});

test("SVG sorts by warm time and preserves fresh endpoints in both directions", () => {
  const svg = barChartSvg({ title: "compile", bars: [
    { label: "warm slower", value: 30, value2: 10 }, { label: "warm faster", value: 20, value2: 40 },
    { label: "failed", value: 1, unranked: true },
  ] });
  const doc = new JSDOM(svg, { contentType: "image/svg+xml" }).window.document;
  const rows = [...doc.querySelectorAll("g[data-tool]")];
  assert.deepEqual(rows.map((r) => r.getAttribute("data-tool")), ["warm faster", "warm slower", "failed"]);
  const widths = (row) => ["primary", "fresh"].map((series) => Number(row.querySelector(`[data-series="${series}"]`).getAttribute("width")));
  assert.ok(widths(rows[0])[0] < widths(rows[0])[1]);
  assert.ok(widths(rows[1])[0] > widths(rows[1])[1]);
  assert.match(rows[2].textContent, /Unranked/);
  assert.ok(rows[2].querySelector("pattern"));
});

test("tool colours are stable across pages and variant labels", () => {
  const first = colorForTool("Verter LSP");
  for (let i = 0; i < 30; i++) colorForTool(`other ${i}`);
  assert.equal(colorForTool("verter-tsc"), first);
  assert.equal(first, TOOL_COLORS.verter);
  assert.equal(colorForTool("@rsvelte/compiler"), colorForTool("Vite 7 × @rsvelte/vite-plugin-svelte"));
  assert.notEqual(colorForTool("@rsvelte/compiler"), colorForTool("svelte/compiler"));
});

test("skipped Verter stays visible without a fabricated zero bar", () => {
  const svg = barChartSvg({ title: "compile", bars: [{ label: "Verter native", status: "skipped", note: "No public runtime compile API" }] });
  assert.match(svg, /Verter native/);
  assert.match(svg, /Skipped/);
  assert.doesNotMatch(svg, /data-series/);
  assert.equal(barChartSvg({ title: "invalid", bars: [{ label: "bad", value: NaN }, { label: "bad", value: -2 }] }), "");
});

test("SVGs escape text and keep all text outside bars in explicit theme inks", () => {
  for (const theme of ["light", "dark"]) {
    const svg = barChartSvg({ theme, title: 'A < B & "C"', bars: [{ label: "Verter <native>", value: 0.01 }, { label: "long", value: 10000 }] });
    const doc = new JSDOM(svg, { contentType: "image/svg+xml" }).window.document;
    for (const el of doc.querySelectorAll("text")) {
      assert.ok(el.getAttribute("fill")?.startsWith("#"));
      assert.ok(Number(el.getAttribute("x")) >= 0 && Number(el.getAttribute("x")) <= 760);
    }
    assert.equal(doc.querySelector("title").textContent, 'A < B & "C"');
    assert.doesNotMatch(svg, /NaN|Infinity|@media/);
  }
});

test("singleton workload summaries have no fastest ratio and retain unavailable tools", () => {
  const table = compactTable([variant("Verter typeinfo"), variant("other", { status: "skipped", medianMs: undefined, notes: "API unavailable" })], { docHref: "docs/meta.md" });
  assert.doesNotMatch(table, /1\.00x/);
  assert.match(table, /other ⏭/);
  assert.match(table, /API unavailable/);
  assert.doesNotMatch(renderSurfaceMarkdown(surface("compile", [variant("official", { freshChildMedianMs: 20 })])), /1\.00x/);
});

test("full table error and skipped rows match the warm and fresh column counts", () => {
  for (const fresh of [false, true]) {
    const report = renderSurfaceMarkdown(surface("compile", [variant("official", { freshChildMedianMs: fresh ? 20 : undefined }), variant("Verter", { status: "skipped" }), variant("error", { status: "error" }), variant("informational", { medianMs: undefined })]));
    const rows = report.split("\n").filter((line) => line.startsWith("|"));
    assert.equal(new Set(rows.map((line) => line.split("|").length)).size, 1);
  }
});

test("README selects production groups, reuses docs charts, and keeps Verter visible", () => withTemp((root) => {
  const compile = { ...surface("compile", []), groups: ["production", "development"].map((env) => ({
    id: env, label: env, env, variants: [variant("svelte/compiler"), variant("Verter native", { status: "skipped", medianMs: undefined, notes: "No API" })],
  })) };
  const bench = snapshot("bench-Linux.json", [compile]);
  const model = { bench, benches: [bench], confirms: [], realWorld: [] };
  const chartsDir = join(root, "charts");
  const full = renderGroupDoc(compiler, model, { chartsDir }).content;
  const before = "<!-- svelte-bench: begin:BENCHMARK_RESULTS -->\nold\n<!-- svelte-bench: end:BENCHMARK_RESULTS -->";
  const readme = updateReadme(before, model, { chartsDir, groups: [compiler] }).text;
  assert.match(readme, /Verter native/);
  assert.doesNotMatch(readme, /development\.svg/);
  assert.match(readme, /<details><summary>Timing table/);
  for (const match of readme.matchAll(/src="docs\/charts\/([^"]+)"/g)) {
    assert.ok(full.includes(`charts/${match[1]}`));
    assert.ok(readFileSync(join(chartsDir, match[1]), "utf8").includes("Verter native"));
  }
}));

test("local primary is labelled once and never rendered again as a secondary run", () => withTemp((root) => {
  const group = GROUPS.find((g) => g.id === "format");
  const bench = snapshot("bench-local.json", [surface("format", [variant("Prettier")])], true);
  const model = { bench, benches: [bench], confirms: [], realWorld: [] };
  const doc = renderGroupDoc(group, model, { chartsDir: join(root, "charts") }).content;
  assert.equal((doc.match(/### format/g) ?? []).length, 1);
  assert.match(doc, /LOCAL RUN/);
  const before = "<!-- svelte-bench: begin:BENCHMARK_RESULTS -->\n<!-- svelte-bench: end:BENCHMARK_RESULTS -->";
  assert.doesNotMatch(updateReadme(before, model, { chartsDir: join(root, "charts"), groups: [group] }).text, /latest published \*\*Linux/);
}));

test("source selection uses newest published data per surface, before local data", () => withTemp((root) => {
  mkdirSync(join(root, "results", "benchmarks"), { recursive: true });
  const older = snapshot("bench-Linux-200.json", [surface("format", []), surface("lint", [])]);
  older.data.fileCount = 200;
  const newer = snapshot("bench-Linux-20.json", [surface("format", [])]);
  newer.data.generatedAt = "2026-09-13T00:00:00Z";
  for (const entry of [older, newer]) writeFileSync(join(root, "results", "benchmarks", entry.name), JSON.stringify(entry.data));
  const local = snapshot("bench-win32-500.json", [surface("format", [])], true);
  local.data.generatedAt = "2026-09-14T00:00:00Z";
  writeFileSync(join(root, "results", local.name), JSON.stringify(local.data));
  const model = loadPublished(root, {}, { includeLocal: true });
  assert.equal(model.bench.name, newer.name);
  assert.deepEqual(sourcesForGroup({ benchSurfaces: ["format", "lint"] }, model).map((s) => s.entry.name), [newer.name, older.name]);
}));
