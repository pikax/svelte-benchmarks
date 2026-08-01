#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const START = "<!-- MEMORY_RESULTS_START -->";
const END = "<!-- MEMORY_RESULTS_END -->";

function parseArgs(argv) {
  const index = argv.indexOf("--dir");
  return { dir: index >= 0 ? argv[index + 1] : "results" };
}

function splice(document, body) {
  const start = document.indexOf(START);
  const end = document.indexOf(END);
  if (start < 0 || end < start)
    throw new Error("MEMORY.md markers are missing");
  return `${document.slice(0, start + START.length)}\n\n${body.trim()}\n\n${document.slice(end)}`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const dir = resolve(rootDir, args.dir);
  const candidates = existsSync(dir)
    ? readdirSync(dir)
        .filter((name) => /^memory-linux-\d+\.md$/i.test(name))
        .sort()
    : [];
  if (candidates.length === 0) {
    console.log("No Linux memory artifacts; MEMORY.md left unchanged.");
    return;
  }

  const reports = [];
  for (const name of candidates) {
    const jsonPath = join(dir, name.replace(/\.md$/i, ".json"));
    if (!existsSync(jsonPath)) throw new Error(`${name} lacks paired JSON`);
    const data = JSON.parse(readFileSync(jsonPath, "utf8"));
    if (data.kind !== "memory" || data.runner?.platform !== "linux") {
      throw new Error(`${name} is not a Linux memory report`);
    }
    if ((data.settings?.samples ?? 0) < 3) {
      throw new Error(`${name} has fewer than three isolated samples`);
    }
    reports.push(readFileSync(join(dir, name), "utf8").trim());
  }

  const path = join(rootDir, "MEMORY.md");
  const before = readFileSync(path, "utf8");
  const body = [
    `> Auto-updated ${new Date().toISOString().slice(0, 10)} from isolated Linux resource probes.`,
    "",
    ...reports,
  ].join("\n");
  const after = splice(before, body);
  if (after === before) {
    console.log("MEMORY.md unchanged.");
    return;
  }
  writeFileSync(path, after);
  console.log(`Updated ${path}`);
}

main();
