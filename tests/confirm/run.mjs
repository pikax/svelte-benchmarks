#!/usr/bin/env node
/** Correctness confirmation suite. Nothing here is timed or ranked. */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import { render } from "svelte/server";
import { create, toBinary } from "@bufbuild/protobuf";
import {
  FrameworkSurfaceKind,
  GraphOperation,
  GraphProjectionMode,
  GraphReductionDemand,
  TYPEINFO_GRAPH_SCHEMA_VERSION,
  TypeInfoGraphRequestSchema,
} from "@verter/proto";
import { decodeFrameworkSurfaceResponse } from "@verter/typeinfo";
import { resolveBin, runCommand } from "../../scripts/lib/timing.mjs";
import {
  cliReportsPlantedIssue,
  formatterRewritesMarkup,
  prepareFormatPlant,
  prepareLintPlant,
  prepareTypecheckPlant,
  typecheckCliReportsError,
} from "../../scripts/lib/work-gate.mjs";
import { resolveTsgoBin, withTsgoEnv } from "../../scripts/lib/tsgo.mjs";

const require = createRequire(import.meta.url);
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const workRoot = join(rootDir, "work", "confirm");
const results = [];

async function check(suite, caseId, tool, fn) {
  try {
    await fn();
    results.push({ suite, caseId, tool, status: "pass", message: "" });
  } catch (error) {
    results.push({
      suite,
      caseId,
      tool,
      status: "fail",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

function skip(suite, caseId, tool, message) {
  results.push({ suite, caseId, tool, status: "skip", message });
}

function bin(name) {
  try {
    return resolveBin(name, rootDir);
  } catch {
    return null;
  }
}

function outputParts(raw) {
  const result = typeof raw === "string" ? JSON.parse(raw) : raw;
  return {
    js:
      typeof result?.js === "string"
        ? result.js
        : (result?.js?.code ?? result?.code ?? ""),
    css:
      typeof result?.css === "string" ? result.css : (result?.css?.code ?? ""),
  };
}

async function confirmCompile() {
  const source = `<script>
  let { name = 'World' } = $props();
  let count = $state(2);
</script>
<h1 class="marker-31415">{name}:{count * 2}</h1>
<style>.marker-31415 { color: red; }</style>
`;
  const options = {
    filename: "Confirm31415.svelte",
    generate: "server",
    dev: false,
    css: "external",
    runes: true,
  };
  const official = await import("svelte/compiler");
  const mrwaip = await import("@mrwaip/svelte-rs/compiler");
  const wasm = await import("@rsvelte/compiler");
  const wasmPackage = require.resolve("@rsvelte/compiler/package.json", {
    paths: [rootDir],
  });
  const wasmBytes = readFileSync(
    join(dirname(wasmPackage), "rsvelte_lint_bg.wasm"),
  );
  if (typeof wasm.initSync === "function") wasm.initSync({ module: wasmBytes });
  else await wasm.default({ module: wasmBytes });
  const native = require("@rsvelte/vite-plugin-svelte-native");
  const implementations = [
    ["svelte", official.compile],
    ["svelte-rs", mrwaip.compile],
    ["rsvelte-wasm", wasm.compile],
    ["rsvelte-native", native.compileSync ?? native.compile],
  ];
  const compiledDir = join(workRoot, "compiled");
  mkdirSync(compiledDir, { recursive: true });

  for (const [tool, compile] of implementations) {
    await check("compile", "server-render", tool, async () => {
      assert.equal(typeof compile, "function", "compile API unavailable");
      const production = outputParts(await compile(source, options));
      const development = outputParts(
        await compile(source, { ...options, dev: true }),
      );
      assert.match(production.js, /svelte\/internal\/server/);
      assert.match(production.css, /marker-31415/);
      assert.doesNotMatch(production.js, /\$state\s*\(/);
      assert.notEqual(
        `${production.js}\n${production.css}`,
        `${development.js}\n${development.css}`,
        "dev option had no observable effect",
      );
      const parsed = ts.createSourceFile(
        `${tool}.mjs`,
        production.js,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.JS,
      );
      assert.equal(parsed.parseDiagnostics.length, 0, "invalid JavaScript");
      const modulePath = join(compiledDir, `${tool}.mjs`);
      writeFileSync(modulePath, production.js);
      const component = await import(
        `${pathToFileURL(modulePath).href}?confirm=${Date.now()}`
      );
      const rendered = await render(component.default, {
        props: { name: "Ada" },
      });
      assert.match(rendered.html ?? rendered.body ?? "", />Ada:4<\/h1>/);
    });
  }
  skip(
    "compile",
    "server-render",
    "verter",
    "No public Svelte runtime compile API; no proxy workload is accepted.",
  );
}

async function confirmProjection() {
  const source = `<script lang="ts">let { marker31415 }: { marker31415: string } = $props();</script>\n<h1>{marker31415}</h1>\n`;
  const parse = (code, tool) => {
    assert.ok(code.length > 0, `${tool} emitted empty code`);
    const parsed = ts.createSourceFile(
      `${tool}.tsx`,
      code,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    assert.equal(parsed.parseDiagnostics.length, 0);
    assert.match(code, /marker31415/);
  };

  await check("projection", "svelte-projection", "svelte2tsx", async () => {
    const { svelte2tsx } = await import("svelte2tsx");
    const output = svelte2tsx(source, {
      filename: "Projection.svelte",
      isTsFile: true,
      mode: "ts",
      version: "5",
    });
    parse(output.code, "svelte2tsx");
    assert.match(output.code, /__sveltets_/);
  });

  await check(
    "projection",
    "svelte-projection",
    "@rsvelte/svelte2tsx",
    async () => {
      const rsvelte = await import("@rsvelte/svelte2tsx");
      if (typeof rsvelte.initialize === "function") await rsvelte.initialize();
      const transform = rsvelte.svelte2tsx ?? rsvelte.default;
      const output = transform(source, {
        filename: "Projection.svelte",
        isTsFile: true,
        mode: "ts",
        version: "5",
      });
      parse(output.code, "rsvelte-svelte2tsx");
      assert.match(output.code, /__sveltets_/);
    },
  );

  await check("projection", "svelte-projection", "verter", () => {
    const { VerterHost } = require("@verter/native");
    const host = new VerterHost({ analysisLevel: "full" });
    try {
      const id = "C:/confirm/Projection.svelte";
      host.upsert({
        canonicalId: id,
        inputId: id,
        source: Buffer.from(source),
        fileKind: "svelte",
      });
      assert.equal(host.ensureIdeCompiled(id), true);
      const output = host.getIde(id);
      parse(output?.code ?? "", "verter");
      assert.match(output.code, /@verter\/svelte-jsx/);
    } finally {
      host.close?.();
    }
  });
}

async function confirmTypecheck() {
  const plants = prepareTypecheckPlant(workRoot);
  const nodePath = [join(rootDir, "node_modules"), process.env.NODE_PATH ?? ""]
    .filter(Boolean)
    .join(process.platform === "win32" ? ";" : ":");
  const env = withTsgoEnv({ NODE_PATH: nodePath }, rootDir);
  const hasTsgo = Boolean(resolveTsgoBin(rootDir).bin);
  const definitions = [
    [
      "svelte-check",
      bin("svelte-check"),
      () => [
        "--tsconfig",
        "tsconfig.json",
        "--threshold",
        "error",
        "--diagnostic-sources",
        "ts,svelte",
      ],
    ],
    [
      "svelte-check-native",
      bin("svelte-check-native"),
      (dir) => [
        "--workspace",
        dir,
        "--tsconfig",
        join(dir, "tsconfig.json"),
        "--threshold",
        "error",
        "--diagnostic-sources",
        "ts,svelte",
      ],
    ],
    [
      "svelte-check-rs",
      bin("svelte-check-rs"),
      (dir) => ["--workspace", dir, "--tsconfig", join(dir, "tsconfig.json")],
    ],
    [
      "rsvelte-check",
      bin("rsvelte-check"),
      () => [
        "--tsconfig",
        "tsconfig.json",
        "--diagnostic-sources",
        "ts,svelte",
        ...(hasTsgo ? ["--tsgo"] : []),
      ],
    ],
    [
      "verter-tsc",
      bin("verter-tsc"),
      () => ["--noEmit", "-p", "tsconfig.json"],
    ],
  ];
  for (const [tool, executable, args] of definitions) {
    if (!executable) {
      skip("typecheck", "plants", tool, "binary unavailable");
      continue;
    }
    await check("typecheck", "plants", tool, () => {
      for (const dir of [plants.script, plants.template]) {
        const outcome = typecheckCliReportsError(
          executable,
          args(dir),
          dir,
          env,
          "Plant.svelte",
        );
        assert.equal(
          outcome.ok,
          true,
          `${tool} missed a plant (exit ${outcome.result.status}): ${`${outcome.result.stdout}\n${outcome.result.stderr}`.trim().slice(0, 500)}`,
        );
      }
    });
  }
}

async function confirmLint() {
  const plant = prepareLintPlant(workRoot);
  try {
    await check("lint", "html-plant", "eslint-plugin-svelte", async () => {
      const { ESLint } = await import("eslint");
      const eslint = new ESLint({
        overrideConfigFile: join(plant.dir, "eslint.config.mjs"),
        cwd: plant.dir,
      });
      const messages = (await eslint.lintFiles([plant.dirtyFile])).flatMap(
        (result) => result.messages ?? [],
      );
      assert.ok(
        messages.some((message) => message.ruleId === "svelte/no-at-html-tags"),
      );
    });
    const rsvelte = bin("rsvelte-lint");
    if (!rsvelte)
      skip("lint", "html-plant", "rsvelte-lint", "binary unavailable");
    else
      await check("lint", "html-plant", "rsvelte-lint", () => {
        assert.equal(
          cliReportsPlantedIssue(rsvelte, ["Dirty.svelte"], plant.dir, {
            filename: "Dirty.svelte",
            diagnostic: /\{@html\}[^\n]*can lead to XSS attack/i,
          }),
          true,
        );
      });
    await check("lint", "html-plant", "verter", () => {
      const { VerterHost } = require("@verter/native");
      const host = new VerterHost({ analysisLevel: "full" });
      const id = plant.dirtyFile.replace(/\\/g, "/");
      host.upsert({
        inputId: id,
        source: readFileSync(plant.dirtyFile, "utf8"),
        fileKind: "svelte",
      });
      const diagnostics = host.lint?.(id) ?? host.getDiagnostics?.(id);
      assert.match(JSON.stringify(diagnostics), /html|security|unsafe/i);
    });
  } finally {
    plant.cleanup();
  }
}

async function confirmFormat() {
  const plant = prepareFormatPlant(workRoot);
  const definitions = [
    [
      "prettier",
      bin("prettier"),
      ["--write", "**/*.svelte", "--log-level", "error"],
      {
        ".prettierrc.json": `${JSON.stringify({ plugins: ["prettier-plugin-svelte"] }, null, 2)}\n`,
      },
    ],
    ["rsvelte-fmt", bin("rsvelte-fmt"), ["."], {}],
    ["oxfmt", bin("oxfmt"), [".", "--write"], {}],
  ];
  try {
    for (const [tool, executable, args, configFiles] of definitions) {
      if (!executable) {
        skip("format", "markup-rewrite", tool, "binary unavailable");
        continue;
      }
      await check("format", "markup-rewrite", tool, () => {
        assert.equal(
          formatterRewritesMarkup(plant, {
            bin: executable,
            args,
            label: tool,
            shell: process.platform === "win32" && executable.endsWith(".cmd"),
            configFiles,
          }),
          true,
        );
      });
    }
  } finally {
    plant.cleanup();
  }
}

async function confirmMetadata() {
  const dir = join(workRoot, "metadata");
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "Props.svelte"),
    `<script lang="ts">let { title, count = 0 }: { title: string; count?: number } = $props();</script>\n<h1>{title}:{count}</h1>\n`,
  );
  writeFileSync(join(dir, "Plain.svelte"), `<p>plain</p>\n`);
  writeFileSync(
    join(dir, "index.js"),
    `export { default as Props } from "./Props.svelte";\nexport { default as Plain } from "./Plain.svelte";\n`,
  );
  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify({ name: "confirm-meta", private: true, type: "module", svelte: "./index.js" }, null, 2)}\n`,
  );
  writeFileSync(
    join(dir, "tsconfig.json"),
    `${JSON.stringify({ compilerOptions: { allowJs: true, moduleResolution: "bundler" }, include: ["**/*.svelte", "index.js"] }, null, 2)}\n`,
  );
  const expected = new Set(["Props.svelte", "Plain.svelte"]);

  await check("component-meta", "identities", "sveld", async () => {
    const sveld = await import("sveld");
    let captured;
    const writer = `confirm-${process.pid}`;
    sveld.registerWriter({
      name: writer,
      componentSet: "exported",
      write(components) {
        captured = components;
      },
    });
    await sveld.sveld({
      entry: relative(process.cwd(), join(dir, "index.js")),
      glob: true,
      types: false,
      json: false,
      markdown: false,
      resolveTypes: true,
      cache: false,
      quiet: true,
      additionalWriters: { [writer]: {} },
    });
    const values = captured instanceof Map ? [...captured.values()] : [];
    assert.deepEqual(
      new Set(values.map((component) => basename(component.filePath))),
      expected,
    );
    assert.ok(
      values.find(
        (component) => basename(component.filePath) === "Props.svelte",
      )?.props.length >= 2,
    );
  });

  await check("component-meta", "identities", "svelte-docinfo", async () => {
    const docinfo = await import("svelte-docinfo");
    const analysis = await docinfo.analyzeFromFiles({
      projectRoot: dir,
      discovery: "glob",
      include: ["**/*.svelte"],
      exclude: [],
      sourceOptions: { sourcePaths: ["."] },
      resolveDependencies: false,
    });
    const records = (analysis.modules ?? []).flatMap((module) =>
      (module.declarations ?? [])
        .filter((declaration) => declaration.kind === "component")
        .map((component) => ({ file: basename(module.path ?? ""), component })),
    );
    assert.deepEqual(new Set(records.map((record) => record.file)), expected);
    assert.ok(
      records.find((record) => record.file === "Props.svelte")?.component.props
        .length >= 2,
    );
  });

  await check("component-meta", "identities", "verter-typeinfo", () => {
    const { VerterHost } = require("@verter/native");
    const host = new VerterHost({ analysisLevel: "full" });
    try {
      const id = join(dir, "Props.svelte").replaceAll("\\", "/");
      host.upsert({
        canonicalId: id,
        inputId: id,
        source: readFileSync(join(dir, "Props.svelte")),
        fileKind: "svelte",
      });
      const request = create(TypeInfoGraphRequestSchema, {
        schemaVersion: TYPEINFO_GRAPH_SCHEMA_VERSION,
        operation: GraphOperation.FRAMEWORK_SURFACES,
        payload: {
          case: "frameworkSurface",
          value: {
            selector: {
              canonicalId: id,
              exportName: "",
              hasExportName: false,
              frameworkAdapterId: "svelte",
            },
            context: {
              mode: GraphProjectionMode.NAVIGATE,
              demand: GraphReductionDemand.PUBLISHED,
            },
            closure: { kind: { case: "oneLevel", value: {} } },
            displayPolicy: {
              qualification: 1,
              branding: 1,
              budgets: { maxStringLength: 4096, maxDepth: 16 },
            },
            includeProvenance: false,
            includeDiagnostics: true,
            includeProjection: [],
            schemaVersion: TYPEINFO_GRAPH_SCHEMA_VERSION,
          },
        },
      });
      const { response } = host.resolveFrameworkSurfaceWithAudit(
        Buffer.from(toBinary(TypeInfoGraphRequestSchema, request)),
      );
      const decoded = decodeFrameworkSurfaceResponse(new Uint8Array(response));
      assert.equal("error" in decoded, false);
      const props = decoded.kinds.get(FrameworkSurfaceKind.PROPS);
      assert.equal(props.isSupported, true);
      assert.equal(props.isPartial, false);
      assert.deepEqual(
        new Set(props.members.map((member) => member.name)),
        new Set(["title", "count"]),
      );
    } finally {
      host.close?.();
    }
  });
}

function key(result) {
  return `${result.suite}/${result.caseId}/${result.tool}`;
}

function applicableKnownFailures() {
  const raw = JSON.parse(
    readFileSync(join(rootDir, "tests/confirm/known-failures.json"), "utf8"),
  );
  return new Map(
    Object.entries(raw)
      .filter(([name]) => !name.startsWith("$"))
      .filter(([, value]) =>
        value.platforms ? value.platforms.includes(process.platform) : true,
      ),
  );
}

function writeReports() {
  const dir = join(rootDir, "results");
  mkdirSync(dir, { recursive: true });
  const summary = Object.fromEntries(
    ["pass", "fail", "skip"].map((status) => [
      status,
      results.filter((result) => result.status === status).length,
    ]),
  );
  writeFileSync(
    join(dir, "confirm.json"),
    `${JSON.stringify({ kind: "confirmation", platform: process.platform, summary, results }, null, 2)}\n`,
  );
  const rows = results.map(
    (result) =>
      `| ${result.suite} | ${result.caseId} | ${result.tool} | ${result.status} | ${result.message.replaceAll("|", "\\|").replaceAll("\n", " ")} |`,
  );
  writeFileSync(
    join(dir, "confirm.md"),
    `# Svelte correctness confirmation\n\nCorrectness only; no timings or rankings.\n\n| Surface | Case | Tool | Status | Detail |\n| --- | --- | --- | --- | --- |\n${rows.join("\n")}\n`,
  );
  return summary;
}

async function main() {
  const allSurfaces = [
    "compile",
    "projection",
    "typecheck",
    "lint",
    "format",
    "component-meta",
  ];
  const index = process.argv.indexOf("--surfaces");
  const requested = new Set(
    index === -1
      ? allSurfaces
      : (process.argv[index + 1] ?? "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
  );
  const unknown = [...requested].filter(
    (surface) => !allSurfaces.includes(surface),
  );
  assert.deepEqual(unknown, [], `unknown surfaces: ${unknown.join(", ")}`);
  assert.equal(dirname(resolve(workRoot)), resolve(rootDir, "work"));
  rmSync(workRoot, { recursive: true, force: true });
  mkdirSync(workRoot, { recursive: true });
  if (requested.has("compile")) await confirmCompile();
  if (requested.has("projection")) await confirmProjection();
  if (requested.has("typecheck")) await confirmTypecheck();
  if (requested.has("lint")) await confirmLint();
  if (requested.has("format")) await confirmFormat();
  if (requested.has("component-meta")) await confirmMetadata();

  const known = applicableKnownFailures();
  const unexpected = results.filter(
    (result) => result.status === "fail" && !known.has(key(result)),
  );
  const expected = results.filter(
    (result) => result.status === "fail" && known.has(key(result)),
  );
  const fixed = results.filter(
    (result) => result.status === "pass" && known.has(key(result)),
  );
  const summary = writeReports();
  for (const result of results) {
    const symbol =
      result.status === "pass" ? "✓" : result.status === "skip" ? "–" : "✗";
    console.log(
      `${symbol} ${key(result)}${known.has(key(result)) ? " (known)" : ""}`,
    );
  }
  console.log(
    `\n${summary.pass} passed, ${expected.length} known failure(s), ${unexpected.length} unexpected failure(s), ${summary.skip} skipped.`,
  );
  if (fixed.length)
    console.error(
      `Stale known failures now pass: ${fixed.map(key).join(", ")}`,
    );
  if (unexpected.length || fixed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 2;
});
