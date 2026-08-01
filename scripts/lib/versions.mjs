import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runCommand, resolveBin } from "./timing.mjs";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function pkgVersion(name, fallback = "unknown") {
  const direct = join(
    rootDir,
    "node_modules",
    ...name.split("/"),
    "package.json",
  );
  if (existsSync(direct)) {
    try {
      return JSON.parse(readFileSync(direct, "utf8")).version ?? fallback;
    } catch {
      // continue
    }
  }
  try {
    const pkgPath = require.resolve(`${name}/package.json`, {
      paths: [rootDir],
    });
    return JSON.parse(readFileSync(pkgPath, "utf8")).version ?? fallback;
  } catch {
    try {
      const mainPath = require.resolve(name, { paths: [rootDir] });
      let dir = dirname(mainPath);
      for (let i = 0; i < 8; i++) {
        const pkg = join(dir, "package.json");
        if (existsSync(pkg)) {
          const json = JSON.parse(readFileSync(pkg, "utf8"));
          if (
            json.name === name ||
            json.name?.endsWith(name.split("/").pop())
          ) {
            return json.version ?? fallback;
          }
        }
        const parent = dirname(dir);
        if (parent === dir) break;
        dir = parent;
      }
    } catch {
      // ignore
    }
    return fallback;
  }
}

function cliVersion(binName, args = ["--version"]) {
  try {
    const bin = resolveBin(binName, rootDir);
    const { stdout, stderr, status } = runCommand(bin, args, {
      cwd: rootDir,
      allowNonZeroExit: true,
      shell: process.platform === "win32" && bin.endsWith(".cmd"),
    });
    const text = `${stdout}\n${stderr}`.trim();
    const match = text.match(/(\d+\.\d+\.\d+(?:[-+][\w.]+)?)/);
    return match?.[1] ?? (status === 0 ? text.split("\n")[0] : "unknown");
  } catch {
    return "unavailable";
  }
}

export function collectVersions() {
  return {
    node: process.version,
    svelte: pkgVersion("svelte"),
    "svelte-mrwaip-reference": pkgVersion("svelte-mrwaip-reference"),
    "svelte-check": pkgVersion("svelte-check"),
    "svelte-check-rs": pkgVersion("svelte-check-rs"),
    "svelte-check-native": pkgVersion("svelte-check-native"),
    "@mrwaip/svelte-rs": pkgVersion("@mrwaip/svelte-rs"),
    "@rsvelte/compiler": pkgVersion("@rsvelte/compiler"),
    "@rsvelte/svelte2tsx": pkgVersion("@rsvelte/svelte2tsx"),
    "@rsvelte/svelte-check": pkgVersion("@rsvelte/svelte-check"),
    "@rsvelte/language-server": pkgVersion("@rsvelte/language-server"),
    "@rsvelte/fmt": pkgVersion("@rsvelte/fmt"),
    "@rsvelte/lint": pkgVersion("@rsvelte/lint"),
    "@rsvelte/vite-plugin-svelte-native": pkgVersion(
      "@rsvelte/vite-plugin-svelte-native",
    ),
    "@rsvelte/vite-plugin-svelte": pkgVersion("@rsvelte/vite-plugin-svelte"),
    "@sveltejs/vite-plugin-svelte": pkgVersion("@sveltejs/vite-plugin-svelte"),
    vite: pkgVersion("vite"),
    "@verter/native": pkgVersion("@verter/native"),
    "@verter/typeinfo": pkgVersion("@verter/typeinfo"),
    "@verter/proto": pkgVersion("@verter/proto"),
    "@bufbuild/protobuf": pkgVersion("@bufbuild/protobuf"),
    "verter-tsc": pkgVersion("verter-tsc"),
    "verter-lsp": pkgVersion("verter-lsp"),
    "svelte-language-server": pkgVersion("svelte-language-server"),
    svelte2tsx: pkgVersion("svelte2tsx"),
    sveld: pkgVersion("sveld"),
    "svelte-docinfo": pkgVersion("svelte-docinfo"),
    prettier: pkgVersion("prettier"),
    "prettier-plugin-svelte": pkgVersion("prettier-plugin-svelte"),
    oxfmt: pkgVersion("oxfmt"),
    "eslint-plugin-svelte": pkgVersion("eslint-plugin-svelte"),
    typescript: pkgVersion("typescript"),
    "cli:svelte-check": cliVersion("svelte-check", ["--version"]),
    "cli:svelte-check-rs": cliVersion("svelte-check-rs", ["--version"]),
    "cli:svelte-check-native": cliVersion("svelte-check-native", ["--version"]),
    "cli:rsvelte-check": cliVersion("rsvelte-check", ["--version"]),
    "cli:rsvelte-fmt": cliVersion("rsvelte-fmt", ["--version"]),
    "cli:rsvelte-lint": cliVersion("rsvelte-lint", ["--version"]),
    "cli:prettier": cliVersion("prettier", ["--version"]),
    "cli:oxfmt": cliVersion("oxfmt", ["--version"]),
    "cli:verter-tsc": cliVersion("verter-tsc", ["--version"]),
  };
}
