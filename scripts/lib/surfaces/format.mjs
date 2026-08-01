import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  collectSvelteFiles,
  prepareFormatCopy,
  totalBytes,
} from "../fixtures.mjs";
import { measureVariants, resolveBin, runCommand } from "../timing.mjs";
import {
  applyFileCoverageGate,
  applyWorkGate,
  dirtyForCoverage,
  formatterRewritesMarkup,
  prepareFormatPlant,
} from "../work-gate.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const PRETTIER_CONFIG = `${JSON.stringify(
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
)}\n`;

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

/** Format throughput over fresh, disposable copies of one Svelte corpus. */
export async function runFormatSurface(fixtureDir, options) {
  const files = collectSvelteFiles(fixtureDir, options.fileLimit);
  const bytes = totalBytes(fixtureDir, files);
  const workRoot = options.workRoot;

  const prettier = tryResolveBin("prettier");
  const oxfmt = tryResolveBin("oxfmt");
  const rsvelteFmt = tryResolveBin("rsvelte-fmt");

  // Every throwaway copy inherits this exact configuration.
  writeFileSync(join(fixtureDir, ".prettierrc.json"), PRETTIER_CONFIG);

  let invocation = 0;
  const nextCopy = (label) =>
    prepareFormatCopy(fixtureDir, files, workRoot, label, ++invocation);

  const variants = [];

  if (prettier) {
    variants.push({
      id: "prettier",
      label: "Prettier + prettier-plugin-svelte",
      package: "prettier",
      threading: "1t",
      invocation: "cli",
      notes:
        "prettier --write **/*.svelte with prettier-plugin-svelte · single-threaded",
      measure: () => {
        const cwd = nextCopy("prettier");
        const { ms } = runCommand(
          prettier,
          ["--write", "**/*.svelte", "--log-level", "error"],
          { cwd, shell: isWinShell(prettier) },
        );
        return ms;
      },
    });
  } else {
    variants.push({
      id: "prettier",
      label: "Prettier + prettier-plugin-svelte",
      package: "prettier",
      notes: "Binary not found",
      skip: true,
    });
  }

  if (rsvelteFmt) {
    variants.push({
      id: "rsvelte-fmt",
      label: "rsvelte-fmt",
      package: "@rsvelte/fmt",
      threading: "max",
      invocation: "cli",
      notes:
        "rsvelte-fmt . (Rust); may route embedded JS/TS/CSS through other formatters",
      measure: () => {
        const cwd = nextCopy("rsvelte-fmt");
        return runCommand(rsvelteFmt, ["."], {
          cwd,
          shell: isWinShell(rsvelteFmt),
        }).ms;
      },
    });
  } else {
    variants.push({
      id: "rsvelte-fmt",
      label: "rsvelte-fmt",
      package: "@rsvelte/fmt",
      notes: "Binary not found",
      skip: true,
    });
  }

  if (oxfmt) {
    variants.push({
      id: "oxfmt",
      label: "Oxfmt",
      package: "oxfmt",
      notes:
        "Pinned Oxfmt release excludes .svelte files; no CLI-startup proxy is timed.",
      skip: true,
    });
  } else {
    variants.push({
      id: "oxfmt",
      label: "Oxfmt",
      package: "oxfmt",
      notes: "Binary not found",
      skip: true,
    });
  }

  // Whole-SFC work gate. The probe is nested, so non-recursive invocations
  // fail instead of being ranked on CLI startup while matching zero files.
  const plant = prepareFormatPlant(workRoot);
  try {
    await applyWorkGate(variants, (variant) => {
      if (variant.id === "prettier") {
        return formatterRewritesMarkup(plant, {
          bin: prettier,
          args: ["--write", "**/*.svelte", "--log-level", "error"],
          label: "prettier",
          shell: isWinShell(prettier),
          configFiles: { ".prettierrc.json": PRETTIER_CONFIG },
        });
      }
      if (variant.id === "rsvelte-fmt") {
        return formatterRewritesMarkup(plant, {
          bin: rsvelteFmt,
          args: ["."],
          label: "rsvelte-fmt",
          shell: isWinShell(rsvelteFmt),
        });
      }
      return true;
    });
  } finally {
    plant.cleanup();
  }

  // Untimed same-file-set census. Every file is dirtied, each tool runs with
  // its timed invocation, and the harness counts how many Svelte files changed.
  const coverage = new Map();
  const census = (id, bin, args) => {
    if (!bin) return;
    const cwd = prepareFormatCopy(
      fixtureDir,
      files,
      workRoot,
      `coverage-${id}`,
      1,
    );
    try {
      const dirty = new Map();
      for (const file of files) {
        const path = join(cwd, file);
        const planted = dirtyForCoverage(readFileSync(path, "utf8"));
        dirty.set(file, planted);
        writeFileSync(path, planted);
      }
      runCommand(bin, args, {
        cwd,
        shell: isWinShell(bin),
      });
      const covered = files.filter(
        (file) => readFileSync(join(cwd, file), "utf8") !== dirty.get(file),
      ).length;
      coverage.set(id, { covered, corpus: files.length });
    } catch (error) {
      coverage.set(id, {
        covered: null,
        corpus: files.length,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };
  census("prettier", prettier, [
    "--write",
    "**/*.svelte",
    "--log-level",
    "error",
  ]);
  census("rsvelte-fmt", rsvelteFmt, ["."]);

  const measured = await measureVariants(variants, {
    runs: options.runs,
    warmups: options.warmups,
    fileCount: files.length,
  });
  applyFileCoverageGate(measured, coverage, {
    verb: "rewrote",
    what: "Svelte files",
  });

  return {
    id: "format",
    label: "Format",
    files: files.length,
    bytes,
    variants: measured,
    methodology: [
      "Every timed invocation receives a fresh copy of the same Svelte corpus.",
      "All rows are CLI invocations; any non-zero exit is an operational failure and cannot rank, even if some files changed first.",
      "A nested markup-rewrite plant fails tools that no-op, format only <script>, or use a non-recursive file pattern.",
      "An untimed coverage census dirties every Svelte file; a tool that rewrites fewer than the full corpus is measured but unranked.",
      "Output style is not normalized — this measures whole-SFC format throughput, not byte identity.",
      "Tool order is rotated; ranking metric is the median of warmed runs.",
    ],
  };
}
