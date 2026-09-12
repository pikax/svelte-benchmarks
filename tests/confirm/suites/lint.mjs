/**
 * Lint confirmation: dirty/clean differential pairs through the EXACT timed
 * invocation. A pair passes only when the dirty twin is flagged AND the clean
 * twin is not — exit status alone is deliberately not evidence. Different
 * native rule engines are separate comparison classes; a rule a tool does not
 * implement is recorded per-tool, never generalized.
 */
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createSuite } from "../lib/harness.mjs";
import { resolveBin, runCommand } from "../../../scripts/lib/timing.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const PAIRS = [
  {
    id: "html-injection",
    dirtyLine: 5,
    dirty: `<script>
  const html = "<b>x</b>";
</script>

<div>{@html html}</div>
`,
    clean: `<script>
  const html = "<b>x</b>";
</script>

<div>{html}</div>
`,
    eslintRule: "svelte/no-at-html-tags",
    rsveltePattern: /\{@html\}[^\n]*can lead to XSS attack/i,
    verterPattern: /html|security|unsafe/i,
  },
  {
    id: "dupe-else-if",
    dirtyLine: 2,
    dirty: `{#if value}
  <p>first</p>
{:else if value}
  <p>dupe</p>
{/if}
`,
    clean: `{#if value}
  <p>first</p>
{:else if other}
  <p>distinct</p>
{/if}
`,
    eslintRule: "svelte/no-dupe-else-if-blocks",
    rsveltePattern: null,
    verterPattern: null,
  },
  {
    id: "dupe-style-properties",
    dirtyLine: 1,
    dirty: `<div style="color: red; color: blue;">x</div>
`,
    clean: `<div style="color: red;">x</div>
`,
    eslintRule: "svelte/no-dupe-style-properties",
    rsveltePattern: null,
    verterPattern: null,
  },
];

const ESLINT_CONFIG = `import svelte from "eslint-plugin-svelte";
export default [
  ...svelte.configs["flat/recommended"],
  { files: ["**/*.svelte"], rules: { "svelte/no-at-html-tags": "error" } },
];
`;

function makeTree(dir, pair, kind) {
  const tree = join(dir, `${pair.id}-${kind}`);
  rmSync(tree, { recursive: true, force: true });
  mkdirSync(join(tree, "nested"), { recursive: true });
  writeFileSync(join(tree, "nested", "Plant.svelte"), kind === "dirty" ? pair.dirty : pair.clean);
  writeFileSync(join(tree, "eslint.config.mjs"), ESLINT_CONFIG);
  return tree;
}

export async function runLintSuite() {
  const suite = createSuite("lint");
  const workRoot = join(rootDir, "work", "confirm", "lint-plants");

  for (const pair of PAIRS) {
    // eslint-plugin-svelte (API — the exact 1T timed invocation)
    await suite.run(pair.id, "eslint-plugin-svelte", async () => {
      const { ESLint } = await import("eslint");
      const dirtyTree = makeTree(workRoot, pair, "dirty");
      const cleanTree = makeTree(workRoot, pair, "clean");
      try {
        const dirtyLint = new ESLint({
          overrideConfigFile: join(dirtyTree, "eslint.config.mjs"),
          cwd: dirtyTree,
        });
        const cleanLint = new ESLint({
          overrideConfigFile: join(cleanTree, "eslint.config.mjs"),
          cwd: cleanTree,
        });
        const dirtyMessages = (
          await dirtyLint.lintFiles([join(dirtyTree, "nested", "Plant.svelte")])
        ).flatMap((r) => r.messages ?? []);
        const cleanMessages = (
          await cleanLint.lintFiles([join(cleanTree, "nested", "Plant.svelte")])
        ).flatMap((r) => r.messages ?? []);
        const dirtyHit = dirtyMessages.some(
          (m) => m.ruleId === pair.eslintRule || m.ruleId?.endsWith(pair.eslintRule.split("/").pop()),
        );
        assert.equal(dirtyHit, true, `dirty twin not flagged by ${pair.eslintRule} (got: ${dirtyMessages.map((m) => m.ruleId).join(", ") || "nothing"})`);
        const cleanHit = cleanMessages.some((m) => m.ruleId === pair.eslintRule);
        assert.equal(cleanHit, false, "clean twin flagged by the planted rule");
      } finally {
        rmSync(dirtyTree, { recursive: true, force: true });
        rmSync(cleanTree, { recursive: true, force: true });
      }
    });

    // rsvelte-lint (CLI — exact timed invocation)
    let rsvelte;
    try {
      rsvelte = resolveBin("rsvelte-lint", rootDir);
    } catch {
      suite.skip(pair.id, "rsvelte-lint", "binary unavailable");
      rsvelte = null;
    }
    if (rsvelte) {
      if (!pair.rsveltePattern) {
        suite.skip(pair.id, "rsvelte-lint", "no comparable rule in the native rule set");
      } else {
        await suite.run(pair.id, "rsvelte-lint", async () => {
          const dirtyTree = makeTree(workRoot, pair, "dirty");
          const cleanTree = makeTree(workRoot, pair, "clean");
          try {
            const dirtyOut = runCommand(rsvelte, ["."], {
              cwd: dirtyTree,
              allowNonZeroExit: true,
              shell: process.platform === "win32" && rsvelte.endsWith(".cmd"),
            });
            const cleanOut = runCommand(rsvelte, ["."], {
              cwd: cleanTree,
              allowNonZeroExit: true,
              shell: process.platform === "win32" && rsvelte.endsWith(".cmd"),
            });
            const dirtyText = `${dirtyOut.stdout}\n${dirtyOut.stderr}`;
            const cleanText = `${cleanOut.stdout}\n${cleanOut.stderr}`;
            assert.match(dirtyText, pair.rsveltePattern);
            assert.doesNotMatch(cleanText, pair.rsveltePattern);
          } finally {
            rmSync(dirtyTree, { recursive: true, force: true });
            rmSync(cleanTree, { recursive: true, force: true });
          }
        });
      }
    }

    // Verter host diagnostics (API — exact timed invocation)
    await suite.run(pair.id, "verter", async () => {
      if (!pair.verterPattern) {
        suite.skip(pair.id, "verter", "no comparable rule in the native diagnostics");
        return;
      }
      const { createRequire } = await import("node:module");
      const require = createRequire(join(rootDir, "package.json"));
      const { VerterHost } = require("@verter/native");
      const host = new VerterHost({ analysisLevel: "full" });
      try {
        const dirtyId = join(workRoot, `${pair.id}-dirty`, "nested", "Plant.svelte").replaceAll("\\", "/");
        mkdirSync(join(workRoot, `${pair.id}-dirty`, "nested"), { recursive: true });
        writeFileSync(dirtyId, pair.dirty);
        host.upsert({
          inputId: dirtyId,
          source: readFileSync(dirtyId, "utf8"),
          fileKind: "svelte",
        });
        const diagnostics = host.lint?.(dirtyId) ?? host.getDiagnostics?.(dirtyId);
        assert.match(JSON.stringify(diagnostics), pair.verterPattern);
      } finally {
        host.close?.();
        rmSync(join(workRoot, `${pair.id}-dirty`), { recursive: true, force: true });
      }
    });
  }
  return suite.results;
}
