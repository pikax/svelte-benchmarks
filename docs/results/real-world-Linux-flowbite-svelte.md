# Ubuntu/Linux · real-world

## Benchmark Results

- **Generated:** 2026-08-01T16:43:22.166Z
- **Fixture:** `pinned real-world Svelte source checkouts` (183 SFCs)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · AMD EPYC 9V74 80-Core Processor
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

Files: **183** · Bytes: **478,393**

Corpus: flowbite-svelte:components @ v1.33.1 (3fbf1a18, released/committed 2026-04-07) · 183 SFCs · library-source · MIT

Version-class scopes: svelte-5.56.8: **183/183** files (0 excluded) · svelte-5.56.4: **183/183** files (0 excluded). Each row's Files column identifies its applicable corpus; classes are never ranked together.

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
| Verter native ⏭ | 183 | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Verter native ⏭**: No public Svelte runtime compile API; the experimental carrier exposes an IDE projection only. No proxy workload is timed.

</details>

##### SVELTE-5.56.4 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @mrwaip/svelte-rs (NAPI) | 183 | **42.4 ms** | 41.8 ms | 0.6 ms | 1.3% | 1.00x | 713,921 | 4.3k files/s |
| svelte/compiler 5.56.4 | 183 | **549.8 ms** | 534.2 ms | 33.4 ms | 6.1% | 12.97x | 741,038 | 333 files/s |

<details><summary>Notes</summary>

- **@mrwaip/svelte-rs (NAPI)**: @mrwaip/svelte-rs compile(), generate=client, dev=false, css=external | runtime gate: ✓ 183/183 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output
- **svelte/compiler 5.56.4**: Pinned official reference for @mrwaip/svelte-rs; generate=client, dev=false, css=external | runtime gate: ✓ 183/183 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output

</details>

##### SVELTE-5.56.8 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @rsvelte/native (NAPI) | 183 | **153.1 ms** | 152.7 ms | 0.4 ms | 0.3% | 1.00x | 737,379 | 1.2k files/s |
| @rsvelte/compiler (wasm) | 183 | **247.3 ms** | 245.1 ms | 6.1 ms | 2.5% | 1.62x | 737,379 | 740 files/s |
| svelte/compiler 5.56.8 | 183 | **546.2 ms** | 503.7 ms | 34.0 ms | 6.2% | 3.57x | 741,038 | 335 files/s |

<details><summary>Notes</summary>

- **@rsvelte/native (NAPI)**: rsvelte NAPI compile(), generate=client, dev=false, css=external | runtime gate: ✓ 183/183 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output
- **@rsvelte/compiler (wasm)**: rsvelte WASM compile(), generate=client, dev=false, css=external. ⚠ WASM path — not the NAPI native binding. | runtime gate: ✓ 183/183 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output
- **svelte/compiler 5.56.8**: Official svelte/compiler compile(), generate=client, dev=false, css=external, runes=auto, single-threaded | runtime gate: ✓ 183/183 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output

</details>

<details><summary>Raw runs</summary>

- **@mrwaip/svelte-rs (NAPI)**: 42.4 ms, 41.9 ms, 43.3 ms, 42.4 ms, 41.8 ms
- **svelte/compiler 5.56.4**: 611.9 ms, 535.7 ms, 534.2 ms, 549.8 ms, 581.1 ms
- **@rsvelte/native (NAPI)**: 152.7 ms, 153.8 ms, 153.1 ms, 153.0 ms, 153.4 ms
- **@rsvelte/compiler (wasm)**: 259.8 ms, 248.4 ms, 245.1 ms, 247.3 ms, 245.1 ms
- **svelte/compiler 5.56.8**: 558.6 ms, 596.0 ms, 503.7 ms, 532.8 ms, 546.2 ms

</details>

#### SERVER · production

Target: `server` · Environment: `production`

##### EXPERIMENTAL-SVELTE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter native ⏭ | 183 | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Verter native ⏭**: No public Svelte runtime compile API; the experimental carrier exposes an IDE projection only. No proxy workload is timed.

</details>

##### SVELTE-5.56.4 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte/compiler 5.56.4 | 183 | **506.9 ms** | 486.3 ms | 24.3 ms | 4.8% | — | 498,371 | — |
| @mrwaip/svelte-rs (NAPI) ❌ | 183 | error | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **svelte/compiler 5.56.4**: Pinned official reference for @mrwaip/svelte-rs; generate=server, dev=false, css=external | runtime gate: ✓ 183/183 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output
- **@mrwaip/svelte-rs (NAPI) ❌**: @mrwaip/svelte-rs produced no code for 00054--Checkbox.svelte

</details>

##### SVELTE-5.56.8 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @rsvelte/native (NAPI) | 183 | **100.9 ms** | 100.3 ms | 0.4 ms | 0.4% | 1.00x | 480,393 | 1.8k files/s |
| @rsvelte/compiler (wasm) | 183 | **165.0 ms** | 163.6 ms | 1.3 ms | 0.8% | 1.64x | 480,393 | 1.1k files/s |
| svelte/compiler 5.56.8 | 183 | **467.0 ms** | 461.9 ms | 24.0 ms | 5.1% | 4.63x | 498,371 | 392 files/s |

<details><summary>Notes</summary>

- **@rsvelte/native (NAPI)**: rsvelte NAPI compile(), generate=server, dev=false, css=external | runtime gate: ✓ 183/183 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output
- **@rsvelte/compiler (wasm)**: rsvelte WASM compile(), generate=server, dev=false, css=external. ⚠ WASM path — not the NAPI native binding. | runtime gate: ✓ 183/183 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output
- **svelte/compiler 5.56.8**: Official svelte/compiler compile(), generate=server, dev=false, css=external, runes=auto, single-threaded | runtime gate: ✓ 183/183 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output

</details>

<details><summary>Raw runs</summary>

- **svelte/compiler 5.56.4**: 544.8 ms, 506.9 ms, 486.3 ms, 495.7 ms, 529.9 ms
- **@rsvelte/native (NAPI)**: 101.0 ms, 100.3 ms, 100.9 ms, 101.3 ms, 100.8 ms
- **@rsvelte/compiler (wasm)**: 167.3 ms, 165.2 ms, 165.0 ms, 164.9 ms, 163.6 ms
- **svelte/compiler 5.56.8**: 461.9 ms, 517.0 ms, 467.0 ms, 465.0 ms, 494.7 ms

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

Files: **183** · Bytes: **478,393**

Corpus: flowbite-svelte:components @ v1.33.1 (3fbf1a18, released/committed 2026-04-07) · 183 SFCs · library-source · MIT

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per comparable workload class: engine, invocation and threading remain row properties; target or explicitly different work may split classes. Every active variant must visit every execution position; shorter diagnostic runs are unranked. A class with fewer than two valid rows is informational: no fastest ratio or ranked throughput is shown. Rows tagged **(JS)** run the JavaScript TypeScript compiler. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three samples is bracketed as TOO NOISY TO RANK, baseline included.

Tools:

- **svelte2tsx** — Official Svelte-to-TSX projection from sveltejs/language-tools.
- **@rsvelte/svelte2tsx (Wasm)** — rsvelte Rust/Wasm drop-in Svelte-to-TSX projection.
- **Verter IDE projection** — VerterHost ensureIdeCompiled/getIde Svelte projection; separate schema from svelte2tsx.

##### SVELTE2TSX-COMPATIBLE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | TSX bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte2tsx | 183 | **227.5 ms** | 226.3 ms | 7.3 ms | 3.2% | — | 621,320 | — |
| @rsvelte/svelte2tsx (Wasm) ⚠ | 183 | (48.2 ms) | (46.4 ms) | – | – | not ranked | (621,123) | – |

<details><summary>Notes</summary>

- **svelte2tsx**: Official svelte2tsx, Svelte 5 TS projection | gate: ✓ 183/183 valid TSX outputs
- **@rsvelte/svelte2tsx (Wasm) ⚠**: Rust/Wasm drop-in; TypeScript-printer structural parity against official output | gate: ✗ 00023--ClipboardManager.svelte differs structurally from official svelte2tsx output

</details>

##### VERTER-IDE-PROJECTION — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Projection bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter IDE projection ⚠ | 183 | (213.7 ms) | (210.6 ms) | – | – | not ranked | (2,867,307) | – |

<details><summary>Notes</summary>

- **Verter IDE projection ⚠**: Native ensureIdeCompiled/getIde Svelte path; separate class because this is Verter's IDE carrier, not a svelte2tsx-compatible schema | gate: ✗ invalid TSX: '}' expected.

</details>

<details><summary>Methodology</summary>

- This is the type-analysis projection used by Svelte-aware TypeScript tooling; it is not runtime compilation or component documentation.
- The svelte2tsx-compatible rows use the synchronous in-process API with identical Svelte 5 options and file order.
- Every output must parse as TSX and contain tool-specific Svelte projection helpers.
- The rsvelte row must match official output after TypeScript parses and reprints both outputs, ignoring formatting-only whitespace while retaining syntax and comments.
- Verter's ensureIdeCompiled/getIde output is a genuine Svelte IDE projection, but its carrier and helper contract differ from svelte2tsx; it is therefore measured in a separate comparison class.

Raw runs:

- **svelte2tsx**: 243.8 ms, 231.8 ms, 227.5 ms, 226.3 ms, 227.2 ms
- **@rsvelte/svelte2tsx (Wasm)**: 57.4 ms, 50.9 ms, 48.2 ms, 46.4 ms, 47.5 ms
- **Verter IDE projection**: 212.7 ms, 210.6 ms, 217.8 ms, 214.8 ms, 213.7 ms

</details>

### Format

Files: **183** · Bytes: **478,393**

Corpus: flowbite-svelte:components @ v1.33.1 (3fbf1a18, released/committed 2026-04-07) · 183 SFCs · library-source · MIT

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per comparable workload class: engine, invocation and threading remain row properties; target or explicitly different work may split classes. Every active variant must visit every execution position; shorter diagnostic runs are unranked. A class with fewer than two valid rows is informational: no fastest ratio or ranked throughput is shown. Rows tagged **(JS)** run the JavaScript TypeScript compiler. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three samples is bracketed as TOO NOISY TO RANK, baseline included.

Tools:

- **Prettier** — prettier --write with prettier-plugin-svelte over a fresh corpus copy.
- **rsvelte-fmt** — @rsvelte/fmt — Rust formatter for .svelte.
- **Oxfmt** — Oxc formatter; skipped because the pinned release excludes .svelte files.

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| rsvelte-fmt | 183 | **160.5 ms** | 154.5 ms | 3.1 ms | 1.9% | 1.00x | n/a | 1.1k files/s |
| Prettier | 183 | **2.99 s** | 2.96 s | 15.2 ms | 0.5% | 18.63x | n/a | 61 files/s |
| Oxfmt ⏭ | 183 | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **rsvelte-fmt**: rsvelte-fmt . (Rust); may route embedded JS/TS/CSS through other formatters | ⓘ file coverage verified: rewrote 183/183 Svelte files.
- **Prettier**: prettier --write **/*.svelte with prettier-plugin-svelte · single-threaded | ⓘ file coverage verified: rewrote 183/183 Svelte files.
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

- **rsvelte-fmt**: 160.9 ms, 158.9 ms, 160.5 ms, 154.5 ms, 162.5 ms
- **Prettier**: 2.99 s, 2.96 s, 3.00 s, 3.00 s, 2.99 s

</details>

### Lint

Files: **183** · Bytes: **478,393**

Corpus: flowbite-svelte:components @ v1.33.1 (3fbf1a18, released/committed 2026-04-07) · 183 SFCs · library-source · MIT

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
| eslint-plugin-svelte (1T API) | 183 | **1.78 s** | 1.70 s | 303.2 ms | 17.1% ⚠ | 1.00x | n/a | 103 files/s |
| eslint-plugin-svelte (CLI) | 183 | **3.33 s** | 3.24 s | 50.2 ms | 1.5% | 1.88x | n/a | 55 files/s |
| eslint-plugin-svelte (worker pool) | 183 | **3.91 s** | 3.89 s | 21.6 ms | 0.6% | 2.20x | n/a | 47 files/s |

<details><summary>Notes</summary>

- **eslint-plugin-svelte (1T API)**: ESLint flat config + eslint-plugin-svelte recommended; explicit file list | ⓘ file coverage by construction: the invocation receives all 183 corpus files as an explicit list.
- **eslint-plugin-svelte (CLI)**: eslint . over the same isolated corpus; pays startup and config load | ⓘ file coverage verified: named 183/183 planted Svelte files.
- **eslint-plugin-svelte (worker pool)**: ESLint worker_threads fan-out; explicit file list | ⓘ file coverage by construction: the invocation receives all 183 corpus files as an explicit list.

</details>

##### RSVELTE-NATIVE-RULES — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| rsvelte-lint | 183 | **278.5 ms** | 273.3 ms | 4.6 ms | 1.6% | — | n/a | — |

<details><summary>Notes</summary>

- **rsvelte-lint**: rsvelte-lint . (Rust linter) | ⓘ file coverage verified: named 183/183 planted Svelte files.

</details>

##### VERTER-NATIVE-DIAGNOSTICS — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter host lint ⚠ | 183 | (157.8 ms) | (155.2 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Verter host lint ⚠**: VerterHost.upsert(fileKind=svelte) + lint/getDiagnostics for each explicit file | ⚠ FAILED VALIDATION — planted issue or markup work not observed | ⓘ file coverage by construction: the invocation receives all 183 corpus files as an explicit list.

</details>

<details><summary>Methodology</summary>

- Every tool receives the same isolated Svelte corpus.
- A planted {@html} issue must be reported; missing the template rule leaves the time visible but unranked.
- An untimed file-coverage census requires each directory-walk CLI to name every planted corpus file; explicit-list APIs are exact by construction.
- ESLint is measured in single-threaded API, worker-pool API, and CLI modes so invocation and thread-count costs remain visible.
- Rule sets are not identical, so ESLint recommended rules, rsvelte native rules, and Verter diagnostics are separate workload classes. The shared planted gate establishes minimum work but never cross-engine equivalence.
- Tool order is rotated; ranking metric is the median of warmed runs.

Raw runs:

- **eslint-plugin-svelte (1T API)**: 1.89 s, 2.43 s, 1.78 s, 1.70 s, 1.73 s
- **eslint-plugin-svelte (CLI)**: 3.34 s, 3.33 s, 3.24 s, 3.25 s, 3.35 s
- **eslint-plugin-svelte (worker pool)**: 3.90 s, 3.95 s, 3.91 s, 3.93 s, 3.89 s
- **rsvelte-lint**: 273.3 ms, 277.4 ms, 278.5 ms, 285.8 ms, 280.2 ms
- **Verter host lint**: 157.8 ms, 161.5 ms, 159.4 ms, 155.2 ms, 156.9 ms

</details>
