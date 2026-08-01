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
import { buildMemoryTasks } from "./lib/memory-tasks.mjs";
import { renderMemoryMarkdown } from "./lib/memory-report.mjs";
import { collectVersions } from "./lib/versions.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const workerPath = join(rootDir, "scripts", "memory-worker.mjs");

function parseArgs(argv) {
  const args = {
    fixture: "fixtures/200",
    fileLimit: 200,
    samples: 3,
    surfaces: "compile,projection",
    work: "work/memory",
    json: "",
    out: "",
    help: false,
  };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--fixture") args.fixture = argv[++index];
    else if (arg === "--file-limit")
      args.fileLimit = Number.parseInt(argv[++index], 10);
    else if (arg === "--samples")
      args.samples = Number.parseInt(argv[++index], 10);
    else if (arg === "--surfaces") args.surfaces = argv[++index];
    else if (arg === "--work") args.work = argv[++index];
    else if (arg === "--json") args.json = argv[++index];
    else if (arg === "--out") args.out = argv[++index];
    else if (arg === "--help" || arg === "-h") args.help = true;
  }
  return args;
}

function rotate(values, by) {
  if (values.length === 0) return values;
  const index = by % values.length;
  return [...values.slice(index), ...values.slice(0, index)];
}

function runWorker(task, taskFile) {
  writeFileSync(taskFile, `${JSON.stringify(task)}\n`);
  const result = spawnSync(
    process.execPath,
    ["--expose-gc", workerPath, "--task", taskFile],
    {
      cwd: rootDir,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      timeout: 10 * 60 * 1000,
      env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" },
    },
  );
  const lines = `${result.stdout ?? ""}`.trim().split(/\r?\n/).filter(Boolean);
  let payload;
  try {
    payload = JSON.parse(lines.at(-1) ?? "{}");
  } catch {
    payload = { status: "error", error: "worker returned invalid JSON" };
  }
  if (result.status !== 0 && payload.status !== "error") {
    payload = {
      status: "error",
      error:
        result.error?.message ??
        result.stderr ??
        `worker exit ${result.status}`,
    };
  }
  return payload;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage: node --expose-gc scripts/bench-memory.mjs [options]

  --fixture DIR       Generated Svelte fixture (default: fixtures/200)
  --file-limit N      Files loaded by every tool (default: 200)
  --samples N         Fresh worker samples per tool (default: 3)
  --surfaces LIST     compile,projection
  --json FILE         JSON result path
  --out FILE          Markdown result path`);
    return;
  }
  if (!Number.isInteger(args.samples) || args.samples < 1) {
    throw new Error("--samples must be a positive integer");
  }
  const fixtureDir = resolve(rootDir, args.fixture);
  if (!existsSync(fixtureDir)) {
    throw new Error(
      `fixture not found: ${fixtureDir}; run pnpm generate first`,
    );
  }
  const allow = new Set(
    args.surfaces
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
  const tasks = buildMemoryTasks(fixtureDir, {
    fileLimit: args.fileLimit,
  }).filter((task) => allow.has(task.surface));
  if (tasks.length === 0) throw new Error("no memory tasks selected");

  const workDir = resolve(rootDir, args.work);
  if (
    workDir === rootDir ||
    (!workDir.startsWith(`${rootDir}\\`) && !workDir.startsWith(`${rootDir}/`))
  ) {
    throw new Error(`refusing unsafe memory work directory: ${workDir}`);
  }
  rmSync(workDir, { recursive: true, force: true });
  mkdirSync(workDir, { recursive: true });

  const sampleMap = new Map(tasks.map((task) => [task.id, []]));
  for (let sample = 0; sample < args.samples; sample++) {
    console.log(`Sample ${sample + 1}/${args.samples}`);
    for (const task of rotate(
      tasks.filter((candidate) => !candidate.skip),
      sample,
    )) {
      process.stdout.write(`  → ${task.label} ... `);
      const result = runWorker(task, join(workDir, `${task.id}.json`));
      sampleMap.get(task.id).push(result);
      console.log(
        result.status === "ok"
          ? `${result.peakRssDeltaMb.toFixed(2)} MB peak Δ`
          : `ERROR ${result.error}`,
      );
    }
  }

  const rows = tasks.map((task) => {
    if (task.skip) return { ...task, status: "skipped" };
    const samples = sampleMap.get(task.id) ?? [];
    const failed = samples.find((sample) => sample.status !== "ok");
    return failed
      ? { ...task, status: "error", error: failed.error, samples }
      : { ...task, status: "ok", samples };
  });
  const fileCount =
    tasks.find((task) => task.payload)?.payload.files.length ?? 0;
  const data = {
    schemaVersion: 1,
    kind: "memory",
    generatedAt: new Date().toISOString(),
    fixture: args.fixture.replaceAll("\\", "/"),
    fileCount,
    settings: { samples: args.samples, surfaces: [...allow] },
    runner: {
      platform: process.platform,
      arch: process.arch,
      node: process.version,
      cpuCount: os.cpus().length,
      cpuModel: os.cpus()[0]?.model ?? "unknown",
      totalmem: os.totalmem(),
    },
    versions: collectVersions(),
    rows,
  };
  const markdown = renderMemoryMarkdown(data);
  const resultsDir = join(rootDir, "results");
  mkdirSync(resultsDir, { recursive: true });
  const jsonPath = args.json
    ? resolve(rootDir, args.json)
    : join(resultsDir, `memory-${process.platform}-${fileCount}.json`);
  const mdPath = args.out
    ? resolve(rootDir, args.out)
    : join(resultsDir, `memory-${process.platform}-${fileCount}.md`);
  mkdirSync(dirname(jsonPath), { recursive: true });
  mkdirSync(dirname(mdPath), { recursive: true });
  writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`);
  writeFileSync(mdPath, markdown);
  process.stdout.write(`\n${markdown}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
