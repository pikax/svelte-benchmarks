/**
 * Parent-side launcher for compile validity children + row-level application
 * of verdicts.
 *
 * Contract:
 *  - one child per (entrypoint × matrix cell); crash/timeout/non-zero exit
 *    becomes a synthetic FAIL — never silently unavailable;
 *  - a row is gated by ITS OWN entrypoint's verdict (row.validityEntrypoint
 *    ?? derived from its id); a row never borrows a sibling's verdict;
 *  - non-PASS leaves the row measured but UNRANKED with an evidence note;
 *  - a failed/missing official reference invalidates every candidate in its
 *    compatibility class — the next survivor is never promoted into the
 *    reference slot.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  COMPILE_VALIDITY_SUITE_HASH,
  COMPILE_VALIDITY_SUITE_VERSION,
} from "./compile-validity-plants.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");
const childFile = fileURLToPath(
  new URL("./compile-validity-child.mjs", import.meta.url),
);

// Re-declared so importing this parent helper does not pull the child's
// jsdom/compiler dependencies into the benchmark process.
export const COMPILE_VALIDITY_JSON_PREFIX = "@@SVELTE_COMPILE_VALIDITY@@";

export const COMPILE_VALIDITY_ENTRYPOINTS = [
  "svelte-official",
  "svelte-mrwaip-reference",
  "mrwaip-svelte-rs",
  "rsvelte-wasm",
  "rsvelte-native",
  "verter-svelte",
];

function parseChildPayload(text) {
  const marker = text.lastIndexOf(COMPILE_VALIDITY_JSON_PREFIX);
  if (marker === -1) return null;
  const line = text.slice(marker + COMPILE_VALIDITY_JSON_PREFIX.length);
  try {
    return JSON.parse(line.split(/\r?\n/, 1)[0]);
  } catch {
    return null;
  }
}

export function compileValidityConfigKey({ generate, env, sourceMap }) {
  return `${generate}/${env}/source-map-${sourceMap ? "on" : "off"}`;
}

export function runCompileValidityChildren({
  generate = "client",
  env = "production",
  sourceMap = false,
  entrypoints = COMPILE_VALIDITY_ENTRYPOINTS,
  timeoutMs = 120_000,
  spawn = spawnSync,
} = {}) {
  const results = {};
  for (const entrypoint of entrypoints) {
    // Dev-mode SSR validation reads the esm-env DEV flag, which is a bundler
    // condition — plain Node leaves it false and dev renders crash inside the
    // runtime's own diagnostics. The development condition restores exactly
    // what a Vite dev build provides. Production cells resolve without it.
    const argv =
      env === "development"
        ? ["--conditions=development", childFile, "--entrypoint", entrypoint, "--generate", generate, "--env", env]
        : [childFile, "--entrypoint", entrypoint, "--generate", generate, "--env", env];
    const probe = spawn(process.execPath, argv, {
      cwd: rootDir,
      timeout: timeoutMs,
      maxBuffer: 32 * 1024 * 1024,
      windowsHide: true,
    });
    const text = `${probe.stdout ?? ""}\n${probe.stderr ?? ""}`;
    if (probe.error || probe.status !== 0) {
      const parsed = parseChildPayload(text);
      results[entrypoint] =
        parsed ??
        syntheticFail(
          entrypoint,
          generate,
          env,
          `child exited ${probe.status ?? "error"}: ${String(probe.error?.message ?? text).slice(0, 300)}`,
        );
      continue;
    }
    const parsed = parseChildPayload(text);
    if (!parsed) {
      results[entrypoint] = syntheticFail(
        entrypoint,
        generate,
        env,
        "child produced no parsable validity payload",
      );
      continue;
    }
    results[entrypoint] = parsed;
  }
  return results;
}

function syntheticFail(entrypoint, generate, env, reason) {
  return {
    schemaVersion: 1,
    suiteVersion: COMPILE_VALIDITY_SUITE_VERSION,
    suiteHash: COMPILE_VALIDITY_SUITE_HASH,
    entrypoint,
    generate,
    env,
    status: "FAIL",
    reason,
    phase: "child",
  };
}

/**
 * Run the validity matrix for a set of deduplicated cells.
 * Returns the evidence object stored in the report JSON under
 * validation.compileSemantics.
 */
export function runCompileValidityMatrix(configurations) {
  const matrix = {};
  const seen = new Set();
  for (const config of configurations) {
    const key = compileValidityConfigKey(config);
    if (seen.has(key)) continue;
    seen.add(key);
    const entrypoints = runCompileValidityChildren(config);
    const statuses = Object.values(entrypoints).map((r) => r.status);
    matrix[key] = {
      configuration: { ...config },
      status: statuses.includes("FAIL")
        ? "FAIL"
        : statuses.includes("UNKNOWN")
          ? "UNKNOWN"
          : "PASS",
      entrypoints,
    };
  }
  return {
    schemaVersion: 1,
    suiteVersion: COMPILE_VALIDITY_SUITE_VERSION,
    suiteHash: COMPILE_VALIDITY_SUITE_HASH,
    matrix,
  };
}

function semanticEntrypointForRow(row) {
  if (row.validityEntrypoint) return row.validityEntrypoint;
  const id = String(row.id ?? "");
  if (id.startsWith("svelte-official")) return "svelte-official";
  if (id.startsWith("svelte-mrwaip-reference")) return "svelte-mrwaip-reference";
  if (id.startsWith("mrwaip")) return "mrwaip-svelte-rs";
  if (id.startsWith("rsvelte-wasm")) return "rsvelte-wasm";
  if (id.startsWith("rsvelte-native")) return "rsvelte-native";
  if (id.startsWith("verter")) return "verter-svelte";
  return null;
}

function markRowUnranked(row, note) {
  row.unranked = true;
  if (row.status === "ok") {
    row.status = "unranked";
    row.throughput = "n/a";
  }
  row.notes = `${row.notes ? `${row.notes} | ` : ""}${note}`;
}

function semanticFailureSummary(gate) {
  const failing = (gate.results ?? [])
    .filter((r) => r.status === "FAIL")
    .slice(0, 3)
    .map((r) => `${r.id} (${r.phase ?? "?"}): ${r.detail ?? gate.reason ?? ""}`);
  return failing.join("; ") || gate.reason || "no detail";
}

function sourceMapFailureSummary(sm) {
  return (sm?.results ?? [])
    .filter((r) => r.status === "FAIL")
    .slice(0, 2)
    .map((r) => `${r.id}: ${(r.failures ?? [])[0] ?? ""}`)
    .join("; ");
}

/**
 * Apply per-cell verdicts to rows, then invalidate classes whose official
 * reference failed. Reference rows are identified by `baseline: true`.
 */
export function applyCompileValidityGates(variants, compileSemantics, cell) {
  const key = compileValidityConfigKey(cell);
  const cellGate = compileSemantics?.matrix?.[key];
  for (const row of variants) {
    if (row.skip || row.status === "skipped" || row.status === "error") continue;
    if (row.sourceMap) {
      // Map-on cells check artifact PRESENCE in the timed loop, but planted
      // positions are not yet traced back to source coordinates: mapping
      // correctness is UNKNOWN and map-on rows stay unranked.
      markRowUnranked(
        row,
        "⚠ SOURCE-MAP MAPPING VALIDITY UNKNOWN — this release checks that the requested JS/CSS map artifacts are present, but it does not yet trace planted generated positions back to the correct Svelte block and source coordinates. Map-on timing remains visible but cannot rank until that semantic oracle exists.",
      );
      continue;
    }
    const entrypoint = semanticEntrypointForRow(row);
    const gate = entrypoint ? cellGate?.entrypoints?.[entrypoint] : null;
    if (!gate) {
      markRowUnranked(
        row,
        `⚠ RUNTIME SEMANTIC VALIDITY UNKNOWN — no exact-entrypoint plant verdict exists for ${entrypoint ?? "this row"} in ${key}. A missing verdict is not a pass.`,
      );
      continue;
    }
    // Source maps are ALWAYS part of the artifact Svelte compilers return, so
    // coordinate correctness gates the same rows (no on/off dimension
    // exists). When the runtime plants passed but the maps are wrong, the
    // source-map failure owns the row's verdict — it is what failed.
    const sm = gate.sourceMap;
    // Runtime counters only — the child folds source-map failures into the
    // overall status, so gate.status alone cannot distinguish the two.
    const runtimePassed =
      (gate.failed ?? 0) === 0 && (gate.unknown ?? 0) === 0 && Number.isFinite(gate.passed);
    if (sm && sm.status === "FAIL" && runtimePassed) {
      markRowUnranked(
        row,
        `⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all ${gate.passed ?? "?"} runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (${sourceMapFailureSummary(sm)}). The timing remains visible but cannot rank until the emitted maps are correct.`,
      );
      continue;
    }
    if (gate.status !== "PASS") {
      markRowUnranked(
        row,
        `⚠ RUNTIME SEMANTIC VALIDITY ${gate.status} (${gate.passed ?? 0}/${gate.plantCount ?? "?"} plants) — ${semanticFailureSummary(gate)}`,
      );
    } else {
      row.notes = `${row.notes ? `${row.notes} | ` : ""}✓ runtime semantic validity: ${gate.passed}/${gate.plantCount} plants passed through ${gate.exactPath}`;
      if (sm?.status === "PASS") {
        row.notes = `${row.notes ? `${row.notes} | ` : ""}✓ source-map coordinates: ${sm.results.filter((r) => r.status === "PASS").length}/${sm.results.length} anchored tokens traced exactly (LF/CRLF, non-BMP)`;
      }
    }
  }

  // Class-scoped reference invalidation: a failed official reference unranks
  // every candidate in its compatibility class. No survivor promotion.
  const byClass = new Map();
  for (const row of variants) {
    const cls = row.comparisonClass ?? "";
    if (!byClass.has(cls)) byClass.set(cls, []);
    byClass.get(cls).push(row);
  }
  for (const [cls, members] of byClass) {
    const reference = members.find(
      (row) => row.baseline && row.status !== "skipped",
    );
    if (!reference) continue;
    if (reference.status === "ok") continue;
    for (const row of members) {
      if (row === reference || row.skip || row.status === "skipped" || row.status === "error")
        continue;
      markRowUnranked(
        row,
        `⚠ COMPARISON REFERENCE INVALID — the pinned official reference for class ${cls} did not pass its own gates (${reference.status}); no candidate ratio in the class may rank.`,
      );
    }
  }
  return variants;
}
