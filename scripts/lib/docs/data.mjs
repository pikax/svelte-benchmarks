/**
 * Snapshot loading + publication guards for generated docs.
 *
 * The committed JSON under results/benchmarks and results/real_world is the
 * evidence; markdown is generated from it and never hand-maintained. A local
 * run never silently overwrites the published reference: only Linux CI
 * snapshots are publishable, and --include-local entries render behind an
 * unmistakable banner and never displace the primary source.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** Groups = one docs page each; every group states its own ranking rules. */
export const GROUPS = Object.freeze([
  {
    id: "compiler",
    title: "Svelte compiler",
    doc: "docs/compiler.md",
    benchSurfaces: ["compile"],
    memorySurfaces: ["compile"],
    confirmSuites: ["compile"],
    headline: true,
  },
  {
    id: "projection",
    title: "Projection (svelte2tsx)",
    doc: "docs/projection.md",
    benchSurfaces: ["projection"],
    memorySurfaces: ["projection"],
    confirmSuites: ["projection"],
  },
  {
    id: "typecheck",
    title: "Typecheck (svelte-check)",
    doc: "docs/typecheck.md",
    benchSurfaces: ["typecheck"],
    confirmSuites: ["typecheck"],
  },
  {
    id: "format",
    title: "Format",
    doc: "docs/format.md",
    benchSurfaces: ["format"],
    confirmSuites: ["format"],
  },
  {
    id: "lint",
    title: "Lint",
    doc: "docs/lint.md",
    benchSurfaces: ["lint"],
    confirmSuites: ["lint"],
  },
  {
    id: "component-meta",
    title: "Component metadata",
    doc: "docs/component-meta.md",
    benchSurfaces: ["component-meta"],
    memorySurfaces: ["component-meta"],
    confirmSuites: ["component-meta"],
  },
  {
    id: "lsp",
    title: "LSP / IDE operations",
    doc: "docs/lsp.md",
    benchSurfaces: ["lsp", "lsp-format"],
    includesIde: true,
  },
  {
    id: "bundle-hmr",
    title: "Vite bundle & incremental transform",
    doc: "docs/bundle-hmr.md",
    benchSurfaces: ["bundle", "hmr"],
  },
  {
    id: "real-world",
    title: "Real-world projects",
    doc: "docs/real-world.md",
    realWorld: true,
  },
  {
    id: "memory",
    title: "Memory (isolated probe)",
    doc: "docs/memory.md",
    memoryOnly: true,
  },
]);

/**
 * Publication platform guard — a filter, not a wall.
 *
 * PUBLISH_ANY_PLATFORM=1 admits everything (explicit opt-in); otherwise only
 * Linux snapshots are publishable as reference numbers. win32/darwin entries
 * loaded via --include-local render as clearly-labelled local runs and never
 * become the primary source.
 */
export function publishablePlatform(platform, env = process.env) {
  if (env.PUBLISH_ANY_PLATFORM === "1") return true;
  return String(platform ?? "").toLowerCase().includes("linux");
}

export function benchIsPublishable(data, env = process.env) {
  if (!publishablePlatform(data?.runner?.platform, env)) return false;
  if (data?.commit?.dirty === true) return false; // not reproducible
  return true;
}

function readJsonIfValid(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function snapshotEntries(dir, { local = false } = {}) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      const file = join(dir, name);
      const data = readJsonIfValid(file);
      return data
        ? {
            name,
            file,
            data,
            local,
            generatedAt: data.generatedAt ?? "",
            mtime: statSync(file).mtimeMs,
          }
        : null;
    })
    .filter(Boolean);
}

function routeSnapshot(entry, model) {
  const { name, data } = entry;
  if (/^bench-/.test(name) && /repeated|cache-demo/i.test(name)) {
    model.repeated.push(entry);
    return;
  }
  if (/^bench-/.test(name)) {
    model.benches.push(entry);
    return;
  }
  if (/^memory-/.test(name)) {
    model.memories.push(entry);
    return;
  }
  if (/^ide-scale-/.test(name)) {
    model.ideScale = entry;
    return;
  }
  if (/^ide-/.test(name)) {
    model.ide = entry;
    return;
  }
  if (/^confirm/.test(name)) {
    model.confirms.push(entry);
    return;
  }
}

/**
 * The rendering model. The PRIMARY bench is the newest publishable snapshot
 * with the largest file count; local runs are secondary, never primary.
 */
export function loadPublished(root, env = process.env, { includeLocal = false } = {}) {
  const model = {
    bench: null,
    benches: [],
    memories: [],
    memory: null,
    repeated: [],
    ide: null,
    ideScale: null,
    confirms: [],
    confirm: null,
    realWorld: [],
  };

  const committed = snapshotEntries(join(root, "results", "benchmarks"));
  for (const entry of committed) routeSnapshot(entry, model);

  const rwDir = join(root, "results", "real_world");
  if (existsSync(rwDir)) {
    const seenProjects = new Set();
    for (const entry of snapshotEntries(rwDir)) {
      const project = entry.name
        .replace(/^real-world-/, "")
        .replace(/\.json$/, "")
        .replace(/^(linux|win32|darwin|Linux|Windows)-/i, "");
      if (seenProjects.has(project)) continue;
      seenProjects.add(project);
      model.realWorld.push({ ...entry, project });
    }
    model.realWorld.sort((a, b) => a.project.localeCompare(b.project));
  }

  if (includeLocal) {
    // Local artifacts live at results/ root (gitignored). Smoke/probe noise is
    // skipped; only real families load, marked local: true.
    for (const entry of snapshotEntries(join(root, "results"))) {
      if (/smoke|probe|demo|scratch|tmp|check|review|verify/i.test(entry.name))
        continue;
      if (/^real-world-/.test(entry.name)) {
        const project = entry.name
          .replace(/^real-world-/, "")
          .replace(/\.json$/, "")
          .replace(/^(linux|win32|darwin|Windows)-/i, "");
        if (!model.realWorld.some((r) => r.project === project && !r.local)) {
          model.realWorld.push({ ...entry, local: true, project });
        }
        continue;
      }
      routeSnapshot({ ...entry, local: true }, model);
    }
  }

  // Primary selection: publishable first, then largest corpus, then newest.
  const rank = (entry) =>
    (benchIsPublishable(entry.data, env) ? 0 : entry.local ? 2 : 1) * 1e12 +
    (entry.data?.fileCount ?? 0) * 1e6 +
    Date.parse(entry.generatedAt || 0);
  model.benches.sort((a, b) => rank(b) - rank(a));
  // Primary = newest publishable snapshot. A non-publishable (e.g. win32)
  // snapshot NEVER becomes the primary, even when it is the only one — the
  // docs fall back to local sections instead.
  model.bench =
    model.benches.find(
      (b) => !b.local && benchIsPublishable(b.data, env),
    ) ??
    (includeLocal ? model.benches[0] ?? null : null);
  model.memory =
    model.memories.find((m) => benchIsPublishable(m.data, env)) ??
    model.memories[0] ??
    null;
  model.confirm =
    model.confirms.find((c) => benchIsPublishable(c.data, env)) ??
    model.confirms[0] ??
    null;
  model.realWorld.sort((a, b) => (a.local === b.local ? 0 : a.local ? 1 : -1));
  return model;
}

/** Surfaces of a bench snapshot that belong to a group, in group order. */
export function surfacesForGroup(group, benchData) {
  const surfaces = benchData?.surfaces ?? [];
  return group.benchSurfaces
    .map((id) => surfaces.find((s) => s.id === id))
    .filter(Boolean);
}

/** The newest confirm source carrying a given suite wins whole. */
export function confirmRowsForSuite(model, suite) {
  const sources = [...model.confirms].sort(
    (a, b) => Date.parse(b.generatedAt || 0) - Date.parse(a.generatedAt || 0),
  );
  for (const source of sources) {
    const rows = (source.data?.results ?? []).filter((r) => r.suite === suite);
    if (rows.length) return { rows, source };
  }
  return { rows: [], source: null };
}

/**
 * Join isolated-probe Peak RSS onto the timing rows (memory pass → tables).
 * Rows match on surface + row id; a same-platform probe always wins.
 */
export function attachMemoryToBench(benchData, memoryData) {
  if (!benchData?.surfaces || !memoryData?.rows) return benchData;
  // Join on (surface, package): tool identity, stable across the id spelling
  // differences between the timing rows and the memory task ids.
  const probeByKey = new Map();
  for (const row of memoryData.rows) {
    if (row.status !== "ok" && row.status !== "unranked") continue;
    const peak = row.samples?.reduce(
      (max, s) => Math.max(max, s.peakRssDeltaMb ?? 0, s.peakRssMb ?? 0),
      0,
    );
    if (!Number.isFinite(peak) || peak <= 0) continue;
    if (!row.package) continue;
    probeByKey.set(`${row.surface}:${row.package}`, peak);
  }
  for (const surface of benchData.surfaces) {
    const variants = [
      ...(surface.variants ?? []),
      ...(surface.groups ?? []).flatMap((g) => g.variants ?? []),
    ];
    for (const v of variants) {
      const key = `${surface.id}:${v.package}`;
      if (probeByKey.has(key)) {
        v.rssMaxMb = probeByKey.get(key);
        v.rssSource = "memory-probe";
      }
    }
  }
  return benchData;
}

/** Standard provenance block for every generated page. */
export function runMetaLines(data, { sourceName } = {}) {
  const lines = [];
  if (!data) return lines;
  lines.push(`- **Generated:** ${data.generatedAt ?? "unknown"}`);
  if (data.fixture && data.fileCount) {
    lines.push(`- **Fixture:** \`${data.fixture}\` (${data.fileCount} Svelte files)`);
  }
  if (data.settings?.runs != null) {
    lines.push(
      `- **Runs / warmups:** ${data.settings.runs} / ${data.settings.warmups ?? "—"}`,
    );
  }
  const r = data.runner;
  if (r) {
    const ram =
      Number.isFinite(r.totalmem) && r.totalmem > 0
        ? ` · ${(r.totalmem / 1024 ** 3).toFixed(0)} GB RAM`
        : "";
    lines.push(
      `- **Runner:** ${r.label ?? "local"} · ${r.platform}/${r.arch} · ${r.cpuCount} CPUs · ${r.cpuModel ?? "unknown"}${ram} · Node ${r.node ?? "?"}`,
    );
  }
  const c = data.commit;
  if (c?.sha) {
    const short = String(c.sha).slice(0, 7);
    const repo = c.repository
      ? `https://github.com/${c.repository}/commit/${short}`
      : null;
    lines.push(
      `- **Commit:** ${repo ? `[${short}](${repo})` : short}${c.dirty === true ? " (dirty worktree — not reproducible)" : ""}`,
    );
  }
  if (c?.runUrl) lines.push(`- **CI run:** ${c.runUrl}`);
  if (sourceName) lines.push(`- **Source:** \`${sourceName}\``);
  return lines;
}

export function localRunBanner(source) {
  return `> ⚠ **LOCAL RUN** — \`${source.name}\` was measured on ${source.data?.runner?.platform ?? "an unpinned machine"}, not Linux CI. Useful only for same-machine comparison; never a reference number.`;
}
