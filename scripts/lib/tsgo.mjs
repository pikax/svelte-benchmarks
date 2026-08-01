/**
 * Resolve the stable tsgo / TypeScript 7 native engine for Verter / svelte-check-rs.
 *
 * Verter requires: tsgo (TypeScript 7 native) stable >=7.0.2, <7.1.0
 *
 * This repo keeps:
 *   - typescript@5.9.x  → svelte-check / language-server
 *   - typescript-go (npm:typescript@7.0.2) → Verter / native checkers
 *   - @typescript/native-preview → svelte-check-rs peer when needed
 */
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const defaultRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

/**
 * @param {string} [rootDir]
 * @returns {{ bin: string | null, version: string | null, source: string, notes: string }}
 */
export function resolveTsgoBin(rootDir = defaultRoot) {
  if (process.env.VERTER_TSGO_BIN && existsSync(process.env.VERTER_TSGO_BIN)) {
    return {
      bin: process.env.VERTER_TSGO_BIN,
      version: null,
      source: "VERTER_TSGO_BIN",
      notes: "env override",
    };
  }

  const pkgNames = ["typescript-go", "typescript"];

  for (const name of pkgNames) {
    try {
      const pkgPath = require.resolve(`${name}/package.json`, {
        paths: [rootDir],
      });
      const pkg = readJson(pkgPath);
      const version = String(pkg.version || "");
      if (!/^7\.0\.\d+$/.test(version)) {
        continue;
      }
      const pkgDir = dirname(pkgPath);
      const platformPkg = `@typescript/typescript-${process.platform}-${process.arch}`;
      let platformDir = null;
      try {
        platformDir = dirname(
          require.resolve(`${platformPkg}/package.json`, {
            paths: [pkgDir, rootDir],
          }),
        );
      } catch {
        platformDir = null;
      }
      if (!platformDir) continue;

      const exeName = process.platform === "win32" ? "tsc.exe" : "tsc";
      const candidates = [
        join(platformDir, "lib", exeName),
        join(platformDir, exeName),
        join(platformDir, "lib", "tsc"),
      ];
      for (const c of candidates) {
        if (existsSync(c)) {
          return {
            bin: c,
            version,
            source: `${name}@${version} → ${platformPkg}`,
            notes: "stable TypeScript 7 native engine (tsgo)",
          };
        }
      }
    } catch {
      // try next package name
    }
  }

  // Fall back to @typescript/native-preview (tsgo) for svelte-check-rs
  try {
    const previewPkg = require.resolve(
      "@typescript/native-preview/package.json",
      {
        paths: [rootDir],
      },
    );
    const pkg = readJson(previewPkg);
    const version = String(pkg.version || "");
    const binName = process.platform === "win32" ? "tsgo.exe" : "tsgo";
    const candidates = [
      join(dirname(previewPkg), "bin", binName),
      join(dirname(previewPkg), "lib", binName),
      join(dirname(previewPkg), binName),
    ];
    // Also check .bin
    const binShim = join(
      rootDir,
      "node_modules",
      ".bin",
      process.platform === "win32" ? "tsgo.cmd" : "tsgo",
    );
    if (existsSync(binShim)) {
      return {
        bin: binShim,
        version,
        source: `@typescript/native-preview@${version}`,
        notes: "native-preview tsgo (may be nightly)",
      };
    }
    for (const c of candidates) {
      if (existsSync(c)) {
        return {
          bin: c,
          version,
          source: `@typescript/native-preview@${version}`,
          notes: "native-preview tsgo (may be nightly)",
        };
      }
    }
  } catch {
    // ignore
  }

  return {
    bin: null,
    version: null,
    source: "none",
    notes:
      "Install typescript-go (typescript@7.0.2) or set VERTER_TSGO_BIN to a stable tsgo binary",
  };
}

export function tsgoEnv(rootDir = defaultRoot) {
  const { bin } = resolveTsgoBin(rootDir);
  if (!bin) return {};
  return { VERTER_TSGO_BIN: bin };
}

export function withTsgoEnv(env = {}, rootDir = defaultRoot) {
  return { ...env, ...tsgoEnv(rootDir) };
}

export function resolveToolEngine(id, rootDir = defaultRoot) {
  const readVersion = (spec) => {
    try {
      return require(
        require.resolve(`${spec}/package.json`, { paths: [rootDir] }),
      ).version;
    } catch {
      return null;
    }
  };

  if (id === "svelte-check" || id === "svelte-language-server") {
    const v = readVersion("typescript");
    return {
      engine: "tsc-js",
      version: v,
      label: `TypeScript ${v ?? "?"} (JS)`,
    };
  }

  if (id === "verter-tsc" || id === "verter-lsp") {
    const t = resolveTsgoBin(rootDir);
    return {
      engine: "tsgo",
      version: t.version,
      label: `tsgo ${t.version ?? "?"} (${t.source})`,
    };
  }

  if (id === "svelte-check-rs" || id === "rsvelte-check") {
    const t = resolveTsgoBin(rootDir);
    return {
      engine: "tsgo",
      version: t.version ?? readVersion("@typescript/native-preview"),
      label: `tsgo ${t.version ?? readVersion("@typescript/native-preview") ?? "?"}`,
    };
  }

  return { engine: "unknown", version: null, label: "unknown engine" };
}
