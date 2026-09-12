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


/** Render-significant content: regex behavior, pre whitespace, inter-element
 * spacing, custom properties and quoted strings. The oracle compiles BOTH the
 * original and the formatted file and requires IDENTICAL server HTML — a
 * formatter that collapses significant whitespace or rewrites literals
 * changes observable output. */
const SEMANTIC_PLANT = `<script>
const pattern=/alpha+/gi
const matched=pattern.test('ALPHA')
</script>

<section data-match={matched}><pre>  alpha
    beta  </pre><span>left</span> <span>right</span><i class="q"></i></section>
<style>.q { --plant-gap: 2px; margin: var(--plant-gap); content: "keep  spacing"; }</style>
`;

async function serverHtml(source) {
  const { compile } = await import("svelte/compiler");
  const { render } = await import("svelte/server");
  const out = compile(source, {
    filename: "Semantics.svelte",
    generate: "server",
    dev: false,
    css: "external",
    runes: true,
  });
  if (out?.errors?.length) throw new Error(out.errors[0]?.message ?? "compile error");
  const { writeFileSync: wf, mkdirSync: md, rmSync: rm } = await import("node:fs");
  const { join } = await import("node:path");
  const dir = join(rootDir, "work", "confirm", "format-semantics", String(Date.now()));
  rm(dir, { recursive: true, force: true });
  md(dir, { recursive: true });
  const file = join(dir, "S.mjs");
  wf(file, out.js.code.replaceAll('"svelte/internal/server"', JSON.stringify(
    (await import("node:url")).pathToFileURL(
      (await import("node:module")).createRequire(join(rootDir, "package.json")).resolve("svelte/internal/server"),
    ).href,
  )));
  const mod = await import((await import("node:url")).pathToFileURL(file).href + "?x=" + Date.now());
  const rendered = await render(mod.default, { props: {} });
  rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  return rendered.html;
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

      await suite.run("semantics", tool, async () => {
        const messySemanticPath = join(dir, "nested", "Semantics.svelte");
        writeFileSync(messySemanticPath, SEMANTIC_PLANT);
        runCommand(command.bin, command.args, {
          cwd: dir,
          shell,
          allowNonZeroExit: true,
        });
        const before = await serverHtml(SEMANTIC_PLANT);
        const after = await serverHtml(readFileSync(messySemanticPath, "utf8"));
        assert.equal(
          after,
          before,
          "formatting changed observable rendered output (significant whitespace, literals or CSS values)",
        );
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
