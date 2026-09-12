/**
 * Typecheck confirmation: planted Svelte 5 typing errors, scored on evidence
 * AT the planted location — "the tool printed an error somewhere" is not a
 * diagnosis. One combined project per tool (one spawn) to keep the matrix
 * affordable; clean plants must stay clean in their file.
 */
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createSuite } from "../lib/harness.mjs";
import {
  findExpectErrorPins,
  parseDiagnostics,
  scoreDiagnostics,
} from "../lib/diagnostics.mjs";
import { resolveBin, runCommand } from "../../../scripts/lib/timing.mjs";
import { resolveTsgoBin, withTsgoEnv } from "../../../scripts/lib/tsgo.mjs";
import {
  writeEnvDTs,
  writeSvelteConfig,
  writeTsconfig,
} from "../../../scripts/lib/fixtures.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/** Each case: file + expected diagnostics (error with pins) or clean. */
const CASES = [
  {
    id: "script-type-error",
    expect: "error",
    mustMention: ["string", "number"],
    source: `<script lang="ts">
  // @plant-error
  const count: number = "not-a-number";
</script>

<p>{count}</p>
`,
  },
  {
    id: "template-wrong-boolean",
    expect: "error",
    source: `<script lang="ts">
  const flag: string = "yes";
</script>

<!-- @plant-error -->
<button type="button" disabled={flag}>go</button>
`,
  },
  {
    id: "missing-required-prop",
    expect: "error",
    child: `<script lang="ts">
  let { title }: { title: string } = $props();
</script>

<h2>{title}</h2>
`,
    app: `<script lang="ts">
  import Child from './Child.svelte';
</script>

<!-- @plant-error -->
<Child />
`,
  },
  {
    id: "wrong-prop-type",
    expect: "error",
    child: `<script lang="ts">
  let { count }: { count: number } = $props();
</script>

<p>{count}</p>
`,
    app: `<script lang="ts">
  import Child from './Child.svelte';
</script>

<!-- @plant-error -->
<Child count="many" />
`,
  },
  {
    id: "unknown-prop",
    expect: "error",
    child: `<script lang="ts">
  let { name }: { name: string } = $props();
</script>

<p>{name}</p>
`,
    app: `<script lang="ts">
  import Child from './Child.svelte';
</script>

<!-- @plant-error -->
<Child name="ok" extraProp={1} />
`,
  },
  {
    id: "callback-prop-type",
    expect: "error",
    child: `<script lang="ts">
  let { onPing }: { onPing: (n: number) => void } = $props();
</script>

<button onclick={() => onPing(1)}>ping</button>
`,
    app: `<script lang="ts">
  import Child from './Child.svelte';
</script>

<!-- @plant-error -->
<Child onPing={(label) => label.toUpperCase()} />
`,
  },
  {
    id: "snippet-parameter-type",
    expect: "error",
    source: `<script lang="ts">
  let { label }: { label: string } = $props();
</script>

{#snippet cell(value: number)}
  <td>{label}:{value}</td>
{/snippet}

<!-- @plant-error -->
<tr>{@render cell("not-a-number")}</tr>
`,
  },
  {
    id: "each-destructuring-type",
    expect: "error",
    source: `<script lang="ts">
  const points: Array<[number, number]> = [[1, 2]];
</script>

{#each points as [x, y] (x)}
  <!-- @plant-error -->
  <li>{x * y * "scale"}</li>
{/each}
`,
  },
  {
    id: "discriminated-union-narrowing",
    expect: "error",
    mustMention: ["radius"],
    source: `<script lang="ts">
  type Shape =
    | { kind: 'circle'; radius: number }
    | { kind: 'square'; size: number };
  const shape: Shape = { kind: 'square', size: 3 };
  // @plant-error
  const area = Math.PI * shape.radius ** 2;
</script>

<p>{area.toFixed(2)}</p>
`,
  },
  {
    id: "store-type-flow",
    expect: "error",
    source: `<script lang="ts">
  import { writable } from 'svelte/store';
  const counter = writable(0);
</script>

<!-- @plant-error -->
<button onclick={() => counter.set("one")}>{\$counter}</button>
`,
  },
  {
    id: "each-shadow-restoration-ok",
    expect: "clean",
    source: `<script lang="ts">
  const item: string = 'outer';
  const numbers: number[] = [1, 2];
</script>

{#each numbers as item (item)}
  <p data-numbers>{item + 1}</p>
{/each}

<p data-restored>{item.toUpperCase()}</p>
`,
  },
  {
    id: "each-shadow-restoration-bad",
    expect: "error",
    mustMention: ["toUpperCase", "number"],
    source: `<script lang="ts">
  const item: string = 'outer';
  const numbers: number[] = [1, 2];
</script>

{#each numbers as item (item)}
  <!-- @plant-error -->
  <p>{item.toUpperCase()}</p>
{/each}

<p>{item.toUpperCase()}</p>
`,
  },
  {
    id: "snippet-shadow-restoration-ok",
    expect: "clean",
    source: `<script lang="ts">
  const item: string = 'outer';
</script>

{#snippet cell(item: number)}
  <td>{item + 1}</td>
{/snippet}

<tr>{@render cell(2)}</tr>
<p data-restored>{item.toUpperCase()}</p>
`,
  },
  {
    id: "snippet-shadow-restoration-bad",
    expect: "error",
    mustMention: ["toUpperCase", "number"],
    source: `<script lang="ts">
  const item: string = 'outer';
</script>

{#snippet cell(item: number)}
  <!-- @plant-error -->
  <td>{item.toUpperCase()}</td>
{/snippet}

<tr>{@render cell(2)}</tr>
<p>{item.toUpperCase()}</p>
`,
  },
  {
    id: "clean-component",
    expect: "clean",
    source: `<script lang="ts">
  let { title, count = 0 }: { title: string; count?: number } = $props();
  let doubled = $derived(count * 2);
</script>

<h3>{title}:{doubled}</h3>
`,
  },
  {
    id: "clean-generics",
    expect: "clean",
    source: `<script lang="ts" generics="T extends string | number">
  let { value }: { value: T } = $props();
</script>

<p>{value}</p>
`,
  },
];

const TOOLS = [
  {
    id: "svelte-check",
    bin: "svelte-check",
    args: () => [
      "--tsconfig",
      "tsconfig.json",
      "--threshold",
      "error",
      "--diagnostic-sources",
      "ts,svelte",
    ],
  },
  {
    id: "svelte-check-native",
    bin: "svelte-check-native",
    args: (dir) => [
      "--workspace",
      dir,
      "--tsconfig",
      join(dir, "tsconfig.json"),
      "--threshold",
      "error",
      "--diagnostic-sources",
      "ts,svelte",
    ],
  },
  {
    id: "svelte-check-rs",
    bin: "svelte-check-rs",
    args: (dir) => ["--workspace", dir, "--tsconfig", join(dir, "tsconfig.json")],
  },
  {
    id: "rsvelte-check",
    bin: "rsvelte-check",
    args: () => [
      "--tsconfig",
      "tsconfig.json",
      "--diagnostic-sources",
      "ts,svelte",
      ...(resolveTsgoBin(rootDir).bin ? ["--tsgo"] : []),
    ],
  },
  {
    id: "verter-tsc",
    bin: "verter-tsc",
    args: () => ["--noEmit", "-p", "tsconfig.json"],
  },
];

function stageProject(dir) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const staged = [];
  for (const testCase of CASES) {
    // Per-case subdirectory: the app imports './Child.svelte', so parent and
    // child must live alone together for that import to resolve exactly.
    const caseDir = join(dir, testCase.id);
    mkdirSync(caseDir, { recursive: true });
    const fileId = `${testCase.id}/App.svelte`;
    if (testCase.child) {
      writeFileSync(join(caseDir, "Child.svelte"), testCase.child);
      const { pins, stripped } = findExpectErrorPins(fileId, testCase.app);
      writeFileSync(join(caseDir, "App.svelte"), stripped);
      staged.push({ testCase, fileId, pins, hasChild: true });
    } else {
      const { pins, stripped } = findExpectErrorPins(fileId, testCase.source);
      writeFileSync(join(caseDir, "App.svelte"), stripped);
      staged.push({ testCase, fileId, pins });
    }
  }
  writeEnvDTs(dir);
  writeTsconfig(dir, { include: ["**/*.svelte", "env.d.ts"] });
  writeSvelteConfig(dir);
  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify({ private: true, type: "module", name: "typecheck-plants" }, null, 2)}\n`,
  );
  return staged;
}

export async function runTypecheckSuite() {
  const suite = createSuite("typecheck");
  const nodePath = [join(rootDir, "node_modules"), process.env.NODE_PATH ?? ""]
    .filter(Boolean)
    .join(process.platform === "win32" ? ";" : ":");
  const env = withTsgoEnv({ NODE_PATH: nodePath }, rootDir);
  const dir = join(rootDir, "work", "confirm", "typecheck-plants");
  const staged = stageProject(dir);

  for (const tool of TOOLS) {
    let binary;
    try {
      binary = resolveBin(tool.bin, rootDir);
    } catch {
      suite.skip("plants", tool.id, "binary unavailable");
      continue;
    }
    // ONE combined run per tool over every plant — the affordable shape of a
    // 12-case × 5-tool matrix (per-case spawns would add hundreds of
    // processes), scored per file exactly like per-case runs.
    const result = runCommand(binary, tool.args(dir), {
      cwd: dir,
      env,
      allowNonZeroExit: true,
      shell: process.platform === "win32" && binary.endsWith(".cmd"),
    });
    const text = `${result.stdout}\n${result.stderr}`;
    const operational =
      /execution failed|failed to spawn|not a valid Win32 application|ENOENT|Cannot find module|unknown option|invalid option/i.test(
        text,
      );
    const diagnostics = parseDiagnostics(text);
    for (const { testCase, fileId, pins } of staged) {
      await suite.run(testCase.id, tool.id, () => {
        assert.equal(
          operational,
          false,
          `operational failure:\n${text.slice(0, 300)}`,
        );
        const inFile = diagnostics.filter((d) =>
          String(d.file ?? "").endsWith(fileId),
        );
        if (testCase.expect === "clean") {
          assert.deepEqual(
            inFile.map((d) => `${d.line}:${d.code}:${d.message.slice(0, 60)}`),
            [],
            `clean plant produced diagnostics in ${fileId}`,
          );
          return;
        }
        const verdict = scoreDiagnostics({
          diagnostics: inFile,
          pins,
          expectErrors: 1,
          fileName: fileId,
          mustMention: testCase.mustMention ?? [],
        });
        assert.equal(
          verdict.ok,
          true,
          `${verdict.failures.join("; ")}\n(file diagnostics: ${inFile
            .map((d) => `${d.file}:${d.line}:${d.code}:${d.message.slice(0, 60)}`)
            .join(" | ") || "none"})`,
        );
      });
    }
  }
  return suite.results;
}
