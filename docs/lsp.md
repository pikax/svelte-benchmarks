# LSP / IDE operations

> This page is **generated** from committed JSON snapshots (`results/benchmarks/`, `results/real_world/`). Do not edit by hand — run `pnpm run docs`.

## Results

<details><summary>Ranking rules and measurement definitions</summary>

Ranked on the **median of measured runs** — Warm is the primary ordering and ranking metric. Compiler rows additionally publish a separately sampled **Fresh child** column: the first timed row workload in a new child process, after excluded process startup, package imports and adapter setup. It is not called Cold (the OS page cache is not flushed) and its ratio never substitutes for the warm verdict. One table per comparable workload class: engine, invocation and threading remain row properties; target or explicitly different work may split classes — the latest official Svelte compiler is the sole compiler baseline, and a failed reference unranks the whole comparison rather than promoting a survivor. Every active variant must visit every execution position; shorter runs are unranked. A class with fewer than two valid rows is informational. Rows tagged **(JS)** run the JavaScript TypeScript compiler. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three samples is bracketed as TOO NOISY TO RANK, baseline included.

</details>

- **Generated:** 2026-09-18T13:11:29.670Z
- **Fixture:** `fixtures/200` (200 Svelte files)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · AMD EPYC 9V45 96-Core Processor · 16 GB RAM · Node v22.23.2
- **Commit:** [649f404](https://github.com/pikax/svelte-benchmarks/commit/649f404)
- **CI run:** https://github.com/pikax/svelte-benchmarks/actions/runs/35348270026
- **Source:** `bench-Linux-200-bench.json`

### LSP (editor language server)

Files: **1** · Bytes: **227**

Tools:

- **svelte-language-server (JS)** — Official Svelte language server (stdio) from svelte-language-server.
- **Verter** — verter-lsp — native server from the published npm package; experimental Svelte carrier.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-bench-linux-200-bench-lsp-lsp-all-dark.svg">
  <img src="charts/lsp-bench-linux-200-bench-lsp-lsp-all.svg" alt="LSP (editor language server)" width="760">
</picture>

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Hover bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte-language-server (JS) | 1 | **436.5 ms** | 432.1 ms | 8.0 ms | 1.8% | — | 43 | n/a | — |
| Verter ❌ | 1 | error | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **svelte-language-server (JS)**: Official Svelte language server (stdio) | init=313ms · open→hover=451ms · hoverWarm=1ms
- **Verter ❌**: hover returned null after retries

</details>

<details><summary>Methodology</summary>

- Identical workspace, LspTarget.svelte, UTF-16 hover position on benchMarker.
- Hover content gated on script position and template {benchMarker}.
- Fresh language-server process per measured run.
- Primary ranking column: didOpen→hover latency (median of warmed runs).
- VS Code extension host overhead is NOT measured — only stdio LSP.

Raw runs:

- **svelte-language-server (JS)**: 451.1 ms, 434.6 ms, 436.5 ms, 445.3 ms, 432.1 ms

</details>

### LSP formatting

Files: **1** · Bytes: **166**

Tools:

- **svelte-language-server** — Official Svelte language server (stdio) from svelte-language-server.
- **rsvelte-language-server** — @rsvelte/language-server — formatting and native Svelte lint diagnostics; no TypeScript hover/completion.
- **Verter** — verter-lsp — native server from the published npm package; experimental Svelte carrier.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/lsp-bench-linux-200-bench-lsp-format-lsp-format-all-dark.svg">
  <img src="charts/lsp-bench-linux-200-bench-lsp-format-lsp-format-all.svg" alt="LSP formatting" width="760">
</picture>

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Formatted bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| rsvelte-language-server | 1 | **1.3 ms** | 1.3 ms | 0.0 ms | 3.6% | 1.00x | 176 | n/a | 765 files/s |
| svelte-language-server | 1 | **159.1 ms** | 156.3 ms | 7.8 ms | 4.9% | 121.63x | 176 | n/a | 6 files/s |
| Verter ⚠ | 1 | (4.7 ms) | (4.6 ms) | – | – | not ranked | (167) | n/a | – |

<details><summary>Notes</summary>

- **rsvelte-language-server**: Fresh stdio server; didOpen→formatting | gate: ✓ changed=true script=true markup=true
- **svelte-language-server**: Fresh stdio server; didOpen→formatting | gate: ✓ changed=true script=true markup=true
- **Verter ⚠**: Fresh stdio server; didOpen→formatting | gate: ✗ changed=true script=false markup=false

</details>

<details><summary>Methodology</summary>

- This surface exists separately from hover: rsvelte-language-server implements formatting and lint diagnostics, not TypeScript hover.
- Every pass starts a fresh stdio server, opens the same valid Svelte 5 component, and times textDocument/formatting.
- The output must rewrite both script and nested markup; a server that returns no edits or formats only one region is unranked.
- Server initialization is completed before the primary interval and is therefore not included in didOpen→formatting.

Raw runs:

- **rsvelte-language-server**: 1.3 ms, 1.3 ms, 1.4 ms, 1.3 ms, 1.3 ms
- **svelte-language-server**: 157.7 ms, 159.1 ms, 156.3 ms, 175.6 ms, 160.9 ms
- **Verter**: 4.7 ms, 4.7 ms, 4.7 ms, 4.6 ms, 4.9 ms

</details>

## Tool versions

<details><summary>Pinned package versions</summary>

| Package | Version |
| --- | --- |
| svelte | 5.57.0 |
| svelte-check | 4.7.6 |
| svelte-check-rs | 0.11.2 |
| svelte-check-native | 1.7.0 |
| @mrwaip/svelte-rs | 0.0.0-canary.15.1 |
| @rsvelte/compiler | 0.12.3 |
| @rsvelte/svelte2tsx | 0.2.27 |
| @rsvelte/svelte-check | 0.5.29 |
| @rsvelte/language-server | 0.7.9 |
| @rsvelte/fmt | 0.7.24 |
| @rsvelte/lint | 0.12.3 |
| @rsvelte/vite-plugin-svelte-native | 0.3.14 |
| @rsvelte/vite-plugin-svelte | 0.5.3 |
| @sveltejs/vite-plugin-svelte | 7.3.0 |
| vite | 8.3.0 |
| @verter/native | 0.0.1-beta.5 |
| @verter/typeinfo | 0.0.1-beta.5 |
| @verter/proto | 0.0.1-beta.5 |
| @bufbuild/protobuf | 2.15.0 |
| verter-tsc | 0.0.1-beta.5 |
| verter-lsp | 0.0.1-beta.5 |
| svelte-language-server | 0.18.4 |
| svelte2tsx | 0.7.61 |
| sveld | 0.37.3 |
| svelte-docinfo | 0.7.0 |
| prettier | 3.9.8 |
| prettier-plugin-svelte | 4.1.1 |
| oxfmt | 0.68.0 |
| eslint-plugin-svelte | 3.23.0 |
| typescript | 6.0.3 |
| cli:svelte-check | 4.7.6 |
| cli:svelte-check-rs | 0.11.2 |
| cli:svelte-check-native | 1.7.0 |
| cli:rsvelte-check | unknown |
| cli:rsvelte-fmt | 0.7.24 |
| cli:rsvelte-lint | 0.12.3 |
| cli:prettier | 3.9.8 |
| cli:oxfmt | 0.68.0 |
| cli:verter-tsc | 0.0.1-beta.5 |

</details>

