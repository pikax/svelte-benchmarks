#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { collectSvelteFilesDeep } from "./lib/fixtures.mjs";
import {
  CORPUS_IGNORE_DIRS,
  REAL_WORLD_PROJECTS,
  findProject,
} from "./lib/real-world/projects.mjs";
import {
  MANIFEST_PATH,
  REAL_ROOT,
  readManifest,
} from "./lib/real-world/corpus.mjs";

function parseArgs(argv) {
  const args = { projects: "", force: false, help: false };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--projects") args.projects = argv[++index];
    else if (arg.startsWith("--projects="))
      args.projects = arg.slice("--projects=".length);
    else if (arg === "--force") args.force = true;
    else if (arg === "--help" || arg === "-h") args.help = true;
  }
  return args;
}

function run(command, args, cwd, { allowFailure = false } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    timeout: 20 * 60 * 1000,
    env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" },
  });
  const ok = !result.error && result.status === 0;
  if (!ok && !allowFailure) {
    throw new Error(
      `${command} ${args.join(" ")} failed: ${result.error?.message ?? `exit ${result.status}`}\n${`${result.stderr ?? result.stdout ?? ""}`.slice(-3000)}`,
    );
  }
  return { ...result, ok };
}

function fetchRepo(project, dir) {
  mkdirSync(dir, { recursive: true });
  if (!existsSync(join(dir, ".git"))) run("git", ["init", "--quiet"], dir);
  const remotes = run("git", ["remote"], dir, { allowFailure: true });
  if (!remotes.stdout.split(/\s+/).includes("origin")) {
    run("git", ["remote", "add", "origin", project.repo], dir);
  } else {
    run("git", ["remote", "set-url", "origin", project.repo], dir);
  }
  const fetched = run(
    "git",
    [
      "fetch",
      "--depth",
      "1",
      "--filter=blob:none",
      "--force",
      "origin",
      project.ref,
    ],
    dir,
    { allowFailure: true },
  );
  if (fetched.ok) run("git", ["checkout", "--force", "FETCH_HEAD"], dir);
  else {
    run(
      "git",
      ["fetch", "--filter=blob:none", "--force", "--tags", "origin"],
      dir,
    );
    run("git", ["checkout", "--force", project.ref], dir);
  }
  return run("git", ["rev-parse", "HEAD"], dir).stdout.trim();
}

function measureCorpus(dir, corpus) {
  const files = collectSvelteFilesDeep(dir, {
    roots: corpus.roots,
    ignore: CORPUS_IGNORE_DIRS,
  }).filter(
    (file) =>
      !(corpus.excludeRoots ?? []).some(
        (root) => file === root || file.startsWith(`${root}/`),
      ),
  );
  const bytes = files.reduce(
    (sum, file) => sum + statSync(join(dir, file)).size,
    0,
  );
  return {
    id: corpus.id,
    kind: corpus.kind,
    roots: corpus.roots,
    excludeRoots: corpus.excludeRoots ?? [],
    files: files.length,
    bytes,
    drift:
      files.length === corpus.approxFiles
        ? null
        : { declared: corpus.approxFiles, actual: files.length },
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage: node scripts/fetch-real-world.mjs [options]

  --projects a,b   Fetch selected project ids (default: all)
  --force          Remove and recreate selected checkouts

This command fetches source only. Real-world benchmark surfaces are deliberately
source-only and do not execute third-party install or lifecycle scripts.
`);
    return;
  }
  const selected = args.projects
    ? args.projects
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .map((id) => {
          const project = findProject(id);
          if (!project) throw new Error(`unknown project "${id}"`);
          return project;
        })
    : REAL_WORLD_PROJECTS;

  mkdirSync(REAL_ROOT, { recursive: true });
  const entries = new Map(Object.entries(readManifest()?.projects ?? {}));
  for (const project of selected) {
    const dir = join(REAL_ROOT, project.id);
    if (args.force && existsSync(dir))
      rmSync(dir, { recursive: true, force: true });
    console.log(`\n=== ${project.label} @ ${project.ref} ===`);
    const record = {
      id: project.id,
      label: project.label,
      repo: project.repo,
      ref: project.ref,
      expectedSha: project.sha,
      fetchedAt: new Date().toISOString(),
      sourceOnly: true,
    };
    try {
      record.sha = fetchRepo(project, dir);
      if (record.sha !== project.sha) {
        record.shaMismatch = { expected: project.sha, actual: record.sha };
        console.error(
          `  SHA MISMATCH: expected ${project.sha}, got ${record.sha}`,
        );
      } else {
        console.log(`  fetched ${record.sha} (matches pin)`);
      }
      record.corpora = project.corpora.map((corpus) =>
        measureCorpus(dir, corpus),
      );
      for (const corpus of record.corpora) {
        console.log(`  ${corpus.id}: ${corpus.files} SFCs (${corpus.kind})`);
        if (corpus.drift) {
          console.error(
            `  COUNT DRIFT: registry=${corpus.drift.declared}, walk=${corpus.drift.actual}`,
          );
        }
      }
    } catch (error) {
      record.fetchError =
        error instanceof Error ? error.message : String(error);
      record.sha ??= null;
      console.error(`  fetch failed: ${record.fetchError.split("\n")[0]}`);
    }
    entries.set(project.id, record);
  }
  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    sourceOnly: true,
    projects: Object.fromEntries(entries),
  };
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\nWrote ${MANIFEST_PATH}`);

  const invalid = [...entries.values()].filter(
    (record) =>
      !record.sha ||
      record.shaMismatch ||
      record.corpora?.some((corpus) => corpus.drift),
  );
  if (invalid.length > 0) {
    console.error(
      `\nRefusing benchmark: invalid pins/counts for ${invalid.map((entry) => entry.id).join(", ")}`,
    );
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(
      error instanceof Error ? (error.stack ?? error.message) : String(error),
    );
    process.exit(1);
  });
}
