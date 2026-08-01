import {
  formatMs,
  NOISE_CV_LIMIT_PCT,
  NOISE_CV_MIN_SAMPLES,
} from "./timing.mjs";

export { NOISE_CV_LIMIT_PCT, NOISE_CV_MIN_SAMPLES };

function okVariants(variants) {
  return variants.filter((v) => v.status === "ok");
}

/**
 * Primary ranking metric: median of the measured runs (all warmed).
 * There is deliberately no cold column — an unwarmed first run measures JIT
 * warmup for JS tools and nothing for native tools, which is not comparable.
 */
function primaryMs(v) {
  if (v.status !== "ok") return Number.POSITIVE_INFINITY;
  if (Number.isFinite(v.medianMs)) return v.medianMs;
  return Number.POSITIVE_INFINITY;
}

function fastestPrimary(variants) {
  const ok = okVariants(variants);
  if (ok.length === 0) return Number.NaN;
  return Math.min(...ok.map((v) => primaryMs(v)));
}

/**
 * "How many times slower than fastest" — base is the fastest median in the class.
 * Faster tool → 1.00x; slower → >1.
 */
function timesSlower(fastest, current) {
  if (!Number.isFinite(fastest) || !Number.isFinite(current) || current <= 0) {
    return "n/a";
  }
  return `${(current / fastest).toFixed(2)}x`;
}

/**
 * Display names are SLIMMED at render time, not in the surface definitions,
 * so previously-written result JSON re-renders with the same names as a fresh
 * run. The stripped identity is restored in the per-surface "Tools" legend —
 * the table trades detail for scanability, the legend holds the detail.
 *
 * `desc` is what the tool actually runs — shown once per surface above the
 * tables instead of being repeated in every row's Notes.
 */
const SLIM_RULES = [
  {
    re: /^svelte-language-server$/,
    slim: "svelte-language-server",
    desc: "Official Svelte language server (stdio) from svelte-language-server.",
  },
  {
    re: /^rsvelte-language-server$/,
    slim: "rsvelte-language-server",
    desc: "@rsvelte/language-server — formatting and native Svelte lint diagnostics; no TypeScript hover/completion.",
  },
  {
    re: /^Verter LSP$/,
    slim: "Verter",
    desc: "verter-lsp — native server from the published npm package; experimental Svelte carrier.",
  },
  {
    re: /^svelte-check$/,
    slim: "svelte-check",
    desc: "Official svelte-check (Svelte language tools CLI) with the JavaScript TypeScript engine.",
  },
  {
    re: /^svelte-check-rs$/,
    slim: "svelte-check-rs",
    desc: "Rust drop-in replacement for svelte-check (pheuter/svelte-check-rs); uses tsgo when available.",
  },
  {
    re: /^svelte-check-native$/,
    slim: "svelte-check-native",
    desc: "harshmandan/svelte-check-native — Rust Svelte analysis with TypeScript 7 native.",
  },
  {
    re: /^rsvelte-check$/,
    slim: "rsvelte-check",
    desc: "@rsvelte/svelte-check CLI — Rust walker + tsc/tsgo.",
  },
  {
    re: /^verter-tsc$/,
    slim: "verter-tsc",
    desc: "verter-tsc from the published npm package; experimental Svelte path may be unranked.",
  },
  {
    re: /^Prettier/,
    slim: "Prettier",
    desc: "prettier --write with prettier-plugin-svelte over a fresh corpus copy.",
  },
  {
    re: /^rsvelte-fmt$/,
    slim: "rsvelte-fmt",
    desc: "@rsvelte/fmt — Rust formatter for .svelte.",
  },
  {
    re: /^Oxfmt$/,
    slim: "Oxfmt",
    desc: "Oxc formatter; skipped because the pinned release excludes .svelte files.",
  },
  {
    re: /^rsvelte-lint$/,
    slim: "rsvelte-lint",
    desc: "@rsvelte/lint — Rust Svelte linter.",
  },
  {
    re: /^Verter host lint$/,
    slim: "Verter host lint",
    desc: "VerterHost lint/diagnostics API with fileKind=svelte; experimental and gated on the {@html} diagnostic.",
  },
  {
    re: /^eslint-plugin-svelte \(1T\)$/,
    slim: "eslint-plugin-svelte (1T API)",
    desc: "ESLint API + eslint-plugin-svelte recommended rules, single-threaded.",
  },
  {
    re: /^eslint-plugin-svelte \(\d+ workers\)$/,
    slim: "eslint-plugin-svelte (worker pool)",
    desc: "ESLint API + eslint-plugin-svelte recommended rules, split across worker threads.",
  },
  {
    re: /^eslint-plugin-svelte \(CLI\)$/,
    slim: "eslint-plugin-svelte (CLI)",
    desc: "ESLint CLI + eslint-plugin-svelte recommended rules.",
  },
  {
    re: /^svelte\/compiler 5\.56\.4/,
    slim: "svelte/compiler 5.56.4",
    desc: "Pinned official reference for @mrwaip/svelte-rs, which documents parity against Svelte 5.56.4.",
  },
  {
    re: /^svelte\/compiler 5\.56\.8/,
    slim: "svelte/compiler 5.56.8",
    desc: "Primary official Svelte compiler reference used by the rsvelte packages in this harness.",
  },
  {
    re: /^svelte\/compiler/,
    slim: "svelte/compiler",
    desc: "Official svelte/compiler compile() API, single-threaded.",
  },
  {
    re: /^@mrwaip\/svelte-rs/,
    slim: "@mrwaip/svelte-rs (NAPI)",
    desc: "MrWaip/svelte-rs native compiler through its svelte/compiler-compatible API.",
  },
  {
    re: /^svelte2tsx$/,
    slim: "svelte2tsx",
    desc: "Official Svelte-to-TSX projection from sveltejs/language-tools.",
  },
  {
    re: /^@rsvelte\/svelte2tsx/,
    slim: "@rsvelte/svelte2tsx (Wasm)",
    desc: "rsvelte Rust/Wasm drop-in Svelte-to-TSX projection.",
  },
  {
    re: /^Verter IDE projection$/,
    slim: "Verter IDE projection",
    desc: "VerterHost ensureIdeCompiled/getIde Svelte projection; separate schema from svelte2tsx.",
  },
  {
    re: /^sveld/,
    slim: "sveld",
    desc: "sveld component API extraction; row label states AST-only or resolveTypes mode.",
  },
  {
    re: /^svelte-docinfo$/,
    slim: "svelte-docinfo",
    desc: "TypeScript-semantic Svelte component/module metadata extraction.",
  },
  {
    re: /^Verter typeinfo/,
    slim: "Verter typeinfo",
    desc: "@verter/typeinfo decoding @verter/native's dedicated Svelte framework-surface metadata.",
  },
  {
    re: /^@rsvelte\/compiler wasm/,
    slim: "@rsvelte/compiler (wasm)",
    desc: "rsvelte WASM compiler bindings.",
  },
  {
    re: /^@rsvelte\/native NAPI/,
    slim: "@rsvelte/native (NAPI)",
    desc: "rsvelte native NAPI compiler (@rsvelte/vite-plugin-svelte-native).",
  },
  {
    re: /^Verter compileMany \(stateless\)$/,
    slim: "Verter (stateless)",
    desc: "VerterHost.compileMany without cross-run cache; experimental Svelte carrier.",
  },
  {
    re: /^Verter compileMany \(session cache\)$/,
    slim: "Verter (session cache)",
    desc: "VerterHost.compileMany with a persistent cross-run cache; measured but unranked.",
  },
];

function slimRuleFor(rawLabel) {
  return SLIM_RULES.find((r) => r.re.test(String(rawLabel ?? "")));
}

/**
 * Engine tag on the NAME, not a table split. JS-engine rows are marked (JS);
 * native (tsgo) rows are unmarked. The engines share one table — the tag plus
 * the legend carry the caveat that a cross-engine ratio measures TypeScript's
 * rewrite as much as the Svelte layer.
 */
function engineTag(v) {
  return v.engine === "tsc-js" ? " (JS)" : "";
}

/** Marker appended to the name instead of a Status column. */
function statusMark(status) {
  if (status === "unranked") return " ⚠";
  if (status === "error") return " ❌";
  if (status === "skipped") return " ⏭";
  return "";
}

/** Table display name: slimmed label + engine tag + status marker. */
function displayName(v) {
  const rule = slimRuleFor(v.label);
  return `${rule ? rule.slim : v.label}${engineTag(v)}${statusMark(v.status)}`;
}

/**
 * Comparison class — reduced to the codegen target only; see classKey.
 */
function classKey(v) {
  // Engine, invocation and threading are row properties, not table splits.
  // `target` is reserved for a genuinely different workload: client/server
  // codegen, AST/semantic metadata, or checker diagnostic-source sets.
  return v.comparisonClass
    ? `class:${v.comparisonClass}`
    : v.target
      ? `target:${v.target}`
      : "all";
}

function classLabel(key) {
  if (key.startsWith("class:")) {
    return `${key.slice("class:".length).toUpperCase()} — separate workload`;
  }
  const target = key.startsWith("target:") ? key.slice("target:".length) : null;
  return target ? `${target.toUpperCase()} — separate workload` : "";
}

export const RANKING_RULES =
  "Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per comparable workload class: engine, invocation and threading remain row properties; target or explicitly different work may split classes. Every active variant must visit every execution position; shorter diagnostic runs are unranked. A class with fewer than two valid rows is informational: no fastest ratio or ranked throughput is shown. Rows tagged **(JS)** run the JavaScript TypeScript compiler. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three samples is bracketed as TOO NOISY TO RANK, baseline included.";

/**
 * Render one ranking table for a homogeneous set of variants.
 * Primary column = median of measured runs (all warmed).
 */
function renderVariantTable(rawVariants, { title } = {}) {
  const variants = rawVariants;
  const lines = [];
  if (title) {
    lines.push(`##### ${title}`);
    lines.push("");
  }
  const artifactLabel =
    variants.find((v) => v.artifactLabel)?.artifactLabel ?? "Artifact";
  lines.push(
    `| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | ${artifactLabel} | Throughput |`,
  );
  lines.push("| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");

  const base = fastestPrimary(variants);
  const hasCompetition =
    variants.filter(
      (variant) => variant.status === "ok" && Number.isFinite(variant.medianMs),
    ).length >= 2;
  const sorted = [...variants].sort((a, b) => primaryMs(a) - primaryMs(b));

  // Status lives on the name (⚠ unranked, ❌ error, ⏭ skipped) and per-row
  // detail lives in the Notes collapsible below the table — cells that cannot
  // apply to a row print "–" rather than a wall of n/a.
  const noteRows = [];
  for (const v of sorted) {
    const name = displayName(v);
    const rowFiles = Number.isFinite(v.files) ? v.files.toLocaleString() : "–";
    let noteText = v.notes || "";
    if (v.status === "ok") {
      const cacheNote = Number.isFinite(v.cacheHitsMedian)
        ? ` cacheHits≈${v.cacheHitsMedian}`
        : "";
      // Flag noisy series so a thermally-throttled or contended box is visible.
      const cv = Number.isFinite(v.cvPct)
        ? `${v.cvPct.toFixed(1)}%${v.cvPct > 10 ? " ⚠" : ""}`
        : "n/a";
      let artifact = "n/a";
      if (Number.isFinite(v.artifactMedian)) {
        artifact = v.artifactMedian.toLocaleString();
      }
      if (Number.isFinite(v.medianMs)) {
        lines.push(
          `| ${name} | ${rowFiles} | **${formatMs(v.medianMs)}** | ${formatMs(v.minMs)} | ${formatMs(v.stddevMs)} | ${cv} | ${hasCompetition ? timesSlower(base, v.medianMs) : "—"} | ${artifact} | ${hasCompetition ? v.throughput : "—"} |`,
        );
      } else {
        // An ok row with no duration is a ratio or informational row — its
        // value sits in the artifact column (or the notes), never in a
        // fabricated time.
        const throughput =
          v.throughput && v.throughput !== "n/a" ? v.throughput : "–";
        lines.push(
          `| ${name} | ${rowFiles} | – | – | – | – | – | ${artifact} | ${throughput} |`,
        );
      }
      noteText = (v.notes || "") + cacheNote;
    } else if (v.status === "unranked") {
      // Measured but failed validation: show the time in brackets so the
      // speed/correctness trade is visible, and keep it out of every
      // comparison column — it is not competing on equal terms.
      const bracketed = Number.isFinite(v.medianMs)
        ? `(${formatMs(v.medianMs)})`
        : "–";
      const artifact = Number.isFinite(v.artifactMedian)
        ? `(${v.artifactMedian.toLocaleString()})`
        : "–";
      lines.push(
        `| ${name} | ${rowFiles} | ${bracketed} | ${Number.isFinite(v.minMs) ? `(${formatMs(v.minMs)})` : "–"} | – | – | not ranked | ${artifact} | – |`,
      );
    } else if (v.status === "skipped") {
      lines.push(`| ${name} | ${rowFiles} | skipped | – | – | – | – | – | – |`);
    } else {
      lines.push(`| ${name} | ${rowFiles} | error | – | – | – | – | – | – |`);
      noteText = v.error || v.notes || "";
    }
    if (noteText)
      noteRows.push(
        `- **${displayName(v)}**: ${noteText.replace(/\r?\n/g, " ")}`,
      );
  }

  if (noteRows.length) {
    lines.push("");
    lines.push("<details><summary>Notes</summary>");
    lines.push("");
    lines.push(...noteRows);
    lines.push("");
    lines.push("</details>");
  }
  return { lines, sorted };
}

/**
 * Split variants by comparison class (invocation × threading) and render
 * separate ranked tables. Classes are never mixed in one ranking.
 */
function renderByThreadingClass(variants) {
  const lines = [];
  const byClass = new Map();
  for (const v of variants) {
    const k = classKey(v);
    if (!byClass.has(k)) byClass.set(k, []);
    byClass.get(k).push(v);
  }

  // Stable order: the untargeted class first, then targets alphabetically.
  const keys = [...byClass.keys()].sort((a, b) =>
    a === "all" ? -1 : b === "all" ? 1 : a.localeCompare(b),
  );

  const allSorted = [];
  for (const k of keys) {
    const group = byClass.get(k);
    // Only print class heading when multiple classes exist
    const { lines: tableLines, sorted } = renderVariantTable(group, {
      title: keys.length > 1 ? classLabel(k) : undefined,
    });
    lines.push(...tableLines);
    lines.push("");
    allSorted.push(...sorted);
  }
  return { lines, sorted: allSorted };
}

function renderRawRuns(sorted) {
  const entries = [];
  for (const v of sorted) {
    if (
      (v.status === "ok" || v.status === "unranked") &&
      Array.isArray(v.runs)
    ) {
      const rule = slimRuleFor(v.label);
      entries.push(
        `- **${rule ? rule.slim : v.label}${engineTag(v)}**: ${v.runs.map(formatMs).join(", ")}`,
      );
    }
  }
  // A table of ratio rows has no runs — an empty collapsible says nothing.
  if (entries.length === 0) return [];
  return [
    "<details><summary>Raw runs</summary>",
    "",
    ...entries,
    "",
    "</details>",
  ];
}

/**
 * One legend entry per distinct tool on the surface: the slim display name
 * mapped back to what actually ran. Emitted once, above the tables, instead of
 * repeating the identity in every row.
 */
function renderToolLegend(surface) {
  const variants = Array.isArray(surface.groups)
    ? surface.groups.flatMap((g) => g.variants)
    : (surface.variants ?? []);
  const seen = new Map();
  for (const v of variants) {
    const rule = slimRuleFor(v.label);
    const name = `${rule ? rule.slim : v.label}${engineTag(v)}`;
    if (seen.has(name)) continue;
    const desc = rule?.desc ?? (rule && rule.slim !== v.label ? v.label : null);
    if (desc) seen.set(name, desc);
  }
  if (seen.size === 0) return [];
  const lines = ["Tools:", ""];
  for (const [name, desc] of seen) lines.push(`- **${name}** — ${desc}`);
  lines.push("");
  return lines;
}

export function renderSurfaceMarkdown(surface) {
  const lines = [];
  lines.push(`### ${surface.label}`);
  lines.push("");
  lines.push(
    `Files: **${surface.files.toLocaleString()}** · Bytes: **${surface.bytes.toLocaleString()}**`,
  );
  if (surface.corpus?.provenance) {
    lines.push("");
    lines.push(`Corpus: ${surface.corpus.provenance}`);
    if (surface.corpus.measuredFilesByClass) {
      const scopes = Object.entries(surface.corpus.measuredFilesByClass)
        .map(([key, count]) => {
          const excluded = surface.corpus.excludedByClass?.[key] ?? 0;
          return `${key}: **${count}/${surface.corpus.configuredFiles}** files (${excluded} excluded)`;
        })
        .join(" · ");
      lines.push("");
      lines.push(
        `Version-class scopes: ${scopes}. Each row's Files column identifies its applicable corpus; classes are never ranked together.`,
      );
    } else if (surface.corpus.excluded > 0) {
      lines.push("");
      lines.push(
        `Surface scope: **${surface.corpus.measuredFiles}/${surface.corpus.configuredFiles}** files · ${surface.corpus.excluded} excluded before timing because an applicable official reference API rejected the raw, unpreprocessed source. The identical accepted set is used for every row.`,
      );
    }
  }
  lines.push("");
  lines.push(RANKING_RULES);
  lines.push("");
  lines.push(...renderToolLegend(surface));

  // Compile matrix (and any future grouped surface)
  if (Array.isArray(surface.groups) && surface.groups.length > 0) {
    lines.push(
      surface.groupingNote ??
        "Compile results are **grouped by target × environment**, then by comparison class.",
    );
    lines.push("");

    for (const group of surface.groups) {
      lines.push(`#### ${group.label}`);
      lines.push("");
      if (group.target || group.env) {
        lines.push(
          `Target: \`${group.target ?? "?"}\` · Environment: \`${group.env ?? "?"}\``,
        );
        lines.push("");
      }
      const { lines: tableLines, sorted } = renderByThreadingClass(
        group.variants,
      );
      lines.push(...tableLines);
      lines.push(...renderRawRuns(sorted));
      lines.push("");
    }

    lines.push("<details><summary>Methodology</summary>");
    lines.push("");
    for (const note of surface.methodology ?? []) {
      lines.push(`- ${note}`);
    }
    lines.push("");
    lines.push("</details>");
    lines.push("");
    return lines.join("\n");
  }

  // Flat surfaces
  const { lines: tableLines, sorted } = renderByThreadingClass(
    surface.variants,
  );
  lines.push(...tableLines);
  lines.push("<details><summary>Methodology</summary>");
  lines.push("");
  for (const note of surface.methodology ?? []) {
    lines.push(`- ${note}`);
  }
  lines.push("");
  lines.push("Raw runs:");
  lines.push("");
  for (const v of sorted) {
    if (
      (v.status === "ok" || v.status === "unranked") &&
      Array.isArray(v.runs)
    ) {
      const rule = slimRuleFor(v.label);
      lines.push(
        `- **${rule ? rule.slim : v.label}${engineTag(v)}**: ${v.runs.map(formatMs).join(", ")}`,
      );
    }
  }
  lines.push("");
  lines.push("</details>");
  lines.push("");
  return lines.join("\n");
}

export function renderFullMarkdown(data) {
  const lines = [];
  lines.push(`## Benchmark Results`);
  lines.push("");
  lines.push(`- **Generated:** ${data.generatedAt}`);
  lines.push(`- **Fixture:** \`${data.fixture}\` (${data.fileCount} SFCs)`);
  lines.push(
    `- **Runs / warmups:** ${data.settings.runs} / ${data.settings.warmups}`,
  );
  lines.push(
    `- **Runner:** ${data.runner.label} · ${data.runner.platform}/${data.runner.arch} · ${data.runner.cpuCount} CPUs · ${data.runner.cpuModel}`,
  );
  lines.push(`- **Node:** ${data.versions.node}`);
  if (data.commit?.runUrl) {
    lines.push(`- **CI run:** ${data.commit.runUrl}`);
  }
  lines.push("");
  lines.push("### Tool versions");
  lines.push("");
  lines.push("| Package | Version |");
  lines.push("| --- | --- |");
  for (const [name, version] of Object.entries(data.versions)) {
    if (name === "node") continue;
    lines.push(`| ${name} | ${version} |`);
  }
  lines.push("");
  lines.push("### Methodology notes");
  lines.push("");
  for (const note of data.methodology ?? data.fairness ?? []) {
    lines.push(`- ${note}`);
  }
  lines.push("");

  for (const surface of data.surfaces) {
    lines.push(renderSurfaceMarkdown(surface));
  }

  return `${lines.join("\n")}\n`;
}

/** Factual run parameters and corpus rules (for reports). */
export function buildMethodologyNotes() {
  return [
    "Primary ranking metric is the **median of measured runs**. Every measured run is preceded by at least one discarded warmup pass (enforced — `--warmups 0` is clamped to 1).",
    "There is **no cold column**. An unwarmed first run costs a JS compiler ~3.2x its steady state and a native compiler nothing, so ranking on it measures V8 warmup rather than the tool.",
    "Min / std dev / CV% are reported per row. CV% > 10 is flagged ⚠. Above CV 50%, a row with at least three samples is TOO NOISY TO RANK: its time is bracketed and excluded, baseline included. Two-sample rows remain flagged rather than excluded because there is no third observation to identify an outlier.",
    "Measured order rotates deterministically. If the run count is too small for every active variant to visit every execution position, all affected timings remain visible but unranked.",
    "Each comparable workload class is one table. Engine, invocation and threading are row properties, while genuinely different targets or work sets use separate classes: a CLI pays process startup on every run, and a thread pool is not a single thread.",
    "Rows tagged **(JS)** run the JavaScript TypeScript compiler; untagged typecheck/LSP rows often run native tsgo. A cross-engine ratio measures TypeScript's Go rewrite as much as the Svelte layer on top of it.",
    "Surfaces are independent: compile ms is not comparable to typecheck/lint/format ms.",
    "SFC compile uses fixtures/N (.svelte) with unique contents.",
    "Compile matrix cells (client/server × production/development) are independent.",
    "Primary compile corpus is unique file contents (fixtures/N).",
    "Content-hash caches skip work on duplicate bodies — unique fixtures required for ranking.",
    "Tool order is **rotated** on every warmup and measured run, so no tool is pinned to the expensive first slot.",
    "CI does not drop OS page cache; later tools in a job may share a warmer file cache.",
    "Typecheck, format, lint, projection, compile, metadata, LSP, bundle, and incremental-transform rows fail closed on surface-specific work gates.",
    "Compile requires parseable Svelte runtime output per input, external CSS for styled sources, unique fixture markers, option sensitivity, and no uncompiled runes or wrong-framework carriers.",
    "Official svelte/compiler is 1T only.",
    "Verter's Svelte support is experimental — unsupported surfaces fail closed.",
    "LSP: every server resolves from its installed npm package and is skipped when absent.",
    "Diagnostic/format identity across tools is not required for throughput rows.",
  ];
}
