#!/usr/bin/env node
/**
 * Prepare workspaces for VS Code headless E2E benchmarks (Svelte).
 *
 *   fixtures/e2e/regular   — single-package Svelte app
 *   fixtures/e2e/monorepo  — multi-package workspace (shared UI + app)
 *
 * Usage:
 *   node scripts/e2e-vscode/setup-workspaces.mjs
 */

import {
  mkdirSync,
  rmSync,
  writeFileSync,
  existsSync,
  symlinkSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");
const e2eRoot = join(rootDir, "fixtures", "e2e");

/** Planted hover marker — same identifier as the LSP surface. */
export const PROBE_SYMBOL = "benchMarker";

export const REGULAR_APP_SOURCE = `<script lang="ts">
  import Hello from './components/Hello.svelte'

  /** Stable hover target for benchmarks — do not rename. */
  const ${PROBE_SYMBOL}: string = 'regular-repo-probe'
  let title = $derived('Regular ' + ${PROBE_SYMBOL})

  function onGreet(msg: string): void {
    console.log(msg)
  }
</script>

<main class="app">
  <h1>{title}</h1>
  <p>{${PROBE_SYMBOL}}</p>
  <Hello name={title} ongreet={onGreet} />
</main>
`;

export const HELLO_SOURCE = `<script lang="ts">
  type Props = { name?: string; ongreet?: (msg: string) => void }
  let { name = 'world', ongreet }: Props = $props()
  function greet() {
    ongreet?.('hi ' + name)
  }
</script>

<button type="button" onclick={greet}>Hello {name}</button>
`;

export const MONOREPO_BUTTON_SOURCE = `<script lang="ts">
  /** Stable monorepo hover target in shared package — do not rename. */
  const ${PROBE_SYMBOL}: string = 'monorepo-ui-probe'
  type Props = { onclick?: () => void }
  let { onclick }: Props = $props()
</script>

<button type="button" class="ui-btn" {onclick}>
  <slot />{${PROBE_SYMBOL}}
</button>
`;

function linkRootNodeModules(dir) {
  const nm = join(dir, "node_modules");
  const rootNm = join(rootDir, "node_modules");
  try {
    if (existsSync(nm)) rmSync(nm, { recursive: true, force: true });
    symlinkSync(rootNm, nm, process.platform === "win32" ? "junction" : "dir");
  } catch (e) {
    console.warn(`warn: could not link node_modules into ${dir}: ${e.message}`);
  }
}

function writeSvelteProjectFiles(dir, { name }) {
  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify(
      {
        private: true,
        type: "module",
        name,
        dependencies: { svelte: "5.56.8" },
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    join(dir, "tsconfig.json"),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: "ESNext",
          module: "ESNext",
          moduleResolution: "bundler",
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          types: [],
          lib: ["ESNext", "DOM"],
        },
        include: ["src/**/*.svelte", "src/**/*.ts", "env.d.ts", "**/*.svelte"],
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    join(dir, "svelte.config.js"),
    `export default { compilerOptions: { runes: true } };\n`,
  );
  writeFileSync(
    join(dir, "env.d.ts"),
    `/// <reference types="svelte" />\n`,
  );
}

function setupRegular() {
  const dir = join(e2eRoot, "regular");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(dir, "src", "components"), { recursive: true });
  writeSvelteProjectFiles(dir, { name: "e2e-regular" });
  writeFileSync(join(dir, "src", "App.svelte"), REGULAR_APP_SOURCE);
  writeFileSync(join(dir, "src", "components", "Hello.svelte"), HELLO_SOURCE);
  writeFileSync(
    join(dir, "e2e-probe.json"),
    `${JSON.stringify(
      {
        kind: "regular",
        file: "src/App.svelte",
        symbol: PROBE_SYMBOL,
      },
      null,
      2,
    )}\n`,
  );
  linkRootNodeModules(dir);
  console.log(`wrote ${dir}`);
}

function setupMonorepo() {
  const dir = join(e2eRoot, "monorepo");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(dir, "packages", "ui", "src"), { recursive: true });
  mkdirSync(join(dir, "packages", "app", "src"), { recursive: true });

  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify({ private: true, name: "e2e-monorepo" }, null, 2)}\n`,
  );
  writeFileSync(
    join(dir, "pnpm-workspace.yaml"),
    `packages:\n  - packages/*\n`,
  );

  const uiDir = join(dir, "packages", "ui");
  writeSvelteProjectFiles(uiDir, { name: "@e2e/ui" });
  writeFileSync(join(uiDir, "src", "Button.svelte"), MONOREPO_BUTTON_SOURCE);
  writeFileSync(
    join(uiDir, "package.json"),
    `${JSON.stringify(
      {
        private: true,
        type: "module",
        name: "@e2e/ui",
        exports: { "./Button.svelte": "./src/Button.svelte" },
        dependencies: { svelte: "5.56.8" },
      },
      null,
      2,
    )}\n`,
  );

  const appDir = join(dir, "packages", "app");
  writeSvelteProjectFiles(appDir, { name: "@e2e/app" });
  writeFileSync(
    join(appDir, "src", "App.svelte"),
    `<script lang="ts">
  import Button from '../../ui/src/Button.svelte'
</script>

<main>
  <Button>Click</Button>
</main>
`,
  );
  writeFileSync(
    join(appDir, "package.json"),
    `${JSON.stringify(
      {
        private: true,
        type: "module",
        name: "@e2e/app",
        dependencies: { "@e2e/ui": "workspace:*", svelte: "5.56.8" },
      },
      null,
      2,
    )}\n`,
  );

  // Probe the shared UI package (where the marker lives)
  writeFileSync(
    join(dir, "e2e-probe.json"),
    `${JSON.stringify(
      {
        kind: "monorepo",
        file: "packages/ui/src/Button.svelte",
        symbol: PROBE_SYMBOL,
      },
      null,
      2,
    )}\n`,
  );
  linkRootNodeModules(dir);
  linkRootNodeModules(uiDir);
  linkRootNodeModules(appDir);
  console.log(`wrote ${dir}`);
}

function main() {
  mkdirSync(e2eRoot, { recursive: true });
  setupRegular();
  setupMonorepo();
  console.log("e2e workspaces ready");
}

main();
