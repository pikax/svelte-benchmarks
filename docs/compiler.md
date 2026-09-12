# Svelte compiler

> This page is **generated** from committed JSON snapshots (`results/benchmarks/`, `results/real_world/`). Do not edit by hand — run `pnpm run docs`.

## Results

<details><summary>Ranking rules and measurement definitions</summary>

Ranked on the **median of measured runs** — Warm is the primary ordering and ranking metric. Compiler rows additionally publish a separately sampled **Fresh child** column: the first timed row workload in a new child process, after excluded process startup, package imports and adapter setup. It is not called Cold (the OS page cache is not flushed) and its ratio never substitutes for the warm verdict. One table per comparable workload class: engine, invocation and threading remain row properties; target or explicitly different work may split classes — the latest official Svelte compiler is the sole compiler baseline, and a failed reference unranks the whole comparison rather than promoting a survivor. Every active variant must visit every execution position; shorter runs are unranked. A class with fewer than two valid rows is informational. Rows tagged **(JS)** run the JavaScript TypeScript compiler. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three samples is bracketed as TOO NOISY TO RANK, baseline included.

</details>

- **Generated:** 2026-09-12T10:46:24.868Z
- **Fixture:** `fixtures/200` (200 Svelte files)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · AMD EPYC 7763 64-Core Processor · 16 GB RAM · Node v22.23.2
- **Commit:** [cc44ddb](https://github.com/pikax/svelte-benchmarks/commit/cc44ddb)
- **CI run:** https://github.com/pikax/svelte-benchmarks/actions/runs/34688909557
- **Source:** `bench-Linux-200-bench.json`

### SFC compile (unique contents)

Files: **200** · Bytes: **134,760**

Tools:

- **svelte/compiler 5.57.0** — Official svelte/compiler compile() API, single-threaded.
- **@mrwaip/svelte-rs (NAPI)** — MrWaip/svelte-rs native compiler through its svelte/compiler-compatible API.
- **@rsvelte/compiler (wasm)** — rsvelte WASM compiler bindings.
- **@rsvelte/native (NAPI)** — rsvelte native NAPI compiler (@rsvelte/vite-plugin-svelte-native).

Validation (runtime semantic plants):

Suite 2026-09-12.2 · hash 451381a17402 · 4 cell(s)

| Cell | Status | Entrypoint verdicts |
| --- | --- | --- |
| client/production/source-map-off | FAIL | svelte-official: PASS · mrwaip-svelte-rs: UNKNOWN · rsvelte-wasm: FAIL · rsvelte-native: FAIL |
| client/development/source-map-off | FAIL | svelte-official: PASS · mrwaip-svelte-rs: UNKNOWN · rsvelte-wasm: FAIL · rsvelte-native: FAIL |
| server/production/source-map-off | UNKNOWN | svelte-official: PASS · mrwaip-svelte-rs: UNKNOWN · rsvelte-wasm: PASS · rsvelte-native: PASS |
| server/development/source-map-off | UNKNOWN | svelte-official: PASS · mrwaip-svelte-rs: UNKNOWN · rsvelte-wasm: PASS · rsvelte-native: PASS |

Compile results are **grouped by target × environment**, then by comparison class.

#### CLIENT · production

Target: `client` · Environment: `production`

##### EXPERIMENTAL-SVELTE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter native ⏭ | 200 | skipped | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Verter native ⏭**: This snapshot predates the Verter compileMany diagnostic pass. That published entrypoint now runs unranked; timings will appear after a new benchmark run.

</details>

##### Svelte runtime

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-client-prod-class-svelte-dark.svg">
  <img src="charts/compiler-bench-linux-200-bench-compile-client-prod-class-svelte.svg" alt="Compiler — CLIENT · production · Svelte runtime" width="760">
</picture>

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte/compiler 5.57.0 | 200 | 454.4 ms | — | **331.6 ms** | 297.9 ms | 42.0 ms | 12.7% ⚠ | — | 360,966 | 116.758 MB | — |
| @rsvelte/native (NAPI) ⚠ | 200 | (113.0 ms) | not ranked | (114.2 ms) | (113.5 ms) | – | – | not ranked | (360,966) | 81.375 MB | – |
| @rsvelte/compiler (wasm) ⚠ | 200 | (320.0 ms) | not ranked | (280.2 ms) | (276.0 ms) | – | – | not ranked | (360,966) | 167.848 MB | – |
| @mrwaip/svelte-rs (NAPI) ⏭ | – | – | – | skipped | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **svelte/compiler 5.57.0**: Official svelte/compiler compile(), generate=client, dev=false, css=external, runes=true | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through svelte/compiler compile() per plant, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **@rsvelte/native (NAPI) ⚠**: rsvelte NAPI compile(), generate=client, dev=false, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-raw: js.script: mapped to 2:19; expected 2:17; lf-styles: js.script: mapped to 2:19; expected 2:17). The timing remains visible but cannot rank until the emitted maps are correct.
- **@rsvelte/compiler (wasm) ⚠**: rsvelte WASM compile(), generate=client, dev=false, css=external. ⚠ WASM path — not the NAPI native binding. | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-raw: js.script: mapped to 2:19; expected 2:17; lf-styles: js.script: mapped to 2:19; expected 2:17). The timing remains visible but cannot rank until the emitted maps are correct.
- **@mrwaip/svelte-rs (NAPI) ⏭**: Awaiting rerun against the current Svelte reference. This historical result used a retired reference; its original samples and validation remain in the source JSON.

</details>

<details><summary>Raw runs</summary>

- **svelte/compiler 5.57.0**: 390.3 ms, 379.1 ms, 331.6 ms, 297.9 ms, 306.0 ms · fresh child: 439.1 ms, 454.4 ms, 444.9 ms, 467.4 ms, 467.8 ms
- **@rsvelte/native (NAPI)**: 116.0 ms, 115.7 ms, 114.2 ms, 113.5 ms, 114.1 ms · fresh child: 112.8 ms, 115.2 ms, 113.0 ms, 112.6 ms, 114.2 ms
- **@rsvelte/compiler (wasm)**: 297.6 ms, 287.4 ms, 276.0 ms, 280.2 ms, 279.4 ms · fresh child: 317.7 ms, 320.5 ms, 320.0 ms, 318.5 ms, 320.0 ms

</details>

#### CLIENT · development

Target: `client` · Environment: `development`

##### EXPERIMENTAL-SVELTE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter native ⏭ | 200 | skipped | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Verter native ⏭**: This snapshot predates the Verter compileMany diagnostic pass. That published entrypoint now runs unranked; timings will appear after a new benchmark run.

</details>

##### Svelte runtime

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-client-dev-class-svelte-dark.svg">
  <img src="charts/compiler-bench-linux-200-bench-compile-client-dev-class-svelte.svg" alt="Compiler — CLIENT · development · Svelte runtime" width="760">
</picture>

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte/compiler 5.57.0 | 200 | 453.8 ms | — | **310.9 ms** | 303.0 ms | 10.6 ms | 3.4% | — | 468,726 | 116.758 MB | — |
| @rsvelte/native (NAPI) ⚠ | 200 | (126.2 ms) | not ranked | (127.2 ms) | (126.0 ms) | – | – | not ranked | (468,726) | 81.375 MB | – |
| @rsvelte/compiler (wasm) ⚠ | 200 | (355.8 ms) | not ranked | (308.5 ms) | (306.6 ms) | – | – | not ranked | (468,726) | 167.848 MB | – |
| @mrwaip/svelte-rs (NAPI) ⏭ | – | – | – | skipped | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **svelte/compiler 5.57.0**: Official svelte/compiler compile(), generate=client, dev=true, css=external, runes=true | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through svelte/compiler compile() per plant, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **@rsvelte/native (NAPI) ⚠**: rsvelte NAPI compile(), generate=client, dev=true, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-raw: js.script: mapped to 2:19; expected 2:17; lf-styles: js.script: mapped to 2:19; expected 2:17). The timing remains visible but cannot rank until the emitted maps are correct.
- **@rsvelte/compiler (wasm) ⚠**: rsvelte WASM compile(), generate=client, dev=true, css=external. ⚠ WASM path — not the NAPI native binding. | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-raw: js.script: mapped to 2:19; expected 2:17; lf-styles: js.script: mapped to 2:19; expected 2:17). The timing remains visible but cannot rank until the emitted maps are correct.
- **@mrwaip/svelte-rs (NAPI) ⏭**: Awaiting rerun against the current Svelte reference. This historical result used a retired reference; its original samples and validation remain in the source JSON.

</details>

<details><summary>Raw runs</summary>

- **svelte/compiler 5.57.0**: 330.4 ms, 303.0 ms, 310.9 ms, 311.1 ms, 306.8 ms · fresh child: 453.8 ms, 456.5 ms, 439.6 ms, 444.0 ms, 462.6 ms
- **@rsvelte/native (NAPI)**: 127.8 ms, 126.6 ms, 127.2 ms, 128.9 ms, 126.0 ms · fresh child: 126.3 ms, 126.3 ms, 124.7 ms, 126.2 ms, 125.0 ms
- **@rsvelte/compiler (wasm)**: 311.2 ms, 308.5 ms, 310.7 ms, 306.6 ms, 308.4 ms · fresh child: 346.8 ms, 351.4 ms, 355.8 ms, 360.1 ms, 360.7 ms

</details>

#### SERVER · production

Target: `server` · Environment: `production`

##### EXPERIMENTAL-SVELTE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter native ⏭ | 200 | skipped | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Verter native ⏭**: This snapshot predates the Verter compileMany diagnostic pass. That published entrypoint now runs unranked; timings will appear after a new benchmark run.

</details>

##### Svelte runtime

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-server-prod-class-svelte-dark.svg">
  <img src="charts/compiler-bench-linux-200-bench-compile-server-prod-class-svelte.svg" alt="Compiler — SERVER · production · Svelte runtime" width="760">
</picture>

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @rsvelte/native (NAPI) | 200 | 83.1 ms | 1.00x | **81.6 ms** | 80.4 ms | 1.8 ms | 2.2% | 1.00x | 214,546 | 81.375 MB | 2.5k files/s |
| @rsvelte/compiler (wasm) | 200 | 241.4 ms | 2.90x | **208.4 ms** | 205.1 ms | 2.4 ms | 1.1% | 2.55x | 214,546 | 167.848 MB | 960 files/s |
| svelte/compiler 5.57.0 | 200 | 390.2 ms | 4.70x | **257.6 ms** | 241.0 ms | 11.5 ms | 4.5% | 3.16x | 214,546 | 116.758 MB | 776 files/s |
| @mrwaip/svelte-rs (NAPI) ⏭ | – | – | – | skipped | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **@rsvelte/native (NAPI)**: rsvelte NAPI compile(), generate=server, dev=false, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through @rsvelte/vite-plugin-svelte-native compileSync() per plant, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **@rsvelte/compiler (wasm)**: rsvelte WASM compile(), generate=server, dev=false, css=external. ⚠ WASM path — not the NAPI native binding. | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through @rsvelte/compiler compile() per plant after initSync, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **svelte/compiler 5.57.0**: Official svelte/compiler compile(), generate=server, dev=false, css=external, runes=true | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through svelte/compiler compile() per plant, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **@mrwaip/svelte-rs (NAPI) ⏭**: Awaiting rerun against the current Svelte reference. This historical result used a retired reference; its original samples and validation remain in the source JSON.

</details>

<details><summary>Raw runs</summary>

- **@rsvelte/native (NAPI)**: 84.9 ms, 83.2 ms, 80.4 ms, 81.3 ms, 81.6 ms · fresh child: 84.0 ms, 83.4 ms, 82.6 ms, 83.1 ms, 82.3 ms
- **@rsvelte/compiler (wasm)**: 210.0 ms, 210.8 ms, 205.1 ms, 208.4 ms, 206.3 ms · fresh child: 241.4 ms, 250.4 ms, 240.1 ms, 241.7 ms, 239.0 ms
- **svelte/compiler 5.57.0**: 271.6 ms, 257.6 ms, 262.1 ms, 251.5 ms, 241.0 ms · fresh child: 387.9 ms, 410.1 ms, 390.2 ms, 400.7 ms, 375.1 ms

</details>

#### SERVER · development

Target: `server` · Environment: `development`

##### EXPERIMENTAL-SVELTE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter native ⏭ | 200 | skipped | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Verter native ⏭**: This snapshot predates the Verter compileMany diagnostic pass. That published entrypoint now runs unranked; timings will appear after a new benchmark run.

</details>

##### Svelte runtime

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-bench-linux-200-bench-compile-server-dev-class-svelte-dark.svg">
  <img src="charts/compiler-bench-linux-200-bench-compile-server-dev-class-svelte.svg" alt="Compiler — SERVER · development · Svelte runtime" width="760">
</picture>

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @rsvelte/native (NAPI) | 200 | 90.8 ms | 1.00x | **90.0 ms** | 89.5 ms | 0.5 ms | 0.6% | 1.00x | 445,986 | 81.375 MB | 2.2k files/s |
| @rsvelte/compiler (wasm) | 200 | 270.3 ms | 2.98x | **231.5 ms** | 228.3 ms | 2.5 ms | 1.1% | 2.57x | 445,986 | 167.848 MB | 864 files/s |
| svelte/compiler 5.57.0 | 200 | 400.1 ms | 4.41x | **267.5 ms** | 245.0 ms | 17.0 ms | 6.3% | 2.97x | 445,986 | 116.758 MB | 748 files/s |
| @mrwaip/svelte-rs (NAPI) ⏭ | – | – | – | skipped | – | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **@rsvelte/native (NAPI)**: rsvelte NAPI compile(), generate=server, dev=true, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through @rsvelte/vite-plugin-svelte-native compileSync() per plant, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **@rsvelte/compiler (wasm)**: rsvelte WASM compile(), generate=server, dev=true, css=external. ⚠ WASM path — not the NAPI native binding. | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through @rsvelte/compiler compile() per plant after initSync, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **svelte/compiler 5.57.0**: Official svelte/compiler compile(), generate=server, dev=true, css=external, runes=true | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through svelte/compiler compile() per plant, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **@mrwaip/svelte-rs (NAPI) ⏭**: Awaiting rerun against the current Svelte reference. This historical result used a retired reference; its original samples and validation remain in the source JSON.

</details>

<details><summary>Raw runs</summary>

- **@rsvelte/native (NAPI)**: 90.8 ms, 89.5 ms, 89.7 ms, 90.0 ms, 90.0 ms · fresh child: 91.4 ms, 90.8 ms, 91.4 ms, 89.7 ms, 90.4 ms
- **@rsvelte/compiler (wasm)**: 231.5 ms, 231.8 ms, 231.3 ms, 235.3 ms, 228.3 ms · fresh child: 270.5 ms, 262.0 ms, 272.3 ms, 268.8 ms, 270.3 ms
- **svelte/compiler 5.57.0**: 285.9 ms, 254.9 ms, 279.8 ms, 267.5 ms, 245.0 ms · fresh child: 417.9 ms, 390.5 ms, 393.2 ms, 400.1 ms, 405.7 ms

</details>

<details><summary>Methodology</summary>

- Only the snapshot's main official Svelte reference is shown. Its label uses the recorded package version. Retired-reference results require a rerun; original timings, corpus scopes and methodology remain in the source JSON.
- Matrix: generate ∈ {client, server} × env ∈ {production, development} × source-map ∈ {off, on} (off by default).
- Official: svelte/compiler compile() with runes=true. Generated fixtures force runes; real-world sources use compiler auto-detection.
- This snapshot predates the Verter compileMany diagnostic pass. That published entrypoint now runs unranked; timings will appear after a new benchmark run.
- Every warmed/fresh pass compiles a REVISED corpus: a fixed-width comment token plus a used CSS custom-property rule. The timed loop asserts the token reached the emitted CSS, so a cached whole-output result from a previous pass fails the gate. Adapter parity additionally requires every warm and fresh pass to have received a distinct input revision.
- Every compiler must return one non-empty code artifact per input file, emit the expected Svelte client/server runtime import, and remove Svelte runes; aggregate byte totals alone are not accepted as proof of coverage.
- Fresh child = the first timed row workload in a NEW child process, after excluded Node startup, package imports, adapter construction and input materialisation. It is NOT machine-cold (OS page cache is not flushed) and its ratio never substitutes for the warm verdict.
- Source maps: every compared Svelte 5 compiler ALWAYS emits js.map/css.map from compile() (no off/on flag exists — the 'sourcemap' option is a chained-map INPUT), so an off/on matrix would measure the harness, not the tools. Instead the maps' COORDINATE CORRECTNESS gates every row: anchored tokens in generated JS/CSS must trace back to their exact source positions (segment fallback allowed, exact line/column required, sourcesContent equal to the full component), across LF/CRLF and non-BMP-shifted columns. Wrong-file, shifted, stale or byte-counted maps unrank the row.
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
| compile | server-render | ○ skip | verter |
| validity-client | mrwaip-svelte-rs | ○ skip | Awaiting rerun against the current Svelte reference. This historical result used a retired reference; its original samples and validation remain in the source J |
| validity-client | rsvelte-wasm | ✗ fail | 0 failed, 0 unknown of 33; source-map FAIL (4 failed) — first failures:   'FAIL' !== 'PASS'  |
| validity-client | rsvelte-native | ✗ fail | 0 failed, 0 unknown of 33; source-map FAIL (4 failed) — first failures:   'FAIL' !== 'PASS'  |
| validity-server | mrwaip-svelte-rs | ○ skip | Awaiting rerun against the current Svelte reference. This historical result used a retired reference; its original samples and validation remain in the source J |
| validity-client | svelte-official | ✓ pass |  |
| validity-server | svelte-official | ✓ pass |  |
| validity-server | rsvelte-wasm | ✓ pass |  |
| validity-server | rsvelte-native | ✓ pass |  |

## Memory (isolated probe)

| Surface | Tool | Peak RSS | Retained Δ | CPU ms | Status |
| --- | --- | ---: | ---: | ---: | --- |
| compile | svelte/compiler 5.57.0 | 116.8 MB | 71.742 MB | 1388.823 | ok |
| compile | @rsvelte/compiler (Wasm) | 167.8 MB | 111.285 MB | 2182.868 | ok |
| compile | @rsvelte/native (NAPI) | 81.4 MB | 34.566 MB | 164.033 | ok |
| compile | @mrwaip/svelte-rs (NAPI) | n/a | n/a | n/a | skipped |
| compile | Verter runtime compile | n/a | n/a | n/a | skipped |

## Tool versions

<details><summary>Pinned package versions</summary>

| Package | Version |
| --- | --- |
| svelte | 5.57.0 |
| svelte-check | 4.7.6 |
| svelte-check-rs | 0.11.2 |
| svelte-check-native | 1.5.2 |
| @mrwaip/svelte-rs | 0.0.0-canary.13.1 |
| @rsvelte/compiler | 0.12.2 |
| @rsvelte/svelte2tsx | 0.2.26 |
| @rsvelte/svelte-check | 0.5.28 |
| @rsvelte/language-server | 0.7.8 |
| @rsvelte/fmt | 0.7.23 |
| @rsvelte/lint | 0.12.2 |
| @rsvelte/vite-plugin-svelte-native | 0.3.14 |
| @rsvelte/vite-plugin-svelte | 0.5.2 |
| @sveltejs/vite-plugin-svelte | 7.3.0 |
| vite | 8.3.0 |
| @verter/native | 0.0.1-beta.3 |
| @verter/typeinfo | 0.0.1-beta.3 |
| @verter/proto | 0.0.1-beta.3 |
| @bufbuild/protobuf | 2.15.0 |
| verter-tsc | 0.0.1-beta.3 |
| verter-lsp | 0.0.1-beta.3 |
| svelte-language-server | 0.18.4 |
| svelte2tsx | 0.7.61 |
| sveld | 0.36.11 |
| svelte-docinfo | 0.7.0 |
| prettier | 3.9.6 |
| prettier-plugin-svelte | 4.1.1 |
| oxfmt | 0.67.0 |
| eslint-plugin-svelte | 3.23.0 |
| typescript | 6.0.3 |
| cli:svelte-check | 4.7.6 |
| cli:svelte-check-rs | 0.11.2 |
| cli:svelte-check-native | 1.5.2 |
| cli:rsvelte-check | unknown |
| cli:rsvelte-fmt | 0.7.23 |
| cli:rsvelte-lint | 0.12.2 |
| cli:prettier | 3.9.6 |
| cli:oxfmt | 0.67.0 |
| cli:verter-tsc | 0.0.1-beta.3 |

</details>

