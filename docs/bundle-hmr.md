# Vite bundle & incremental transform

> This page is **generated** from committed JSON snapshots (`results/benchmarks/`, `results/real_world/`). Do not edit by hand — run `pnpm docs`.

- **Generated:** 2026-09-12T10:46:24.868Z
- **Fixture:** `fixtures/200` (200 Svelte files)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · AMD EPYC 7763 64-Core Processor · 16 GB RAM · Node v22.23.2
- **Commit:** [cc44ddb](https://github.com/pikax/svelte-benchmarks/commit/cc44ddb)
- **CI run:** https://github.com/pikax/svelte-benchmarks/actions/runs/34688909557
- **Source:** `bench-Linux-200-bench.json`

## Results

Ranked on the **median of measured runs** — Warm is the primary ordering and ranking metric. Compiler rows additionally publish a separately sampled **Fresh child** column: the first timed row workload in a new child process, after excluded process startup, package imports and adapter setup. It is not called Cold (the OS page cache is not flushed) and its ratio never substitutes for the warm verdict. One table per comparable workload class: engine, invocation and threading remain row properties; target or explicitly different work may split classes — a pinned official Svelte reference is the baseline of its compatibility class, and a failed reference unranks the whole class rather than promoting a survivor. Every active variant must visit every execution position; shorter runs are unranked. A class with fewer than two valid rows is informational. Rows tagged **(JS)** run the JavaScript TypeScript compiler. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three samples is bracketed as TOO NOISY TO RANK, baseline included.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/bundle-hmr-bundle-dark.svg">
  <img src="charts/bundle-hmr-bundle.svg" alt="" width="760">
</picture>

### Vite production bundle (generated Svelte graph)

Files: **200** · Bytes: **134,760**

Ranked on the **median of measured runs** — Warm is the primary ordering and ranking metric. Compiler rows additionally publish a separately sampled **Fresh child** column: the first timed row workload in a new child process, after excluded process startup, package imports and adapter setup. It is not called Cold (the OS page cache is not flushed) and its ratio never substitutes for the warm verdict. One table per comparable workload class: engine, invocation and threading remain row properties; target or explicitly different work may split classes — a pinned official Svelte reference is the baseline of its compatibility class, and a failed reference unranks the whole class rather than promoting a survivor. Every active variant must visit every execution position; shorter runs are unranked. A class with fewer than two valid rows is informational. Rows tagged **(JS)** run the JavaScript TypeScript compiler. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three samples is bracketed as TOO NOISY TO RANK, baseline included.

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | bundle bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 7 × @rsvelte/vite-plugin-svelte | 200 | **347.9 ms** | 322.6 ms | 12.2 ms | 3.5% | 1.00x | 300,455 | n/a | 575 files/s |
| Vite 7 × @sveltejs/vite-plugin-svelte | 200 | **532.8 ms** | 481.9 ms | 37.2 ms | 7.0% | 1.53x | 300,455 | n/a | 375 files/s |

<details><summary>Notes</summary>

- **Vite 7 × @rsvelte/vite-plugin-svelte**: 200/200 Svelte transforms passed the untimed census
- **Vite 7 × @sveltejs/vite-plugin-svelte**: 200/200 Svelte transforms passed the untimed census

</details>

<details><summary>Methodology</summary>

- Both rows use Vite 7.3.6, the newest Vite major supported by both pinned plugin lines without peer conflicts.
- The generated entry imports every selected component; Rollup tree-shaking and minification are disabled and Svelte runtime imports are externalized identically.
- An untimed post-transform census requires every Svelte file to reach non-empty compiled runtime code. A partial graph remains visible but unranked.
- Plugin construction and the complete in-process Vite build are inside the measured interval; package module loading occurs before the surface starts for both rows.
- This is one controlled generated module graph, not a claim about any third-party project's native build.

Raw runs:

- **Vite 7 × @rsvelte/vite-plugin-svelte**: 349.4 ms, 353.2 ms, 347.9 ms, 346.7 ms, 322.6 ms
- **Vite 7 × @sveltejs/vite-plugin-svelte**: 532.8 ms, 533.9 ms, 515.7 ms, 584.6 ms, 481.9 ms

</details>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/bundle-hmr-hmr-dark.svg">
  <img src="charts/bundle-hmr-hmr.svg" alt="" width="760">
</picture>

### Warm incremental Svelte transform (Vite HMR compile path)

Files: **1** · Bytes: **99**

Ranked on the **median of measured runs** — Warm is the primary ordering and ranking metric. Compiler rows additionally publish a separately sampled **Fresh child** column: the first timed row workload in a new child process, after excluded process startup, package imports and adapter setup. It is not called Cold (the OS page cache is not flushed) and its ratio never substitutes for the warm verdict. One table per comparable workload class: engine, invocation and threading remain row properties; target or explicitly different work may split classes — a pinned official Svelte reference is the baseline of its compatibility class, and a failed reference unranks the whole class rather than promoting a survivor. Every active variant must visit every execution position; shorter runs are unranked. A class with fewer than two valid rows is informational. Rows tagged **(JS)** run the JavaScript TypeScript compiler. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three samples is bracketed as TOO NOISY TO RANK, baseline included.

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | module bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 7 × @sveltejs/vite-plugin-svelte | 1 | **25.5 ms** | 23.7 ms | 1.8 ms | 6.9% | 1.00x | 517 | n/a | 39 files/s |
| Vite 7 × @rsvelte/vite-plugin-svelte | 1 | **25.7 ms** | 22.4 ms | 2.0 ms | 7.9% | 1.01x | 516 | n/a | 39 files/s |

<details><summary>Notes</summary>

- **Vite 7 × @sveltejs/vite-plugin-svelte**: fresh dev server, initial module transform discarded, changed marker required in updated module
- **Vite 7 × @rsvelte/vite-plugin-svelte**: fresh dev server, initial module transform discarded, changed marker required in updated module

</details>

<details><summary>Methodology</summary>

- Both rows edit the same first file from a 200-file generated corpus and require the unique edit marker in Vite's updated module.
- Each pass creates a fresh dev server, performs and discards the initial module transform, then times invalidation plus the changed module transform.
- Server creation, initial transform, file write, restoration, and shutdown are outside the measured interval.
- This measures the warm server-side Svelte transform path only. It excludes filesystem watcher debounce, WebSocket delivery, browser fetch/execution, and DOM patching, so it is not labeled an end-to-end HMR round trip.
- Both integrations use the same Vite version and identical hot/compiler options.

Raw runs:

- **Vite 7 × @sveltejs/vite-plugin-svelte**: 28.2 ms, 25.8 ms, 23.7 ms, 25.5 ms, 24.1 ms
- **Vite 7 × @rsvelte/vite-plugin-svelte**: 27.9 ms, 26.4 ms, 25.7 ms, 22.4 ms, 25.5 ms

</details>

## Tool versions

<details><summary>Pinned package versions</summary>

| Package | Version |
| --- | --- |
| svelte | 5.57.0 |
| svelte-mrwaip-reference | 5.56.4 |
| svelte-check | 4.7.6 |
| svelte-check-rs | 0.11.2 |
| svelte-check-native | 1.5.2 |
| @mrwaip/svelte-rs | 0.0.0-canary.13.1 |
| @rsvelte/compiler | 0.12.2 |
| @rsvelte/svelte2tsx | 0.2.26 |
| @rsvelte/svelte-check | 0.5.28 |
| @rsvelte/language-server | 0.7.8 |
| @rsvelte/fmt | 0.7.23 |
| @rsvelte/lint | 0.12.2 |
| @rsvelte/vite-plugin-svelte-native | 0.3.14 |
| @rsvelte/vite-plugin-svelte | 0.5.2 |
| @sveltejs/vite-plugin-svelte | 7.3.0 |
| vite | 8.3.0 |
| @verter/native | 0.0.1-beta.3 |
| @verter/typeinfo | 0.0.1-beta.3 |
| @verter/proto | 0.0.1-beta.3 |
| @bufbuild/protobuf | 2.15.0 |
| verter-tsc | 0.0.1-beta.3 |
| verter-lsp | 0.0.1-beta.3 |
| svelte-language-server | 0.18.4 |
| svelte2tsx | 0.7.61 |
| sveld | 0.36.11 |
| svelte-docinfo | 0.7.0 |
| prettier | 3.9.6 |
| prettier-plugin-svelte | 4.1.1 |
| oxfmt | 0.67.0 |
| eslint-plugin-svelte | 3.23.0 |
| typescript | 6.0.3 |
| cli:svelte-check | 4.7.6 |
| cli:svelte-check-rs | 0.11.2 |
| cli:svelte-check-native | 1.5.2 |
| cli:rsvelte-check | unknown |
| cli:rsvelte-fmt | 0.7.23 |
| cli:rsvelte-lint | 0.12.2 |
| cli:prettier | 3.9.6 |
| cli:oxfmt | 0.67.0 |
| cli:verter-tsc | 0.0.1-beta.3 |

</details>

