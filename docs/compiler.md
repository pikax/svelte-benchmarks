# Svelte compiler

> This page is **generated** from committed JSON snapshots (`results/benchmarks/`, `results/real_world/`). Do not edit by hand — run `pnpm run docs`.

## Results

<details><summary>Ranking rules and measurement definitions</summary>

Ranked on the **median of measured runs** — Warm is the primary ordering and ranking metric. Compiler rows additionally publish a separately sampled **Fresh child** column: the first timed row workload in a new child process, after excluded process startup, package imports and adapter setup. It is not called Cold (the OS page cache is not flushed) and its ratio never substitutes for the warm verdict. One table per comparable workload class: engine, invocation and threading remain row properties; target or explicitly different work may split classes — the latest official Svelte compiler is the sole compiler baseline, and a failed reference unranks the whole comparison rather than promoting a survivor. Every active variant must visit every execution position; shorter runs are unranked. A class with fewer than two valid rows is informational. Rows tagged **(JS)** run the JavaScript TypeScript compiler. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three samples is bracketed as TOO NOISY TO RANK, baseline included.

</details>

- **Generated:** 2026-09-29T12:45:43.678Z
- **Fixture:** `fixtures/200` (200 Svelte files)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · AMD EPYC 7763 64-Core Processor · 16 GB RAM · Node v22.23.2
- **Commit:** [1bc177a](https://github.com/pikax/svelte-benchmarks/commit/1bc177a)
- **CI run:** https://github.com/pikax/svelte-benchmarks/actions/runs/36569419030
- **Source:** `bench-Linux-200-bench.json`

### SFC compile (unique contents)

Files: **200** · Bytes: **134,760**

Tools:

- **svelte/compiler 5.57.1** — Official svelte/compiler compile() API, single-threaded.
- **@mrwaip/svelte-rs (NAPI)** — MrWaip/svelte-rs native compiler through its svelte/compiler-compatible API.
- **@rsvelte/compiler (wasm)** — rsvelte WASM compiler bindings.
- **@rsvelte/native (NAPI)** — rsvelte native NAPI compiler (@rsvelte/vite-plugin-svelte-native).
- **Verter (stateless)** — VerterHost.compileMany without cross-run cache; experimental Svelte carrier.

Validation (runtime semantic plants):

Suite 2026-09-12.2 · hash 451381a17402 · 4 cell(s)

| Cell | Status | Entrypoint verdicts |
| --- | --- | --- |
| client/production/source-map-off | FAIL | svelte-official: PASS · mrwaip-svelte-rs: FAIL · rsvelte-wasm: FAIL · rsvelte-native: FAIL · verter-svelte: FAIL |
| client/development/source-map-off | FAIL | svelte-official: PASS · mrwaip-svelte-rs: FAIL · rsvelte-wasm: FAIL · rsvelte-native: FAIL · verter-svelte: FAIL |
| server/production/source-map-off | FAIL | svelte-official: PASS · mrwaip-svelte-rs: FAIL · rsvelte-wasm: PASS · rsvelte-native: PASS · verter-svelte: FAIL |
| server/development/source-map-off | FAIL | svelte-official: PASS · mrwaip-svelte-rs: FAIL · rsvelte-wasm: PASS · rsvelte-native: PASS · verter-svelte: FAIL |

Compile results are **grouped by target × environment**, then by comparison class.

#### CLIENT · production

Target: `client` · Environment: `production`

##### EXPERIMENTAL-SVELTE — separate workload

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-client-prod-class-experim-16hjxvc-dark.svg">
  <img src="charts/compiler-bench-linux-200-bench-compile-client-prod-class-experim-16hjxvc.svg" alt="Compiler — CLIENT · production · EXPERIMENTAL-SVELTE" width="760">
</picture>

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter (stateless) ⚠ | 200 | (68.9 ms) | not ranked | (74.1 ms) | (71.0 ms) | – | – | not ranked | (0) | n/a | – |

<details><summary>Notes</summary>

- **Verter (stateless) ⚠**: VerterHost.compileMany(target=runtime-render, mode=stateless, 1 CPU thread) on the same revised Svelte inputs. Diagnostic timing only: the published path is not validated as a Svelte runtime compiler; invalid/empty output and per-file errors are retained, never ranked. | output gate: FAIL — returned empty JavaScript; 200/200 entries, 200 compile errors, 200 entries missing the CSS revision token; first error: [Comp00000.svelte] host error: runtime surface refused for 'Comp00000.svelte': svelte-runtime-unsupported-dynamic-attribute: Svelte client emission does not yet support the dynamic attribute / directive `hidden`. | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ RUNTIME SEMANTIC VALIDITY FAIL (4/33 plants) — state-derived-update (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-advanced-rune: Svelte client emission does not yet support the `$derived` rune form.; bindable-prop (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-advanced-rune: Svelte client emission does not yet support the `$props() non-interpolation usage` rune form.; callback-prop-events (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-non-delegated-event: Svelte client emission does not yet support the non-delegated / capture / global event `click`.

</details>

##### Svelte runtime

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-client-prod-class-svelte-dark.svg">
  <img src="charts/compiler-bench-linux-200-bench-compile-client-prod-class-svelte.svg" alt="Compiler — CLIENT · production · Svelte runtime" width="760">
</picture>

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte/compiler 5.57.1 | 200 | 410.1 ms | — | **347.9 ms** | 302.7 ms | 28.4 ms | 8.2% | — | 360,966 | 116.113 MB | — |
| @mrwaip/svelte-rs (NAPI) ⚠ | 200 | (39.6 ms) | not ranked | (39.8 ms) | (38.8 ms) | – | – | not ranked | (364,246) | 71.59 MB | – |
| @rsvelte/native (NAPI) ⚠ | 200 | (113.5 ms) | not ranked | (116.3 ms) | (114.5 ms) | – | – | not ranked | (360,966) | 82.223 MB | – |
| @rsvelte/compiler (wasm) ⚠ | 200 | (316.7 ms) | not ranked | (302.5 ms) | (284.9 ms) | – | – | not ranked | (360,966) | 179.098 MB | – |

<details><summary>Notes</summary>

- **svelte/compiler 5.57.1**: Official svelte/compiler compile(), generate=client, dev=false, css=external, runes=true | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through svelte/compiler compile() per plant, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **@mrwaip/svelte-rs (NAPI) ⚠**: @mrwaip/svelte-rs compile(), generate=client, dev=false, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-styles: css.css-0: mapped to 2:24; expected 9:24; crlf-styles: css.css-0: mapped to 2:24; expected 9:24). The timing remains visible but cannot rank until the emitted maps are correct.
- **@rsvelte/native (NAPI) ⚠**: rsvelte NAPI compile(), generate=client, dev=false, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-raw: js.template: generated token has no original mapping; lf-styles: js.template: generated token has no original mapping). The timing remains visible but cannot rank until the emitted maps are correct.
- **@rsvelte/compiler (wasm) ⚠**: rsvelte WASM compile(), generate=client, dev=false, css=external. ⚠ WASM path — not the NAPI native binding. | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-raw: js.template: generated token has no original mapping; lf-styles: js.template: generated token has no original mapping). The timing remains visible but cannot rank until the emitted maps are correct.

</details>

<details><summary>Raw runs</summary>

- **Verter (stateless)**: 78.4 ms, 78.4 ms, 71.2 ms, 71.0 ms, 74.1 ms · fresh child: 68.9 ms, 67.2 ms, 68.7 ms, 70.2 ms, 71.7 ms
- **svelte/compiler 5.57.1**: 356.2 ms, 381.4 ms, 347.9 ms, 302.7 ms, 345.7 ms · fresh child: 407.0 ms, 407.5 ms, 416.8 ms, 410.1 ms, 422.4 ms
- **@mrwaip/svelte-rs (NAPI)**: 38.8 ms, 41.6 ms, 39.8 ms, 39.4 ms, 42.5 ms · fresh child: 39.6 ms, 39.7 ms, 39.6 ms, 39.6 ms, 39.6 ms
- **@rsvelte/native (NAPI)**: 120.9 ms, 114.9 ms, 116.9 ms, 116.3 ms, 114.5 ms · fresh child: 113.5 ms, 113.6 ms, 114.2 ms, 113.5 ms, 113.4 ms
- **@rsvelte/compiler (wasm)**: 303.0 ms, 302.5 ms, 303.3 ms, 284.9 ms, 286.6 ms · fresh child: 323.0 ms, 313.2 ms, 308.7 ms, 318.8 ms, 316.7 ms

</details>

#### CLIENT · development

Target: `client` · Environment: `development`

##### EXPERIMENTAL-SVELTE — separate workload

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-client-dev-class-experime-16ual2o-dark.svg">
  <img src="charts/compiler-bench-linux-200-bench-compile-client-dev-class-experime-16ual2o.svg" alt="Compiler — CLIENT · development · EXPERIMENTAL-SVELTE" width="760">
</picture>

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter (stateless) ⚠ | 200 | (69.5 ms) | not ranked | (69.0 ms) | (67.2 ms) | – | – | not ranked | (0) | n/a | – |

<details><summary>Notes</summary>

- **Verter (stateless) ⚠**: VerterHost.compileMany(target=runtime-render, mode=stateless, 1 CPU thread) on the same revised Svelte inputs. Diagnostic timing only: the published path is not validated as a Svelte runtime compiler; invalid/empty output and per-file errors are retained, never ranked. | output gate: FAIL — returned empty JavaScript; 200/200 entries, 200 compile errors, 200 entries missing the CSS revision token; first error: [Comp00000.svelte] host error: runtime surface refused for 'Comp00000.svelte': svelte-runtime-unsupported-dynamic-attribute: Svelte client emission does not yet support the dynamic attribute / directive `hidden`. | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ RUNTIME SEMANTIC VALIDITY FAIL (4/33 plants) — state-derived-update (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-advanced-rune: Svelte client emission does not yet support the `$derived` rune form.; bindable-prop (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-advanced-rune: Svelte client emission does not yet support the `$props() non-interpolation usage` rune form.; callback-prop-events (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-non-delegated-event: Svelte client emission does not yet support the non-delegated / capture / global event `click`.

</details>

##### Svelte runtime

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-client-dev-class-svelte-dark.svg">
  <img src="charts/compiler-bench-linux-200-bench-compile-client-dev-class-svelte.svg" alt="Compiler — CLIENT · development · Svelte runtime" width="760">
</picture>

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte/compiler 5.57.1 | 200 | 419.5 ms | — | **278.3 ms** | 273.2 ms | 3.0 ms | 1.1% | — | 468,726 | 116.113 MB | — |
| @mrwaip/svelte-rs (NAPI) ⚠ | 200 | (41.3 ms) | not ranked | (40.0 ms) | (39.9 ms) | – | – | not ranked | (466,626) | 71.59 MB | – |
| @rsvelte/native (NAPI) ⚠ | 200 | (126.0 ms) | not ranked | (125.7 ms) | (125.3 ms) | – | – | not ranked | (468,726) | 82.223 MB | – |
| @rsvelte/compiler (wasm) ⚠ | 200 | (348.0 ms) | not ranked | (304.1 ms) | (301.4 ms) | – | – | not ranked | (468,726) | 179.098 MB | – |

<details><summary>Notes</summary>

- **svelte/compiler 5.57.1**: Official svelte/compiler compile(), generate=client, dev=true, css=external, runes=true | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through svelte/compiler compile() per plant, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **@mrwaip/svelte-rs (NAPI) ⚠**: @mrwaip/svelte-rs compile(), generate=client, dev=true, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-styles: css.css-0: mapped to 2:24; expected 9:24; crlf-styles: css.css-0: mapped to 2:24; expected 9:24). The timing remains visible but cannot rank until the emitted maps are correct.
- **@rsvelte/native (NAPI) ⚠**: rsvelte NAPI compile(), generate=client, dev=true, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-raw: js.template: generated token has no original mapping; lf-styles: js.template: generated token has no original mapping). The timing remains visible but cannot rank until the emitted maps are correct.
- **@rsvelte/compiler (wasm) ⚠**: rsvelte WASM compile(), generate=client, dev=true, css=external. ⚠ WASM path — not the NAPI native binding. | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-raw: js.template: generated token has no original mapping; lf-styles: js.template: generated token has no original mapping). The timing remains visible but cannot rank until the emitted maps are correct.

</details>

<details><summary>Raw runs</summary>

- **Verter (stateless)**: 69.0 ms, 70.1 ms, 67.2 ms, 68.0 ms, 69.5 ms · fresh child: 69.9 ms, 68.9 ms, 69.5 ms, 67.3 ms, 71.2 ms
- **svelte/compiler 5.57.1**: 273.2 ms, 281.1 ms, 279.7 ms, 278.3 ms, 278.3 ms · fresh child: 413.6 ms, 426.0 ms, 410.2 ms, 427.4 ms, 419.5 ms
- **@mrwaip/svelte-rs (NAPI)**: 39.9 ms, 39.9 ms, 40.0 ms, 40.0 ms, 40.1 ms · fresh child: 41.0 ms, 48.2 ms, 41.1 ms, 41.3 ms, 41.5 ms
- **@rsvelte/native (NAPI)**: 125.9 ms, 125.3 ms, 125.6 ms, 125.7 ms, 125.7 ms · fresh child: 125.0 ms, 125.8 ms, 126.1 ms, 126.0 ms, 126.6 ms
- **@rsvelte/compiler (wasm)**: 307.1 ms, 301.4 ms, 304.1 ms, 307.2 ms, 304.1 ms · fresh child: 348.0 ms, 355.1 ms, 349.7 ms, 345.5 ms, 347.6 ms

</details>

#### SERVER · production

Target: `server` · Environment: `production`

##### EXPERIMENTAL-SVELTE — separate workload

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-server-prod-class-experim-0ngnah0-dark.svg">
  <img src="charts/compiler-bench-linux-200-bench-compile-server-prod-class-experim-0ngnah0.svg" alt="Compiler — SERVER · production · EXPERIMENTAL-SVELTE" width="760">
</picture>

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter (stateless) ⚠ | 200 | (35.3 ms) | not ranked | (35.4 ms) | (33.2 ms) | – | – | not ranked | (0) | n/a | – |

<details><summary>Notes</summary>

- **Verter (stateless) ⚠**: VerterHost.compileMany(target=runtime-render, mode=stateless, 1 CPU thread) on the same revised Svelte inputs. Diagnostic timing only: the published path is not validated as a Svelte runtime compiler; invalid/empty output and per-file errors are retained, never ranked. | output gate: FAIL — returned empty JavaScript; 200/200 entries, 200 compile errors, 200 entries missing the CSS revision token; first error: [Comp00000.svelte] host error: runtime surface refused for 'Comp00000.svelte': svelte-runtime-unsupported-server-generate: Svelte client emission does not yet support server-side rendering (`generate: 'server'`). | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ RUNTIME SEMANTIC VALIDITY FAIL (0/33 plants) — props-defaults-interpolation (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-server-generate: Svelte client emission does not yet support server-side rendering (`generate: 'server'`).; state-derived-update (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-server-generate: Svelte client emission does not yet support server-side rendering (`generate: 'server'`).; bindable-prop (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-server-generate: Svelte client emission does not yet support server-side rendering (`generate: 'server'`).

</details>

##### Svelte runtime

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-server-prod-class-svelte-dark.svg">
  <img src="charts/compiler-bench-linux-200-bench-compile-server-prod-class-svelte.svg" alt="Compiler — SERVER · production · Svelte runtime" width="760">
</picture>

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @rsvelte/native (NAPI) | 200 | 82.4 ms | 1.00x | **80.2 ms** | 79.9 ms | 0.8 ms | 1.0% | 1.00x | 214,546 | 82.223 MB | 2.5k files/s |
| @rsvelte/compiler (wasm) | 200 | 237.3 ms | 2.88x | **207.7 ms** | 205.3 ms | 1.2 ms | 0.6% | 2.59x | 214,546 | 179.098 MB | 963 files/s |
| svelte/compiler 5.57.1 | 200 | 344.6 ms | 4.18x | **220.0 ms** | 210.6 ms | 7.6 ms | 3.5% | 2.74x | 214,546 | 116.113 MB | 909 files/s |
| @mrwaip/svelte-rs (NAPI) ⚠ | 200 | (33.3 ms) | not ranked | (31.4 ms) | (31.4 ms) | – | – | not ranked | (217,846) | 71.59 MB | – |

<details><summary>Notes</summary>

- **@rsvelte/native (NAPI)**: rsvelte NAPI compile(), generate=server, dev=false, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through @rsvelte/vite-plugin-svelte-native compileSync() per plant, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **@rsvelte/compiler (wasm)**: rsvelte WASM compile(), generate=server, dev=false, css=external. ⚠ WASM path — not the NAPI native binding. | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through @rsvelte/compiler compile() per plant after initSync, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **svelte/compiler 5.57.1**: Official svelte/compiler compile(), generate=server, dev=false, css=external, runes=true | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through svelte/compiler compile() per plant, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **@mrwaip/svelte-rs (NAPI) ⚠**: @mrwaip/svelte-rs compile(), generate=server, dev=false, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-raw: js.missing or invalid version-3 source map; lf-styles: js.missing or invalid version-3 source map). The timing remains visible but cannot rank until the emitted maps are correct.

</details>

<details><summary>Raw runs</summary>

- **Verter (stateless)**: 37.1 ms, 34.9 ms, 36.5 ms, 35.4 ms, 33.2 ms · fresh child: 36.1 ms, 35.1 ms, 35.4 ms, 35.3 ms, 34.1 ms
- **@rsvelte/native (NAPI)**: 81.9 ms, 80.3 ms, 79.9 ms, 80.2 ms, 80.2 ms · fresh child: 82.6 ms, 82.6 ms, 82.2 ms, 82.2 ms, 82.4 ms
- **@rsvelte/compiler (wasm)**: 205.3 ms, 208.0 ms, 208.0 ms, 206.2 ms, 207.7 ms · fresh child: 237.3 ms, 237.4 ms, 237.2 ms, 236.6 ms, 242.5 ms
- **svelte/compiler 5.57.1**: 231.4 ms, 220.6 ms, 216.3 ms, 220.0 ms, 210.6 ms · fresh child: 343.9 ms, 353.3 ms, 344.6 ms, 362.6 ms, 339.6 ms
- **@mrwaip/svelte-rs (NAPI)**: 31.9 ms, 31.5 ms, 31.4 ms, 31.4 ms, 31.4 ms · fresh child: 33.2 ms, 33.4 ms, 33.3 ms, 33.4 ms, 33.3 ms

</details>

#### SERVER · development

Target: `server` · Environment: `development`

##### EXPERIMENTAL-SVELTE — separate workload

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-server-dev-class-experime-0rqidlo-dark.svg">
  <img src="charts/compiler-bench-linux-200-bench-compile-server-dev-class-experime-0rqidlo.svg" alt="Compiler — SERVER · development · EXPERIMENTAL-SVELTE" width="760">
</picture>

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter (stateless) ⚠ | 200 | (35.0 ms) | not ranked | (35.2 ms) | (32.6 ms) | – | – | not ranked | (0) | n/a | – |

<details><summary>Notes</summary>

- **Verter (stateless) ⚠**: VerterHost.compileMany(target=runtime-render, mode=stateless, 1 CPU thread) on the same revised Svelte inputs. Diagnostic timing only: the published path is not validated as a Svelte runtime compiler; invalid/empty output and per-file errors are retained, never ranked. | output gate: FAIL — returned empty JavaScript; 200/200 entries, 200 compile errors, 200 entries missing the CSS revision token; first error: [Comp00000.svelte] host error: runtime surface refused for 'Comp00000.svelte': svelte-runtime-unsupported-server-generate: Svelte client emission does not yet support server-side rendering (`generate: 'server'`). | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ RUNTIME SEMANTIC VALIDITY FAIL (0/33 plants) — props-defaults-interpolation (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-server-generate: Svelte client emission does not yet support server-side rendering (`generate: 'server'`).; state-derived-update (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-server-generate: Svelte client emission does not yet support server-side rendering (`generate: 'server'`).; bindable-prop (plant): [Plant.svelte] host error: runtime surface refused for 'Plant.svelte': svelte-runtime-unsupported-server-generate: Svelte client emission does not yet support server-side rendering (`generate: 'server'`).

</details>

##### Svelte runtime

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-server-dev-class-svelte-dark.svg">
  <img src="charts/compiler-bench-linux-200-bench-compile-server-dev-class-svelte.svg" alt="Compiler — SERVER · development · Svelte runtime" width="760">
</picture>

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @rsvelte/native (NAPI) | 200 | 90.3 ms | 1.00x | **89.5 ms** | 89.2 ms | 0.5 ms | 0.5% | 1.00x | 445,986 | 82.223 MB | 2.2k files/s |
| @rsvelte/compiler (wasm) | 200 | 268.6 ms | 2.98x | **234.7 ms** | 234.0 ms | 1.6 ms | 0.7% | 2.62x | 445,986 | 179.098 MB | 852 files/s |
| svelte/compiler 5.57.1 | 200 | 364.4 ms | 4.04x | **239.5 ms** | 227.1 ms | 15.4 ms | 6.4% | 2.68x | 445,986 | 116.113 MB | 835 files/s |
| @mrwaip/svelte-rs (NAPI) ⚠ | 200 | (35.3 ms) | not ranked | (33.6 ms) | (33.2 ms) | – | – | not ranked | (438,986) | 71.59 MB | – |

<details><summary>Notes</summary>

- **@rsvelte/native (NAPI)**: rsvelte NAPI compile(), generate=server, dev=true, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through @rsvelte/vite-plugin-svelte-native compileSync() per plant, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **@rsvelte/compiler (wasm)**: rsvelte WASM compile(), generate=server, dev=true, css=external. ⚠ WASM path — not the NAPI native binding. | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through @rsvelte/compiler compile() per plant after initSync, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **svelte/compiler 5.57.1**: Official svelte/compiler compile(), generate=server, dev=true, css=external, runes=true | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through svelte/compiler compile() per plant, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **@mrwaip/svelte-rs (NAPI) ⚠**: @mrwaip/svelte-rs compile(), generate=server, dev=true, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-raw: js.missing or invalid version-3 source map; lf-styles: js.missing or invalid version-3 source map). The timing remains visible but cannot rank until the emitted maps are correct.

</details>

<details><summary>Raw runs</summary>

- **Verter (stateless)**: 35.2 ms, 34.1 ms, 35.2 ms, 35.2 ms, 32.6 ms · fresh child: 34.2 ms, 35.0 ms, 35.8 ms, 35.6 ms, 34.2 ms
- **@rsvelte/native (NAPI)**: 90.4 ms, 89.2 ms, 89.6 ms, 89.5 ms, 89.3 ms · fresh child: 90.3 ms, 90.4 ms, 89.5 ms, 89.8 ms, 90.6 ms
- **@rsvelte/compiler (wasm)**: 238.1 ms, 234.7 ms, 235.0 ms, 234.0 ms, 234.6 ms · fresh child: 270.0 ms, 268.6 ms, 267.8 ms, 268.1 ms, 270.1 ms
- **svelte/compiler 5.57.1**: 249.0 ms, 239.5 ms, 265.1 ms, 227.1 ms, 230.1 ms · fresh child: 369.7 ms, 358.7 ms, 362.6 ms, 367.1 ms, 364.4 ms
- **@mrwaip/svelte-rs (NAPI)**: 33.5 ms, 33.6 ms, 35.1 ms, 33.6 ms, 33.2 ms · fresh child: 35.4 ms, 35.2 ms, 35.3 ms, 35.3 ms, 35.4 ms

</details>

<details><summary>Methodology</summary>

- Matrix: generate ∈ {client, server} × env ∈ {production, development} × source-map ∈ {off, on} (off by default).
- Every compiler receives the same in-memory Svelte SFC corpus. The latest official Svelte compiler is the sole reference and decides real-world eligibility for every tool.
- Official: svelte/compiler compile() with runes=true. Generated fixtures force runes; real-world sources use compiler auto-detection.
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

## Confirmation (correctness plants)

#### compile

| Case | Tool | Status | Detail |
| --- | --- | --- | --- |
| server-render | svelte | ✓ pass |  |
| server-render | svelte-rs | ✓ pass |  |
| server-render | rsvelte-wasm | ✓ pass |  |
| server-render | rsvelte-native | ✓ pass |  |
| server-render | verter | ✗ fail | [Confirm31415.svelte] host error: runtime surface refused for 'Confirm31415.svelte': svelte-runtime-unsupported-server-generate: Svelte client emission does not |
| validity-client | mrwaip-svelte-rs | ✗ fail | 0 failed, 0 unknown of 33; source-map FAIL (2 failed) — first failures:   'FAIL' !== 'PASS'  |
| validity-client | rsvelte-wasm | ✗ fail | 0 failed, 0 unknown of 33; source-map FAIL (4 failed) — first failures:   'FAIL' !== 'PASS'  |
| validity-client | rsvelte-native | ✗ fail | 0 failed, 0 unknown of 33; source-map FAIL (4 failed) — first failures:   'FAIL' !== 'PASS'  |
| validity-client | verter-svelte | ✗ fail | 29 failed, 0 unknown of 33; source-map FAIL (4 failed) — first failures: state-derived-update: [Plant.svelte] host error: runtime surface refused for 'Plant.sve |
| validity-server | mrwaip-svelte-rs | ✗ fail | 0 failed, 0 unknown of 33; source-map FAIL (4 failed) — first failures:   'FAIL' !== 'PASS'  |
| validity-server | verter-svelte | ✗ fail | 33 failed, 0 unknown of 33; source-map FAIL (4 failed) — first failures: props-defaults-interpolation: [Plant.svelte] host error: runtime surface refused for 'P |
| validity-client | svelte-official | ✓ pass |  |
| validity-server | svelte-official | ✓ pass |  |
| validity-server | rsvelte-wasm | ✓ pass |  |
| validity-server | rsvelte-native | ✓ pass |  |

## Memory (isolated probe)

| Surface | Tool | Peak RSS | Retained Δ | CPU ms | Status |
| --- | --- | ---: | ---: | ---: | --- |
| compile | svelte/compiler 5.57.1 | 116.1 MB | 69.398 MB | 1349.782 | ok |
| compile | @rsvelte/compiler (Wasm) | 179.1 MB | 91.051 MB | 2261.347 | ok |
| compile | @rsvelte/native (NAPI) | 82.2 MB | 37.18 MB | 166.266 | ok |
| compile | @mrwaip/svelte-rs (NAPI) | 71.6 MB | 25.094 MB | 61.022 | ok |
| compile | Verter runtime compile | n/a | n/a | n/a | skipped |

## Tool versions

<details><summary>Pinned package versions</summary>

| Package | Version |
| --- | --- |
| svelte | 5.57.1 |
| svelte-check | 4.7.6 |
| svelte-check-rs | 0.11.2 |
| svelte-check-native | 1.8.0 |
| @mrwaip/svelte-rs | 0.0.0-canary.15.1 |
| @rsvelte/compiler | 0.12.6 |
| @rsvelte/svelte2tsx | 0.2.28 |
| @rsvelte/svelte-check | 0.5.32 |
| @rsvelte/language-server | 0.7.13 |
| @rsvelte/fmt | 0.7.25 |
| @rsvelte/lint | 0.12.6 |
| @rsvelte/vite-plugin-svelte-native | 0.3.17 |
| @rsvelte/vite-plugin-svelte | 0.5.3 |
| @sveltejs/vite-plugin-svelte | 7.3.1 |
| vite | 8.3.1 |
| @verter/native | 0.0.1-beta.6 |
| @verter/typeinfo | 0.0.1-beta.6 |
| @verter/proto | 0.0.1-beta.6 |
| @bufbuild/protobuf | 2.16.0 |
| verter-tsc | 0.0.1-beta.6 |
| verter-lsp | 0.0.1-beta.6 |
| svelte-language-server | 0.18.4 |
| svelte2tsx | 0.7.61 |
| sveld | 0.38.0 |
| svelte-docinfo | 0.7.0 |
| prettier | 3.9.9 |
| prettier-plugin-svelte | 4.1.1 |
| oxfmt | 0.71.0 |
| eslint-plugin-svelte | 3.23.0 |
| typescript | 6.0.3 |
| cli:svelte-check | 4.7.6 |
| cli:svelte-check-rs | 0.11.2 |
| cli:svelte-check-native | 1.8.0 |
| cli:rsvelte-check | unknown |
| cli:rsvelte-fmt | 0.7.25 |
| cli:rsvelte-lint | 0.12.6 |
| cli:prettier | 3.9.9 |
| cli:oxfmt | 0.71.0 |
| cli:verter-tsc | 0.0.1-beta.6 |

</details>

