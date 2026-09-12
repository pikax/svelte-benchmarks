#!/usr/bin/env node
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
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

export async function selectSurfaceFiles(resolved, surfaceId) {
  if (surfaceId !== "compile" && surfaceId !== "projection") {
    return { files: resolved.files, excluded: [] };
  }
  const accepted = [];
  const excluded = [];
  if (surfaceId === "compile") {
    const { compile } = await import("svelte/compiler");
    for (const file of resolved.files) {
      try {
        const source = readFileSync(join(resolved.dir, file), "utf8");
        for (const generate of ["client", "server"]) {
          compile(source, { filename: file, generate, dev: false, css: "external" });
        }
        accepted.push(file);
      } catch (error) {
        excluded.push({ file, reason: error instanceof Error ? error.message : String(error) });
      }
    }
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
  const parent = join(workRoot, resolved.project.id, surfaceId);
  mkdirSync(parent, { recursive: true });
  const dir = mkdtempSync(join(parent, "corpus-"));
  files.forEach((file, index) => {
    const stagedName = `${String(index).padStart(5, "0")}--${basename(file)}`;
    copyFileSync(join(resolved.dir, file), join(dir, stagedName));
  });
  return dir;
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
  const fixtureDir = stageFlat(resolved, selection.files, workRoot, args.surface);
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
    exclusionRule:
      selection.excluded.length > 0
        ? args.surface === "compile"
          ? "Inputs rejected by the latest official Svelte compiler are excluded equally for every compiler"
          : "Inputs rejected by the applicable official reference API before timing are excluded equally for every tool"
        : null,
    exclusionExamples: selection.excluded.slice(0, 10),
  };
  const out = resolve(rootDir, args.out);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(surface, null, 2)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => {
  console.error(
    error instanceof Error ? (error.stack ?? error.message) : String(error),
  );
  process.exit(1);
});
