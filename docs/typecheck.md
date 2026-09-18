# Typecheck (svelte-check)

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

### Typecheck

Files: **200** · Bytes: **134,760**

Tools:

- **svelte-check (JS)** — Official svelte-check (Svelte language tools CLI) with the JavaScript TypeScript engine.
- **svelte-check-rs** — Rust drop-in replacement for svelte-check (pheuter/svelte-check-rs); uses tsgo when available.
- **rsvelte-check** — @rsvelte/svelte-check CLI — Rust walker + tsc/tsgo.
- **svelte-check-native** — harshmandan/svelte-check-native — Rust Svelte analysis with TypeScript 7 native.
- **verter-tsc** — verter-tsc from the published npm package; experimental Svelte path may be unranked.

##### DEFAULT-SOURCES — separate workload

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/typecheck-bench-linux-200-bench-typecheck-typecheck-target-defau-0rhqfbg-dark.svg">
  <img src="charts/typecheck-bench-linux-200-bench-typecheck-typecheck-target-defau-0rhqfbg.svg" alt="Typecheck — DEFAULT-SOURCES" width="760">
</picture>

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Diagnostics | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte-check-rs | 200 | **785.0 ms** | 771.1 ms | 7.4 ms | 0.9% | — | 40 | n/a | — |

<details><summary>Notes</summary>

- **svelte-check-rs**: svelte-check-rs (Rust) · tsgo when available (7.0.2) | gate: script=✓ tmpl=✓ corpus=✓

</details>

##### EXPERIMENTAL-SVELTE — separate workload

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/typecheck-bench-linux-200-bench-typecheck-typecheck-target-exper-1aub7ts-dark.svg">
  <img src="charts/typecheck-bench-linux-200-bench-typecheck-typecheck-target-exper-1aub7ts.svg" alt="Typecheck — EXPERIMENTAL-SVELTE" width="760">
</picture>

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Diagnostics | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| verter-tsc | 200 | **1.07 s** | 1.05 s | 23.2 ms | 2.2% | — | 0 | n/a | — |

<details><summary>Notes</summary>

- **verter-tsc**: verter-tsc experimental Svelte path; ranked only when it reports the shared .svelte plants. | gate: script=✓ tmpl=✓ corpus=✓

</details>

##### TS+SVELTE — separate workload

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/typecheck-bench-linux-200-bench-typecheck-typecheck-target-ts-svelte-dark.svg">
  <img src="charts/typecheck-bench-linux-200-bench-typecheck-typecheck-target-ts-svelte.svg" alt="Typecheck — TS+SVELTE" width="760">
</picture>

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Diagnostics | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte-check-native | 200 | **134.9 ms** | 130.5 ms | 3.3 ms | 2.5% | 1.00x | 0 | n/a | 1.5k files/s |
| rsvelte-check | 200 | **223.2 ms** | 216.7 ms | 3.3 ms | 1.5% | 1.65x | 20 | n/a | 896 files/s |
| svelte-check (JS) | 200 | **1.92 s** | 1.91 s | 18.0 ms | 0.9% | 14.26x | 0 | n/a | 104 files/s |

<details><summary>Notes</summary>

- **svelte-check-native**: svelte-check-native (harshmandan) · Rust Svelte analysis + TypeScript 7 native; CSS diagnostics excluded for every checker | gate: script=✓ tmpl=✓ corpus=✓
- **rsvelte-check**: rsvelte-check (@rsvelte/svelte-check) with --tsgo when tsgo is available | gate: script=✓ tmpl=✓ corpus=✓
- **svelte-check (JS)**: Official svelte-check (Svelte language tools) · TypeScript JS engine | gate: script=✓ tmpl=✓ corpus=✓

</details>

<details><summary>Methodology</summary>

- Every invocation receives a fresh, byte-identical project and tsconfig; preparation and cleanup occur outside the command timer so disk caches cannot leak across tools or runs.
- Each measurement is a full CLI process invocation. Non-zero exits rank only when output contains attributable source diagnostics; startup, option, and backend failures throw.
- Work gate: isolated script-level and template-level plants, plus a combined plant inserted into the staged corpus, must all report diagnostics to rank. The combined plant is removed before timing so the measured file count and clean-corpus workload stay accurate.
- The ts+svelte comparison class uses --diagnostic-sources ts,svelte. CSS is excluded because svelte-check-native does not implement CSS diagnostics.
- svelte-check-rs does not expose --diagnostic-sources, so its default-source workload is reported in a separate ranking class instead of being silently compared with ts+svelte rows.
- svelte-check = official JS path; svelte-check-rs, rsvelte-check, and svelte-check-native are native checkers (tsgo-backed where applicable).
- verter-tsc is included for the experimental Svelte carrier; expect unranked until Svelte typecheck is first-class.
- Tool order is rotated; ranking metric is the median of warmed runs.

Raw runs:

- **svelte-check-rs**: 771.1 ms, 787.6 ms, 790.1 ms, 785.0 ms, 783.5 ms
- **verter-tsc**: 1.07 s, 1.11 s, 1.07 s, 1.05 s, 1.10 s
- **svelte-check-native**: 131.7 ms, 130.5 ms, 138.5 ms, 134.9 ms, 136.6 ms
- **rsvelte-check**: 224.5 ms, 216.7 ms, 224.6 ms, 223.2 ms, 220.8 ms
- **svelte-check (JS)**: 1.95 s, 1.92 s, 1.92 s, 1.91 s, 1.94 s

</details>

## Confirmation (correctness plants)

#### typecheck

| Case | Tool | Status | Detail |
| --- | --- | --- | --- |
| script-type-error | svelte-check | ✓ pass |  |
| template-wrong-boolean | svelte-check | ✓ pass |  |
| missing-required-prop | svelte-check | ✓ pass |  |
| wrong-prop-type | svelte-check | ✓ pass |  |
| unknown-prop | svelte-check | ✓ pass |  |
| callback-prop-type | svelte-check | ✓ pass |  |
| snippet-parameter-type | svelte-check | ✓ pass |  |
| each-destructuring-type | svelte-check | ✓ pass |  |
| discriminated-union-narrowing | svelte-check | ✓ pass |  |
| store-type-flow | svelte-check | ✓ pass |  |
| each-shadow-restoration-ok | svelte-check | ✓ pass |  |
| each-shadow-restoration-bad | svelte-check | ✓ pass |  |
| snippet-shadow-restoration-ok | svelte-check | ✓ pass |  |
| snippet-shadow-restoration-bad | svelte-check | ✓ pass |  |
| clean-component | svelte-check | ✓ pass |  |
| clean-generics | svelte-check | ✓ pass |  |
| script-type-error | svelte-check-native | ✓ pass |  |
| template-wrong-boolean | svelte-check-native | ✓ pass |  |
| missing-required-prop | svelte-check-native | ✓ pass |  |
| wrong-prop-type | svelte-check-native | ✓ pass |  |
| unknown-prop | svelte-check-native | ✓ pass |  |
| callback-prop-type | svelte-check-native | ✓ pass |  |
| snippet-parameter-type | svelte-check-native | ✓ pass |  |
| each-destructuring-type | svelte-check-native | ✓ pass |  |
| discriminated-union-narrowing | svelte-check-native | ✓ pass |  |
| store-type-flow | svelte-check-native | ✓ pass |  |
| each-shadow-restoration-ok | svelte-check-native | ✓ pass |  |
| each-shadow-restoration-bad | svelte-check-native | ✓ pass |  |
| snippet-shadow-restoration-ok | svelte-check-native | ✓ pass |  |
| snippet-shadow-restoration-bad | svelte-check-native | ✓ pass |  |
| clean-component | svelte-check-native | ✓ pass |  |
| clean-generics | svelte-check-native | ✓ pass |  |
| script-type-error | svelte-check-rs | ✓ pass |  |
| template-wrong-boolean | svelte-check-rs | ✓ pass |  |
| missing-required-prop | svelte-check-rs | ✗ fail | no diagnostic at missing-required-prop/App.svelte:5 (@plant-error) — the tool did not locate the planted error (file diagnostics: missing-required-prop/App.svel |
| wrong-prop-type | svelte-check-rs | ✓ pass |  |
| unknown-prop | svelte-check-rs | ✓ pass |  |
| callback-prop-type | svelte-check-rs | ✓ pass |  |
| snippet-parameter-type | svelte-check-rs | ✓ pass |  |
| each-destructuring-type | svelte-check-rs | ✓ pass |  |
| discriminated-union-narrowing | svelte-check-rs | ✓ pass |  |
| store-type-flow | svelte-check-rs | ✓ pass |  |
| each-shadow-restoration-ok | svelte-check-rs | ✓ pass |  |
| each-shadow-restoration-bad | svelte-check-rs | ✓ pass |  |
| snippet-shadow-restoration-ok | svelte-check-rs | ✓ pass |  |
| snippet-shadow-restoration-bad | svelte-check-rs | ✓ pass |  |
| clean-component | svelte-check-rs | ✓ pass |  |
| clean-generics | svelte-check-rs | ✓ pass |  |
| script-type-error | rsvelte-check | ✓ pass |  |
| template-wrong-boolean | rsvelte-check | ✓ pass |  |
| missing-required-prop | rsvelte-check | ✓ pass |  |
| wrong-prop-type | rsvelte-check | ✓ pass |  |
| unknown-prop | rsvelte-check | ✓ pass |  |
| callback-prop-type | rsvelte-check | ✓ pass |  |
| snippet-parameter-type | rsvelte-check | ✓ pass |  |
| each-destructuring-type | rsvelte-check | ✓ pass |  |
| discriminated-union-narrowing | rsvelte-check | ✓ pass |  |
| store-type-flow | rsvelte-check | ✓ pass |  |
| each-shadow-restoration-ok | rsvelte-check | ✓ pass |  |
| each-shadow-restoration-bad | rsvelte-check | ✓ pass |  |
| snippet-shadow-restoration-ok | rsvelte-check | ✓ pass |  |
| snippet-shadow-restoration-bad | rsvelte-check | ✓ pass |  |
| clean-component | rsvelte-check | ✓ pass |  |
| clean-generics | rsvelte-check | ✓ pass |  |
| script-type-error | verter-tsc | ✓ pass |  |
| template-wrong-boolean | verter-tsc | ✓ pass |  |
| missing-required-prop | verter-tsc | ✓ pass |  |
| wrong-prop-type | verter-tsc | ✓ pass |  |
| unknown-prop | verter-tsc | ✓ pass |  |
| callback-prop-type | verter-tsc | ✓ pass |  |
| snippet-parameter-type | verter-tsc | ✓ pass |  |
| each-destructuring-type | verter-tsc | ✓ pass |  |
| discriminated-union-narrowing | verter-tsc | ✓ pass |  |
| store-type-flow | verter-tsc | ✓ pass |  |
| each-shadow-restoration-ok | verter-tsc | ✓ pass |  |
| each-shadow-restoration-bad | verter-tsc | ✓ pass |  |
| snippet-shadow-restoration-ok | verter-tsc | ✓ pass |  |
| snippet-shadow-restoration-bad | verter-tsc | ✓ pass |  |
| clean-component | verter-tsc | ✓ pass |  |
| clean-generics | verter-tsc | ✗ fail | clean plant produced diagnostics in clean-generics/App.svelte + actual - expected  + [ +   "2:TS2304:Cannot find name 'T'." + ] - []  |

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

