/**
 * Per-surface docs page rendering. Markdown is generated from the JSON
 * snapshot; every page carries enough evidence to audit its ranking:
 * provenance, tool versions, raw samples (via the full tables), validation
 * verdicts, and per-class charts.
 */
import {
  chartFileName,
  chartTwin,
  chartPicture,
  formatDuration,
} from "../chart-svg.mjs";
import {
  renderSurfaceMarkdown,
  RANKING_RULES,
  chartLabel,
  displayName,
  variantClasses,
} from "../report.mjs";
import {
  confirmRowsForSuite,
  localRunBanner,
  runMetaLines,
  sourcesForGroup,
} from "./data.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const GENERATED_NOTE =
  "> This page is **generated** from committed JSON snapshots (`results/benchmarks/`, `results/real_world/`). Do not edit by hand — run `pnpm run docs`.";

function compactTable(variants, { docHref }) {
  const measured = variants;
  if (measured.length === 0) return "";
  const hasFresh = measured.some((v) => Number.isFinite(v.freshChildMedianMs));
  const sorted = [...measured].sort((a, b) => {
    const rank = (v) => v.status === "ok" ? 0 : v.status === "unranked" ? 1 : 2;
    if (rank(a) !== rank(b)) return rank(a) - rank(b);
    return (a.medianMs ?? Infinity) - (b.medianMs ?? Infinity);
  });
  const fastest = Math.min(
    ...measured.filter((v) => v.status === "ok" && Number.isFinite(v.medianMs)).map((v) => v.medianMs),
  );
  const hasCompetition = measured.filter((v) => v.status === "ok" && Number.isFinite(v.medianMs)).length >= 2;
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
    const name = displayName(v);
    const warm =
      v.status === "ok"
        ? `**${formatDuration(v.medianMs)}**`
        : v.status === "unranked" ? `(${formatDuration(v.medianMs)})` : v.status;
    const ratio =
      v.status === "ok" && hasCompetition && Number.isFinite(fastest) && fastest > 0
        ? `${(v.medianMs / fastest).toFixed(2)}x`
        : v.status === "unranked" ? "not ranked" : "—";
    const rss = Number.isFinite(v.rssMaxMb) ? `${v.rssMaxMb.toFixed(1)} MB` : "—";
    lines.push(
      hasFresh
        ? `| ${name} | ${Number.isFinite(v.freshChildMedianMs) ? formatDuration(v.freshChildMedianMs) : "–"} | ${warm} | ${ratio} | ${rss} |`
        : `| ${name} | ${warm} | ${ratio} | ${rss} |`,
    );
  }
  if (measured.some((v) => v.status === "unranked")) {
    lines.push("");
    lines.push(
      `⚠ bracketed rows are measured but unranked — see [the full page](${docHref}) for why.`,
    );
  }
  for (const v of measured.filter((v) => ["skipped", "error"].includes(v.status))) {
    lines.push("", `**${displayName(v)}:** ${String(v.error || v.notes || "No timing available").replace(/\r?\n/g, " ")}`);
  }
  return lines.join("\n");
}

export function barsFromVariants(variants) {
  return variants.flatMap((v) => {
    if (!["ok", "unranked"].includes(v.status) || !Number.isFinite(v.medianMs)) return [];
    const bar = { label: chartLabel(v), ranked: v.status === "ok", value: v.medianMs };
    return Number.isFinite(v.freshChildMedianMs)
      ? [{ ...bar, series: "warm" }, { ...bar, series: "fresh", value: v.freshChildMedianMs }]
      : [bar];
  });
}

/** Preserve group AND workload identity in chart data and filenames. */
export function groupCharts(group, surfaces, sourceName = "") {
  return surfaces.flatMap((surface) => (surface.groups?.length ? surface.groups : [surface]).flatMap((cell) =>
    variantClasses(cell.variants).map((cls) => ({
      surfaceId: surface.id, groupId: cell.id, classKey: cls.key, variants: cls.variants,
      fileBase: chartFileName(`${group.id}-${sourceName}-${surface.id}-${cell.id}-${cls.key}`),
      title: surface.id === "compile" ? "Compiler" : surface.label,
      subtitle: [cell !== surface ? cell.label : null, cls.label.replace(/ — separate workload$/, "")].filter(Boolean).join(" · "),
      bars: barsFromVariants(cls.variants),
    })),
  ));
}

export function writeChartPair(chartsDir, chart) {
  mkdirSync(chartsDir, { recursive: true });
  const twin = chartTwin({
    title: [chart.title, chart.subtitle].filter(Boolean).join(" — "),
    unit: "ms",
    bars: chart.bars,
    lowerIsBetter: true,
  });
  if (!twin.light) return false;
  const clean = (svg) => `${svg.split(/\r?\n/).map((line) => line.trimEnd()).join("\n").trimEnd()}\n`;
  writeFileSync(join(chartsDir, `${chart.fileBase}.svg`), clean(twin.light));
  writeFileSync(join(chartsDir, `${chart.fileBase}-dark.svg`), clean(twin.dark));
  return true;
}

export function renderSurfaceWithCharts(group, surface, entry, { chartsDir, chartsHref = "charts" }) {
  const charts = groupCharts(group, [surface], entry.name.replace(/\.json$/i, ""));
  return {
    charts,
    content: renderSurfaceMarkdown(surface, {
      includeRankingRules: false,
      renderComparison: (cls, cell) => {
        const chart = charts.find((c) => c.classKey === cls.key && c.groupId === (cell?.id ?? surface.id));
        if (!chart || !chart.bars.length) return "";
        writeChartPair(chartsDir, chart);
        return chartPicture(chart.fileBase, [chart.title, chart.subtitle].filter(Boolean).join(" — "), chartsHref);
      },
    }),
  };
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
  if (group.memoryOnly) {
    if (!model.memory) {
      lines.push("_No published memory snapshot — this page is left as-is._");
      return { content: lines.join("\n"), charts: [] };
    }
    if (model.memory.local) lines.push(localRunBanner(model.memory), "");
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

  lines.push("## Results");
  lines.push("");
  lines.push("<details><summary>Ranking rules and measurement definitions</summary>", "", RANKING_RULES, "", "</details>", "");
  const charts = [];
  const sources = sourcesForGroup(group, model);
  const seen = new Set();
  for (const { surface, entry } of sources) {
    if (!seen.has(entry.name)) {
      if (entry.local) lines.push(localRunBanner(entry), "");
      lines.push(...runMetaLines(entry.data, { sourceName: entry.name }), "");
      seen.add(entry.name);
    }
    const rendered = renderSurfaceWithCharts(group, surface, entry, { chartsDir });
    charts.push(...rendered.charts);
    lines.push(rendered.content);
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

  const versions = Object.assign({}, ...sources.map(({ entry }) => entry.data.versions ?? {}));
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
