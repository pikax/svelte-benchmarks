/**
 * Format confirmation: whole-file coverage through the EXACT timed CLI —
 * nested discovery, markup AND <script> AND <style> formatting, parseability
 * after formatting, idempotence, and preservation of key Svelte semantics.
 * A formatter that does not support .svelte is skipped, never benchmarked as
 * CLI startup.
 */
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createSuite } from "../lib/harness.mjs";
import { resolveBin, runCommand } from "../../../scripts/lib/timing.mjs";
import { prepareFormatPlant } from "../../../scripts/lib/work-gate.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const MESSY = `<script>
let    count=0
const label =  'hello'
function   bump(n){   return n+1}
</script>

<button    class="x"   onclick={()=>count=bump(count)}>{  label } {count}</button>

<style>
.x{color:red}
</style>
`;

const DEFINITIONS = [
  [
    "prettier",
    () => ({ bin: resolveBin("prettier", rootDir), args: ["--write", "**/*.svelte", "--log-level", "error"] }),
    {
      ".prettierrc.json": `${JSON.stringify({ plugins: ["prettier-plugin-svelte"] }, null, 2)}\n`,
    },
  ],
  ["rsvelte-fmt", () => ({ bin: resolveBin("rsvelte-fmt", rootDir), args: ["."] }), {}],
  ["oxfmt", () => ({ bin: resolveBin("oxfmt", rootDir), args: [".", "--write"] }), {}],
];

function scriptOf(source) {
  return /<script\b[^>]*>([\s\S]*?)<\/script>/i.exec(source)?.[1] ?? "";
}
function styleOf(source) {
  return /<style\b[^>]*>([\s\S]*?)<\/style>/i.exec(source)?.[1] ?? "";
}
function markupOf(source) {
  return source
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .trim();
}

export async function runFormatSuite() {
  const suite = createSuite("format");
  const plant = prepareFormatPlant(join(rootDir, "work", "confirm"));
  try {
    for (const [tool, makeCommand, configFiles] of DEFINITIONS) {
      let command;
      try {
        command = makeCommand();
      } catch {
        suite.skip("coverage", tool, "binary unavailable");
        continue;
      }
      const dir = join(plant.dir, tool);
      rmSync(dir, { recursive: true, force: true });
      mkdirSync(join(dir, "nested"), { recursive: true });
      const target = join(dir, "nested", "Plant.svelte");
      writeFileSync(target, MESSY);
      for (const [name, content] of Object.entries(configFiles)) {
        writeFileSync(join(dir, name), content);
      }
      const shell = process.platform === "win32" && command.bin.endsWith(".cmd");

      await suite.run("coverage", tool, () => {
        runCommand(command.bin, command.args, {
          cwd: dir,
          shell,
          allowNonZeroExit: true,
        });
        const after = readFileSync(target, "utf8");
        // Markup coverage
        assert.notEqual(
          markupOf(after),
          markupOf(MESSY),
          "markup block was not formatted",
        );
        assert.ok(markupOf(after).length > 0, "markup vanished");
        // Script coverage
        assert.notEqual(
          scriptOf(after),
          scriptOf(MESSY),
          "<script> block was not formatted",
        );
        // Style coverage
        assert.notEqual(
          styleOf(after),
          styleOf(MESSY),
          "<style> block was not formatted",
        );
        // Semantic preservation
        assert.match(after, /\{count\}/, "template interpolation lost");
        assert.match(after, /onclick/, "event handler lost");
        assert.match(after, /bump\(/, "script function lost");
        assert.match(after, /color:\s*red/i, "style declaration lost");
      });

      await suite.run("idempotence", tool, () => {
        const once = readFileSync(target, "utf8");
        runCommand(command.bin, command.args, {
          cwd: dir,
          shell,
          allowNonZeroExit: true,
        });
        const twice = readFileSync(target, "utf8");
        assert.equal(twice, once, "second exact formatter pass was not idempotent");
      });

      await suite.run("parseable", tool, async () => {
        const formatted = readFileSync(target, "utf8");
        const { compile } = await import("svelte/compiler");
        const result = compile(formatted, {
          filename: "Plant.svelte",
          generate: "client",
          dev: false,
          css: "external",
        });
        assert.equal(
          result?.errors?.length ?? 0,
          0,
          `formatted file no longer compiles: ${result?.errors?.[0]?.message}`,
        );
      });
    }
  } finally {
    plant.cleanup();
  }
  return suite.results;
}
