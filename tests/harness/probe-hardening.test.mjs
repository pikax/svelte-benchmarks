import assert from "node:assert/strict";
import { test } from "./helpers.mjs";
import {
  findExpectErrorPins,
  parseDiagnostics,
  scoreDiagnostics,
} from "../confirm/lib/diagnostics.mjs";
import { checkMetaTypeFacts, callableParameters } from "../confirm/lib/meta-type-facts.mjs";

test("file attribution requires a complete path segment", () => {
  const pins = [{ file: "each-shadow/App.svelte", strippedLine: 6, targetLine: 6, commentLine: 6 }];
  const wrongFile = [
    { file: "x-each-shadow/App.svelte", line: 6, message: "Type 'number' is not assignable" },
  ];
  const rightFile = [
    { file: "D:/ws/plants/each-shadow/App.svelte", line: 6, message: "Type 'number' is not assignable" },
  ];
  assert.equal(
    scoreDiagnostics({ diagnostics: wrongFile, pins, fileName: "each-shadow/App.svelte" }).ok,
    false,
    "a sibling with the same suffix must not satisfy the plant",
  );
  assert.equal(
    scoreDiagnostics({ diagnostics: rightFile, pins, fileName: "each-shadow/App.svelte" }).ok,
    true,
  );
});

test("rsvelte-check single-line grammar parses with backslash paths", () => {
  const diags = parseDiagnostics(
    "ERROR each-shadow\\App.svelte:6:21 (ts): Property 'toUpperCase' does not exist on type 'number'.",
  );
  assert.equal(diags.length, 1);
  assert.equal(diags[0].file, "each-shadow/App.svelte");
  assert.equal(diags[0].line, 6);
});

test("shadow twins pin their planted error inside the shadowed scope", () => {
  const source = `<script lang="ts">\n  const item: string = 'outer';\n</script>\n\n{#each [1] as item (item)}\n  <!-- @plant-error -->\n  <p>{item.toUpperCase()}</p>\n{/each}\n`;
  const { pins, stripped } = findExpectErrorPins("each-shadow/App.svelte", source);
  assert.equal(pins.length, 1);
  assert.equal(pins[0].commentLine, 6);
  // After stripping the pin comment, the planted expression moves up one line.
  const planted = stripped.split("\n")[pins[0].commentLine - 1];
  assert.match(planted, /toUpperCase/);
});

test("callable parameter facts reject dropped and mistyped arguments", () => {
  const good = callableParameters("(x: number, y: number) => void");
  assert.equal(good.length, 2);
  assert.deepEqual(
    checkMetaTypeFacts("(x: number, y: number) => void", {
      paramCount: 2,
      params: [{ includes: "number" }, { includes: "number" }],
    }),
    [],
  );
  assert.ok(
    checkMetaTypeFacts("(x: number) => void", { paramCount: 2 }).length > 0,
    "a dropped argument must fail",
  );
  assert.ok(
    checkMetaTypeFacts("(x: string, y: number) => void", {
      params: [{ includes: "number" }],
    }).length > 0,
    "a mistyped parameter must fail",
  );
  assert.ok(
    checkMetaTypeFacts("(value?: boolean) => void", {
      params: [{ includes: "boolean", optional: true }],
    }).length === 0,
  );
  assert.ok(
    checkMetaTypeFacts("(value: boolean) => void", {
      params: [{ includes: "boolean", optional: true }],
    }).length > 0,
    "optionality is a fact, not a suggestion",
  );
  assert.ok(
    checkMetaTypeFacts("number", { paramCount: 1 }).length > 0,
    "a non-callable type cannot satisfy callable facts",
  );
});
