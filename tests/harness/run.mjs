#!/usr/bin/env node
/** Harness self-test runner: discovers *.test.mjs beside this file. */
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tests as sharedTests } from "./helpers.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(here)
  .filter((name) => name.endsWith(".test.mjs"))
  .sort();

let passed = 0;
let failed = 0;
for (const file of files) {
  sharedTests.length = 0; // each test module registers into the shared array
  await import(pathToFileURL(join(here, file)).href);
  const tests = [...sharedTests];
  if (tests.length === 0) continue;
  console.log(file);
  for (const { name, fn } of tests) {
    try {
      await fn();
      passed += 1;
      console.log(`  ✓ ${name}`);
    } catch (error) {
      failed += 1;
      console.error(`  ✗ ${name}`);
      console.error(`    ${error instanceof Error ? error.message : error}`);
      if (process.env.VERBOSE) console.error(error);
    }
  }
}
console.log(
  `\n${passed}/${passed + failed} harness test(s) passed across ${files.length} file(s).`,
);
if (failed) process.exitCode = 1;
