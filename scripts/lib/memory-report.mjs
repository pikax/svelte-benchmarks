import { median } from "./timing.mjs";

function formatMb(value) {
  return Number.isFinite(value) ? `${value.toFixed(2)} MB` : "n/a";
}

function formatMs(value) {
  return Number.isFinite(value) ? `${value.toFixed(1)} ms` : "n/a";
}

function range(values, formatter) {
  const valid = values.filter(Number.isFinite);
  if (valid.length === 0) return "n/a";
  return `${formatter(median(valid))} [${formatter(Math.min(...valid))}–${formatter(Math.max(...valid))}]`;
}

function classLabel(value) {
  return value.toUpperCase().replaceAll("-", " ");
}

export function renderMemoryMarkdown(data) {
  const lines = [
    "# Resource probe results",
    "",
    `- **Generated:** ${data.generatedAt}`,
    `- **Fixture:** \`${data.fixture}\` (${data.fileCount} Svelte files)`,
    `- **Samples per tool:** ${data.settings.samples}`,
    `- **Runner:** ${data.runner.platform}/${data.runner.arch} · Node ${data.runner.node}`,
    "",
    "Each sample runs in a fresh `node --expose-gc` process. Baseline RSS is captured after GC but before the tool or corpus is loaded. Peak RSS uses the OS high-water mark; retained deltas are captured after a final GC. Memory is not sampled inside speed benchmarks.",
    "",
  ];

  const bySurface = new Map();
  for (const row of data.rows) {
    if (!bySurface.has(row.surface)) bySurface.set(row.surface, []);
    bySurface.get(row.surface).push(row);
  }

  for (const [surface, rows] of bySurface) {
    lines.push(`## ${surface}`, "");
    const byClass = new Map();
    for (const row of rows) {
      const key = row.comparisonClass ?? "informational";
      if (!byClass.has(key)) byClass.set(key, []);
      byClass.get(key).push(row);
    }
    for (const [comparisonClass, classRows] of byClass) {
      lines.push(`### ${classLabel(comparisonClass)}`, "");
      lines.push(
        "| Tool | Files | Peak RSS Δ median [range] | Retained RSS Δ | Retained heap Δ | CPU context | Status |",
        "| --- | ---: | ---: | ---: | ---: | ---: | --- |",
      );
      for (const row of classRows) {
        if (row.status === "skipped") {
          lines.push(
            `| ${row.label} | ${data.fileCount} | – | – | – | – | skipped |`,
          );
          continue;
        }
        if (row.status === "error") {
          lines.push(
            `| ${row.label} | ${data.fileCount} | – | – | – | – | error |`,
          );
          continue;
        }
        lines.push(
          `| ${row.label} | ${data.fileCount} | ${range(
            row.samples.map((sample) => sample.peakRssDeltaMb),
            formatMb,
          )} | ${range(
            row.samples.map((sample) => sample.retainedRssDeltaMb),
            formatMb,
          )} | ${range(
            row.samples.map((sample) => sample.retainedHeapDeltaMb),
            formatMb,
          )} | ${range(
            row.samples.map((sample) => sample.cpuMs),
            formatMs,
          )} | measured |`,
        );
      }
      const notes = classRows.filter(
        (row) => row.error || row.skip || row.samples?.[0]?.gate,
      );
      if (notes.length > 0) {
        lines.push("", "<details><summary>Notes</summary>", "");
        for (const row of notes) {
          lines.push(
            `- **${row.label}**: ${row.error ?? row.skip ?? row.samples[0].gate}`,
          );
        }
        lines.push("", "</details>", "");
      } else {
        lines.push("");
      }
    }
  }

  lines.push(
    "## Interpretation",
    "",
    "- Compare only rows in the same workload class.",
    "- Peak RSS delta is the primary resource number; retained deltas describe memory still live after GC.",
    "- CPU is context only, not a speed ranking: resource sampling and GC intentionally perturb timing.",
    "- Native allocator pages may remain mapped after work; a retained RSS delta is not automatically a leak.",
    "",
  );
  return `${lines.join("\n")}\n`;
}
