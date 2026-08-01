# Memory and resource probes

Speed and memory are measured in separate processes. Each tool/sample below uses a fresh worker with explicit garbage collection and an OS peak-RSS high-water mark. The baseline is captured before loading the tool or corpus, and retained deltas are captured after a final GC.

Only like-for-like workload classes may be compared. Compile currently covers the client/production paths for the two pinned Svelte compiler-version classes; projection covers the official-compatible svelte2tsx class and Verter's separate IDE schema. CPU time is diagnostic context, not a speed ranking. Native retained RSS can include allocator pages that remain mapped and is not automatically a leak.

<!-- MEMORY_RESULTS_START -->

> Auto-updated 2026-08-01 from isolated Linux resource probes.

# Resource probe results

- **Generated:** 2026-08-01T16:41:02.347Z
- **Fixture:** `fixtures/200` (200 Svelte files)
- **Samples per tool:** 3
- **Runner:** linux/x64 · Node v22.23.1

Each sample runs in a fresh `node --expose-gc` process. Baseline RSS is captured after GC but before the tool or corpus is loaded. Peak RSS uses the OS high-water mark; retained deltas are captured after a final GC. Memory is not sampled inside speed benchmarks.

## compile

### SVELTE 5.56.8 CLIENT PRODUCTION

| Tool | Files | Peak RSS Δ median [range] | Retained RSS Δ | Retained heap Δ | CPU context | Status |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| svelte/compiler 5.56.8 | 200 | 71.25 MB [71.19 MB–75.09 MB] | 71.25 MB [71.19 MB–75.09 MB] | 11.72 MB [11.71 MB–11.72 MB] | 1258.1 ms [1239.6 ms–1286.5 ms] | measured |
| @rsvelte/compiler (Wasm) | 200 | 243.68 MB [183.16 MB–286.45 MB] | 243.68 MB [183.16 MB–285.32 MB] | 0.37 MB [0.37 MB–0.37 MB] | 2844.2 ms [1808.2 ms–3287.3 ms] | measured |
| @rsvelte/native (NAPI) | 200 | 33.34 MB [31.64 MB–33.47 MB] | 33.34 MB [29.87 MB–33.47 MB] | 0.53 MB [0.53 MB–0.53 MB] | 156.9 ms [148.8 ms–157.1 ms] | measured |

<details><summary>Notes</summary>

- **svelte/compiler 5.56.8**: 200/200 non-empty client outputs passed runtime and marker gates
- **@rsvelte/compiler (Wasm)**: 200/200 non-empty client outputs passed runtime and marker gates
- **@rsvelte/native (NAPI)**: 200/200 non-empty client outputs passed runtime and marker gates

</details>

### SVELTE 5.56.4 CLIENT PRODUCTION

| Tool | Files | Peak RSS Δ median [range] | Retained RSS Δ | Retained heap Δ | CPU context | Status |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| svelte/compiler 5.56.4 | 200 | 71.84 MB [71.50 MB–72.06 MB] | 71.84 MB [71.50 MB–72.06 MB] | 11.73 MB [11.73 MB–11.74 MB] | 1238.5 ms [1237.5 ms–1253.3 ms] | measured |
| @mrwaip/svelte-rs (NAPI) | 200 | 26.46 MB [26.44 MB–26.62 MB] | 26.46 MB [26.44 MB–26.62 MB] | 0.27 MB [0.27 MB–0.27 MB] | 62.3 ms [61.9 ms–62.5 ms] | measured |

<details><summary>Notes</summary>

- **svelte/compiler 5.56.4**: 200/200 non-empty client outputs passed runtime and marker gates
- **@mrwaip/svelte-rs (NAPI)**: 200/200 non-empty client outputs passed runtime and marker gates

</details>

### VERTER RUNTIME COMPILE

| Tool | Files | Peak RSS Δ median [range] | Retained RSS Δ | Retained heap Δ | CPU context | Status |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Verter runtime compile | 200 | – | – | – | – | skipped |

<details><summary>Notes</summary>

- **Verter runtime compile**: No public Svelte runtime compile API; no proxy workload is sampled.

</details>

## projection

### SVELTE2TSX COMPATIBLE

| Tool | Files | Peak RSS Δ median [range] | Retained RSS Δ | Retained heap Δ | CPU context | Status |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| svelte2tsx | 200 | 83.86 MB [82.76 MB–84.25 MB] | 83.86 MB [82.76 MB–84.25 MB] | 23.91 MB [23.91 MB–23.91 MB] | 1096.6 ms [1052.3 ms–1098.5 ms] | measured |
| @rsvelte/svelte2tsx (Wasm) | 200 | 103.80 MB [100.03 MB–108.92 MB] | 103.80 MB [99.91 MB–108.92 MB] | 0.42 MB [0.42 MB–0.42 MB] | 460.9 ms [451.5 ms–466.3 ms] | measured |

<details><summary>Notes</summary>

- **svelte2tsx**: 200/200 non-empty source-specific projections
- **@rsvelte/svelte2tsx (Wasm)**: 200/200 non-empty source-specific projections

</details>

### VERTER IDE PROJECTION

| Tool | Files | Peak RSS Δ median [range] | Retained RSS Δ | Retained heap Δ | CPU context | Status |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Verter IDE projection | 200 | 40.60 MB [40.49 MB–40.90 MB] | 40.60 MB [40.49 MB–40.90 MB] | 0.38 MB [0.38 MB–0.38 MB] | 210.4 ms [209.3 ms–211.4 ms] | measured |

<details><summary>Notes</summary>

- **Verter IDE projection**: 200/200 non-empty source-specific projections

</details>

## Interpretation

- Compare only rows in the same workload class.
- Peak RSS delta is the primary resource number; retained deltas describe memory still live after GC.
- CPU is context only, not a speed ranking: resource sampling and GC intentionally perturb timing.
- Native allocator pages may remain mapped after work; a retained RSS delta is not automatically a leak.

<!-- MEMORY_RESULTS_END -->
