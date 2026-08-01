#!/usr/bin/env node
/** Publish benchmark summaries to README and full reports to docs/results. */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { REAL_WORLD_PROJECTS } from "./lib/real-world/projects.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const DETAILS_DIR = "docs/results";
const START = "<!-- BENCHMARK_RESULTS_START -->";
const END = "<!-- BENCHMARK_RESULTS_END -->";
const INDEX_START = "<!-- RESULTS_INDEX_START -->";
const INDEX_END = "<!-- RESULTS_INDEX_END -->";
const REAL_START = "<!-- REAL_WORLD_RESULTS_START -->";
const REAL_END = "<!-- REAL_WORLD_RESULTS_END -->";

function walk(dir, prefix, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, prefix, acc);
    else if (entry.startsWith(prefix) && entry.endsWith(".md")) acc.push(full);
  }
  return acc;
}

function leafOf(path) {
  return path.replace(/\\/g, "/").split("/").pop();
}

function platformOf(path) {
  const lower = path.replace(/\\/g, "/").toLowerCase();
  if (lower.includes("linux") || lower.includes("ubuntu"))
    return "Ubuntu/Linux";
  if (lower.includes("darwin") || lower.includes("macos")) return "macOS";
  if (lower.includes("win32") || lower.includes("windows")) return "Windows";
  return "Unknown platform";
}

export function splitDetails(markdown) {
  let removed = 0;
  const slim = markdown.replace(
    /\n?<details>\s*<summary>[\s\S]*?<\/details>\s*/gi,
    () => {
      removed += 1;
      return "\n";
    },
  );
  return { slim, removed };
}

/** Remove report-level environment/version/methodology headers from a summary. */
export function stripReportMeta(markdown) {
  const lines = markdown.split("\n");
  const firstSurface = lines.findIndex(
    (line) =>
      /^### /.test(line) &&
      !/^### (Tool versions|Methodology notes)\s*$/.test(line),
  );
  return firstSurface >= 0 ? lines.slice(firstSurface).join("\n") : markdown;
}

function stripToolLegends(markdown) {
  const lines = markdown.split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] !== "Tools:") {
      out.push(lines[i]);
      continue;
    }
    i += 1;
    while (
      i < lines.length &&
      (lines[i].trim() === "" || /^- \*\*/.test(lines[i]))
    )
      i += 1;
    i -= 1;
  }
  return out.join("\n");
}

export function summarizeReport(markdown) {
  const withoutMeta = stripReportMeta(markdown);
  const { slim, removed } = splitDetails(withoutMeta);
  const summary = stripToolLegends(slim)
    .split("\n")
    .filter(
      (line) => !line.startsWith("Ranked on the **median of measured runs**"),
    )
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { summary, removed };
}

function writeFullReport(leaf, heading, markdown) {
  const dir = join(rootDir, DETAILS_DIR);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, leaf), `# ${heading}\n\n${markdown.trim()}\n`);
}

export function spliceSection(readme, startMarker, endMarker, body) {
  const start = readme.indexOf(startMarker);
  const end = readme.indexOf(endMarker);
  if (start < 0 || end < 0 || end < start) {
    throw new Error(`Markers ${startMarker} / ${endMarker} not found`);
  }
  return `${readme.slice(0, start + startMarker.length)}\n\n${body.trim()}\n\n${readme.slice(end)}`;
}

function parseArgs(argv) {
  const args = { dir: "results", readme: "README.md", allowNonLinux: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dir") args.dir = argv[++i];
    else if (argv[i] === "--readme") args.readme = argv[++i];
    else if (argv[i] === "--allow-non-linux") args.allowNonLinux = true;
  }
  return args;
}

export function filterPublishable(files, allowNonLinux = false) {
  return files.filter(
    (file) => allowNonLinux || platformOf(file) === "Ubuntu/Linux",
  );
}

export function validateRealWorldArtifacts(files) {
  const expectedProjects = new Set(
    REAL_WORLD_PROJECTS.map((project) => project.id),
  );
  const foundProjects = new Map();
  const requiredSurfaces = ["compile", "projection", "format", "lint"];

  for (const markdownPath of files) {
    const jsonPath = markdownPath.replace(/\.md$/i, ".json");
    if (!existsSync(jsonPath)) {
      throw new Error(
        `real-world report lacks JSON evidence: ${leafOf(jsonPath)}`,
      );
    }
    const data = JSON.parse(readFileSync(jsonPath, "utf8"));
    if (data.kind !== "real-world") {
      throw new Error(`${leafOf(jsonPath)} is not a real-world report`);
    }
    if ((data.surfaceFailures ?? []).length > 0) {
      throw new Error(`${leafOf(jsonPath)} contains failed surface cells`);
    }
    if (data.settings?.fileLimit !== null) {
      throw new Error(
        `${leafOf(jsonPath)} is truncated and cannot be published`,
      );
    }
    if ((data.settings?.runs ?? 0) < 5) {
      throw new Error(`${leafOf(jsonPath)} has fewer than 5 measured runs`);
    }
    const surfaces = [...(data.settings?.surfaces ?? [])].sort();
    if (surfaces.join(",") !== [...requiredSurfaces].sort().join(",")) {
      throw new Error(
        `${leafOf(jsonPath)} does not contain every required real-world surface`,
      );
    }
    const corpora = Array.isArray(data.corpora) ? data.corpora : [];
    if (corpora.length === 0) {
      throw new Error(`${leafOf(jsonPath)} contains no corpus evidence`);
    }
    if ((data.surfaces ?? []).length !== corpora.length * surfaces.length) {
      throw new Error(`${leafOf(jsonPath)} has missing surface reports`);
    }
    for (const corpus of corpora) {
      const project = corpus.selector?.split(":", 1)[0];
      if (!expectedProjects.has(project)) {
        throw new Error(
          `${leafOf(jsonPath)} contains unknown project ${project}`,
        );
      }
      if (foundProjects.has(project)) {
        throw new Error(`duplicate real-world report for ${project}`);
      }
      foundProjects.set(project, markdownPath);
    }
  }

  const missing = [...expectedProjects].filter(
    (project) => !foundProjects.has(project),
  );
  if (missing.length > 0) {
    throw new Error(
      `refusing partial real-world publication; missing: ${missing.join(", ")}`,
    );
  }
}

function phaseOf(leaf) {
  if (leaf.startsWith("real-world-")) return "real-world";
  return leaf.includes("repeated") || leaf.includes("cache-demo")
    ? "cache demo (not ranking)"
    : "bench";
}

function buildIndex(entries) {
  const reports = entries
    .map(({ leaf, label }) => `[${label}](${DETAILS_DIR}/${leaf})`)
    .join(" · ");
  return [
    INDEX_START,
    "",
    "**Results index** — summaries below; every result links its full environment, methodology, notes, and raw runs:",
    "",
    `- **[Reference results](#reference-results)** — [how to read](docs/how-to-read.md)${reports ? ` · ${reports}` : ""}`,
    "",
    INDEX_END,
  ].join("\n");
}

function spliceIndex(readme, entries) {
  if (!readme.includes(INDEX_START) || !readme.includes(INDEX_END))
    return readme;
  return readme.replace(
    new RegExp(`${INDEX_START}[\\s\\S]*?${INDEX_END}`),
    buildIndex(entries),
  );
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const resultsDir = join(rootDir, args.dir);
  const readmePath = join(rootDir, args.readme);
  if (!existsSync(readmePath))
    throw new Error(`README not found: ${readmePath}`);

  const publishable = filterPublishable(
    walk(resultsDir, "bench-").sort(),
    args.allowNonLinux,
  );
  const realWorld = filterPublishable(
    walk(resultsDir, "real-world-").sort(),
    args.allowNonLinux,
  );
  if (realWorld.length > 0) validateRealWorldArtifacts(realWorld);
  if (publishable.length === 0 && realWorld.length === 0) {
    console.log("No publishable benchmark artifacts; README left unchanged.");
    return;
  }

  const entries = [];
  const buildBlocks = (files, intro) => {
    const blocks = [
      `> Auto-updated ${new Date().toISOString().slice(0, 10)} from benchmark artifacts.`,
      `> ${intro}`,
      "> Every measured run is warmed; the primary metric is the median.",
      "",
    ];
    for (const file of files) {
      const leaf = leafOf(file);
      const label = `${platformOf(file)} · ${phaseOf(leaf)}`;
      const markdown = readFileSync(file, "utf8")
        .trim()
        // Committed detail reports have one publication heading before the
        // benchmark report. Strip it when preserving an absent matrix shard.
        .replace(/^# [^\n]+\n+(?=## Benchmark Results\b)/, "");
      const { summary, removed } = summarizeReport(markdown);
      writeFullReport(leaf, label, markdown);
      entries.push({ leaf, label });
      blocks.push(
        `#### ${label}`,
        "",
        `<!-- source: ${leaf} -->`,
        "",
        `> 📄 **[Full details →](${DETAILS_DIR}/${leaf})** — environment, methodology, per-row notes and raw runs${removed ? ` (${removed} collapsed block(s))` : ""}.`,
        "",
        summary,
        "",
      );
    }
    return blocks.join("\n");
  };

  const before = readFileSync(readmePath, "utf8");
  let readme = before;
  if (publishable.length > 0) {
    readme = spliceSection(
      readme,
      START,
      END,
      buildBlocks(
        publishable,
        "Linux CI results are the published reference; local runs are for comparison on the same machine only.",
      ),
    );
  }
  if (realWorld.length > 0) {
    readme = spliceSection(
      readme,
      REAL_START,
      REAL_END,
      buildBlocks(
        realWorld,
        "Pinned real-world corpora are source-only and ranked within each project, never across projects.",
      ),
    );
  }
  // Publishing one workflow or a partial real-world matrix must not erase
  // reports produced by another successful shard/run. The committed details
  // directory is the durable union; `results/` contains only this run.
  const detailsPath = join(rootDir, DETAILS_DIR);
  if (existsSync(detailsPath)) {
    for (const leaf of readdirSync(detailsPath)
      .filter((name) => name.endsWith(".md"))
      .sort()) {
      if (entries.some((entry) => entry.leaf === leaf)) continue;
      if (realWorld.length > 0 && leaf.startsWith("real-world-")) continue;
      const firstLine = readFileSync(join(detailsPath, leaf), "utf8").split(
        "\n",
      )[0];
      entries.push({
        leaf,
        label: firstLine.startsWith("# ")
          ? firstLine.slice(2).trim()
          : `${platformOf(leaf)} · ${phaseOf(leaf)}`,
      });
    }
  }
  readme = spliceIndex(readme, entries);
  if (readme === before) {
    console.log("README unchanged.");
    return;
  }
  writeFileSync(readmePath, readme);
  console.log(
    `Published ${publishable.length + realWorld.length} benchmark report(s).`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
