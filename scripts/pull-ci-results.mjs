#!/usr/bin/env node
/**
 * Pull the latest successful CI benchmark artifacts locally, publish them into
 * the snapshot directories, and remind you to regenerate docs. Requires an
 * authenticated `gh` CLI.
 */
import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { publishCiResults } from "./publish-ci-results.mjs";

const rootDir = join(import.meta.dirname, "..");

function gh(args) {
  return execFileSync("gh", args, { encoding: "utf8", cwd: rootDir }).trim();
}

function latestRun(workflow) {
  const json = gh([
    "run",
    "list",
    "--workflow",
    workflow,
    "--status",
    "success",
    "--limit",
    "1",
    "--json",
    "databaseId,url",
  ]);
  const runs = JSON.parse(json);
  if (!runs.length) throw new Error(`no successful runs for ${workflow}`);
  return runs[0];
}

function download(run, label) {
  const dir = join(rootDir, "results", "ci-tmp", label);
  rmSync(dir, { recursive: true, force: true });
  gh(["run", "download", String(run.databaseId), "--dir", dir, "--pattern", "results-*"]);
  return dir;
}

const benchRun = latestRun("benchmark.yml");
console.log(`bench: ${benchRun.url}`);
const benchDir = download(benchRun, "bench");
publishCiResults({ fromDir: benchDir, root: rootDir, scope: "bench" });

try {
  const rwRun = latestRun("benchmark-real-world.yml");
  console.log(`real-world: ${rwRun.url}`);
  const rwDir = download(rwRun, "real-world");
  publishCiResults({ fromDir: rwDir, root: rootDir, scope: "real-world" });
} catch (error) {
  console.log(`real-world: skipped (${error.message})`);
}

console.log("\nDone. Run `pnpm docs` to regenerate README + docs pages.");
