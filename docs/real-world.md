# Real-world projects

> Generated from committed snapshots under `results/real_world/`. Ranked within a corpus, never across projects. Pinned revisions — see each project's provenance line.

<details><summary>Ranking rules and measurement definitions</summary>

Ranked on the **median of measured runs** — Warm is the primary ordering and ranking metric. Compiler rows additionally publish a separately sampled **Fresh child** column: the first timed row workload in a new child process, after excluded process startup, package imports and adapter setup. It is not called Cold (the OS page cache is not flushed) and its ratio never substitutes for the warm verdict. One table per comparable workload class: engine, invocation and threading remain row properties; target or explicitly different work may split classes — the latest official Svelte compiler is the sole compiler baseline, and a failed reference unranks the whole comparison rather than promoting a survivor. Every active variant must visit every execution position; shorter runs are unranked. A class with fewer than two valid rows is informational. Rows tagged **(JS)** run the JavaScript TypeScript compiler. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three samples is bracketed as TOO NOISY TO RANK, baseline included.

</details>

## carbon-components-svelte

- **Generated:** 2026-09-29T12:46:10.191Z
- **Fixture:** `pinned real-world Svelte source checkouts` (287 Svelte files)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · AMD EPYC 7763 64-Core Processor · 16 GB RAM · Node v22.23.2
- **Commit:** [1bc177a](https://github.com/pikax/svelte-benchmarks/commit/1bc177a)
- **CI run:** https://github.com/pikax/svelte-benchmarks/actions/runs/36569517081
- **Source:** `real-world-Linux-carbon-components-svelte.json`

Corpus: carbon-components-svelte:components

### SFC compile (unique contents)

Files: **287** · Bytes: **941,662**

Corpus: carbon-components-svelte:components @ v0.110.2 (dec0ea44, released/committed 2026-07-31) · 287 SFCs · library-source · Apache-2.0

Tools:

- **svelte/compiler 5.57.1** — Official svelte/compiler compile() API, single-threaded.
- **@mrwaip/svelte-rs (NAPI)** — MrWaip/svelte-rs native compiler through its svelte/compiler-compatible API.
- **@rsvelte/compiler (wasm)** — rsvelte WASM compiler bindings.
- **@rsvelte/native (NAPI)** — rsvelte native NAPI compiler (@rsvelte/vite-plugin-svelte-native).
- **Verter (stateless)** — VerterHost.compileMany without cross-run cache; experimental Svelte carrier.

Validation (runtime semantic plants):

Suite 2026-09-12.2 · hash 451381a17402 · 2 cell(s)

| Cell | Status | Entrypoint verdicts |
| --- | --- | --- |
| client/production/source-map-off | FAIL | svelte-official: PASS · mrwaip-svelte-rs: FAIL · rsvelte-wasm: FAIL · rsvelte-native: FAIL · verter-svelte: FAIL |
| server/production/source-map-off | FAIL | svelte-official: PASS · mrwaip-svelte-rs: FAIL · rsvelte-wasm: PASS · rsvelte-native: PASS · verter-svelte: FAIL |

Compile results are **grouped by target × environment**, then by comparison class.

#### CLIENT · production

Target: `client` · Environment: `production`

##### EXPERIMENTAL-SVELTE — separate workload

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-carbon-components-svelte-real-world-linux-carbon-comp-11zo403-dark.svg">
  <img src="charts/real-world-carbon-components-svelte-real-world-linux-carbon-comp-11zo403.svg" alt="Compiler — CLIENT · production · EXPERIMENTAL-SVELTE" width="760">
</picture>

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter (stateless) ⚠ | 287 | (190.3 ms) | not ranked | (191.7 ms) | (187.6 ms) | – | – | not ranked | (0) | n/a | – |

<details><summary>Notes</summary>

- **Verter (stateless) ⚠**: VerterHost.compileMany(target=runtime-render, mode=stateless, 1 CPU thread) on the same revised Svelte inputs. Diagnostic timing only: the published path is not validated as a Svelte runtime compiler; invalid/empty output and per-file errors are retained, never ranked. | output gate: FAIL — returned empty JavaScript; 287/287 entries, 287 compile errors, 287 entries missing the CSS revision token; first error: [00000--Accordion.svelte] host error: runtime surface refused for '00000--Accordion.svelte': svelte-runtime-unsupported-magic-identifier: Svelte client emission does not yet support the compiler-magic identifier `$$restProps` (the official  | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ RUNTIME SEMANTIC VALIDITY FAIL (4/33 plants) — state-derived-update (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-advanced-rune: Svelte client emission does not yet support the `$derived` rune form.; bindable-prop (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-advanced-rune: Svelte client emission does not yet support the `$props() non-interpolation usage` rune form.; callback-prop-events (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-non-delegated-event: Svelte client emission does not yet support the non-delegated / capture / global event `click`.

</details>

##### Svelte runtime

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-carbon-components-svelte-real-world-linux-carbon-comp-04u9s1o-dark.svg">
  <img src="charts/real-world-carbon-components-svelte-real-world-linux-carbon-comp-04u9s1o.svg" alt="Compiler — CLIENT · production · Svelte runtime" width="760">
</picture>

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte/compiler 5.57.1 | 287 | 1.13 s | — | **986.2 ms** | 849.2 ms | 69.4 ms | 7.0% | — | 1,751,195 | n/a | — |
| @mrwaip/svelte-rs (NAPI) ⚠ | 287 | (93.8 ms) | not ranked | (92.5 ms) | (91.6 ms) | – | – | not ranked | (1,502,774) | n/a | – |
| @rsvelte/native (NAPI) ⚠ | 287 | (381.3 ms) | not ranked | (386.1 ms) | (381.9 ms) | – | – | not ranked | (1,749,286) | n/a | – |
| @rsvelte/compiler (wasm) ⚠ | 287 | (1.05 s) | not ranked | (1.03 s) | (1.01 s) | – | – | not ranked | (1,749,286) | n/a | – |

<details><summary>Notes</summary>

- **svelte/compiler 5.57.1**: Official svelte/compiler compile(), generate=client, dev=false, css=external, runes=auto | runtime gate: ✓ 287/287 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through svelte/compiler compile() per plant, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **@mrwaip/svelte-rs (NAPI) ⚠**: @mrwaip/svelte-rs compile(), generate=client, dev=false, css=external | runtime gate: ✓ 287/287 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-styles: css.css-0: mapped to 2:24; expected 9:24; crlf-styles: css.css-0: mapped to 2:24; expected 9:24). The timing remains visible but cannot rank until the emitted maps are correct.
- **@rsvelte/native (NAPI) ⚠**: rsvelte NAPI compile(), generate=client, dev=false, css=external | runtime gate: ✓ 287/287 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-raw: js.template: generated token has no original mapping; lf-styles: js.template: generated token has no original mapping). The timing remains visible but cannot rank until the emitted maps are correct.
- **@rsvelte/compiler (wasm) ⚠**: rsvelte WASM compile(), generate=client, dev=false, css=external. ⚠ WASM path — not the NAPI native binding. | runtime gate: ✓ 287/287 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-raw: js.template: generated token has no original mapping; lf-styles: js.template: generated token has no original mapping). The timing remains visible but cannot rank until the emitted maps are correct.

</details>

<details><summary>Raw runs</summary>

- **Verter (stateless)**: 218.2 ms, 215.6 ms, 191.7 ms, 188.8 ms, 187.6 ms · fresh child: 194.5 ms, 190.9 ms, 186.6 ms, 190.3 ms, 186.3 ms
- **svelte/compiler 5.57.1**: 997.4 ms, 1.03 s, 986.2 ms, 849.2 ms, 947.6 ms · fresh child: 1.11 s, 1.15 s, 1.13 s, 1.16 s, 1.12 s
- **@mrwaip/svelte-rs (NAPI)**: 97.1 ms, 93.6 ms, 92.1 ms, 92.5 ms, 91.6 ms · fresh child: 95.5 ms, 95.5 ms, 93.8 ms, 93.4 ms, 93.1 ms
- **@rsvelte/native (NAPI)**: 413.0 ms, 386.1 ms, 383.2 ms, 386.8 ms, 381.9 ms · fresh child: 382.2 ms, 383.8 ms, 381.2 ms, 379.6 ms, 381.3 ms
- **@rsvelte/compiler (wasm)**: 1.04 s, 1.03 s, 1.01 s, 1.05 s, 1.01 s · fresh child: 1.04 s, 1.07 s, 1.06 s, 1.03 s, 1.05 s

</details>

#### SERVER · production

Target: `server` · Environment: `production`

##### EXPERIMENTAL-SVELTE — separate workload

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-carbon-components-svelte-real-world-linux-carbon-comp-1q4nvvz-dark.svg">
  <img src="charts/real-world-carbon-components-svelte-real-world-linux-carbon-comp-1q4nvvz.svg" alt="Compiler — SERVER · production · EXPERIMENTAL-SVELTE" width="760">
</picture>

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter (stateless) ⚠ | 287 | (82.7 ms) | not ranked | (86.9 ms) | (84.2 ms) | – | – | not ranked | (0) | n/a | – |

<details><summary>Notes</summary>

- **Verter (stateless) ⚠**: VerterHost.compileMany(target=runtime-render, mode=stateless, 1 CPU thread) on the same revised Svelte inputs. Diagnostic timing only: the published path is not validated as a Svelte runtime compiler; invalid/empty output and per-file errors are retained, never ranked. | output gate: FAIL — returned empty JavaScript; 287/287 entries, 287 compile errors, 287 entries missing the CSS revision token; first error: [00000--Accordion.svelte] host error: runtime surface refused for '00000--Accordion.svelte': svelte-runtime-unsupported-server-generate: Svelte client emission does not yet support server-side rendering (`generate: 'server'`). | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ RUNTIME SEMANTIC VALIDITY FAIL (0/33 plants) — props-defaults-interpolation (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-server-generate: Svelte client emission does not yet support server-side rendering (`generate: 'server'`).; state-derived-update (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-server-generate: Svelte client emission does not yet support server-side rendering (`generate: 'server'`).; bindable-prop (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-server-generate: Svelte client emission does not yet support server-side rendering (`generate: 'server'`).

</details>

##### Svelte runtime

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-carbon-components-svelte-real-world-linux-carbon-comp-0megbpc-dark.svg">
  <img src="charts/real-world-carbon-components-svelte-real-world-linux-carbon-comp-0megbpc.svg" alt="Compiler — SERVER · production · Svelte runtime" width="760">
</picture>

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @rsvelte/native (NAPI) | 287 | 249.0 ms | 1.00x | **251.2 ms** | 249.9 ms | 1.8 ms | 0.7% | 1.00x | 1,261,064 | n/a | 1.1k files/s |
| @rsvelte/compiler (wasm) | 287 | 732.5 ms | 2.94x | **700.4 ms** | 698.8 ms | 0.8 ms | 0.1% | 2.79x | 1,261,064 | n/a | 410 files/s |
| svelte/compiler 5.57.1 | 287 | 955.1 ms | 3.84x | **733.7 ms** | 680.0 ms | 31.0 ms | 4.2% | 2.92x | 1,262,780 | n/a | 391 files/s |
| @mrwaip/svelte-rs (NAPI) ⚠ | 287 | (78.5 ms) | not ranked | (74.9 ms) | (74.6 ms) | – | – | not ranked | (1,001,022) | n/a | – |

<details><summary>Notes</summary>

- **@rsvelte/native (NAPI)**: rsvelte NAPI compile(), generate=server, dev=false, css=external | runtime gate: ✓ 287/287 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through @rsvelte/vite-plugin-svelte-native compileSync() per plant, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **@rsvelte/compiler (wasm)**: rsvelte WASM compile(), generate=server, dev=false, css=external. ⚠ WASM path — not the NAPI native binding. | runtime gate: ✓ 287/287 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through @rsvelte/compiler compile() per plant after initSync, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **svelte/compiler 5.57.1**: Official svelte/compiler compile(), generate=server, dev=false, css=external, runes=auto | runtime gate: ✓ 287/287 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through svelte/compiler compile() per plant, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **@mrwaip/svelte-rs (NAPI) ⚠**: @mrwaip/svelte-rs compile(), generate=server, dev=false, css=external | runtime gate: ✓ 287/287 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-raw: js.missing or invalid version-3 source map; lf-styles: js.missing or invalid version-3 source map). The timing remains visible but cannot rank until the emitted maps are correct.

</details>

<details><summary>Raw runs</summary>

- **Verter (stateless)**: 89.1 ms, 84.2 ms, 86.4 ms, 86.9 ms, 87.8 ms · fresh child: 85.2 ms, 82.4 ms, 81.9 ms, 82.7 ms, 83.8 ms
- **@rsvelte/native (NAPI)**: 254.5 ms, 249.9 ms, 252.2 ms, 250.7 ms, 251.2 ms · fresh child: 248.8 ms, 249.5 ms, 249.1 ms, 248.6 ms, 249.0 ms
- **@rsvelte/compiler (wasm)**: 701.0 ms, 700.4 ms, 698.8 ms, 700.6 ms, 699.9 ms · fresh child: 732.5 ms, 723.3 ms, 737.6 ms, 731.3 ms, 738.6 ms
- **svelte/compiler 5.57.1**: 727.5 ms, 733.7 ms, 739.3 ms, 765.3 ms, 680.0 ms · fresh child: 935.7 ms, 982.3 ms, 998.8 ms, 945.1 ms, 955.1 ms
- **@mrwaip/svelte-rs (NAPI)**: 77.8 ms, 76.6 ms, 74.6 ms, 74.9 ms, 74.6 ms · fresh child: 78.5 ms, 79.1 ms, 78.5 ms, 79.1 ms, 78.3 ms

</details>

<details><summary>Methodology</summary>

- Matrix: generate ∈ {client, server} × env ∈ {production, development} × source-map ∈ {off, on} (off by default).
- Every compiler receives the same in-memory Svelte SFC corpus. The latest official Svelte compiler is the sole reference and decides real-world eligibility for every tool.
- Official: svelte/compiler compile() with runes=auto. Generated fixtures force runes; real-world sources use compiler auto-detection.
- MrWaip: @mrwaip/svelte-rs native compiler through its compatible compile() API, validated against the same latest Svelte runtime and official baseline as every other compiler.
- rsvelte: WASM (@rsvelte/compiler) and NAPI (@rsvelte/vite-plugin-svelte-native) paths are separate rows against the same official Svelte baseline.
- Verter's published compileMany runtime-render path receives the same revised Svelte inputs with stateless caching and one CPU thread. Completed passes publish warm/fresh timings even when their code is invalid or entries contain compile errors. They are permanently unranked diagnostic evidence until the adapter is validated; errors, output samples, revision-token failures and runtime-plant verdicts are retained. Only a missing API/package is skipped; a thrown batch failure is an error.
- Every warmed/fresh pass compiles a REVISED corpus: a fixed-width comment token plus a used CSS custom-property rule. The timed loop asserts the token reached the emitted CSS, so a cached whole-output result from a previous pass fails the gate. Adapter parity additionally requires every warm and fresh pass to have received a distinct input revision.
- Every compiler must return one non-empty code artifact per input file, emit the expected Svelte client/server runtime import, and remove Svelte runes; aggregate byte totals alone are not accepted as proof of coverage.
- Fresh child = the first timed row workload in a NEW child process, after excluded Node startup, package imports, adapter construction and input materialisation. It is NOT machine-cold (OS page cache is not flushed) and its ratio never substitutes for the warm verdict.
- Source maps: every compared Svelte 5 compiler ALWAYS emits js.map/css.map from compile() (no off/on flag exists — the 'sourcemap' option is a chained-map INPUT), so an off/on matrix would measure the harness, not the tools. Instead the maps' COORDINATE CORRECTNESS gates every row: anchored tokens in generated JS/CSS must trace back to their exact source positions (segment fallback allowed, exact line/column required, sourcesContent equal to the full component), across LF/CRLF and non-BMP-shifted columns. Wrong-file, shifted, stale or byte-counted maps unrank the row.
- Runtime semantic validity: a 28-plant Svelte 5 suite (props/state/derived/bindable/bindings/events/each-keyed/await/snippets/stores/actions/context/dynamic components/{@html}/SVG/module script/legacy syntax + CSS semantics) runs per entrypoint per cell in isolated child processes after timing; non-PASS rows unrank, and a failed official reference unranks every candidate in the comparison (no survivor promotion).
- Tool order is rotated on every warmup and measured run. A row is unranked unless the measured runs cover every active execution position; ranking metric is the median of warmed runs.

</details>

### Svelte TypeScript projection

Files: **287** · Bytes: **941,662**

Corpus: carbon-components-svelte:components @ v0.110.2 (dec0ea44, released/committed 2026-07-31) · 287 SFCs · library-source · Apache-2.0

Tools:

- **svelte2tsx** — Official Svelte-to-TSX projection from sveltejs/language-tools.
- **@rsvelte/svelte2tsx (Wasm)** — rsvelte Rust/Wasm drop-in Svelte-to-TSX projection.
- **Verter IDE projection** — VerterHost ensureIdeCompiled/getIde Svelte projection; separate schema from svelte2tsx.

##### SVELTE2TSX-COMPATIBLE — separate workload

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-carbon-components-svelte-real-world-linux-carbon-comp-0socado-dark.svg">
  <img src="charts/real-world-carbon-components-svelte-real-world-linux-carbon-comp-0socado.svg" alt="Svelte TypeScript projection — SVELTE2TSX-COMPATIBLE" width="760">
</picture>

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | TSX bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte2tsx | 287 | **487.7 ms** | 481.4 ms | 28.1 ms | 5.8% | — | 1,474,117 | n/a | — |
| @rsvelte/svelte2tsx (Wasm) ⚠ | 287 | (144.2 ms) | (139.9 ms) | – | – | not ranked | (1,474,125) | n/a | – |

<details><summary>Notes</summary>

- **svelte2tsx**: Official svelte2tsx, Svelte 5 TS projection | gate: ✓ 287/287 valid TSX outputs
- **@rsvelte/svelte2tsx (Wasm) ⚠**: Rust/Wasm drop-in; TypeScript-printer structural parity against official output | gate: ✗ 00039--DataTable.svelte differs structurally from official svelte2tsx output

</details>

##### VERTER-IDE-PROJECTION — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Projection bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter IDE projection ❌ | 287 | error | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Verter IDE projection ❌**: HostError::CompileError: [svelte-official-reject-void-element-invalid-content] Svelte client emission rejects a void element carrying content or a closing tag — the official `svelte@5.56.10` compiler also compile-errors it (`void_element_invalid_content`). (official `void_element_invalid_content`); [void_element_invalid_content] Svelte recovered from `void_element_invalid_content`

</details>

<details><summary>Methodology</summary>

- This is the type-analysis projection used by Svelte-aware TypeScript tooling; it is not runtime compilation or component documentation.
- The svelte2tsx-compatible rows use the synchronous in-process API with identical Svelte 5 options and file order.
- Every output must parse as TSX and contain tool-specific Svelte projection helpers.
- The rsvelte row must match official output after TypeScript parses and reprints both outputs, ignoring formatting-only whitespace while retaining syntax and comments.
- Verter's ensureIdeCompiled/getIde output is a genuine Svelte IDE projection, but its carrier and helper contract differ from svelte2tsx; it is therefore measured in a separate comparison class.

Raw runs:

- **svelte2tsx**: 548.8 ms, 481.4 ms, 501.4 ms, 483.2 ms, 487.7 ms
- **@rsvelte/svelte2tsx (Wasm)**: 148.8 ms, 144.2 ms, 139.9 ms, 142.1 ms, 144.8 ms

</details>

### Format

Files: **287** · Bytes: **941,662**

Corpus: carbon-components-svelte:components @ v0.110.2 (dec0ea44, released/committed 2026-07-31) · 287 SFCs · library-source · Apache-2.0

Tools:

- **Prettier** — prettier --write with prettier-plugin-svelte over a fresh corpus copy.
- **rsvelte-fmt** — @rsvelte/fmt — Rust formatter for .svelte.
- **Oxfmt** — Oxc formatter; skipped because the pinned release excludes .svelte files.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-carbon-components-svelte-real-world-linux-carbon-comp-1vbo9u1-dark.svg">
  <img src="charts/real-world-carbon-components-svelte-real-world-linux-carbon-comp-1vbo9u1.svg" alt="Format" width="760">
</picture>

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| rsvelte-fmt | 287 | **160.5 ms** | 158.7 ms | 1.5 ms | 0.9% | 1.00x | n/a | n/a | 1.8k files/s |
| Prettier | 287 | **5.32 s** | 5.25 s | 58.0 ms | 1.1% | 33.11x | n/a | n/a | 54 files/s |
| Oxfmt ⏭ | 287 | skipped | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **rsvelte-fmt**: rsvelte-fmt . (Rust); may route embedded JS/TS/CSS through other formatters | ⓘ file coverage verified: rewrote 287/287 Svelte files.
- **Prettier**: prettier --write **/*.svelte with prettier-plugin-svelte · single-threaded | ⓘ file coverage verified: rewrote 287/287 Svelte files.
- **Oxfmt ⏭**: Pinned Oxfmt release excludes .svelte files; no CLI-startup proxy is timed.

</details>

<details><summary>Methodology</summary>

- Every timed invocation receives a fresh copy of the same Svelte corpus.
- All rows are CLI invocations; any non-zero exit is an operational failure and cannot rank, even if some files changed first.
- A nested markup-rewrite plant fails tools that no-op, format only &lt;script>, or use a non-recursive file pattern.
- An untimed coverage census dirties every Svelte file; a tool that rewrites fewer than the full corpus is measured but unranked.
- Output style is not normalized — this measures whole-SFC format throughput, not byte identity.
- Tool order is rotated; ranking metric is the median of warmed runs.

Raw runs:

- **rsvelte-fmt**: 159.5 ms, 162.6 ms, 161.3 ms, 158.7 ms, 160.5 ms
- **Prettier**: 5.25 s, 5.35 s, 5.32 s, 5.31 s, 5.41 s

</details>

### Lint

Files: **287** · Bytes: **941,662**

Corpus: carbon-components-svelte:components @ v0.110.2 (dec0ea44, released/committed 2026-07-31) · 287 SFCs · library-source · Apache-2.0

Tools:

- **eslint-plugin-svelte (1T API)** — ESLint API + eslint-plugin-svelte recommended rules, single-threaded.
- **eslint-plugin-svelte (worker pool)** — ESLint API + eslint-plugin-svelte recommended rules, split across worker threads.
- **eslint-plugin-svelte (CLI)** — ESLint CLI + eslint-plugin-svelte recommended rules.
- **rsvelte-lint** — @rsvelte/lint — Rust Svelte linter.
- **Verter host lint** — VerterHost lint/diagnostics API with fileKind=svelte; experimental and gated on the {@html} diagnostic.

##### ESLINT-RECOMMENDED-RULES — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| eslint-plugin-svelte (1T API) ❌ | 287 | error | – | – | – | – | – | – | – |
| eslint-plugin-svelte (worker pool) ❌ | 287 | error | – | – | – | – | – | – | – |
| eslint-plugin-svelte (CLI) ❌ | 287 | error | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **eslint-plugin-svelte (1T API) ❌**: source.isSpaceBetweenTokens is not a function Occurred while linting /home/runner/work/svelte-benchmarks/svelte-benchmarks/work-real/carbon-components-svelte/lint/work/lint/n287/00149--SkeletonPlaceholder.svelte:23 Rule: "svelte/no-reactive-functions"
- **eslint-plugin-svelte (worker pool) ❌**: TypeError: source.isSpaceBetweenTokens is not a function Occurred while linting /home/runner/work/svelte-benchmarks/svelte-benchmarks/work-real/carbon-components-svelte/lint/work/lint/n287/00149--SkeletonPlaceholder.svelte:23 Rule: "svelte/no-reactive-functions"     at Object.fix (file:///home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint-plugin-svelte@3.23.0_eslint@10.11.0_svelte@5.57.1_@typescript-eslint+types@8.71.0_/node_modules/eslint-plugin-svelte/lib/rules/no-reactive-functions.js:48:61)     at normalizeFixes (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.11.0/node_modules/eslint/lib/linter/file-report.js:307:25)     at /home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.11.0/node_modules/eslint/lib/linter/file-report.js:340:11     at Array.map (<anonymous>)     at mapSuggestions (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.11.0/node_modules/eslint/lib/linter/file-report.js:333:5)     at FileReport.addRuleMessage (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.11.0/node_modules/eslint/lib/linter/file-report.js:581:7)     at FileContext.report (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.11.0/node_modules/eslint/lib/linter/linter.js:588:28)     at SvelteReactiveStatement > ExpressionStatement > AssignmentExpression > :function (file:///home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint-plugin-svelte@3.23.0_eslint@10.11.0_svelte@5.57.1_@typescript-eslint+types@8.71.0_/node_modules/eslint-plugin-svelte/lib/rules/no-reactive-functions.js:36:32)     at SourceCodeVisitor.callSync (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.11.0/node_modules/eslint/lib/linter/source-code-visitor.js:158:6)     at applyStep (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.11.0/node_modules/eslint/lib/linter/source-code-traverser.js:332:17)
- **eslint-plugin-svelte (CLI) ❌**: /home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.bin/eslint . exited with 2 Oops! Something went wrong! :(  ESLint: 10.11.0  TypeError: source.isSpaceBetweenTokens is not a function Occurred while linting /home/runner/work/svelte-benchmarks/svelte-benchmarks/work-real/carbon-components-svelte/lint/work/lint/n287/00149--SkeletonPlaceholder.svelte:23 Rule: "svelte/no-reactive-functions"     at Object.fix (file:///home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint-plugin-svelte@3.23.0_eslint@10.11.0_svelte@5.57.1_@typescript-eslint+types@8.71.0_/node_modules/eslint-plugin-svelte/lib/rules/no-reactive-functions.js:48:61)     at normalizeFixes (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.11.0/node_modules/eslint/lib/linter/file-report.js:307:25)     at /home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.11.0/node_modules/eslint/lib/linter/file-report.js:340:11     at Array.map (<anonymous>)     at mapSuggestions (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.11.0/node_modules/eslint/lib/linter/file-report.js:333:5)     at FileReport.addRuleMessage (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.11.0/node_modules/eslint/lib/linter/file-report.js:581:7)     at FileContext.report (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.11.0/node_modules/eslint/lib/linter/linter.js:588:28)     at SvelteReactiveStatement > ExpressionStatement > AssignmentExpression > :function (file:///home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint-plugin-svelte@3.23.0_eslint@10.11.0_svelte@5.57.1_@typescript-eslint+types@8.71.0_/node_modules/eslint-plugin-svelte/lib/rules/no-reactive-functions.js:36:32)     at SourceCodeVisitor.callSync (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.11.0/node_modules/eslint/lib/linter/source-code-visitor.js:158:6)     at applyStep (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.11.0/node_modules/eslint/lib/linter/source-code-traverser.js:332:17)

</details>

##### RSVELTE-NATIVE-RULES — separate workload

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-carbon-components-svelte-real-world-linux-carbon-comp-19b8jpw-dark.svg">
  <img src="charts/real-world-carbon-components-svelte-real-world-linux-carbon-comp-19b8jpw.svg" alt="Lint — RSVELTE-NATIVE-RULES" width="760">
</picture>

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| rsvelte-lint | 287 | **399.9 ms** | 385.4 ms | 188.5 ms | 47.1% ⚠ | — | n/a | n/a | — |

<details><summary>Notes</summary>

- **rsvelte-lint**: rsvelte-lint . (Rust linter) | ⓘ file coverage verified: named 287/287 planted Svelte files.

</details>

##### VERTER-NATIVE-DIAGNOSTICS — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter host lint ❌ | 287 | error | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Verter host lint ❌**: HostError: scheduler error: stage Source failed for /home/runner/work/svelte-benchmarks/svelte-benchmarks/work-real/carbon-components-svelte/lint/work/lint/n287/00010--Button.svelte: carrier publication did not admit

</details>

<details><summary>Methodology</summary>

- Every tool receives the same isolated Svelte corpus.
- A planted {@html} issue must be reported; missing the template rule leaves the time visible but unranked.
- An untimed file-coverage census requires each directory-walk CLI to name every planted corpus file; explicit-list APIs are exact by construction.
- ESLint is measured in single-threaded API, worker-pool API, and CLI modes so invocation and thread-count costs remain visible.
- Rule sets are not identical, so ESLint recommended rules, rsvelte native rules, and Verter diagnostics are separate workload classes. The shared planted gate establishes minimum work but never cross-engine equivalence.
- Tool order is rotated; ranking metric is the median of warmed runs.

Raw runs:

- **rsvelte-lint**: 399.9 ms, 398.1 ms, 385.4 ms, 817.7 ms, 401.8 ms

</details>


## flowbite-svelte

- **Generated:** 2026-09-29T12:45:28.055Z
- **Fixture:** `pinned real-world Svelte source checkouts` (183 Svelte files)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · AMD EPYC 7763 64-Core Processor · 16 GB RAM · Node v22.23.2
- **Commit:** [1bc177a](https://github.com/pikax/svelte-benchmarks/commit/1bc177a)
- **CI run:** https://github.com/pikax/svelte-benchmarks/actions/runs/36569517081
- **Source:** `real-world-Linux-flowbite-svelte.json`

Corpus: flowbite-svelte:components

### SFC compile (unique contents)

Files: **183** · Bytes: **478,393**

Corpus: flowbite-svelte:components @ v1.33.1 (3fbf1a18, released/committed 2026-04-07) · 183 SFCs · library-source · MIT

Tools:

- **svelte/compiler 5.57.1** — Official svelte/compiler compile() API, single-threaded.
- **@mrwaip/svelte-rs (NAPI)** — MrWaip/svelte-rs native compiler through its svelte/compiler-compatible API.
- **@rsvelte/compiler (wasm)** — rsvelte WASM compiler bindings.
- **@rsvelte/native (NAPI)** — rsvelte native NAPI compiler (@rsvelte/vite-plugin-svelte-native).
- **Verter (stateless)** — VerterHost.compileMany without cross-run cache; experimental Svelte carrier.

Validation (runtime semantic plants):

Suite 2026-09-12.2 · hash 451381a17402 · 2 cell(s)

| Cell | Status | Entrypoint verdicts |
| --- | --- | --- |
| client/production/source-map-off | FAIL | svelte-official: PASS · mrwaip-svelte-rs: FAIL · rsvelte-wasm: FAIL · rsvelte-native: FAIL · verter-svelte: FAIL |
| server/production/source-map-off | FAIL | svelte-official: PASS · mrwaip-svelte-rs: FAIL · rsvelte-wasm: PASS · rsvelte-native: PASS · verter-svelte: FAIL |

Compile results are **grouped by target × environment**, then by comparison class.

#### CLIENT · production

Target: `client` · Environment: `production`

##### EXPERIMENTAL-SVELTE — separate workload

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-flowbite-svelte-real-world-linux-flowbite-svelte-comp-07brceb-dark.svg">
  <img src="charts/real-world-flowbite-svelte-real-world-linux-flowbite-svelte-comp-07brceb.svg" alt="Compiler — CLIENT · production · EXPERIMENTAL-SVELTE" width="760">
</picture>

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter (stateless) ⚠ | 183 | (125.8 ms) | not ranked | (125.6 ms) | (122.9 ms) | – | – | not ranked | (0) | n/a | – |

<details><summary>Notes</summary>

- **Verter (stateless) ⚠**: VerterHost.compileMany(target=runtime-render, mode=stateless, 1 CPU thread) on the same revised Svelte inputs. Diagnostic timing only: the published path is not validated as a Svelte runtime compiler; invalid/empty output and per-file errors are retained, never ranked. | output gate: FAIL — returned empty JavaScript; 183/183 entries, 183 compile errors, 183 entries missing the CSS revision token; first error: [00000--Accordion.svelte] host error: runtime surface refused for '00000--Accordion.svelte': svelte-runtime-unsupported-advanced-rune: Svelte client emission does not yet support the `non-let $derived declarator` rune form. | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ RUNTIME SEMANTIC VALIDITY FAIL (4/33 plants) — state-derived-update (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-advanced-rune: Svelte client emission does not yet support the `$derived` rune form.; bindable-prop (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-advanced-rune: Svelte client emission does not yet support the `$props() non-interpolation usage` rune form.; callback-prop-events (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-non-delegated-event: Svelte client emission does not yet support the non-delegated / capture / global event `click`.

</details>

##### Svelte runtime

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-flowbite-svelte-real-world-linux-flowbite-svelte-comp-0xre1h8-dark.svg">
  <img src="charts/real-world-flowbite-svelte-real-world-linux-flowbite-svelte-comp-0xre1h8.svg" alt="Compiler — CLIENT · production · Svelte runtime" width="760">
</picture>

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte/compiler 5.57.1 | 183 | 872.2 ms | — | **732.2 ms** | 671.7 ms | 58.6 ms | 8.0% | — | 800,573 | n/a | — |
| @mrwaip/svelte-rs (NAPI) ⚠ | 183 | (58.5 ms) | not ranked | (57.8 ms) | (56.8 ms) | – | – | not ranked | (772,681) | n/a | – |
| @rsvelte/native (NAPI) ⚠ | 183 | (253.8 ms) | not ranked | (254.0 ms) | (252.2 ms) | – | – | not ranked | (796,733) | n/a | – |
| @rsvelte/compiler (wasm) ⚠ | 183 | (696.4 ms) | not ranked | (644.7 ms) | (632.9 ms) | – | – | not ranked | (796,733) | n/a | – |

<details><summary>Notes</summary>

- **svelte/compiler 5.57.1**: Official svelte/compiler compile(), generate=client, dev=false, css=external, runes=auto | runtime gate: ✓ 183/183 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through svelte/compiler compile() per plant, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **@mrwaip/svelte-rs (NAPI) ⚠**: @mrwaip/svelte-rs compile(), generate=client, dev=false, css=external | runtime gate: ✓ 183/183 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-styles: css.css-0: mapped to 2:24; expected 9:24; crlf-styles: css.css-0: mapped to 2:24; expected 9:24). The timing remains visible but cannot rank until the emitted maps are correct.
- **@rsvelte/native (NAPI) ⚠**: rsvelte NAPI compile(), generate=client, dev=false, css=external | runtime gate: ✓ 183/183 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-raw: js.template: generated token has no original mapping; lf-styles: js.template: generated token has no original mapping). The timing remains visible but cannot rank until the emitted maps are correct.
- **@rsvelte/compiler (wasm) ⚠**: rsvelte WASM compile(), generate=client, dev=false, css=external. ⚠ WASM path — not the NAPI native binding. | runtime gate: ✓ 183/183 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-raw: js.template: generated token has no original mapping; lf-styles: js.template: generated token has no original mapping). The timing remains visible but cannot rank until the emitted maps are correct.

</details>

<details><summary>Raw runs</summary>

- **Verter (stateless)**: 124.2 ms, 122.9 ms, 126.2 ms, 125.6 ms, 127.2 ms · fresh child: 125.7 ms, 123.2 ms, 125.8 ms, 125.9 ms, 129.5 ms
- **svelte/compiler 5.57.1**: 830.1 ms, 732.2 ms, 709.1 ms, 735.8 ms, 671.7 ms · fresh child: 838.7 ms, 852.7 ms, 903.0 ms, 903.3 ms, 872.2 ms
- **@mrwaip/svelte-rs (NAPI)**: 57.8 ms, 57.4 ms, 58.0 ms, 58.0 ms, 56.8 ms · fresh child: 58.0 ms, 59.1 ms, 58.5 ms, 58.1 ms, 59.1 ms
- **@rsvelte/native (NAPI)**: 252.2 ms, 252.5 ms, 255.1 ms, 254.0 ms, 255.8 ms · fresh child: 252.2 ms, 253.8 ms, 254.4 ms, 255.1 ms, 251.3 ms
- **@rsvelte/compiler (wasm)**: 651.9 ms, 641.2 ms, 644.7 ms, 646.5 ms, 632.9 ms · fresh child: 675.6 ms, 714.0 ms, 699.6 ms, 696.4 ms, 687.1 ms

</details>

#### SERVER · production

Target: `server` · Environment: `production`

##### EXPERIMENTAL-SVELTE — separate workload

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-flowbite-svelte-real-world-linux-flowbite-svelte-comp-1mtjwbz-dark.svg">
  <img src="charts/real-world-flowbite-svelte-real-world-linux-flowbite-svelte-comp-1mtjwbz.svg" alt="Compiler — SERVER · production · EXPERIMENTAL-SVELTE" width="760">
</picture>

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter (stateless) ⚠ | 183 | (51.4 ms) | not ranked | (52.3 ms) | (50.8 ms) | – | – | not ranked | (0) | n/a | – |

<details><summary>Notes</summary>

- **Verter (stateless) ⚠**: VerterHost.compileMany(target=runtime-render, mode=stateless, 1 CPU thread) on the same revised Svelte inputs. Diagnostic timing only: the published path is not validated as a Svelte runtime compiler; invalid/empty output and per-file errors are retained, never ranked. | output gate: FAIL — returned empty JavaScript; 183/183 entries, 183 compile errors, 183 entries missing the CSS revision token; first error: [00000--Accordion.svelte] host error: runtime surface refused for '00000--Accordion.svelte': svelte-runtime-unsupported-server-generate: Svelte client emission does not yet support server-side rendering (`generate: 'server'`). | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ RUNTIME SEMANTIC VALIDITY FAIL (0/33 plants) — props-defaults-interpolation (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-server-generate: Svelte client emission does not yet support server-side rendering (`generate: 'server'`).; state-derived-update (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-server-generate: Svelte client emission does not yet support server-side rendering (`generate: 'server'`).; bindable-prop (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-server-generate: Svelte client emission does not yet support server-side rendering (`generate: 'server'`).

</details>

##### Svelte runtime

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-flowbite-svelte-real-world-linux-flowbite-svelte-comp-1kn5pfk-dark.svg">
  <img src="charts/real-world-flowbite-svelte-real-world-linux-flowbite-svelte-comp-1kn5pfk.svg" alt="Compiler — SERVER · production · Svelte runtime" width="760">
</picture>

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @rsvelte/native (NAPI) | 183 | 169.7 ms | 1.00x | **171.7 ms** | 168.2 ms | 1.7 ms | 1.0% | 1.00x | 539,119 | n/a | 1.1k files/s |
| @rsvelte/compiler (wasm) | 183 | 485.1 ms | 2.86x | **448.7 ms** | 446.9 ms | 4.1 ms | 0.9% | 2.61x | 539,119 | n/a | 408 files/s |
| svelte/compiler 5.57.1 | 183 | 787.7 ms | 4.64x | **590.6 ms** | 571.9 ms | 32.5 ms | 5.5% | 3.44x | 539,119 | n/a | 310 files/s |
| @mrwaip/svelte-rs (NAPI) ⚠ | 183 | (47.6 ms) | not ranked | (46.6 ms) | (46.2 ms) | – | – | not ranked | (520,180) | n/a | – |

<details><summary>Notes</summary>

- **@rsvelte/native (NAPI)**: rsvelte NAPI compile(), generate=server, dev=false, css=external | runtime gate: ✓ 183/183 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through @rsvelte/vite-plugin-svelte-native compileSync() per plant, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **@rsvelte/compiler (wasm)**: rsvelte WASM compile(), generate=server, dev=false, css=external. ⚠ WASM path — not the NAPI native binding. | runtime gate: ✓ 183/183 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through @rsvelte/compiler compile() per plant after initSync, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **svelte/compiler 5.57.1**: Official svelte/compiler compile(), generate=server, dev=false, css=external, runes=auto | runtime gate: ✓ 183/183 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through svelte/compiler compile() per plant, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **@mrwaip/svelte-rs (NAPI) ⚠**: @mrwaip/svelte-rs compile(), generate=server, dev=false, css=external | runtime gate: ✗ returned empty JavaScript; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-raw: js.missing or invalid version-3 source map; lf-styles: js.missing or invalid version-3 source map). The timing remains visible but cannot rank until the emitted maps are correct.

</details>

<details><summary>Raw runs</summary>

- **Verter (stateless)**: 55.6 ms, 51.3 ms, 52.3 ms, 50.8 ms, 54.2 ms · fresh child: 52.4 ms, 51.4 ms, 49.4 ms, 51.1 ms, 51.8 ms
- **@rsvelte/native (NAPI)**: 172.5 ms, 168.2 ms, 171.7 ms, 171.0 ms, 172.0 ms · fresh child: 167.5 ms, 168.0 ms, 183.6 ms, 170.2 ms, 169.7 ms
- **@rsvelte/compiler (wasm)**: 453.8 ms, 456.2 ms, 448.7 ms, 447.6 ms, 446.9 ms · fresh child: 483.5 ms, 483.3 ms, 485.1 ms, 485.5 ms, 487.6 ms
- **svelte/compiler 5.57.1**: 625.8 ms, 590.6 ms, 649.0 ms, 581.3 ms, 571.9 ms · fresh child: 782.8 ms, 787.7 ms, 781.4 ms, 804.2 ms, 804.3 ms
- **@mrwaip/svelte-rs (NAPI)**: 47.8 ms, 46.4 ms, 46.8 ms, 46.2 ms, 46.6 ms · fresh child: 47.7 ms, 47.6 ms, 48.2 ms, 47.6 ms, 47.6 ms

</details>

<details><summary>Methodology</summary>

- Matrix: generate ∈ {client, server} × env ∈ {production, development} × source-map ∈ {off, on} (off by default).
- Every compiler receives the same in-memory Svelte SFC corpus. The latest official Svelte compiler is the sole reference and decides real-world eligibility for every tool.
- Official: svelte/compiler compile() with runes=auto. Generated fixtures force runes; real-world sources use compiler auto-detection.
- MrWaip: @mrwaip/svelte-rs native compiler through its compatible compile() API, validated against the same latest Svelte runtime and official baseline as every other compiler.
- rsvelte: WASM (@rsvelte/compiler) and NAPI (@rsvelte/vite-plugin-svelte-native) paths are separate rows against the same official Svelte baseline.
- Verter's published compileMany runtime-render path receives the same revised Svelte inputs with stateless caching and one CPU thread. Completed passes publish warm/fresh timings even when their code is invalid or entries contain compile errors. They are permanently unranked diagnostic evidence until the adapter is validated; errors, output samples, revision-token failures and runtime-plant verdicts are retained. Only a missing API/package is skipped; a thrown batch failure is an error.
- Every warmed/fresh pass compiles a REVISED corpus: a fixed-width comment token plus a used CSS custom-property rule. The timed loop asserts the token reached the emitted CSS, so a cached whole-output result from a previous pass fails the gate. Adapter parity additionally requires every warm and fresh pass to have received a distinct input revision.
- Every compiler must return one non-empty code artifact per input file, emit the expected Svelte client/server runtime import, and remove Svelte runes; aggregate byte totals alone are not accepted as proof of coverage.
- Fresh child = the first timed row workload in a NEW child process, after excluded Node startup, package imports, adapter construction and input materialisation. It is NOT machine-cold (OS page cache is not flushed) and its ratio never substitutes for the warm verdict.
- Source maps: every compared Svelte 5 compiler ALWAYS emits js.map/css.map from compile() (no off/on flag exists — the 'sourcemap' option is a chained-map INPUT), so an off/on matrix would measure the harness, not the tools. Instead the maps' COORDINATE CORRECTNESS gates every row: anchored tokens in generated JS/CSS must trace back to their exact source positions (segment fallback allowed, exact line/column required, sourcesContent equal to the full component), across LF/CRLF and non-BMP-shifted columns. Wrong-file, shifted, stale or byte-counted maps unrank the row.
- Runtime semantic validity: a 28-plant Svelte 5 suite (props/state/derived/bindable/bindings/events/each-keyed/await/snippets/stores/actions/context/dynamic components/{@html}/SVG/module script/legacy syntax + CSS semantics) runs per entrypoint per cell in isolated child processes after timing; non-PASS rows unrank, and a failed official reference unranks every candidate in the comparison (no survivor promotion).
- Tool order is rotated on every warmup and measured run. A row is unranked unless the measured runs cover every active execution position; ranking metric is the median of warmed runs.

</details>

### Svelte TypeScript projection

Files: **183** · Bytes: **478,393**

Corpus: flowbite-svelte:components @ v1.33.1 (3fbf1a18, released/committed 2026-04-07) · 183 SFCs · library-source · MIT

Tools:

- **svelte2tsx** — Official Svelte-to-TSX projection from sveltejs/language-tools.
- **@rsvelte/svelte2tsx (Wasm)** — rsvelte Rust/Wasm drop-in Svelte-to-TSX projection.
- **Verter IDE projection** — VerterHost ensureIdeCompiled/getIde Svelte projection; separate schema from svelte2tsx.

##### SVELTE2TSX-COMPATIBLE — separate workload

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-flowbite-svelte-real-world-linux-flowbite-svelte-proj-0b8h51o-dark.svg">
  <img src="charts/real-world-flowbite-svelte-real-world-linux-flowbite-svelte-proj-0b8h51o.svg" alt="Svelte TypeScript projection — SVELTE2TSX-COMPATIBLE" width="760">
</picture>

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | TSX bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @rsvelte/svelte2tsx (Wasm) | 183 | **73.9 ms** | 70.7 ms | 4.4 ms | 6.0% | 1.00x | 621,013 | n/a | 2.5k files/s |
| svelte2tsx | 183 | **302.7 ms** | 290.5 ms | 7.0 ms | 2.3% | 4.09x | 621,320 | n/a | 605 files/s |

<details><summary>Notes</summary>

- **@rsvelte/svelte2tsx (Wasm)**: Rust/Wasm drop-in; TypeScript-printer structural parity against official output | gate: ✓ 183/183 valid TSX outputs
- **svelte2tsx**: Official svelte2tsx, Svelte 5 TS projection | gate: ✓ 183/183 valid TSX outputs

</details>

##### VERTER-IDE-PROJECTION — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Projection bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter IDE projection ❌ | 183 | error | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Verter IDE projection ❌**: HostError: scheduler error: stage Source failed for /home/runner/work/svelte-benchmarks/svelte-benchmarks/work-real/flowbite-svelte/projection/corpus-jD0oPa/00011--BreadcrumbItem.svelte: carrier publication did not admit

</details>

<details><summary>Methodology</summary>

- This is the type-analysis projection used by Svelte-aware TypeScript tooling; it is not runtime compilation or component documentation.
- The svelte2tsx-compatible rows use the synchronous in-process API with identical Svelte 5 options and file order.
- Every output must parse as TSX and contain tool-specific Svelte projection helpers.
- The rsvelte row must match official output after TypeScript parses and reprints both outputs, ignoring formatting-only whitespace while retaining syntax and comments.
- Verter's ensureIdeCompiled/getIde output is a genuine Svelte IDE projection, but its carrier and helper contract differ from svelte2tsx; it is therefore measured in a separate comparison class.

Raw runs:

- **@rsvelte/svelte2tsx (Wasm)**: 81.3 ms, 77.6 ms, 73.9 ms, 71.6 ms, 70.7 ms
- **svelte2tsx**: 309.5 ms, 302.7 ms, 300.5 ms, 303.8 ms, 290.5 ms

</details>

### Format

Files: **183** · Bytes: **478,393**

Corpus: flowbite-svelte:components @ v1.33.1 (3fbf1a18, released/committed 2026-04-07) · 183 SFCs · library-source · MIT

Tools:

- **Prettier** — prettier --write with prettier-plugin-svelte over a fresh corpus copy.
- **rsvelte-fmt** — @rsvelte/fmt — Rust formatter for .svelte.
- **Oxfmt** — Oxc formatter; skipped because the pinned release excludes .svelte files.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-flowbite-svelte-real-world-linux-flowbite-svelte-form-10p0mtl-dark.svg">
  <img src="charts/real-world-flowbite-svelte-real-world-linux-flowbite-svelte-form-10p0mtl.svg" alt="Format" width="760">
</picture>

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| rsvelte-fmt | 183 | **163.8 ms** | 155.0 ms | 5.9 ms | 3.6% | 1.00x | n/a | n/a | 1.1k files/s |
| Prettier | 183 | **4.02 s** | 3.93 s | 92.9 ms | 2.3% | 24.53x | n/a | n/a | 46 files/s |
| Oxfmt ⏭ | 183 | skipped | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **rsvelte-fmt**: rsvelte-fmt . (Rust); may route embedded JS/TS/CSS through other formatters | ⓘ file coverage verified: rewrote 183/183 Svelte files.
- **Prettier**: prettier --write **/*.svelte with prettier-plugin-svelte · single-threaded | ⓘ file coverage verified: rewrote 183/183 Svelte files.
- **Oxfmt ⏭**: Pinned Oxfmt release excludes .svelte files; no CLI-startup proxy is timed.

</details>

<details><summary>Methodology</summary>

- Every timed invocation receives a fresh copy of the same Svelte corpus.
- All rows are CLI invocations; any non-zero exit is an operational failure and cannot rank, even if some files changed first.
- A nested markup-rewrite plant fails tools that no-op, format only &lt;script>, or use a non-recursive file pattern.
- An untimed coverage census dirties every Svelte file; a tool that rewrites fewer than the full corpus is measured but unranked.
- Output style is not normalized — this measures whole-SFC format throughput, not byte identity.
- Tool order is rotated; ranking metric is the median of warmed runs.

Raw runs:

- **rsvelte-fmt**: 155.0 ms, 160.5 ms, 171.1 ms, 164.3 ms, 163.8 ms
- **Prettier**: 4.01 s, 3.93 s, 4.02 s, 4.07 s, 4.18 s

</details>

### Lint

Files: **183** · Bytes: **478,393**

Corpus: flowbite-svelte:components @ v1.33.1 (3fbf1a18, released/committed 2026-04-07) · 183 SFCs · library-source · MIT

Tools:

- **eslint-plugin-svelte (1T API)** — ESLint API + eslint-plugin-svelte recommended rules, single-threaded.
- **eslint-plugin-svelte (worker pool)** — ESLint API + eslint-plugin-svelte recommended rules, split across worker threads.
- **eslint-plugin-svelte (CLI)** — ESLint CLI + eslint-plugin-svelte recommended rules.
- **rsvelte-lint** — @rsvelte/lint — Rust Svelte linter.
- **Verter host lint** — VerterHost lint/diagnostics API with fileKind=svelte; experimental and gated on the {@html} diagnostic.

##### ESLINT-RECOMMENDED-RULES — separate workload

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-flowbite-svelte-real-world-linux-flowbite-svelte-lint-1tcgxz8-dark.svg">
  <img src="charts/real-world-flowbite-svelte-real-world-linux-flowbite-svelte-lint-1tcgxz8.svg" alt="Lint — ESLINT-RECOMMENDED-RULES" width="760">
</picture>

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| eslint-plugin-svelte (1T API) | 183 | **2.55 s** | 2.46 s | 477.6 ms | 18.8% ⚠ | 1.00x | n/a | n/a | 72 files/s |
| eslint-plugin-svelte (CLI) | 183 | **4.55 s** | 4.47 s | 39.1 ms | 0.9% | 1.79x | n/a | n/a | 40 files/s |
| eslint-plugin-svelte (worker pool) | 183 | **5.54 s** | 5.47 s | 50.7 ms | 0.9% | 2.18x | n/a | n/a | 33 files/s |

<details><summary>Notes</summary>

- **eslint-plugin-svelte (1T API)**: ESLint flat config + eslint-plugin-svelte recommended; explicit file list | ⓘ file coverage by construction: the invocation receives all 183 corpus files as an explicit list.
- **eslint-plugin-svelte (CLI)**: eslint . over the same isolated corpus; pays startup and config load | ⓘ file coverage verified: named 183/183 planted Svelte files.
- **eslint-plugin-svelte (worker pool)**: ESLint worker_threads fan-out; explicit file list | ⓘ file coverage by construction: the invocation receives all 183 corpus files as an explicit list.

</details>

##### RSVELTE-NATIVE-RULES — separate workload

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-flowbite-svelte-real-world-linux-flowbite-svelte-lint-1ls505w-dark.svg">
  <img src="charts/real-world-flowbite-svelte-real-world-linux-flowbite-svelte-lint-1ls505w.svg" alt="Lint — RSVELTE-NATIVE-RULES" width="760">
</picture>

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| rsvelte-lint | 183 | **273.5 ms** | 266.8 ms | 3.8 ms | 1.4% | — | n/a | n/a | — |

<details><summary>Notes</summary>

- **rsvelte-lint**: rsvelte-lint . (Rust linter) | ⓘ file coverage verified: named 183/183 planted Svelte files.

</details>

##### VERTER-NATIVE-DIAGNOSTICS — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter host lint ❌ | 183 | error | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Verter host lint ❌**: HostError: scheduler error: stage Source failed for /home/runner/work/svelte-benchmarks/svelte-benchmarks/work-real/flowbite-svelte/lint/work/lint/n183/00011--BreadcrumbItem.svelte: carrier publication did not admit

</details>

<details><summary>Methodology</summary>

- Every tool receives the same isolated Svelte corpus.
- A planted {@html} issue must be reported; missing the template rule leaves the time visible but unranked.
- An untimed file-coverage census requires each directory-walk CLI to name every planted corpus file; explicit-list APIs are exact by construction.
- ESLint is measured in single-threaded API, worker-pool API, and CLI modes so invocation and thread-count costs remain visible.
- Rule sets are not identical, so ESLint recommended rules, rsvelte native rules, and Verter diagnostics are separate workload classes. The shared planted gate establishes minimum work but never cross-engine equivalence.
- Tool order is rotated; ranking metric is the median of warmed runs.

Raw runs:

- **eslint-plugin-svelte (1T API)**: 2.55 s, 3.35 s, 2.46 s, 2.47 s, 3.38 s
- **eslint-plugin-svelte (CLI)**: 4.47 s, 4.57 s, 4.55 s, 4.55 s, 4.56 s
- **eslint-plugin-svelte (worker pool)**: 5.47 s, 5.54 s, 5.56 s, 5.51 s, 5.61 s
- **rsvelte-lint**: 272.9 ms, 273.5 ms, 266.8 ms, 273.9 ms, 277.3 ms

</details>


## open-webui

- **Generated:** 2026-09-29T12:53:39.404Z
- **Fixture:** `pinned real-world Svelte source checkouts` (650 Svelte files)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · INTEL(R) XEON(R) PLATINUM 8573C · 16 GB RAM · Node v22.23.2
- **Commit:** [1bc177a](https://github.com/pikax/svelte-benchmarks/commit/1bc177a)
- **CI run:** https://github.com/pikax/svelte-benchmarks/actions/runs/36569517081
- **Source:** `real-world-Linux-open-webui.json`

Corpus: open-webui:app

### SFC compile (unique contents)

Files: **649** · Bytes: **3,610,179**

Corpus: open-webui:app @ v0.11.0 (f9590b80, released/committed 2026-07-27) · 650 SFCs · app-source · Open WebUI License

Surface scope: **649/650** files · 1 excluded before timing because an applicable official reference API rejected the raw, unpreprocessed source. The identical accepted set is used for every row.

Tools:

- **svelte/compiler 5.57.1** — Official svelte/compiler compile() API, single-threaded.
- **@mrwaip/svelte-rs (NAPI)** — MrWaip/svelte-rs native compiler through its svelte/compiler-compatible API.
- **@rsvelte/compiler (wasm)** — rsvelte WASM compiler bindings.
- **@rsvelte/native (NAPI)** — rsvelte native NAPI compiler (@rsvelte/vite-plugin-svelte-native).
- **Verter (stateless)** — VerterHost.compileMany without cross-run cache; experimental Svelte carrier.

Validation (runtime semantic plants):

Suite 2026-09-12.2 · hash 451381a17402 · 2 cell(s)

| Cell | Status | Entrypoint verdicts |
| --- | --- | --- |
| client/production/source-map-off | FAIL | svelte-official: PASS · mrwaip-svelte-rs: FAIL · rsvelte-wasm: FAIL · rsvelte-native: FAIL · verter-svelte: FAIL |
| server/production/source-map-off | FAIL | svelte-official: PASS · mrwaip-svelte-rs: FAIL · rsvelte-wasm: PASS · rsvelte-native: PASS · verter-svelte: FAIL |

Compile results are **grouped by target × environment**, then by comparison class.

#### CLIENT · production

Target: `client` · Environment: `production`

##### EXPERIMENTAL-SVELTE — separate workload

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-open-webui-real-world-linux-open-webui-compile-client-0g1kspv-dark.svg">
  <img src="charts/real-world-open-webui-real-world-linux-open-webui-compile-client-0g1kspv.svg" alt="Compiler — CLIENT · production · EXPERIMENTAL-SVELTE" width="760">
</picture>

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter (stateless) ⚠ | 649 | (505.0 ms) | not ranked | (540.7 ms) | (534.2 ms) | – | – | not ranked | (0) | n/a | – |

<details><summary>Notes</summary>

- **Verter (stateless) ⚠**: VerterHost.compileMany(target=runtime-render, mode=stateless, 1 CPU thread) on the same revised Svelte inputs. Diagnostic timing only: the published path is not validated as a Svelte runtime compiler; invalid/empty output and per-file errors are retained, never ranked. | output gate: FAIL — returned empty JavaScript; 649/649 entries, 649 compile errors, 649 entries missing the CSS revision token; first error: upsert failed: scheduler error: stage Source failed for 00000--AddConnectionModal.svelte: carrier publication did not admit | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ RUNTIME SEMANTIC VALIDITY FAIL (4/33 plants) — state-derived-update (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-advanced-rune: Svelte client emission does not yet support the `$derived` rune form.; bindable-prop (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-advanced-rune: Svelte client emission does not yet support the `$props() non-interpolation usage` rune form.; callback-prop-events (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-non-delegated-event: Svelte client emission does not yet support the non-delegated / capture / global event `click`.

</details>

##### Svelte runtime

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte/compiler 5.57.1 ❌ | 649 | error | – | – | – | – | – | – | – |
| @mrwaip/svelte-rs (NAPI) ❌ | 649 | error | – | – | – | – | – | – | – |
| @rsvelte/compiler (wasm) ❌ | 649 | error | – | – | – | – | – | – | – |
| @rsvelte/native (NAPI) ❌ | 649 | error | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **svelte/compiler 5.57.1 ❌**: output-cache gate: pass revision token missing from emitted CSS for 00051--ManageOllama.svelte — the compiler did not process this pass's input
- **@mrwaip/svelte-rs (NAPI) ❌**: output-cache gate: pass revision token missing from emitted CSS for 00051--ManageOllama.svelte — the compiler did not process this pass's input
- **@rsvelte/compiler (wasm) ❌**: output-cache gate: pass revision token missing from emitted CSS for 00051--ManageOllama.svelte — the compiler did not process this pass's input
- **@rsvelte/native (NAPI) ❌**: output-cache gate: pass revision token missing from emitted CSS for 00051--ManageOllama.svelte — the compiler did not process this pass's input

</details>

<details><summary>Raw runs</summary>

- **Verter (stateless)**: 548.9 ms, 534.2 ms, 537.0 ms, 540.7 ms, 567.9 ms · fresh child: 525.2 ms, 529.7 ms, 505.0 ms, 488.1 ms, 482.9 ms

</details>

#### SERVER · production

Target: `server` · Environment: `production`

##### EXPERIMENTAL-SVELTE — separate workload

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-open-webui-real-world-linux-open-webui-compile-server-04jjrdb-dark.svg">
  <img src="charts/real-world-open-webui-real-world-linux-open-webui-compile-server-04jjrdb.svg" alt="Compiler — SERVER · production · EXPERIMENTAL-SVELTE" width="760">
</picture>

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter (stateless) ⚠ | 649 | (235.3 ms) | not ranked | (277.0 ms) | (269.6 ms) | – | – | not ranked | (0) | n/a | – |

<details><summary>Notes</summary>

- **Verter (stateless) ⚠**: VerterHost.compileMany(target=runtime-render, mode=stateless, 1 CPU thread) on the same revised Svelte inputs. Diagnostic timing only: the published path is not validated as a Svelte runtime compiler; invalid/empty output and per-file errors are retained, never ranked. | output gate: FAIL — returned empty JavaScript; 649/649 entries, 649 compile errors, 649 entries missing the CSS revision token; first error: upsert failed: scheduler error: stage Source failed for 00000--AddConnectionModal.svelte: carrier publication did not admit | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ RUNTIME SEMANTIC VALIDITY FAIL (0/33 plants) — props-defaults-interpolation (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-server-generate: Svelte client emission does not yet support server-side rendering (`generate: 'server'`).; state-derived-update (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-server-generate: Svelte client emission does not yet support server-side rendering (`generate: 'server'`).; bindable-prop (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-server-generate: Svelte client emission does not yet support server-side rendering (`generate: 'server'`).

</details>

##### Svelte runtime

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte/compiler 5.57.1 ❌ | 649 | error | – | – | – | – | – | – | – |
| @mrwaip/svelte-rs (NAPI) ❌ | 649 | error | – | – | – | – | – | – | – |
| @rsvelte/compiler (wasm) ❌ | 649 | error | – | – | – | – | – | – | – |
| @rsvelte/native (NAPI) ❌ | 649 | error | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **svelte/compiler 5.57.1 ❌**: output-cache gate: pass revision token missing from emitted CSS for 00051--ManageOllama.svelte — the compiler did not process this pass's input
- **@mrwaip/svelte-rs (NAPI) ❌**: output-cache gate: pass revision token missing from emitted CSS for 00051--ManageOllama.svelte — the compiler did not process this pass's input
- **@rsvelte/compiler (wasm) ❌**: output-cache gate: pass revision token missing from emitted CSS for 00051--ManageOllama.svelte — the compiler did not process this pass's input
- **@rsvelte/native (NAPI) ❌**: output-cache gate: pass revision token missing from emitted CSS for 00051--ManageOllama.svelte — the compiler did not process this pass's input

</details>

<details><summary>Raw runs</summary>

- **Verter (stateless)**: 275.6 ms, 269.6 ms, 277.0 ms, 285.4 ms, 281.8 ms · fresh child: 243.5 ms, 235.3 ms, 232.9 ms, 238.2 ms, 232.5 ms

</details>

<details><summary>Methodology</summary>

- Matrix: generate ∈ {client, server} × env ∈ {production, development} × source-map ∈ {off, on} (off by default).
- Every compiler receives the same in-memory Svelte SFC corpus. The latest official Svelte compiler is the sole reference and decides real-world eligibility for every tool.
- Official: svelte/compiler compile() with runes=auto. Generated fixtures force runes; real-world sources use compiler auto-detection.
- MrWaip: @mrwaip/svelte-rs native compiler through its compatible compile() API, validated against the same latest Svelte runtime and official baseline as every other compiler.
- rsvelte: WASM (@rsvelte/compiler) and NAPI (@rsvelte/vite-plugin-svelte-native) paths are separate rows against the same official Svelte baseline.
- Verter's published compileMany runtime-render path receives the same revised Svelte inputs with stateless caching and one CPU thread. Completed passes publish warm/fresh timings even when their code is invalid or entries contain compile errors. They are permanently unranked diagnostic evidence until the adapter is validated; errors, output samples, revision-token failures and runtime-plant verdicts are retained. Only a missing API/package is skipped; a thrown batch failure is an error.
- Every warmed/fresh pass compiles a REVISED corpus: a fixed-width comment token plus a used CSS custom-property rule. The timed loop asserts the token reached the emitted CSS, so a cached whole-output result from a previous pass fails the gate. Adapter parity additionally requires every warm and fresh pass to have received a distinct input revision.
- Every compiler must return one non-empty code artifact per input file, emit the expected Svelte client/server runtime import, and remove Svelte runes; aggregate byte totals alone are not accepted as proof of coverage.
- Fresh child = the first timed row workload in a NEW child process, after excluded Node startup, package imports, adapter construction and input materialisation. It is NOT machine-cold (OS page cache is not flushed) and its ratio never substitutes for the warm verdict.
- Source maps: every compared Svelte 5 compiler ALWAYS emits js.map/css.map from compile() (no off/on flag exists — the 'sourcemap' option is a chained-map INPUT), so an off/on matrix would measure the harness, not the tools. Instead the maps' COORDINATE CORRECTNESS gates every row: anchored tokens in generated JS/CSS must trace back to their exact source positions (segment fallback allowed, exact line/column required, sourcesContent equal to the full component), across LF/CRLF and non-BMP-shifted columns. Wrong-file, shifted, stale or byte-counted maps unrank the row.
- Runtime semantic validity: a 28-plant Svelte 5 suite (props/state/derived/bindable/bindings/events/each-keyed/await/snippets/stores/actions/context/dynamic components/{@html}/SVG/module script/legacy syntax + CSS semantics) runs per entrypoint per cell in isolated child processes after timing; non-PASS rows unrank, and a failed official reference unranks every candidate in the comparison (no survivor promotion).
- Tool order is rotated on every warmup and measured run. A row is unranked unless the measured runs cover every active execution position; ranking metric is the median of warmed runs.

</details>

### Svelte TypeScript projection

Files: **650** · Bytes: **3,612,860**

Corpus: open-webui:app @ v0.11.0 (f9590b80, released/committed 2026-07-27) · 650 SFCs · app-source · Open WebUI License

Tools:

- **svelte2tsx** — Official Svelte-to-TSX projection from sveltejs/language-tools.
- **@rsvelte/svelte2tsx (Wasm)** — rsvelte Rust/Wasm drop-in Svelte-to-TSX projection.
- **Verter IDE projection** — VerterHost ensureIdeCompiled/getIde Svelte projection; separate schema from svelte2tsx.

##### SVELTE2TSX-COMPATIBLE — separate workload

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-open-webui-real-world-linux-open-webui-projection-pro-110xcq4-dark.svg">
  <img src="charts/real-world-open-webui-real-world-linux-open-webui-projection-pro-110xcq4.svg" alt="Svelte TypeScript projection — SVELTE2TSX-COMPATIBLE" width="760">
</picture>

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | TSX bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @rsvelte/svelte2tsx (Wasm) | 650 | **520.8 ms** | 516.1 ms | 5.1 ms | 1.0% | 1.00x | 4,963,608 | n/a | 1.2k files/s |
| svelte2tsx | 650 | **1.96 s** | 1.93 s | 35.3 ms | 1.8% | 3.76x | 4,963,608 | n/a | 332 files/s |

<details><summary>Notes</summary>

- **@rsvelte/svelte2tsx (Wasm)**: Rust/Wasm drop-in; TypeScript-printer structural parity against official output | gate: ✓ 650/650 valid TSX outputs
- **svelte2tsx**: Official svelte2tsx, Svelte 5 TS projection | gate: ✓ 650/650 valid TSX outputs

</details>

##### VERTER-IDE-PROJECTION — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Projection bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter IDE projection ❌ | 650 | error | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Verter IDE projection ❌**: HostError: scheduler error: stage Source failed for /home/runner/work/svelte-benchmarks/svelte-benchmarks/work-real/open-webui/projection/corpus-o4FEQA/00000--AddConnectionModal.svelte: carrier publication did not admit

</details>

<details><summary>Methodology</summary>

- This is the type-analysis projection used by Svelte-aware TypeScript tooling; it is not runtime compilation or component documentation.
- The svelte2tsx-compatible rows use the synchronous in-process API with identical Svelte 5 options and file order.
- Every output must parse as TSX and contain tool-specific Svelte projection helpers.
- The rsvelte row must match official output after TypeScript parses and reprints both outputs, ignoring formatting-only whitespace while retaining syntax and comments.
- Verter's ensureIdeCompiled/getIde output is a genuine Svelte IDE projection, but its carrier and helper contract differ from svelte2tsx; it is therefore measured in a separate comparison class.

Raw runs:

- **@rsvelte/svelte2tsx (Wasm)**: 528.5 ms, 517.5 ms, 524.4 ms, 520.8 ms, 516.1 ms
- **svelte2tsx**: 2.01 s, 2.00 s, 1.96 s, 1.94 s, 1.93 s

</details>

### Format

Files: **650** · Bytes: **3,612,860**

Corpus: open-webui:app @ v0.11.0 (f9590b80, released/committed 2026-07-27) · 650 SFCs · app-source · Open WebUI License

Tools:

- **Prettier** — prettier --write with prettier-plugin-svelte over a fresh corpus copy.
- **rsvelte-fmt** — @rsvelte/fmt — Rust formatter for .svelte.
- **Oxfmt** — Oxc formatter; skipped because the pinned release excludes .svelte files.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-open-webui-real-world-linux-open-webui-format-format-all-dark.svg">
  <img src="charts/real-world-open-webui-real-world-linux-open-webui-format-format-all.svg" alt="Format" width="760">
</picture>

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Prettier | 650 | **16.03 s** | 15.91 s | 89.0 ms | 0.6% | — | n/a | n/a | — |
| rsvelte-fmt ❌ | 650 | error | – | – | – | – | – | – | – |
| Oxfmt ⏭ | 650 | skipped | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Prettier**: prettier --write **/*.svelte with prettier-plugin-svelte · single-threaded | ⓘ file coverage verified: rewrote 650/650 Svelte files.
- **rsvelte-fmt ❌**: /home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.bin/rsvelte-fmt . exited with 2 No files found matching the given patterns. rsvelte-fmt: /home/runner/work/svelte-benchmarks/svelte-benchmarks/work-real/open-webui/format/work/format/rsvelte-fmt-12/00106--Embeds.svelte: rsvelte_formatter error: script parse failed: Diagnostics([OxcDiagnostic { inner: OxcDiagnosticInner { message: "A required parameter cannot follow an optional parameter.", labels: [LabeledSpan { label: None, span: Span { start: 304, end: 320 }, primary: false }], help: None, note: None, severity: Error, code: OxcCode { scope: Some("TS"), number: Some("1016") }, url: None } }]) rsvelte-fmt: formatted 648 / 651 files
- **Oxfmt ⏭**: Pinned Oxfmt release excludes .svelte files; no CLI-startup proxy is timed.

</details>

<details><summary>Methodology</summary>

- Every timed invocation receives a fresh copy of the same Svelte corpus.
- All rows are CLI invocations; any non-zero exit is an operational failure and cannot rank, even if some files changed first.
- A nested markup-rewrite plant fails tools that no-op, format only &lt;script>, or use a non-recursive file pattern.
- An untimed coverage census dirties every Svelte file; a tool that rewrites fewer than the full corpus is measured but unranked.
- Output style is not normalized — this measures whole-SFC format throughput, not byte identity.
- Tool order is rotated; ranking metric is the median of warmed runs.

Raw runs:

- **Prettier**: 16.15 s, 16.03 s, 16.03 s, 15.91 s, 16.09 s

</details>

### Lint

Files: **650** · Bytes: **3,612,860**

Corpus: open-webui:app @ v0.11.0 (f9590b80, released/committed 2026-07-27) · 650 SFCs · app-source · Open WebUI License

Tools:

- **eslint-plugin-svelte (1T API)** — ESLint API + eslint-plugin-svelte recommended rules, single-threaded.
- **eslint-plugin-svelte (worker pool)** — ESLint API + eslint-plugin-svelte recommended rules, split across worker threads.
- **eslint-plugin-svelte (CLI)** — ESLint CLI + eslint-plugin-svelte recommended rules.
- **rsvelte-lint** — @rsvelte/lint — Rust Svelte linter.
- **Verter host lint** — VerterHost lint/diagnostics API with fileKind=svelte; experimental and gated on the {@html} diagnostic.

##### ESLINT-RECOMMENDED-RULES — separate workload

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-open-webui-real-world-linux-open-webui-lint-lint-clas-1gxzjl0-dark.svg">
  <img src="charts/real-world-open-webui-real-world-linux-open-webui-lint-lint-clas-1gxzjl0.svg" alt="Lint — ESLINT-RECOMMENDED-RULES" width="760">
</picture>

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| eslint-plugin-svelte (1T API) | 650 | **18.29 s** | 17.72 s | 1.09 s | 6.0% | 1.00x | n/a | n/a | 36 files/s |
| eslint-plugin-svelte (worker pool) | 650 | **18.90 s** | 18.32 s | 707.0 ms | 3.7% | 1.03x | n/a | n/a | 34 files/s |
| eslint-plugin-svelte (CLI) | 650 | **19.55 s** | 19.14 s | 896.2 ms | 4.6% | 1.07x | n/a | n/a | 33 files/s |

<details><summary>Notes</summary>

- **eslint-plugin-svelte (1T API)**: ESLint flat config + eslint-plugin-svelte recommended; explicit file list | ⓘ file coverage by construction: the invocation receives all 650 corpus files as an explicit list.
- **eslint-plugin-svelte (worker pool)**: ESLint worker_threads fan-out; explicit file list | ⓘ file coverage by construction: the invocation receives all 650 corpus files as an explicit list.
- **eslint-plugin-svelte (CLI)**: eslint . over the same isolated corpus; pays startup and config load | ⓘ file coverage verified: named 650/650 planted Svelte files.

</details>

##### RSVELTE-NATIVE-RULES — separate workload

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-open-webui-real-world-linux-open-webui-lint-lint-clas-0liko6s-dark.svg">
  <img src="charts/real-world-open-webui-real-world-linux-open-webui-lint-lint-clas-0liko6s.svg" alt="Lint — RSVELTE-NATIVE-RULES" width="760">
</picture>

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| rsvelte-lint | 650 | **1.70 s** | 1.58 s | 117.3 ms | 6.9% | — | n/a | n/a | — |

<details><summary>Notes</summary>

- **rsvelte-lint**: rsvelte-lint . (Rust linter) | ⓘ file coverage verified: named 650/650 planted Svelte files.

</details>

##### VERTER-NATIVE-DIAGNOSTICS — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter host lint ❌ | 650 | error | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Verter host lint ❌**: HostError: scheduler error: stage Source failed for /home/runner/work/svelte-benchmarks/svelte-benchmarks/work-real/open-webui/lint/work/lint/n650/00000--AddConnectionModal.svelte: carrier publication did not admit

</details>

<details><summary>Methodology</summary>

- Every tool receives the same isolated Svelte corpus.
- A planted {@html} issue must be reported; missing the template rule leaves the time visible but unranked.
- An untimed file-coverage census requires each directory-walk CLI to name every planted corpus file; explicit-list APIs are exact by construction.
- ESLint is measured in single-threaded API, worker-pool API, and CLI modes so invocation and thread-count costs remain visible.
- Rule sets are not identical, so ESLint recommended rules, rsvelte native rules, and Verter diagnostics are separate workload classes. The shared planted gate establishes minimum work but never cross-engine equivalence.
- Tool order is rotated; ranking metric is the median of warmed runs.

Raw runs:

- **eslint-plugin-svelte (1T API)**: 18.29 s, 17.97 s, 20.20 s, 19.64 s, 17.72 s
- **eslint-plugin-svelte (worker pool)**: 18.90 s, 18.62 s, 20.11 s, 19.43 s, 18.32 s
- **eslint-plugin-svelte (CLI)**: 20.32 s, 19.26 s, 21.29 s, 19.55 s, 19.14 s
- **rsvelte-lint**: 1.70 s, 1.58 s, 1.83 s, 1.84 s, 1.62 s

</details>


## platform

- **Generated:** 2026-09-29T12:59:49.588Z
- **Fixture:** `pinned real-world Svelte source checkouts` (2462 Svelte files)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · AMD EPYC 7763 64-Core Processor · 16 GB RAM · Node v22.23.2
- **Commit:** [1bc177a](https://github.com/pikax/svelte-benchmarks/commit/1bc177a)
- **CI run:** https://github.com/pikax/svelte-benchmarks/actions/runs/36569517081
- **Source:** `real-world-Linux-platform.json`

Corpus: platform:workspace

### SFC compile (unique contents)

Files: **2,432** · Bytes: **7,859,391**

Corpus: platform:workspace @ v0.7.426 (ccefccd8, released/committed 2026-07-05) · 2462 SFCs · app-source · EPL-2.0

Surface scope: **2432/2462** files · 30 excluded before timing because an applicable official reference API rejected the raw, unpreprocessed source. The identical accepted set is used for every row.

Tools:

- **svelte/compiler 5.57.1** — Official svelte/compiler compile() API, single-threaded.
- **@mrwaip/svelte-rs (NAPI)** — MrWaip/svelte-rs native compiler through its svelte/compiler-compatible API.
- **@rsvelte/compiler (wasm)** — rsvelte WASM compiler bindings.
- **@rsvelte/native (NAPI)** — rsvelte native NAPI compiler (@rsvelte/vite-plugin-svelte-native).
- **Verter (stateless)** — VerterHost.compileMany without cross-run cache; experimental Svelte carrier.

Validation (runtime semantic plants):

Suite 2026-09-12.2 · hash 451381a17402 · 2 cell(s)

| Cell | Status | Entrypoint verdicts |
| --- | --- | --- |
| client/production/source-map-off | FAIL | svelte-official: PASS · mrwaip-svelte-rs: FAIL · rsvelte-wasm: FAIL · rsvelte-native: FAIL · verter-svelte: FAIL |
| server/production/source-map-off | FAIL | svelte-official: PASS · mrwaip-svelte-rs: FAIL · rsvelte-wasm: PASS · rsvelte-native: PASS · verter-svelte: FAIL |

Compile results are **grouped by target × environment**, then by comparison class.

#### CLIENT · production

Target: `client` · Environment: `production`

##### EXPERIMENTAL-SVELTE — separate workload

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-platform-real-world-linux-platform-compile-client-pro-0bc8mgv-dark.svg">
  <img src="charts/real-world-platform-real-world-linux-platform-compile-client-pro-0bc8mgv.svg" alt="Compiler — CLIENT · production · EXPERIMENTAL-SVELTE" width="760">
</picture>

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter (stateless) ⚠ | 2,432 | (1.60 s) | not ranked | (1.68 s) | (1.67 s) | – | – | not ranked | (0) | n/a | – |

<details><summary>Notes</summary>

- **Verter (stateless) ⚠**: VerterHost.compileMany(target=runtime-render, mode=stateless, 1 CPU thread) on the same revised Svelte inputs. Diagnostic timing only: the published path is not validated as a Svelte runtime compiler; invalid/empty output and per-file errors are retained, never ranked. | output gate: FAIL — returned empty JavaScript; 2432/2432 entries, 2432 compile errors, 2432 entries missing the CSS revision token; first error: [00000--Kanban.svelte] host error: runtime surface refused for '00000--Kanban.svelte': svelte-runtime-style-stage-requires-plain-css: Svelte client emission does not yet support a `&lt;style>` css construct the scoping analysis cannot parse or | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ RUNTIME SEMANTIC VALIDITY FAIL (4/33 plants) — state-derived-update (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-advanced-rune: Svelte client emission does not yet support the `$derived` rune form.; bindable-prop (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-advanced-rune: Svelte client emission does not yet support the `$props() non-interpolation usage` rune form.; callback-prop-events (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-non-delegated-event: Svelte client emission does not yet support the non-delegated / capture / global event `click`.

</details>

##### Svelte runtime

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte/compiler 5.57.1 ❌ | 2,432 | error | – | – | – | – | – | – | – |
| @mrwaip/svelte-rs (NAPI) ❌ | 2,432 | error | – | – | – | – | – | – | – |
| @rsvelte/compiler (wasm) ❌ | 2,432 | error | – | – | – | – | – | – | – |
| @rsvelte/native (NAPI) ❌ | 2,432 | error | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **svelte/compiler 5.57.1 ❌**: output-cache gate: pass revision token missing from emitted CSS for 00554--Calendar.svelte — the compiler did not process this pass's input
- **@mrwaip/svelte-rs (NAPI) ❌**: output-cache gate: pass revision token missing from emitted CSS for 00554--Calendar.svelte — the compiler did not process this pass's input
- **@rsvelte/compiler (wasm) ❌**: output-cache gate: pass revision token missing from emitted CSS for 00554--Calendar.svelte — the compiler did not process this pass's input
- **@rsvelte/native (NAPI) ❌**: output-cache gate: pass revision token missing from emitted CSS for 00554--Calendar.svelte — the compiler did not process this pass's input

</details>

<details><summary>Raw runs</summary>

- **Verter (stateless)**: 1.67 s, 1.67 s, 1.68 s, 1.68 s, 1.68 s · fresh child: 1.64 s, 1.60 s, 1.61 s, 1.60 s, 1.60 s

</details>

#### SERVER · production

Target: `server` · Environment: `production`

##### EXPERIMENTAL-SVELTE — separate workload

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-platform-real-world-linux-platform-compile-server-pro-11k1iub-dark.svg">
  <img src="charts/real-world-platform-real-world-linux-platform-compile-server-pro-11k1iub.svg" alt="Compiler — SERVER · production · EXPERIMENTAL-SVELTE" width="760">
</picture>

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter (stateless) ⚠ | 2,432 | (832.8 ms) | not ranked | (903.6 ms) | (890.7 ms) | – | – | not ranked | (0) | n/a | – |

<details><summary>Notes</summary>

- **Verter (stateless) ⚠**: VerterHost.compileMany(target=runtime-render, mode=stateless, 1 CPU thread) on the same revised Svelte inputs. Diagnostic timing only: the published path is not validated as a Svelte runtime compiler; invalid/empty output and per-file errors are retained, never ranked. | output gate: FAIL — returned empty JavaScript; 2432/2432 entries, 2432 compile errors, 2432 entries missing the CSS revision token; first error: [00000--Kanban.svelte] host error: runtime surface refused for '00000--Kanban.svelte': svelte-runtime-unsupported-server-generate: Svelte client emission does not yet support server-side rendering (`generate: 'server'`). | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ RUNTIME SEMANTIC VALIDITY FAIL (0/33 plants) — props-defaults-interpolation (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-server-generate: Svelte client emission does not yet support server-side rendering (`generate: 'server'`).; state-derived-update (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-server-generate: Svelte client emission does not yet support server-side rendering (`generate: 'server'`).; bindable-prop (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-server-generate: Svelte client emission does not yet support server-side rendering (`generate: 'server'`).

</details>

##### Svelte runtime

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte/compiler 5.57.1 ❌ | 2,432 | error | – | – | – | – | – | – | – |
| @mrwaip/svelte-rs (NAPI) ❌ | 2,432 | error | – | – | – | – | – | – | – |
| @rsvelte/compiler (wasm) ❌ | 2,432 | error | – | – | – | – | – | – | – |
| @rsvelte/native (NAPI) ❌ | 2,432 | error | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **svelte/compiler 5.57.1 ❌**: output-cache gate: pass revision token missing from emitted CSS for 00554--Calendar.svelte — the compiler did not process this pass's input
- **@mrwaip/svelte-rs (NAPI) ❌**: output-cache gate: pass revision token missing from emitted CSS for 00554--Calendar.svelte — the compiler did not process this pass's input
- **@rsvelte/compiler (wasm) ❌**: output-cache gate: pass revision token missing from emitted CSS for 00554--Calendar.svelte — the compiler did not process this pass's input
- **@rsvelte/native (NAPI) ❌**: output-cache gate: pass revision token missing from emitted CSS for 00554--Calendar.svelte — the compiler did not process this pass's input

</details>

<details><summary>Raw runs</summary>

- **Verter (stateless)**: 890.7 ms, 894.6 ms, 916.0 ms, 903.6 ms, 920.9 ms · fresh child: 832.8 ms, 825.0 ms, 831.6 ms, 848.7 ms, 850.5 ms

</details>

<details><summary>Methodology</summary>

- Matrix: generate ∈ {client, server} × env ∈ {production, development} × source-map ∈ {off, on} (off by default).
- Every compiler receives the same in-memory Svelte SFC corpus. The latest official Svelte compiler is the sole reference and decides real-world eligibility for every tool.
- Official: svelte/compiler compile() with runes=auto. Generated fixtures force runes; real-world sources use compiler auto-detection.
- MrWaip: @mrwaip/svelte-rs native compiler through its compatible compile() API, validated against the same latest Svelte runtime and official baseline as every other compiler.
- rsvelte: WASM (@rsvelte/compiler) and NAPI (@rsvelte/vite-plugin-svelte-native) paths are separate rows against the same official Svelte baseline.
- Verter's published compileMany runtime-render path receives the same revised Svelte inputs with stateless caching and one CPU thread. Completed passes publish warm/fresh timings even when their code is invalid or entries contain compile errors. They are permanently unranked diagnostic evidence until the adapter is validated; errors, output samples, revision-token failures and runtime-plant verdicts are retained. Only a missing API/package is skipped; a thrown batch failure is an error.
- Every warmed/fresh pass compiles a REVISED corpus: a fixed-width comment token plus a used CSS custom-property rule. The timed loop asserts the token reached the emitted CSS, so a cached whole-output result from a previous pass fails the gate. Adapter parity additionally requires every warm and fresh pass to have received a distinct input revision.
- Every compiler must return one non-empty code artifact per input file, emit the expected Svelte client/server runtime import, and remove Svelte runes; aggregate byte totals alone are not accepted as proof of coverage.
- Fresh child = the first timed row workload in a NEW child process, after excluded Node startup, package imports, adapter construction and input materialisation. It is NOT machine-cold (OS page cache is not flushed) and its ratio never substitutes for the warm verdict.
- Source maps: every compared Svelte 5 compiler ALWAYS emits js.map/css.map from compile() (no off/on flag exists — the 'sourcemap' option is a chained-map INPUT), so an off/on matrix would measure the harness, not the tools. Instead the maps' COORDINATE CORRECTNESS gates every row: anchored tokens in generated JS/CSS must trace back to their exact source positions (segment fallback allowed, exact line/column required, sourcesContent equal to the full component), across LF/CRLF and non-BMP-shifted columns. Wrong-file, shifted, stale or byte-counted maps unrank the row.
- Runtime semantic validity: a 28-plant Svelte 5 suite (props/state/derived/bindable/bindings/events/each-keyed/await/snippets/stores/actions/context/dynamic components/{@html}/SVG/module script/legacy syntax + CSS semantics) runs per entrypoint per cell in isolated child processes after timing; non-PASS rows unrank, and a failed official reference unranks every candidate in the comparison (no survivor promotion).
- Tool order is rotated on every warmup and measured run. A row is unranked unless the measured runs cover every active execution position; ranking metric is the median of warmed runs.

</details>

### Svelte TypeScript projection

Files: **2,456** · Bytes: **8,151,670**

Corpus: platform:workspace @ v0.7.426 (ccefccd8, released/committed 2026-07-05) · 2462 SFCs · app-source · EPL-2.0

Surface scope: **2456/2462** files · 6 excluded before timing because an applicable official reference API rejected the raw, unpreprocessed source. The identical accepted set is used for every row.

Tools:

- **svelte2tsx** — Official Svelte-to-TSX projection from sveltejs/language-tools.
- **@rsvelte/svelte2tsx (Wasm)** — rsvelte Rust/Wasm drop-in Svelte-to-TSX projection.
- **Verter IDE projection** — VerterHost ensureIdeCompiled/getIde Svelte projection; separate schema from svelte2tsx.

##### SVELTE2TSX-COMPATIBLE — separate workload

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-platform-real-world-linux-platform-projection-project-0pdb814-dark.svg">
  <img src="charts/real-world-platform-real-world-linux-platform-projection-project-0pdb814.svg" alt="Svelte TypeScript projection — SVELTE2TSX-COMPATIBLE" width="760">
</picture>

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | TSX bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @rsvelte/svelte2tsx (Wasm) | 2,456 | **1.02 s** | 1.02 s | 3.3 ms | 0.3% | 1.00x | 10,283,742 | n/a | 2.4k files/s |
| svelte2tsx | 2,456 | **3.84 s** | 3.83 s | 28.9 ms | 0.8% | 3.75x | 10,283,705 | n/a | 639 files/s |

<details><summary>Notes</summary>

- **@rsvelte/svelte2tsx (Wasm)**: Rust/Wasm drop-in; TypeScript-printer structural parity against official output | gate: ✓ 2456/2456 valid TSX outputs
- **svelte2tsx**: Official svelte2tsx, Svelte 5 TS projection | gate: ✓ 2456/2456 valid TSX outputs

</details>

##### VERTER-IDE-PROJECTION — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Projection bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter IDE projection ❌ | 2,456 | error | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Verter IDE projection ❌**: HostError: scheduler error: stage Source failed for /home/runner/work/svelte-benchmarks/svelte-benchmarks/work-real/platform/projection/corpus-k2mcpY/00009--DocPopup.svelte: carrier publication did not admit

</details>

<details><summary>Methodology</summary>

- This is the type-analysis projection used by Svelte-aware TypeScript tooling; it is not runtime compilation or component documentation.
- The svelte2tsx-compatible rows use the synchronous in-process API with identical Svelte 5 options and file order.
- Every output must parse as TSX and contain tool-specific Svelte projection helpers.
- The rsvelte row must match official output after TypeScript parses and reprints both outputs, ignoring formatting-only whitespace while retaining syntax and comments.
- Verter's ensureIdeCompiled/getIde output is a genuine Svelte IDE projection, but its carrier and helper contract differ from svelte2tsx; it is therefore measured in a separate comparison class.

Raw runs:

- **@rsvelte/svelte2tsx (Wasm)**: 1.03 s, 1.02 s, 1.02 s, 1.03 s, 1.02 s
- **svelte2tsx**: 3.90 s, 3.84 s, 3.86 s, 3.83 s, 3.84 s

</details>

### Format

Files: **2,462** · Bytes: **8,184,534**

Corpus: platform:workspace @ v0.7.426 (ccefccd8, released/committed 2026-07-05) · 2462 SFCs · app-source · EPL-2.0

Tools:

- **Prettier** — prettier --write with prettier-plugin-svelte over a fresh corpus copy.
- **rsvelte-fmt** — @rsvelte/fmt — Rust formatter for .svelte.
- **Oxfmt** — Oxc formatter; skipped because the pinned release excludes .svelte files.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-platform-real-world-linux-platform-format-format-all-dark.svg">
  <img src="charts/real-world-platform-real-world-linux-platform-format-format-all.svg" alt="Format" width="760">
</picture>

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| rsvelte-fmt | 2,462 | **675.1 ms** | 667.3 ms | 7.7 ms | 1.1% | 1.00x | n/a | n/a | 3.6k files/s |
| Prettier | 2,462 | **38.75 s** | 38.57 s | 348.8 ms | 0.9% | 57.39x | n/a | n/a | 64 files/s |
| Oxfmt ⏭ | 2,462 | skipped | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **rsvelte-fmt**: rsvelte-fmt . (Rust); may route embedded JS/TS/CSS through other formatters | ⓘ file coverage verified: rewrote 2462/2462 Svelte files.
- **Prettier**: prettier --write **/*.svelte with prettier-plugin-svelte · single-threaded | ⓘ file coverage verified: rewrote 2462/2462 Svelte files.
- **Oxfmt ⏭**: Pinned Oxfmt release excludes .svelte files; no CLI-startup proxy is timed.

</details>

<details><summary>Methodology</summary>

- Every timed invocation receives a fresh copy of the same Svelte corpus.
- All rows are CLI invocations; any non-zero exit is an operational failure and cannot rank, even if some files changed first.
- A nested markup-rewrite plant fails tools that no-op, format only &lt;script>, or use a non-recursive file pattern.
- An untimed coverage census dirties every Svelte file; a tool that rewrites fewer than the full corpus is measured but unranked.
- Output style is not normalized — this measures whole-SFC format throughput, not byte identity.
- Tool order is rotated; ranking metric is the median of warmed runs.

Raw runs:

- **rsvelte-fmt**: 673.6 ms, 688.4 ms, 667.3 ms, 675.1 ms, 675.5 ms
- **Prettier**: 39.43 s, 39.01 s, 38.65 s, 38.57 s, 38.75 s

</details>

### Lint

Files: **2,462** · Bytes: **8,184,534**

Corpus: platform:workspace @ v0.7.426 (ccefccd8, released/committed 2026-07-05) · 2462 SFCs · app-source · EPL-2.0

Tools:

- **eslint-plugin-svelte (1T API)** — ESLint API + eslint-plugin-svelte recommended rules, single-threaded.
- **eslint-plugin-svelte (worker pool)** — ESLint API + eslint-plugin-svelte recommended rules, split across worker threads.
- **eslint-plugin-svelte (CLI)** — ESLint CLI + eslint-plugin-svelte recommended rules.
- **rsvelte-lint** — @rsvelte/lint — Rust Svelte linter.
- **Verter host lint** — VerterHost lint/diagnostics API with fileKind=svelte; experimental and gated on the {@html} diagnostic.

##### ESLINT-RECOMMENDED-RULES — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| eslint-plugin-svelte (1T API) ❌ | 2,462 | error | – | – | – | – | – | – | – |
| eslint-plugin-svelte (worker pool) ❌ | 2,462 | error | – | – | – | – | – | – | – |
| eslint-plugin-svelte (CLI) ❌ | 2,462 | error | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **eslint-plugin-svelte (1T API) ❌**: source.isSpaceBetweenTokens is not a function Occurred while linting /home/runner/work/svelte-benchmarks/svelte-benchmarks/work-real/platform/lint/work/lint/n2462/00154--PopupInstance.svelte:39 Rule: "svelte/no-reactive-functions"
- **eslint-plugin-svelte (worker pool) ❌**: TypeError: source.isSpaceBetweenTokens is not a function Occurred while linting /home/runner/work/svelte-benchmarks/svelte-benchmarks/work-real/platform/lint/work/lint/n2462/00154--PopupInstance.svelte:39 Rule: "svelte/no-reactive-functions"     at Object.fix (file:///home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint-plugin-svelte@3.23.0_eslint@10.11.0_svelte@5.57.1_@typescript-eslint+types@8.71.0_/node_modules/eslint-plugin-svelte/lib/rules/no-reactive-functions.js:48:61)     at normalizeFixes (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.11.0/node_modules/eslint/lib/linter/file-report.js:307:25)     at /home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.11.0/node_modules/eslint/lib/linter/file-report.js:340:11     at Array.map (<anonymous>)     at mapSuggestions (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.11.0/node_modules/eslint/lib/linter/file-report.js:333:5)     at FileReport.addRuleMessage (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.11.0/node_modules/eslint/lib/linter/file-report.js:581:7)     at FileContext.report (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.11.0/node_modules/eslint/lib/linter/linter.js:588:28)     at SvelteReactiveStatement > ExpressionStatement > AssignmentExpression > :function (file:///home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint-plugin-svelte@3.23.0_eslint@10.11.0_svelte@5.57.1_@typescript-eslint+types@8.71.0_/node_modules/eslint-plugin-svelte/lib/rules/no-reactive-functions.js:36:32)     at SourceCodeVisitor.callSync (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.11.0/node_modules/eslint/lib/linter/source-code-visitor.js:158:6)     at applyStep (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.11.0/node_modules/eslint/lib/linter/source-code-traverser.js:332:17)
- **eslint-plugin-svelte (CLI) ❌**: /home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.bin/eslint . exited with 2 Oops! Something went wrong! :(  ESLint: 10.11.0  TypeError: source.isSpaceBetweenTokens is not a function Occurred while linting /home/runner/work/svelte-benchmarks/svelte-benchmarks/work-real/platform/lint/work/lint/n2462/00154--PopupInstance.svelte:39 Rule: "svelte/no-reactive-functions"     at Object.fix (file:///home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint-plugin-svelte@3.23.0_eslint@10.11.0_svelte@5.57.1_@typescript-eslint+types@8.71.0_/node_modules/eslint-plugin-svelte/lib/rules/no-reactive-functions.js:48:61)     at normalizeFixes (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.11.0/node_modules/eslint/lib/linter/file-report.js:307:25)     at /home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.11.0/node_modules/eslint/lib/linter/file-report.js:340:11     at Array.map (<anonymous>)     at mapSuggestions (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.11.0/node_modules/eslint/lib/linter/file-report.js:333:5)     at FileReport.addRuleMessage (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.11.0/node_modules/eslint/lib/linter/file-report.js:581:7)     at FileContext.report (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.11.0/node_modules/eslint/lib/linter/linter.js:588:28)     at SvelteReactiveStatement > ExpressionStatement > AssignmentExpression > :function (file:///home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint-plugin-svelte@3.23.0_eslint@10.11.0_svelte@5.57.1_@typescript-eslint+types@8.71.0_/node_modules/eslint-plugin-svelte/lib/rules/no-reactive-functions.js:36:32)     at SourceCodeVisitor.callSync (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.11.0/node_modules/eslint/lib/linter/source-code-visitor.js:158:6)     at applyStep (/home/runner/work/svelte-benchmarks/svelte-benchmarks/node_modules/.pnpm/eslint@10.11.0/node_modules/eslint/lib/linter/source-code-traverser.js:332:17)

</details>

##### RSVELTE-NATIVE-RULES — separate workload

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-platform-real-world-linux-platform-lint-lint-class-rs-0eec7c8-dark.svg">
  <img src="charts/real-world-platform-real-world-linux-platform-lint-lint-class-rs-0eec7c8.svg" alt="Lint — RSVELTE-NATIVE-RULES" width="760">
</picture>

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| rsvelte-lint | 2,462 | **8.70 s** | 3.94 s | 2.12 s | 24.4% ⚠ | — | n/a | n/a | — |

<details><summary>Notes</summary>

- **rsvelte-lint**: rsvelte-lint . (Rust linter) | ⓘ file coverage verified: named 2462/2462 planted Svelte files.

</details>

##### VERTER-NATIVE-DIAGNOSTICS — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter host lint ❌ | 2,462 | error | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Verter host lint ❌**: HostError: scheduler error: stage Source failed for /home/runner/work/svelte-benchmarks/svelte-benchmarks/work-real/platform/lint/work/lint/n2462/00009--DocPopup.svelte: carrier publication did not admit

</details>

<details><summary>Methodology</summary>

- Every tool receives the same isolated Svelte corpus.
- A planted {@html} issue must be reported; missing the template rule leaves the time visible but unranked.
- An untimed file-coverage census requires each directory-walk CLI to name every planted corpus file; explicit-list APIs are exact by construction.
- ESLint is measured in single-threaded API, worker-pool API, and CLI modes so invocation and thread-count costs remain visible.
- Rule sets are not identical, so ESLint recommended rules, rsvelte native rules, and Verter diagnostics are separate workload classes. The shared planted gate establishes minimum work but never cross-engine equivalence.
- Tool order is rotated; ranking metric is the median of warmed runs.

Raw runs:

- **rsvelte-lint**: 8.91 s, 8.70 s, 3.94 s, 8.72 s, 8.29 s

</details>


## smui

- **Generated:** 2026-09-29T12:51:20.863Z
- **Fixture:** `pinned real-world Svelte source checkouts` (126 Svelte files)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · AMD EPYC 7763 64-Core Processor · 16 GB RAM · Node v22.23.2
- **Commit:** [1bc177a](https://github.com/pikax/svelte-benchmarks/commit/1bc177a)
- **CI run:** https://github.com/pikax/svelte-benchmarks/actions/runs/36569517081
- **Source:** `real-world-Linux-smui.json`

Corpus: smui:components

### SFC compile (unique contents)

Files: **126** · Bytes: **530,360**

Corpus: smui:components @ v9.0.1 (8d204fe8, released/committed 2026-06-02) · 126 SFCs · library-source · Apache-2.0

Tools:

- **svelte/compiler 5.57.1** — Official svelte/compiler compile() API, single-threaded.
- **@mrwaip/svelte-rs (NAPI)** — MrWaip/svelte-rs native compiler through its svelte/compiler-compatible API.
- **@rsvelte/compiler (wasm)** — rsvelte WASM compiler bindings.
- **@rsvelte/native (NAPI)** — rsvelte native NAPI compiler (@rsvelte/vite-plugin-svelte-native).
- **Verter (stateless)** — VerterHost.compileMany without cross-run cache; experimental Svelte carrier.

Validation (runtime semantic plants):

Suite 2026-09-12.2 · hash 451381a17402 · 2 cell(s)

| Cell | Status | Entrypoint verdicts |
| --- | --- | --- |
| client/production/source-map-off | FAIL | svelte-official: PASS · mrwaip-svelte-rs: FAIL · rsvelte-wasm: FAIL · rsvelte-native: FAIL · verter-svelte: FAIL |
| server/production/source-map-off | FAIL | svelte-official: PASS · mrwaip-svelte-rs: FAIL · rsvelte-wasm: PASS · rsvelte-native: PASS · verter-svelte: FAIL |

Compile results are **grouped by target × environment**, then by comparison class.

#### CLIENT · production

Target: `client` · Environment: `production`

##### EXPERIMENTAL-SVELTE — separate workload

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-smui-real-world-linux-smui-compile-client-prod-class--1g0llnj-dark.svg">
  <img src="charts/real-world-smui-real-world-linux-smui-compile-client-prod-class--1g0llnj.svg" alt="Compiler — CLIENT · production · EXPERIMENTAL-SVELTE" width="760">
</picture>

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter (stateless) ⚠ | 126 | (182.4 ms) | not ranked | (185.8 ms) | (179.6 ms) | – | – | not ranked | (0) | n/a | – |

<details><summary>Notes</summary>

- **Verter (stateless) ⚠**: VerterHost.compileMany(target=runtime-render, mode=stateless, 1 CPU thread) on the same revised Svelte inputs. Diagnostic timing only: the published path is not validated as a Svelte runtime compiler; invalid/empty output and per-file errors are retained, never ranked. | output gate: FAIL — returned empty JavaScript; 126/126 entries, 126 compile errors, 126 entries missing the CSS revision token; first error: [00000--Accordion.svelte] host error: runtime surface refused for '00000--Accordion.svelte': svelte-runtime-unsupported-binding: Svelte client emission does not yet support the `bind:this` binding. | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ RUNTIME SEMANTIC VALIDITY FAIL (4/33 plants) — state-derived-update (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-advanced-rune: Svelte client emission does not yet support the `$derived` rune form.; bindable-prop (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-advanced-rune: Svelte client emission does not yet support the `$props() non-interpolation usage` rune form.; callback-prop-events (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-non-delegated-event: Svelte client emission does not yet support the non-delegated / capture / global event `click`.

</details>

##### Svelte runtime

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-smui-real-world-linux-smui-compile-client-prod-class-svelte-dark.svg">
  <img src="charts/real-world-smui-real-world-linux-smui-compile-client-prod-class-svelte.svg" alt="Compiler — CLIENT · production · Svelte runtime" width="760">
</picture>

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte/compiler 5.57.1 | 126 | 806.9 ms | — | **656.3 ms** | 605.7 ms | 32.2 ms | 4.9% | — | 632,968 | n/a | — |
| @mrwaip/svelte-rs (NAPI) ⚠ | 126 | (44.9 ms) | not ranked | (44.8 ms) | (44.5 ms) | – | – | not ranked | (598,944) | n/a | – |
| @rsvelte/native (NAPI) ⚠ | 126 | (214.0 ms) | not ranked | (208.9 ms) | (208.0 ms) | – | – | not ranked | (625,815) | n/a | – |
| @rsvelte/compiler (wasm) ⚠ | 126 | (580.4 ms) | not ranked | (543.2 ms) | (527.5 ms) | – | – | not ranked | (625,815) | n/a | – |

<details><summary>Notes</summary>

- **svelte/compiler 5.57.1**: Official svelte/compiler compile(), generate=client, dev=false, css=external, runes=auto | runtime gate: ✓ 126/126 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through svelte/compiler compile() per plant, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **@mrwaip/svelte-rs (NAPI) ⚠**: @mrwaip/svelte-rs compile(), generate=client, dev=false, css=external | runtime gate: ✓ 126/126 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-styles: css.css-0: mapped to 2:24; expected 9:24; crlf-styles: css.css-0: mapped to 2:24; expected 9:24). The timing remains visible but cannot rank until the emitted maps are correct.
- **@rsvelte/native (NAPI) ⚠**: rsvelte NAPI compile(), generate=client, dev=false, css=external | runtime gate: ✓ 126/126 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-raw: js.template: generated token has no original mapping; lf-styles: js.template: generated token has no original mapping). The timing remains visible but cannot rank until the emitted maps are correct.
- **@rsvelte/compiler (wasm) ⚠**: rsvelte WASM compile(), generate=client, dev=false, css=external. ⚠ WASM path — not the NAPI native binding. | runtime gate: ✓ 126/126 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-raw: js.template: generated token has no original mapping; lf-styles: js.template: generated token has no original mapping). The timing remains visible but cannot rank until the emitted maps are correct.

</details>

<details><summary>Raw runs</summary>

- **Verter (stateless)**: 179.6 ms, 181.6 ms, 187.3 ms, 185.8 ms, 187.5 ms · fresh child: 180.1 ms, 182.4 ms, 183.6 ms, 183.4 ms, 182.2 ms
- **svelte/compiler 5.57.1**: 683.0 ms, 656.3 ms, 680.2 ms, 636.6 ms, 605.7 ms · fresh child: 758.0 ms, 795.6 ms, 848.6 ms, 846.2 ms, 806.9 ms
- **@mrwaip/svelte-rs (NAPI)**: 46.5 ms, 44.5 ms, 45.4 ms, 44.8 ms, 44.6 ms · fresh child: 44.3 ms, 44.6 ms, 45.5 ms, 44.9 ms, 45.1 ms
- **@rsvelte/native (NAPI)**: 208.0 ms, 210.8 ms, 210.0 ms, 208.9 ms, 208.9 ms · fresh child: 205.8 ms, 207.6 ms, 214.0 ms, 219.3 ms, 216.9 ms
- **@rsvelte/compiler (wasm)**: 543.2 ms, 543.6 ms, 552.6 ms, 534.7 ms, 527.5 ms · fresh child: 561.1 ms, 561.9 ms, 594.2 ms, 586.7 ms, 580.4 ms

</details>

#### SERVER · production

Target: `server` · Environment: `production`

##### EXPERIMENTAL-SVELTE — separate workload

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-smui-real-world-linux-smui-compile-server-prod-class--178tb2b-dark.svg">
  <img src="charts/real-world-smui-real-world-linux-smui-compile-server-prod-class--178tb2b.svg" alt="Compiler — SERVER · production · EXPERIMENTAL-SVELTE" width="760">
</picture>

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter (stateless) ⚠ | 126 | (44.6 ms) | not ranked | (45.1 ms) | (44.0 ms) | – | – | not ranked | (0) | n/a | – |

<details><summary>Notes</summary>

- **Verter (stateless) ⚠**: VerterHost.compileMany(target=runtime-render, mode=stateless, 1 CPU thread) on the same revised Svelte inputs. Diagnostic timing only: the published path is not validated as a Svelte runtime compiler; invalid/empty output and per-file errors are retained, never ranked. | output gate: FAIL — returned empty JavaScript; 126/126 entries, 126 compile errors, 126 entries missing the CSS revision token; first error: [00000--Accordion.svelte] host error: runtime surface refused for '00000--Accordion.svelte': svelte-runtime-unsupported-server-generate: Svelte client emission does not yet support server-side rendering (`generate: 'server'`). | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ RUNTIME SEMANTIC VALIDITY FAIL (0/33 plants) — props-defaults-interpolation (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-server-generate: Svelte client emission does not yet support server-side rendering (`generate: 'server'`).; state-derived-update (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-server-generate: Svelte client emission does not yet support server-side rendering (`generate: 'server'`).; bindable-prop (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-server-generate: Svelte client emission does not yet support server-side rendering (`generate: 'server'`).

</details>

##### Svelte runtime

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-smui-real-world-linux-smui-compile-server-prod-class-svelte-dark.svg">
  <img src="charts/real-world-smui-real-world-linux-smui-compile-server-prod-class-svelte.svg" alt="Compiler — SERVER · production · Svelte runtime" width="760">
</picture>

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @rsvelte/native (NAPI) | 126 | 156.9 ms | 1.00x | **160.5 ms** | 158.2 ms | 2.8 ms | 1.8% | 1.00x | 453,079 | n/a | 785 files/s |
| @rsvelte/compiler (wasm) | 126 | 444.2 ms | 2.83x | **420.5 ms** | 420.1 ms | 3.5 ms | 0.8% | 2.62x | 453,079 | n/a | 300 files/s |
| svelte/compiler 5.57.1 | 126 | 667.4 ms | 4.25x | **535.2 ms** | 511.3 ms | 22.7 ms | 4.2% | 3.34x | 453,273 | n/a | 235 files/s |
| @mrwaip/svelte-rs (NAPI) ⚠ | 126 | (37.9 ms) | not ranked | (37.2 ms) | (36.9 ms) | – | – | not ranked | (435,528) | n/a | – |

<details><summary>Notes</summary>

- **@rsvelte/native (NAPI)**: rsvelte NAPI compile(), generate=server, dev=false, css=external | runtime gate: ✓ 126/126 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through @rsvelte/vite-plugin-svelte-native compileSync() per plant, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **@rsvelte/compiler (wasm)**: rsvelte WASM compile(), generate=server, dev=false, css=external. ⚠ WASM path — not the NAPI native binding. | runtime gate: ✓ 126/126 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through @rsvelte/compiler compile() per plant after initSync, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **svelte/compiler 5.57.1**: Official svelte/compiler compile(), generate=server, dev=false, css=external, runes=auto | runtime gate: ✓ 126/126 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through svelte/compiler compile() per plant, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **@mrwaip/svelte-rs (NAPI) ⚠**: @mrwaip/svelte-rs compile(), generate=server, dev=false, css=external | runtime gate: ✗ returned empty JavaScript; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-raw: js.missing or invalid version-3 source map; lf-styles: js.missing or invalid version-3 source map). The timing remains visible but cannot rank until the emitted maps are correct.

</details>

<details><summary>Raw runs</summary>

- **Verter (stateless)**: 47.3 ms, 44.0 ms, 45.1 ms, 44.7 ms, 47.2 ms · fresh child: 43.4 ms, 45.2 ms, 44.6 ms, 43.0 ms, 46.1 ms
- **@rsvelte/native (NAPI)**: 160.5 ms, 158.2 ms, 160.0 ms, 161.0 ms, 165.7 ms · fresh child: 157.6 ms, 156.1 ms, 156.8 ms, 156.9 ms, 158.0 ms
- **@rsvelte/compiler (wasm)**: 424.8 ms, 420.1 ms, 420.5 ms, 420.4 ms, 428.1 ms · fresh child: 462.3 ms, 444.1 ms, 444.2 ms, 447.2 ms, 443.6 ms
- **svelte/compiler 5.57.1**: 515.1 ms, 511.3 ms, 538.3 ms, 568.2 ms, 535.2 ms · fresh child: 667.4 ms, 643.8 ms, 671.1 ms, 674.0 ms, 656.7 ms
- **@mrwaip/svelte-rs (NAPI)**: 37.2 ms, 38.5 ms, 37.8 ms, 37.1 ms, 36.9 ms · fresh child: 37.4 ms, 38.0 ms, 37.9 ms, 37.8 ms, 38.1 ms

</details>

<details><summary>Methodology</summary>

- Matrix: generate ∈ {client, server} × env ∈ {production, development} × source-map ∈ {off, on} (off by default).
- Every compiler receives the same in-memory Svelte SFC corpus. The latest official Svelte compiler is the sole reference and decides real-world eligibility for every tool.
- Official: svelte/compiler compile() with runes=auto. Generated fixtures force runes; real-world sources use compiler auto-detection.
- MrWaip: @mrwaip/svelte-rs native compiler through its compatible compile() API, validated against the same latest Svelte runtime and official baseline as every other compiler.
- rsvelte: WASM (@rsvelte/compiler) and NAPI (@rsvelte/vite-plugin-svelte-native) paths are separate rows against the same official Svelte baseline.
- Verter's published compileMany runtime-render path receives the same revised Svelte inputs with stateless caching and one CPU thread. Completed passes publish warm/fresh timings even when their code is invalid or entries contain compile errors. They are permanently unranked diagnostic evidence until the adapter is validated; errors, output samples, revision-token failures and runtime-plant verdicts are retained. Only a missing API/package is skipped; a thrown batch failure is an error.
- Every warmed/fresh pass compiles a REVISED corpus: a fixed-width comment token plus a used CSS custom-property rule. The timed loop asserts the token reached the emitted CSS, so a cached whole-output result from a previous pass fails the gate. Adapter parity additionally requires every warm and fresh pass to have received a distinct input revision.
- Every compiler must return one non-empty code artifact per input file, emit the expected Svelte client/server runtime import, and remove Svelte runes; aggregate byte totals alone are not accepted as proof of coverage.
- Fresh child = the first timed row workload in a NEW child process, after excluded Node startup, package imports, adapter construction and input materialisation. It is NOT machine-cold (OS page cache is not flushed) and its ratio never substitutes for the warm verdict.
- Source maps: every compared Svelte 5 compiler ALWAYS emits js.map/css.map from compile() (no off/on flag exists — the 'sourcemap' option is a chained-map INPUT), so an off/on matrix would measure the harness, not the tools. Instead the maps' COORDINATE CORRECTNESS gates every row: anchored tokens in generated JS/CSS must trace back to their exact source positions (segment fallback allowed, exact line/column required, sourcesContent equal to the full component), across LF/CRLF and non-BMP-shifted columns. Wrong-file, shifted, stale or byte-counted maps unrank the row.
- Runtime semantic validity: a 28-plant Svelte 5 suite (props/state/derived/bindable/bindings/events/each-keyed/await/snippets/stores/actions/context/dynamic components/{@html}/SVG/module script/legacy syntax + CSS semantics) runs per entrypoint per cell in isolated child processes after timing; non-PASS rows unrank, and a failed official reference unranks every candidate in the comparison (no survivor promotion).
- Tool order is rotated on every warmup and measured run. A row is unranked unless the measured runs cover every active execution position; ranking metric is the median of warmed runs.

</details>

### Svelte TypeScript projection

Files: **126** · Bytes: **530,360**

Corpus: smui:components @ v9.0.1 (8d204fe8, released/committed 2026-06-02) · 126 SFCs · library-source · Apache-2.0

Tools:

- **svelte2tsx** — Official Svelte-to-TSX projection from sveltejs/language-tools.
- **@rsvelte/svelte2tsx (Wasm)** — rsvelte Rust/Wasm drop-in Svelte-to-TSX projection.
- **Verter IDE projection** — VerterHost ensureIdeCompiled/getIde Svelte projection; separate schema from svelte2tsx.

##### SVELTE2TSX-COMPATIBLE — separate workload

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-smui-real-world-linux-smui-projection-projection-clas-0xidrig-dark.svg">
  <img src="charts/real-world-smui-real-world-linux-smui-projection-projection-clas-0xidrig.svg" alt="Svelte TypeScript projection — SVELTE2TSX-COMPATIBLE" width="760">
</picture>

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | TSX bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @rsvelte/svelte2tsx (Wasm) | 126 | **71.3 ms** | 68.9 ms | 4.0 ms | 5.7% | 1.00x | 731,489 | n/a | 1.8k files/s |
| svelte2tsx | 126 | **273.5 ms** | 266.7 ms | 12.4 ms | 4.5% | 3.84x | 731,490 | n/a | 461 files/s |

<details><summary>Notes</summary>

- **@rsvelte/svelte2tsx (Wasm)**: Rust/Wasm drop-in; TypeScript-printer structural parity against official output | gate: ✓ 126/126 valid TSX outputs
- **svelte2tsx**: Official svelte2tsx, Svelte 5 TS projection | gate: ✓ 126/126 valid TSX outputs

</details>

##### VERTER-IDE-PROJECTION — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Projection bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter IDE projection ❌ | 126 | error | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Verter IDE projection ❌**: HostError: scheduler error: stage Source failed for /home/runner/work/svelte-benchmarks/svelte-benchmarks/work-real/smui/projection/corpus-Nl3MNd/00003--Autocomplete.svelte: carrier publication did not admit

</details>

<details><summary>Methodology</summary>

- This is the type-analysis projection used by Svelte-aware TypeScript tooling; it is not runtime compilation or component documentation.
- The svelte2tsx-compatible rows use the synchronous in-process API with identical Svelte 5 options and file order.
- Every output must parse as TSX and contain tool-specific Svelte projection helpers.
- The rsvelte row must match official output after TypeScript parses and reprints both outputs, ignoring formatting-only whitespace while retaining syntax and comments.
- Verter's ensureIdeCompiled/getIde output is a genuine Svelte IDE projection, but its carrier and helper contract differ from svelte2tsx; it is therefore measured in a separate comparison class.

Raw runs:

- **@rsvelte/svelte2tsx (Wasm)**: 79.4 ms, 73.5 ms, 70.8 ms, 71.3 ms, 68.9 ms
- **svelte2tsx**: 297.7 ms, 273.5 ms, 266.7 ms, 275.6 ms, 268.9 ms

</details>

### Format

Files: **126** · Bytes: **530,360**

Corpus: smui:components @ v9.0.1 (8d204fe8, released/committed 2026-06-02) · 126 SFCs · library-source · Apache-2.0

Tools:

- **Prettier** — prettier --write with prettier-plugin-svelte over a fresh corpus copy.
- **rsvelte-fmt** — @rsvelte/fmt — Rust formatter for .svelte.
- **Oxfmt** — Oxc formatter; skipped because the pinned release excludes .svelte files.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-smui-real-world-linux-smui-format-format-all-dark.svg">
  <img src="charts/real-world-smui-real-world-linux-smui-format-format-all.svg" alt="Format" width="760">
</picture>

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| rsvelte-fmt | 126 | **155.4 ms** | 153.9 ms | 2.3 ms | 1.5% | 1.00x | n/a | n/a | 811 files/s |
| Prettier | 126 | **3.30 s** | 3.24 s | 56.1 ms | 1.7% | 21.25x | n/a | n/a | 38 files/s |
| Oxfmt ⏭ | 126 | skipped | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **rsvelte-fmt**: rsvelte-fmt . (Rust); may route embedded JS/TS/CSS through other formatters | ⓘ file coverage verified: rewrote 126/126 Svelte files.
- **Prettier**: prettier --write **/*.svelte with prettier-plugin-svelte · single-threaded | ⓘ file coverage verified: rewrote 126/126 Svelte files.
- **Oxfmt ⏭**: Pinned Oxfmt release excludes .svelte files; no CLI-startup proxy is timed.

</details>

<details><summary>Methodology</summary>

- Every timed invocation receives a fresh copy of the same Svelte corpus.
- All rows are CLI invocations; any non-zero exit is an operational failure and cannot rank, even if some files changed first.
- A nested markup-rewrite plant fails tools that no-op, format only &lt;script>, or use a non-recursive file pattern.
- An untimed coverage census dirties every Svelte file; a tool that rewrites fewer than the full corpus is measured but unranked.
- Output style is not normalized — this measures whole-SFC format throughput, not byte identity.
- Tool order is rotated; ranking metric is the median of warmed runs.

Raw runs:

- **rsvelte-fmt**: 154.8 ms, 159.5 ms, 153.9 ms, 155.4 ms, 157.4 ms
- **Prettier**: 3.39 s, 3.27 s, 3.30 s, 3.31 s, 3.24 s

</details>

### Lint

Files: **126** · Bytes: **530,360**

Corpus: smui:components @ v9.0.1 (8d204fe8, released/committed 2026-06-02) · 126 SFCs · library-source · Apache-2.0

Tools:

- **eslint-plugin-svelte (1T API)** — ESLint API + eslint-plugin-svelte recommended rules, single-threaded.
- **eslint-plugin-svelte (worker pool)** — ESLint API + eslint-plugin-svelte recommended rules, split across worker threads.
- **eslint-plugin-svelte (CLI)** — ESLint CLI + eslint-plugin-svelte recommended rules.
- **rsvelte-lint** — @rsvelte/lint — Rust Svelte linter.
- **Verter host lint** — VerterHost lint/diagnostics API with fileKind=svelte; experimental and gated on the {@html} diagnostic.

##### ESLINT-RECOMMENDED-RULES — separate workload

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-smui-real-world-linux-smui-lint-lint-class-eslint-rec-0aff248-dark.svg">
  <img src="charts/real-world-smui-real-world-linux-smui-lint-lint-class-eslint-rec-0aff248.svg" alt="Lint — ESLINT-RECOMMENDED-RULES" width="760">
</picture>

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| eslint-plugin-svelte (1T API) | 126 | **2.03 s** | 1.96 s | 339.1 ms | 16.7% ⚠ | 1.00x | n/a | n/a | 62 files/s |
| eslint-plugin-svelte (CLI) | 126 | **3.97 s** | 3.92 s | 56.6 ms | 1.4% | 1.96x | n/a | n/a | 32 files/s |
| eslint-plugin-svelte (worker pool) | 126 | **5.02 s** | 4.92 s | 64.0 ms | 1.3% | 2.48x | n/a | n/a | 25 files/s |

<details><summary>Notes</summary>

- **eslint-plugin-svelte (1T API)**: ESLint flat config + eslint-plugin-svelte recommended; explicit file list | ⓘ file coverage by construction: the invocation receives all 126 corpus files as an explicit list.
- **eslint-plugin-svelte (CLI)**: eslint . over the same isolated corpus; pays startup and config load | ⓘ file coverage verified: named 126/126 planted Svelte files.
- **eslint-plugin-svelte (worker pool)**: ESLint worker_threads fan-out; explicit file list | ⓘ file coverage by construction: the invocation receives all 126 corpus files as an explicit list.

</details>

##### RSVELTE-NATIVE-RULES — separate workload

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/real-world-smui-real-world-linux-smui-lint-lint-class-rsvelte-na-04tm8y0-dark.svg">
  <img src="charts/real-world-smui-real-world-linux-smui-lint-lint-class-rsvelte-na-04tm8y0.svg" alt="Lint — RSVELTE-NATIVE-RULES" width="760">
</picture>

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| rsvelte-lint | 126 | **293.8 ms** | 289.4 ms | 8.4 ms | 2.9% | — | n/a | n/a | — |

<details><summary>Notes</summary>

- **rsvelte-lint**: rsvelte-lint . (Rust linter) | ⓘ file coverage verified: named 126/126 planted Svelte files.

</details>

##### VERTER-NATIVE-DIAGNOSTICS — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter host lint ❌ | 126 | error | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Verter host lint ❌**: HostError: scheduler error: stage Source failed for /home/runner/work/svelte-benchmarks/svelte-benchmarks/work-real/smui/lint/work/lint/n126/00003--Autocomplete.svelte: carrier publication did not admit

</details>

<details><summary>Methodology</summary>

- Every tool receives the same isolated Svelte corpus.
- A planted {@html} issue must be reported; missing the template rule leaves the time visible but unranked.
- An untimed file-coverage census requires each directory-walk CLI to name every planted corpus file; explicit-list APIs are exact by construction.
- ESLint is measured in single-threaded API, worker-pool API, and CLI modes so invocation and thread-count costs remain visible.
- Rule sets are not identical, so ESLint recommended rules, rsvelte native rules, and Verter diagnostics are separate workload classes. The shared planted gate establishes minimum work but never cross-engine equivalence.
- Tool order is rotated; ranking metric is the median of warmed runs.

Raw runs:

- **eslint-plugin-svelte (1T API)**: 2.20 s, 2.78 s, 1.96 s, 2.00 s, 2.03 s
- **eslint-plugin-svelte (CLI)**: 3.97 s, 4.01 s, 3.92 s, 4.07 s, 3.96 s
- **eslint-plugin-svelte (worker pool)**: 5.08 s, 5.07 s, 5.02 s, 4.92 s, 5.01 s
- **rsvelte-lint**: 293.8 ms, 292.0 ms, 289.4 ms, 310.5 ms, 299.9 ms

</details>
