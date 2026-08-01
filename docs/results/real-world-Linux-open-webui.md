# Ubuntu/Linux · real-world

## Benchmark Results

- **Generated:** 2026-08-01T16:54:40.234Z
- **Fixture:** `pinned real-world Svelte source checkouts` (650 SFCs)
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

Files: **649** · Bytes: **3,610,179**

Corpus: open-webui:app @ v0.11.0 (f9590b80, released/committed 2026-07-27) · 650 SFCs · app-source · Open WebUI License

Version-class scopes: svelte-5.56.8: **649/650** files (1 excluded) · svelte-5.56.4: **649/650** files (1 excluded). Each row's Files column identifies its applicable corpus; classes are never ranked together.

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
| Verter native ⏭ | 649 | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Verter native ⏭**: No public Svelte runtime compile API; the experimental carrier exposes an IDE projection only. No proxy workload is timed.

</details>

##### SVELTE-5.56.4 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte/compiler 5.56.4 | 649 | **6.13 s** | 5.96 s | 201.6 ms | 3.3% | — | 6,499,720 | — |
| @mrwaip/svelte-rs (NAPI) ❌ | 649 | error | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **svelte/compiler 5.56.4**: Pinned official reference for @mrwaip/svelte-rs; generate=client, dev=false, css=external | runtime gate: ✓ 649/649 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output
- **@mrwaip/svelte-rs (NAPI) ❌**: `<button>` cannot be a descendant of `<button>`. The browser will 'repair' the HTML (by moving, removing, or inserting elements) which breaks Svelte's assumptions about the structure of your components. https://svelte.dev/e/node_invalid_placement

</details>

##### SVELTE-5.56.8 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte/compiler 5.56.8 | 649 | **5.53 s** | 5.47 s | 236.5 ms | 4.3% | — | 6,499,720 | — |
| @rsvelte/compiler (wasm) ❌ | 649 | error | – | – | – | – | – | – |
| @rsvelte/native (NAPI) ❌ | 649 | error | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **svelte/compiler 5.56.8**: Official svelte/compiler compile(), generate=client, dev=false, css=external, runes=auto, single-threaded | runtime gate: ✓ 649/649 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output
- **@rsvelte/compiler (wasm) ❌**: Analysis(ValidationWithCode { code: "constant_assignment", message: "Cannot assign to constant" })
- **@rsvelte/native (NAPI) ❌**: Analysis(ValidationWithCode { code: "constant_assignment", message: "Cannot assign to constant" })

</details>

<details><summary>Raw runs</summary>

- **svelte/compiler 5.56.4**: 6.10 s, 6.39 s, 6.44 s, 6.13 s, 5.96 s
- **svelte/compiler 5.56.8**: 6.04 s, 5.48 s, 5.53 s, 5.47 s, 5.61 s

</details>

#### SERVER · production

Target: `server` · Environment: `production`

##### EXPERIMENTAL-SVELTE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter native ⏭ | 649 | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Verter native ⏭**: No public Svelte runtime compile API; the experimental carrier exposes an IDE projection only. No proxy workload is timed.

</details>

##### SVELTE-5.56.4 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte/compiler 5.56.4 | 649 | **5.45 s** | 5.38 s | 78.4 ms | 1.4% | — | 4,586,332 | — |
| @mrwaip/svelte-rs (NAPI) ❌ | 649 | error | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **svelte/compiler 5.56.4**: Pinned official reference for @mrwaip/svelte-rs; generate=server, dev=false, css=external | runtime gate: ✓ 649/649 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output
- **@mrwaip/svelte-rs (NAPI) ❌**: `<button>` cannot be a descendant of `<button>`. The browser will 'repair' the HTML (by moving, removing, or inserting elements) which breaks Svelte's assumptions about the structure of your components. https://svelte.dev/e/node_invalid_placement

</details>

##### SVELTE-5.56.8 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte/compiler 5.56.8 | 649 | **4.98 s** | 4.86 s | 129.2 ms | 2.6% | — | 4,586,332 | — |
| @rsvelte/compiler (wasm) ❌ | 649 | error | – | – | – | – | – | – |
| @rsvelte/native (NAPI) ❌ | 649 | error | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **svelte/compiler 5.56.8**: Official svelte/compiler compile(), generate=server, dev=false, css=external, runes=auto, single-threaded | runtime gate: ✓ 649/649 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output
- **@rsvelte/compiler (wasm) ❌**: Analysis(ValidationWithCode { code: "constant_assignment", message: "Cannot assign to constant" })
- **@rsvelte/native (NAPI) ❌**: Analysis(ValidationWithCode { code: "constant_assignment", message: "Cannot assign to constant" })

</details>

<details><summary>Raw runs</summary>

- **svelte/compiler 5.56.4**: 5.57 s, 5.38 s, 5.42 s, 5.53 s, 5.45 s
- **svelte/compiler 5.56.8**: 4.89 s, 5.19 s, 4.86 s, 5.02 s, 4.98 s

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

Files: **650** · Bytes: **3,612,860**

Corpus: open-webui:app @ v0.11.0 (f9590b80, released/committed 2026-07-27) · 650 SFCs · app-source · Open WebUI License

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per comparable workload class: engine, invocation and threading remain row properties; target or explicitly different work may split classes. Every active variant must visit every execution position; shorter diagnostic runs are unranked. A class with fewer than two valid rows is informational: no fastest ratio or ranked throughput is shown. Rows tagged **(JS)** run the JavaScript TypeScript compiler. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three samples is bracketed as TOO NOISY TO RANK, baseline included.

Tools:

- **svelte2tsx** — Official Svelte-to-TSX projection from sveltejs/language-tools.
- **@rsvelte/svelte2tsx (Wasm)** — rsvelte Rust/Wasm drop-in Svelte-to-TSX projection.
- **Verter IDE projection** — VerterHost ensureIdeCompiled/getIde Svelte projection; separate schema from svelte2tsx.

##### SVELTE2TSX-COMPATIBLE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | TSX bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte2tsx | 650 | **2.75 s** | 2.71 s | 24.0 ms | 0.9% | — | 4,963,608 | — |
| @rsvelte/svelte2tsx (Wasm) ⚠ | 650 | (382.9 ms) | (379.3 ms) | – | – | not ranked | (4,962,057) | – |

<details><summary>Notes</summary>

- **svelte2tsx**: Official svelte2tsx, Svelte 5 TS projection | gate: ✓ 650/650 valid TSX outputs
- **@rsvelte/svelte2tsx (Wasm) ⚠**: Rust/Wasm drop-in; TypeScript-printer structural parity against official output | gate: ✗ 00005--ChangelogModal.svelte differs structurally from official svelte2tsx output

</details>

##### VERTER-IDE-PROJECTION — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Projection bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter IDE projection ⚠ | 650 | (1.16 s) | (1.15 s) | – | – | not ranked | (12,804,683) | – |

<details><summary>Notes</summary>

- **Verter IDE projection ⚠**: Native ensureIdeCompiled/getIde Svelte path; separate class because this is Verter's IDE carrier, not a svelte2tsx-compatible schema | gate: ✗ invalid TSX: Unexpected token. Did you mean `{'>'}` or `&gt;`?

</details>

<details><summary>Methodology</summary>

- This is the type-analysis projection used by Svelte-aware TypeScript tooling; it is not runtime compilation or component documentation.
- The svelte2tsx-compatible rows use the synchronous in-process API with identical Svelte 5 options and file order.
- Every output must parse as TSX and contain tool-specific Svelte projection helpers.
- The rsvelte row must match official output after TypeScript parses and reprints both outputs, ignoring formatting-only whitespace while retaining syntax and comments.
- Verter's ensureIdeCompiled/getIde output is a genuine Svelte IDE projection, but its carrier and helper contract differ from svelte2tsx; it is therefore measured in a separate comparison class.

Raw runs:

- **svelte2tsx**: 2.76 s, 2.77 s, 2.75 s, 2.71 s, 2.72 s
- **@rsvelte/svelte2tsx (Wasm)**: 382.9 ms, 383.8 ms, 387.2 ms, 379.3 ms, 379.5 ms
- **Verter IDE projection**: 1.16 s, 1.15 s, 1.15 s, 1.19 s, 1.16 s

</details>

### Format

Files: **650** · Bytes: **3,612,860**

Corpus: open-webui:app @ v0.11.0 (f9590b80, released/committed 2026-07-27) · 650 SFCs · app-source · Open WebUI License

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per comparable workload class: engine, invocation and threading remain row properties; target or explicitly different work may split classes. Every active variant must visit every execution position; shorter diagnostic runs are unranked. A class with fewer than two valid rows is informational: no fastest ratio or ranked throughput is shown. Rows tagged **(JS)** run the JavaScript TypeScript compiler. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three samples is bracketed as TOO NOISY TO RANK, baseline included.

Tools:

- **Prettier** — prettier --write with prettier-plugin-svelte over a fresh corpus copy.
- **rsvelte-fmt** — @rsvelte/fmt — Rust formatter for .svelte.
- **Oxfmt** — Oxc formatter; skipped because the pinned release excludes .svelte files.

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Prettier | 650 | **17.61 s** | 17.35 s | 188.1 ms | 1.1% | — | n/a | — |
| rsvelte-fmt ❌ | 650 | error | – | – | – | – | – | – |
| Oxfmt ⏭ | 650 | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Prettier**: prettier --write **/*.svelte with prettier-plugin-svelte · single-threaded | ⓘ file coverage verified: rewrote 650/650 Svelte files.
- **rsvelte-fmt ❌**: /home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.bin/rsvelte-fmt . exited with 2 Finished in 58ms on 0 files using 4 threads.  No files found matching the given patterns. rsvelte-fmt: /home/runner/work/svelte-benchmarks/svelte-benchmarks/work-real/open-webui/format/work/format/rsvelte-fmt-12/00106--Embeds.svelte: rsvelte_formatter error: script parse failed: Diagnostics([OxcDiagnostic { inner: OxcDiagnosticInner { message: "A required parameter cannot follow an optional parameter.", labels: One([LabeledSpan { label: None, span: SourceSpan { offset: SourceOffset(304), length: 16 }, primary: false }]), help: None, note: None, severity: Error, code: OxcCode { scope: Some("TS"), number: Some("1016") }, url: None } }]) rsvelte-fmt: formatted 648 / 651 files
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

- **Prettier**: 17.71 s, 17.35 s, 17.83 s, 17.61 s, 17.49 s

</details>

### Lint

Files: **650** · Bytes: **3,612,860**

Corpus: open-webui:app @ v0.11.0 (f9590b80, released/committed 2026-07-27) · 650 SFCs · app-source · Open WebUI License

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
| eslint-plugin-svelte (worker pool) | 650 | **20.50 s** | 20.36 s | 223.0 ms | 1.1% | 1.00x | n/a | 32 files/s |
| eslint-plugin-svelte (1T API) | 650 | **20.67 s** | 20.23 s | 1.39 s | 6.7% | 1.01x | n/a | 31 files/s |
| eslint-plugin-svelte (CLI) | 650 | **21.37 s** | 21.16 s | 128.5 ms | 0.6% | 1.04x | n/a | 30 files/s |

<details><summary>Notes</summary>

- **eslint-plugin-svelte (worker pool)**: ESLint worker_threads fan-out; explicit file list | ⓘ file coverage by construction: the invocation receives all 650 corpus files as an explicit list.
- **eslint-plugin-svelte (1T API)**: ESLint flat config + eslint-plugin-svelte recommended; explicit file list | ⓘ file coverage by construction: the invocation receives all 650 corpus files as an explicit list.
- **eslint-plugin-svelte (CLI)**: eslint . over the same isolated corpus; pays startup and config load | ⓘ file coverage verified: named 650/650 planted Svelte files.

</details>

##### RSVELTE-NATIVE-RULES — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| rsvelte-lint | 650 | **2.69 s** | 2.63 s | 71.8 ms | 2.7% | — | n/a | — |

<details><summary>Notes</summary>

- **rsvelte-lint**: rsvelte-lint . (Rust linter) | ⓘ file coverage verified: named 650/650 planted Svelte files.

</details>

##### VERTER-NATIVE-DIAGNOSTICS — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter host lint ⚠ | 650 | (725.7 ms) | (714.3 ms) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Verter host lint ⚠**: VerterHost.upsert(fileKind=svelte) + lint/getDiagnostics for each explicit file | ⚠ FAILED VALIDATION — planted issue or markup work not observed | ⓘ file coverage by construction: the invocation receives all 650 corpus files as an explicit list.

</details>

<details><summary>Methodology</summary>

- Every tool receives the same isolated Svelte corpus.
- A planted {@html} issue must be reported; missing the template rule leaves the time visible but unranked.
- An untimed file-coverage census requires each directory-walk CLI to name every planted corpus file; explicit-list APIs are exact by construction.
- ESLint is measured in single-threaded API, worker-pool API, and CLI modes so invocation and thread-count costs remain visible.
- Rule sets are not identical, so ESLint recommended rules, rsvelte native rules, and Verter diagnostics are separate workload classes. The shared planted gate establishes minimum work but never cross-engine equivalence.
- Tool order is rotated; ranking metric is the median of warmed runs.

Raw runs:

- **eslint-plugin-svelte (worker pool)**: 20.88 s, 20.38 s, 20.70 s, 20.36 s, 20.50 s
- **eslint-plugin-svelte (1T API)**: 20.23 s, 20.24 s, 20.67 s, 23.57 s, 21.07 s
- **eslint-plugin-svelte (CLI)**: 21.48 s, 21.35 s, 21.37 s, 21.16 s, 21.46 s
- **rsvelte-lint**: 2.63 s, 2.75 s, 2.63 s, 2.79 s, 2.69 s
- **Verter host lint**: 733.4 ms, 725.7 ms, 728.7 ms, 725.5 ms, 714.3 ms

</details>
