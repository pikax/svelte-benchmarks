/**
 * Vite integration surfaces over the generated Svelte corpus.
 *
 * These are deliberately not project-native build claims. Both integrations
 * receive one generated module graph, one Vite version, and identical options.
 */

import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, relative } from "node:path";
import { performance } from "node:perf_hooks";
import { build, createServer } from "vite";
import { svelte as officialSvelte } from "@sveltejs/vite-plugin-svelte";
import { svelte as rsvelteSvelte } from "@rsvelte/vite-plugin-svelte";
import { collectSvelteFiles } from "../fixtures.mjs";
import { measureVariants } from "../timing.mjs";

const INTEGRATIONS = [
  {
    id: "vite-svelte-official",
    label: "Vite 7 × @sveltejs/vite-plugin-svelte",
    package: "@sveltejs/vite-plugin-svelte",
    engine: "svelte-js",
    factory: officialSvelte,
  },
  {
    id: "vite-svelte-rsvelte",
    label: "Vite 7 × @rsvelte/vite-plugin-svelte",
    package: "@rsvelte/vite-plugin-svelte",
    engine: "rsvelte-native",
    factory: rsvelteSvelte,
  },
];

function slash(value) {
  return value.replaceAll("\\", "/");
}

function prepareApp(fixtureDir, workRoot, label, fileLimit) {
  const files = collectSvelteFiles(fixtureDir, fileLimit);
  if (files.length === 0) throw new Error("Vite surface found no Svelte files");
  const appDir = join(workRoot, "vite", label);
  const componentDir = join(appDir, "components");
  rmSync(appDir, { recursive: true, force: true });
  mkdirSync(componentDir, { recursive: true });
  for (const file of files) {
    const destination = join(componentDir, file);
    mkdirSync(join(destination, ".."), { recursive: true });
    copyFileSync(join(fixtureDir, file), destination);
  }
  const imports = files.map(
    (file, index) =>
      `import C${index} from ${JSON.stringify(`./components/${slash(file)}`)};`,
  );
  const entry = [
    ...imports,
    `export const __svelte_bench_file_count__ = ${files.length};`,
    `export const components = [${files.map((_, index) => `C${index}`).join(", ")}];`,
    "",
  ].join("\n");
  writeFileSync(join(appDir, "bench-entry.js"), entry);
  writeFileSync(
    join(appDir, "package.json"),
    `${JSON.stringify({ name: `svelte-bench-${label}`, private: true, type: "module" }, null, 2)}\n`,
  );
  return { appDir, componentDir, entry: join(appDir, "bench-entry.js"), files };
}

function integrationPlugins(integration, hot) {
  return integration.factory({
    emitCss: true,
    hot,
    inspector: false,
    compilerOptions: { runes: true },
  });
}

function censusPlugin(componentDir, census) {
  return {
    name: "svelte-bench-transform-census",
    enforce: "post",
    transform(code, id) {
      if (id.includes("?")) return null;
      const clean = id.split("?", 1)[0];
      if (!clean.endsWith(".svelte")) return null;
      const rel = slash(relative(componentDir, clean));
      if (!rel || rel.startsWith("../")) return null;
      census.set(rel, {
        bytes: Buffer.byteLength(code),
        runtime: code.includes("svelte/internal/"),
      });
      return null;
    },
  };
}

export function censusVerdict(census, files) {
  const expected = files.map(slash).sort();
  const covered = [...census.keys()].sort();
  const exact =
    expected.length === covered.length &&
    expected.every((file, index) => file === covered[index]);
  const runtime = [...census.values()].every(
    (entry) => entry.bytes > 0 && entry.runtime,
  );
  return { exact, runtime, covered: covered.length, expected: expected.length };
}

function outputBytes(output) {
  const groups = Array.isArray(output) ? output : [output];
  return groups
    .flatMap((group) => group?.output ?? [])
    .reduce((sum, item) => {
      if (typeof item.code === "string")
        return sum + Buffer.byteLength(item.code);
      if (typeof item.source === "string")
        return sum + Buffer.byteLength(item.source);
      if (item.source?.byteLength) return sum + item.source.byteLength;
      return sum;
    }, 0);
}

async function buildOnce(app, integration) {
  const census = new Map();
  const started = performance.now();
  const output = await build({
    root: app.appDir,
    configFile: false,
    logLevel: "silent",
    clearScreen: false,
    plugins: [
      ...integrationPlugins(integration, false),
      censusPlugin(app.componentDir, census),
    ],
    build: {
      write: false,
      minify: false,
      cssMinify: false,
      reportCompressedSize: false,
      lib: { entry: app.entry, formats: ["es"], fileName: "bench" },
      rollupOptions: {
        external: (id) => id === "svelte" || id.startsWith("svelte/"),
        treeshake: false,
      },
    },
  });
  const ms = performance.now() - started;
  const artifact = outputBytes(output);
  return {
    ms,
    artifact,
    census: censusVerdict(census, app.files),
  };
}

function gateFailure(result) {
  if (result.artifact <= 0) return "bundle emitted no output";
  if (!result.census.exact) {
    return `transform census covered ${result.census.covered}/${result.census.expected} Svelte files`;
  }
  if (!result.census.runtime)
    return "post-transform output lacked Svelte runtime code";
  return "";
}

export async function runBundleSurface(fixtureDir, options) {
  const app = prepareApp(
    fixtureDir,
    options.workRoot,
    "bundle",
    options.fileLimit,
  );
  const gates = new Map();
  for (const integration of INTEGRATIONS) {
    try {
      const result = await buildOnce(app, integration);
      gates.set(integration.id, {
        error: gateFailure(result),
        result,
      });
    } catch (error) {
      gates.set(integration.id, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const variants = INTEGRATIONS.map((integration) => {
    const gate = gates.get(integration.id);
    return {
      id: integration.id,
      label: integration.label,
      package: integration.package,
      comparisonClass: "vite-7-svelte-integration-build",
      engine: integration.engine,
      invocation: "in-process Vite build API",
      threading: "Vite default",
      artifactLabel: "bundle bytes",
      notes: gate?.error
        ? `⚠ FAILED VALIDATION — ${gate.error}`
        : `${gate.result.census.covered}/${gate.result.census.expected} Svelte transforms passed the untimed census`,
      unranked: Boolean(gate?.error),
      measure: async () => {
        const result = await buildOnce(app, integration);
        const failure = gateFailure(result);
        if (failure) throw new Error(failure);
        return { ms: result.ms, meta: { artifact: result.artifact } };
      },
    };
  });
  const measured = await measureVariants(variants, {
    runs: options.runs,
    warmups: options.warmups,
    fileCount: app.files.length,
  });
  return {
    id: "bundle",
    label: "Vite production bundle (generated Svelte graph)",
    files: app.files.length,
    bytes: app.files.reduce(
      (sum, file) => sum + readFileSync(join(app.componentDir, file)).length,
      0,
    ),
    variants: measured,
    methodology: [
      "Both rows use Vite 7.3.6, the newest Vite major supported by both pinned plugin lines without peer conflicts.",
      "The generated entry imports every selected component; Rollup tree-shaking and minification are disabled and Svelte runtime imports are externalized identically.",
      "An untimed post-transform census requires every Svelte file to reach non-empty compiled runtime code. A partial graph remains visible but unranked.",
      "Plugin construction and the complete in-process Vite build are inside the measured interval; package module loading occurs before the surface starts for both rows.",
      "This is one controlled generated module graph, not a claim about any third-party project's native build.",
    ],
  };
}

function changedSource(original, token) {
  return `${original.trimEnd()}\n<span data-bench-hmr=${JSON.stringify(token)}></span>\n`;
}

async function incrementalOnce(app, integration, token) {
  const probe = app.files[0];
  const probePath = join(app.componentDir, probe);
  const url = `/components/${slash(probe)}`;
  const original = readFileSync(probePath, "utf8");
  const server = await createServer({
    root: app.appDir,
    configFile: false,
    logLevel: "silent",
    clearScreen: false,
    appType: "custom",
    plugins: integrationPlugins(integration, true),
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true },
  });
  try {
    const initial = await server.transformRequest(url);
    if (!/svelte(?:\/|_)internal(?:\/|_)client/.test(initial?.code ?? "")) {
      throw new Error("initial dev transform lacked Svelte runtime code");
    }
    writeFileSync(probePath, changedSource(original, token));
    const started = performance.now();
    server.moduleGraph.onFileChange(probePath);
    const updated = await server.transformRequest(
      `${url}?t=${encodeURIComponent(token)}`,
    );
    const ms = performance.now() - started;
    if (!updated?.code?.includes(token)) {
      throw new Error(
        "incremental transform did not contain the changed marker",
      );
    }
    return {
      ms,
      artifact: Buffer.byteLength(updated.code),
    };
  } finally {
    writeFileSync(probePath, original);
    await server.close();
  }
}

export async function runHmrSurface(fixtureDir, options) {
  const app = prepareApp(
    fixtureDir,
    options.workRoot,
    "hmr",
    options.fileLimit,
  );
  const gates = new Map();
  for (const integration of INTEGRATIONS) {
    try {
      const result = await incrementalOnce(
        app,
        integration,
        `bench-hmr-gate-${integration.id}`,
      );
      gates.set(integration.id, { result });
    } catch (error) {
      gates.set(integration.id, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  const variants = INTEGRATIONS.map((integration) => {
    const gate = gates.get(integration.id);
    return {
      id: `hmr-${integration.id}`,
      label: integration.label,
      package: integration.package,
      comparisonClass: "vite-7-warm-incremental-svelte-transform",
      engine: integration.engine,
      invocation: "in-process Vite dev transform",
      threading: "Vite default",
      artifactLabel: "module bytes",
      notes: gate?.error
        ? `⚠ FAILED VALIDATION — ${gate.error}`
        : "fresh dev server, initial module transform discarded, changed marker required in updated module",
      unranked: Boolean(gate?.error),
      fileCount: 1,
      measure: async ({ phase, iteration }) => {
        const token = `bench-hmr-${phase}-${iteration}-${integration.id}`;
        const result = await incrementalOnce(app, integration, token);
        return { ms: result.ms, meta: { artifact: result.artifact } };
      },
    };
  });
  const measured = await measureVariants(variants, {
    runs: options.runs,
    warmups: options.warmups,
    fileCount: 1,
  });
  return {
    id: "hmr",
    label: "Warm incremental Svelte transform (Vite HMR compile path)",
    files: 1,
    bytes: readFileSync(join(app.componentDir, app.files[0])).length,
    variants: measured,
    methodology: [
      `Both rows edit the same first file from a ${app.files.length}-file generated corpus and require the unique edit marker in Vite's updated module.`,
      "Each pass creates a fresh dev server, performs and discards the initial module transform, then times invalidation plus the changed module transform.",
      "Server creation, initial transform, file write, restoration, and shutdown are outside the measured interval.",
      "This measures the warm server-side Svelte transform path only. It excludes filesystem watcher debounce, WebSocket delivery, browser fetch/execution, and DOM patching, so it is not labeled an end-to-end HMR round trip.",
      "Both integrations use the same Vite version and identical hot/compiler options.",
    ],
  };
}
