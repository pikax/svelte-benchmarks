/**
 * Load and initialise the @rsvelte/compiler Wasm module.
 *
 * initSync with the bundled .wasm bytes is preferred so Node does not try to
 * fetch() a file: URL (which fails under undici on Node 22+). The binary has
 * been renamed across releases (rsvelte_lint_bg.wasm → rsvelte_compiler_bg.wasm),
 * so every known name is probed instead of pinning the harness to one release's
 * layout.
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

const WASM_FILE_NAMES = [
  "rsvelte_compiler_bg.wasm",
  "rsvelte_lint_bg.wasm",
];

export async function loadRsvelteWasm() {
  const mod = await import("@rsvelte/compiler");
  const pkgJson = require.resolve("@rsvelte/compiler/package.json", {
    paths: [rootDir],
  });
  const bytes = WASM_FILE_NAMES.map((name) =>
    join(dirname(pkgJson), name),
  ).map((path) => {
    try {
      return readFileSync(path);
    } catch {
      return null;
    }
  }).find((b) => b != null);
  if (!bytes) {
    throw new Error(
      `@rsvelte/compiler: no bundled wasm found (tried ${WASM_FILE_NAMES.join(", ")})`,
    );
  }
  if (typeof mod.initSync === "function") {
    mod.initSync({ module: bytes });
  } else if (typeof mod.default === "function") {
    await mod.default({ module: bytes });
  } else if (typeof mod.init === "function") {
    await mod.init({ module: bytes });
  }
  return mod;
}
