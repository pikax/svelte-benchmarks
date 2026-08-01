import { performance } from "node:perf_hooks";
import { spawnSync } from "node:child_process";
import { delimiter, dirname, join, parse } from "node:path";
import { existsSync } from "node:fs";

export function median(values) {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function mean(values) {
  if (values.length === 0) return Number.NaN;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Sample standard deviation, or `null` when there is nothing to disperse.
 *
 * Fewer than two samples has NO measured spread — that is undefined, not zero.
 * Returning 0 made every row of a 1-run artifact print `0.0 ms / 0.0%`, and the
 * report legend flags `CV > 10%` as noisy, so an UNMEASURED series rendered as
 * the most reproducible result in the table. `null` propagates through
 * `summarize()` into `stddevMs`/`cvPct` and every renderer prints `n/a`.
 */
export function stddev(values) {
  if (values.length < 2) return null;
  const m = mean(values);
  const variance =
    values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function formatMs(ms) {
  if (!Number.isFinite(ms)) return "n/a";
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)} s`;
  }
  return `${ms.toFixed(1)} ms`;
}

export function formatThroughput(files, ms) {
  if (!Number.isFinite(ms) || ms <= 0 || !Number.isFinite(files)) return "n/a";
  const perSec = (files / ms) * 1000;
  if (perSec >= 1000) return `${(perSec / 1000).toFixed(1)}k files/s`;
  return `${perSec.toFixed(0)} files/s`;
}

export function timedSync(fn) {
  const start = performance.now();
  const extra = fn() ?? {};
  const ms = performance.now() - start;
  return { ms, ...extra };
}

export async function timedAsync(fn) {
  const start = performance.now();
  const extra = (await fn()) ?? {};
  const ms = performance.now() - start;
  return { ms, ...extra };
}

/** Minimum warmup passes. Cold (unwarmed) runs are never reported as a ranking metric. */
export const MIN_WARMUPS = 1;

/** Rows above this CV are too unstable to rank when at least three samples exist. */
export const NOISE_CV_LIMIT_PCT = 50;

/** Two samples cannot identify which observation is the outlier. */
export const NOISE_CV_MIN_SAMPLES = 3;

/**
 * Every tool gets at least one discarded warmup pass before measurement.
 *
 * Rationale: a JS compiler pays a large one-off JIT cost on its first pass
 * (measured ~3.2x its own steady state) while a native/NAPI tool pays none.
 * Ranking on an unwarmed first run therefore measures V8 warmup, not the tool.
 */
export function effectiveWarmups(warmups) {
  const n = Number.isFinite(warmups) ? warmups : MIN_WARMUPS;
  return Math.max(MIN_WARMUPS, n);
}

/** Summary stats over measured runs. Primary metric is the median. */
function summarize(all) {
  const med = median(all);
  const sd = stddev(all);
  return {
    runs: all,
    medianMs: Number(med.toFixed(3)),
    minMs: Number(Math.min(...all).toFixed(3)),
    maxMs: Number(Math.max(...all).toFixed(3)),
    meanMs: Number(mean(all).toFixed(3)),
    // `null`, never 0, for a single measured run — see stddev(). A number here
    // is a claim about reproducibility, and with one sample there is none to
    // make.
    stddevMs: sd === null ? null : Number(sd.toFixed(3)),
    // Coefficient of variation — noise guard. High CV => thermal drift or a noisy box.
    // Undefined without a spread to divide, for the same reason.
    cvPct:
      sd === null ? null : med > 0 ? Number(((sd / med) * 100).toFixed(1)) : 0,
  };
}

/**
 * Rotate so each variant occupies a different position on each measured run.
 * Deterministic (reproducible) and, over runs >= variants, position-balanced.
 * Forward/reverse alternation only ever produces two orderings and leaves the
 * first run in fixed declaration order.
 */
function rotate(list, by) {
  if (list.length === 0) return list;
  const k = ((by % list.length) + list.length) % list.length;
  return [...list.slice(k), ...list.slice(0, k)];
}

/**
 * Measure a single variant: warmups (>= 1, discarded) then runs.
 * measure() may return number or { ms, ...meta }.
 */
export async function measureSeries(measure, { runs = 3, warmups = 1 } = {}) {
  const w = effectiveWarmups(warmups);
  for (let i = 0; i < w; i++) {
    await measure({ phase: "warmup", iteration: i });
  }

  const all = [];
  const metas = [];
  for (let i = 0; i < runs; i++) {
    const out = await measure({ phase: "measure", iteration: i });
    if (typeof out === "number") {
      all.push(Number(out.toFixed(3)));
    } else {
      all.push(Number(out.ms.toFixed(3)));
      if (out.meta) metas.push(out.meta);
    }
  }

  const result = summarize(all);
  if (metas.length) result.metaSamples = metas;
  return result;
}

/**
 * Measure a list of variants, rotating tool order on every measured run.
 *
 * Warmups (>= 1, always discarded) are rotated too, so no tool is pinned to
 * first position — first position is the most expensive slot on a cold box.
 * Ranking metric is the median of the measured runs; there is no cold column.
 */
export async function measureVariants(
  variants,
  { runs = 3, warmups = 1, fileCount } = {},
) {
  const active = variants.filter((v) => !v.skip);
  const warmupPasses = effectiveWarmups(warmups);
  const positionCoverageComplete = active.length < 2 || runs >= active.length;
  const comparisonKey = (variant) =>
    variant.comparisonClass
      ? `class:${variant.comparisonClass}`
      : variant.target
        ? `target:${variant.target}`
        : "all";
  const peerCounts = new Map();
  for (const variant of active) {
    const key = comparisonKey(variant);
    peerCounts.set(key, (peerCounts.get(key) ?? 0) + 1);
  }

  for (let w = 0; w < warmupPasses; w++) {
    for (const v of rotate(active, w)) {
      try {
        await v.measure({ phase: "warmup", iteration: w });
      } catch (error) {
        // Warmup failures must not abort the suite; mark for measured phase.
        v._error = error instanceof Error ? error.message : String(error);
      }
    }
  }

  const runsById = new Map(active.map((v) => [v.id, []]));
  const metaById = new Map(active.map((v) => [v.id, []]));

  for (let i = 0; i < runs; i++) {
    // Rotate by run index: over runs >= variants every tool visits every slot.
    const ordered = rotate(active, i);
    for (const v of ordered) {
      try {
        const out = await v.measure({ phase: "measure", iteration: i });
        if (typeof out === "number") {
          runsById.get(v.id).push(Number(out.toFixed(3)));
        } else {
          runsById.get(v.id).push(Number(out.ms.toFixed(3)));
          const { ms: _ms, meta, ...rest } = out;
          const payload = meta ?? (Object.keys(rest).length ? rest : null);
          if (payload) metaById.get(v.id).push(payload);
        }
      } catch (error) {
        // Record as error later via sentinel — store NaN and attach error
        runsById.get(v.id).push(Number.NaN);
        v._error = error instanceof Error ? error.message : String(error);
      }
    }
  }

  const baseRow = (v) => ({
    id: v.id,
    label: v.label,
    package: v.package,
    target: v.target,
    comparisonClass: v.comparisonClass,
    env: v.env,
    threading: v.threading,
    invocation: v.invocation,
    artifactPolarity: v.artifactPolarity,
    // Underlying engine (e.g. tsc-js vs tsgo). Kept visible as a row property.
    engine: v.engine,
    // What the surface counts as "work produced" (e.g. "code bytes",
    // "diagnostics"). Rendered as a column so a fast row with a tiny artifact
    // count is obvious.
    artifactLabel: v.artifactLabel,
    notes: v.notes,
    files: v.fileCount ?? fileCount,
  });

  const results = [];
  for (const v of variants) {
    if (v.skip) {
      results.push({ ...baseRow(v), status: "skipped", throughput: "n/a" });
      continue;
    }
    if (v._error) {
      results.push({
        ...baseRow(v),
        status: "error",
        error: v._error,
        throughput: "n/a",
      });
      continue;
    }
    const all = runsById.get(v.id) ?? [];
    if (all.length === 0 || all.some((x) => !Number.isFinite(x))) {
      results.push({
        ...baseRow(v),
        status: "error",
        error: v._error ?? "measurement failed",
        throughput: "n/a",
      });
      continue;
    }
    const metas = metaById.get(v.id) ?? [];
    const series = summarize(all);
    if (metas.length) {
      series.metaSamples = metas;
      // Aggregate common cache stats if present
      const hits = metas
        .map((m) => m.cacheHits)
        .filter((x) => Number.isFinite(x));
      if (hits.length) {
        series.cacheHitsMedian = Number(median(hits).toFixed(0));
        series.cacheHitsLast = hits[hits.length - 1];
      }
      // Artifact census: how much did this tool actually PRODUCE?
      //
      // Timing alone cannot tell "fast" from "did less". A tool that skips
      // skips a Svelte block, leaves runes uncompiled, fails to parse part of
      // the corpus, or omits requested work is quicker for reasons unrelated
      // to implementation throughput. Every surface reports a
      // countable artifact so a suspiciously fast row is visible in the table.
      const artifacts = metas
        .map((m) => m.artifact)
        .filter((x) => Number.isFinite(x));
      if (artifacts.length) {
        series.artifactMedian = Number(median(artifacts).toFixed(0));
      }
    }
    const tooNoisy =
      !v.unranked &&
      Number.isFinite(series.cvPct) &&
      series.cvPct > NOISE_CV_LIMIT_PCT &&
      all.length >= NOISE_CV_MIN_SAMPLES;
    const hasComparablePeer = (peerCounts.get(comparisonKey(v)) ?? 0) >= 2;
    const orderBiased =
      !v.unranked &&
      !tooNoisy &&
      hasComparablePeer &&
      !positionCoverageComplete;
    const unranked = v.unranked || tooNoisy || orderBiased;
    const notes = tooNoisy
      ? `${v.notes ? `${v.notes} | ` : ""}⚠ TOO NOISY TO RANK — CV ${series.cvPct.toFixed(1)}% exceeds the ${NOISE_CV_LIMIT_PCT}% ceiling across ${all.length} samples. The time remains visible but is excluded from ranking.`
      : orderBiased
        ? `${v.notes ? `${v.notes} | ` : ""}⚠ INCOMPLETE ORDER COVERAGE — ${runs} measured run(s) cannot place ${active.length} active variants in every execution position. The time remains visible but is excluded from ranking.`
        : v.notes;
    results.push({
      ...baseRow(v),
      // "unranked" = measured, but failed a validation gate. Its timing is
      // reported for context and excluded from every ranking comparison.
      status: unranked ? "unranked" : "ok",
      notes,
      ...series,
      warmupPasses,
      throughput: unranked
        ? "n/a"
        : formatThroughput(v.fileCount ?? fileCount, series.medianMs),
    });
  }
  return results;
}

export function pathWithNodeBins(cwd) {
  const dirs = [];
  let current = cwd;
  const root = parse(current).root;
  while (true) {
    const candidate = join(current, "node_modules", ".bin");
    if (existsSync(candidate)) dirs.push(candidate);
    if (current === root) break;
    current = dirname(current);
  }
  return [...dirs.reverse(), process.env.PATH ?? ""].join(delimiter);
}

export function runCommand(binary, args, options = {}) {
  const start = performance.now();
  const result = spawnSync(binary, args, {
    cwd: options.cwd,
    env: {
      ...process.env,
      NO_COLOR: "1",
      FORCE_COLOR: "0",
      PATH: pathWithNodeBins(options.cwd ?? process.cwd()),
      ...(options.env ?? {}),
    },
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    shell: options.shell ?? false,
  });
  const elapsedMs = performance.now() - start;

  if (result.error) throw result.error;
  if (result.status !== 0 && !options.allowNonZeroExit) {
    const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
    throw new Error(
      `${binary} ${args.join(" ")} exited with ${result.status}\n${output.slice(0, 4000)}`,
    );
  }
  return {
    ms: elapsedMs,
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

export function resolveBin(name, fromDir = process.cwd()) {
  const suffixes = process.platform === "win32" ? [".cmd", ".ps1", ""] : [""];
  let current = fromDir;
  const root = parse(current).root;
  while (true) {
    for (const suffix of suffixes) {
      const candidate = join(
        current,
        "node_modules",
        ".bin",
        `${name}${suffix}`,
      );
      if (existsSync(candidate)) return candidate;
    }
    if (current === root) break;
    current = dirname(current);
  }
  throw new Error(`Could not resolve bin: ${name}`);
}
