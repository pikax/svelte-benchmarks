# Svelte Toolchain Benchmarks

Fair, fail-closed benchmarks for the Svelte toolchain: compile, projection,
typecheck, format, lint, component metadata, LSP/IDE operations, Vite
bundle/incremental transform, memory, and real-world project corpora — across
the official tools and the native alternatives (`@mrwaip/svelte-rs`,
`@rsvelte/*`, `svelte-check-rs`/`-native`, Verter, …).

## The contract

- **Performance evidence AND correctness evidence.** A tool never gets a
  performance advantage from doing less work: every ranked row passes surface
  work gates, and compiler rows are additionally gated by a Svelte 5 runtime
  semantic plant suite (28 plants) executed in isolated child processes after
  timing.
- **The latest official Svelte is the sole compiler reference.** Every compiler
  uses the same inputs and is validated against the same installed Svelte
  runtime. The exact version is pinned in the root dependency and recorded in
  each run. A failed reference unranks the whole comparison.
- **A failed candidate stays visible** with its measured time (bracketed) but
  unranked. `UNKNOWN` correctness is not `PASS`. Missing functionality is
  `skipped` — a different API/workload is never substituted.
  Verter's published compiler entrypoint is exercised on Svelte inputs as
  unranked diagnostic evidence, retaining invalid output and compilation errors.
- **Warm median is the primary metric.** Compiler rows also publish a
  separately sampled **Fresh child** column (first timed workload in a new
  child process; startup/imports/adapter setup excluded — not machine-cold).
- **No tool can win by caching.** Every pass compiles a revised corpus
  (fixed-width token + used CSS custom-property rule); the timed loop asserts
  the token reached the emitted artifact for ranked compilers. Verter's
  diagnostic pass records a missing output token as failed validation.
- **Published reference numbers are Linux CI snapshots only.** Local runs are
  same-machine comparisons and can never silently overwrite published results.

## What is compared

| Surface | Tools |
| --- | --- |
| Compile (client/server × prod/dev) | `svelte/compiler` (latest official release), `@mrwaip/svelte-rs`, `@rsvelte/compiler` (Wasm), `@rsvelte/vite-plugin-svelte-native` (NAPI), Verter `compileMany` (unranked diagnostics) |
| Projection (svelte2tsx) | `svelte2tsx`, `@rsvelte/svelte2tsx`, Verter IDE projection (separate schema class) |
| Typecheck | `svelte-check`, `svelte-check-rs`, `svelte-check-native`, `rsvelte-check`, `verter-tsc` (tsc/tsgo engines as row properties) |
| Format | Prettier + prettier-plugin-svelte, `@rsvelte/fmt` |
| Lint | eslint-plugin-svelte (API/CLI/workers), `@rsvelte/lint`, Verter host diagnostics |
| Component metadata | `sveld`, `svelte-docinfo`, Verter typeinfo |
| LSP / IDE | `svelte-language-server`, `@rsvelte/language-server`, `verter-lsp` |
| Bundle / incremental | `@sveltejs/vite-plugin-svelte`, `@rsvelte/vite-plugin-svelte` (same Vite stack) |
| Real-world | Pinned OSS checkouts (SMUI, Flowbite-Svelte, open-webui, …) |

## How to read

- [docs/how-to-read.md](docs/how-to-read.md) — columns, markers, ranking rules.
- [docs/methodology.md](docs/methodology.md) — measurement methodology.
- Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error ·
  ⏭ skipped · **(JS)** = JavaScript TypeScript engine.
- Rows above CV 50% (≥3 samples) are TOO NOISY TO RANK — bracketed, excluded.

## Quick start

```bash
pnpm install --frozen-lockfile
pnpm generate            # fixtures (unique contents)
pnpm bench:small         # wiring smoke (NOT reference numbers)
pnpm test:harness        # harness self-tests
pnpm confirm             # correctness confirmation suites
pnpm docs                # regenerate README/docs from committed snapshots
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full command surface and the
publication workflow (`pnpm pull:ci-results` / `pnpm publish:ci-results`).

## Results index

<!-- svelte-bench: begin:RESULTS_INDEX -->
- [Svelte compiler](docs/compiler.md)
- [Projection (svelte2tsx)](docs/projection.md)
- [Typecheck (svelte-check)](docs/typecheck.md)
- [Format](docs/format.md)
- [Lint](docs/lint.md)
- [Component metadata](docs/component-meta.md)
- [LSP / IDE operations](docs/lsp.md)
- [Vite bundle & incremental transform](docs/bundle-hmr.md)
- [Real-world projects](docs/real-world.md)
- [Memory (isolated probe)](docs/memory.md)
<!-- svelte-bench: end:RESULTS_INDEX -->

## Current run provenance

<!-- svelte-bench: begin:RUN_META -->
- **Generated:** 2026-09-18T13:11:29.670Z
- **Fixture:** `fixtures/200` (200 Svelte files)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · AMD EPYC 9V45 96-Core Processor · 16 GB RAM · Node v22.23.2
- **Commit:** [649f404](https://github.com/pikax/svelte-benchmarks/commit/649f404)
- **CI run:** https://github.com/pikax/svelte-benchmarks/actions/runs/35348270026
- **Source:** `bench-Linux-200-bench.json`
<!-- svelte-bench: end:RUN_META -->

## Benchmark results

<!-- svelte-bench: begin:BENCHMARK_RESULTS -->
Generated **2026-09-18** from the latest published **Linux** JSON snapshot (`bench-Linux-200-bench.json`, 200 Svelte files, 5 runs). See [how to read](docs/how-to-read.md) and [methodology](docs/methodology.md).

Each chart covers one workload. Compiler range bars combine warm (solid) and fresh-child (lighter) measurements on the same scale. Hatched bars are unranked. Expand a timing table for ratios and memory; skipped and errored tools remain visible in the tables.

### Svelte compiler

> [Full results, raw samples and validation evidence →](docs/compiler.md)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/compiler-bench-linux-200-bench-compile-client-prod-class-svelte-dark.svg">
  <img src="docs/charts/compiler-bench-linux-200-bench-compile-client-prod-class-svelte.svg" alt="Compiler — CLIENT · production · Svelte runtime" width="760">
</picture>

<details><summary>Timing table and memory</summary>

| Tool | Fresh child | **Warm (primary)** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: | ---: |
| svelte/compiler 5.57.0 | 269 ms | **221 ms** | — | 118.6 MB |
| @mrwaip/svelte-rs (NAPI) ⚠ | 25.8 ms | (26.3 ms) | not ranked | 69.9 MB |
| @rsvelte/native (NAPI) ⚠ | 81.7 ms | (84.4 ms) | not ranked | 81.9 MB |
| @rsvelte/compiler (wasm) ⚠ | 211 ms | (195 ms) | not ranked | 179.2 MB |

⚠ bracketed rows are measured but unranked — see [the full page](docs/compiler.md) for why.

</details>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/compiler-bench-linux-200-bench-compile-server-prod-class-svelte-dark.svg">
  <img src="docs/charts/compiler-bench-linux-200-bench-compile-server-prod-class-svelte.svg" alt="Compiler — SERVER · production · Svelte runtime" width="760">
</picture>

<details><summary>Timing table and memory</summary>

| Tool | Fresh child | **Warm (primary)** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: | ---: |
| @rsvelte/native (NAPI) | 57.8 ms | **56.5 ms** | 1.00x | 81.9 MB |
| svelte/compiler 5.57.0 | 240 ms | **147 ms** | 2.60x | 118.6 MB |
| @rsvelte/compiler (wasm) | 166 ms | **147 ms** | 2.61x | 179.2 MB |
| @mrwaip/svelte-rs (NAPI) ⚠ | 19.7 ms | (18.3 ms) | not ranked | 69.9 MB |

⚠ bracketed rows are measured but unranked — see [the full page](docs/compiler.md) for why.

</details>

**Separate workloads and availability** — informational timings; no speed ranking across these rows.

| Tool | Workload | Median | Status |
| --- | --- | ---: | --- |
| Verter (stateless) | CLIENT · production · EXPERIMENTAL-SVELTE | (40.7 ms) | unranked |
| Verter (stateless) | SERVER · production · EXPERIMENTAL-SVELTE | (22.1 ms) | unranked |


Development builds and all validation evidence: [full compiler results](docs/compiler.md).


### Projection (svelte2tsx)

> [Full results, raw samples and validation evidence →](docs/projection.md)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/projection-bench-linux-200-bench-projection-projection-class-sve-1trvr77-dark.svg">
  <img src="docs/charts/projection-bench-linux-200-bench-projection-projection-class-sve-1trvr77.svg" alt="Svelte TypeScript projection — SVELTE2TSX-COMPATIBLE" width="760">
</picture>

<details><summary>Timing table and memory</summary>

| Tool | **Median (primary)** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| @rsvelte/svelte2tsx (Wasm) | **17.2 ms** | 1.00x | 182.4 MB |
| svelte2tsx | **76.8 ms** | 4.47x | 132.2 MB |

</details>

**Separate workloads and availability** — informational timings; no speed ranking across these rows.

| Tool | Workload | Median | Status |
| --- | --- | ---: | --- |
| Verter IDE projection | verter-ide-projection | — | error |

**Verter IDE projection:** HostError: runtime surface refused for '/home/runner/work/svelte-benchmarks/svelte-benchmarks/fixtures/200/Comp00002.svelte': svelte-runtime-unsupported-element: Svelte client emission does not yet support the `<nav>` element (it is not in the finite client-core element allowlist `a` / `button` / `div` / `h1` / `input` / `p`).


### Typecheck (svelte-check)

> [Full results, raw samples and validation evidence →](docs/typecheck.md)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/typecheck-bench-linux-200-bench-typecheck-typecheck-target-ts-svelte-dark.svg">
  <img src="docs/charts/typecheck-bench-linux-200-bench-typecheck-typecheck-target-ts-svelte.svg" alt="Typecheck — TS+SVELTE" width="760">
</picture>

<details><summary>Timing table and memory</summary>

| Tool | **Median (primary)** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| svelte-check-native | **135 ms** | 1.00x | — |
| rsvelte-check | **223 ms** | 1.65x | — |
| svelte-check (JS) | **1.92 s** | 14.26x | — |

</details>

**Separate workloads and availability** — informational timings; no speed ranking across these rows.

| Tool | Workload | Median | Status |
| --- | --- | ---: | --- |
| svelte-check-rs | DEFAULT-SOURCES | 785 ms | measured |
| verter-tsc | EXPERIMENTAL-SVELTE | 1.07 s | measured |



### Format

> [Full results, raw samples and validation evidence →](docs/format.md)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/format-bench-linux-200-bench-format-format-all-dark.svg">
  <img src="docs/charts/format-bench-linux-200-bench-format-format-all.svg" alt="Format" width="760">
</picture>

<details><summary>Timing table and memory</summary>

| Tool | **Median (primary)** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| rsvelte-fmt | **129 ms** | 1.00x | — |
| Prettier | **1.57 s** | 12.17x | — |
| Oxfmt ⏭ | skipped | — | — |

**Oxfmt ⏭:** Pinned Oxfmt release excludes .svelte files; no CLI-startup proxy is timed.

</details>


### Lint

> [Full results, raw samples and validation evidence →](docs/lint.md)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/lint-bench-linux-200-bench-lint-lint-class-eslint-recommended-rules-dark.svg">
  <img src="docs/charts/lint-bench-linux-200-bench-lint-lint-class-eslint-recommended-rules.svg" alt="Lint — ESLINT-RECOMMENDED-RULES" width="760">
</picture>

<details><summary>Timing table and memory</summary>

| Tool | **Median (primary)** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| eslint-plugin-svelte (1T API) | **228 ms** | 1.00x | — |
| eslint-plugin-svelte (CLI) | **711 ms** | 3.11x | — |
| eslint-plugin-svelte (worker pool) | **1.04 s** | 4.56x | — |

</details>

**Separate workloads and availability** — informational timings; no speed ranking across these rows.

| Tool | Workload | Median | Status |
| --- | --- | ---: | --- |
| rsvelte-lint | RSVELTE-NATIVE-RULES | 88.1 ms | measured |
| Verter host lint | VERTER-NATIVE-DIAGNOSTICS | (73.6 ms) | unranked |



### Component metadata

> [Full results, raw samples and validation evidence →](docs/component-meta.md)

**Separate workloads and availability** — informational timings; no speed ranking across these rows.

| Tool | Workload | Median | Status |
| --- | --- | ---: | --- |
| sveld (AST-only) | SVELD-AST-PROJECT | 43.0 ms | measured |
| sveld (resolveTypes) | SVELD-RESOLVE-TYPES-PROJECT | 39.8 ms | measured |
| svelte-docinfo | SVELTE-DOCINFO-FILES-NO-DEPENDENCIES | 392 ms | measured |
| Verter typeinfo | VERTER-FRAMEWORK-SURFACE | (137 ms) | unranked |



### LSP / IDE operations

> [Full results, raw samples and validation evidence →](docs/lsp.md)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/lsp-bench-linux-200-bench-lsp-lsp-all-dark.svg">
  <img src="docs/charts/lsp-bench-linux-200-bench-lsp-lsp-all.svg" alt="LSP (editor language server)" width="760">
</picture>

<details><summary>Timing table and memory</summary>

| Tool | **Median (primary)** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| svelte-language-server (JS) | **436 ms** | — | — |
| Verter ❌ | error | — | — |

**Verter ❌:** hover returned null after retries

</details>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/lsp-bench-linux-200-bench-lsp-format-lsp-format-all-dark.svg">
  <img src="docs/charts/lsp-bench-linux-200-bench-lsp-format-lsp-format-all.svg" alt="LSP formatting" width="760">
</picture>

<details><summary>Timing table and memory</summary>

| Tool | **Median (primary)** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| rsvelte-language-server | **1.3 ms** | 1.00x | — |
| svelte-language-server | **159 ms** | 121.63x | — |
| Verter ⚠ | (4.7 ms) | not ranked | — |

⚠ bracketed rows are measured but unranked — see [the full page](docs/lsp.md) for why.

</details>


### Vite bundle & incremental transform

> [Full results, raw samples and validation evidence →](docs/bundle-hmr.md)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/bundle-hmr-bench-linux-200-bench-bundle-bundle-class-vite-7-svel-0fso2i1-dark.svg">
  <img src="docs/charts/bundle-hmr-bench-linux-200-bench-bundle-bundle-class-vite-7-svel-0fso2i1.svg" alt="Vite production bundle (generated Svelte graph) — VITE-7-SVELTE-INTEGRATION-BUILD" width="760">
</picture>

<details><summary>Timing table and memory</summary>

| Tool | **Median (primary)** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| Vite 7 × @rsvelte/vite-plugin-svelte | **212 ms** | 1.00x | — |
| Vite 7 × @sveltejs/vite-plugin-svelte | **314 ms** | 1.48x | — |

</details>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/bundle-hmr-bench-linux-200-bench-hmr-hmr-class-vite-7-warm-incre-1lyd23z-dark.svg">
  <img src="docs/charts/bundle-hmr-bench-linux-200-bench-hmr-hmr-class-vite-7-warm-incre-1lyd23z.svg" alt="Warm incremental Svelte transform (Vite HMR compile path) — VITE-7-WARM-INCREMENTAL-SVELTE-TRANSFORM" width="760">
</picture>

<details><summary>Timing table and memory</summary>

| Tool | **Median (primary)** | vs fastest | Peak RSS |
| --- | ---: | ---: | ---: |
| Vite 7 × @rsvelte/vite-plugin-svelte | **14.5 ms** | 1.00x | — |
| Vite 7 × @sveltejs/vite-plugin-svelte | **16.2 ms** | 1.12x | — |

</details>


<!-- svelte-bench: end:BENCHMARK_RESULTS -->

## Real-world results

<!-- svelte-bench: begin:REAL_WORLD -->
Pinned OSS checkouts, re-compiled per surface — ranked within a corpus, never across projects (5 projects). Full evidence: [docs/real-world.md](docs/real-world.md).

- **carbon-components-svelte** — `real-world-Linux-carbon-components-svelte.json`
- **flowbite-svelte** — `real-world-Linux-flowbite-svelte.json`
- **open-webui** — `real-world-Linux-open-webui.json`
- **platform** — `real-world-Linux-platform.json`
- **smui** — `real-world-Linux-smui.json`
<!-- svelte-bench: end:REAL_WORLD -->
