# Svelte Toolchain Benchmarks

Throughput benchmarks for Svelte compilers, TypeScript projectors, typecheckers, formatters, linters, metadata extractors, and language servers. The reporting and CI guidelines follow [vue-benchmarks](https://github.com/pikax/vue-benchmarks), with framework-specific workloads replaced by Svelte APIs and `.svelte` corpora.

<!-- RESULTS_INDEX_START -->

**Results index** — no Linux CI report has been published from this harness revision yet.

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

No Linux CI result has been published from the current fairness-gated harness yet. Run the manual **Benchmark** workflow on `main` to publish one.

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
