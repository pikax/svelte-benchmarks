import v8 from "node:v8";

export function forceGc() {
  if (typeof globalThis.gc !== "function") {
    throw new Error("memory worker requires node --expose-gc");
  }
  globalThis.gc();
}

export function bytesToMb(bytes) {
  return Number.isFinite(bytes)
    ? Number((bytes / (1024 * 1024)).toFixed(3))
    : null;
}

export function snapshot() {
  const memory = process.memoryUsage();
  const heap = v8.getHeapStatistics();
  return {
    rss: memory.rss,
    heapUsed: memory.heapUsed,
    external: memory.external,
    malloced: heap.malloced_memory ?? 0,
  };
}

export function peakRssBytes() {
  const kilobytes = process.resourceUsage()?.maxRSS;
  return Number.isFinite(kilobytes) && kilobytes > 0 ? kilobytes * 1024 : null;
}

export async function measureMemory(fn) {
  forceGc();
  const baseline = snapshot();
  const cpuStart = process.cpuUsage();
  const wallStart = process.hrtime.bigint();

  const result = await fn();

  forceGc();
  const retained = snapshot();
  const exactPeak = peakRssBytes();
  const cpu = process.cpuUsage(cpuStart);
  const wallMs = Number(process.hrtime.bigint() - wallStart) / 1e6;
  const cpuMs = (cpu.user + cpu.system) / 1000;
  const observedPeak = Math.max(baseline.rss, retained.rss, exactPeak ?? 0);

  return {
    status: "ok",
    artifact: result?.artifact ?? null,
    gate: result?.gate ?? "completed",
    baselineRssMb: bytesToMb(baseline.rss),
    peakRssMb: bytesToMb(observedPeak),
    peakRssDeltaMb: bytesToMb(Math.max(0, observedPeak - baseline.rss)),
    retainedRssDeltaMb: bytesToMb(Math.max(0, retained.rss - baseline.rss)),
    retainedHeapDeltaMb: bytesToMb(
      Math.max(0, retained.heapUsed - baseline.heapUsed),
    ),
    externalDeltaMb: bytesToMb(
      Math.max(0, retained.external - baseline.external),
    ),
    mallocedDeltaMb: bytesToMb(
      Math.max(0, retained.malloced - baseline.malloced),
    ),
    cpuMs: Number(cpuMs.toFixed(3)),
    wallMs: Number(wallMs.toFixed(3)),
  };
}
