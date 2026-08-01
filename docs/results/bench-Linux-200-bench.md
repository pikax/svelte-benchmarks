# Ubuntu/Linux · bench

## Benchmark Results

- **Generated:** 2026-08-01T16:43:17.281Z
- **Fixture:** `fixtures/200` (200 SFCs)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · AMD EPYC 9V74 80-Core Processor
- **Node:** v22.23.1
- **CI run:** https://github.com/pikax/svelte-benchmarks/actions/runs/30708663895

### Tool versions

| Package | Version |
| --- | --- |
| svelte | 5.56.8 |
| svelte-mrwaip-reference | 5.56.4 |
| svelte-check | 4.7.4 |
| svelte-check-rs | 0.11.0 |
| svelte-check-native | 1.3.0 |
| @mrwaip/svelte-rs | 0.0.0-canary.13.1 |
| @rsvelte/compiler | 0.9.4 |
| @rsvelte/svelte2tsx | 0.2.8 |
| @rsvelte/svelte-check | 0.5.2 |
| @rsvelte/language-server | 0.3.0 |
| @rsvelte/fmt | 0.7.3 |
| @rsvelte/lint | 0.9.4 |
| @rsvelte/vite-plugin-svelte-native | 0.3.1 |
| @rsvelte/vite-plugin-svelte | 0.5.0 |
| @sveltejs/vite-plugin-svelte | 6.2.4 |
| vite | 7.3.6 |
| @verter/native | 0.0.1-beta.3 |
| @verter/typeinfo | 0.0.1-beta.3 |
| @verter/proto | 0.0.1-beta.3 |
| @bufbuild/protobuf | 2.12.0 |
| verter-tsc | 0.0.1-beta.3 |
| verter-lsp | 0.0.1-beta.3 |
| svelte-language-server | 0.18.3 |
| svelte2tsx | 0.7.59 |
| sveld | 0.36.1 |
| svelte-docinfo | 0.5.4 |
| prettier | 3.9.6 |
| prettier-plugin-svelte | 4.1.1 |
| oxfmt | 0.61.0 |
| eslint-plugin-svelte | 3.22.0 |
| typescript | 5.9.3 |
| cli:svelte-check | 4.7.4 |
| cli:svelte-check-rs | 0.11.0 |
| cli:svelte-check-native | 1.3.0 |
| cli:rsvelte-check | unknown |
| cli:rsvelte-fmt | 0.7.3 |
| cli:rsvelte-lint | 0.9.4 |
| cli:prettier | 3.9.6 |
| cli:oxfmt | 0.61.0 |
| cli:verter-tsc | 0.0.1-beta.3 |

### Methodology notes

- Primary ranking metric is the **median of measured runs**. Every measured run is preceded by at least one discarded warmup pass (enforced — `--warmups 0` is clamped to 1).
- There is **no cold column**. An unwarmed first run costs a JS compiler ~3.2x its steady state and a native compiler nothing, so ranking on it measures V8 warmup rather than the tool.
- Min / std dev / CV% are reported per row. CV% > 10 is flagged ⚠. Above CV 50%, a row with at least three samples is TOO NOISY TO RANK: its time is bracketed and excluded, baseline included. Two-sample rows remain flagged rather than excluded because there is no third observation to identify an outlier.
- Measured order rotates deterministically. If the run count is too small for every active variant to visit every execution position, all affected timings remain visible but unranked.
- Each comparable workload class is one table. Engine, invocation and threading are row properties, while genuinely different targets or work sets use separate classes: a CLI pays process startup on every run, and a thread pool is not a single thread.
- Rows tagged **(JS)** run the JavaScript TypeScript compiler; untagged typecheck/LSP rows often run native tsgo. A cross-engine ratio measures TypeScript's Go rewrite as much as the Svelte layer on top of it.
- Surfaces are independent: compile ms is not comparable to typecheck/lint/format ms.
- SFC compile uses fixtures/N (.svelte) with unique contents.
- Compile matrix cells (client/server × production/development) are independent.
- Primary compile corpus is unique file contents (fixtures/N).
- Content-hash caches skip work on duplicate bodies — unique fixtures required for ranking.
- Tool order is **rotated** on every warmup and measured run, so no tool is pinned to the expensive first slot.
- CI does not drop OS page cache; later tools in a job may share a warmer file cache.
- Typecheck, format, lint, projection, compile, metadata, LSP, bundle, and incremental-transform rows fail closed on surface-specific work gates.
- Compile requires parseable Svelte runtime output per input, external CSS for styled sources, unique fixture markers, option sensitivity, and no uncompiled runes or wrong-framework carriers.
- Official svelte/compiler is 1T only.
- Verter's Svelte support is experimental — unsupported surfaces fail closed.
- LSP: every server resolves from its installed npm package and is skipped when absent.
- Diagnostic/format identity across tools is not required for throughput rows.

### SFC compile (unique contents)

Files: **200** · Bytes: **134,760**

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per comparable workload class: engine, invocation and threading remain row properties; target or explicitly different work may split classes. Every active variant must visit every execution position; shorter diagnostic runs are unranked. A class with fewer than two valid rows is informational: no fastest ratio or ranked throughput is shown. Rows tagged **(JS)** run the JavaScript TypeScript compiler. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three samples is bracketed as TOO NOISY TO RANK, baseline included.

Tools:

- **svelte/compiler 5.56.8** — Primary official Svelte compiler reference used by the rsvelte packages in this harness.
- **svelte/compiler 5.56.4** — Pinned official reference for @mrwaip/svelte-rs, which documents parity against Svelte 5.56.4.
- **@mrwaip/svelte-rs (NAPI)** — MrWaip/svelte-rs native compiler through its svelte/compiler-compatible API.
- **@rsvelte/compiler (wasm)** — rsvelte WASM compiler bindings.
- **@rsvelte/native (NAPI)** — rsvelte native NAPI compiler (@rsvelte/vite-plugin-svelte-native).

Compile results are **grouped by target × environment**, then by comparison class.

#### CLIENT · production

Target: `client` · Environment: `production`

##### EXPERIMENTAL-SVELTE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter native ⏭ | 200 | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Verter native ⏭**: No public Svelte runtime compile API; the experimental carrier exposes an IDE projection only. No proxy workload is timed.

</details>

##### SVELTE-5.56.4 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @mrwaip/svelte-rs (NAPI) | 200 | **28.7 ms** | 28.4 ms | 0.7 ms | 2.4% | 1.00x | 316,580 | 7.0k files/s |
| svelte/compiler 5.56.4 | 200 | **222.2 ms** | 203.0 ms | 26.7 ms | 12.0% ⚠ | 7.74x | 318,760 | 900 files/s |

<details><summary>Notes</summary>

- **@mrwaip/svelte-rs (NAPI)**: @mrwaip/svelte-rs compile(), generate=client, dev=false, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output
- **svelte/compiler 5.56.4**: Pinned official reference for @mrwaip/svelte-rs; generate=client, dev=false, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output

</details>

##### SVELTE-5.56.8 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @rsvelte/native (NAPI) | 200 | **74.5 ms** | 74.0 ms | 0.8 ms | 1.0% | 1.00x | 318,760 | 2.7k files/s |
| @rsvelte/compiler (wasm) | 200 | **125.4 ms** | 122.3 ms | 3.3 ms | 2.6% | 1.68x | 318,760 | 1.6k files/s |
| svelte/compiler 5.56.8 | 200 | **217.9 ms** | 210.5 ms | 27.4 ms | 12.6% ⚠ | 2.93x | 318,760 | 918 files/s |

<details><summary>Notes</summary>

- **@rsvelte/native (NAPI)**: rsvelte NAPI compile(), generate=client, dev=false, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output
- **@rsvelte/compiler (wasm)**: rsvelte WASM compile(), generate=client, dev=false, css=external. ⚠ WASM path — not the NAPI native binding. | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output
- **svelte/compiler 5.56.8**: Official svelte/compiler compile(), generate=client, dev=false, css=external, runes=true, single-threaded | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output

</details>

<details><summary>Raw runs</summary>

- **@mrwaip/svelte-rs (NAPI)**: 28.7 ms, 30.1 ms, 28.8 ms, 28.4 ms, 28.5 ms
- **svelte/compiler 5.56.4**: 253.5 ms, 268.3 ms, 220.1 ms, 203.0 ms, 222.2 ms
- **@rsvelte/native (NAPI)**: 75.0 ms, 75.8 ms, 74.5 ms, 74.0 ms, 74.0 ms
- **@rsvelte/compiler (wasm)**: 129.7 ms, 128.6 ms, 125.4 ms, 123.0 ms, 122.3 ms
- **svelte/compiler 5.56.8**: 266.1 ms, 259.0 ms, 217.9 ms, 210.5 ms, 210.9 ms

</details>

#### CLIENT · development

Target: `client` · Environment: `development`

##### EXPERIMENTAL-SVELTE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter native ⏭ | 200 | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Verter native ⏭**: No public Svelte runtime compile API; the experimental carrier exposes an IDE projection only. No proxy workload is timed.

</details>

##### SVELTE-5.56.4 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @mrwaip/svelte-rs (NAPI) | 200 | **29.6 ms** | 29.5 ms | 0.4 ms | 1.5% | 1.00x | 417,020 | 6.8k files/s |
| svelte/compiler 5.56.4 | 200 | **215.7 ms** | 195.3 ms | 16.0 ms | 7.4% | 7.29x | 424,780 | 927 files/s |

<details><summary>Notes</summary>

- **@mrwaip/svelte-rs (NAPI)**: @mrwaip/svelte-rs compile(), generate=client, dev=true, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output
- **svelte/compiler 5.56.4**: Pinned official reference for @mrwaip/svelte-rs; generate=client, dev=true, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output

</details>

##### SVELTE-5.56.8 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @rsvelte/native (NAPI) | 200 | **80.5 ms** | 80.2 ms | 1.0 ms | 1.3% | 1.00x | 425,480 | 2.5k files/s |
| @rsvelte/compiler (wasm) | 200 | **131.4 ms** | 130.3 ms | 1.7 ms | 1.3% | 1.63x | 425,480 | 1.5k files/s |
| svelte/compiler 5.56.8 | 200 | **217.0 ms** | 209.9 ms | 9.7 ms | 4.5% | 2.70x | 424,780 | 922 files/s |

<details><summary>Notes</summary>

- **@rsvelte/native (NAPI)**: rsvelte NAPI compile(), generate=client, dev=true, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output
- **@rsvelte/compiler (wasm)**: rsvelte WASM compile(), generate=client, dev=true, css=external. ⚠ WASM path — not the NAPI native binding. | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output
- **svelte/compiler 5.56.8**: Official svelte/compiler compile(), generate=client, dev=true, css=external, runes=true, single-threaded | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output

</details>

<details><summary>Raw runs</summary>

- **@mrwaip/svelte-rs (NAPI)**: 30.5 ms, 29.5 ms, 29.6 ms, 29.5 ms, 29.6 ms
- **svelte/compiler 5.56.4**: 215.7 ms, 221.3 ms, 237.2 ms, 204.9 ms, 195.3 ms
- **@rsvelte/native (NAPI)**: 82.7 ms, 80.5 ms, 80.2 ms, 80.7 ms, 80.3 ms
- **@rsvelte/compiler (wasm)**: 132.6 ms, 134.8 ms, 131.3 ms, 130.3 ms, 131.4 ms
- **svelte/compiler 5.56.8**: 217.0 ms, 209.9 ms, 226.1 ms, 232.6 ms, 211.5 ms

</details>

#### SERVER · production

Target: `server` · Environment: `production`

##### EXPERIMENTAL-SVELTE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter native ⏭ | 200 | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Verter native ⏭**: No public Svelte runtime compile API; the experimental carrier exposes an IDE projection only. No proxy workload is timed.

</details>

##### SVELTE-5.56.4 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @mrwaip/svelte-rs (NAPI) | 200 | **21.8 ms** | 21.8 ms | 0.7 ms | 3.2% | 1.00x | 181,040 | 9.2k files/s |
| svelte/compiler 5.56.4 | 200 | **166.4 ms** | 158.3 ms | 6.9 ms | 4.1% | 7.62x | 180,900 | 1.2k files/s |

<details><summary>Notes</summary>

- **@mrwaip/svelte-rs (NAPI)**: @mrwaip/svelte-rs compile(), generate=server, dev=false, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output
- **svelte/compiler 5.56.4**: Pinned official reference for @mrwaip/svelte-rs; generate=server, dev=false, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output

</details>

##### SVELTE-5.56.8 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @rsvelte/native (NAPI) | 200 | **51.6 ms** | 51.2 ms | 0.6 ms | 1.2% | 1.00x | 180,900 | 3.9k files/s |
| @rsvelte/compiler (wasm) | 200 | **86.1 ms** | 85.3 ms | 1.2 ms | 1.3% | 1.67x | 180,900 | 2.3k files/s |
| svelte/compiler 5.56.8 | 200 | **167.6 ms** | 163.9 ms | 5.3 ms | 3.2% | 3.25x | 180,900 | 1.2k files/s |

<details><summary>Notes</summary>

- **@rsvelte/native (NAPI)**: rsvelte NAPI compile(), generate=server, dev=false, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output
- **@rsvelte/compiler (wasm)**: rsvelte WASM compile(), generate=server, dev=false, css=external. ⚠ WASM path — not the NAPI native binding. | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output
- **svelte/compiler 5.56.8**: Official svelte/compiler compile(), generate=server, dev=false, css=external, runes=true, single-threaded | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output

</details>

<details><summary>Raw runs</summary>

- **@mrwaip/svelte-rs (NAPI)**: 23.4 ms, 21.8 ms, 21.8 ms, 22.0 ms, 21.8 ms
- **svelte/compiler 5.56.4**: 172.6 ms, 166.4 ms, 158.3 ms, 173.5 ms, 160.6 ms
- **@rsvelte/native (NAPI)**: 51.7 ms, 51.5 ms, 51.6 ms, 52.8 ms, 51.2 ms
- **@rsvelte/compiler (wasm)**: 88.3 ms, 86.0 ms, 86.9 ms, 85.3 ms, 86.1 ms
- **svelte/compiler 5.56.8**: 177.0 ms, 173.2 ms, 166.5 ms, 167.6 ms, 163.9 ms

</details>

#### SERVER · development

Target: `server` · Environment: `development`

##### EXPERIMENTAL-SVELTE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter native ⏭ | 200 | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Verter native ⏭**: No public Svelte runtime compile API; the experimental carrier exposes an IDE projection only. No proxy workload is timed.

</details>

##### SVELTE-5.56.4 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @mrwaip/svelte-rs (NAPI) | 200 | **23.4 ms** | 23.1 ms | 0.2 ms | 1.0% | 1.00x | 379,980 | 8.5k files/s |
| svelte/compiler 5.56.4 | 200 | **178.9 ms** | 163.7 ms | 8.0 ms | 4.5% | 7.63x | 389,380 | 1.1k files/s |

<details><summary>Notes</summary>

- **@mrwaip/svelte-rs (NAPI)**: @mrwaip/svelte-rs compile(), generate=server, dev=true, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output
- **svelte/compiler 5.56.4**: Pinned official reference for @mrwaip/svelte-rs; generate=server, dev=true, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output

</details>

##### SVELTE-5.56.8 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @rsvelte/native (NAPI) | 200 | **57.6 ms** | 57.2 ms | 0.2 ms | 0.4% | 1.00x | 387,600 | 3.5k files/s |
| @rsvelte/compiler (wasm) | 200 | **95.4 ms** | 94.5 ms | 0.9 ms | 1.0% | 1.66x | 387,600 | 2.1k files/s |
| svelte/compiler 5.56.8 | 200 | **174.4 ms** | 164.6 ms | 5.2 ms | 3.0% | 3.03x | 389,380 | 1.1k files/s |

<details><summary>Notes</summary>

- **@rsvelte/native (NAPI)**: rsvelte NAPI compile(), generate=server, dev=true, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output
- **@rsvelte/compiler (wasm)**: rsvelte WASM compile(), generate=server, dev=true, css=external. ⚠ WASM path — not the NAPI native binding. | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output
- **svelte/compiler 5.56.8**: Official svelte/compiler compile(), generate=server, dev=true, css=external, runes=true, single-threaded | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output

</details>

<details><summary>Raw runs</summary>

- **@mrwaip/svelte-rs (NAPI)**: 23.4 ms, 23.5 ms, 23.5 ms, 23.1 ms, 23.1 ms
- **svelte/compiler 5.56.4**: 178.9 ms, 181.3 ms, 184.5 ms, 174.7 ms, 163.7 ms
- **@rsvelte/native (NAPI)**: 57.6 ms, 57.4 ms, 57.6 ms, 57.8 ms, 57.2 ms
- **@rsvelte/compiler (wasm)**: 95.4 ms, 97.0 ms, 95.6 ms, 95.4 ms, 94.5 ms
- **svelte/compiler 5.56.8**: 174.4 ms, 175.4 ms, 174.7 ms, 166.1 ms, 164.6 ms

</details>

<details><summary>Methodology</summary>

- Matrix: generate ∈ {client, server} × env ∈ {production, development}.
- Within each pinned compiler-version class, every tool receives the same in-memory Svelte SFC corpus. Real-world eligibility is decided independently by that class's official reference and per-row file counts remain visible.
- Official: svelte/compiler compile() with runes=true. Generated fixtures force runes; real-world sources use compiler auto-detection.
- MrWaip: @mrwaip/svelte-rs native compiler through its compatible compile() API.
- rsvelte: WASM (@rsvelte/compiler) and NAPI (@rsvelte/vite-plugin-svelte-native) paths are separate rows.
- Verter has no public Svelte runtime compile API in the installed package, so it is reported skipped; its different runtime-render batching API is not substituted.
- Every compiler must return one non-empty code artifact per input file, emit the expected Svelte client/server runtime import, and remove Svelte runes; aggregate byte totals alone are not accepted as proof of coverage.
- Carrier modules that omit the requested Svelte runtime import, or leave runes uncompiled, remain measured but unranked.
- Tool order is rotated on every warmup and measured run. A row is unranked unless the measured runs cover every active execution position; ranking metric is the median of warmed runs.

</details>

### Svelte TypeScript projection

Files: **200** · Bytes: **134,760**

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per comparable workload class: engine, invocation and threading remain row properties; target or explicitly different work may split classes. Every active variant must visit every execution position; shorter diagnostic runs are unranked. A class with fewer than two valid rows is informational: no fastest ratio or ranked throughput is shown. Rows tagged **(JS)** run the JavaScript TypeScript compiler. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three samples is bracketed as TOO NOISY TO RANK, baseline included.

Tools:

- **svelte2tsx** — Official Svelte-to-TSX projection from sveltejs/language-tools.
- **@rsvelte/svelte2tsx (Wasm)** — rsvelte Rust/Wasm drop-in Svelte-to-TSX projection.
- **Verter IDE projection** — VerterHost ensureIdeCompiled/getIde Svelte projection; separate schema from svelte2tsx.

##### SVELTE2TSX-COMPATIBLE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | TSX bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @rsvelte/svelte2tsx (Wasm) | 200 | **22.4 ms** | 21.7 ms | 0.9 ms | 4.0% | 1.00x | 253,540 | 8.9k files/s |
| svelte2tsx | 200 | **105.2 ms** | 100.0 ms | 5.8 ms | 5.5% | 4.70x | 253,740 | 1.9k files/s |

<details><summary>Notes</summary>

- **@rsvelte/svelte2tsx (Wasm)**: Rust/Wasm drop-in; TypeScript-printer structural parity against official output | gate: ✓ 200/200 valid TSX outputs
- **svelte2tsx**: Official svelte2tsx, Svelte 5 TS projection | gate: ✓ 200/200 valid TSX outputs

</details>

##### VERTER-IDE-PROJECTION — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Projection bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter IDE projection | 200 | **110.5 ms** | 107.9 ms | 1.5 ms | 1.4% | — | 2,403,380 | — |

<details><summary>Notes</summary>

- **Verter IDE projection**: Native ensureIdeCompiled/getIde Svelte path; separate class because this is Verter's IDE carrier, not a svelte2tsx-compatible schema | gate: ✓ 200/200 valid Svelte IDE projections

</details>

<details><summary>Methodology</summary>

- This is the type-analysis projection used by Svelte-aware TypeScript tooling; it is not runtime compilation or component documentation.
- The svelte2tsx-compatible rows use the synchronous in-process API with identical Svelte 5 options and file order.
- Every output must parse as TSX and contain tool-specific Svelte projection helpers.
- The rsvelte row must match official output after TypeScript parses and reprints both outputs, ignoring formatting-only whitespace while retaining syntax and comments.
- Verter's ensureIdeCompiled/getIde output is a genuine Svelte IDE projection, but its carrier and helper contract differ from svelte2tsx; it is therefore measured in a separate comparison class.

Raw runs:

- **@rsvelte/svelte2tsx (Wasm)**: 23.2 ms, 24.0 ms, 21.7 ms, 22.4 ms, 22.2 ms
- **svelte2tsx**: 112.2 ms, 113.8 ms, 103.8 ms, 105.2 ms, 100.0 ms
- **Verter IDE projection**: 109.4 ms, 111.2 ms, 111.7 ms, 110.5 ms, 107.9 ms

</details>

### Typecheck

Files: **200** · Bytes: **134,760**

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per comparable workload class: engine, invocation and threading remain row properties; target or explicitly different work may split classes. Every active variant must visit every execution position; shorter diagnostic runs are unranked. A class with fewer than two valid rows is informational: no fastest ratio or ranked throughput is shown. Rows tagged **(JS)** run the JavaScript TypeScript compiler. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three samples is bracketed as TOO NOISY TO RANK, baseline included.

Tools:

- **svelte-check (JS)** — Official svelte-check (Svelte language tools CLI) with the JavaScript TypeScript engine.
- **svelte-check-rs** — Rust drop-in replacement for svelte-check (pheuter/svelte-check-rs); uses tsgo when available.
- **rsvelte-check** — @rsvelte/svelte-check CLI — Rust walker + tsc/tsgo.
- **svelte-check-native** — harshmandan/svelte-check-native — Rust Svelte analysis with TypeScript 7 native.
- **verter-tsc** — verter-tsc from the published npm package; experimental Svelte path may be unranked.

##### DEFAULT-SOURCES — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Diagnostics | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte-check-rs | 200 | **1.16 s** | 1.15 s | 21.6 ms | 1.9% | — | 40 | — |

<details><summary>Notes</summary>

- **svelte-check-rs**: svelte-check-rs (Rust) · tsgo when available (7.0.2) | gate: script=✓ tmpl=✓ corpus=✓

</details>

##### EXPERIMENTAL-SVELTE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Diagnostics | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| verter-tsc ⚠ | 200 | (39.0 ms) | (37.8 ms) | – | – | not ranked | (0) | – |

<details><summary>Notes</summary>

- **verter-tsc ⚠**: verter-tsc experimental Svelte path; ranked only when it reports the shared .svelte plants. | gate: script=✗ tmpl=✗ corpus=✗ | ⚠ FAILED VALIDATION — planted issue or markup work not observed

</details>

##### TS+SVELTE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Diagnostics | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte-check-native | 200 | **177.1 ms** | 174.3 ms | 2.5 ms | 1.4% | 1.00x | 0 | 1.1k files/s |
| rsvelte-check | 200 | **297.7 ms** | 296.1 ms | 3.0 ms | 1.0% | 1.68x | 40 | 672 files/s |
| svelte-check (JS) | 200 | **2.49 s** | 2.48 s | 13.1 ms | 0.5% | 14.08x | 0 | 80 files/s |

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

- **svelte-check-rs**: 1.16 s, 1.15 s, 1.20 s, 1.15 s, 1.16 s
- **verter-tsc**: 38.1 ms, 41.5 ms, 39.3 ms, 39.0 ms, 37.8 ms
- **svelte-check-native**: 177.1 ms, 180.7 ms, 177.8 ms, 175.0 ms, 174.3 ms
- **rsvelte-check**: 302.0 ms, 302.3 ms, 296.7 ms, 296.1 ms, 297.7 ms
- **svelte-check (JS)**: 2.52 s, 2.49 s, 2.50 s, 2.49 s, 2.48 s

</details>

### Format

Files: **200** · Bytes: **134,760**

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per comparable workload class: engine, invocation and threading remain row properties; target or explicitly different work may split classes. Every active variant must visit every execution position; shorter diagnostic runs are unranked. A class with fewer than two valid rows is informational: no fastest ratio or ranked throughput is shown. Rows tagged **(JS)** run the JavaScript TypeScript compiler. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three samples is bracketed as TOO NOISY TO RANK, baseline included.

Tools:

- **Prettier** — prettier --write with prettier-plugin-svelte over a fresh corpus copy.
- **rsvelte-fmt** — @rsvelte/fmt — Rust formatter for .svelte.
- **Oxfmt** — Oxc formatter; skipped because the pinned release excludes .svelte files.

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| rsvelte-fmt | 200 | **157.5 ms** | 155.1 ms | 4.2 ms | 2.6% | 1.00x | n/a | 1.3k files/s |
| Prettier | 200 | **2.03 s** | 1.99 s | 32.9 ms | 1.6% | 12.87x | n/a | 99 files/s |
| Oxfmt ⏭ | 200 | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **rsvelte-fmt**: rsvelte-fmt . (Rust); may route embedded JS/TS/CSS through other formatters | ⓘ file coverage verified: rewrote 200/200 Svelte files.
- **Prettier**: prettier --write **/*.svelte with prettier-plugin-svelte · single-threaded | ⓘ file coverage verified: rewrote 200/200 Svelte files.
- **Oxfmt ⏭**: Pinned Oxfmt release excludes .svelte files; no CLI-startup proxy is timed.

</details>

<details><summary>Methodology</summary>

- Every timed invocation receives a fresh copy of the same Svelte corpus.
- All rows are CLI invocations; any non-zero exit is an operational failure and cannot rank, even if some files changed first.
- A nested markup-rewrite plant fails tools that no-op, format only <script>, or use a non-recursive file pattern.
- An untimed coverage census dirties every Svelte file; a tool that rewrites fewer than the full corpus is measured but unranked.
- Output style is not normalized — this measures whole-SFC format throughput, not byte identity.
- Tool order is rotated; ranking metric is the median of warmed runs.

Raw runs:

- **rsvelte-fmt**: 157.5 ms, 160.0 ms, 156.7 ms, 155.1 ms, 165.7 ms
- **Prettier**: 2.00 s, 2.06 s, 2.07 s, 1.99 s, 2.03 s

</details>

### Lint

Files: **200** · Bytes: **134,760**

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per comparable workload class: engine, invocation and threading remain row properties; target or explicitly different work may split classes. Every active variant must visit every execution position; shorter diagnostic runs are unranked. A class with fewer than two valid rows is informational: no fastest ratio or ranked throughput is shown. Rows tagged **(JS)** run the JavaScript TypeScript compiler. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three samples is bracketed as TOO NOISY TO RANK, baseline included.

Tools:

- **eslint-plugin-svelte (1T API)** — ESLint API + eslint-plugin-svelte recommended rules, single-threaded.
- **eslint-plugin-svelte (worker pool)** — ESLint API + eslint-plugin-svelte recommended rules, split across worker threads.
- **eslint-plugin-svelte (CLI)** — ESLint CLI + eslint-plugin-svelte recommended rules.
- **rsvelte-lint** — @rsvelte/lint — Rust Svelte linter.
- **Verter host lint** — VerterHost lint/diagnostics API with fileKind=svelte; experimental and gated on the {@html} diagnostic.

##### ESLINT-RECOMMENDED-RULES — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| eslint-plugin-svelte (1T API) | 200 | **254.9 ms** | 246.9 ms | 32.3 ms | 12.7% ⚠ | 1.00x | n/a | 785 files/s |
| eslint-plugin-svelte (CLI) | 200 | **891.8 ms** | 879.3 ms | 15.8 ms | 1.8% | 3.50x | n/a | 224 files/s |
| eslint-plugin-svelte (worker pool) | 200 | **1.35 s** | 1.33 s | 18.8 ms | 1.4% | 5.29x | n/a | 148 files/s |

<details><summary>Notes</summary>

- **eslint-plugin-svelte (1T API)**: ESLint flat config + eslint-plugin-svelte recommended; explicit file list | ⓘ file coverage by construction: the invocation receives all 200 corpus files as an explicit list.
- **eslint-plugin-svelte (CLI)**: eslint . over the same isolated corpus; pays startup and config load | ⓘ file coverage verified: named 200/200 planted Svelte files.
- **eslint-plugin-svelte (worker pool)**: ESLint worker_threads fan-out; explicit file list | ⓘ file coverage by construction: the invocation receives all 200 corpus files as an explicit list.

</details>

##### RSVELTE-NATIVE-RULES — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| rsvelte-lint | 200 | **127.7 ms** | 125.7 ms | 15.9 ms | 12.4% ⚠ | — | n/a | — |

<details><summary>Notes</summary>

- **rsvelte-lint**: rsvelte-lint . (Rust linter) | ⓘ file coverage verified: named 200/200 planted Svelte files.

</details>

##### VERTER-NATIVE-DIAGNOSTICS — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter host lint ⚠ | 200 | (38.7 ms) | (38.6 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Verter host lint ⚠**: VerterHost.upsert(fileKind=svelte) + lint/getDiagnostics for each explicit file | ⚠ FAILED VALIDATION — planted issue or markup work not observed | ⓘ file coverage by construction: the invocation receives all 200 corpus files as an explicit list.

</details>

<details><summary>Methodology</summary>

- Every tool receives the same isolated Svelte corpus.
- A planted {@html} issue must be reported; missing the template rule leaves the time visible but unranked.
- An untimed file-coverage census requires each directory-walk CLI to name every planted corpus file; explicit-list APIs are exact by construction.
- ESLint is measured in single-threaded API, worker-pool API, and CLI modes so invocation and thread-count costs remain visible.
- Rule sets are not identical, so ESLint recommended rules, rsvelte native rules, and Verter diagnostics are separate workload classes. The shared planted gate establishes minimum work but never cross-engine equivalence.
- Tool order is rotated; ranking metric is the median of warmed runs.

Raw runs:

- **eslint-plugin-svelte (1T API)**: 299.9 ms, 316.7 ms, 254.9 ms, 246.9 ms, 249.9 ms
- **eslint-plugin-svelte (CLI)**: 891.8 ms, 885.7 ms, 915.1 ms, 879.3 ms, 911.5 ms
- **eslint-plugin-svelte (worker pool)**: 1.35 s, 1.35 s, 1.33 s, 1.38 s, 1.33 s
- **rsvelte-lint**: 126.4 ms, 125.7 ms, 133.3 ms, 163.2 ms, 127.7 ms
- **Verter host lint**: 38.6 ms, 38.6 ms, 38.9 ms, 38.7 ms, 39.8 ms

</details>

### Component metadata

Files: **200** · Bytes: **134,760**

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per comparable workload class: engine, invocation and threading remain row properties; target or explicitly different work may split classes. Every active variant must visit every execution position; shorter diagnostic runs are unranked. A class with fewer than two valid rows is informational: no fastest ratio or ranked throughput is shown. Rows tagged **(JS)** run the JavaScript TypeScript compiler. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three samples is bracketed as TOO NOISY TO RANK, baseline included.

Tools:

- **sveld** — sveld component API extraction; row label states AST-only or resolveTypes mode.
- **svelte-docinfo** — TypeScript-semantic Svelte component/module metadata extraction.
- **Verter typeinfo** — @verter/typeinfo decoding @verter/native's dedicated Svelte framework-surface metadata.

##### SVELD-AST-PROJECT — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Metadata items | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| sveld | 200 | **116.5 ms** | 103.8 ms | 9.9 ms | 8.5% | — | 260 | — |

<details><summary>Notes</summary>

- **sveld**: default AST-only extraction; cache disabled | gate: ✓ 200/200 component records (200 unique) · 20/20 prop-bearing records (20 unique) · 60 props

</details>

##### SVELD-RESOLVE-TYPES-PROJECT — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Metadata items | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| sveld | 200 | **106.7 ms** | 100.4 ms | 4.5 ms | 4.2% | — | 260 | — |

<details><summary>Notes</summary>

- **sveld**: TypeScript semantic resolution enabled; cache disabled | gate: ✓ 200/200 component records (200 unique) · 20/20 prop-bearing records (20 unique) · 60 props

</details>

##### SVELTE-DOCINFO-FILES-NO-DEPENDENCIES — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Metadata items | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte-docinfo | 200 | **466.1 ms** | 428.9 ms | 24.1 ms | 5.2% | — | 260 | — |

<details><summary>Notes</summary>

- **svelte-docinfo**: TypeScript semantic analysis; dependency graph disabled because generated files have no imports | gate: ✓ 200/200 component records (200 unique) · 20/20 prop-bearing records (20 unique) · 60 props

</details>

##### VERTER-FRAMEWORK-SURFACE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Metadata items | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter typeinfo ⚠ | 200 | (173.4 ms) | (165.5 ms) | – | – | not ranked | (260) | – |

<details><summary>Notes</summary>

- **Verter typeinfo ⚠**: @verter/typeinfo wire decoder over @verter/native's dedicated Svelte framework-surface executor | gate: ✓ 200/200 component records (200 unique) · 20/20 prop-bearing records (20 unique) · 60 props | ⚠ TOO NOISY TO RANK — CV 1579.3% exceeds the 50% ceiling across 5 samples. The time remains visible but is excluded from ranking.

</details>

<details><summary>Methodology</summary>

- Every metadata API is a separate workload class unless its discovery, dependency traversal, semantic products, and correctness gates are equivalent. Current metadata timings are informational, without cross-tool ratios.
- sveld(resolveTypes) analyzes the generated barrel/project; svelte-docinfo globs Svelte files with dependency traversal disabled. Both are semantic, but their work products are not asserted equivalent.
- Verter uses @verter/typeinfo's wire decoder over @verter/native's dedicated Svelte framework-surface executor. It is a separate API/workload class because sveld and svelte-docinfo perform project discovery and barrel analysis.
- Persistent caches are disabled and every measured pass re-analyzes the same staged files.
- Identity gate: component records and exact per-file prop-name sets must match the staged sources, with no missing, extra, or duplicated records.
- Staged entry: index.js; svelte-docinfo dependency traversal is disabled because this generated corpus has no component imports.

Raw runs:

- **sveld**: 128.0 ms, 116.5 ms, 105.8 ms, 103.8 ms, 118.9 ms
- **sveld**: 111.3 ms, 107.9 ms, 101.5 ms, 106.7 ms, 100.4 ms
- **svelte-docinfo**: 490.9 ms, 444.2 ms, 428.9 ms, 470.3 ms, 466.1 ms
- **Verter typeinfo**: 173.4 ms, 173.4 ms, 5.17 s, 5.17 s, 165.5 ms

</details>

### LSP (editor language server)

Files: **1** · Bytes: **227**

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per comparable workload class: engine, invocation and threading remain row properties; target or explicitly different work may split classes. Every active variant must visit every execution position; shorter diagnostic runs are unranked. A class with fewer than two valid rows is informational: no fastest ratio or ranked throughput is shown. Rows tagged **(JS)** run the JavaScript TypeScript compiler. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three samples is bracketed as TOO NOISY TO RANK, baseline included.

Tools:

- **svelte-language-server (JS)** — Official Svelte language server (stdio) from svelte-language-server.
- **Verter** — verter-lsp — native server from the published npm package; experimental Svelte carrier.

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Hover bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter | 1 | **217.2 ms** | 212.6 ms | 12.0 ms | 5.5% | 1.00x | 43 | 5 files/s |
| svelte-language-server (JS) | 1 | **600.8 ms** | 598.6 ms | 4.6 ms | 0.8% | 2.77x | 43 | 2 files/s |

<details><summary>Notes</summary>

- **Verter**: verter-lsp — native server (experimental Svelte carrier when enabled) | init=32ms · open→hover=217ms · hoverWarm=1ms
- **svelte-language-server (JS)**: Official Svelte language server (stdio) | init=383ms · open→hover=607ms · hoverWarm=1ms

</details>

<details><summary>Methodology</summary>

- Identical workspace, LspTarget.svelte, UTF-16 hover position on benchMarker.
- Hover content gated on script position and template {benchMarker}.
- Fresh language-server process per measured run.
- Primary ranking column: didOpen→hover latency (median of warmed runs).
- VS Code extension host overhead is NOT measured — only stdio LSP.

Raw runs:

- **Verter**: 216.7 ms, 220.4 ms, 212.6 ms, 217.2 ms, 242.9 ms
- **svelte-language-server (JS)**: 606.8 ms, 598.6 ms, 608.3 ms, 598.7 ms, 600.8 ms

</details>

### LSP formatting

Files: **1** · Bytes: **166**

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per comparable workload class: engine, invocation and threading remain row properties; target or explicitly different work may split classes. Every active variant must visit every execution position; shorter diagnostic runs are unranked. A class with fewer than two valid rows is informational: no fastest ratio or ranked throughput is shown. Rows tagged **(JS)** run the JavaScript TypeScript compiler. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three samples is bracketed as TOO NOISY TO RANK, baseline included.

Tools:

- **svelte-language-server** — Official Svelte language server (stdio) from svelte-language-server.
- **rsvelte-language-server** — @rsvelte/language-server — formatting and native Svelte lint diagnostics; no TypeScript hover/completion.
- **Verter** — verter-lsp — native server from the published npm package; experimental Svelte carrier.

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Formatted bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| rsvelte-language-server | 1 | **38.9 ms** | 38.0 ms | 0.8 ms | 2.0% | 1.00x | 176 | 26 files/s |
| svelte-language-server | 1 | **209.4 ms** | 207.4 ms | 3.5 ms | 1.7% | 5.39x | 176 | 5 files/s |
| Verter ⚠ | 1 | (2.4 ms) | (2.4 ms) | – | – | not ranked | (166) | – |

<details><summary>Notes</summary>

- **rsvelte-language-server**: Fresh stdio server; didOpen→formatting | gate: ✓ changed=true script=true markup=true
- **svelte-language-server**: Fresh stdio server; didOpen→formatting | gate: ✓ changed=true script=true markup=true
- **Verter ⚠**: Fresh stdio server; didOpen→formatting | gate: ✗ changed=false script=false markup=false

</details>

<details><summary>Methodology</summary>

- This surface exists separately from hover: rsvelte-language-server implements formatting and lint diagnostics, not TypeScript hover.
- Every pass starts a fresh stdio server, opens the same valid Svelte 5 component, and times textDocument/formatting.
- The output must rewrite both script and nested markup; a server that returns no edits or formats only one region is unranked.
- Server initialization is completed before the primary interval and is therefore not included in didOpen→formatting.

Raw runs:

- **rsvelte-language-server**: 38.1 ms, 38.0 ms, 39.9 ms, 38.9 ms, 39.0 ms
- **svelte-language-server**: 207.4 ms, 214.3 ms, 209.2 ms, 215.3 ms, 209.4 ms
- **Verter**: 2.4 ms, 2.4 ms, 2.4 ms, 2.6 ms, 2.4 ms

</details>

### Vite production bundle (generated Svelte graph)

Files: **200** · Bytes: **134,760**

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per comparable workload class: engine, invocation and threading remain row properties; target or explicitly different work may split classes. Every active variant must visit every execution position; shorter diagnostic runs are unranked. A class with fewer than two valid rows is informational: no fastest ratio or ranked throughput is shown. Rows tagged **(JS)** run the JavaScript TypeScript compiler. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three samples is bracketed as TOO NOISY TO RANK, baseline included.

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | bundle bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 7 × @rsvelte/vite-plugin-svelte | 200 | **360.7 ms** | 355.7 ms | 25.6 ms | 7.1% | 1.00x | 314,096 | 554 files/s |
| Vite 7 × @sveltejs/vite-plugin-svelte | 200 | **571.2 ms** | 538.4 ms | 31.4 ms | 5.5% | 1.58x | 314,096 | 350 files/s |

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

- **Vite 7 × @rsvelte/vite-plugin-svelte**: 381.7 ms, 417.1 ms, 355.7 ms, 360.2 ms, 360.7 ms
- **Vite 7 × @sveltejs/vite-plugin-svelte**: 571.2 ms, 619.4 ms, 550.9 ms, 538.4 ms, 582.8 ms

</details>

### Warm incremental Svelte transform (Vite HMR compile path)

Files: **1** · Bytes: **99**

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per comparable workload class: engine, invocation and threading remain row properties; target or explicitly different work may split classes. Every active variant must visit every execution position; shorter diagnostic runs are unranked. A class with fewer than two valid rows is informational: no fastest ratio or ranked throughput is shown. Rows tagged **(JS)** run the JavaScript TypeScript compiler. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three samples is bracketed as TOO NOISY TO RANK, baseline included.

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | module bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vite 7 × @rsvelte/vite-plugin-svelte | 1 | **2.1 ms** | 1.4 ms | 0.6 ms | 29.0% ⚠ | 1.00x | 516 | 469 files/s |
| Vite 7 × @sveltejs/vite-plugin-svelte | 1 | **3.0 ms** | 1.9 ms | 1.5 ms | 50.0% ⚠ | 1.41x | 517 | 332 files/s |

<details><summary>Notes</summary>

- **Vite 7 × @rsvelte/vite-plugin-svelte**: fresh dev server, initial module transform discarded, changed marker required in updated module
- **Vite 7 × @sveltejs/vite-plugin-svelte**: fresh dev server, initial module transform discarded, changed marker required in updated module

</details>

<details><summary>Methodology</summary>

- Both rows edit the same first file from a 200-file generated corpus and require the unique edit marker in Vite's updated module.
- Each pass creates a fresh dev server, performs and discards the initial module transform, then times invalidation plus the changed module transform.
- Server creation, initial transform, file write, restoration, and shutdown are outside the measured interval.
- This measures the warm server-side Svelte transform path only. It excludes filesystem watcher debounce, WebSocket delivery, browser fetch/execution, and DOM patching, so it is not labeled an end-to-end HMR round trip.
- Both integrations use the same Vite version and identical hot/compiler options.

Raw runs:

- **Vite 7 × @rsvelte/vite-plugin-svelte**: 1.4 ms, 3.1 ms, 2.5 ms, 2.1 ms, 2.1 ms
- **Vite 7 × @sveltejs/vite-plugin-svelte**: 1.9 ms, 3.0 ms, 5.0 ms, 2.2 ms, 5.1 ms

</details>
