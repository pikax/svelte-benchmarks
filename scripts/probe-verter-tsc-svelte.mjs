#!/usr/bin/env node
/**
 * Probe: does verter-tsc report Svelte plants?
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const work = join(rootDir, "work", "verter-tsc-probe");

const PLANTS = {
  script: `<script lang="ts">
// plant: string assigned to number
const n: number = "not-a-number"
</script>

<div>{n}</div>
`,
  template: `<script lang="ts">
const disabledFlag: string = "yes"
</script>

<button type="button" disabled={disabledFlag}>go</button>
`,
  clean: `<script lang="ts">
const n: number = 1
const ok: boolean = true
</script>

<button type="button" disabled={ok}>{n}</button>
`,
  // More aggressive template plant if boolean attr is weak
  templateExpr: `<script lang="ts">
const x: string = "a"
</script>

<p>{(x as number).toFixed(2)}</p>
`,
};

function findSveltePkg() {
  const p = join(rootDir, "node_modules", "svelte");
  return existsSync(p) ? p.replace(/\\/g, "/") : null;
}

function findTsgo() {
  try {
    const pkg = require.resolve("typescript-go/package.json", { paths: [rootDir] });
    const platform = `@typescript/typescript-${process.platform}-${process.arch}`;
    const pp = dirname(
      require.resolve(`${platform}/package.json`, {
        paths: [dirname(pkg), rootDir],
      }),
    );
    const exe =
      process.platform === "win32"
        ? join(pp, "lib", "tsc.exe")
        : join(pp, "lib", "tsc");
    return existsSync(exe) ? exe : null;
  } catch {
    return null;
  }
}

function writePlant(name, source) {
  const dir = join(work, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "Plant.svelte"), source);
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
  writeFileSync(
    join(dir, "svelte.config.js"),
    `export default { compilerOptions: { runes: true } };\n`,
  );
  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify({ private: true, type: "module", name }, null, 2)}\n`,
  );
  const sveltePkg = findSveltePkg();
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
          isolatedModules: true,
          esModuleInterop: true,
          lib: ["ESNext", "DOM"],
          types: [],
          ...(sveltePkg
            ? {
                paths: {
                  svelte: [sveltePkg],
                  "svelte/*": [`${sveltePkg}/*`],
                },
              }
            : {}),
        },
        include: ["Plant.svelte", "env.d.ts"],
      },
      null,
      2,
    )}\n`,
  );
  return dir;
}

function resolveBin(name) {
  const suffixes = process.platform === "win32" ? [".cmd", ".ps1", ""] : [""];
  for (const s of suffixes) {
    const c = join(rootDir, "node_modules", ".bin", `${name}${s}`);
    if (existsSync(c)) return c;
  }
  return null;
}

function runChecker(label, bin, args, cwd, envExtra = {}) {
  const env = {
    ...process.env,
    NO_COLOR: "1",
    FORCE_COLOR: "0",
    ...envExtra,
  };
  const r = spawnSync(bin, args, {
    cwd,
    env,
    encoding: "utf8",
    shell: process.platform === "win32" && bin.endsWith(".cmd"),
    maxBuffer: 32 * 1024 * 1024,
  });
  const out = `${r.stdout ?? ""}\n${r.stderr ?? ""}`.trim();
  console.log(`\n======== ${label} @ ${cwd} ========`);
  console.log(`bin: ${bin}`);
  console.log(`args: ${args.join(" ")}`);
  console.log(`status: ${r.status}`);
  console.log(`--- output (${out.length} chars) ---`);
  console.log(out.slice(0, 6000) || "(empty)");
  if (r.error) console.log("spawn error:", r.error);
  return { status: r.status, out };
}

function main() {
  rmSync(work, { recursive: true, force: true });
  mkdirSync(work, { recursive: true });

  const verter = resolveBin("verter-tsc");
  const svelteCheck = resolveBin("svelte-check");
  const tsgo = findTsgo();
  console.log("verter-tsc:", verter);
  console.log("svelte-check:", svelteCheck);
  console.log("tsgo:", tsgo);
  console.log("svelte pkg:", findSveltePkg());

  if (!verter) {
    console.error("verter-tsc not found");
    process.exit(1);
  }

  const env = tsgo ? { VERTER_TSGO_BIN: tsgo } : {};

  for (const [name, source] of Object.entries(PLANTS)) {
    const dir = writePlant(name, source);
    runChecker(
      `verter-tsc · ${name}`,
      verter,
      ["--noEmit", "-p", "tsconfig.json"],
      dir,
      env,
    );
    // Also try without -p, pointing at file
    runChecker(
      `verter-tsc · ${name} (file arg)`,
      verter,
      ["--noEmit", "Plant.svelte"],
      dir,
      env,
    );
  }

  // Control: official svelte-check on script plant
  if (svelteCheck) {
    const dir = join(work, "script");
    runChecker(
      "svelte-check · script (control)",
      svelteCheck,
      ["--tsconfig", "tsconfig.json", "--threshold", "error"],
      dir,
    );
  }

  // Help / version for verter-tsc
  runChecker("verter-tsc --help", verter, ["--help"], rootDir, env);
  runChecker("verter-tsc --version", verter, ["--version"], rootDir, env);
}

main();
