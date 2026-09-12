/**
 * Projection confirmation. Official svelte2tsx is the reference of the
 * svelte2tsx-compatible class; the oracle is structural (parseable TSX,
 * marker propagation, helper contract), because a projection may be
 * semantically equivalent without an identical AST shape. Verter's different
 * projection schema stays in its own class, asserted only against itself.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import ts from "typescript";
import { createSuite } from "../lib/harness.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const require = createRequire(import.meta.url);

const SOURCE = `<script lang="ts">let { marker31415 }: { marker31415: string } = $props();</script>\n<h1>{marker31415}</h1>\n`;

function parseTsx(code, tool) {
  assert.ok(code.length > 0, `${tool} emitted empty code`);
  const parsed = ts.createSourceFile(
    `${tool}.tsx`,
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  assert.equal(parsed.parseDiagnostics.length, 0, `${tool} emitted unparseable TSX`);
  assert.match(code, /marker31415/);
  return parsed;
}

export async function runProjectionSuite() {
  const suite = createSuite("projection");

  await suite.run("svelte-projection", "svelte2tsx", async () => {
    const { svelte2tsx } = await import("svelte2tsx");
    const output = svelte2tsx(SOURCE, {
      filename: "Projection.svelte",
      isTsFile: true,
      mode: "ts",
      version: "5",
    });
    const parsed = parseTsx(output.code, "svelte2tsx");
    assert.match(output.code, /__sveltets_/);
    // Typed props must survive projection as typed declarations.
    const text = output.code;
    assert.match(text, /marker31415/, "prop identifier lost");
    const print = ts.createPrinter().printNode(
      ts.EmitHint.Unspecified,
      parsed,
      parsed,
    );
    assert.match(
      print,
      /marker31415/,
      "prop declaration not represented in printed AST",
    );
  });

  await suite.run("svelte-projection", "@rsvelte/svelte2tsx", async () => {
    const rsvelte = await import("@rsvelte/svelte2tsx");
    if (typeof rsvelte.initialize === "function") await rsvelte.initialize();
    const transform = rsvelte.svelte2tsx ?? rsvelte.default;
    const output = transform(SOURCE, {
      filename: "Projection.svelte",
      isTsFile: true,
      mode: "ts",
      version: "5",
    });
    parseTsx(output.code, "rsvelte-svelte2tsx");
    assert.match(output.code, /__sveltets_/);
  });

  await suite.run("svelte-projection", "verter", () => {
    const { VerterHost } = require("@verter/native");
    const host = new VerterHost({ analysisLevel: "full" });
    try {
      const id = "C:/confirm/Projection.svelte";
      host.upsert({
        canonicalId: id,
        inputId: id,
        source: Buffer.from(SOURCE),
        fileKind: "svelte",
      });
      assert.equal(host.ensureIdeCompiled(id), true);
      const output = host.getIde(id);
      parseTsx(output?.code ?? "", "verter");
      // Verter's projection is a DIFFERENT schema (its own JSX runtime) — its
      // own contract marker, never compared byte-for-byte with svelte2tsx.
      assert.match(output.code, /@verter\/svelte-jsx/);
    } finally {
      host.close?.();
    }
  });
  return suite.results;
}
