# Memory (isolated probe)

> This page is **generated** from committed JSON snapshots (`results/benchmarks/`, `results/real_world/`). Do not edit by hand — run `pnpm run docs`.

- **Generated:** 2026-09-29T12:39:05.008Z
- **Fixture:** `fixtures/200` (200 Svelte files)
- **Runner:** local · linux/x64 · 4 CPUs · AMD EPYC 7763 64-Core Processor · 16 GB RAM · Node v22.23.2
- **Source:** `memory-linux-200.json`

## Peak RSS by surface (isolated probes)

| Surface | Tool | Peak RSS | Retained Δ | CPU ms | Status |
| --- | --- | ---: | ---: | ---: | --- |
| compile | svelte/compiler 5.57.1 | 116.1 MB | 69.398 MB | 1349.782 | ok |
| compile | @rsvelte/compiler (Wasm) | 179.1 MB | 91.051 MB | 2261.347 | ok |
| compile | @rsvelte/native (NAPI) | 82.2 MB | 37.18 MB | 166.266 | ok |
| compile | @mrwaip/svelte-rs (NAPI) | 71.6 MB | 25.094 MB | 61.022 | ok |
| compile | Verter runtime compile | n/a | n/a | n/a | skipped |
| projection | svelte2tsx | 132.5 MB | 83.945 MB | 1111.022 | ok |
| projection | @rsvelte/svelte2tsx (Wasm) | 185.0 MB | 122.363 MB | 597.318 | ok |
| projection | Verter IDE projection | 98.0 MB | 51.766 MB | 257.728 | ok |

Memory and speed are separate passes; CPU columns are context only, never a speed ranking. Full samples live in the JSON snapshot.
