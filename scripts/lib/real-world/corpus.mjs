import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectSvelteFilesDeep } from "../fixtures.mjs";
import {
  CORPUS_IGNORE_DIRS,
  REAL_WORLD_PROJECTS,
  defaultSelectors,
  findProject,
} from "./projects.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");
export const REAL_ROOT = join(rootDir, "fixtures", "real");
export const MANIFEST_PATH = join(REAL_ROOT, "manifest.json");

export function readManifest() {
  if (!existsSync(MANIFEST_PATH)) return null;
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  } catch {
    return null;
  }
}

export function resolveCorpus(selector, { fileLimit = Infinity } = {}) {
  const [projectId, corpusId] = selector.split(":");
  const project = findProject(projectId);
  if (!project) {
    throw new Error(
      `unknown project "${projectId}" — known: ${REAL_WORLD_PROJECTS.map((entry) => entry.id).join(", ")}`,
    );
  }
  const corpus = corpusId
    ? project.corpora.find((entry) => entry.id === corpusId)
    : (project.corpora.find((entry) => entry.default) ?? project.corpora[0]);
  if (!corpus) throw new Error(`unknown corpus "${selector}"`);

  const canonicalSelector = `${project.id}:${corpus.id}`;
  const dir = join(REAL_ROOT, project.id);
  const manifest = readManifest();
  const record = manifest?.projects?.[project.id] ?? null;
  if (!existsSync(dir) || !record?.sha) {
    return {
      selector: canonicalSelector,
      project,
      corpus,
      dir,
      files: [],
      bytes: 0,
      available: false,
      reason: "checkout missing — run pnpm fetch:real-world",
    };
  }
  if (record.shaMismatch || record.sha !== project.sha) {
    return {
      selector: canonicalSelector,
      project,
      corpus,
      dir,
      files: [],
      bytes: 0,
      available: false,
      reason: `checkout SHA ${record.sha} does not match pin ${project.sha}`,
    };
  }

  const all = collectSvelteFilesDeep(dir, {
    roots: corpus.roots,
    ignore: CORPUS_IGNORE_DIRS,
  }).filter(
    (file) =>
      !(corpus.excludeRoots ?? []).some(
        (root) => file === root || file.startsWith(`${root}/`),
      ),
  );
  const files = Number.isFinite(fileLimit) ? all.slice(0, fileLimit) : all;
  const bytes = files.reduce(
    (sum, file) => sum + statSync(join(dir, file)).size,
    0,
  );
  return {
    selector: canonicalSelector,
    project,
    corpus,
    dir,
    files,
    bytes,
    sha: record.sha,
    available: files.length > 0,
    reason:
      files.length > 0
        ? null
        : "no .svelte files found under the configured roots",
    truncation: {
      truncated: files.length < all.length,
      totalAvailable: all.length,
      limit: Number.isFinite(fileLimit) ? fileLimit : null,
    },
  };
}

export { defaultSelectors };

export function provenance(resolved) {
  const project = resolved.project;
  const count = resolved.truncation?.truncated
    ? `${resolved.files.length} of ${resolved.truncation.totalAvailable} SFCs (alphabetical prefix)`
    : `${resolved.files.length} SFCs`;
  return `${resolved.selector} @ ${project.ref} (${resolved.sha.slice(0, 8)}, released/committed ${project.releasedAt ?? project.committedAt}) · ${count} · ${resolved.corpus.kind} · ${project.license}`;
}
