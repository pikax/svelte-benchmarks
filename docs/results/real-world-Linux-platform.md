# Ubuntu/Linux · real-world

## Benchmark Results

- **Generated:** 2026-08-01T16:58:34.706Z
- **Fixture:** `pinned real-world Svelte source checkouts` (2462 SFCs)
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

Files: **2,432** · Bytes: **7,859,391**

Corpus: platform:workspace @ v0.7.426 (ccefccd8, released/committed 2026-07-05) · 2462 SFCs · app-source · EPL-2.0

Version-class scopes: svelte-5.56.8: **2432/2462** files (30 excluded) · svelte-5.56.4: **2432/2462** files (30 excluded). Each row's Files column identifies its applicable corpus; classes are never ranked together.

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
| Verter native ⏭ | 2,432 | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Verter native ⏭**: No public Svelte runtime compile API; the experimental carrier exposes an IDE projection only. No proxy workload is timed.

</details>

##### SVELTE-5.56.4 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte/compiler 5.56.4 | 2,432 | **10.80 s** | 10.60 s | 143.7 ms | 1.3% | — | 11,264,024 | — |
| @mrwaip/svelte-rs (NAPI) ⚠ | 2,432 | (738.3 ms) | (733.5 ms) | – | – | not ranked | (10,812,911) | – |

<details><summary>Notes</summary>

- **svelte/compiler 5.56.4**: Pinned official reference for @mrwaip/svelte-rs; generate=client, dev=false, css=external | runtime gate: ✓ 2432/2432 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output
- **@mrwaip/svelte-rs (NAPI) ⚠**: @mrwaip/svelte-rs compile(), generate=client, dev=false, css=external | runtime gate: ✗ did not emit external CSS produced by the official reference for 00169--Spinner.svelte; dev option changes output

</details>

##### SVELTE-5.56.8 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte/compiler 5.56.8 | 2,432 | **10.19 s** | 10.08 s | 73.0 ms | 0.7% | — | 11,264,024 | — |
| @rsvelte/compiler (wasm) ❌ | 2,432 | error | – | – | – | – | – | – |
| @rsvelte/native (NAPI) ❌ | 2,432 | error | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **svelte/compiler 5.56.8**: Official svelte/compiler compile(), generate=client, dev=false, css=external, runes=auto, single-threaded | runtime gate: ✓ 2432/2432 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output
- **@rsvelte/compiler (wasm) ❌**: Analysis(ValidationWithCode { code: "global_reference_invalid", message: "`$comparedDocument` is an illegal variable name. To reference a global variable called `$comparedDocument`, use `globalThis.$comparedDocument`\nhttps://svelte.dev/e/global_reference_invalid" })
- **@rsvelte/native (NAPI) ❌**: Analysis(ValidationWithCode { code: "global_reference_invalid", message: "`$comparedDocument` is an illegal variable name. To reference a global variable called `$comparedDocument`, use `globalThis.$comparedDocument`\nhttps://svelte.dev/e/global_reference_invalid" })

</details>

<details><summary>Raw runs</summary>

- **svelte/compiler 5.56.4**: 11.00 s, 10.78 s, 10.60 s, 10.80 s, 10.86 s
- **@mrwaip/svelte-rs (NAPI)**: 744.4 ms, 736.5 ms, 733.5 ms, 739.3 ms, 738.3 ms
- **svelte/compiler 5.56.8**: 10.19 s, 10.22 s, 10.14 s, 10.08 s, 10.27 s

</details>

#### SERVER · production

Target: `server` · Environment: `production`

##### EXPERIMENTAL-SVELTE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter native ⏭ | 2,432 | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Verter native ⏭**: No public Svelte runtime compile API; the experimental carrier exposes an IDE projection only. No proxy workload is timed.

</details>

##### SVELTE-5.56.4 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte/compiler 5.56.4 | 2,432 | **10.25 s** | 9.64 s | 513.2 ms | 5.0% | — | 7,919,869 | — |
| @mrwaip/svelte-rs (NAPI) ⚠ | 2,432 | (582.6 ms) | (579.2 ms) | – | – | not ranked | (7,795,722) | – |

<details><summary>Notes</summary>

- **svelte/compiler 5.56.4**: Pinned official reference for @mrwaip/svelte-rs; generate=server, dev=false, css=external | runtime gate: ✓ 2432/2432 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output
- **@mrwaip/svelte-rs (NAPI) ⚠**: @mrwaip/svelte-rs compile(), generate=server, dev=false, css=external | runtime gate: ✗ did not emit external CSS produced by the official reference for 00169--Spinner.svelte; dev option changes output

</details>

##### SVELTE-5.56.8 — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte/compiler 5.56.8 | 2,432 | **9.00 s** | 8.88 s | 348.0 ms | 3.9% | — | 7,919,869 | — |
| @rsvelte/compiler (wasm) ❌ | 2,432 | error | – | – | – | – | – | – |
| @rsvelte/native (NAPI) ❌ | 2,432 | error | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **svelte/compiler 5.56.8**: Official svelte/compiler compile(), generate=server, dev=false, css=external, runes=auto, single-threaded | runtime gate: ✓ 2432/2432 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output
- **@rsvelte/compiler (wasm) ❌**: Analysis(ValidationWithCode { code: "global_reference_invalid", message: "`$comparedDocument` is an illegal variable name. To reference a global variable called `$comparedDocument`, use `globalThis.$comparedDocument`\nhttps://svelte.dev/e/global_reference_invalid" })
- **@rsvelte/native (NAPI) ❌**: Analysis(ValidationWithCode { code: "global_reference_invalid", message: "`$comparedDocument` is an illegal variable name. To reference a global variable called `$comparedDocument`, use `globalThis.$comparedDocument`\nhttps://svelte.dev/e/global_reference_invalid" })

</details>

<details><summary>Raw runs</summary>

- **svelte/compiler 5.56.4**: 10.25 s, 9.64 s, 10.96 s, 10.27 s, 9.81 s
- **@mrwaip/svelte-rs (NAPI)**: 582.6 ms, 579.2 ms, 585.1 ms, 582.8 ms, 580.2 ms
- **svelte/compiler 5.56.8**: 9.03 s, 9.73 s, 8.88 s, 8.96 s, 9.00 s

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

Files: **2,456** · Bytes: **8,151,670**

Corpus: platform:workspace @ v0.7.426 (ccefccd8, released/committed 2026-07-05) · 2462 SFCs · app-source · EPL-2.0

Surface scope: **2456/2462** files · 6 excluded before timing because an applicable official reference API rejected the raw, unpreprocessed source. The identical accepted set is used for every row.

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per comparable workload class: engine, invocation and threading remain row properties; target or explicitly different work may split classes. Every active variant must visit every execution position; shorter diagnostic runs are unranked. A class with fewer than two valid rows is informational: no fastest ratio or ranked throughput is shown. Rows tagged **(JS)** run the JavaScript TypeScript compiler. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three samples is bracketed as TOO NOISY TO RANK, baseline included.

Tools:

- **svelte2tsx** — Official Svelte-to-TSX projection from sveltejs/language-tools.
- **@rsvelte/svelte2tsx (Wasm)** — rsvelte Rust/Wasm drop-in Svelte-to-TSX projection.
- **Verter IDE projection** — VerterHost ensureIdeCompiled/getIde Svelte projection; separate schema from svelte2tsx.

##### SVELTE2TSX-COMPATIBLE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | TSX bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte2tsx | 2,456 | **4.38 s** | 4.33 s | 29.4 ms | 0.7% | — | 10,283,705 | — |
| @rsvelte/svelte2tsx (Wasm) ⚠ | 2,456 | (773.5 ms) | (766.4 ms) | – | – | not ranked | (10,266,662) | – |

<details><summary>Notes</summary>

- **svelte2tsx**: Official svelte2tsx, Svelte 5 TS projection | gate: ✓ 2456/2456 valid TSX outputs
- **@rsvelte/svelte2tsx (Wasm) ⚠**: Rust/Wasm drop-in; TypeScript-printer structural parity against official output | gate: ✗ 00001--Kanban.svelte differs structurally from official svelte2tsx output

</details>

##### VERTER-IDE-PROJECTION — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Projection bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter IDE projection ⚠ | 2,456 | (4.20 s) | (4.11 s) | – | – | not ranked | (41,631,813) | – |

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

- **svelte2tsx**: 4.39 s, 4.38 s, 4.34 s, 4.39 s, 4.33 s
- **@rsvelte/svelte2tsx (Wasm)**: 784.4 ms, 775.8 ms, 773.5 ms, 766.4 ms, 770.0 ms
- **Verter IDE projection**: 4.19 s, 4.11 s, 4.20 s, 4.22 s, 4.20 s

</details>

### Format

Files: **2,462** · Bytes: **8,184,534**

Corpus: platform:workspace @ v0.7.426 (ccefccd8, released/committed 2026-07-05) · 2462 SFCs · app-source · EPL-2.0

Ranked on the **median of measured runs** (each after ≥1 discarded warmup; no cold column — it would measure JIT warmup). One table per comparable workload class: engine, invocation and threading remain row properties; target or explicitly different work may split classes. Every active variant must visit every execution position; shorter diagnostic runs are unranked. A class with fewer than two valid rows is informational: no fastest ratio or ranked throughput is shown. Rows tagged **(JS)** run the JavaScript TypeScript compiler. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three samples is bracketed as TOO NOISY TO RANK, baseline included.

Tools:

- **Prettier** — prettier --write with prettier-plugin-svelte over a fresh corpus copy.
- **rsvelte-fmt** — @rsvelte/fmt — Rust formatter for .svelte.
- **Oxfmt** — Oxc formatter; skipped because the pinned release excludes .svelte files.

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| rsvelte-fmt | 2,462 | **506.6 ms** | 494.6 ms | 7.5 ms | 1.5% | 1.00x | n/a | 4.9k files/s |
| Prettier | 2,462 | **37.69 s** | 37.42 s | 152.1 ms | 0.4% | 74.39x | n/a | 65 files/s |
| Oxfmt ⏭ | 2,462 | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **rsvelte-fmt**: rsvelte-fmt . (Rust); may route embedded JS/TS/CSS through other formatters | ⓘ file coverage verified: rewrote 2462/2462 Svelte files.
- **Prettier**: prettier --write **/*.svelte with prettier-plugin-svelte · single-threaded | ⓘ file coverage verified: rewrote 2462/2462 Svelte files.
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

- **rsvelte-fmt**: 506.6 ms, 497.9 ms, 508.0 ms, 512.8 ms, 494.6 ms
- **Prettier**: 37.60 s, 37.42 s, 37.83 s, 37.69 s, 37.69 s

</details>

### Lint

Files: **2,462** · Bytes: **8,184,534**

Corpus: platform:workspace @ v0.7.426 (ccefccd8, released/committed 2026-07-05) · 2462 SFCs · app-source · EPL-2.0

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
| eslint-plugin-svelte (1T API) ❌ | 2,462 | error | – | – | – | – | – | – |
| eslint-plugin-svelte (worker pool) ❌ | 2,462 | error | – | – | – | – | – | – |
| eslint-plugin-svelte (CLI) ❌ | 2,462 | error | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **eslint-plugin-svelte (1T API) ❌**: source.isSpaceBetweenTokens is not a function Occurred while linting /home/runner/work/svelte-benchmarks/svelte-benchmarks/work-real/platform/lint/work/lint/n2462/00154--PopupInstance.svelte:39 Rule: "svelte/no-reactive-functions"
- **eslint-plugin-svelte (worker pool) ❌**: TypeError: source.isSpaceBetweenTokens is not a function Occurred while linting /home/runner/work/svelte-benchmarks/svelte-benchmarks/work-real/platform/lint/work/lint/n2462/00154--PopupInstance.svelte:39 Rule: "svelte/no-reactive-functions"     at Object.fix (file:///home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint-plugin-svelte@3.22.0_eslint@10.8.0_svelte@5.56.8_@typescript-eslint+types@8.65.0_/node_modules/eslint-plugin-svelte/lib/rules/no-reactive-functions.js:48:61)     at normalizeFixes (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.8.0/node_modules/eslint/lib/linter/file-report.js:296:25)     at /home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.8.0/node_modules/eslint/lib/linter/file-report.js:328:11     at Array.map (<anonymous>)     at mapSuggestions (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.8.0/node_modules/eslint/lib/linter/file-report.js:321:5)     at FileReport.addRuleMessage (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.8.0/node_modules/eslint/lib/linter/file-report.js:558:8)     at FileContext.report (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.8.0/node_modules/eslint/lib/linter/linter.js:583:28)     at SvelteReactiveStatement > ExpressionStatement > AssignmentExpression > :function (file:///home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint-plugin-svelte@3.22.0_eslint@10.8.0_svelte@5.56.8_@typescript-eslint+types@8.65.0_/node_modules/eslint-plugin-svelte/lib/rules/no-reactive-functions.js:36:32)     at ruleErrorHandler (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.8.0/node_modules/eslint/lib/linter/linter.js:645:33)     at /home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.8.0/node_modules/eslint/lib/linter/source-code-visitor.js:76:46
- **eslint-plugin-svelte (CLI) ❌**: /home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.bin/eslint . exited with 2 Oops! Something went wrong! :(  ESLint: 10.8.0  TypeError: source.isSpaceBetweenTokens is not a function Occurred while linting /home/runner/work/svelte-benchmarks/svelte-benchmarks/work-real/platform/lint/work/lint/n2462/00154--PopupInstance.svelte:39 Rule: "svelte/no-reactive-functions"     at Object.fix (file:///home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint-plugin-svelte@3.22.0_eslint@10.8.0_svelte@5.56.8_@typescript-eslint+types@8.65.0_/node_modules/eslint-plugin-svelte/lib/rules/no-reactive-functions.js:48:61)     at normalizeFixes (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.8.0/node_modules/eslint/lib/linter/file-report.js:296:25)     at /home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.8.0/node_modules/eslint/lib/linter/file-report.js:328:11     at Array.map (<anonymous>)     at mapSuggestions (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.8.0/node_modules/eslint/lib/linter/file-report.js:321:5)     at FileReport.addRuleMessage (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.8.0/node_modules/eslint/lib/linter/file-report.js:558:8)     at FileContext.report (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.8.0/node_modules/eslint/lib/linter/linter.js:583:28)     at SvelteReactiveStatement > ExpressionStatement > AssignmentExpression > :function (file:///home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint-plugin-svelte@3.22.0_eslint@10.8.0_svelte@5.56.8_@typescript-eslint+types@8.65.0_/node_modules/eslint-plugin-svelte/lib/rules/no-reactive-functions.js:36:32)     at ruleErrorHandler (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.8.0/node_modules/eslint/lib/linter/linter.js:645:33)     at /home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.8.0/node_modules/eslint/lib/linter/source-code-visitor.js:76:46

</details>

##### RSVELTE-NATIVE-RULES — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| rsvelte-lint | 2,462 | **11.98 s** | 5.37 s | 2.99 s | 25.0% ⚠ | — | n/a | — |

<details><summary>Notes</summary>

- **rsvelte-lint**: rsvelte-lint . (Rust linter) | ⓘ file coverage verified: named 2462/2462 planted Svelte files.

</details>

##### VERTER-NATIVE-DIAGNOSTICS — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter host lint ⚠ | 2,462 | (3.91 s) | (2.68 s) | – | – | not ranked | – | – |

<details><summary>Notes</summary>

- **Verter host lint ⚠**: VerterHost.upsert(fileKind=svelte) + lint/getDiagnostics for each explicit file | ⚠ FAILED VALIDATION — planted issue or markup work not observed | ⓘ file coverage by construction: the invocation receives all 2462 corpus files as an explicit list.

</details>

<details><summary>Methodology</summary>

- Every tool receives the same isolated Svelte corpus.
- A planted {@html} issue must be reported; missing the template rule leaves the time visible but unranked.
- An untimed file-coverage census requires each directory-walk CLI to name every planted corpus file; explicit-list APIs are exact by construction.
- ESLint is measured in single-threaded API, worker-pool API, and CLI modes so invocation and thread-count costs remain visible.
- Rule sets are not identical, so ESLint recommended rules, rsvelte native rules, and Verter diagnostics are separate workload classes. The shared planted gate establishes minimum work but never cross-engine equivalence.
- Tool order is rotated; ranking metric is the median of warmed runs.

Raw runs:

- **rsvelte-lint**: 12.16 s, 11.98 s, 5.37 s, 12.27 s, 11.81 s
- **Verter host lint**: 3.03 s, 3.91 s, 2.68 s, 7.94 s, 7.10 s

</details>
