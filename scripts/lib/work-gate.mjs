/**
 * Validation gates for benchmark rows.
 *
 * A failed gate never hides a measurement. It changes the row to unranked so
 * its time remains inspectable without being compared as equivalent work.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { runCommand } from "./timing.mjs";
import { writeEnvDTs, writeSvelteConfig, writeTsconfig } from "./fixtures.mjs";

/** Script-block plant: plain TS assignment error in <script lang="ts">. */
const BAD_SCRIPT_SVELTE = `<script lang="ts">
// plant: string assigned to number
const n: number = "not-a-number"
</script>

<div>{n}</div>
`;

/** Script is clean; the error exists only in Svelte markup. */
const BAD_TEMPLATE_SVELTE = `<script lang="ts">
const disabledFlag: string = "yes"
</script>

<button type="button" disabled={disabledFlag}>go</button>
`;

/** Corpus plant: both failure modes in one file. */
const BAD_CORPUS_SVELTE = `<script lang="ts">
const n: number = "not-a-number"
const disabledFlag: string = "yes"
</script>

<button type="button" disabled={disabledFlag}>{n}</button>
`;

/** Lint plant: {@html} should trip svelte/no-at-html-tags or an equivalent rule. */
const DIRTY_SVELTE = `<script>
const html = "<b>x</b>"
</script>

<div>{@html html}</div>
`;

/** Every Svelte block is intentionally badly formatted. */
const MESSY_FORMAT_SVELTE = `<script>
let    count=0
const label =  'hello'
</script>

<button    class="x"   on:click={()=>count+=1}>{  label } {count}</button>

<style>
.x{color:red}
</style>
`;

const ANSI_ESCAPE_RE =
  // eslint-disable-next-line no-control-regex
  /\u001B\][\s\S]*?(?:\u0007|\u001B\\)|\u001B\[[0-9;?]*[ -\/]*[@-~]|\u001B[@-Z\\-_]/g;

function markupOf(source) {
  return source
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .trim();
}

/** Append markup whose spacing every whole-SFC formatter should normalize. */
export function dirtyForCoverage(source) {
  return `${source.trimEnd()}\n\n<div    data-bench-coverage = "true"  > coverage </div>\n`;
}

/** Add a template diagnostic to every Svelte file in a lint census corpus. */
export function plantForCoverage(source) {
  return `${source.trimEnd()}\n\n<div>{@html '<b>coverage-plant</b>'}</div>\n`;
}

/**
 * Enforce that each row processed the full corpus in an untimed census pass.
 * Explicit-list APIs are annotated as coverage-by-construction.
 */
export function applyFileCoverageGate(
  results,
  coverage,
  { verb = "processed", what = "corpus files" } = {},
) {
  for (const row of results) {
    const census = coverage.get(row.id);
    if (!census) continue;
    const prefix = row.notes ? `${row.notes} | ` : "";
    if (census.covered == null) {
      if (row.status === "ok") {
        row.status = "unranked";
        row.throughput = "n/a";
      }
      row.notes = `${prefix}⚠ FILE COVERAGE UNVERIFIED — census failed${census.error ? ` (${census.error})` : ""}; without proof that the same file set was ${verb}, this row is not ranked.`;
      continue;
    }
    if (census.byConstruction) {
      row.notes = `${prefix}ⓘ file coverage by construction: the invocation receives all ${census.corpus} corpus files as an explicit list.`;
      continue;
    }
    if (census.covered < census.corpus) {
      if (row.status === "ok") {
        row.status = "unranked";
        row.throughput = "n/a";
        row.notes = `${prefix}⚠ FAILED FILE-COVERAGE GATE — ${verb} ${census.covered}/${census.corpus} ${what}. A smaller file set is a different job, not a faster result.`;
      } else {
        row.notes = `${prefix}ⓘ file-coverage census: ${verb} ${census.covered}/${census.corpus} ${what}.`;
      }
    } else {
      row.notes = `${prefix}ⓘ file coverage verified: ${verb} ${census.covered}/${census.corpus} ${what}.`;
    }
  }
  return results;
}

/** Count corpus-relative filenames mentioned by a CLI reporter. */
export function countCoveredFiles(output, files, { absPrefix = null } = {}) {
  const text = String(output)
    .replace(ANSI_ESCAPE_RE, "")
    .replace(/\\/g, "/")
    .replace(/\/{2,}/g, "/");
  const prefix = absPrefix
    ? absPrefix
        .replace(/\\/g, "/")
        .replace(/\/{2,}/g, "/")
        .replace(/\/+$/, "")
    : null;
  let covered = 0;
  const missing = [];
  for (const file of files) {
    const rel = file.replace(/\\/g, "/");
    const escaped = rel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const boundary = new RegExp(`(^|[^\\w/.-])${escaped}`, "m");
    if (
      boundary.test(text) ||
      text.includes(`./${rel}`) ||
      (prefix && text.includes(`${prefix}/${rel}`))
    ) {
      covered += 1;
    } else missing.push(rel);
  }
  return { covered, missing };
}

/** Root for per-tool format probes; the Svelte file is nested deliberately. */
export function prepareFormatPlant(workRoot) {
  const dir = join(
    workRoot,
    `plant-format-${process.pid}-${Date.now().toString(36)}`,
  );
  mkdirSync(dir, { recursive: true });
  return {
    dir,
    file: join("nested", "Messy.svelte"),
    cleanup: () =>
      rmSync(dir, {
        recursive: true,
        force: true,
        maxRetries: 10,
        retryDelay: 50,
      }),
  };
}

/** True only when a formatter rewrites Svelte markup, not merely <script>. */
export function formatterRewritesMarkup(
  plant,
  { bin, args, label, shell = false, env = {}, configFiles = {} },
) {
  if (!bin || !plant?.dir) return false;
  const dir = join(plant.dir, label);
  try {
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const target = join(dir, plant.file);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, MESSY_FORMAT_SVELTE);
    for (const [name, content] of Object.entries(configFiles)) {
      writeFileSync(join(dir, name), content);
    }
    const before = markupOf(MESSY_FORMAT_SVELTE);
    runCommand(bin, args, { cwd: dir, shell, env, allowNonZeroExit: true });
    const after = markupOf(readFileSync(target, "utf8"));
    return before.length > 0 && after.length > 0 && after !== before;
  } catch {
    return false;
  }
}

function writeMiniProject(dir, source, filename = "Plant.svelte") {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, filename), source);
  writeEnvDTs(dir);
  writeTsconfig(dir, { include: [filename, "env.d.ts"] });
  writeSvelteConfig(dir);
  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify({ private: true, type: "module", name: "plant" }, null, 2)}\n`,
  );
  return dir;
}

export function prepareTypecheckPlant(workRoot) {
  const base = join(workRoot, "plant-typecheck");
  return {
    script: writeMiniProject(join(base, "script"), BAD_SCRIPT_SVELTE),
    template: writeMiniProject(join(base, "template"), BAD_TEMPLATE_SVELTE),
    corpusFile: BAD_CORPUS_SVELTE,
  };
}

export function prepareLintPlant(workRoot) {
  const dir = join(
    workRoot,
    `plant-lint-${process.pid}-${Date.now().toString(36)}`,
  );
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const dirtyFile = join(dir, "Dirty.svelte");
  writeFileSync(dirtyFile, DIRTY_SVELTE);
  writeFileSync(
    join(dir, "eslint.config.mjs"),
    `import svelte from "eslint-plugin-svelte";
export default [
  ...svelte.configs["flat/recommended"],
  { files: ["**/*.svelte"], rules: { "svelte/no-at-html-tags": "error" } },
];
`,
  );
  return {
    dir,
    dirtyFile,
    cleanup: () =>
      rmSync(dir, {
        recursive: true,
        force: true,
        maxRetries: 10,
        retryDelay: 50,
      }),
  };
}

export function prepareCorpusPlant(
  checkDir,
  plantSource,
  filename = "_plant.svelte",
) {
  writeFileSync(join(checkDir, filename), plantSource);
  return filename;
}

/** Mark variants unranked when the callback returns false. */
export async function applyWorkGate(variants, gateFn) {
  for (const variant of variants) {
    if (variant.skip) continue;
    try {
      const ok = await gateFn(variant);
      if (!ok) {
        variant.unranked = true;
        variant.notes = `${variant.notes ? `${variant.notes} | ` : ""}⚠ FAILED VALIDATION — planted issue or markup work not observed`;
      }
    } catch (error) {
      variant.unranked = true;
      variant.notes = `${variant.notes ? `${variant.notes} | ` : ""}⚠ gate error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
  return variants;
}

/** Run a typecheck CLI against a plant directory and require diagnostic-like output. */
export function typecheckOutputReportsPlant(
  text,
  mustMention = "Plant.svelte",
) {
  const operationalFailure =
    /execution failed|failed to spawn|not a valid Win32 application|ENOENT|Cannot find module|unknown option|invalid option/i.test(
      text,
    );
  const mentionsPlant =
    !mustMention || text.toLowerCase().includes(mustMention.toLowerCase());
  const hasDiag =
    /TS\d{4}/.test(text) ||
    /Type 'string' is not assignable/i.test(text) ||
    /not assignable to type/i.test(text) ||
    /expected (?:a )?boolean/i.test(text) ||
    /Plant\.svelte:\d+/i.test(text) ||
    /_plant\.svelte:\d+/i.test(text);
  return !operationalFailure && mentionsPlant && hasDiag;
}

export function typecheckCliReportsError(
  bin,
  args,
  cwd,
  env = {},
  mustMention = "Plant.svelte",
) {
  const result = runCommand(bin, args, {
    cwd,
    env,
    allowNonZeroExit: true,
    shell: process.platform === "win32" && bin.endsWith(".cmd"),
  });
  const text = `${result.stdout}\n${result.stderr}`;
  return { ok: typecheckOutputReportsPlant(text, mustMention), result };
}

export function typecheckGateDetail({ script, template, corpus }) {
  return `gate: script=${script ? "✓" : "✗"} tmpl=${template ? "✓" : "✗"} corpus=${corpus ? "✓" : "✗"}`;
}

export function lintOutputReportsPlant(
  text,
  { filename, diagnostic, status = 1 },
) {
  const operationalFailure =
    ![0, 1].includes(status) ||
    /unknown (?:argument|option)|unrecognized option|failed to (?:spawn|start|load)|panic|backtrace|ENOENT|usage:/i.test(
      text,
    );
  const namesPlant = filename
    ? text.toLowerCase().includes(filename.toLowerCase())
    : false;
  const reportsDiagnostic =
    typeof diagnostic === "string"
      ? text.includes(diagnostic)
      : diagnostic?.test(text);
  return !operationalFailure && namesPlant && Boolean(reportsDiagnostic);
}

export function cliReportsPlantedIssue(bin, args, cwd, expected) {
  const result = runCommand(bin, args, {
    cwd,
    allowNonZeroExit: true,
    shell: process.platform === "win32" && bin.endsWith(".cmd"),
  });
  const text = `${result.stdout}\n${result.stderr}`;
  return lintOutputReportsPlant(text, { ...expected, status: result.status });
}
