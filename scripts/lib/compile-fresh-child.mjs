/**
 * Fresh-child worker for the compile surface. argv:
 *   compile-fresh-child.mjs <payload.json> <variantId> <iteration> <output.json>
 *
 * Excluded from the timer (the surface's stated boundary): Node process
 * startup, package imports (only this row's implementation is imported into
 * the process), adapter construction and input materialisation
 * (variant.prepare). Timed: exactly one variant.measure call — the first row
 * workload. OS page cache is NOT flushed; no wholly-cold-runtime claim.
 */
import { writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";

async function main() {
  const [payloadPath, variantId, iterationArg, outputPath] =
    process.argv.slice(2);
  if (!payloadPath || !variantId || !outputPath) {
    throw new Error("usage: compile-fresh-child.mjs <payload> <id> <iter> <out>");
  }
  const payload = JSON.parse(
    (await import("node:fs")).readFileSync(payloadPath, "utf8"),
  );
  const iteration = Number.parseInt(iterationArg, 10);
  const { buildCompileCellVariants } = await import(
    "./surfaces/compile.mjs"
  );
  const variants = await buildCompileCellVariants(payload);
  const variant = variants.find((v) => v.id === variantId);
  if (!variant) {
    throw new Error(`fresh child: unknown variant ${variantId}`);
  }
  if (variant.skip) {
    throw new Error(`fresh child: variant ${variantId} is skipped: ${variant.skip}`);
  }

  const pass = { phase: "fresh-child", iteration };
  // Input construction / adapter setup is an explicit setup phase, outside the
  // row's timer — the parent's warm path performs the identical work untimed.
  // The prepared evidence (input revision hash/count/bytes) merges into the
  // reported meta so the parent's adapter-parity audit can compare samplers.
  const prepared = (await variant.prepare?.(pass)) ?? {};

  const start = performance.now();
  const out = await variant.measure(pass);
  const elapsed = performance.now() - start;
  // Use the adapter's timer, just as the warm sampler does. Output-validation
  // evidence collected after that timer must not inflate only the fresh run.
  const ms = typeof out === "number" ? out : Number.isFinite(out.ms) ? out.ms : elapsed;
  const msRounded = Number(ms.toFixed(3));

  const measuredMeta =
    typeof out === "number"
      ? null
      : (out.meta ?? out.artifact !== undefined ? out : null);
  const maxRss = process.resourceUsage?.()?.maxRSS;
  const rssBytes =
    Number.isFinite(maxRss) && maxRss > 0 ? maxRss * 1024 : undefined;
  const meta = {
    ...prepared,
    ...(measuredMeta ?? {}),
    ...(rssBytes ? { rssBytes } : {}),
  };

  writeFileSync(
    outputPath,
    `${JSON.stringify({
      ok: true,
      ms: msRounded,
      meta: Object.keys(meta).length ? meta : undefined,
    })}\n`,
  );
}

main().catch((error) => {
  // Report the failure through the output file when possible so the parent
  // attaches it to THIS row instead of parsing a crashed stderr.
  try {
    const outputPath = process.argv[5];
    if (outputPath) {
      writeFileSync(
        outputPath,
        `${JSON.stringify({
          ok: false,
          error: error instanceof Error ? error.stack : String(error),
        })}\n`,
      );
    }
  } catch {
    // fall through to nonzero exit
  }
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
