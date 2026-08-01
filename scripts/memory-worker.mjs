#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { measureMemory } from "./lib/memory.mjs";

const require = createRequire(import.meta.url);

function parseArgs(argv) {
  const index = argv.indexOf("--task");
  return { task: index >= 0 ? argv[index + 1] : "" };
}

function readSources(files) {
  return files.map((file) => ({
    ...file,
    source: readFileSync(file.path, "utf8"),
  }));
}

function outputParts(result) {
  const js =
    typeof result?.js === "string"
      ? result.js
      : (result?.js?.code ?? result?.code ?? "");
  const css =
    typeof result?.css === "string" ? result.css : (result?.css?.code ?? "");
  return { js, css };
}

function validateRuntime(result, file) {
  const { js, css } = outputParts(result);
  if (!js || !js.includes("svelte/internal/client")) {
    throw new Error(`${file.filename} lacks Svelte client runtime output`);
  }
  if (/\$state\s*\(/.test(js)) {
    throw new Error(`${file.filename} retained an uncompiled $state rune`);
  }
  const marker = /Comp(\d{5})\.svelte$/i.exec(file.filename)?.[1];
  if (marker && !`${js}\n${css}`.includes(marker)) {
    throw new Error(`${file.filename} lost fixture marker ${marker}`);
  }
  return js.length + css.length;
}

async function compile(payload) {
  const sources = readSources(payload.files);
  let compileOne;
  let cleanup = () => {};

  if (payload.implementation === "svelte") {
    const module = await import("svelte/compiler");
    compileOne = (file) =>
      module.compile(file.source, {
        filename: file.filename,
        generate: "client",
        dev: false,
        css: "external",
        runes: true,
      });
  } else if (payload.implementation === "svelte-mrwaip-reference") {
    const module = await import("svelte-mrwaip-reference/compiler");
    compileOne = (file) =>
      module.compile(file.source, {
        filename: file.filename,
        generate: "client",
        dev: false,
        css: "external",
        runes: true,
      });
  } else if (payload.implementation === "mrwaip") {
    const module = await import("@mrwaip/svelte-rs/compiler");
    compileOne = (file) =>
      module.compile(file.source, {
        filename: file.filename,
        generate: "client",
        dev: false,
        css: "external",
        runes: true,
      });
  } else if (payload.implementation === "rsvelte-native") {
    const module = await import("@rsvelte/vite-plugin-svelte-native");
    const fn = module.compileSync ?? module.compile;
    if (typeof fn !== "function")
      throw new Error("native compile API unavailable");
    compileOne = (file) =>
      fn(file.source, {
        filename: file.filename,
        generate: "client",
        dev: false,
        css: "external",
        runes: true,
      });
  } else if (payload.implementation === "rsvelte-wasm") {
    const module = await import("@rsvelte/compiler");
    const packageJson = require.resolve("@rsvelte/compiler/package.json");
    const wasm = readFileSync(
      join(dirname(packageJson), "rsvelte_lint_bg.wasm"),
    );
    if (typeof module.initSync === "function")
      module.initSync({ module: wasm });
    else if (typeof module.default === "function") {
      await module.default({ module: wasm });
    } else if (typeof module.initialize === "function") {
      await module.initialize();
    }
    const fn = module.compile ?? module.compile_client ?? module.compileClient;
    if (typeof fn !== "function")
      throw new Error("Wasm compile API unavailable");
    compileOne = (file) => {
      const value =
        fn === module.compile
          ? fn(file.source, {
              filename: file.filename,
              generate: "client",
              dev: false,
              css: "external",
              runes: true,
            })
          : fn(file.source, file.filename);
      const decoded = typeof value === "string" ? JSON.parse(value) : value;
      cleanup = () => decoded?.free?.();
      return decoded;
    };
  } else {
    throw new Error(`unknown compile implementation ${payload.implementation}`);
  }

  let artifact = 0;
  for (const file of sources) {
    const result = await compileOne(file);
    artifact += validateRuntime(result, file);
    cleanup();
  }
  return {
    artifact,
    gate: `${sources.length}/${sources.length} non-empty client outputs passed runtime and marker gates`,
  };
}

function projectionOptions(file) {
  return {
    filename: file.filename,
    isTsFile: /<script\b[^>]*\blang=["']ts["']/.test(file.source),
    mode: "ts",
    version: "5",
  };
}

function validateProjection(code, file, helper) {
  if (!code || !code.includes(helper)) {
    throw new Error(`${file.filename} lacks ${helper} projection helpers`);
  }
  const marker = /Comp(\d{5})\.svelte$/i.exec(file.filename)?.[1];
  if (marker && !code.includes(marker)) {
    throw new Error(`${file.filename} lost fixture marker ${marker}`);
  }
  return code.length;
}

async function projection(payload) {
  const sources = readSources(payload.files);
  let artifact = 0;

  if (payload.implementation === "svelte2tsx") {
    const module = await import("svelte2tsx");
    const transform = module.svelte2tsx ?? module.default;
    for (const file of sources) {
      artifact += validateProjection(
        transform(file.source, projectionOptions(file))?.code,
        file,
        "__sveltets_",
      );
    }
  } else if (payload.implementation === "rsvelte-svelte2tsx") {
    const module = await import("@rsvelte/svelte2tsx");
    if (typeof module.initialize === "function") await module.initialize();
    const transform = module.svelte2tsx ?? module.default;
    for (const file of sources) {
      artifact += validateProjection(
        transform(file.source, projectionOptions(file))?.code,
        file,
        "__sveltets_",
      );
    }
  } else if (payload.implementation === "verter") {
    const { VerterHost } = await import("@verter/native");
    const host = new VerterHost({ analysisLevel: "full" });
    try {
      for (const file of sources) {
        const id = file.path.replaceAll("\\", "/");
        host.upsert({
          canonicalId: id,
          inputId: id,
          source: Buffer.from(file.source),
          fileKind: "svelte",
        });
        if (host.ensureIdeCompiled(id) !== true) {
          throw new Error(`${file.filename} did not compile an IDE projection`);
        }
        artifact += validateProjection(
          host.getIde(id)?.code,
          file,
          "@verter/svelte-jsx",
        );
      }
    } finally {
      host.close?.();
    }
  } else {
    throw new Error(
      `unknown projection implementation ${payload.implementation}`,
    );
  }

  return {
    artifact,
    gate: `${sources.length}/${sources.length} non-empty source-specific projections`,
  };
}

const handlers = { compile, projection };

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.task || !existsSync(args.task)) {
    throw new Error("memory-worker requires --task FILE");
  }
  const task = JSON.parse(readFileSync(args.task, "utf8"));
  const handler = handlers[task.handler];
  if (!handler) throw new Error(`unknown memory handler ${task.handler}`);
  const result = await measureMemory(() => handler(task.payload));
  process.stdout.write(`${JSON.stringify({ id: task.id, ...result })}\n`);
}

main().catch((error) => {
  process.stdout.write(
    `${JSON.stringify({ status: "error", error: error instanceof Error ? error.message : String(error) })}\n`,
  );
  process.exitCode = 1;
});
