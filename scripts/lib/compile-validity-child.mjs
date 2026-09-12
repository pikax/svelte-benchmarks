/**
 * Isolated child process that runs the compile validity plants for ONE
 * entrypoint in ONE matrix cell (generate × env).
 *
 * CLI: compile-validity-child.mjs --entrypoint <id> --generate client|server
 *                                       --env production|development
 *
 * Prints exactly one machine-readable line prefixed with
 * @@SVELTE_COMPILE_VALIDITY@@ as the LAST stdout line. stdout noise before the
 * marker (native panics, warnings) is tolerated by the parser. A crash still
 * prints an all-FAIL payload: a gate that cannot run is not a pass.
 *
 * The child imports the plant manifest itself — plants are never shipped over
 * IPC — so the validated corpus and the manifest are the same bytes at all
 * times.
 */
import { createRequire } from "node:module";
import { loadRsvelteWasm } from "./rsvelte-wasm.mjs";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  COMPILE_VALIDITY_PLANTS,
  COMPILE_VALIDITY_SUITE_HASH,
  COMPILE_VALIDITY_SUITE_VERSION,
  CSS_VALIDITY_PLANTS,
  unknownCompileValidityResults,
} from "./compile-validity-plants.mjs";

export const COMPILE_VALIDITY_JSON_PREFIX = "@@SVELTE_COMPILE_VALIDITY@@";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

/**
 * runtimePackage: the Svelte runtime whose semantics this entrypoint's
 * compatibility class targets. The compiled output is executed against THAT
 * runtime, never against whichever svelte is fastest to import.
 */
export const ENTRYPOINTS = {
  "svelte-official": {
    label: "svelte/compiler 5.56.8",
    runtimePackage: "svelte",
    exactPath: "svelte/compiler compile() per plant, css=external, runes=true",
  },
  "svelte-mrwaip-reference": {
    label: "svelte/compiler 5.56.4 (pinned reference)",
    runtimePackage: "svelte-mrwaip-reference",
    exactPath: "svelte-mrwaip-reference/compiler compile() per plant, css=external, runes=true",
  },
  "mrwaip-svelte-rs": {
    label: "@mrwaip/svelte-rs (NAPI)",
    runtimePackage: "svelte-mrwaip-reference",
    exactPath: "@mrwaip/svelte-rs compile() per plant, css=external, runes=true",
  },
  "rsvelte-wasm": {
    label: "@rsvelte/compiler (Wasm)",
    runtimePackage: "svelte",
    exactPath: "@rsvelte/compiler compile() per plant after initSync, css=external, runes=true",
  },
  "rsvelte-native": {
    label: "@rsvelte/native NAPI",
    runtimePackage: "svelte",
    exactPath: "@rsvelte/vite-plugin-svelte-native compileSync() per plant, css=external, runes=true",
  },
};

function outputParts(raw) {
  const result = typeof raw === "string" ? JSON.parse(raw) : raw;
  return {
    js:
      typeof result?.js === "string"
        ? result.js
        : (result?.js?.code ?? result?.code ?? ""),
    css:
      typeof result?.css === "string" ? result.css : (result?.css?.code ?? ""),
    warnings: result?.warnings ?? [],
  };
}

async function loadCompiler(entrypoint) {
  if (entrypoint === "svelte-official") {
    return (await import("svelte/compiler")).compile;
  }
  if (entrypoint === "svelte-mrwaip-reference") {
    return (await import("svelte-mrwaip-reference/compiler")).compile;
  }
  if (entrypoint === "mrwaip-svelte-rs") {
    return (await import("@mrwaip/svelte-rs/compiler")).compile;
  }
  if (entrypoint === "rsvelte-wasm") {
    const wasm = await loadRsvelteWasm();
    if (typeof wasm.compile !== "function") throw new Error("no compile export");
    return (source, options) => {
      const out = wasm.compile(source, options);
      return typeof out === "string" ? JSON.parse(out) : out;
    };
  }
  if (entrypoint === "rsvelte-native") {
    const native = require("@rsvelte/vite-plugin-svelte-native");
    const fn = native.compileSync ?? native.compile;
    if (typeof fn !== "function") throw new Error("no compile/compileSync export");
    return fn;
  }
  throw new Error(`unknown entrypoint ${entrypoint}`);
}

/* ------------------------------------------------------------------ */
/* Runtime execution harness                                           */
/* ------------------------------------------------------------------ */

const parentUrl = pathToFileURL(join(rootDir, "package.json")).href;

function resolveRuntime(runtimePackage, { generate }) {
  // `render` lives in the dedicated server entry — the bare package's Node
  // default entry is the universal runtime and does not export it.
  const serverEntry = import.meta.resolve(
    `${runtimePackage}/server`,
    parentUrl,
  );
  // Node's default condition resolves the bare runtime to the SERVER entry,
  // whose mount() is a stub that throws. Client cells need the "browser"
  // condition entry, read straight from the package exports map.
  let clientEntry = serverEntry;
  try {
    // NOTE: createRequire needs a FILE path — a bare directory would resolve
    // packages from the directory's parent and silently miss every package.
    const pkgJsonPath = createRequire(join(rootDir, "package.json")).resolve(
      `${runtimePackage}/package.json`,
    );
    const exports = JSON.parse(readFileSync(pkgJsonPath, "utf8")).exports ?? {};
    const browser = exports["."]?.browser;
    if (typeof browser === "string") {
      clientEntry = pathToFileURL(
        join(dirname(pkgJsonPath), browser),
      ).href;
    }
  } catch {
    // stay on the default entry; a mount failure will surface as a plant FAIL
  }
  const mainEntry = generate === "client" ? clientEntry : serverEntry;
  // Bare `svelte` imports (setContext/getContext, stores) need the UNIVERSAL
  // entry: `<pkg>/server` does not re-export them, and the client entry is
  // wrong for SSR cells. In client cells the browser-condition entry is the
  // correct universal runtime.
  const universalEntry = import.meta.resolve(runtimePackage, parentUrl);
  const bareEntry = generate === "client" ? clientEntry : universalEntry;
  // Compiled output always emits the BARE `svelte*` specifiers regardless of
  // which copy compiled it — binding those to the class's pinned runtime is
  // what makes a version-parity claim executable instead of asserted.
  const map = {
    "svelte/internal/client": import.meta.resolve(
      `${runtimePackage}/internal/client`,
      parentUrl,
    ),
    "svelte/internal/server": import.meta.resolve(
      `${runtimePackage}/internal/server`,
      parentUrl,
    ),
    "svelte/internal/disclose-version": import.meta.resolve(
      `${runtimePackage}/internal/disclose-version`,
      parentUrl,
    ),
    "svelte/store": import.meta.resolve(`${runtimePackage}/store`, parentUrl),
    "svelte/server": serverEntry,
    svelte: bareEntry,
  };
  return { map, mainEntry, serverEntry };
}

/**
 * Rewrite a compiled module's import specifiers to the matching runtime and
 * compiled siblings. Candidates emit the same `svelte/internal/*` specifiers
 * the official compiler does (that is the compatibility contract the timed
 * gate already asserts); binding them to the class's pinned runtime is what
 * makes a byte-parity claim executable instead of asserted.
 */
function rewriteImports(code, runtimeMap, siblingMap) {
  let out = code;
  for (const [specifier, url] of Object.entries(runtimeMap)) {
    out = out.replaceAll(
      new RegExp(`from\\s*(["'])${specifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\1`, "g"),
      `from ${JSON.stringify(url)}`,
    );
  }
  for (const [specifier, url] of Object.entries(siblingMap)) {
    out = out.replaceAll(
      new RegExp(`from\\s*(["'])\\./${specifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\1`, "g"),
      `from ${JSON.stringify(url)}`,
    );
  }
  return out;
}

let jsdom = null;
function ensureDom() {
  if (jsdom) return jsdom;
  const { JSDOM } = require("jsdom");
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    pretendToBeVisual: true,
    url: "http://localhost/",
  });
  // Node >=22 exposes some of these (notably navigator) as getter-only
  // properties on globalThis; plain assignment throws.
  const assign = (key, value) => {
    try {
      globalThis[key] = value;
    } catch {
      Object.defineProperty(globalThis, key, {
        value,
        configurable: true,
        writable: true,
      });
    }
  };
  assign("window", dom.window);
  assign("document", dom.window.document);
  assign("navigator", dom.window.navigator);
  assign("HTMLElement", dom.window.HTMLElement);
  assign("SVGElement", dom.window.SVGElement);
  assign("Element", dom.window.Element);
  assign("Node", dom.window.Node);
  assign("Text", dom.window.Text);
  assign("Comment", dom.window.Comment);
  assign("DocumentFragment", dom.window.DocumentFragment);
  assign("Event", dom.window.Event);
  assign("MouseEvent", dom.window.MouseEvent);
  assign("KeyboardEvent", dom.window.KeyboardEvent);
  assign("CustomEvent", dom.window.CustomEvent);
  assign("InputEvent", dom.window.InputEvent);
  assign("MutationObserver", dom.window.MutationObserver);
  for (const name of [
    "HTMLInputElement", "HTMLTextAreaElement", "HTMLSelectElement",
    "HTMLButtonElement", "HTMLAnchorElement", "HTMLMediaElement",
    "HTMLImageElement", "HTMLFormElement", "HTMLVideoElement",
    "HTMLAudioElement", "HTMLCanvasElement", "HTMLUnknownElement",
  ]) {
    if (dom.window[name]) assign(name, dom.window[name]);
  }
  assign("getComputedStyle", dom.window.getComputedStyle.bind(dom.window));
  assign("requestAnimationFrame", (cb) => setTimeout(() => cb(Date.now()), 16));
  jsdom = dom;
  return dom;
}

function normalizeStyle(value) {
  return String(value ?? "")
    .replaceAll(" ", "")
    .replaceAll(";", "")
    .toLowerCase();
}

async function runPlantAssert(plant, { generate, dev, compile, runtime, workDir, index }) {
  const files = plant.files ?? [{ name: "Plant.svelte", source: plant.source }];
  const options = (name) => ({
    filename: name,
    generate,
    dev,
    css: "external",
    runes: true,
  });

  // 1. Compile every file through the entrypoint's exact API.
  const compiled = new Map();
  for (const file of files) {
    const raw = await compile(file.source, options(file.name));
    const parts = outputParts(raw);
    if (!parts.js) throw new Error(`compile emitted empty JavaScript for ${file.name}`);
    compiled.set(file.name, parts);
  }

  // 2. CSS oracle runs for css plants (both cells emit external CSS).
  if (plant.assertCss) {
    const parts = compiled.get(files[0].name);
    await plant.assertCss({
      css: parts.css,
      result: { js: parts.js, css: parts.css },
      warnings: parts.warnings,
    });
    return;
  }

  // 3. Write compiled modules with rewritten imports; multi-file plants get
  //    sibling rewrites (./Child.svelte → compiled sibling module).
  const dir = join(workDir, `${index}-${plant.id}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const siblingMap = {};
  const moduleUrls = new Map();
  let n = 0;
  for (const [name, parts] of compiled) {
    const slug = `${String(n++).padStart(2, "0")}-${name.replace(/\.svelte$/, ".mjs")}`;
    moduleUrls.set(name, pathToFileURL(join(dir, slug)).href);
    siblingMap[name.replace(/^.*[\\/]/, "")] = pathToFileURL(join(dir, slug)).href;
  }
  for (const [name, parts] of compiled) {
    const target = moduleUrls.get(name);
    const code = rewriteImports(parts.js, runtime.map, siblingMap);
    const disk = fileURLToPath(target);
    writeFileSync(disk, `${code}\n`);
    moduleUrls.set(name, `${target}?plant=${index}-${Date.now()}`);
  }

  const mainName = files[0].name;
  const module = await import(moduleUrls.get(mainName));
  const component = module.default;
  if (typeof component !== "function") {
    throw new Error("compiled module has no default component export");
  }

  if (generate === "server") {
    const { render } = await import(runtime.serverEntry);
    const out = await render(component, { props: {} });
    const html = out?.html ?? out?.body ?? "";
    if (plant.assertServer) await plant.assertServer({ html, module });
    return;
  }

  // 4. Client: jsdom mount + observable DOM/event behaviour.
  ensureDom();
  const clientRuntime = await import(runtime.mainEntry);
  const root = document.createElement("div");
  document.body.appendChild(root);
  let app = null;
  try {
    const ctx = {
      window,
      document,
      exports: {},
      q: (sel) => root.querySelector(sel),
      qa: (sel) => [...root.querySelectorAll(sel)],
      text: (sel) => root.querySelector(sel)?.textContent ?? null,
      fire: (selOrEl, type, init = {}) => {
        const el =
          typeof selOrEl === "string" ? root.querySelector(selOrEl) : selOrEl;
        if (!el) throw new Error(`fire(${type}): element not found`);
        el.dispatchEvent(
          new window.Event(type, { bubbles: true, cancelable: true, ...init }),
        );
      },
      flush: () => clientRuntime.flushSync(),
      mount: (props = {}) => {
        app = clientRuntime.mount(component, { target: root, props });
        ctx.exports = app;
        // mount() schedules initial effects; flush so template output is
        // observable immediately after mount returns.
        clientRuntime.flushSync();
        return app;
      },
      // For plants whose semantics settle on a microtask/macrotask (e.g.
      // {#await} resolution), a bounded settling step the plant can await.
      wait: async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
        clientRuntime.flushSync();
      },
      // The compiled module itself (module-script exports live here, not on
      // the mount() return, which carries instance exports only).
      module,
      styleOf: (sel) => normalizeStyle(root.querySelector(sel)?.getAttribute("style")),
    };
    if (plant.assertClient) await plant.assertClient(ctx);
  } finally {
    if (app && typeof clientRuntime.unmount === "function") {
      try {
        clientRuntime.unmount(app);
      } catch {
        // teardown failures do not fail the plant's semantic verdict
      }
    }
    root.remove();
  }
}

export async function runCompileValidityChild(options) {
  const { entrypoint, generate, env } = options;
  const meta = ENTRYPOINTS[entrypoint];
  const dev = env === "development";
  const header = {
    schemaVersion: 1,
    suiteVersion: COMPILE_VALIDITY_SUITE_VERSION,
    suiteHash: COMPILE_VALIDITY_SUITE_HASH,
    entrypoint,
    label: meta.label,
    exactPath: meta.exactPath,
    generate,
    env,
    runtimePackage: meta.runtimePackage,
  };
  const allPlants = [...COMPILE_VALIDITY_PLANTS, ...CSS_VALIDITY_PLANTS];
  const results = [];

  let compile;
  try {
    compile = await loadCompiler(entrypoint);
  } catch (error) {
    return {
      ...header,
      status: "UNKNOWN",
      reason: `entrypoint unavailable: ${error instanceof Error ? error.message : String(error)}`,
      plantCount: allPlants.length,
      passed: 0,
      failed: 0,
      unknown: allPlants.length,
      results: unknownCompileValidityResults(
        `entrypoint unavailable: ${error instanceof Error ? error.message : String(error)}`,
      ),
    };
  }

  const runtime = resolveRuntime(meta.runtimePackage, { generate });
  const workDir = join(
    rootDir,
    "work",
    "compile-validity",
    `${process.pid}-${entrypoint}-${generate}-${env}-${Math.random().toString(36).slice(2, 8)}`,
  );
  rmSync(workDir, { recursive: true, force: true });
  mkdirSync(workDir, { recursive: true });

  try {
    let index = 0;
    for (const plant of allPlants) {
      try {
        await runPlantAssert(plant, {
          generate,
          dev,
          compile,
          runtime,
          workDir,
          index: index++,
        });
        results.push({
          id: plant.id,
          coverage: plant.coverage,
          status: "PASS",
          phase: generate === "server" ? "runtime-server" : "runtime-client",
        });
      } catch (error) {
        results.push({
          id: plant.id,
          coverage: plant.coverage,
          status: "FAIL",
          phase: "plant",
          detail: (error instanceof Error ? error.message : String(error)).slice(0, 500),
        });
      }
    }
  } finally {
    rmSync(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  }

  const failed = results.filter((r) => r.status === "FAIL").length;
  const unknown = results.filter((r) => r.status === "UNKNOWN").length;
  const passed = results.filter((r) => r.status === "PASS").length;
  const status = failed > 0 ? "FAIL" : unknown > 0 ? "UNKNOWN" : "PASS";
  return {
    ...header,
    status,
    reason:
      status === "PASS"
        ? `${passed}/${allPlants.length} plants passed`
        : `${failed} failed, ${unknown} unknown of ${allPlants.length}`,
    plantCount: allPlants.length,
    passed,
    failed,
    unknown,
    results,
  };
}

function cliOptions(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    out[argv[i].replace(/^--/, "")] = argv[i + 1];
  }
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const opts = cliOptions(process.argv.slice(2));
  runCompileValidityChild({
    entrypoint: opts.entrypoint,
    generate: opts.generate ?? "client",
    env: opts.env ?? "production",
  })
    .then((payload) => {
      // Exactly one prefixed line, printed last.
      console.log(`${COMPILE_VALIDITY_JSON_PREFIX}${JSON.stringify(payload)}`);
    })
    .catch((error) => {
      const payload = {
        status: "FAIL",
        reason: `child crashed: ${error instanceof Error ? error.message : String(error)}`,
        results: unknownCompileValidityResults(
          `child crashed: ${error instanceof Error ? error.stack : String(error)}`,
        ),
      };
      console.log(`${COMPILE_VALIDITY_JSON_PREFIX}${JSON.stringify(payload)}`);
      process.exitCode = 1;
    });
}
