# Resource probe results

- **Generated:** 2026-09-12T10:38:05.665Z
- **Fixture:** `fixtures/200` (200 Svelte files)
- **Samples per tool:** 3
- **Runner:** linux/x64 · Node v22.23.2

Each sample runs in a fresh `node --expose-gc` process. Baseline RSS is captured after GC but before the tool or corpus is loaded. Peak RSS uses the OS high-water mark; retained deltas are captured after a final GC. Memory is not sampled inside speed benchmarks.

## compile

### SVELTE CLIENT PRODUCTION

| Tool | Files | Peak RSS Δ median [range] | Retained RSS Δ | Retained heap Δ | CPU context | Status |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| svelte/compiler 5.57.0 | 200 | 71.74 MB [70.94 MB–71.78 MB] | 71.74 MB [70.94 MB–71.78 MB] | 11.76 MB [11.76 MB–11.77 MB] | 1349.4 ms [1337.4 ms–1388.8 ms] | measured |
| @rsvelte/compiler (Wasm) | 200 | 118.77 MB [111.94 MB–122.92 MB] | 111.28 MB [109.56 MB–122.74 MB] | 0.46 MB [0.43 MB–0.46 MB] | 2172.4 ms [2153.8 ms–2182.9 ms] | measured |
| @rsvelte/native (NAPI) | 200 | 35.41 MB [35.30 MB–36.76 MB] | 34.57 MB [33.56 MB–36.76 MB] | 0.56 MB [0.56 MB–0.56 MB] | 164.0 ms [156.4 ms–169.5 ms] | measured |
| @mrwaip/svelte-rs (NAPI) | 200 | – | – | – | – | skipped |

<details><summary>Notes</summary>

- **svelte/compiler 5.57.0**: 200/200 non-empty client outputs passed runtime and marker gates
- **@rsvelte/compiler (Wasm)**: 200/200 non-empty client outputs passed runtime and marker gates
- **@rsvelte/native (NAPI)**: 200/200 non-empty client outputs passed runtime and marker gates
- **@mrwaip/svelte-rs (NAPI)**: Awaiting rerun against the current Svelte reference. This historical result used a retired reference; its original samples and validation remain in the source JSON.

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
| svelte2tsx | 200 | 84.49 MB [84.22 MB–86.90 MB] | 84.49 MB [84.22 MB–86.90 MB] | 23.97 MB [23.97 MB–23.97 MB] | 1148.1 ms [1124.3 ms–1196.8 ms] | measured |
| @rsvelte/svelte2tsx (Wasm) | 200 | 130.83 MB [113.13 MB–136.93 MB] | 130.33 MB [113.13 MB–136.81 MB] | 0.47 MB [0.47 MB–0.47 MB] | 590.6 ms [582.6 ms–596.8 ms] | measured |

<details><summary>Notes</summary>

- **svelte2tsx**: 200/200 non-empty source-specific projections
- **@rsvelte/svelte2tsx (Wasm)**: 200/200 non-empty source-specific projections

</details>

### VERTER IDE PROJECTION

| Tool | Files | Peak RSS Δ median [range] | Retained RSS Δ | Retained heap Δ | CPU context | Status |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Verter IDE projection | 200 | 40.17 MB [40.10 MB–40.34 MB] | 40.17 MB [40.10 MB–40.34 MB] | 0.38 MB [0.38 MB–0.38 MB] | 217.8 ms [210.1 ms–226.3 ms] | measured |

<details><summary>Notes</summary>

- **Verter IDE projection**: 200/200 non-empty source-specific projections

</details>

## Interpretation

- Compare only rows in the same workload class.
- Peak RSS delta is the primary resource number; retained deltas describe memory still live after GC.
- CPU is context only, not a speed ranking: resource sampling and GC intentionally perturb timing.
- Native allocator pages may remain mapped after work; a retained RSS delta is not automatically a leak.
