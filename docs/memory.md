# Memory (isolated probe)

> This page is **generated** from committed JSON snapshots (`results/benchmarks/`, `results/real_world/`). Do not edit by hand — run `pnpm run docs`.

- **Generated:** 2026-09-12T10:38:05.665Z
- **Fixture:** `fixtures/200` (200 Svelte files)
- **Runner:** local · linux/x64 · 4 CPUs · AMD EPYC 7763 64-Core Processor · 16 GB RAM · Node v22.23.2
- **Source:** `memory-linux-200.json`

## Peak RSS by surface (isolated probes)

| Surface | Tool | Peak RSS | Retained Δ | CPU ms | Status |
| --- | --- | ---: | ---: | ---: | --- |
| compile | svelte/compiler 5.56.8 | 116.8 MB | 71.742 MB | 1388.823 | ok |
| compile | @rsvelte/compiler (Wasm) | 167.8 MB | 111.285 MB | 2182.868 | ok |
| compile | @rsvelte/native (NAPI) | 81.4 MB | 34.566 MB | 164.033 | ok |
| compile | svelte/compiler 5.56.4 | 118.9 MB | 70.965 MB | 1288.039 | ok |
| compile | @mrwaip/svelte-rs (NAPI) | 71.6 MB | 26.648 MB | 61.453 | ok |
| compile | Verter runtime compile | n/a | n/a | n/a | skipped |
| projection | svelte2tsx | 131.8 MB | 84.219 MB | 1124.299 | ok |
| projection | @rsvelte/svelte2tsx (Wasm) | 181.8 MB | 113.129 MB | 590.615 | ok |
| projection | Verter IDE projection | 85.3 MB | 40.098 MB | 217.81 | ok |

Memory and speed are separate passes; CPU columns are context only, never a speed ranking. Full samples live in the JSON snapshot.
