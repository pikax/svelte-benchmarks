import { createRequire } from "node:module";
import os from "node:os";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";
import {
  collectSvelteFiles,
  prepareLintDir,
  totalBytes,
} from "../fixtures.mjs";
import {
  measureVariants,
  resolveBin,
  runCommand,
  timedAsync,
  timedSync,
} from "../timing.mjs";
import {
  applyFileCoverageGate,
  applyWorkGate,
  cliReportsPlantedIssue,
  countCoveredFiles,
  plantForCoverage,
  prepareLintPlant,
} from "../work-gate.mjs";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const cpuCount = os.cpus().length;

function tryResolveBin(name) {
  try {
    return resolveBin(name, rootDir);
  } catch {
    return null;
  }
}

function isWinShell(bin) {
  return process.platform === "win32" && bin.endsWith(".cmd");
}

export function isLintExitOperationalFailure(status) {
  return status !== 0 && status !== 1;
}

function runLintCommand(bin, args, cwd) {
  const result = runCommand(bin, args, {
    cwd,
    allowNonZeroExit: true,
    shell: isWinShell(bin),
  });
  if (isLintExitOperationalFailure(result.status)) {
    const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
    throw new Error(
      `${bin} ${args.join(" ")} exited with ${result.status}\n${output.slice(0, 4000)}`,
    );
  }
  return result;
}

async function runEslintWorkers(cwd, files, eslintPath) {
  const workerCount = Math.min(cpuCount, files.length);
  if (workerCount === 0) return;
  const chunkSize = Math.ceil(files.length / workerCount);
  const workerCode = `
    const { parentPort, workerData } = require("node:worker_threads");
    const { ESLint } = require(workerData.eslintPath);
    (async () => {
      const eslint = new ESLint({ overrideConfigFile: workerData.configFile, cwd: workerData.cwd });
      await eslint.lintFiles(workerData.files);
      parentPort.postMessage("done");
    })().catch((error) => parentPort.postMessage({ error: error?.stack ?? String(error) }));
  `;
  const workers = [];
  for (let i = 0; i < workerCount; i++) {
    const chunk = files
      .slice(i * chunkSize, (i + 1) * chunkSize)
      .map((file) => join(cwd, file));
    if (chunk.length === 0) continue;
    const worker = new Worker(workerCode, {
      eval: true,
      workerData: {
        cwd,
        configFile: join(cwd, "eslint.config.mjs"),
        files: chunk,
        eslintPath,
      },
    });
    workers.push(
      new Promise((resolve, reject) => {
        worker.on("message", (message) =>
          message?.error ? reject(new Error(message.error)) : resolve(message),
        );
        worker.on("error", reject);
        worker.on("exit", (code) => {
          if (code !== 0) reject(new Error(`eslint worker exit ${code}`));
        });
      }),
    );
  }
  await Promise.all(workers);
}

function diagnosticsMentionHtml(value) {
  try {
    return /@html|no-at-html|xss|unsafe.{0,12}html/i.test(
      JSON.stringify(value),
    );
  } catch {
    return false;
  }
}

/** Lint throughput over one isolated Svelte corpus. */
export async function runLintSurface(fixtureDir, options) {
  const files = collectSvelteFiles(
    fixtureDir,
    options.lintFileLimit ?? options.fileLimit,
  );
  const bytes = totalBytes(fixtureDir, files);
  const lintDir = prepareLintDir(
    fixtureDir,
    files,
    options.workRoot,
    `n${files.length}`,
  );
  const filePaths = files.map((file) => join(lintDir, file));

  let eslintPath = null;
  try {
    eslintPath = require.resolve("eslint", { paths: [rootDir] });
  } catch {
    eslintPath = null;
  }
  const eslintBin = tryResolveBin("eslint");
  const rsvelteLint = tryResolveBin("rsvelte-lint");

  let verterNative = null;
  try {
    verterNative = require(
      require.resolve("@verter/native", { paths: [rootDir] }),
    );
  } catch {
    verterNative = null;
  }

  const variants = [];
  if (eslintPath) {
    const { ESLint } = await import("eslint");
    variants.push({
      id: "eslint-plugin-svelte-1t",
      label: "eslint-plugin-svelte (1T)",
      package: "eslint-plugin-svelte",
      comparisonClass: "eslint-recommended-rules",
      threading: "1t",
      invocation: "in-process",
      notes:
        "ESLint flat config + eslint-plugin-svelte recommended; explicit file list",
      measure: () =>
        timedAsync(async () => {
          const eslint = new ESLint({
            overrideConfigFile: join(lintDir, "eslint.config.mjs"),
            cwd: lintDir,
          });
          await eslint.lintFiles(filePaths);
        }),
    });
    variants.push({
      id: "eslint-plugin-svelte-workers",
      label: `eslint-plugin-svelte (${Math.min(cpuCount, files.length)} workers)`,
      package: "eslint-plugin-svelte",
      comparisonClass: "eslint-recommended-rules",
      threading: "workers",
      invocation: "in-process",
      notes: "ESLint worker_threads fan-out; explicit file list",
      measure: () =>
        timedAsync(() => runEslintWorkers(lintDir, files, eslintPath)),
    });
  } else {
    variants.push({
      id: "eslint-plugin-svelte",
      label: "eslint-plugin-svelte",
      package: "eslint-plugin-svelte",
      comparisonClass: "eslint-recommended-rules",
      notes: "eslint not installed",
      skip: true,
    });
  }

  if (eslintBin) {
    variants.push({
      id: "eslint-plugin-svelte-cli",
      label: "eslint-plugin-svelte (CLI)",
      package: "eslint-plugin-svelte",
      comparisonClass: "eslint-recommended-rules",
      threading: "1t",
      invocation: "cli",
      notes:
        "eslint . over the same isolated corpus; pays startup and config load",
      measure: () => runLintCommand(eslintBin, ["."], lintDir).ms,
    });
  }

  if (rsvelteLint) {
    variants.push({
      id: "rsvelte-lint",
      label: "rsvelte-lint",
      package: "@rsvelte/lint",
      comparisonClass: "rsvelte-native-rules",
      threading: "max",
      invocation: "cli",
      notes: "rsvelte-lint . (Rust linter)",
      measure: () => runLintCommand(rsvelteLint, ["."], lintDir).ms,
    });
  } else {
    variants.push({
      id: "rsvelte-lint",
      label: "rsvelte-lint",
      package: "@rsvelte/lint",
      comparisonClass: "rsvelte-native-rules",
      notes: "Binary not found",
      skip: true,
    });
  }

  if (verterNative?.VerterHost) {
    const sources = files.map((file) => ({
      path: join(lintDir, file).replace(/\\/g, "/"),
      source: readFileSync(join(lintDir, file), "utf8"),
    }));
    variants.push({
      id: "verter-host-lint",
      label: "Verter host lint",
      package: "@verter/native",
      comparisonClass: "verter-native-diagnostics",
      threading: "1t",
      invocation: "in-process",
      notes:
        "VerterHost.upsert(fileKind=svelte) + lint/getDiagnostics for each explicit file",
      measure: () =>
        timedSync(() => {
          const host = new verterNative.VerterHost({ analysisLevel: "full" });
          for (const file of sources) {
            host.upsert({
              inputId: file.path,
              source: file.source,
              fileKind: "svelte",
            });
            if (typeof host.lint === "function") host.lint(file.path);
            else if (typeof host.getDiagnostics === "function")
              host.getDiagnostics(file.path);
            else
              throw new Error("VerterHost exposes no lint or diagnostics API");
          }
        }),
    });
  } else {
    variants.push({
      id: "verter-host-lint",
      label: "Verter host lint",
      package: "@verter/native",
      comparisonClass: "verter-native-diagnostics",
      notes: "VerterHost not available",
      skip: true,
    });
  }

  // Planted template-rule gate, applied equally to every implementation.
  const plant = prepareLintPlant(options.workRoot);
  try {
    let eslintOk = false;
    if (eslintPath) {
      const { ESLint } = await import("eslint");
      const eslint = new ESLint({
        overrideConfigFile: join(plant.dir, "eslint.config.mjs"),
        cwd: plant.dir,
      });
      const results = await eslint.lintFiles([plant.dirtyFile]);
      eslintOk = results
        .flatMap((result) => result.messages ?? [])
        .some((message) => message.ruleId === "svelte/no-at-html-tags");
    }
    await applyWorkGate(variants, (variant) => {
      if (variant.id.startsWith("eslint-plugin-svelte")) return eslintOk;
      if (variant.id === "rsvelte-lint") {
        return cliReportsPlantedIssue(
          rsvelteLint,
          ["Dirty.svelte"],
          plant.dir,
          {
            filename: "Dirty.svelte",
            diagnostic: /\{@html\}[^\n]*can lead to XSS attack/i,
          },
        );
      }
      if (variant.id === "verter-host-lint") {
        try {
          const host = new verterNative.VerterHost({ analysisLevel: "full" });
          const id = plant.dirtyFile.replace(/\\/g, "/");
          host.upsert({
            inputId: id,
            source: readFileSync(plant.dirtyFile, "utf8"),
            fileKind: "svelte",
          });
          const diagnostics =
            typeof host.lint === "function"
              ? host.lint(id)
              : host.getDiagnostics?.(id);
          return diagnosticsMentionHtml(diagnostics);
        } catch {
          return false;
        }
      }
      return true;
    });
  } finally {
    plant.cleanup();
  }

  // Untimed coverage census for directory-walk CLIs. Explicit-list APIs are
  // exact by construction and are annotated rather than inferred from output.
  const coverage = new Map();
  const coverageDir = prepareLintDir(
    fixtureDir,
    files,
    options.workRoot,
    `n${files.length}-coverage`,
  );
  for (const file of files) {
    const path = join(coverageDir, file);
    writeFileSync(path, plantForCoverage(readFileSync(path, "utf8")));
  }
  const walkCensus = (id, bin, args) => {
    if (!bin) return;
    try {
      const result = runLintCommand(bin, args, coverageDir);
      const { covered } = countCoveredFiles(
        `${result.stdout ?? ""}\n${result.stderr ?? ""}`,
        files,
        { absPrefix: coverageDir },
      );
      coverage.set(id, { covered, corpus: files.length });
    } catch (error) {
      coverage.set(id, {
        covered: null,
        corpus: files.length,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };
  walkCensus("eslint-plugin-svelte-cli", eslintBin, [".", "--format", "json"]);
  walkCensus("rsvelte-lint", rsvelteLint, ["."]);
  for (const id of [
    "eslint-plugin-svelte-1t",
    "eslint-plugin-svelte-workers",
    "verter-host-lint",
  ]) {
    coverage.set(id, {
      covered: files.length,
      corpus: files.length,
      byConstruction: true,
    });
  }

  const measured = await measureVariants(variants, {
    runs: options.runs,
    warmups: options.warmups,
    fileCount: files.length,
  });
  applyFileCoverageGate(measured, coverage, {
    verb: "named",
    what: "planted Svelte files",
  });

  return {
    id: "lint",
    label: "Lint",
    files: files.length,
    bytes,
    variants: measured,
    methodology: [
      "Every tool receives the same isolated Svelte corpus.",
      "A planted {@html} issue must be reported; missing the template rule leaves the time visible but unranked.",
      "An untimed file-coverage census requires each directory-walk CLI to name every planted corpus file; explicit-list APIs are exact by construction.",
      "ESLint is measured in single-threaded API, worker-pool API, and CLI modes so invocation and thread-count costs remain visible.",
      "Rule sets are not identical, so ESLint recommended rules, rsvelte native rules, and Verter diagnostics are separate workload classes. The shared planted gate establishes minimum work but never cross-engine equivalence.",
      "Tool order is rotated; ranking metric is the median of warmed runs.",
    ],
  };
}
