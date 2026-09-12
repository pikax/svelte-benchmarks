# Svelte compiler

> This page is **generated** from committed JSON snapshots (`results/benchmarks/`, `results/real_world/`). Do not edit by hand — run `pnpm docs`.

- **Generated:** 2026-09-12T10:46:24.868Z
- **Fixture:** `fixtures/200` (200 Svelte files)
- **Runs / warmups:** 5 / 1
- **Runner:** Linux · linux/x64 · 4 CPUs · AMD EPYC 7763 64-Core Processor · 16 GB RAM · Node v22.23.2
- **Commit:** [cc44ddb](https://github.com/pikax/svelte-benchmarks/commit/cc44ddb)
- **CI run:** https://github.com/pikax/svelte-benchmarks/actions/runs/34688909557
- **Source:** `bench-Linux-200-bench.json`

## Results

Ranked on the **median of measured runs** — Warm is the primary ordering and ranking metric. Compiler rows additionally publish a separately sampled **Fresh child** column: the first timed row workload in a new child process, after excluded process startup, package imports and adapter setup. It is not called Cold (the OS page cache is not flushed) and its ratio never substitutes for the warm verdict. One table per comparable workload class: engine, invocation and threading remain row properties; target or explicitly different work may split classes — a pinned official Svelte reference is the baseline of its compatibility class, and a failed reference unranks the whole class rather than promoting a survivor. Every active variant must visit every execution position; shorter runs are unranked. A class with fewer than two valid rows is informational. Rows tagged **(JS)** run the JavaScript TypeScript compiler. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three samples is bracketed as TOO NOISY TO RANK, baseline included.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/compiler-compile-dark.svg">
  <img src="charts/compiler-compile.svg" alt="" width="760">
</picture>

### SFC compile (unique contents)

Files: **200** · Bytes: **134,760**

Ranked on the **median of measured runs** — Warm is the primary ordering and ranking metric. Compiler rows additionally publish a separately sampled **Fresh child** column: the first timed row workload in a new child process, after excluded process startup, package imports and adapter setup. It is not called Cold (the OS page cache is not flushed) and its ratio never substitutes for the warm verdict. One table per comparable workload class: engine, invocation and threading remain row properties; target or explicitly different work may split classes — a pinned official Svelte reference is the baseline of its compatibility class, and a failed reference unranks the whole class rather than promoting a survivor. Every active variant must visit every execution position; shorter runs are unranked. A class with fewer than two valid rows is informational. Rows tagged **(JS)** run the JavaScript TypeScript compiler. Name markers: ⚠ failed validation (time bracketed, unranked) · ❌ error · ⏭ skipped. A row above CV 50% with at least three samples is bracketed as TOO NOISY TO RANK, baseline included.

Tools:

- **svelte/compiler 5.56.8** — Primary official Svelte compiler reference used by the rsvelte packages in this harness.
- **svelte/compiler 5.56.4** — Pinned official reference for @mrwaip/svelte-rs, which documents parity against Svelte 5.56.4.
- **@mrwaip/svelte-rs (NAPI)** — MrWaip/svelte-rs native compiler through its svelte/compiler-compatible API.
- **@rsvelte/compiler (wasm)** — rsvelte WASM compiler bindings.
- **@rsvelte/native (NAPI)** — rsvelte native NAPI compiler (@rsvelte/vite-plugin-svelte-native).

Validation (runtime semantic plants):

Suite 2026-09-12.2 · hash 451381a17402 · 4 cell(s)

| Cell | Status | Entrypoint verdicts |
| --- | --- | --- |
| client/production/source-map-off | FAIL | svelte-official: PASS · svelte-mrwaip-reference: PASS · mrwaip-svelte-rs: FAIL · rsvelte-wasm: FAIL · rsvelte-native: FAIL |
| client/development/source-map-off | FAIL | svelte-official: PASS · svelte-mrwaip-reference: PASS · mrwaip-svelte-rs: FAIL · rsvelte-wasm: FAIL · rsvelte-native: FAIL |
| server/production/source-map-off | FAIL | svelte-official: PASS · svelte-mrwaip-reference: PASS · mrwaip-svelte-rs: FAIL · rsvelte-wasm: PASS · rsvelte-native: PASS |
| server/development/source-map-off | FAIL | svelte-official: PASS · svelte-mrwaip-reference: PASS · mrwaip-svelte-rs: FAIL · rsvelte-wasm: PASS · rsvelte-native: PASS |

Compile results are **grouped by target × environment**, then by comparison class.

#### CLIENT · production

Target: `client` · Environment: `production`

##### EXPERIMENTAL-SVELTE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter native ⏭ | 200 | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Verter native ⏭**: No public Svelte runtime compile API; the experimental carrier exposes an IDE projection only. No proxy workload is timed.

</details>

##### SVELTE-5.56.4 — separate workload

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte/compiler 5.56.4 | 200 | 456.3 ms | 1.00x | **346.5 ms** | 296.5 ms | 35.6 ms | 10.3% ⚠ | — | 366,026 | 118.949 MB | — |
| @mrwaip/svelte-rs (NAPI) ⚠ | 200 | (39.3 ms) | not ranked | (39.1 ms) | (38.9 ms) | – | – | not ranked | (364,246) | 71.574 MB | – |

<details><summary>Notes</summary>

- **svelte/compiler 5.56.4**: Pinned official reference for @mrwaip/svelte-rs; generate=client, dev=false, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through svelte-mrwaip-reference/compiler compile() per plant, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **@mrwaip/svelte-rs (NAPI) ⚠**: @mrwaip/svelte-rs compile(), generate=client, dev=false, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-styles: css.css-0: mapped to 2:24; expected 9:24; crlf-styles: css.css-0: mapped to 2:24; expected 9:24). The timing remains visible but cannot rank until the emitted maps are correct.

</details>

##### SVELTE-5.56.8 — separate workload

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte/compiler 5.56.8 | 200 | 454.4 ms | 1.00x | **331.6 ms** | 297.9 ms | 42.0 ms | 12.7% ⚠ | — | 360,966 | 116.758 MB | — |
| @rsvelte/compiler (wasm) ⚠ | 200 | (320.0 ms) | not ranked | (280.2 ms) | (276.0 ms) | – | – | not ranked | (360,966) | 167.848 MB | – |
| @rsvelte/native (NAPI) ⚠ | 200 | (113.0 ms) | not ranked | (114.2 ms) | (113.5 ms) | – | – | not ranked | (360,966) | 81.375 MB | – |

<details><summary>Notes</summary>

- **svelte/compiler 5.56.8**: Official svelte/compiler compile(), generate=client, dev=false, css=external, runes=true | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through svelte/compiler compile() per plant, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **@rsvelte/compiler (wasm) ⚠**: rsvelte WASM compile(), generate=client, dev=false, css=external. ⚠ WASM path — not the NAPI native binding. | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-raw: js.script: mapped to 2:19; expected 2:17; lf-styles: js.script: mapped to 2:19; expected 2:17). The timing remains visible but cannot rank until the emitted maps are correct.
- **@rsvelte/native (NAPI) ⚠**: rsvelte NAPI compile(), generate=client, dev=false, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-raw: js.script: mapped to 2:19; expected 2:17; lf-styles: js.script: mapped to 2:19; expected 2:17). The timing remains visible but cannot rank until the emitted maps are correct.

</details>

<details><summary>Raw runs</summary>

- **svelte/compiler 5.56.4**: 385.0 ms, 346.5 ms, 322.6 ms, 296.5 ms, 370.0 ms · fresh child: 483.3 ms, 449.4 ms, 445.4 ms, 456.3 ms, 459.3 ms
- **@mrwaip/svelte-rs (NAPI)**: 49.0 ms, 39.1 ms, 39.1 ms, 38.9 ms, 44.9 ms · fresh child: 39.3 ms, 39.0 ms, 39.0 ms, 39.4 ms, 40.1 ms
- **svelte/compiler 5.56.8**: 390.3 ms, 379.1 ms, 331.6 ms, 297.9 ms, 306.0 ms · fresh child: 439.1 ms, 454.4 ms, 444.9 ms, 467.4 ms, 467.8 ms
- **@rsvelte/compiler (wasm)**: 297.6 ms, 287.4 ms, 276.0 ms, 280.2 ms, 279.4 ms · fresh child: 317.7 ms, 320.5 ms, 320.0 ms, 318.5 ms, 320.0 ms
- **@rsvelte/native (NAPI)**: 116.0 ms, 115.7 ms, 114.2 ms, 113.5 ms, 114.1 ms · fresh child: 112.8 ms, 115.2 ms, 113.0 ms, 112.6 ms, 114.2 ms

</details>

#### CLIENT · development

Target: `client` · Environment: `development`

##### EXPERIMENTAL-SVELTE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter native ⏭ | 200 | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Verter native ⏭**: No public Svelte runtime compile API; the experimental carrier exposes an IDE projection only. No proxy workload is timed.

</details>

##### SVELTE-5.56.4 — separate workload

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte/compiler 5.56.4 | 200 | 461.6 ms | 1.00x | **309.5 ms** | 305.2 ms | 4.7 ms | 1.5% | — | 474,006 | 118.949 MB | — |
| @mrwaip/svelte-rs (NAPI) ⚠ | 200 | (41.3 ms) | not ranked | (40.6 ms) | (40.1 ms) | – | – | not ranked | (466,626) | 71.574 MB | – |

<details><summary>Notes</summary>

- **svelte/compiler 5.56.4**: Pinned official reference for @mrwaip/svelte-rs; generate=client, dev=true, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through svelte-mrwaip-reference/compiler compile() per plant, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **@mrwaip/svelte-rs (NAPI) ⚠**: @mrwaip/svelte-rs compile(), generate=client, dev=true, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-styles: css.css-0: mapped to 2:24; expected 9:24; crlf-styles: css.css-0: mapped to 2:24; expected 9:24). The timing remains visible but cannot rank until the emitted maps are correct.

</details>

##### SVELTE-5.56.8 — separate workload

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte/compiler 5.56.8 | 200 | 453.8 ms | 1.00x | **310.9 ms** | 303.0 ms | 10.6 ms | 3.4% | — | 468,726 | 116.758 MB | — |
| @rsvelte/compiler (wasm) ⚠ | 200 | (355.8 ms) | not ranked | (308.5 ms) | (306.6 ms) | – | – | not ranked | (468,726) | 167.848 MB | – |
| @rsvelte/native (NAPI) ⚠ | 200 | (126.2 ms) | not ranked | (127.2 ms) | (126.0 ms) | – | – | not ranked | (468,726) | 81.375 MB | – |

<details><summary>Notes</summary>

- **svelte/compiler 5.56.8**: Official svelte/compiler compile(), generate=client, dev=true, css=external, runes=true | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through svelte/compiler compile() per plant, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **@rsvelte/compiler (wasm) ⚠**: rsvelte WASM compile(), generate=client, dev=true, css=external. ⚠ WASM path — not the NAPI native binding. | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-raw: js.script: mapped to 2:19; expected 2:17; lf-styles: js.script: mapped to 2:19; expected 2:17). The timing remains visible but cannot rank until the emitted maps are correct.
- **@rsvelte/native (NAPI) ⚠**: rsvelte NAPI compile(), generate=client, dev=true, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/client and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-raw: js.script: mapped to 2:19; expected 2:17; lf-styles: js.script: mapped to 2:19; expected 2:17). The timing remains visible but cannot rank until the emitted maps are correct.

</details>

<details><summary>Raw runs</summary>

- **svelte/compiler 5.56.4**: 315.5 ms, 305.2 ms, 309.5 ms, 313.7 ms, 305.4 ms · fresh child: 452.5 ms, 462.4 ms, 461.5 ms, 461.6 ms, 476.6 ms
- **@mrwaip/svelte-rs (NAPI)**: 42.0 ms, 40.5 ms, 40.6 ms, 40.1 ms, 41.2 ms · fresh child: 41.3 ms, 41.4 ms, 41.2 ms, 41.3 ms, 41.1 ms
- **svelte/compiler 5.56.8**: 330.4 ms, 303.0 ms, 310.9 ms, 311.1 ms, 306.8 ms · fresh child: 453.8 ms, 456.5 ms, 439.6 ms, 444.0 ms, 462.6 ms
- **@rsvelte/compiler (wasm)**: 311.2 ms, 308.5 ms, 310.7 ms, 306.6 ms, 308.4 ms · fresh child: 346.8 ms, 351.4 ms, 355.8 ms, 360.1 ms, 360.7 ms
- **@rsvelte/native (NAPI)**: 127.8 ms, 126.6 ms, 127.2 ms, 128.9 ms, 126.0 ms · fresh child: 126.3 ms, 126.3 ms, 124.7 ms, 126.2 ms, 125.0 ms

</details>

#### SERVER · production

Target: `server` · Environment: `production`

##### EXPERIMENTAL-SVELTE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter native ⏭ | 200 | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Verter native ⏭**: No public Svelte runtime compile API; the experimental carrier exposes an IDE projection only. No proxy workload is timed.

</details>

##### SVELTE-5.56.4 — separate workload

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte/compiler 5.56.4 | 200 | 389.5 ms | 1.00x | **254.1 ms** | 239.2 ms | 10.3 ms | 4.1% | — | 217,306 | 118.949 MB | — |
| @mrwaip/svelte-rs (NAPI) ⚠ | 200 | (32.6 ms) | not ranked | (31.4 ms) | (31.3 ms) | – | – | not ranked | (217,846) | 71.574 MB | – |

<details><summary>Notes</summary>

- **svelte/compiler 5.56.4**: Pinned official reference for @mrwaip/svelte-rs; generate=server, dev=false, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through svelte-mrwaip-reference/compiler compile() per plant, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **@mrwaip/svelte-rs (NAPI) ⚠**: @mrwaip/svelte-rs compile(), generate=server, dev=false, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-raw: js.missing or invalid version-3 source map; lf-styles: js.missing or invalid version-3 source map). The timing remains visible but cannot rank until the emitted maps are correct.

</details>

##### SVELTE-5.56.8 — separate workload

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @rsvelte/native (NAPI) | 200 | 83.1 ms | 1.00x | **81.6 ms** | 80.4 ms | 1.8 ms | 2.2% | 1.00x | 214,546 | 81.375 MB | 2.5k files/s |
| @rsvelte/compiler (wasm) | 200 | 241.4 ms | 2.90x | **208.4 ms** | 205.1 ms | 2.4 ms | 1.1% | 2.55x | 214,546 | 167.848 MB | 960 files/s |
| svelte/compiler 5.56.8 | 200 | 390.2 ms | 4.70x | **257.6 ms** | 241.0 ms | 11.5 ms | 4.5% | 3.16x | 214,546 | 116.758 MB | 776 files/s |

<details><summary>Notes</summary>

- **@rsvelte/native (NAPI)**: rsvelte NAPI compile(), generate=server, dev=false, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through @rsvelte/vite-plugin-svelte-native compileSync() per plant, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **@rsvelte/compiler (wasm)**: rsvelte WASM compile(), generate=server, dev=false, css=external. ⚠ WASM path — not the NAPI native binding. | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through @rsvelte/compiler compile() per plant after initSync, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **svelte/compiler 5.56.8**: Official svelte/compiler compile(), generate=server, dev=false, css=external, runes=true | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through svelte/compiler compile() per plant, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)

</details>

<details><summary>Raw runs</summary>

- **svelte/compiler 5.56.4**: 268.2 ms, 254.9 ms, 252.6 ms, 254.1 ms, 239.2 ms · fresh child: 402.9 ms, 382.6 ms, 407.5 ms, 383.2 ms, 389.5 ms
- **@mrwaip/svelte-rs (NAPI)**: 32.0 ms, 31.4 ms, 31.3 ms, 31.4 ms, 31.4 ms · fresh child: 32.5 ms, 33.3 ms, 32.5 ms, 32.9 ms, 32.6 ms
- **@rsvelte/native (NAPI)**: 84.9 ms, 83.2 ms, 80.4 ms, 81.3 ms, 81.6 ms · fresh child: 84.0 ms, 83.4 ms, 82.6 ms, 83.1 ms, 82.3 ms
- **@rsvelte/compiler (wasm)**: 210.0 ms, 210.8 ms, 205.1 ms, 208.4 ms, 206.3 ms · fresh child: 241.4 ms, 250.4 ms, 240.1 ms, 241.7 ms, 239.0 ms
- **svelte/compiler 5.56.8**: 271.6 ms, 257.6 ms, 262.1 ms, 251.5 ms, 241.0 ms · fresh child: 387.9 ms, 410.1 ms, 390.2 ms, 400.7 ms, 375.1 ms

</details>

#### SERVER · development

Target: `server` · Environment: `development`

##### EXPERIMENTAL-SVELTE — separate workload

| Tool | Files | **Median (primary)** | Min | Stddev | CV% | vs fastest | Artifact | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Verter native ⏭ | 200 | skipped | – | – | – | – | – | – |

<details><summary>Notes</summary>

- **Verter native ⏭**: No public Svelte runtime compile API; the experimental carrier exposes an IDE projection only. No proxy workload is timed.

</details>

##### SVELTE-5.56.4 — separate workload

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| svelte/compiler 5.56.4 | 200 | 403.4 ms | 1.00x | **251.6 ms** | 237.7 ms | 10.3 ms | 4.1% | — | 448,986 | 118.949 MB | — |
| @mrwaip/svelte-rs (NAPI) ⚠ | 200 | (35.1 ms) | not ranked | (33.1 ms) | (32.5 ms) | – | – | not ranked | (438,986) | 71.574 MB | – |

<details><summary>Notes</summary>

- **svelte/compiler 5.56.4**: Pinned official reference for @mrwaip/svelte-rs; generate=server, dev=true, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through svelte-mrwaip-reference/compiler compile() per plant, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **@mrwaip/svelte-rs (NAPI) ⚠**: @mrwaip/svelte-rs compile(), generate=server, dev=true, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ⚠ SOURCE-MAP COORDINATE VALIDITY FAIL — all 33 runtime plants passed, but generated JS/CSS tokens did not trace back to their exact source positions (lf-raw: js.missing or invalid version-3 source map; lf-styles: js.missing or invalid version-3 source map). The timing remains visible but cannot rank until the emitted maps are correct.

</details>

##### SVELTE-5.56.8 — separate workload

| Tool | Files | Fresh child | vs fastest fresh | **Warm (primary)** | Min | Stddev | CV% | vs fastest | Code bytes | Peak RSS | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| @rsvelte/native (NAPI) | 200 | 90.8 ms | 1.00x | **90.0 ms** | 89.5 ms | 0.5 ms | 0.6% | 1.00x | 445,986 | 81.375 MB | 2.2k files/s |
| @rsvelte/compiler (wasm) | 200 | 270.3 ms | 2.98x | **231.5 ms** | 228.3 ms | 2.5 ms | 1.1% | 2.57x | 445,986 | 167.848 MB | 864 files/s |
| svelte/compiler 5.56.8 | 200 | 400.1 ms | 4.41x | **267.5 ms** | 245.0 ms | 17.0 ms | 6.3% | 2.97x | 445,986 | 116.758 MB | 748 files/s |

<details><summary>Notes</summary>

- **@rsvelte/native (NAPI)**: rsvelte NAPI compile(), generate=server, dev=true, css=external | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through @rsvelte/vite-plugin-svelte-native compileSync() per plant, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **@rsvelte/compiler (wasm)**: rsvelte WASM compile(), generate=server, dev=true, css=external. ⚠ WASM path — not the NAPI native binding. | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through @rsvelte/compiler compile() per plant after initSync, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)
- **svelte/compiler 5.56.8**: Official svelte/compiler compile(), generate=server, dev=true, css=external, runes=true | runtime gate: ✓ 200/200 parseable outputs use svelte/internal/server and match official CSS presence; dev option changes output | ⓘ adapter parity: 10 distinct input revisions across 10 passes (warm + fresh child) | ✓ runtime semantic validity: 33/33 plants passed through svelte/compiler compile() per plant, css=external, runes=true | ✓ source-map coordinates: 4/4 anchored tokens traced exactly (LF/CRLF, non-BMP)

</details>

<details><summary>Raw runs</summary>

- **svelte/compiler 5.56.4**: 259.1 ms, 251.6 ms, 262.9 ms, 244.3 ms, 237.7 ms · fresh child: 403.4 ms, 401.1 ms, 400.7 ms, 404.6 ms, 415.8 ms
- **@mrwaip/svelte-rs (NAPI)**: 33.1 ms, 33.1 ms, 33.3 ms, 33.4 ms, 32.5 ms · fresh child: 35.1 ms, 34.9 ms, 35.2 ms, 34.7 ms, 35.1 ms
- **@rsvelte/native (NAPI)**: 90.8 ms, 89.5 ms, 89.7 ms, 90.0 ms, 90.0 ms · fresh child: 91.4 ms, 90.8 ms, 91.4 ms, 89.7 ms, 90.4 ms
- **@rsvelte/compiler (wasm)**: 231.5 ms, 231.8 ms, 231.3 ms, 235.3 ms, 228.3 ms · fresh child: 270.5 ms, 262.0 ms, 272.3 ms, 268.8 ms, 270.3 ms
- **svelte/compiler 5.56.8**: 285.9 ms, 254.9 ms, 279.8 ms, 267.5 ms, 245.0 ms · fresh child: 417.9 ms, 390.5 ms, 393.2 ms, 400.1 ms, 405.7 ms

</details>

<details><summary>Methodology</summary>

- Matrix: generate ∈ {client, server} × env ∈ {production, development} × source-map ∈ {off, on} (off by default).
- Within each pinned compiler-version class, every tool receives the same in-memory Svelte SFC corpus. Real-world eligibility is decided independently by that class's official reference and per-row file counts remain visible.
- Official: svelte/compiler compile() with runes=true. Generated fixtures force runes; real-world sources use compiler auto-detection.
- MrWaip: @mrwaip/svelte-rs native compiler through its compatible compile() API, ranked inside the pinned svelte-5.56.4 class with svelte/compiler 5.56.4 as the official reference/baseline.
- rsvelte: WASM (@rsvelte/compiler) and NAPI (@rsvelte/vite-plugin-svelte-native) paths are separate rows in the svelte-5.56.8 class.
- Verter exposes no public Svelte runtime compile API in the installed package (probed at runtime), so it is reported skipped; its different runtime-render batching API is not substituted.
- Every warmed/fresh pass compiles a REVISED corpus: a fixed-width comment token plus a used CSS custom-property rule. The timed loop asserts the token reached the emitted CSS, so a cached whole-output result from a previous pass fails the gate. Adapter parity additionally requires every warm and fresh pass to have received a distinct input revision.
- Every compiler must return one non-empty code artifact per input file, emit the expected Svelte client/server runtime import, and remove Svelte runes; aggregate byte totals alone are not accepted as proof of coverage.
- Fresh child = the first timed row workload in a NEW child process, after excluded Node startup, package imports, adapter construction and input materialisation. It is NOT machine-cold (OS page cache is not flushed) and its ratio never substitutes for the warm verdict.
- Source maps: every compared Svelte 5 compiler ALWAYS emits js.map/css.map from compile() (no off/on flag exists — the 'sourcemap' option is a chained-map INPUT), so an off/on matrix would measure the harness, not the tools. Instead the maps' COORDINATE CORRECTNESS gates every row: anchored tokens in generated JS/CSS must trace back to their exact source positions (segment fallback allowed, exact line/column required, sourcesContent equal to the full component), across LF/CRLF and non-BMP-shifted columns. Wrong-file, shifted, stale or byte-counted maps unrank the row.
- Runtime semantic validity: a 28-plant Svelte 5 suite (props/state/derived/bindable/bindings/events/each-keyed/await/snippets/stores/actions/context/dynamic components/{@html}/SVG/module script/legacy syntax + CSS semantics) runs per entrypoint per cell in isolated child processes after timing; non-PASS rows unrank, and a failed official reference unrankS every candidate in its compatibility class (no survivor promotion).
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
| validity-client | mrwaip-svelte-rs | ✗ fail | 0 failed, 0 unknown of 33; source-map FAIL (2 failed) — first failures:   'FAIL' !== 'PASS'  |
| validity-client | rsvelte-wasm | ✗ fail | 0 failed, 0 unknown of 33; source-map FAIL (4 failed) — first failures:   'FAIL' !== 'PASS'  |
| validity-client | rsvelte-native | ✗ fail | 0 failed, 0 unknown of 33; source-map FAIL (4 failed) — first failures:   'FAIL' !== 'PASS'  |
| validity-server | mrwaip-svelte-rs | ✗ fail | 0 failed, 0 unknown of 33; source-map FAIL (4 failed) — first failures:   'FAIL' !== 'PASS'  |
| validity-client | svelte-official | ✓ pass |  |
| validity-client | svelte-mrwaip-reference | ✓ pass |  |
| validity-server | svelte-official | ✓ pass |  |
| validity-server | svelte-mrwaip-reference | ✓ pass |  |
| validity-server | rsvelte-wasm | ✓ pass |  |
| validity-server | rsvelte-native | ✓ pass |  |

## Memory (isolated probe)

| Surface | Tool | Peak RSS | Retained Δ | CPU ms | Status |
| --- | --- | ---: | ---: | ---: | --- |
| compile | svelte/compiler 5.56.8 | 116.8 MB | 71.742 MB | 1388.823 | ok |
| compile | @rsvelte/compiler (Wasm) | 167.8 MB | 111.285 MB | 2182.868 | ok |
| compile | @rsvelte/native (NAPI) | 81.4 MB | 34.566 MB | 164.033 | ok |
| compile | svelte/compiler 5.56.4 | 118.9 MB | 70.965 MB | 1288.039 | ok |
| compile | @mrwaip/svelte-rs (NAPI) | 71.6 MB | 26.648 MB | 61.453 | ok |
| compile | Verter runtime compile | n/a | n/a | n/a | skipped |

## Tool versions

<details><summary>Pinned package versions</summary>

| Package | Version |
| --- | --- |
| svelte | 5.57.0 |
| svelte-mrwaip-reference | 5.56.4 |
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

