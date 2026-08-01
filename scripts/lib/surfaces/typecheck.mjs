import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { rmSync, writeFileSync } from "node:fs";
import {
  collectSvelteFiles,
  prepareTypecheckDir,
  totalBytes,
} from "../fixtures.mjs";
import { measureVariants, resolveBin, runCommand } from "../timing.mjs";
import {
  applyWorkGate,
  prepareCorpusPlant,
  prepareTypecheckPlant,
  typecheckCliReportsError,
  typecheckGateDetail,
} from "../work-gate.mjs";
import { resolveTsgoBin, withTsgoEnv } from "../tsgo.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function tryResolveBin(name) {
  try {
    return resolveBin(name, rootDir);
  } catch {
    return null;
  }
}

const ANSI_ESCAPE_RE =
  // eslint-disable-next-line no-control-regex
  /\u001B\][\s\S]*?(?:\u0007|\u001B\\)|\u001B\[[0-9;?]*[ -\/]*[@-~]|\u001B[@-Z\\-_]/g;

const DIAGNOSTIC_LINE_PATTERNS = [
  /^\s*(?:ERROR|WARNING)\b/i,
  /^\S[^\n]*\(\d+,\d+\):[ \t]*(?:error|warning)\b/i,
  /^\S[^\n]*:\d+:\d+[ \t]+-[ \t]+(?:error|warning)\b/i,
  /^[ \t]*(?:error|warning):\d+:\d+/i,
  /Error:\s/i,
  /TS\d{4}/,
];

export function countDiagnostics(stdout = "", stderr = "") {
  const text = `${stdout}\n${stderr}`.replace(ANSI_ESCAPE_RE, "");
  let count = 0;
  for (const line of text.split("\n")) {
    if (DIAGNOSTIC_LINE_PATTERNS.some((re) => re.test(line))) count += 1;
  }
  return count;
}

const OPERATIONAL_FAILURE_RE =
  /unknown (?:argument|option)|unrecognized option|failed to (?:spawn|start|load)|panic|backtrace|ENOENT|not found|usage:/i;

function runValidatedTypecheck(binary, args, options) {
  const result = runCommand(binary, args, {
    ...options,
    allowNonZeroExit: true,
  });
  const output = `${result.stdout}\n${result.stderr}`;
  const diagnostics = countDiagnostics(result.stdout, result.stderr);
  if (OPERATIONAL_FAILURE_RE.test(output)) {
    throw new Error(
      `checker operational failure: ${output.trim().slice(0, 1000)}`,
    );
  }
  if (
    result.status !== 0 &&
    !(diagnostics > 0 && /\.(?:svelte|[cm]?[jt]sx?)\b/i.test(output))
  ) {
    throw new Error(
      `checker exited ${result.status} without attributable source diagnostics: ${output.trim().slice(0, 1000)}`,
    );
  }
  return { ...result, diagnostics };
}

/**
 * Typecheck surface — CLI tools only.
 *
 * - svelte-check (official, JS TS)
 * - svelte-check-rs (Rust + tsgo)
 * - @rsvelte/svelte-check → rsvelte-check (Rust + tsc/tsgo)
 * - svelte-check-native (Rust + TypeScript 7 native)
 * - verter-tsc (if it accepts .svelte workspaces — may skip/unrank)
 */
export async function runTypecheckSurface(fixtureDir, options) {
  const files = collectSvelteFiles(
    fixtureDir,
    options.checkFileLimit ?? options.fileLimit,
  );
  const bytes = totalBytes(fixtureDir, files);
  const workRoot = options.workRoot;
  const checkDir = prepareTypecheckDir(
    fixtureDir,
    files,
    workRoot,
    `n${files.length}`,
  );
  let invocation = 0;
  const withFreshTimedProject = (tool, run) => {
    const dir = prepareTypecheckDir(
      fixtureDir,
      files,
      workRoot,
      `timed-${tool}-${String(invocation++).padStart(4, "0")}`,
    );
    try {
      return run(dir);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };

  const nodePath = [join(rootDir, "node_modules"), process.env.NODE_PATH ?? ""]
    .filter(Boolean)
    .join(process.platform === "win32" ? ";" : ":");

  const baseEnv = withTsgoEnv({ NODE_PATH: nodePath }, rootDir);
  const tsgo = resolveTsgoBin(rootDir);

  const svelteCheck = tryResolveBin("svelte-check");
  const svelteCheckRs = tryResolveBin("svelte-check-rs");
  const rsvelteCheck = tryResolveBin("rsvelte-check");
  const svelteCheckNative = tryResolveBin("svelte-check-native");
  const verterTsc = tryResolveBin("verter-tsc");

  const plants = prepareTypecheckPlant(workRoot);
  const plantName = prepareCorpusPlant(checkDir, plants.corpusFile);
  // Ensure the timed corpus tsconfig includes the plant file (otherwise the
  // corpus gate is a no-op for tools that only check include: files).
  try {
    const { readFileSync, writeFileSync } = await import("node:fs");
    const tsPath = join(checkDir, "tsconfig.json");
    const ts = JSON.parse(readFileSync(tsPath, "utf8"));
    if (Array.isArray(ts.include) && !ts.include.includes(plantName)) {
      ts.include.push(plantName);
      writeFileSync(tsPath, `${JSON.stringify(ts, null, 2)}\n`);
    }
  } catch {
    // non-fatal
  }

  const variants = [];
  const diagnosticSources = ["--diagnostic-sources", "ts,svelte"];

  if (svelteCheck) {
    variants.push({
      id: "svelte-check",
      label: "svelte-check",
      package: "svelte-check",
      engine: "tsc-js",
      target: "ts+svelte",
      invocation: "cli",
      threading: "1t",
      notes:
        "Official svelte-check (Svelte language tools) · TypeScript JS engine",
      artifactLabel: "Diagnostics",
      artifactPolarity: "informational",
      measure: () =>
        withFreshTimedProject("svelte-check", (dir) => {
          const { ms, diagnostics } = runValidatedTypecheck(
            svelteCheck,
            [
              "--tsconfig",
              "tsconfig.json",
              "--threshold",
              "error",
              ...diagnosticSources,
            ],
            {
              cwd: dir,
              env: baseEnv,
              shell:
                process.platform === "win32" && svelteCheck.endsWith(".cmd"),
            },
          );
          return { ms, artifact: diagnostics };
        }),
      _gate: () => {
        const script = typecheckCliReportsError(
          svelteCheck,
          [
            "--tsconfig",
            "tsconfig.json",
            "--threshold",
            "error",
            ...diagnosticSources,
          ],
          plants.script,
          baseEnv,
        );
        const template = typecheckCliReportsError(
          svelteCheck,
          [
            "--tsconfig",
            "tsconfig.json",
            "--threshold",
            "error",
            ...diagnosticSources,
          ],
          plants.template,
          baseEnv,
        );
        const corpus = typecheckCliReportsError(
          svelteCheck,
          [
            "--tsconfig",
            "tsconfig.json",
            "--threshold",
            "error",
            ...diagnosticSources,
          ],
          checkDir,
          baseEnv,
          plantName,
        );
        return {
          ok: script.ok && template.ok && corpus.ok,
          detail: typecheckGateDetail({
            script: script.ok,
            template: template.ok,
            corpus: corpus.ok,
          }),
        };
      },
    });
  } else {
    variants.push({
      id: "svelte-check",
      label: "svelte-check",
      package: "svelte-check",
      target: "ts+svelte",
      notes: "Binary not found",
      skip: true,
    });
  }

  if (svelteCheckRs) {
    variants.push({
      id: "svelte-check-rs",
      label: "svelte-check-rs",
      package: "svelte-check-rs",
      engine: "tsgo",
      target: "default-sources",
      invocation: "cli",
      threading: "max",
      notes: `svelte-check-rs (Rust) · tsgo when available (${tsgo.version ?? tsgo.source})`,
      artifactLabel: "Diagnostics",
      artifactPolarity: "informational",
      measure: () =>
        withFreshTimedProject("svelte-check-rs", (dir) => {
          const { ms, diagnostics } = runValidatedTypecheck(
            svelteCheckRs,
            ["--workspace", dir, "--tsconfig", join(dir, "tsconfig.json")],
            {
              cwd: dir,
              env: baseEnv,
              shell:
                process.platform === "win32" && svelteCheckRs.endsWith(".cmd"),
            },
          );
          return { ms, artifact: diagnostics };
        }),
      _gate: () => {
        const script = typecheckCliReportsError(
          svelteCheckRs,
          [
            "--workspace",
            plants.script,
            "--tsconfig",
            join(plants.script, "tsconfig.json"),
          ],
          plants.script,
          baseEnv,
        );
        const template = typecheckCliReportsError(
          svelteCheckRs,
          [
            "--workspace",
            plants.template,
            "--tsconfig",
            join(plants.template, "tsconfig.json"),
          ],
          plants.template,
          baseEnv,
        );
        const corpus = typecheckCliReportsError(
          svelteCheckRs,
          [
            "--workspace",
            checkDir,
            "--tsconfig",
            join(checkDir, "tsconfig.json"),
          ],
          checkDir,
          baseEnv,
          plantName,
        );
        return {
          ok: script.ok && template.ok && corpus.ok,
          detail: typecheckGateDetail({
            script: script.ok,
            template: template.ok,
            corpus: corpus.ok,
          }),
        };
      },
    });
  } else {
    variants.push({
      id: "svelte-check-rs",
      label: "svelte-check-rs",
      package: "svelte-check-rs",
      target: "default-sources",
      notes: "Binary not found",
      skip: true,
    });
  }

  if (rsvelteCheck) {
    variants.push({
      id: "rsvelte-check",
      label: "rsvelte-check",
      package: "@rsvelte/svelte-check",
      engine: "tsgo",
      target: "ts+svelte",
      invocation: "cli",
      threading: "max",
      notes:
        "rsvelte-check (@rsvelte/svelte-check) with --tsgo when tsgo is available",
      artifactLabel: "Diagnostics",
      artifactPolarity: "informational",
      measure: () =>
        withFreshTimedProject("rsvelte-check", (dir) => {
          const args = ["--tsconfig", "tsconfig.json", ...diagnosticSources];
          if (tsgo.bin) args.push("--tsgo");
          const { ms, diagnostics } = runValidatedTypecheck(
            rsvelteCheck,
            args,
            {
              cwd: dir,
              env: baseEnv,
              shell:
                process.platform === "win32" && rsvelteCheck.endsWith(".cmd"),
            },
          );
          return { ms, artifact: diagnostics };
        }),
      _gate: () => {
        const args = ["--tsconfig", "tsconfig.json", ...diagnosticSources];
        if (tsgo.bin) args.push("--tsgo");
        const script = typecheckCliReportsError(
          rsvelteCheck,
          args,
          plants.script,
          baseEnv,
        );
        const template = typecheckCliReportsError(
          rsvelteCheck,
          args,
          plants.template,
          baseEnv,
        );
        const corpus = typecheckCliReportsError(
          rsvelteCheck,
          args,
          checkDir,
          baseEnv,
          plantName,
        );
        return {
          ok: script.ok && template.ok && corpus.ok,
          detail: typecheckGateDetail({
            script: script.ok,
            template: template.ok,
            corpus: corpus.ok,
          }),
        };
      },
    });
  } else {
    variants.push({
      id: "rsvelte-check",
      label: "rsvelte-check",
      package: "@rsvelte/svelte-check",
      target: "ts+svelte",
      notes: "Binary not found",
      skip: true,
    });
  }

  if (svelteCheckNative) {
    const nativeArgs = (workspace) => [
      "--workspace",
      workspace,
      "--tsconfig",
      join(workspace, "tsconfig.json"),
      "--threshold",
      "error",
      ...diagnosticSources,
    ];
    variants.push({
      id: "svelte-check-native",
      label: "svelte-check-native",
      package: "svelte-check-native",
      engine: "tsgo",
      target: "ts+svelte",
      invocation: "cli",
      threading: "max",
      notes:
        "svelte-check-native (harshmandan) · Rust Svelte analysis + TypeScript 7 native; CSS diagnostics excluded for every checker",
      artifactLabel: "Diagnostics",
      artifactPolarity: "informational",
      measure: () =>
        withFreshTimedProject("svelte-check-native", (dir) => {
          const { ms, diagnostics } = runValidatedTypecheck(
            svelteCheckNative,
            nativeArgs(dir),
            {
              cwd: dir,
              env: baseEnv,
              shell:
                process.platform === "win32" &&
                svelteCheckNative.endsWith(".cmd"),
            },
          );
          return { ms, artifact: diagnostics };
        }),
      _gate: () => {
        const script = typecheckCliReportsError(
          svelteCheckNative,
          nativeArgs(plants.script),
          plants.script,
          baseEnv,
        );
        const template = typecheckCliReportsError(
          svelteCheckNative,
          nativeArgs(plants.template),
          plants.template,
          baseEnv,
        );
        const corpus = typecheckCliReportsError(
          svelteCheckNative,
          nativeArgs(checkDir),
          checkDir,
          baseEnv,
          plantName,
        );
        return {
          ok: script.ok && template.ok && corpus.ok,
          detail: typecheckGateDetail({
            script: script.ok,
            template: template.ok,
            corpus: corpus.ok,
          }),
        };
      },
    });
  } else {
    variants.push({
      id: "svelte-check-native",
      label: "svelte-check-native",
      package: "svelte-check-native",
      target: "ts+svelte",
      notes: "Binary not found",
      skip: true,
    });
  }

  if (verterTsc) {
    variants.push({
      id: "verter-tsc",
      label: "verter-tsc",
      package: "verter-tsc",
      engine: "tsgo",
      target: "experimental-svelte",
      invocation: "cli",
      threading: "max",
      notes:
        "verter-tsc experimental Svelte path; ranked only when it reports the shared .svelte plants.",
      artifactLabel: "Diagnostics",
      artifactPolarity: "informational",
      measure: () =>
        withFreshTimedProject("verter-tsc", (dir) => {
          const { ms, diagnostics } = runValidatedTypecheck(
            verterTsc,
            ["--noEmit", "-p", "tsconfig.json"],
            {
              cwd: dir,
              env: baseEnv,
              shell: process.platform === "win32" && verterTsc.endsWith(".cmd"),
            },
          );
          return { ms, artifact: diagnostics };
        }),
      _gate: () => {
        const script = typecheckCliReportsError(
          verterTsc,
          ["--noEmit", "-p", "tsconfig.json"],
          plants.script,
          baseEnv,
        );
        const template = typecheckCliReportsError(
          verterTsc,
          ["--noEmit", "-p", "tsconfig.json"],
          plants.template,
          baseEnv,
        );
        const corpus = typecheckCliReportsError(
          verterTsc,
          ["--noEmit", "-p", "tsconfig.json"],
          checkDir,
          baseEnv,
          plantName,
        );
        return {
          ok: script.ok && template.ok && corpus.ok,
          detail: typecheckGateDetail({
            script: script.ok,
            template: template.ok,
            corpus: corpus.ok,
          }),
        };
      },
    });
  } else {
    variants.push({
      id: "verter-tsc",
      label: "verter-tsc",
      package: "verter-tsc",
      target: "experimental-svelte",
      notes: "Binary not found",
      skip: true,
    });
  }

  // Work gates
  await applyWorkGate(variants, async (v) => {
    if (typeof v._gate !== "function") return true;
    const { ok, detail } = v._gate();
    if (detail) v.notes = `${v.notes ?? ""} | ${detail}`.trim();
    return ok;
  });

  // The combined plant proves that each CLI checks the staged corpus, but it
  // is not part of the timed workload. Remove it so the reported 20 files are
  // actually 20 files and every measured pass checks the clean corpus.
  rmSync(join(checkDir, plantName), { force: true });
  try {
    const { readFileSync } = await import("node:fs");
    const tsPath = join(checkDir, "tsconfig.json");
    const ts = JSON.parse(readFileSync(tsPath, "utf8"));
    if (Array.isArray(ts.include)) {
      ts.include = ts.include.filter((entry) => entry !== plantName);
      writeFileSync(tsPath, `${JSON.stringify(ts, null, 2)}\n`);
    }
  } catch {
    // The file removal is the decisive step; an explicit include of a missing
    // file is ignored by these checkers, but leave the cleanup best-effort.
  }

  const measured = await measureVariants(variants, {
    runs: options.runs,
    warmups: options.warmups,
    fileCount: files.length,
  });

  return {
    id: "typecheck",
    label: "Typecheck",
    files: files.length,
    bytes,
    variants: measured,
    methodology: [
      "Every invocation receives a fresh, byte-identical project and tsconfig; preparation and cleanup occur outside the command timer so disk caches cannot leak across tools or runs.",
      "Each measurement is a full CLI process invocation. Non-zero exits rank only when output contains attributable source diagnostics; startup, option, and backend failures throw.",
      "Work gate: isolated script-level and template-level plants, plus a combined plant inserted into the staged corpus, must all report diagnostics to rank. The combined plant is removed before timing so the measured file count and clean-corpus workload stay accurate.",
      "The ts+svelte comparison class uses --diagnostic-sources ts,svelte. CSS is excluded because svelte-check-native does not implement CSS diagnostics.",
      "svelte-check-rs does not expose --diagnostic-sources, so its default-source workload is reported in a separate ranking class instead of being silently compared with ts+svelte rows.",
      "svelte-check = official JS path; svelte-check-rs, rsvelte-check, and svelte-check-native are native checkers (tsgo-backed where applicable).",
      "verter-tsc is included for the experimental Svelte carrier; expect unranked until Svelte typecheck is first-class.",
      "Tool order is rotated; ranking metric is the median of warmed runs.",
    ],
  };
}
