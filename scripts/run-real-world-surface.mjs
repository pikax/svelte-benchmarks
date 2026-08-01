#!/usr/bin/env node
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { resolveCorpus, provenance } from "./lib/real-world/corpus.mjs";
import { runCompileSurface } from "./lib/surfaces/compile.mjs";
import { runProjectionSurface } from "./lib/surfaces/projection.mjs";
import { runFormatSurface } from "./lib/surfaces/format.mjs";
import { runLintSurface } from "./lib/surfaces/lint.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const args = {
    project: "",
    surface: "",
    out: "",
    runs: 3,
    warmups: 1,
    fileLimit: Infinity,
    work: "work-real",
  };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--project") args.project = argv[++index];
    else if (arg === "--surface") args.surface = argv[++index];
    else if (arg === "--out") args.out = argv[++index];
    else if (arg === "--runs") args.runs = Number.parseInt(argv[++index], 10);
    else if (arg === "--warmups")
      args.warmups = Number.parseInt(argv[++index], 10);
    else if (arg === "--file-limit")
      args.fileLimit = Number.parseInt(argv[++index], 10);
    else if (arg === "--work") args.work = argv[++index];
  }
  return args;
}

async function selectSurfaceFiles(resolved, surfaceId) {
  if (surfaceId !== "compile" && surfaceId !== "projection") {
    return { files: resolved.files, excluded: [] };
  }
  const accepted = [];
  const excluded = [];
  if (surfaceId === "compile") {
    const { compile } = await import("svelte/compiler");
    const { compile: compileMrwaipReference } =
      await import("svelte-mrwaip-reference/compiler");
    const references = [
      { comparisonClass: "svelte-5.56.8", compile },
      {
        comparisonClass: "svelte-5.56.4",
        compile: compileMrwaipReference,
      },
    ];
    const comparisonFiles = Object.fromEntries(
      references.map(({ comparisonClass }) => [comparisonClass, []]),
    );
    const excludedByClass = Object.fromEntries(
      references.map(({ comparisonClass }) => [comparisonClass, []]),
    );
    for (const file of resolved.files) {
      const source = readFileSync(join(resolved.dir, file), "utf8");
      let acceptedSomewhere = false;
      for (const reference of references) {
        try {
          for (const generate of ["client", "server"]) {
            reference.compile(source, {
              filename: file,
              generate,
              dev: false,
              css: "external",
            });
          }
          comparisonFiles[reference.comparisonClass].push(file);
          acceptedSomewhere = true;
        } catch (error) {
          excludedByClass[reference.comparisonClass].push({
            file,
            reason: error instanceof Error ? error.message : String(error),
          });
        }
      }
      if (acceptedSomewhere) accepted.push(file);
      else {
        excluded.push({
          file,
          reason: references
            .map(({ comparisonClass }) => {
              const entry = excludedByClass[comparisonClass].at(-1);
              return `${comparisonClass}: ${entry?.reason ?? "rejected"}`;
            })
            .join(" | "),
        });
      }
    }
    for (const reference of references) {
      const count = comparisonFiles[reference.comparisonClass].length;
      if (count === 0) {
        throw new Error(
          `compile: ${reference.comparisonClass} official reference accepted 0/${resolved.files.length} inputs`,
        );
      }
    }
    return { files: accepted, excluded, comparisonFiles, excludedByClass };
  } else {
    const { svelte2tsx } = await import("svelte2tsx");
    for (const file of resolved.files) {
      try {
        const source = readFileSync(join(resolved.dir, file), "utf8");
        const output = svelte2tsx(source, {
          filename: file,
          isTsFile: /<script\b[^>]*\blang=["']ts["']/.test(source),
          mode: "ts",
          version: "5",
        });
        if (!output?.code) throw new Error("empty TSX projection");
        const parsed = ts.createSourceFile(
          file,
          output.code,
          ts.ScriptTarget.Latest,
          true,
          ts.ScriptKind.TSX,
        );
        if (parsed.parseDiagnostics.length > 0) {
          throw new Error(
            `invalid official TSX projection: ${parsed.parseDiagnostics[0]?.messageText ?? "parse error"}`,
          );
        }
        accepted.push(file);
      } catch (error) {
        excluded.push({
          file,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }
  if (accepted.length === 0) {
    throw new Error(
      `${surfaceId}: official reference accepted 0/${resolved.files.length} inputs`,
    );
  }
  return { files: accepted, excluded };
}

function stageFlat(resolved, files, workRoot, surfaceId) {
  const dir = join(workRoot, resolved.project.id, surfaceId, "corpus");
  mkdirSync(dir, { recursive: true });
  const stagedByFile = {};
  files.forEach((file, index) => {
    const stagedName = `${String(index).padStart(5, "0")}--${basename(file)}`;
    copyFileSync(join(resolved.dir, file), join(dir, stagedName));
    stagedByFile[file] = stagedName;
  });
  return { dir, stagedByFile };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.project || !args.surface || !args.out) {
    throw new Error("--project, --surface and --out are required");
  }
  const resolved = resolveCorpus(args.project, { fileLimit: args.fileLimit });
  if (!resolved.available)
    throw new Error(`${resolved.selector}: ${resolved.reason}`);
  const workRoot = resolve(rootDir, args.work);
  const selection = await selectSurfaceFiles(resolved, args.surface);
  const staged = stageFlat(resolved, selection.files, workRoot, args.surface);
  const fixtureDir = staged.dir;
  const options = {
    runs: args.runs,
    warmups: Math.max(1, args.warmups),
    fileLimit: selection.files.length,
    lintFileLimit: selection.files.length,
    compileTargets: "client,server",
    compileEnvs: "production",
    compileRunes: "auto",
    workRoot: join(workRoot, resolved.project.id, args.surface, "work"),
  };
  if (selection.comparisonFiles) {
    options.compileFilesByClass = Object.fromEntries(
      Object.entries(selection.comparisonFiles).map(([key, files]) => [
        key,
        files.map((file) => staged.stagedByFile[file]),
      ]),
    );
  }
  mkdirSync(options.workRoot, { recursive: true });

  let surface;
  if (args.surface === "compile")
    surface = await runCompileSurface(fixtureDir, options);
  else if (args.surface === "projection")
    surface = await runProjectionSurface(fixtureDir, options);
  else if (args.surface === "format")
    surface = await runFormatSurface(fixtureDir, options);
  else if (args.surface === "lint")
    surface = await runLintSurface(fixtureDir, options);
  else throw new Error(`unsupported real-world surface "${args.surface}"`);

  surface.corpus = {
    selector: resolved.selector,
    provenance: provenance(resolved),
    repo: resolved.project.repo,
    ref: resolved.project.ref,
    sha: resolved.sha,
    kind: resolved.corpus.kind,
    stagedLayout:
      "flat copy with deterministic numeric prefixes; source bytes unchanged",
    configuredFiles: resolved.files.length,
    measuredFiles: selection.files.length,
    excluded: selection.excluded.length,
    ...(selection.comparisonFiles
      ? {
          measuredFilesByClass: Object.fromEntries(
            Object.entries(selection.comparisonFiles).map(([key, files]) => [
              key,
              files.length,
            ]),
          ),
          excludedByClass: Object.fromEntries(
            Object.entries(selection.excludedByClass).map(([key, entries]) => [
              key,
              entries.length,
            ]),
          ),
          exclusionExamplesByClass: Object.fromEntries(
            Object.entries(selection.excludedByClass).map(([key, entries]) => [
              key,
              entries.slice(0, 10),
            ]),
          ),
        }
      : {}),
    exclusionRule:
      selection.excluded.length > 0 || selection.comparisonFiles
        ? args.surface === "compile"
          ? "Each compiler version class uses only inputs accepted by its own pinned official reference; rejection by another version class does not remove the input"
          : `${args.surface}: inputs rejected by the applicable official reference API before timing are excluded equally for every tool`
        : null,
    exclusionExamples: selection.excluded.slice(0, 10),
  };
  const out = resolve(rootDir, args.out);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(surface, null, 2)}\n`);
}

main().catch((error) => {
  console.error(
    error instanceof Error ? (error.stack ?? error.message) : String(error),
  );
  process.exit(1);
});
