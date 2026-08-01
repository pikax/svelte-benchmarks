#!/usr/bin/env node
/** Thin IDE runner over the two correctness-gated LSP surfaces. */

import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const SUITES = [
  {
    id: "hover",
    surface: "lsp",
    label: "didOpen → typed hover at script and template positions",
  },
  {
    id: "formatting",
    surface: "lsp-format",
    label: "textDocument/formatting over script and nested markup",
  },
];

function valueAfter(argv, name, fallback) {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : fallback;
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--list")) {
    console.log("Validated IDE suites:");
    for (const suite of SUITES) {
      console.log(`  ${suite.id.padEnd(12)} ${suite.label}`);
    }
    console.log(
      "\nNot benchmarked: completion/navigation. @rsvelte/language-server currently exposes format/lint rather than TypeScript completion/navigation.",
    );
    return;
  }

  const requested = valueAfter(argv, "--suite", "all")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const suites = requested.includes("all")
    ? SUITES
    : SUITES.filter((suite) => requested.includes(suite.id));
  const unknown = requested.filter(
    (id) => id !== "all" && !SUITES.some((suite) => suite.id === id),
  );
  if (unknown.length > 0 || suites.length === 0) {
    throw new Error(
      `unknown IDE suite: ${unknown.join(", ") || requested.join(", ")}; use --list`,
    );
  }
  const server = valueAfter(argv, "--server", "all");
  if (server !== "all") {
    throw new Error(
      "--server filtering is not supported: each gated surface owns its applicable server set; use --server all",
    );
  }

  const childArgs = [
    join(rootDir, "scripts", "bench.mjs"),
    "--surfaces",
    suites.map((suite) => suite.surface).join(","),
    "--runs",
    valueAfter(argv, "--runs", "3"),
    "--warmups",
    valueAfter(argv, "--warmups", "1"),
  ];
  for (const flag of ["--fixture", "--work", "--json", "--out"]) {
    const value = valueAfter(argv, flag, "");
    if (value) childArgs.push(flag, value);
  }
  const child = spawnSync(process.execPath, childArgs, {
    cwd: rootDir,
    stdio: "inherit",
    env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" },
  });
  if (child.error) throw child.error;
  process.exitCode = child.status ?? 1;
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
