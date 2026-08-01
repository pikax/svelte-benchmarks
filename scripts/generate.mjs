#!/usr/bin/env node
/**
 * Generate Svelte 5 SFC fixtures.
 *
 * Default: UNIQUE content per file (uniquify) — required for compile ranking
 * benches against content-hash caches.
 *
 * Also emits:
 *   fixtures/{N}-repeated  — IDENTICAL body every file (cache-behavior demo only)
 */

import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  writeEnvDTs,
  writeSvelteConfig,
  writeTsconfig,
} from "./lib/fixtures.mjs";
import {
  createTemplates,
  uniquify,
  repeatedBodyTemplate,
} from "./lib/templates.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const args = {
    counts: "50,200,1000",
    out: "fixtures",
    withRepeated: true,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--counts") args.counts = argv[++i];
    else if (a === "--out") args.out = argv[++i];
    else if (a === "--with-repeated") args.withRepeated = true;
    else if (a === "--no-repeated") args.withRepeated = false;
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

function contentSha(source) {
  return createHash("sha256").update(source).digest("hex").slice(0, 16);
}

function writeSupportFiles(dir, { name, count, mode, uniqueContents }) {
  writeEnvDTs(dir);
  writeTsconfig(dir);
  writeSvelteConfig(dir);
  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify({ private: true, type: "module", name }, null, 2)}\n`,
  );
  writeFileSync(
    join(dir, "eslint.config.mjs"),
    `import svelte from "eslint-plugin-svelte";

export default [
  ...svelte.configs["flat/recommended"],
  {
    files: ["**/*.svelte"],
    rules: {
      "svelte/no-at-html-tags": "error",
      "svelte/require-each-key": "warn",
    },
  },
];
`,
  );
  writeFileSync(
    join(dir, ".prettierrc.json"),
    `${JSON.stringify(
      {
        semi: true,
        singleQuote: true,
        trailingComma: "all",
        printWidth: 100,
        plugins: ["prettier-plugin-svelte"],
        overrides: [{ files: "*.svelte", options: { parser: "svelte" } }],
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    join(dir, "manifest.json"),
    `${JSON.stringify(
      {
        count,
        mode,
        uniqueContents,
        framework: "svelte",
        generatedAt: new Date().toISOString(),
        note:
          mode === "repeated"
            ? "INTENTIONAL identical file bodies (different names) for content-hash cache demos. Do NOT use as primary compile ranking."
            : "Every .svelte body is content-unique (uniquify). Safe against content-hash caches.",
      },
      null,
      2,
    )}\n`,
  );
}

function writeUniqueCorpus(dir, count) {
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const templates = createTemplates();
  const shas = new Set();
  for (let i = 0; i < count; i++) {
    const base = templates[i % templates.length];
    const source = uniquify(base, i);
    const sha = contentSha(source);
    if (shas.has(sha)) {
      const salted = uniquify(`${base}\n<!-- salt:${i}:${Date.now()} -->\n`, i);
      writeFileSync(
        join(dir, `Comp${String(i).padStart(5, "0")}.svelte`),
        salted,
      );
      shas.add(contentSha(salted));
    } else {
      shas.add(sha);
      writeFileSync(
        join(dir, `Comp${String(i).padStart(5, "0")}.svelte`),
        source,
      );
    }
  }
  writeSupportFiles(dir, {
    name: `svelte-bench-${count}`,
    count,
    mode: "unique",
    uniqueContents: true,
  });
  return shas.size;
}

function writeRepeatedCorpus(dir, count) {
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const body = repeatedBodyTemplate();
  for (let i = 0; i < count; i++) {
    writeFileSync(join(dir, `Comp${String(i).padStart(5, "0")}.svelte`), body);
  }
  writeSupportFiles(dir, {
    name: `svelte-bench-${count}-repeated`,
    count,
    mode: "repeated",
    uniqueContents: false,
  });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage: node scripts/generate.mjs [--counts 50,200,1000] [--out fixtures]
  --no-repeated   skip fixtures/N-repeated corpora`);
    process.exit(0);
  }

  const outRoot = join(rootDir, args.out);
  mkdirSync(outRoot, { recursive: true });
  const counts = args.counts
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);

  for (const count of counts) {
    const uniqueDir = join(outRoot, String(count));
    const unique = writeUniqueCorpus(uniqueDir, count);
    console.log(
      `wrote ${uniqueDir} (${unique} unique content SHAs / ${count} files)`,
    );

    // Also emit a small 20-file corpus when generating 50+ for smoke
    if (count >= 50 && !counts.includes(20)) {
      // only once
    }

    if (args.withRepeated) {
      const repDir = join(outRoot, `${count}-repeated`);
      writeRepeatedCorpus(repDir, count);
      console.log(`wrote ${repDir} (repeated bodies — cache demo only)`);
    }
  }

  // Always ensure a 20-file smoke corpus exists
  if (!counts.includes(20)) {
    const smokeDir = join(outRoot, "20");
    const unique = writeUniqueCorpus(smokeDir, 20);
    console.log(`wrote ${smokeDir} smoke corpus (${unique} unique / 20 files)`);
  }

  console.log("generate done");
}

main();
