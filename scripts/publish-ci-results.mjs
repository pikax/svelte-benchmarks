#!/usr/bin/env node
/**
 * Copy CI artifacts into the canonical published snapshot directories.
 *
 * Non-destructive partial publication, latest-run-only semantics:
 *  - an active side (bench | real-world | all) is CLEARED then repopulated
 *    from the downloaded artifacts, so the snapshot directory always reflects
 *    exactly one coherent run per side;
 *  - an INACTIVE side is left untouched — a failed/skipped job never replaces
 *    previously published good content with "no result" placeholders;
 *  - only Linux-named JSON leaves are publishable; markdown and local runs
 *    stay run-local. confirm.json is additionally verified by content.
 */
import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { join } from "node:path";

const SKIP_DIRS = new Set([
  "ci-tmp",
  "node_modules",
  "benchmarks",
  "real_world",
  "e2e-vscode",
  "work-real",
]);

function isLinuxLeaf(name) {
  if (/^(bench|ide|ide-scale|real-world)-/i.test(name) && /linux/i.test(name))
    return true;
  if (/^memory-linux/i.test(name)) return true;
  return name === "confirm.json";
}

function confirmIsLinux(file) {
  try {
    const data = JSON.parse(readFileSync(file, "utf8"));
    const platform = String(
      data.runner?.platform ?? data.platform ?? "",
    ).toLowerCase();
    return platform.includes("linux");
  } catch {
    return true; // unreadable defaults to keep; docs loading will surface it
  }
}

function listLeaves(dir, prefix = "") {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listLeaves(full, `${prefix}${entry.name}/`));
    } else if (entry.name.endsWith(".json") && statSync(full).isFile()) {
      out.push({ name: entry.name, full, rel: `${prefix}${entry.name}` });
    }
  }
  return out;
}

function destFor(name) {
  // Returns the SCOPE key ("bench" | "real-world"), not the directory name —
  // the active-side map is keyed by scope.
  return /^real-world-/i.test(name) ? "real-world" : "bench";
}

export function publishCiResults({
  fromDir,
  root = process.cwd(),
  scope = "all",
} = {}) {
  const sides =
    scope === "all"
      ? ["bench", "real-world"]
      : scope === "bench"
        ? ["bench"]
        : scope === "real-world"
          ? ["real-world"]
          : [];
  if (sides.length === 0) throw new Error(`unknown scope: ${scope}`);
  const active = {
    bench: sides.includes("bench") ? join(root, "results", "benchmarks") : null,
    "real-world": sides.includes("real-world")
      ? join(root, "results", "real_world")
      : null,
  };
  for (const [side, dest] of Object.entries(active)) {
    if (!dest) continue; // inactive side: previous published content stays
    rmSync(dest, { recursive: true, force: true });
    mkdirSync(dest, { recursive: true });
    console.log(`[publish:${side}] cleared ${join("results", dest.split(/[\\/]/).pop())}`);
  }
  let copied = 0;
  for (const leaf of listLeaves(fromDir)) {
    if (!isLinuxLeaf(leaf.name)) continue;
    const side = destFor(leaf.name);
    const dest = active[side];
    if (!dest) continue;
    if (leaf.name === "confirm.json" && !confirmIsLinux(leaf.full)) {
      console.log(`[publish] skip ${leaf.rel}: confirm runner is not Linux`);
      continue;
    }
    copyFileSync(leaf.full, join(dest, leaf.name));
    copied += 1;
    console.log(`[publish] ${leaf.rel} → ${dest}`);
  }
  console.log(`[publish] ${copied} snapshot file(s) published (scope=${scope})`);
  return copied;
}

const fromFlag = process.argv.indexOf("--from");
const scopeFlag = process.argv.indexOf("--scope");
if (process.argv[1] === import.meta.filename) {
  if (fromFlag === -1) {
    console.error("usage: publish-ci-results.mjs --from <dir> [--scope bench|real-world|all]");
    process.exit(2);
  }
  publishCiResults({
    fromDir: process.argv[fromFlag + 1],
    scope: scopeFlag === -1 ? "all" : process.argv[scopeFlag + 1],
  });
}
