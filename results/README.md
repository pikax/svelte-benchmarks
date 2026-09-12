# Results

- `benchmarks/` — canonical published benchmark snapshots (Linux CI, JSON only).
  Names: `bench-Linux-<N>-bench.json`, `ide-Linux.json`, `ide-scale-Linux.json`,
  `memory-linux-<N>.json`, `confirm.json`.
- `real_world/` — one pinned-project snapshot per file:
  `real-world-Linux-<project>.json`.

Everything at `results/` root (win32/darwin artifacts, smoke, probes) is
run-local and never committed.

Refresh locally from CI: `pnpm pull:ci-results` then `pnpm docs`. Publishing
happens only via the manual `benchmark.yml` dispatch on main.

A section whose artifacts are missing is left as published — a partial run
does not erase numbers it did not measure.
