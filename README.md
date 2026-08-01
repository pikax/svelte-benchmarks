# Svelte Toolchain Benchmarks

Throughput benchmarks for Svelte compilers, TypeScript projectors, typecheckers, formatters, linters, metadata extractors, and language servers. The reporting and CI guidelines follow [vue-benchmarks](https://github.com/pikax/vue-benchmarks), with framework-specific workloads replaced by Svelte APIs and `.svelte` corpora.

<!-- RESULTS_INDEX_START -->

**Results index** — summaries below; every result links its full environment, methodology, notes, and raw runs:

- **[Reference results](#reference-results)** — [how to read](docs/how-to-read.md) · [Ubuntu/Linux · bench](docs/results/bench-Linux-200-bench.md)

<!-- RESULTS_INDEX_END -->

## What is compared

| Surface                                                  | Tools                                                                                                                                                                         |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SFC compile** (client/server × production/development) | `svelte/compiler` · `@mrwaip/svelte-rs` · `@rsvelte/compiler` (Wasm) · `@rsvelte/vite-plugin-svelte-native` (NAPI) · Verter (`skipped`: no public Svelte runtime compile API) |
| **Svelte TypeScript projection**                         | official `svelte2tsx` · `@rsvelte/svelte2tsx` · Verter `ensureIdeCompiled/getIde` (separate projection schema)                                                                |
| **Typecheck**                                            | `svelte-check` · `svelte-check-rs` · `rsvelte-check` · `svelte-check-native` · `verter-tsc` (experimental)                                                                    |
| **Format**                                               | Prettier + `prettier-plugin-svelte` · `rsvelte-fmt` · Oxfmt                                                                                                                   |
| **Lint**                                                 | `eslint-plugin-svelte` (API, workers, and CLI) · `rsvelte-lint` · Verter host lint                                                                                            |
| **Component metadata**                                   | `sveld` (AST-only and `resolveTypes`) · `svelte-docinfo` (semantic) · Verter Svelte framework surface via `@verter/typeinfo`                                                  |
| **LSP hover**                                            | `svelte-language-server` · `verter-lsp` (experimental)                                                                                                                        |
| **LSP formatting**                                       | `svelte-language-server` · `@rsvelte/language-server` · `verter-lsp` (experimental)                                                                                           |
| **Memory / resources**                                   | isolated compile and projection workers for the applicable official, rsvelte, MrWaip, and Verter implementations                                                              |
| **Vite bundle / incremental transform**                  | official `@sveltejs/vite-plugin-svelte` · rsvelte's drop-in `@rsvelte/vite-plugin-svelte` on one generated module graph                                                       |

## How to read the tables

[How to read the tables →](docs/how-to-read.md) explains ranking, status markers, noise exclusion, and why a fast row may remain visible but unranked. Exact corpus construction and work gates are in [docs/methodology.md](docs/methodology.md).

The suite aims for neutral measurement, but it does not claim all tools implement identical semantics or expose identical APIs. Those differences are disclosed. Rows are ranked only within equivalent workload classes after shared correctness gates; invocation mode, engine, thread count, and per-row file count remain visible.

## Quick start

```bash
corepack enable && pnpm install   # Node 22+, pnpm 10
pnpm generate                     # deterministic Svelte fixtures
pnpm bench                        # 5 measured runs, 1 discarded warmup
pnpm test:harness                 # benchmark-harness self-tests
pnpm confirm                      # correctness checks; no timings or rankings
pnpm smoke                        # small end-to-end run
```

Useful slices:

```bash
pnpm bench:compile
pnpm bench:typecheck
pnpm bench:format
pnpm bench:lint
pnpm bench:lsp
pnpm bench:lsp-format
pnpm bench:projection
pnpm bench:component-meta
pnpm bench:memory:small
pnpm bench:memory
pnpm bench:bundle
pnpm bench:hmr
pnpm bench:ide:list
pnpm bench:ide
pnpm bench:compile:single
pnpm bench:compile:repeated
pnpm bench:small
```

Real-world source corpora:

```bash
pnpm fetch:real-world
pnpm bench:real-world:smoke       # five files per project; not publishable
pnpm bench:real-world:full        # every configured Svelte file
```

Published reference results are Linux CI only. Local results are meaningful for comparisons made on the same machine and run; they should not be compared numerically with published tables.

[Memory and resource results →](MEMORY.md) are published separately from speed. Each sample uses a fresh process, explicit GC, a pre-load baseline, and the OS peak-RSS high-water mark; its CPU time is context only and is never ranked as speed.

## Reference results

Known boundaries that matter before reading a ranking:

| Boundary                                                                          | Treatment                                                                                                                                               |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Verter's Svelte paths are experimental                                            | Unsupported or incorrect work fails closed; the time remains visible but unranked.                                                                      |
| Typecheck rows may use different TypeScript engines                               | JavaScript-engine rows are tagged **(JS)**; cross-engine ratios include the engine rewrite, not just the Svelte layer.                                  |
| Formatter and linter rule sets are not identical                                  | A shared markup plant and same-file-set census establish minimum comparable work; they do not imply identical output or diagnostics.                    |
| The pinned Oxfmt release excludes `.svelte` files                                 | It is reported skipped; CLI startup is not timed as a proxy for Svelte formatting work.                                                                 |
| CLI, in-process, single-threaded, and worker-pool rows have different fixed costs | These properties remain on each row. Compare like modes when attributing a performance difference.                                                      |
| `svelte-check-rs` cannot select diagnostic sources                                | Its default-source workload is ranked separately from the shared `ts,svelte` checker class.                                                             |
| Component metadata has different API boundaries                                   | Each current metadata API is informational in its own class; no cross-tool semantic ratio is claimed.                                                   |
| Native lint engines expose different rule sets                                    | ESLint recommended rules, rsvelte rules, and Verter diagnostics are separate classes.                                                                   |
| Compiler versions accept different real-world syntax                              | Eligibility is determined independently by each pinned official version; row file counts disclose the resulting scope.                                  |
| rsvelte LSP does not implement TypeScript hover                                   | It is measured on LSP formatting, not inserted into the hover table as a failed implementation.                                                         |
| Compiler ports target different Svelte patch releases                             | rsvelte is ranked with official 5.56.8; MrWaip is ranked with a separately pinned official 5.56.4; Verter remains experimental.                         |
| Vite integrations must share one supported dependency stack                       | Both plugin rows use Vite 7.3.6 and identical generated graphs/options; Vite 8 is not used because the shared inspector peer range does not support it. |

<!-- BENCHMARK_RESULTS_START -->

> Auto-updated 2026-08-01 from benchmark artifacts.
> Linux CI results are the published reference; local runs are for comparison on the same machine only.
> Every measured run is warmed; the primary metric is the median.

#### Ubuntu/Linux · bench

<!-- source: bench-Linux-200-bench.md -->

> 📄 **[Full details →](docs/results/bench-Linux-200-bench.md)** — environment, methodology, per-row notes and raw runs (43 collapsed block(s)).

### SFC compile (unique contents)

Files: **200** · Bytes: **134,760**

Compile results are **grouped by target × environment**, then by comparison class.

#### CLIENT · production

Target: `client` · Environment: `production`

##### EXPERIMENTAL-SVELTE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter native ⏭ | 200 | skipped | – | – | – | – | – | – |

##### SVELTE-5.56.4 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @mrwaip/svelte-rs (NAPI) | 200 | **28.7 ms** | 28.4 ms | 0.7 ms | 2.4% | 1.00x | 316,580 | 7.0k files/s |
| svelte/compiler 5.56.4 | 200 | **222.2 ms** | 203.0 ms | 26.7 ms | 12.0% ⚠ | 7.74x | 318,760 | 900 files/s |

##### SVELTE-5.56.8 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @rsvelte/native (NAPI) | 200 | **74.5 ms** | 74.0 ms | 0.8 ms | 1.0% | 1.00x | 318,760 | 2.7k files/s |
| @rsvelte/compiler (wasm) | 200 | **125.4 ms** | 122.3 ms | 3.3 ms | 2.6% | 1.68x | 318,760 | 1.6k files/s |
| svelte/compiler 5.56.8 | 200 | **217.9 ms** | 210.5 ms | 27.4 ms | 12.6% ⚠ | 2.93x | 318,760 | 918 files/s |

#### CLIENT · development

Target: `client` · Environment: `development`

##### EXPERIMENTAL-SVELTE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter native ⏭ | 200 | skipped | – | – | – | – | – | – |

##### SVELTE-5.56.4 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @mrwaip/svelte-rs (NAPI) | 200 | **29.6 ms** | 29.5 ms | 0.4 ms | 1.5% | 1.00x | 417,020 | 6.8k files/s |
| svelte/compiler 5.56.4 | 200 | **215.7 ms** | 195.3 ms | 16.0 ms | 7.4% | 7.29x | 424,780 | 927 files/s |

##### SVELTE-5.56.8 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @rsvelte/native (NAPI) | 200 | **80.5 ms** | 80.2 ms | 1.0 ms | 1.3% | 1.00x | 425,480 | 2.5k files/s |
| @rsvelte/compiler (wasm) | 200 | **131.4 ms** | 130.3 ms | 1.7 ms | 1.3% | 1.63x | 425,480 | 1.5k files/s |
| svelte/compiler 5.56.8 | 200 | **217.0 ms** | 209.9 ms | 9.7 ms | 4.5% | 2.70x | 424,780 | 922 files/s |

#### SERVER · production

Target: `server` · Environment: `production`

##### EXPERIMENTAL-SVELTE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter native ⏭ | 200 | skipped | – | – | – | – | – | – |

##### SVELTE-5.56.4 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @mrwaip/svelte-rs (NAPI) | 200 | **21.8 ms** | 21.8 ms | 0.7 ms | 3.2% | 1.00x | 181,040 | 9.2k files/s |
| svelte/compiler 5.56.4 | 200 | **166.4 ms** | 158.3 ms | 6.9 ms | 4.1% | 7.62x | 180,900 | 1.2k files/s |

##### SVELTE-5.56.8 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @rsvelte/native (NAPI) | 200 | **51.6 ms** | 51.2 ms | 0.6 ms | 1.2% | 1.00x | 180,900 | 3.9k files/s |
| @rsvelte/compiler (wasm) | 200 | **86.1 ms** | 85.3 ms | 1.2 ms | 1.3% | 1.67x | 180,900 | 2.3k files/s |
| svelte/compiler 5.56.8 | 200 | **167.6 ms** | 163.9 ms | 5.3 ms | 3.2% | 3.25x | 180,900 | 1.2k files/s |

#### SERVER · development

Target: `server` · Environment: `development`

##### EXPERIMENTAL-SVELTE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter native ⏭ | 200 | skipped | – | – | – | – | – | – |

##### SVELTE-5.56.4 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @mrwaip/svelte-rs (NAPI) | 200 | **23.4 ms** | 23.1 ms | 0.2 ms | 1.0% | 1.00x | 379,980 | 8.5k files/s |
| svelte/compiler 5.56.4 | 200 | **178.9 ms** | 163.7 ms | 8.0 ms | 4.5% | 7.63x | 389,380 | 1.1k files/s |

##### SVELTE-5.56.8 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @rsvelte/native (NAPI) | 200 | **57.6 ms** | 57.2 ms | 0.2 ms | 0.4% | 1.00x | 387,600 | 3.5k files/s |
| @rsvelte/compiler (wasm) | 200 | **95.4 ms** | 94.5 ms | 0.9 ms | 1.0% | 1.66x | 387,600 | 2.1k files/s |
| svelte/compiler 5.56.8 | 200 | **174.4 ms** | 164.6 ms | 5.2 ms | 3.0% | 3.03x | 389,380 | 1.1k files/s |

### Svelte TypeScript projection

Files: **200** · Bytes: **134,760**

##### SVELTE2TSX-COMPATIBLE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | TSX bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @rsvelte/svelte2tsx (Wasm) | 200 | **22.4 ms** | 21.7 ms | 0.9 ms | 4.0% | 1.00x | 253,540 | 8.9k files/s |
| svelte2tsx | 200 | **105.2 ms** | 100.0 ms | 5.8 ms | 5.5% | 4.70x | 253,740 | 1.9k files/s |

##### VERTER-IDE-PROJECTION — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Projection bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter IDE projection | 200 | **110.5 ms** | 107.9 ms | 1.5 ms | 1.4% | — | 2,403,380 | — |

### Typecheck

Files: **200** · Bytes: **134,760**

##### DEFAULT-SOURCES — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Diagnostics | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte-check-rs | 200 | **1.16 s** | 1.15 s | 21.6 ms | 1.9% | — | 40 | — |

##### EXPERIMENTAL-SVELTE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Diagnostics | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| verter-tsc ⚠ | 200 | (39.0 ms) | (37.8 ms) | – | – | not ranked | (0) | – |

##### TS+SVELTE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Diagnostics | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte-check-native | 200 | **177.1 ms** | 174.3 ms | 2.5 ms | 1.4% | 1.00x | 0 | 1.1k files/s |
| rsvelte-check | 200 | **297.7 ms** | 296.1 ms | 3.0 ms | 1.0% | 1.68x | 40 | 672 files/s |
| svelte-check (JS) | 200 | **2.49 s** | 2.48 s | 13.1 ms | 0.5% | 14.08x | 0 | 80 files/s |

### Format

Files: **200** · Bytes: **134,760**

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| rsvelte-fmt | 200 | **157.5 ms** | 155.1 ms | 4.2 ms | 2.6% | 1.00x | n/a | 1.3k files/s |
| Prettier | 200 | **2.03 s** | 1.99 s | 32.9 ms | 1.6% | 12.87x | n/a | 99 files/s |
| Oxfmt ⏭ | 200 | skipped | – | – | – | – | – | – |

### Lint

Files: **200** · Bytes: **134,760**

##### ESLINT-RECOMMENDED-RULES — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| eslint-plugin-svelte (1T API) | 200 | **254.9 ms** | 246.9 ms | 32.3 ms | 12.7% ⚠ | 1.00x | n/a | 785 files/s |
| eslint-plugin-svelte (CLI) | 200 | **891.8 ms** | 879.3 ms | 15.8 ms | 1.8% | 3.50x | n/a | 224 files/s |
| eslint-plugin-svelte (worker pool) | 200 | **1.35 s** | 1.33 s | 18.8 ms | 1.4% | 5.29x | n/a | 148 files/s |

##### RSVELTE-NATIVE-RULES — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| rsvelte-lint | 200 | **127.7 ms** | 125.7 ms | 15.9 ms | 12.4% ⚠ | — | n/a | — |

##### VERTER-NATIVE-DIAGNOSTICS — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter host lint ⚠ | 200 | (38.7 ms) | (38.6 ms) | – | – | not ranked | – | – |

### Component metadata

Files: **200** · Bytes: **134,760**

##### SVELD-AST-PROJECT — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Metadata items | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| sveld | 200 | **116.5 ms** | 103.8 ms | 9.9 ms | 8.5% | — | 260 | — |

##### SVELD-RESOLVE-TYPES-PROJECT — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Metadata items | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| sveld | 200 | **106.7 ms** | 100.4 ms | 4.5 ms | 4.2% | — | 260 | — |

##### SVELTE-DOCINFO-FILES-NO-DEPENDENCIES — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Metadata items | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte-docinfo | 200 | **466.1 ms** | 428.9 ms | 24.1 ms | 5.2% | — | 260 | — |

##### VERTER-FRAMEWORK-SURFACE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Metadata items | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter typeinfo ⚠ | 200 | (173.4 ms) | (165.5 ms) | – | – | not ranked | (260) | – |

### LSP (editor language server)

Files: **1** · Bytes: **227**

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | 1 | **217.2 ms** | 212.6 ms | 12.0 ms | 5.5% | 1.00x | 43 | 5 files/s |
| svelte-language-server (JS) | 1 | **600.8 ms** | 598.6 ms | 4.6 ms | 0.8% | 2.77x | 43 | 2 files/s |

### LSP formatting

Files: **1** · Bytes: **166**

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Formatted bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| rsvelte-language-server | 1 | **38.9 ms** | 38.0 ms | 0.8 ms | 2.0% | 1.00x | 176 | 26 files/s |
| svelte-language-server | 1 | **209.4 ms** | 207.4 ms | 3.5 ms | 1.7% | 5.39x | 176 | 5 files/s |
| Verter ⚠ | 1 | (2.4 ms) | (2.4 ms) | – | – | not ranked | (166) | – |

### Vite production bundle (generated Svelte graph)

Files: **200** · Bytes: **134,760**

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | bundle bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 7 × @rsvelte/vite-plugin-svelte | 200 | **360.7 ms** | 355.7 ms | 25.6 ms | 7.1% | 1.00x | 314,096 | 554 files/s |
| Vite 7 × @sveltejs/vite-plugin-svelte | 200 | **571.2 ms** | 538.4 ms | 31.4 ms | 5.5% | 1.58x | 314,096 | 350 files/s |

### Warm incremental Svelte transform (Vite HMR compile path)

Files: **1** · Bytes: **99**

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | module bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 7 × @rsvelte/vite-plugin-svelte | 1 | **2.1 ms** | 1.4 ms | 0.6 ms | 29.0% ⚠ | 1.00x | 516 | 469 files/s |
| Vite 7 × @sveltejs/vite-plugin-svelte | 1 | **3.0 ms** | 1.9 ms | 1.5 ms | 50.0% ⚠ | 1.41x | 517 | 332 files/s |

<!-- BENCHMARK_RESULTS_END -->

## Real-world source results

Pinned corpora cover Carbon Components Svelte, Huly Platform, Open WebUI, Flowbite Svelte, and SMUI. Each project is one CI job; all tools and source-only surfaces for that project stay on one runner. Projects are never ranked against each other.

These runs intentionally do not install or execute third-party dependencies. They measure compile, Svelte TypeScript projection, format, and lint over unchanged source bytes staged outside each checkout. Project-native builds/HMR are not published until integrations can preserve the same project configuration and workload; the separate generated-fixture Vite surfaces do not make that claim.

<!-- REAL_WORLD_RESULTS_START -->

No Linux real-world result has been published yet. Run the manual **Benchmark (real-world)** workflow on `main`.

<!-- REAL_WORLD_RESULTS_END -->

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Changes that can alter a ranking must include a harness regression test, a relevant correctness-confirmation case, and a factual methodology note. Do not add tool-specific exemptions to a shared gate; report genuinely different work in a separate class or leave it measured but unranked.

## License

[MIT](LICENSE)
