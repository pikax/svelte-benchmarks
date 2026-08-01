import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Absolute path to the installed `svelte` package.
 * Work dirs may sit anywhere `--work` points, so tsconfigs must resolve
 * svelte from the monorepo install rather than a guessed relative path.
 */
function findSveltePackage() {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let up = 0; up < 8; up++) {
    const candidate = join(dir, "node_modules", "svelte");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export function collectSvelteFiles(dir, limit = Infinity) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".svelte"))
    .sort()
    .slice(0, limit);
}

/** Recursively collect repo-relative .svelte paths with deterministic ordering. */
export function collectSvelteFilesDeep(
  dir,
  { roots = ["."], ignore = [], limit = Infinity } = {},
) {
  if (!existsSync(dir)) return [];
  const ignored = new Set(ignore);
  const files = [];

  const walk = (absoluteDir) => {
    for (const entry of readdirSync(absoluteDir, { withFileTypes: true })) {
      if (entry.isDirectory() && ignored.has(entry.name)) continue;
      const absolute = join(absoluteDir, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.isFile() && entry.name.endsWith(".svelte")) {
        files.push(relative(dir, absolute).split(sep).join("/"));
      }
    }
  };

  for (const root of roots) {
    const absolute = join(dir, root);
    if (existsSync(absolute) && statSync(absolute).isDirectory())
      walk(absolute);
  }
  return [...new Set(files)].sort().slice(0, limit);
}

export function totalBytes(dir, files) {
  return files.reduce((sum, f) => sum + statSync(join(dir, f)).size, 0);
}

export function readSources(dir, files) {
  return files.map((filename) => ({
    filename,
    path: join(dir, filename),
    source: readFileSync(join(dir, filename), "utf8"),
  }));
}

export function copyFixtureSubset(inputDir, outputDir, files, extras = []) {
  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });
  const copy = (relativePath) => {
    const source = join(inputDir, relativePath);
    if (!existsSync(source)) return;
    const destination = join(outputDir, relativePath);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(source, destination);
  };
  for (const file of files) {
    copy(file);
  }
  for (const extra of extras) {
    copy(extra);
  }
  return outputDir;
}

export function writeTsconfig(
  dir,
  { include = ["**/*.svelte", "**/*.ts", "**/*.js"] } = {},
) {
  const config = {
    compilerOptions: {
      target: "ESNext",
      module: "ESNext",
      moduleResolution: "bundler",
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      isolatedModules: true,
      esModuleInterop: true,
      resolveJsonModule: true,
      lib: ["ESNext", "DOM"],
      types: [],
      // Svelte language tools / svelte-check
      verbatimModuleSyntax: true,
    },
    include,
  };
  writeFileSync(
    join(dir, "tsconfig.json"),
    `${JSON.stringify(config, null, 2)}\n`,
  );
}

export function writeEnvDTs(dir) {
  writeFileSync(
    join(dir, "env.d.ts"),
    `/// <reference types="svelte" />
declare module '*.svelte' {
  import type { Component } from 'svelte'
  const component: Component
  export default component
}
`,
  );
}

export function writeSvelteConfig(dir) {
  writeFileSync(
    join(dir, "svelte.config.js"),
    `/** @type {import('@sveltejs/vite-plugin-svelte').SvelteConfig} */
const config = {
  compilerOptions: {
    runes: true,
  },
};
export default config;
`,
  );
}

export function prepareTypecheckDir(inputDir, files, workRoot, label) {
  const out = join(workRoot, "typecheck", label);
  copyFixtureSubset(inputDir, out, files, ["svelte.config.js"]);
  writeEnvDTs(out);
  writeTsconfig(out, { include: [...files, "env.d.ts"] });
  if (!existsSync(join(out, "svelte.config.js"))) {
    writeSvelteConfig(out);
  }

  writeFileSync(
    join(out, "package.json"),
    `${JSON.stringify({ private: true, type: "module", name: `bench-${label}` }, null, 2)}\n`,
  );

  const sveltePkg = findSveltePackage();
  if (!sveltePkg) {
    throw new Error(
      "cannot locate node_modules/svelte — refusing to build a typecheck corpus " +
        "whose tsconfig would resolve no types",
    );
  }
  const rootSvelte = relative(out, sveltePkg).split(sep).join("/");
  const tsconfig = JSON.parse(readFileSync(join(out, "tsconfig.json"), "utf8"));
  tsconfig.compilerOptions.paths = {
    svelte: [rootSvelte],
    "svelte/*": [`${rootSvelte}/*`],
  };
  writeFileSync(
    join(out, "tsconfig.json"),
    `${JSON.stringify(tsconfig, null, 2)}\n`,
  );

  // Symlink / junction style access via node_modules/svelte relative path is
  // covered by paths; also drop a package.json that marks type:module.
  return out;
}

export function prepareLintDir(inputDir, files, workRoot, label) {
  const out = join(workRoot, "lint", label);
  copyFixtureSubset(inputDir, out, files, ["eslint.config.mjs"]);
  if (!existsSync(join(out, "eslint.config.mjs"))) {
    writeFileSync(
      join(out, "eslint.config.mjs"),
      `import svelte from "eslint-plugin-svelte";
import tsParser from "@typescript-eslint/parser";

export default [
  ...svelte.configs["flat/recommended"],
  {
    files: ["**/*.svelte"],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: [".svelte"],
      },
    },
    rules: {
      "svelte/no-at-html-tags": "error",
    },
  },
];
`,
    );
  }
  return out;
}

export function prepareFormatCopy(
  inputDir,
  files,
  workRoot,
  label,
  invocation,
) {
  const out = join(workRoot, "format", `${label}-${invocation}`);
  const extras = [
    ".prettierrc.json",
    ".prettierrc",
    "prettier.config.mjs",
    "oxfmt.json",
    ".oxfmtrc.json",
  ].filter((f) => existsSync(join(inputDir, f)));
  copyFixtureSubset(inputDir, out, files, extras);
  return out;
}
