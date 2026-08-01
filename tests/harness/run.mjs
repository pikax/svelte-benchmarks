#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyFileCoverageGate,
  applyWorkGate,
  countCoveredFiles,
  dirtyForCoverage,
  lintOutputReportsPlant,
  plantForCoverage,
  typecheckOutputReportsPlant,
} from "../../scripts/lib/work-gate.mjs";
import {
  NOISE_CV_LIMIT_PCT,
  renderSurfaceMarkdown,
} from "../../scripts/lib/report.mjs";
import { measureVariants } from "../../scripts/lib/timing.mjs";
import { buildMemoryTasks } from "../../scripts/lib/memory-tasks.mjs";
import { renderMemoryMarkdown } from "../../scripts/lib/memory-report.mjs";
import { censusVerdict } from "../../scripts/lib/surfaces/vite.mjs";
import { isLintExitOperationalFailure } from "../../scripts/lib/surfaces/lint.mjs";
import {
  splitDetails,
  stripReportMeta,
  summarizeReport,
  validateRealWorldArtifacts,
} from "../../scripts/update-readme.mjs";
import { REAL_WORLD_PROJECTS } from "../../scripts/lib/real-world/projects.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");
const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

test("file coverage gate unranks a partial corpus", () => {
  const rows = [
    { id: "full", status: "ok", throughput: "10 files/s", notes: "full" },
    { id: "partial", status: "ok", throughput: "20 files/s", notes: "partial" },
    {
      id: "explicit",
      status: "ok",
      throughput: "5 files/s",
      notes: "explicit",
    },
  ];
  const coverage = new Map([
    ["full", { covered: 10, corpus: 10 }],
    ["partial", { covered: 9, corpus: 10 }],
    ["explicit", { covered: 10, corpus: 10, byConstruction: true }],
  ]);
  applyFileCoverageGate(rows, coverage);
  assert.equal(rows[0].status, "ok");
  assert.match(rows[0].notes, /10\/10/);
  assert.equal(rows[1].status, "unranked");
  assert.equal(rows[1].throughput, "n/a");
  assert.match(rows[1].notes, /different job/i);
  assert.match(rows[2].notes, /by construction/i);
});

test("coverage filename matching does not confuse repeated basenames", () => {
  const files = ["index.svelte", "nested/index.svelte", "nested/Card.svelte"];
  const output = "nested/index.svelte\nC:/tmp/census/nested/Card.svelte";
  const result = countCoveredFiles(output, files, {
    absPrefix: "C:/tmp/census",
  });
  assert.equal(result.covered, 2);
  assert.deepEqual(result.missing, ["index.svelte"]);
  assert.equal(
    countCoveredFiles("./index.svelte", ["index.svelte"]).covered,
    1,
  );
});

test("coverage plants make formatter and linter work observable", () => {
  const source = "<script>const x = 1</script>\n<p>{x}</p>\n";
  const dirty = dirtyForCoverage(source);
  assert.notEqual(dirty, source);
  assert.match(dirty, /data-bench-coverage\s+=\s+"true"/);
  assert.ok(dirty.indexOf("data-bench-coverage") > dirty.indexOf("<p>"));
  assert.match(plantForCoverage(source), /@html/);
});

test("lint plants reject help text and require the exact file and rule", () => {
  const expected = {
    filename: "Dirty.svelte",
    diagnostic: /\{@html\}[^\n]*can lead to XSS attack/i,
  };
  assert.equal(
    lintOutputReportsPlant(
      "WARNING Dirty.svelte:2:1: `{@html}` can lead to XSS attack.",
      expected,
    ),
    true,
  );
  assert.equal(
    lintOutputReportsPlant("Usage: linter --security --html", expected),
    false,
  );
  assert.equal(
    lintOutputReportsPlant(
      "Other.svelte: `{@html}` can lead to XSS attack.",
      expected,
    ),
    false,
  );
});

test("failed work gates preserve rows but mark them unranked", async () => {
  const variants = [{ id: "no-op", notes: "candidate" }];
  await applyWorkGate(variants, () => false);
  assert.equal(variants[0].unranked, true);
  assert.match(variants[0].notes, /FAILED VALIDATION/);
});

test("typecheck gates reject backend startup failures", () => {
  assert.equal(
    typecheckOutputReportsPlant(
      "ERROR (ts): TypeScript compiler execution failed: failed to spawn TypeScript compiler",
    ),
    false,
  );
  assert.equal(
    typecheckOutputReportsPlant(
      "Plant.svelte:2:7 Error: Type 'string' is not assignable to type 'number'.",
    ),
    true,
  );
});

function row(overrides = {}) {
  return {
    id: "row",
    label: "candidate",
    status: "ok",
    medianMs: 10,
    minMs: 1,
    stddevMs: 9,
    cvPct: NOISE_CV_LIMIT_PCT + 1,
    runs: [1, 10, 100],
    throughput: "100 files/s",
    ...overrides,
  };
}

test("three-sample rows above the CV ceiling are rendered unranked", async () => {
  let call = 0;
  const samples = [1, 1, 10, 100];
  const variants = await measureVariants(
    [
      {
        id: "candidate",
        label: "candidate",
        measure: () => samples[call++],
      },
    ],
    { runs: 3, warmups: 1, fileCount: 1 },
  );
  const markdown = renderSurfaceMarkdown({
    id: "test",
    label: "Test",
    files: 1,
    bytes: 1,
    variants,
    methodology: [],
  });
  assert.match(markdown, /TOO NOISY TO RANK — CV/);
  assert.match(markdown, /not ranked/);
  assert.doesNotMatch(markdown, /\| \*\*10\.0 ms\*\* \|/);
});

test("two-sample noisy rows are flagged but remain ranked", () => {
  const markdown = renderSurfaceMarkdown({
    id: "test",
    label: "Test",
    files: 1,
    bytes: 1,
    variants: [row({ runs: [1, 100] })],
    methodology: [],
  });
  assert.doesNotMatch(markdown, /TOO NOISY TO RANK — CV/);
  assert.match(markdown, /\*\*10\.0 ms\*\*/);
});

test("README summaries retain tables and move details out", () => {
  const report = `## Benchmark Results

- **Generated:** now

### Tool versions

| Package | Version |
| --- | --- |
| tool | 1 |

### Methodology notes

- note

### Format

Files: **1** · Bytes: **2**

| Tool | Median |
| --- | ---: |
| tool | 1 ms |

<details><summary>Notes</summary>

- private detail

</details>`;
  assert.match(stripReportMeta(report), /^### Format/);
  assert.equal(splitDetails(report).removed, 1);
  const { summary, removed } = summarizeReport(report);
  assert.equal(removed, 1);
  assert.match(summary, /\| tool \| 1 ms \|/);
  assert.doesNotMatch(summary, /Generated|private detail|Tool versions/);
});

test("real-world publishing rejects partial and failed batches", () => {
  const dir = mkdtempSync(join(tmpdir(), "svelte-bench-publish-"));
  const files = [];
  try {
    for (const project of REAL_WORLD_PROJECTS) {
      const markdown = join(dir, `real-world-Linux-${project.id}.md`);
      const json = markdown.replace(/\.md$/, ".json");
      const data = {
        kind: "real-world",
        surfaceFailures: [],
        settings: {
          fileLimit: null,
          runs: 5,
          surfaces: ["compile", "projection", "format", "lint"],
        },
        corpora: [{ selector: project.id }],
        surfaces: [{}, {}, {}, {}],
      };
      writeFileSync(markdown, "# result\n");
      writeFileSync(json, JSON.stringify(data));
      files.push(markdown);
    }
    assert.throws(
      () => validateRealWorldArtifacts(files.slice(0, 1)),
      /refusing partial real-world publication/,
    );
    assert.doesNotThrow(() => validateRealWorldArtifacts(files));

    const failedJson = files[0].replace(/\.md$/, ".json");
    const failed = JSON.parse(readFileSync(failedJson, "utf8"));
    failed.surfaceFailures.push({ surface: "lint" });
    writeFileSync(failedJson, JSON.stringify(failed));
    assert.throws(
      () => validateRealWorldArtifacts(files),
      /contains failed surface cells/,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("fairness wiring remains fail-closed", () => {
  const format = readFileSync(
    join(rootDir, "scripts/lib/surfaces/format.mjs"),
    "utf8",
  );
  const typecheck = readFileSync(
    join(rootDir, "scripts/lib/surfaces/typecheck.mjs"),
    "utf8",
  );
  const compile = readFileSync(
    join(rootDir, "scripts/lib/surfaces/compile.mjs"),
    "utf8",
  );
  assert.match(format, /\*\*\/\*\.svelte/);
  assert.match(format, /applyFileCoverageGate/);
  assert.doesNotMatch(format, /allowNonZeroExit/);
  assert.equal(
    (typecheck.match(/script\.ok && template\.ok && corpus\.ok/g) ?? []).length,
    5,
  );
  assert.match(compile, /persistent cross-run cache/);
  assert.match(compile, /unranked: true/);
  assert.match(compile, /svelteRuntimeGate/);
  const wasmMeasured = compile.slice(
    compile.indexOf("id: `rsvelte-wasm-1t-"),
    compile.indexOf("// --- @rsvelte/vite-plugin-svelte-native"),
  );
  assert.match(wasmMeasured, /measure:[\s\S]*\.\.\.runesOption/);
});

test("unequal lint and metadata APIs use separate classes", () => {
  const lint = readFileSync(
    join(rootDir, "scripts/lib/surfaces/lint.mjs"),
    "utf8",
  );
  for (const comparisonClass of [
    "eslint-recommended-rules",
    "rsvelte-native-rules",
    "verter-native-diagnostics",
  ]) {
    assert.match(lint, new RegExp(`comparisonClass: "${comparisonClass}"`));
  }

  const componentMeta = readFileSync(
    join(rootDir, "scripts/lib/surfaces/component-meta.mjs"),
    "utf8",
  );
  for (const comparisonClass of [
    "sveld-resolve-types-project",
    "svelte-docinfo-files-no-dependencies",
    "verter-framework-surface",
  ]) {
    assert.match(componentMeta, new RegExp(`"${comparisonClass}"`));
  }
});

test("real-world compile selection and publishing fail closed", () => {
  const selector = readFileSync(
    join(rootDir, "scripts/run-real-world-surface.mjs"),
    "utf8",
  );
  const compile = readFileSync(
    join(rootDir, "scripts/lib/surfaces/compile.mjs"),
    "utf8",
  );
  const orchestrator = readFileSync(
    join(rootDir, "scripts/bench-real-world.mjs"),
    "utf8",
  );
  const workflow = readFileSync(
    join(rootDir, ".github/workflows/benchmark-real-world.yml"),
    "utf8",
  );
  assert.match(selector, /comparisonFiles/);
  assert.match(selector, /excludedByClass/);
  assert.match(compile, /compileFilesByClass/);
  assert.match(compile, /primarySources/);
  assert.match(compile, /mrwaipSources/);
  assert.match(orchestrator, /process\.exitCode = 1/);
  const publisher = workflow.slice(workflow.indexOf("  update-readme:"));
  assert.match(publisher, /needs\.project\.result == 'success'/);
  assert.doesNotMatch(publisher, /if: always\(\)/);
});

test("LSP readiness timing has no fixed pre-hover floor", () => {
  const lsp = readFileSync(
    join(rootDir, "scripts/lib/surfaces/lsp.mjs"),
    "utf8",
  );
  const interval = lsp.slice(
    lsp.indexOf("const openStart"),
    lsp.indexOf("const openToHoverMs"),
  );
  assert.doesNotMatch(interval, /setTimeout\(r, 50\)/);
});

test("real-world registry is pinned and covers the requested projects", () => {
  assert.deepEqual(
    REAL_WORLD_PROJECTS.map((project) => project.id),
    [
      "carbon-components-svelte",
      "platform",
      "open-webui",
      "flowbite-svelte",
      "smui",
    ],
  );
  for (const project of REAL_WORLD_PROJECTS) {
    assert.match(project.sha, /^[a-f0-9]{40}$/);
    assert.ok(project.corpora.some((corpus) => corpus.default));
    assert.ok(project.corpora.every((corpus) => corpus.approxFiles > 0));
  }
});

test("new workloads preserve comparison boundaries", () => {
  const projection = readFileSync(
    join(rootDir, "scripts/lib/surfaces/projection.mjs"),
    "utf8",
  );
  const componentMeta = readFileSync(
    join(rootDir, "scripts/lib/surfaces/component-meta.mjs"),
    "utf8",
  );
  const realWorld = readFileSync(
    join(rootDir, "scripts/bench-real-world.mjs"),
    "utf8",
  );
  assert.match(
    projection,
    /differs structurally from official svelte2tsx output/,
  );
  assert.match(projection, /ensureIdeCompiled/);
  assert.match(projection, /comparisonClass: "verter-ide-projection"/);
  assert.match(projection, /lost unique fixture marker/);
  assert.match(componentMeta, /target: resolveTypes \? "semantic" : "ast"/);
  assert.match(componentMeta, /comparisonClass: "verter-framework-surface"/);
  assert.match(componentMeta, /frameworkAdapterId: "svelte"/);
  assert.match(componentMeta, /FrameworkSurfaceKind\.PROPS/);
  assert.match(componentMeta, /propMismatches/);
  assert.match(realWorld, /source-only/i);
  assert.doesNotMatch(realWorld, /project-build|project-test/);

  const packageJson = JSON.parse(
    readFileSync(join(rootDir, "package.json"), "utf8"),
  );
  assert.match(packageJson.scripts["bench:real-world:full"], /--runs 5/);
});

test("singleton comparison classes do not imply a fastest result", () => {
  const report = renderSurfaceMarkdown({
    id: "singleton",
    label: "Singleton",
    files: 1,
    bytes: 1,
    variants: [
      {
        id: "only",
        label: "only",
        status: "ok",
        comparisonClass: "solo",
        medianMs: 10,
        minMs: 10,
        stddevMs: 0,
        cvPct: 0,
        runs: [10],
        throughput: "100 files/s",
      },
    ],
    methodology: [],
  });
  assert.doesNotMatch(report, /1\.00x|100 files\/s/);
  assert.match(report, /\| — \|/);
});

test("Vue-only JSX workload wiring cannot return", () => {
  const wiring = [
    "package.json",
    "scripts/bench.mjs",
    "scripts/generate.mjs",
    "scripts/lib/surfaces/compile.mjs",
    "scripts/e2e-vscode/run.mjs",
    "scripts/e2e-vscode/suite/bench.test.cjs",
  ]
    .map((file) => readFileSync(join(rootDir, file), "utf8"))
    .join("\n");
  assert.doesNotMatch(wiring, /jsx-compile|jsx-templates|fixtures[\\/]jsx/i);
  assert.doesNotMatch(wiring, /Vue\.volar|ubugeeei\.vize/i);
  assert.doesNotMatch(wiring, /forceVapor/);
});

test("timing results preserve explicit comparison classes", async () => {
  const [row] = await measureVariants(
    [
      {
        id: "versioned",
        label: "versioned",
        comparisonClass: "svelte-5.56.4",
        measure: () => 1,
      },
    ],
    { runs: 1, warmups: 1, fileCount: 1 },
  );
  assert.equal(row.comparisonClass, "svelte-5.56.4");
});

test("incomplete execution-position coverage is never ranked", async () => {
  const rows = await measureVariants(
    ["a", "b", "c"].map((id, index) => ({
      id,
      label: id,
      fileCount: index + 1,
      measure: () => 1,
    })),
    { runs: 2, warmups: 1, fileCount: 99 },
  );
  assert.ok(rows.every((row) => row.status === "unranked"));
  assert.ok(rows.every((row) => /INCOMPLETE ORDER COVERAGE/.test(row.notes)));
  assert.deepEqual(
    rows.map((row) => row.files),
    [1, 2, 3],
  );
});

test("high-CV exclusion is serialized before report rendering", async () => {
  let call = 0;
  const samples = [1, 10, 100, 1];
  const [measured] = await measureVariants(
    [
      {
        id: "noisy",
        label: "noisy",
        measure: () => samples[call++],
      },
    ],
    { runs: 3, warmups: 1, fileCount: 1 },
  );
  assert.equal(measured.status, "unranked");
  assert.equal(measured.throughput, "n/a");
  assert.match(measured.notes, /TOO NOISY TO RANK/);
});

test("memory tasks isolate comparable Svelte workloads", () => {
  const dir = mkdtempSync(join(tmpdir(), "svelte-bench-memory-"));
  try {
    writeFileSync(
      join(dir, "Probe.svelte"),
      "<script>let count = $state(0)</script><button>{count}</button>\n",
    );
    const tasks = buildMemoryTasks(dir, { fileLimit: 1 });
    assert.equal(tasks.filter((task) => !task.skip).length, 8);
    assert.deepEqual(
      tasks
        .filter(
          (task) => task.comparisonClass === "svelte-5.56.8-client-production",
        )
        .map((task) => task.payload.implementation),
      ["svelte", "rsvelte-wasm", "rsvelte-native"],
    );
    assert.deepEqual(
      tasks
        .filter((task) => task.comparisonClass === "svelte2tsx-compatible")
        .map((task) => task.payload.implementation),
      ["svelte2tsx", "rsvelte-svelte2tsx"],
    );
    assert.match(
      tasks.find((task) => task.id === "memory-verter-compile").skip,
      /no public Svelte runtime compile API/i,
    );
    assert.ok(
      tasks
        .filter((task) => task.payload)
        .every(
          (task) => task.payload.files[0].path === join(dir, "Probe.svelte"),
        ),
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("memory reporting never turns CPU context into a speed ranking", () => {
  const markdown = renderMemoryMarkdown({
    generatedAt: "now",
    fixture: "fixtures/1",
    fileCount: 1,
    settings: { samples: 1 },
    runner: { platform: "linux", arch: "x64", node: "v26" },
    rows: [
      {
        label: "candidate",
        surface: "compile",
        comparisonClass: "same-work",
        status: "ok",
        samples: [
          {
            peakRssDeltaMb: 10,
            retainedRssDeltaMb: 5,
            retainedHeapDeltaMb: 2,
            cpuMs: 1,
            gate: "1/1 outputs passed",
          },
        ],
      },
    ],
  });
  assert.match(markdown, /Peak RSS/);
  assert.match(markdown, /CPU is context only, not a speed ranking/);
  assert.doesNotMatch(markdown, /fastest|1\.00x|files\/s/i);
});

test("memory CI uses isolated workers and fail-closed publication", () => {
  const runner = readFileSync(
    join(rootDir, "scripts/bench-memory.mjs"),
    "utf8",
  );
  const worker = readFileSync(
    join(rootDir, "scripts/memory-worker.mjs"),
    "utf8",
  );
  const publisher = readFileSync(
    join(rootDir, "scripts/update-memory-readme.mjs"),
    "utf8",
  );
  const workflow = readFileSync(
    join(rootDir, ".github/workflows/benchmark.yml"),
    "utf8",
  );
  assert.match(runner, /spawnSync\(\s*process\.execPath/);
  assert.match(runner, /"--expose-gc"/);
  assert.match(worker, /measureMemory/);
  assert.match(worker, /passed runtime and marker gates/);
  assert.match(publisher, /fewer than three isolated samples/);
  assert.match(publisher, /runner\?\.platform !== "linux"/);
  assert.match(workflow, /needs: \[bench, memory\]/);
  assert.match(workflow, /BENCH_PHASE: memory/);
});

test("Vite integration surfaces share one stack and fail closed on coverage", () => {
  const exact = censusVerdict(
    new Map([
      ["A.svelte", { bytes: 10, runtime: true }],
      ["B.svelte", { bytes: 10, runtime: true }],
    ]),
    ["A.svelte", "B.svelte"],
  );
  assert.deepEqual(exact, {
    exact: true,
    runtime: true,
    covered: 2,
    expected: 2,
  });
  assert.equal(
    censusVerdict(new Map([["A.svelte", { bytes: 10, runtime: true }]]), [
      "A.svelte",
      "B.svelte",
    ]).exact,
    false,
  );

  const packageJson = JSON.parse(
    readFileSync(join(rootDir, "package.json"), "utf8"),
  );
  assert.equal(packageJson.dependencies.vite, "7.3.6");
  assert.equal(
    packageJson.dependencies["@sveltejs/vite-plugin-svelte"],
    "6.2.4",
  );
  assert.equal(
    packageJson.dependencies["@rsvelte/vite-plugin-svelte"],
    "0.5.0",
  );
  assert.match(packageJson.scripts["bench:bundle"], /--surfaces bundle/);
  assert.match(packageJson.scripts["bench:hmr"], /--surfaces hmr/);

  const surface = readFileSync(
    join(rootDir, "scripts/lib/surfaces/vite.mjs"),
    "utf8",
  );
  assert.match(
    surface,
    /incremental transform did not contain the changed marker/,
  );
  assert.match(surface, /not labeled an end-to-end HMR round trip/);
  assert.doesNotMatch(surface, /@vitejs\/plugin-vue|\.vue\b/);
});

test("lint CLI diagnostic exits are allowed but operational exits fail", () => {
  assert.equal(isLintExitOperationalFailure(0), false);
  assert.equal(isLintExitOperationalFailure(1), false);
  assert.equal(isLintExitOperationalFailure(2), true);
  assert.equal(isLintExitOperationalFailure(3), true);
  assert.equal(isLintExitOperationalFailure(null), true);
  const lint = readFileSync(
    join(rootDir, "scripts/lib/surfaces/lint.mjs"),
    "utf8",
  );
  assert.match(lint, /runLintCommand\(eslintBin/);
  assert.match(lint, /runLintCommand\(rsvelteLint/);
});

let passed = 0;
for (const { name, fn } of tests) {
  try {
    await fn();
    passed += 1;
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

if (process.exitCode) {
  console.error(`\n${passed}/${tests.length} harness tests passed.`);
} else {
  console.log(`\n${passed} harness tests passed.`);
}
