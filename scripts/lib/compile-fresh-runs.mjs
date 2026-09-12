/**
 * Fresh-child sampling for the compile surface.
 *
 * "Fresh child" = a new child process per (row, iteration) in which the FIRST
 * row workload is timed after process startup, package imports and adapter
 * construction are excluded. It is NOT machine-cold: process startup/import
 * are excluded from the interval and the OS page cache is not flushed. The
 * name states the observable boundary rather than implying a wholly cold box.
 *
 * Protocol: the parent writes a serializable cell payload to a temp file; the
 * child argv is (payloadPath, variantId, iteration, outputPath); the child
 * rebuilds the exact variants from the payload, runs variant.prepare (input
 * materialisation — adapter setup, outside the timer) and then times exactly
 * one variant.measure call, writing { ok, ms, meta } to outputPath. A plain
 * module import of the child is inert.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { median, pairedOrder, stddev } from "./timing.mjs";

const childPath = fileURLToPath(new URL("./compile-fresh-child.mjs", import.meta.url));

function summarizeFresh(values) {
  const med = median(values);
  const sd = stddev(values);
  return {
    freshChildRuns: values.map((v) => Number(v.toFixed(3))),
    freshChildMedianMs: Number(med.toFixed(3)),
    freshChildMinMs: Number(Math.min(...values).toFixed(3)),
    freshChildMeanMs: Number(
      (values.reduce((a, b) => a + b, 0) / values.length).toFixed(3),
    ),
    freshChildStddevMs: sd === null ? null : Number(sd.toFixed(3)),
    freshChildCvPct:
      sd === null ? null : med > 0 ? Number(((sd / med) * 100).toFixed(1)) : 0,
  };
}

/**
 * Sample every active variant's first timed workload in fresh children.
 *
 * Deterministic adapter failures short-circuit per variant (first evidence
 * preserved, no retries) so one broken candidate cannot burn the timeout
 * budget for the whole cell.
 */
export function measureFreshChildVariants(
  variants,
  { runs = 3, payload, timeoutMs = 300_000, childScript = childPath } = {},
) {
  const active = variants.filter((v) => !v.skip);
  const tmp = mkdtempSync(join(tmpdir(), "svelte-bench-fresh-"));
  const payloadPath = join(tmp, "payload.json");
  writeFileSync(payloadPath, JSON.stringify(payload));

  const samples = new Map(active.map((v) => [v.id, []]));
  const metas = new Map(active.map((v) => [v.id, []]));
  const errors = new Map();
  const executedOrder = [];

  try {
    for (let iteration = 0; iteration < runs; iteration++) {
      for (const variant of pairedOrder(active, iteration)) {
        if (errors.has(variant.id)) continue;
        const outputPath = join(tmp, `out-${variant.id}-${iteration}.json`);
        const probe = spawnSync(
          process.execPath,
          [childScript, payloadPath, variant.id, String(iteration), outputPath],
          {
            cwd: process.cwd(),
            encoding: "utf8",
            timeout: timeoutMs,
            maxBuffer: 32 * 1024 * 1024,
            windowsHide: true,
          },
        );
        if (probe.error || probe.status !== 0) {
          errors.set(
            variant.id,
            `fresh child exited ${probe.status ?? "signal"}: ${String(probe.stderr ?? probe.error ?? "").slice(0, 400)}`,
          );
          continue;
        }
        try {
          const parsed = JSON.parse(readFileSync(outputPath, "utf8"));
          if (!parsed.ok) {
            errors.set(variant.id, String(parsed.error).slice(0, 400));
            continue;
          }
          samples.get(variant.id).push(parsed.ms);
          if (parsed.meta) metas.get(variant.id).push(parsed.meta);
          executedOrder.push({ iteration, id: variant.id });
        } catch (error) {
          errors.set(
            variant.id,
            `unreadable fresh child output: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }

  const byId = {};
  for (const variant of active) {
    const values = samples.get(variant.id);
    if (errors.has(variant.id)) {
      byId[variant.id] = {
        freshChildError: errors.get(variant.id),
        freshChildRuns: values.map((v) => Number(v.toFixed(3))),
      };
      continue;
    }
    if (values.length === 0) {
      byId[variant.id] = { freshChildError: "no fresh child samples" };
      continue;
    }
    const row = {
      ...summarizeFresh(values),
      freshChildProcessModel: "fresh-child-first-timed-row-workload",
    };
    if (values.length < runs) {
      row.freshChildIncomplete = true;
    }
    const freshMetas = metas.get(variant.id);
    if (freshMetas.length) row.freshChildMetaSamples = freshMetas;
    byId[variant.id] = row;
  }
  return { byId, executedOrder };
}
