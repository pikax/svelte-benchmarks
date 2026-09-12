/**
 * README landing page generation. Marker-splice architecture: hand-written
 * contract prose stays; generated blocks replace ONLY the content between
 * marker pairs. Each block is regenerated only when its input exists — a
 * missing input leaves the previous published section untouched.
 */
import { chartFileName, chartTwin } from "../chart-svg.mjs";
import { formatDuration } from "../chart-svg.mjs";
import { compactTable } from "./render.mjs";
import { runMetaLines, surfacesForGroup } from "./data.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

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

function readmeChart(model, group, surface, chartsDir) {
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
  if (bars.length === 0) return null;
  const fileBase = chartFileName(`readme-${group.id}-${surface.id}`);
  const twin = chartTwin({
    title: `${surface.label} — ${hasFresh ? "fresh child / warm (primary)" : "median (primary), lower is better"}`,
    unit: "ms",
    bars,
  });
  mkdirSync(chartsDir, { recursive: true });
  writeFileSync(join(chartsDir, `${fileBase}.svg`), `${twin.light}\n`);
  writeFileSync(join(chartsDir, `${fileBase}-dark.svg`), `${twin.dark}\n`);
  return `<picture>\n  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/${fileBase}-dark.svg">\n  <img src="docs/charts/${fileBase}.svg" alt="" width="760">\n</picture>`;
}

function groupSection(group, model, chartsDir) {
  const lines = [`### ${group.title}`, ""];
  lines.push(`> [Full results, raw samples and validation evidence →](${group.doc})`);
  lines.push("");
  const sources = model.bench ? [model.bench, ...model.benches.filter((b) => b.local)] : [];
  if (sources.length === 0) return lines.join("\n");
  const surfaces = surfacesForGroup(group, model.bench.data);
  if (surfaces.length === 0) {
    lines.push("_No rows in the current snapshot._");
    return lines.join("\n");
  }
  for (const surface of surfaces) {
    const chart = readmeChart(model, group, surface, chartsDir);
    if (chart) {
      lines.push(chart);
      lines.push("");
    }
    const variants = surface.groups
      ? surface.groups.flatMap((g) => g.variants)
      : (surface.variants ?? []);
    lines.push(compactTable(variants, { docHref: group.doc }));
    lines.push("");
  }
  return lines.join("\n");
}

function renderBenchBlock(model, chartsDir, groups) {
  const lines = [];
  if (!model.bench) return null;
  lines.push(
    `Generated **${model.bench.data.generatedAt?.slice(0, 10) ?? "?"}** from the latest published **Linux** JSON snapshot (\`${model.bench.name}\`, ${model.bench.data.fileCount} Svelte files, ${model.bench.data.settings?.runs} runs). Reference numbers only — re-run on your hardware; see [how to read](docs/how-to-read.md) and [methodology](docs/methodology.md).`,
  );
  lines.push("");
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
