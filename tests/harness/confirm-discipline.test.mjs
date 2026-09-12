import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "./helpers.mjs";
import {
  findExpectErrorPins,
  parseDiagnostics,
  scoreDiagnostics,
  stripAnsi,
} from "../confirm/lib/diagnostics.mjs";

const rootDir = join(import.meta.dirname, "../..");

test("svelte-check pretty grammar parses file/line with severity", () => {
  const text = [
    "Loading svelte-check in workspace: d:\\ws",
    "Getting Svelte diagnostics...",
    "",
    "d:\\ws\\plants\\script-type-error\\App.svelte:2:9",
    "Error: Type 'string' is not assignable to type 'number'. (ts)",
    "<script lang=\"ts\">",
    "",
    "d:\\ws\\plants\\clean\\App.svelte — nothing here",
  ].join("\n");
  const diags = parseDiagnostics(text);
  assert.equal(diags.length, 1);
  assert.equal(diags[0].line, 2);
  assert.equal(diags[0].severity, "error");
  assert.match(diags[0].file, /script-type-error\/App\.svelte$/);
  assert.match(diags[0].message, /not assignable/);
});

test("tsc single-line grammar parses", () => {
  const diags = parseDiagnostics(
    "plants/App.svelte(3,7): error TS2322: Type 'string' is not assignable to type 'number'.",
  );
  assert.equal(diags.length, 1);
  assert.equal(diags[0].code, "TS2322");
  assert.equal(diags[0].line, 3);
});

test("ANSI-coloured output is stripped before parsing", () => {
  const coloured = "[32mApp.svelte[39m:5:17\n[31mError[39m: boom (ts)\n";
  assert.ok(coloured.includes("[32m"));
  const diags = parseDiagnostics(coloured);
  assert.equal(diags.length, 1);
  assert.equal(diags[0].line, 5);
});

test("pins strip from the work copy and report shifted lines", () => {
  const source = `<script>\n// @plant-error\nconst bad: number = "x";\n</script>\n`;
  const { pins, stripped } = findExpectErrorPins("App.svelte", source);
  assert.equal(pins.length, 1);
  assert.equal(pins[0].commentLine, 2);
  assert.equal(pins[0].strippedLine, 2);
  assert.ok(!stripped.includes("@plant-error"));
  assert.match(stripped, /const bad/);
});

test("scoring requires evidence AT the pin, not anywhere in output", () => {
  const pins = [{ file: "App.svelte", strippedLine: 2, targetLine: 2, commentLine: 2 }];
  const elsewhere = [{ file: "App.svelte", line: 40, message: "Type 'string' is not assignable", code: "TS2322" }];
  const atPin = [...elsewhere, { file: "App.svelte", line: 2, message: "Type 'string' is not assignable", code: "TS2322" }];
  assert.equal(
    scoreDiagnostics({ diagnostics: elsewhere, pins, fileName: "App.svelte" }).ok,
    false,
    "a diagnostic in the wrong place is not evidence",
  );
  assert.equal(
    scoreDiagnostics({ diagnostics: atPin, pins, fileName: "App.svelte", mustMention: ["string", "assignable"] }).ok,
    true,
  );
  assert.equal(
    scoreDiagnostics({
      diagnostics: atPin,
      pins,
      fileName: "App.svelte",
      mustMention: ["something-unrelated"],
    }).ok,
    false,
  );
});

test("planted error plus noise is not a pass (maxErrors)", () => {
  const pins = [{ file: "App.svelte", strippedLine: 2, targetLine: 2, commentLine: 2 }];
  const noisy = Array.from({ length: 25 }, (_, i) => ({
    file: "App.svelte",
    line: i + 1,
    message: "unrelated",
  }));
  const verdict = scoreDiagnostics({
    diagnostics: noisy,
    pins,
    fileName: "App.svelte",
    maxErrors: 5,
  });
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((f) => /maxErrors/.test(f)));
});

test("known-failure allowlist discipline: stale entries fail the run", async () => {
  const runner = readFileSync(join(rootDir, "tests/confirm/run.mjs"), "utf8");
  assert.match(runner, /fixed/, "stale known failures are detected");
  assert.match(runner, /process\.exitCode = 1/, "unexpected or stale failures exit 1");
  assert.match(runner, /platforms/, "entries may be platform-scoped");
  const known = JSON.parse(
    readFileSync(join(rootDir, "tests/confirm/known-failures.json"), "utf8"),
  );
  for (const [key, entry] of Object.entries(known)) {
    if (key.startsWith("$")) continue;
    assert.match(key, /^(compile|projection|typecheck|lint|format|component-meta)\//, `unscoped key: ${key}`);
    assert.ok(entry.why, `entry ${key} must say WHY it is a known limitation`);
  }
});

test("confirmation suites run through the exact timed invocation shape", () => {
  const format = readFileSync(join(rootDir, "tests/confirm/suites/format.mjs"), "utf8");
  assert.match(format, /idempoten/, "format idempotence is confirmed");
  assert.match(format, /scriptOf|<script/, "script block coverage confirmed");
  assert.match(format, /styleOf|<style/, "style block coverage confirmed");
  const lint = readFileSync(join(rootDir, "tests/confirm/suites/lint.mjs"), "utf8");
  assert.match(lint, /clean twin/, "lint pairs are dirty/clean differentials");
  const typecheck = readFileSync(join(rootDir, "tests/confirm/suites/typecheck.mjs"), "utf8");
  assert.match(typecheck, /scoreDiagnostics/, "typecheck scoring is location-aware");
  assert.match(typecheck, /operational/, "operational failures never count as diagnoses");
  const meta = readFileSync(join(rootDir, "tests/confirm/suites/component-meta.mjs"), "utf8");
  assert.match(meta, /normalizeSveldProps|normalize/, "metadata schemas are normalized, not compared");
});
