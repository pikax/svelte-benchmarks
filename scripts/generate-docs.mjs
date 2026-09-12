#!/usr/bin/env node
/**
 * Generate README blocks + docs/ pages + charts from committed JSON snapshots.
 *
 * Contract:
 *   results/benchmarks/*.json + results/real_world/*.json  →  README.md,
 *   docs/<group>.md, docs/charts/*.svg.
 * A missing input leaves its outputs UNTOUCHED — absence means "this run has
 * nothing to say", never "erase what is published". Local runs (--include-local
 * / pnpm docs:local) render behind banners and never displace the primary
 * Linux snapshot.
 */
import { readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { attachMemoryToBench, GROUPS, loadPublished, sourcesForGroup, localRunBanner, runMetaLines } from "./lib/docs/data.mjs";
import { writeGroupDoc, renderSurfaceWithCharts } from "./lib/docs/render.mjs";
import { updateReadme } from "./lib/docs/readme.mjs";
import { RANKING_RULES } from "./lib/report.mjs";
import { renderMemoryMarkdown } from "./lib/memory-report.mjs";

const rootDir = join(import.meta.dirname, "..");

/** Escape at the door: an unclosed <script> in a tool note cannot swallow a page. */
function escapeLooseHtml(content) {
  return content.replaceAll(/<(script|style)\b/gi, "&lt;$1");
}

function write(target, content) {
  writeFileSync(target, `${escapeLooseHtml(content).trimEnd()}\n`);
}

function generateDocs({ includeLocal = false } = {}) {
  const model = loadPublished(rootDir, process.env, { includeLocal });
  if (model.memory) write(join(rootDir, "MEMORY.md"), renderMemoryMarkdown(model.memory.data));

  // Inject isolated-probe Peak RSS onto the primary bench rows so timing
  // tables carry a memory column without a sampler running beside a timer.
  if (model.bench && model.memory) {
    attachMemoryToBench(model.bench.data, model.memory.data);
  }

  for (const group of GROUPS) {
    if (group.realWorld) continue; // real-world index handled below
    const target = join(rootDir, group.doc);
    const hasInput = group.memoryOnly
      ? Boolean(model.memory)
      : Boolean(model.bench && surfacesPresent(group, model));
    if (!hasInput) {
      console.log(`[docs] ${group.doc}: input absent — LEFT UNTOUCHED`);
      continue;
    }
    writeGroupDoc(group, model, { root: rootDir });
    console.log(`[docs] wrote ${group.doc}`);
  }

  if (model.realWorld.length > 0) {
    const lines = ["# Real-world projects", "",
      "> Generated from committed snapshots under `results/real_world/`. Ranked within a corpus, never across projects. Pinned revisions — see each project's provenance line.", "",
      "<details><summary>Ranking rules and measurement definitions</summary>", "", RANKING_RULES, "", "</details>", ""];
    for (const entry of model.realWorld) {
      lines.push(`## ${entry.project}${entry.local ? " *(local run)*" : ""}`);
      lines.push("");
      if (entry.local) lines.push(localRunBanner(entry), "");
      lines.push(...runMetaLines(entry.data, { sourceName: entry.name }), "");
      const provenance = entry.data?.corpora?.[0]?.provenance ?? entry.data?.corpora?.[0]?.selector ?? "";
      if (provenance) lines.push(`Corpus: ${provenance}`, "");
      for (const surface of entry.data?.surfaces ?? []) {
        lines.push(renderSurfaceWithCharts({ id: `real-world-${entry.project}` }, surface, entry, {
          chartsDir: join(rootDir, "docs", "charts"),
        }).content);
      }
      lines.push("");
    }
    write(join(rootDir, "docs", "real-world.md"), lines.join("\n"));
    console.log("[docs] wrote docs/real-world.md");
  } else {
    console.log("[docs] no real-world snapshots — docs/real-world.md LEFT UNTOUCHED");
  }

  // README: splice generated blocks; write only on change.
  const readmePath = join(rootDir, "README.md");
  const before = readFileSync(readmePath, "utf8");
  const { text, changed } = updateReadme(before, model, {
    chartsDir: join(rootDir, "docs", "charts"),
    groups: GROUPS,
  });
  if (changed) {
    write(readmePath, text);
    console.log("[docs] updated README.md");
  } else {
    console.log("[docs] README.md already current");
  }

  // Missing inputs leave their pages untouched, so scanning ALL pages keeps
  // their chart references while obsolete charts from regenerated pages go.
  pruneCharts(rootDir);
}

function surfacesPresent(group, model) {
  return sourcesForGroup(group, model).length > 0;
}

export function pruneCharts(rootDir) {
  const chartsDir = join(rootDir, "docs", "charts");
  let removed = 0;
  try {
    const referenced = new Set();
    const scan = (dir, prefix) => {
      let entries;
      try {
        entries = readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        if (entry.isDirectory()) {
          scan(join(dir, entry.name), `${prefix}${entry.name}/`);
        } else if (entry.name.endsWith(".md")) {
          const text = readFileSync(join(dir, entry.name), "utf8");
          for (const match of text.matchAll(/charts\/([A-Za-z0-9-]+)\.svg/g)) {
            referenced.add(match[1]);
          }
        }
      }
    };
    scan(join(rootDir, "docs"), "docs/");
    try {
      const readme = readFileSync(join(rootDir, "README.md"), "utf8");
      for (const match of readme.matchAll(/charts\/([A-Za-z0-9-]+)\.svg/g)) {
        referenced.add(match[1]);
      }
    } catch {
      // no README — nothing to add
    }
    for (const name of readdirSync(chartsDir)) {
      if (!name.endsWith(".svg")) continue;
      const base = name.replace(/\.svg$/, "").replace(/-dark$/, "");
      if (!referenced.has(base)) {
        rmSync(join(chartsDir, name), { force: true });
        removed += 1;
      }
    }
  } catch {
    // charts dir may not exist yet
  }
  if (removed) console.log(`[docs] pruned ${removed} unreferenced chart file(s)`);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  generateDocs({ includeLocal: process.argv.includes("--include-local") });
}
