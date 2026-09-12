/**
 * README landing page generation. Marker-splice architecture: hand-written
 * contract prose stays; generated blocks replace ONLY the content between
 * marker pairs. Each block is regenerated only when its input exists — a
 * missing input leaves the previous published section untouched.
 */
import { readmeChartPicture } from "../chart-svg.mjs";
import { compactTable, groupCharts, writeChartPair } from "./render.mjs";
import { localRunBanner, runMetaLines, sourcesForGroup } from "./data.mjs";
import { chartLabel } from "../report.mjs";
import { formatDuration } from "../chart-svg.mjs";

const MARKERS = {
  resultsIndex: "RESULTS_INDEX",
  runMeta: "RUN_META",
  benchmarkResults: "BENCHMARK_RESULTS",
  realWorld: "REAL_WORLD",
};

function spliceBetween(text, marker, body) {
  const begin = `<!-- svelte-bench: begin:${marker} -->`;
  const end = `<!-- svelte-bench: end:${marker} -->`;
  const start = text.indexOf(begin);
  const stop = text.indexOf(end);
  if (start === -1 || stop === -1 || stop < start) return text;
  // Replacement as a FUNCTION: a replacement string would interpret $& and
  // could splice old content back in.
  return text.slice(0, start + begin.length) +
    "\n" + body + "\n" +
    text.slice(stop);
}

function groupSection(group, model, chartsDir) {
  const sources = sourcesForGroup(group, model);
  if (!sources.length) return "";
  const lines = [`### ${group.title}`, ""];
  lines.push(`> [Full results, raw samples and validation evidence →](${group.doc})`);
  lines.push("");
  for (const { surface, entry } of sources) {
    if (entry.local) lines.push(localRunBanner(entry), "");
    // Production cells are the overview; every development cell stays on the full page.
    const overview = surface.id === "compile" && surface.groups?.length
      ? { ...surface, groups: surface.groups.filter((g) => g.env === "production") }
      : surface;
    const charts = groupCharts(group, [overview], entry.name.replace(/\.json$/i, ""));
    const informational = [];
    for (const chart of charts) {
      if (!chart.bars.length) continue;
      if (chart.variants.length < 2 || chart.variants.every((v) => ["skipped", "error"].includes(v.status))) {
        informational.push(chart);
        continue;
      }
      // Reuse the exact same asset on the landing and full page.
      writeChartPair(chartsDir, chart);
      lines.push(readmeChartPicture(chart.fileBase, [chart.title, chart.subtitle].filter(Boolean).join(" — ")), "");
      lines.push("<details><summary>Timing table and memory</summary>", "");
      lines.push(compactTable(chart.variants, { docHref: group.doc }), "");
      lines.push("</details>", "");
    }
    if (informational.length) {
      lines.push("**Separate workloads and availability** — informational timings; no speed ranking across these rows.", "",
        "| Tool | Workload | Median | Status |", "| --- | --- | ---: | --- |");
      const seen = new Set();
      const notes = [];
      for (const chart of informational) for (const v of chart.variants) {
        const unavailable = ["skipped", "error"].includes(v.status);
        const key = unavailable ? `${v.label}:${v.status}:${v.error || v.notes}` : `${chart.groupId}:${chart.classKey}:${v.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const duration = unavailable ? "—" : v.status === "unranked" ? `(${formatDuration(v.medianMs)})` : formatDuration(v.medianMs);
        const workload = (unavailable ? chart.classKey.replace(/^(class|target):/, "") : chart.subtitle || surface.label).replace(/ — separate workload/g, "");
        lines.push(`| ${chartLabel(v)} | ${workload} | ${duration} | ${v.status === "ok" ? "measured" : v.status} |`);
        if (unavailable && (v.error || v.notes)) notes.push(`**${chartLabel(v)}:** ${v.error || v.notes}`);
      }
      lines.push("", ...notes, "");
    }
    if (surface.id === "compile") lines.push(`Development builds and all validation evidence: [full compiler results](${group.doc}).`, "");
  }
  return lines.join("\n");
}

function renderBenchBlock(model, chartsDir, groups) {
  const lines = [];
  if (!model.bench) return null;
  lines.push(
    model.bench.local ? localRunBanner(model.bench) : `Generated **${model.bench.data.generatedAt?.slice(0, 10) ?? "?"}** from the latest published **Linux** JSON snapshot (\`${model.bench.name}\`, ${model.bench.data.fileCount} Svelte files, ${model.bench.data.settings?.runs} runs). See [how to read](docs/how-to-read.md) and [methodology](docs/methodology.md).`,
  );
  lines.push("", "Each chart covers one workload. Solid bars show the primary median; compiler outlines show fresh-child time. Hatched bars are unranked. Expand a timing table for ratios and memory; skipped and errored tools remain visible.", "");
  for (const group of groups) {
    if (group.memoryOnly || group.realWorld) continue;
    const section = groupSection(group, model, chartsDir);
    if (section) {
      lines.push(section);
      lines.push("");
    }
  }
  return lines.join("\n");
}

function renderRunMeta(model) {
  if (!model.bench) return null;
  return runMetaLines(model.bench.data, { sourceName: model.bench.name }).join("\n");
}

function renderResultsIndex(groups) {
  return groups
    .map((g) => `- [${g.title}](${g.doc})`)
    .join("\n");
}

function renderRealWorldBlock(model) {
  if (!model.realWorld?.length) return null;
  const lines = [];
  lines.push(
    `Pinned OSS checkouts, re-compiled per surface — ranked within a corpus, never across projects (${model.realWorld.length} projects). Full evidence: [docs/real-world.md](docs/real-world.md).`,
  );
  lines.push("");
  lines.push(
    model.realWorld
      .map(
        (r) =>
          `- **${r.project}**${r.local ? " *(local run)*" : ""} — \`${r.name}\``,
      )
      .join("\n"),
  );
  return lines.join("\n");
}

export function updateReadme(before, model, { chartsDir, groups }) {
  let text = before;
  let changed = false;
  const swap = (marker, body) => {
    if (body == null) return;
    const next = spliceBetween(text, marker, body);
    if (next !== text) {
      text = next;
      changed = true;
    }
  };
  swap(MARKERS.resultsIndex, renderResultsIndex(groups));
  swap(MARKERS.runMeta, renderRunMeta(model));
  swap(MARKERS.benchmarkResults, renderBenchBlock(model, chartsDir, groups));
  swap(MARKERS.realWorld, renderRealWorldBlock(model));
  return { text, changed };
}
