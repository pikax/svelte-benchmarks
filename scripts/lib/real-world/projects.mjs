/** Directories never walked when collecting real-world Svelte sources. */
export const CORPUS_IGNORE_DIRS = Object.freeze([
  ".git",
  ".github",
  ".svelte-kit",
  ".turbo",
  ".vercel",
  "node_modules",
  "dist",
  "build",
  "coverage",
  "__snapshots__",
]);

export const CORPUS_KINDS = Object.freeze(["library-source", "app-source"]);

/**
 * Pinned real-world Svelte corpora.
 *
 * Counts use the same recursive walk as fetch-real-world.mjs and were verified
 * against each pinned Git tree on 2026-08-01. A moved tag is a hard failure.
 */
export const REAL_WORLD_PROJECTS = Object.freeze([
  {
    id: "carbon-components-svelte",
    label: "Carbon Components Svelte",
    repo: "https://github.com/carbon-design-system/carbon-components-svelte.git",
    ref: "v0.110.2",
    refKind: "tag",
    sha: "dec0ea449b1e612ebaf0b5f21e52a75edf64006d",
    committedAt: "2026-07-31",
    releasedAt: "2026-07-31",
    pinnedAt: "2026-08-01",
    license: "Apache-2.0",
    packageManager: "bun",
    hasLockfile: true,
    corpora: [
      {
        id: "components",
        roots: ["src"],
        kind: "library-source",
        approxFiles: 287,
        note: "Published Carbon component source; tests and documentation examples excluded.",
        default: true,
      },
    ],
  },
  {
    id: "platform",
    label: "Huly Platform",
    repo: "https://github.com/hcengineering/platform.git",
    ref: "v0.7.426",
    refKind: "tag",
    sha: "ccefccd8d0361d3c8612d508071b777aa833826d",
    committedAt: "2026-07-03",
    releasedAt: "2026-07-05",
    pinnedAt: "2026-08-01",
    license: "EPL-2.0",
    packageManager: "rush",
    hasLockfile: true,
    corpora: [
      {
        id: "workspace",
        roots: ["packages", "plugins"],
        kind: "app-source",
        approxFiles: 2462,
        note: "Svelte application and UI source across the Rush monorepo.",
        default: true,
      },
    ],
  },
  {
    id: "open-webui",
    label: "Open WebUI",
    repo: "https://github.com/open-webui/open-webui.git",
    ref: "v0.11.0",
    refKind: "tag",
    sha: "f9590b8017199e56d5e953657e6498e3cef1d246",
    committedAt: "2026-07-27",
    releasedAt: "2026-07-27",
    pinnedAt: "2026-08-01",
    license: "Open WebUI License",
    packageManager: "npm",
    hasLockfile: true,
    corpora: [
      {
        id: "app",
        roots: ["src"],
        kind: "app-source",
        approxFiles: 650,
        note: "The SvelteKit application under src.",
        default: true,
      },
    ],
  },
  {
    id: "flowbite-svelte",
    label: "Flowbite Svelte",
    repo: "https://github.com/themesberg/flowbite-svelte.git",
    ref: "v1.33.1",
    refKind: "tag",
    sha: "3fbf1a186976dad6cbfbfb31979985829867319e",
    committedAt: "2026-04-07",
    releasedAt: "2026-04-07",
    pinnedAt: "2026-08-01",
    license: "MIT",
    packageManager: "pnpm",
    hasLockfile: true,
    corpora: [
      {
        id: "components",
        roots: ["src/lib"],
        kind: "library-source",
        approxFiles: 183,
        note: "Published component source; the much larger docs/examples tree is excluded.",
        default: true,
      },
    ],
  },
  {
    id: "smui",
    label: "Svelte Material UI",
    repo: "https://github.com/hperrin/svelte-material-ui.git",
    ref: "v9.0.1",
    refKind: "tag",
    sha: "8d204fe859940871afa832dade80789bab49d752",
    committedAt: "2026-06-02",
    releasedAt: "2026-06-02",
    pinnedAt: "2026-08-01",
    license: "Apache-2.0",
    packageManager: "npm",
    hasLockfile: true,
    corpora: [
      {
        id: "components",
        roots: ["packages"],
        excludeRoots: ["packages/site"],
        kind: "library-source",
        approxFiles: 126,
        note: "Published packages, excluding the 323-file documentation site.",
        default: true,
      },
    ],
  },
]);

export function findProject(id) {
  return REAL_WORLD_PROJECTS.find((project) => project.id === id) ?? null;
}

export function defaultSelectors() {
  return REAL_WORLD_PROJECTS.map((project) => {
    const corpus =
      project.corpora.find((candidate) => candidate.default) ??
      project.corpora[0];
    return `${project.id}:${corpus.id}`;
  });
}
