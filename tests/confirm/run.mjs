#!/usr/bin/env node
/**
 * Correctness confirmation orchestrator. Nothing here is timed or ranked.
 *
 * Exit codes:
 *   0 — no unexpected failures and no stale known failures
 *   1 — unexpected failure (a regression) OR a known failure that now passes
 *       (a stale allowlist entry that must be removed)
 *   2 — the runner itself crashed
 *
 * Known-failure discipline (self-clearing allowlist):
 *   - expected known failure still fails  → accepted and reported;
 *   - expected known failure passes        → FAIL (stale entry; remove it);
 *   - unexpected failure                   → FAIL;
 *   - entries may be scoped by platform and by run path (combined/per-case);
 *   - the benchmark gate and this allowlist are conceptually separate: a
 *     known-failure entry never turns a benchmark validity failure into a
 *     ranked PASS.
 */
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { formatReport } from "./lib/harness.mjs";
import { runCompileSuite } from "./suites/compile.mjs";
import { runProjectionSuite } from "./suites/projection.mjs";
import { runTypecheckSuite } from "./suites/typecheck.mjs";
import { runLintSuite } from "./suites/lint.mjs";
import { runFormatSuite } from "./suites/format.mjs";
import { runComponentMetaSuite } from "./suites/component-meta.mjs";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const workRoot = join(rootDir, "work", "confirm");

const ALL_SURFACES = [
  "compile",
  "projection",
  "typecheck",
  "lint",
  "format",
  "component-meta",
];

function parseArgs(argv) {
  const args = { surfaces: ALL_SURFACES.join(","), json: "", out: "", strict: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === "--surfaces") args.surfaces = next() ?? "";
    else if (a === "--json") args.json = next() ?? "";
    else if (a === "--out") args.out = next() ?? "";
    else if (a === "--strict") args.strict = true;
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

function help() {
  console.log(`Usage: node tests/confirm/run.mjs [--surfaces LIST] [--json FILE] [--out FILE] [--strict]

Surfaces: ${ALL_SURFACES.join(",")}

Exit codes: 0 clean · 1 unexpected failure or stale known failure · 2 crash.
--strict also fails on expected known failures.`);
}

function key(result) {
  return `${result.suite}/${result.caseId}/${result.tool}`;
}

function loadKnownFailures() {
  const raw = JSON.parse(
    readFileSync(join(rootDir, "tests/confirm/known-failures.json"), "utf8"),
  );
  return new Map(
    Object.entries(raw).filter(([name]) => !name.startsWith("$")),
  );
}

/**
 * An entry is VISIBLE only inside its scope: a platform-scoped entry is
 * invisible elsewhere, so it neither excuses a failure nor is refuted by a
 * pass that never applied to it.
 */
function knownEntryFor(known, row, { platform }) {
  const entry = known.get(key(row));
  if (!entry) return null;
  if (entry.platforms && !entry.platforms.includes(platform)) return null;
  if (entry.path && entry.path !== (row.path ?? "per-case")) return null;
  return entry;
}

function writeReports(results, { jsonPath, mdPath, platform }) {
  const dir = join(rootDir, "results");
  mkdirSync(dir, { recursive: true });
  const summary = Object.fromEntries(
    ["pass", "fail", "skip", "warn"].map((status) => [
      status,
      results.filter((r) => r.status === status).length,
    ]),
  );
  const payload = {
    kind: "confirmation",
    generatedAt: new Date().toISOString(),
    runner: {
      platform,
      node: process.version,
      ci: Boolean(process.env.CI),
      runUrl:
        process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
          ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
          : "",
    },
    summary,
    results,
  };
  const json = jsonPath || join(dir, "confirm.json");
  const md = mdPath || join(dir, "confirm.md");
  writeFileSync(json, `${JSON.stringify(payload, null, 2)}\n`);
  writeFileSync(
    md,
    `# Svelte correctness confirmation\n\nCorrectness only; no timings or rankings. Platform: ${platform}.\n\n${formatReport([
      { name: "confirmation", results },
    ])}\n`,
  );
  return { json, md, summary };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    help();
    process.exit(0);
  }
  const requested = new Set(
    args.surfaces.split(",").map((s) => s.trim()).filter(Boolean),
  );
  const unknown = [...requested].filter((s) => !ALL_SURFACES.includes(s));
  assert.deepEqual(unknown, [], `unknown surfaces: ${unknown.join(", ")}`);

  rmSync(workRoot, { recursive: true, force: true });
  mkdirSync(workRoot, { recursive: true });

  const results = [];
  if (requested.has("compile")) results.push(...(await runCompileSuite()));
  if (requested.has("projection")) results.push(...(await runProjectionSuite()));
  if (requested.has("typecheck")) results.push(...(await runTypecheckSuite()));
  if (requested.has("lint")) results.push(...(await runLintSuite()));
  if (requested.has("format")) results.push(...(await runFormatSuite()));
  if (requested.has("component-meta"))
    results.push(...(await runComponentMetaSuite()));

  const known = loadKnownFailures();
  const platform = process.platform;
  const unexpected = [];
  const expected = [];
  const fixed = [];
  for (const row of results) {
    const entry = knownEntryFor(known, row, { platform });
    if (row.status === "fail" && !entry) unexpected.push(row);
    else if (row.status === "fail" && entry) expected.push({ row, entry });
    else if (row.status === "pass" && entry) fixed.push(row);
  }

  const { json, md, summary } = writeReports(results, {
    jsonPath: args.json ? resolve(args.json) : "",
    mdPath: args.out ? resolve(args.out) : "",
    platform,
  });

  for (const row of results) {
    const entry = knownEntryFor(known, row, { platform });
    const symbol =
      row.status === "pass" ? "✓" : row.status === "skip" ? "–" : row.status === "warn" ? "!" : "✗";
    console.log(`${symbol} ${key(row)}${entry ? " (known)" : ""}`);
  }
  console.log(
    `\n${summary.pass} passed, ${expected.length} known failure(s), ${unexpected.length} unexpected failure(s), ${summary.skip} skipped.`,
  );
  console.error(`Wrote ${json}\nWrote ${md}`);
  for (const { row, entry } of expected) {
    if (entry.why) console.log(`  known: ${key(row)} — ${entry.why}`);
  }
  if (fixed.length)
    console.error(
      `Stale known failures now pass (remove from tests/confirm/known-failures.json): ${fixed.map(key).join(", ")}`,
    );
  if (args.strict && expected.length) {
    console.error("--strict: expected failures are fatal here");
    process.exitCode = 1;
  }
  if (unexpected.length || fixed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 2;
});
