#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { collectVersions } from "./lib/versions.mjs";
import { renderFullMarkdown } from "./lib/report.mjs";
import {
  defaultSelectors,
  provenance,
  resolveCorpus,
} from "./lib/real-world/corpus.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const SUPPORTED_SURFACES = ["compile", "projection", "format", "lint"];
const SURFACE_TIMEOUT_MS = 45 * 60 * 1000;

function parseArgs(argv) {
  const args = {
    projects: "",
    surfaces: SUPPORTED_SURFACES.join(","),
    runs: 3,
    warmups: 1,
    fileLimit: Infinity,
    json: "",
    out: "",
    work: "work-real",
    help: false,
  };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--projects") args.projects = argv[++index];
    else if (arg === "--surfaces") args.surfaces = argv[++index];
    else if (arg === "--runs") args.runs = Number.parseInt(argv[++index], 10);
    else if (arg === "--warmups")
      args.warmups = Number.parseInt(argv[++index], 10);
    else if (arg === "--file-limit")
      args.fileLimit = Number.parseInt(argv[++index], 10);
    else if (arg === "--json") args.json = argv[++index];
    else if (arg === "--out") args.out = argv[++index];
    else if (arg === "--work") args.work = argv[++index];
    else if (arg === "--help" || arg === "-h") args.help = true;
  }
  return args;
}

function githubRunUrl() {
  if (
    !process.env.GITHUB_SERVER_URL ||
    !process.env.GITHUB_REPOSITORY ||
    !process.env.GITHUB_RUN_ID
  )
    return "";
  return `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage: node scripts/bench-real-world.mjs [options]

  --projects LIST     Project or project:corpus ids (default: all defaults)
  --surfaces LIST     ${SUPPORTED_SURFACES.join(",")}
  --runs N            Measured runs (default: 3)
  --warmups N         Discarded warmups (minimum 1)
  --file-limit N      Alphabetical prefix for debugging only; default full corpus
  --json FILE         JSON output
  --out FILE          Markdown output

Run pnpm fetch:real-world first. These are source-only surfaces: no third-party
dependency installs, project builds, tests, or lifecycle scripts are executed.
`);
    return;
  }
  const surfaceIds = args.surfaces
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const unknown = surfaceIds.filter((id) => !SUPPORTED_SURFACES.includes(id));
  if (unknown.length > 0)
    throw new Error(`unsupported surfaces: ${unknown.join(", ")}`);
  const selectors = args.projects
    ? args.projects
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : defaultSelectors();
  const corpora = selectors.map((selector) =>
    resolveCorpus(selector, { fileLimit: args.fileLimit }),
  );
  const unavailable = corpora.filter((corpus) => !corpus.available);
  if (unavailable.length > 0) {
    throw new Error(
      unavailable
        .map((corpus) => `${corpus.selector}: ${corpus.reason}`)
        .join("\n"),
    );
  }

  const workRoot = resolve(rootDir, args.work);
  if (
    workRoot === rootDir ||
    (!workRoot.startsWith(`${rootDir}\\`) &&
      !workRoot.startsWith(`${rootDir}/`))
  ) {
    throw new Error(`refusing unsafe work directory: ${workRoot}`);
  }
  rmSync(workRoot, { recursive: true, force: true });
  mkdirSync(join(workRoot, "surface-json"), { recursive: true });
  const surfaces = [];
  const surfaceFailures = [];

  for (const corpus of corpora) {
    console.log(`\n=== ${provenance(corpus)} ===`);
    for (const surfaceId of surfaceIds) {
      const key = `${corpus.selector.replace(/[^a-z0-9]+/gi, "-")}-${surfaceId}`;
      const outFile = join(workRoot, "surface-json", `${key}.json`);
      process.stdout.write(`  → ${surfaceId} ... `);
      const childArgs = [
        join(rootDir, "scripts", "run-real-world-surface.mjs"),
        "--project",
        corpus.selector,
        "--surface",
        surfaceId,
        "--out",
        outFile,
        "--runs",
        String(args.runs),
        "--warmups",
        String(Math.max(1, args.warmups)),
        "--work",
        args.work,
      ];
      if (Number.isFinite(args.fileLimit))
        childArgs.push("--file-limit", String(args.fileLimit));
      const child = spawnSync(process.execPath, childArgs, {
        cwd: rootDir,
        encoding: "utf8",
        maxBuffer: 256 * 1024 * 1024,
        timeout: SURFACE_TIMEOUT_MS,
        env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" },
      });
      if (child.status === 0 && existsSync(outFile)) {
        const surface = JSON.parse(readFileSync(outFile, "utf8"));
        surfaces.push(surface);
        const rows = Array.isArray(surface.groups)
          ? surface.groups.flatMap((group) => group.variants ?? [])
          : (surface.variants ?? []);
        console.log(
          `ok=${rows.filter((row) => row.status === "ok").length} unranked=${rows.filter((row) => row.status === "unranked").length} error=${rows.filter((row) => row.status === "error").length}`,
        );
      } else {
        const how =
          child.error?.code === "ETIMEDOUT"
            ? "timed out"
            : `exit ${child.status}`;
        const detail = `${child.stderr ?? ""}`
          .trim()
          .split("\n")
          .slice(-4)
          .join(" | ")
          .slice(0, 800);
        surfaceFailures.push({
          corpus: corpus.selector,
          surface: surfaceId,
          how,
          detail,
        });
        console.log(`FAILED (${how})`);
      }
    }
  }

  const data = {
    schemaVersion: 2,
    kind: "real-world",
    generatedAt: new Date().toISOString(),
    fixture: "pinned real-world Svelte source checkouts",
    fileCount: corpora.reduce((sum, corpus) => sum + corpus.files.length, 0),
    corpora: corpora.map((corpus) => ({
      selector: corpus.selector,
      repo: corpus.project.repo,
      ref: corpus.project.ref,
      sha: corpus.sha,
      files: corpus.files.length,
      bytes: corpus.bytes,
      kind: corpus.corpus.kind,
      license: corpus.project.license,
      truncation: corpus.truncation,
    })),
    surfaceFailures,
    settings: {
      runs: args.runs,
      warmups: Math.max(1, args.warmups),
      surfaces: surfaceIds,
      fileLimit: args.fileLimit,
    },
    runner: {
      label: process.env.RUNNER_OS ?? "local",
      platform: process.platform,
      arch: process.arch,
      cpuCount: os.cpus().length,
      cpuModel: os.cpus()[0]?.model ?? "unknown",
      totalmem: os.totalmem(),
      node: process.version,
    },
    commit: {
      sha: process.env.GITHUB_SHA ?? "",
      ref: process.env.GITHUB_REF_NAME ?? "",
      repository: process.env.GITHUB_REPOSITORY ?? "",
      runUrl: githubRunUrl(),
    },
    versions: collectVersions(),
    methodology: [
      "Every corpus is a pinned third-party checkout. The report records repo, ref, immutable commit SHA, file count, corpus kind, and license.",
      "Rank tools only within the same corpus and surface; never compare throughput across projects or merge rows from different runners.",
      "Real-world runs are source-only: the harness executes no third-party install, build, test, or lifecycle scripts.",
      "Sources are copied without byte changes into a flat, deterministic staging directory. This prevents destructive formatters from touching checkouts; source-only tools do not resolve imports.",
      "Compile and projection first ask the applicable official reference APIs to accept each raw, unpreprocessed input. Compile eligibility is independent per pinned version class; projection has one official schema. Exclusions are counted and candidate-only failures remain visible.",
      "Compile, projection, format, and lint use the same correctness/coverage gates as generated fixtures. Generated fixtures remain the primary ranking corpus because their planted bugs make those gates controlled.",
      Number.isFinite(args.fileLimit)
        ? `⚠ TRUNCATED: each corpus is the first ${args.fileLimit} paths alphabetically. This is for debugging, not publication.`
        : "Every configured corpus is complete; no file limit was applied.",
      ...(surfaceFailures.length
        ? [
            `⚠ HARNESS GAPS: ${surfaceFailures.length} requested cells failed to produce rows; nothing should be inferred about their tools.`,
          ]
        : []),
    ],
    surfaces,
  };
  const markdown = renderFullMarkdown(data);
  const resultsDir = join(rootDir, "results");
  mkdirSync(resultsDir, { recursive: true });
  const jsonPath = args.json
    ? resolve(rootDir, args.json)
    : join(resultsDir, `real-world-${process.platform}.json`);
  const mdPath = args.out
    ? resolve(rootDir, args.out)
    : join(resultsDir, `real-world-${process.platform}.md`);
  mkdirSync(dirname(jsonPath), { recursive: true });
  mkdirSync(dirname(mdPath), { recursive: true });
  writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`);
  writeFileSync(mdPath, markdown);
  process.stdout.write(`\n${markdown}`);
  if (surfaceFailures.length > 0) {
    console.error(
      `\n${surfaceFailures.length} requested real-world surface cell(s) failed; partial artifacts were retained for diagnosis but are not publishable.`,
    );
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error ? (error.stack ?? error.message) : String(error),
  );
  process.exit(1);
});
