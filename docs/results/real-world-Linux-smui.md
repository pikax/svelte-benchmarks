# Ubuntu/Linux · real-world

## Benchmark Results

- **Generated:** 2026-08-01T16:46:14.932Z
- **Fixture:** `pinned real-world Svelte source checkouts` (126 SFCs)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · AMD EPYC 7763 64-Core Processor
- **Node:** v22.23.1
- **CI run:** https://github.com/pikax/svelte-benchmarks/actions/runs/30708668467

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

- Every corpus is a pinned third-party checkout. The report records repo, ref, immutable commit SHA, file count, corpus kind, and license.
- Rank tools only within the same corpus and surface; never compare throughput across projects or merge rows from different runners.
- Real-world runs are source-only: the harness executes no third-party install, build, test, or lifecycle scripts.
- Sources are copied without byte changes into a flat, deterministic staging directory. This prevents destructive formatters from touching checkouts; source-only tools do not resolve imports.
- Compile and projection first ask the applicable official reference APIs to accept each raw, unpreprocessed input. Compile eligibility is independent per pinned version class; projection has one official schema. Exclusions are counted and candidate-only failures remain visible.
- Compile, projection, format, and lint use the same correctness/coverage gates as generated fixtures. Generated fixtures remain the primary ranking corpus because their planted bugs make those gates controlled.
- Every configured corpus is complete; no file limit was applied.

### SFC compile (unique contents)

Files: **126** · Bytes: **530,360**

Corpus: smui:components @ v9.0.1 (8d204fe8, released/committed 2026-06-02) · 126 SFCs · library-source · Apache-2.0

Version-class scopes: svelte-5.56.8: **126/126** files (0 excluded) · svelte-5.56.4: **126/126** files (0 excluded). Each row's Files column identifies its applicable corpus; classes are never ranked together.

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
| Verter native ⏭ | 126 | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Verter native ⏭**: No public Svelte runtime compile API; the experimental carrier exposes an IDE projection only. No proxy workload is timed.

</details>

##### SVELTE-5.56.4 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @mrwaip/svelte-rs (NAPI) | 126 | **41.1 ms** | 40.6 ms | 1.2 ms | 2.9% | 1.00x | 561,480 | 3.1k files/s |
| svelte/compiler 5.56.4 | 126 | **728.7 ms** | 700.1 ms | 35.0 ms | 4.8% | 17.73x | 593,738 | 173 files/s |

<details><summary>Notes</summary>

- **@mrwaip/svelte-rs (NAPI)**: @mrwaip/svelte-rs compile(), generate=client, dev=false, css=external | runtime gate: ✓ 126/126 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output
- **svelte/compiler 5.56.4**: Pinned official reference for @mrwaip/svelte-rs; generate=client, dev=false, css=external | runtime gate: ✓ 126/126 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output

</details>

##### SVELTE-5.56.8 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @rsvelte/native (NAPI) | 126 | **173.8 ms** | 172.9 ms | 1.3 ms | 0.7% | 1.00x | 588,672 | 725 files/s |
| @rsvelte/compiler (wasm) | 126 | **282.8 ms** | 279.3 ms | 9.0 ms | 3.2% | 1.63x | 588,672 | 446 files/s |
| svelte/compiler 5.56.8 | 126 | **677.3 ms** | 631.5 ms | 32.5 ms | 4.8% | 3.90x | 602,156 | 186 files/s |

<details><summary>Notes</summary>

- **@rsvelte/native (NAPI)**: rsvelte NAPI compile(), generate=client, dev=false, css=external | runtime gate: ✓ 126/126 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output
- **@rsvelte/compiler (wasm)**: rsvelte WASM compile(), generate=client, dev=false, css=external. ⚠ WASM path — not the NAPI native binding. | runtime gate: ✓ 126/126 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output
- **svelte/compiler 5.56.8**: Official svelte/compiler compile(), generate=client, dev=false, css=external, runes=auto, single-threaded | runtime gate: ✓ 126/126 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output

</details>

<details><summary>Raw runs</summary>

- **@mrwaip/svelte-rs (NAPI)**: 43.6 ms, 41.4 ms, 40.6 ms, 41.1 ms, 40.7 ms
- **svelte/compiler 5.56.4**: 778.3 ms, 713.1 ms, 728.7 ms, 771.6 ms, 700.1 ms
- **@rsvelte/native (NAPI)**: 173.8 ms, 174.5 ms, 172.9 ms, 176.3 ms, 173.8 ms
- **@rsvelte/compiler (wasm)**: 300.5 ms, 294.2 ms, 282.8 ms, 282.7 ms, 279.3 ms
- **svelte/compiler 5.56.8**: 721.7 ms, 677.3 ms, 673.5 ms, 689.7 ms, 631.5 ms

</details>

#### SERVER · production

Target: `server` · Environment: `production`

##### EXPERIMENTAL-SVELTE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter native ⏭ | 126 | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Verter native ⏭**: No public Svelte runtime compile API; the experimental carrier exposes an IDE projection only. No proxy workload is timed.

</details>

##### SVELTE-5.56.4 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte/compiler 5.56.4 | 126 | **654.3 ms** | 628.2 ms | 36.8 ms | 5.6% | — | 426,320 | — |
| @mrwaip/svelte-rs (NAPI) ❌ | 126 | error | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **svelte/compiler 5.56.4**: Pinned official reference for @mrwaip/svelte-rs; generate=server, dev=false, css=external | runtime gate: ✓ 126/126 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output
- **@mrwaip/svelte-rs (NAPI) ❌**: @mrwaip/svelte-rs produced no code for 00089--Radio.svelte

</details>

##### SVELTE-5.56.8 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @rsvelte/native (NAPI) | 126 | **118.4 ms** | 117.7 ms | 0.6 ms | 0.5% | 1.00x | 372,454 | 1.1k files/s |
| @rsvelte/compiler (wasm) | 126 | **194.4 ms** | 191.0 ms | 1.8 ms | 0.9% | 1.64x | 372,454 | 648 files/s |
| svelte/compiler 5.56.8 | 126 | **577.0 ms** | 558.6 ms | 26.9 ms | 4.7% | 4.87x | 434,022 | 218 files/s |

<details><summary>Notes</summary>

- **@rsvelte/native (NAPI)**: rsvelte NAPI compile(), generate=server, dev=false, css=external | runtime gate: ✓ 126/126 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output
- **@rsvelte/compiler (wasm)**: rsvelte WASM compile(), generate=server, dev=false, css=external. ⚠ WASM path — not the NAPI native binding. | runtime gate: ✓ 126/126 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output
- **svelte/compiler 5.56.8**: Official svelte/compiler compile(), generate=server, dev=false, css=external, runes=auto, single-threaded | runtime gate: ✓ 126/126 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output

</details>

<details><summary>Raw runs</summary>

- **svelte/compiler 5.56.4**: 714.1 ms, 654.3 ms, 631.5 ms, 628.2 ms, 686.0 ms
- **@rsvelte/native (NAPI)**: 118.6 ms, 119.2 ms, 118.2 ms, 117.7 ms, 118.4 ms
- **@rsvelte/compiler (wasm)**: 193.1 ms, 194.4 ms, 191.0 ms, 195.4 ms, 195.0 ms
- **svelte/compiler 5.56.8**: 626.4 ms, 577.0 ms, 558.6 ms, 589.5 ms, 564.2 ms

</details>

<details><summary>Methodology</summary>

- Matrix: generate ∈ {client, server} × env ∈ {production, development}.
- Within each pinned compiler-version class, every tool receives the same in-memory Svelte SFC corpus. Real-world eligibility is decided independently by that class's official reference and per-row file counts remain visible.
- Official: svelte/compiler compile() with runes=auto. Generated fixtures force runes; real-world sources use compiler auto-detection.
- MrWaip: @mrwaip/svelte-rs native compiler through its compatible compile() API.
- rsvelte: WASM (@rsvelte/compiler) and NAPI (@rsvelte/vite-plugin-svelte-native) paths are separate rows.
- Verter has no public Svelte runtime compile API in the installed package, so it is reported skipped; its different runtime-render batching API is not substituted.
- Every compiler must return one non-empty code artifact per input file, emit the expected Svelte client/server runtime import, and remove Svelte runes; aggregate byte totals alone are not accepted as proof of coverage.
- Carrier modules that omit the requested Svelte runtime import, or leave runes uncompiled, remain measured but unranked.
- Tool order is rotated on every warmup and measured run. A row is unranked unless the measured runs cover every active execution position; ranking metric is the median of warmed runs.

</details>

### Svelte TypeScript projection

Files: **126** · Bytes: **530,360**

Corpus: smui:components @ v9.0.1 (8d204fe8, released/committed 2026-06-02) · 126 SFCs · library-source · Apache-2.0

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per comparable workload class: engine, invocation and threading remain row properties; target or explicitly different work may split classes. Every active variant must visit every execution position; shorter diagnostic runs are unranked. A class with fewer than two valid rows is informational: no fastest ratio or ranked throughput is shown. Rows tagged **(JS)** run the JavaScript TypeScript compiler. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three samples is bracketed as TOO NOISY TO RANK, baseline included.

Tools:

- **svelte2tsx** — Official Svelte-to-TSX projection from sveltejs/language-tools.
- **@rsvelte/svelte2tsx (Wasm)** — rsvelte Rust/Wasm drop-in Svelte-to-TSX projection.
- **Verter IDE projection** — VerterHost ensureIdeCompiled/getIde Svelte projection; separate schema from svelte2tsx.

##### SVELTE2TSX-COMPATIBLE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | TSX bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte2tsx | 126 | **283.5 ms** | 277.8 ms | 10.1 ms | 3.6% | — | 731,490 | — |
| @rsvelte/svelte2tsx (Wasm) ⚠ | 126 | (63.4 ms) | (59.2 ms) | – | – | not ranked | (729,593) | – |

<details><summary>Notes</summary>

- **svelte2tsx**: Official svelte2tsx, Svelte 5 TS projection | gate: ✓ 126/126 valid TSX outputs
- **@rsvelte/svelte2tsx (Wasm) ⚠**: Rust/Wasm drop-in; TypeScript-printer structural parity against official output | gate: ✗ 00029--CircularProgress.svelte differs structurally from official svelte2tsx output

</details>

##### VERTER-IDE-PROJECTION — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Projection bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter IDE projection ⚠ | 126 | (281.8 ms) | (275.5 ms) | – | – | not ranked | (2,237,900) | – |

<details><summary>Notes</summary>

- **Verter IDE projection ⚠**: Native ensureIdeCompiled/getIde Svelte path; separate class because this is Verter's IDE carrier, not a svelte2tsx-compatible schema | gate: ✗ invalid TSX: ')' expected.

</details>

<details><summary>Methodology</summary>

- This is the type-analysis projection used by Svelte-aware TypeScript tooling; it is not runtime compilation or component documentation.
- The svelte2tsx-compatible rows use the synchronous in-process API with identical Svelte 5 options and file order.
- Every output must parse as TSX and contain tool-specific Svelte projection helpers.
- The rsvelte row must match official output after TypeScript parses and reprints both outputs, ignoring formatting-only whitespace while retaining syntax and comments.
- Verter's ensureIdeCompiled/getIde output is a genuine Svelte IDE projection, but its carrier and helper contract differ from svelte2tsx; it is therefore measured in a separate comparison class.

Raw runs:

- **svelte2tsx**: 298.4 ms, 299.6 ms, 283.5 ms, 277.8 ms, 281.5 ms
- **@rsvelte/svelte2tsx (Wasm)**: 75.8 ms, 63.4 ms, 64.3 ms, 60.1 ms, 59.2 ms
- **Verter IDE projection**: 282.7 ms, 275.5 ms, 279.2 ms, 281.8 ms, 282.3 ms

</details>

### Format

Files: **126** · Bytes: **530,360**

Corpus: smui:components @ v9.0.1 (8d204fe8, released/committed 2026-06-02) · 126 SFCs · library-source · Apache-2.0

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per comparable workload class: engine, invocation and threading remain row properties; target or explicitly different work may split classes. Every active variant must visit every execution position; shorter diagnostic runs are unranked. A class with fewer than two valid rows is informational: no fastest ratio or ranked throughput is shown. Rows tagged **(JS)** run the JavaScript TypeScript compiler. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three samples is bracketed as TOO NOISY TO RANK, baseline included.

Tools:

- **Prettier** — prettier --write with prettier-plugin-svelte over a fresh corpus copy.
- **rsvelte-fmt** — @rsvelte/fmt — Rust formatter for .svelte.
- **Oxfmt** — Oxc formatter; skipped because the pinned release excludes .svelte files.

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| rsvelte-fmt | 126 | **187.8 ms** | 177.7 ms | 6.4 ms | 3.4% | 1.00x | n/a | 671 files/s |
| Prettier | 126 | **3.38 s** | 3.31 s | 36.5 ms | 1.1% | 18.00x | n/a | 37 files/s |
| Oxfmt ⏭ | 126 | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **rsvelte-fmt**: rsvelte-fmt . (Rust); may route embedded JS/TS/CSS through other formatters | ⓘ file coverage verified: rewrote 126/126 Svelte files.
- **Prettier**: prettier --write **/*.svelte with prettier-plugin-svelte · single-threaded | ⓘ file coverage verified: rewrote 126/126 Svelte files.
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

- **rsvelte-fmt**: 187.8 ms, 193.7 ms, 189.3 ms, 177.7 ms, 181.4 ms
- **Prettier**: 3.37 s, 3.41 s, 3.39 s, 3.31 s, 3.38 s

</details>

### Lint

Files: **126** · Bytes: **530,360**

Corpus: smui:components @ v9.0.1 (8d204fe8, released/committed 2026-06-02) · 126 SFCs · library-source · Apache-2.0

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
| eslint-plugin-svelte (1T API) | 126 | **2.17 s** | 2.02 s | 329.1 ms | 15.2% ⚠ | 1.00x | n/a | 58 files/s |
| eslint-plugin-svelte (CLI) | 126 | **4.04 s** | 3.91 s | 102.1 ms | 2.5% | 1.86x | n/a | 31 files/s |
| eslint-plugin-svelte (worker pool) | 126 | **4.99 s** | 4.87 s | 96.3 ms | 1.9% | 2.30x | n/a | 25 files/s |

<details><summary>Notes</summary>

- **eslint-plugin-svelte (1T API)**: ESLint flat config + eslint-plugin-svelte recommended; explicit file list | ⓘ file coverage by construction: the invocation receives all 126 corpus files as an explicit list.
- **eslint-plugin-svelte (CLI)**: eslint . over the same isolated corpus; pays startup and config load | ⓘ file coverage verified: named 126/126 planted Svelte files.
- **eslint-plugin-svelte (worker pool)**: ESLint worker_threads fan-out; explicit file list | ⓘ file coverage by construction: the invocation receives all 126 corpus files as an explicit list.

</details>

##### RSVELTE-NATIVE-RULES — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| rsvelte-lint | 126 | **363.6 ms** | 359.1 ms | 4.4 ms | 1.2% | — | n/a | — |

<details><summary>Notes</summary>

- **rsvelte-lint**: rsvelte-lint . (Rust linter) | ⓘ file coverage verified: named 126/126 planted Svelte files.

</details>

##### VERTER-NATIVE-DIAGNOSTICS — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter host lint ⚠ | 126 | (165.5 ms) | (163.1 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Verter host lint ⚠**: VerterHost.upsert(fileKind=svelte) + lint/getDiagnostics for each explicit file | ⚠ FAILED VALIDATION — planted issue or markup work not observed | ⓘ file coverage by construction: the invocation receives all 126 corpus files as an explicit list.

</details>

<details><summary>Methodology</summary>

- Every tool receives the same isolated Svelte corpus.
- A planted {@html} issue must be reported; missing the template rule leaves the time visible but unranked.
- An untimed file-coverage census requires each directory-walk CLI to name every planted corpus file; explicit-list APIs are exact by construction.
- ESLint is measured in single-threaded API, worker-pool API, and CLI modes so invocation and thread-count costs remain visible.
- Rule sets are not identical, so ESLint recommended rules, rsvelte native rules, and Verter diagnostics are separate workload classes. The shared planted gate establishes minimum work but never cross-engine equivalence.
- Tool order is rotated; ranking metric is the median of warmed runs.

Raw runs:

- **eslint-plugin-svelte (1T API)**: 2.20 s, 2.85 s, 2.14 s, 2.17 s, 2.02 s
- **eslint-plugin-svelte (CLI)**: 4.06 s, 4.20 s, 4.00 s, 4.04 s, 3.91 s
- **eslint-plugin-svelte (worker pool)**: 4.96 s, 5.10 s, 5.10 s, 4.99 s, 4.87 s
- **rsvelte-lint**: 363.4 ms, 359.1 ms, 363.6 ms, 370.1 ms, 368.6 ms
- **Verter host lint**: 165.7 ms, 166.0 ms, 163.1 ms, 163.9 ms, 165.5 ms

</details>
