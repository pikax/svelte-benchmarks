/**
 * Per-surface docs page rendering. Markdown is generated from the JSON
 * snapshot; every page carries enough evidence to audit its ranking:
 * provenance, tool versions, raw samples (via the full tables), validation
 * verdicts, and per-class charts.
 */
import {
  chartFileName,
  chartTwin,
  formatDuration,
} from "../chart-svg.mjs";
import {
  renderSurfaceMarkdown,
  RANKING_RULES,
} from "../report.mjs";
import {
  confirmRowsForSuite,
  localRunBanner,
  runMetaLines,
  surfacesForGroup,
} from "./data.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const GENERATED_NOTE =
  "> This page is **generated** from committed JSON snapshots (`results/benchmarks/`, `results/real_world/`). Do not edit by hand — run `pnpm docs`.";

function compactTable(variants, { docHref }) {
  const measured = variants.filter(
    (v) => v.status === "ok" || v.status === "unranked",
  );
  if (measured.length === 0) return "_No measured rows._";
  const hasFresh = measured.some((v) => Number.isFinite(v.freshChildMedianMs));
  const sorted = [...measured].sort((a, b) => {
    if (a.status !== b.status) return a.status === "ok" ? -1 : 1;
    return (a.medianMs ?? Infinity) - (b.medianMs ?? Infinity);
  });
  const fastest = Math.min(
    ...measured.filter((v) => v.status === "ok" && Number.isFinite(v.medianMs)).map((v) => v.medianMs),
  );
  const lines = [];
  lines.push(
    hasFresh
      ? "| Tool | Fresh child | **Warm (primary)** | vs fastest | Peak RSS |"
      : "| Tool | **Median (primary)** | vs fastest | Peak RSS |",
  );
  lines.push(
    hasFresh ? "| --- | ---: | ---: | ---: | ---: |" : "| --- | ---: | ---: | ---: |",
  );
  for (const v of sorted) {
    const name = `${v.label}${v.status === "unranked" ? " ⚠" : v.status === "error" ? " ❌" : ""}`;
    const warm =
      v.status === "ok"
        ? `**${formatDuration(v.medianMs)}**`
        : `(${formatDuration(v.medianMs)})`;
    const ratio =
      v.status === "ok" && Number.isFinite(fastest) && fastest > 0
        ? `${(v.medianMs / fastest).toFixed(2)}x`
        : "not ranked";
    const rss = Number.isFinite(v.rssMaxMb) ? `${v.rssMaxMb} MB` : "n/a";
    lines.push(
      hasFresh
        ? `| ${name} | ${Number.isFinite(v.freshChildMedianMs) ? formatDuration(v.freshChildMedianMs) : "–"} | ${warm} | ${ratio} | ${rss} |`
        : `| ${name} | ${warm} | ${ratio} | ${rss} |`,
    );
  }
  if (measured.some((v) => v.status !== "ok")) {
    lines.push("");
    lines.push(
      `⚠ bracketed rows are measured but unranked — see [the full page](${docHref}) for why.`,
    );
  }
  return lines.join("\n");
}

/** One chart per comparison class — a chart never ranks across classes. */
export function groupCharts(group, surfaces) {
  const charts = [];
  for (const surface of surfaces) {
    const variants = surface.groups
      ? surface.groups.flatMap((g) => g.variants)
      : (surface.variants ?? []);
    const hasFresh = variants.some((v) => Number.isFinite(v.freshChildMedianMs));
    const bars = variants
      .filter((v) => v.status !== "skipped" && v.status !== "error")
      .map((v) => ({
        label: v.label,
        value: v.freshChildMedianMs ?? v.medianMs,
        value2: hasFresh ? v.medianMs : undefined,
        unranked: v.status === "unranked",
      }));
    if (bars.length === 0) continue;
    charts.push({
      surfaceId: surface.id,
      fileBase: chartFileName(`${group.id}-${surface.id}`),
      title: `${surface.label} — ${hasFresh ? "fresh child / warm (primary)" : "median (primary), lower is better"}`,
      bars,
    });
  }
  return charts;
}

function writeChartPair(chartsDir, chart) {
  const twin = chartTwin({
    title: chart.title,
    unit: "ms",
    bars: chart.bars,
    lowerIsBetter: true,
  });
  writeFileSync(join(chartsDir, `${chart.fileBase}.svg`), `${twin.light}\n`);
  writeFileSync(join(chartsDir, `${chart.fileBase}-dark.svg`), `${twin.dark}\n`);
}

function chartPicture(leaf) {
  return `<picture>\n  <source media="(prefers-color-scheme: dark)" srcset="charts/${leaf}-dark.svg">\n  <img src="charts/${leaf}.svg" alt="" width="760">\n</picture>`;
}

function confirmMatrix(model, suites) {
  const sections = [];
  for (const suite of suites) {
    const { rows, source } = confirmRowsForSuite(model, suite);
    if (rows.length === 0) continue;
    const lines = [`#### ${suite}`, ""];
    if (source?.local) lines.push(localRunBanner(source), "");
    lines.push("| Case | Tool | Status | Detail |");
    lines.push("| --- | --- | --- | --- |");
    for (const row of rows) {
      const detail = String(row.message ?? "")
        .replaceAll("|", "\\|")
        .replaceAll("\n", " ")
        .slice(0, 160);
      lines.push(
        `| ${row.caseId} | ${row.tool} | ${row.status === "pass" ? "✓ pass" : row.status === "fail" ? "✗ fail" : "○ skip"} | ${detail} |`,
      );
    }
    sections.push(lines.join("\n"));
  }
  return sections;
}

function memoryProbeTable(memoryData, surfaces) {
  const rows = (memoryData?.rows ?? []).filter((r) =>
    surfaces.includes(r.surface),
  );
  if (rows.length === 0) return null;
  const lines = ["| Surface | Tool | Peak RSS | Retained Δ | CPU ms | Status |", "| --- | --- | ---: | ---: | ---: | --- |"];
  for (const row of rows) {
    const peak = Math.max(
      0,
      ...(row.samples ?? []).map((s) => s.peakRssMb ?? s.peakRssDeltaMb ?? 0),
    );
    const retained =
      row.samples?.[(row.samples.length - 1) >> 1]?.retainedRssDeltaMb ?? null;
    const cpu = row.samples?.[(row.samples.length - 1) >> 1]?.cpuMs ?? null;
    lines.push(
      `| ${row.surface} | ${row.label} | ${peak ? peak.toFixed ? peak.toFixed(1) + " MB" : peak : "n/a"} | ${retained != null ? retained + " MB" : "n/a"} | ${cpu != null ? cpu : "n/a"} | ${row.status ?? "–"} |`,
    );
  }
  return lines.join("\n");
}

export function renderGroupDoc(group, model, { chartsDir, docsDir }) {
  const lines = [];
  lines.push(`# ${group.title}`);
  lines.push("");
  lines.push(GENERATED_NOTE);
  lines.push("");
  if (model.bench) {
    lines.push(...runMetaLines(model.bench.data, { sourceName: model.bench.name }));
    lines.push("");
  }

  if (group.memoryOnly) {
    if (!model.memory) {
      lines.push("_No published memory snapshot — this page is left as-is._");
      return { content: lines.join("\n"), charts: [] };
    }
    lines.push(...runMetaLines(model.memory.data, { sourceName: model.memory.name }));
    lines.push("");
    lines.push("## Peak RSS by surface (isolated probes)");
    lines.push("");
    const table = memoryProbeTable(model.memory.data, ["compile", "projection", "component-meta"]);
    lines.push(table ?? "_No probe rows._");
    lines.push("");
    lines.push(
      "Memory and speed are separate passes; CPU columns are context only, never a speed ranking. Full samples live in the JSON snapshot.",
    );
    return { content: lines.join("\n"), charts: [] };
  }

  if (!model.bench) {
    lines.push("_No publishable bench snapshot — this page is left as-is._");
    return { content: lines.join("\n"), charts: [] };
  }

  const surfaces = surfacesForGroup(group, model.bench.data);
  const charts = groupCharts(group, surfaces);
  for (const chart of charts) writeChartPair(chartsDir, chart);

  lines.push("## Results");
  lines.push("");
  lines.push(RANKING_RULES);
  lines.push("");
  for (const surface of surfaces) {
    const surfaceCharts = charts.filter((c) => c.surfaceId === surface.id);
    for (const chart of surfaceCharts) {
      lines.push(chartPicture(chart.fileBase));
      lines.push("");
    }
    lines.push(renderSurfaceMarkdown(surface));
  }

  // Local secondary runs render whole, behind their banner.
  const localBenches = model.benches.filter((b) => b.local);
  for (const local of localBenches.slice(0, 2)) {
    const localSurfaces = surfacesForGroup(group, local.data);
    if (localSurfaces.length === 0) continue;
    lines.push(localRunBanner(local));
    lines.push("");
    for (const surface of localSurfaces) {
      lines.push(renderSurfaceMarkdown(surface));
    }
  }

  const confirmSections = confirmMatrix(model, group.confirmSuites ?? []);
  if (confirmSections.length) {
    lines.push("## Confirmation (correctness plants)");
    lines.push("");
    for (const section of confirmSections) {
      lines.push(section);
      lines.push("");
    }
  }

  if (model.memory) {
    const table = memoryProbeTable(model.memory.data, group.memorySurfaces ?? []);
    if (table) {
      lines.push("## Memory (isolated probe)");
      lines.push("");
      lines.push(table);
      lines.push("");
    }
  }

  const versions = model.bench.data.versions ?? {};
  lines.push("## Tool versions");
  lines.push("");
  lines.push("<details><summary>Pinned package versions</summary>");
  lines.push("");
  lines.push("| Package | Version |");
  lines.push("| --- | --- |");
  for (const [name, version] of Object.entries(versions)) {
    if (name === "node") continue;
    lines.push(`| ${name} | ${version} |`);
  }
  lines.push("");
  lines.push("</details>");
  lines.push("");
  return { content: lines.join("\n"), charts };
}

export function writeGroupDoc(group, model, { root }) {
  const docsDir = join(root, "docs");
  const chartsDir = join(docsDir, "charts");
  mkdirSync(chartsDir, { recursive: true });
  const { content } = renderGroupDoc(group, model, { chartsDir, docsDir });
  const target = join(root, group.doc);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${content}\n`);
  return target;
}

export { compactTable };
