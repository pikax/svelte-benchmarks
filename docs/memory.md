# Memory (isolated probe)

> This page is **generated** from committed JSON snapshots (`results/benchmarks/`, `results/real_world/`). Do not edit by hand — run `pnpm run docs`.

- **Generated:** 2026-09-18T13:07:13.119Z
- **Fixture:** `fixtures/200` (200 Svelte files)
- **Runner:** local · linux/x64 · 4 CPUs · AMD EPYC 7763 64-Core Processor · 16 GB RAM · Node v22.23.2
- **Source:** `memory-linux-200.json`

## Peak RSS by surface (isolated probes)

| Surface | Tool | Peak RSS | Retained Δ | CPU ms | Status |
| --- | --- | ---: | ---: | ---: | --- |
| compile | svelte/compiler 5.57.0 | 118.6 MB | 72.109 MB | 1241.57 | ok |
| compile | @rsvelte/compiler (Wasm) | 179.2 MB | 120.906 MB | 2129.149 | ok |
| compile | @rsvelte/native (NAPI) | 81.9 MB | 37.004 MB | 151.303 | ok |
| compile | @mrwaip/svelte-rs (NAPI) | 69.9 MB | 25.051 MB | 60.945 | ok |
| compile | Verter runtime compile | n/a | n/a | n/a | skipped |
| projection | svelte2tsx | 132.2 MB | 83.727 MB | 1103.211 | ok |
| projection | @rsvelte/svelte2tsx (Wasm) | 182.4 MB | 135.422 MB | 575.539 | ok |
| projection | Verter IDE projection | n/a | n/a | n/a | error |

Memory and speed are separate passes; CPU columns are context only, never a speed ranking. Full samples live in the JSON snapshot.
