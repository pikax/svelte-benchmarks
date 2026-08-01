# Contributing

## Prerequisites

- Node.js **22+** (see `.node-version`)
- [pnpm](https://pnpm.io) 10 (`corepack enable`)

## Setup

```bash
corepack enable
pnpm install
pnpm generate:small
```

## Before opening a PR

Run the same gates as CI:

```bash
pnpm test:harness
pnpm confirm
pnpm smoke
```

CI is Linux-only. Run the same commands locally if Windows or macOS behavior matters.

Do not commit generated `fixtures/**`, local `results/**`, `work/**`, `work-real/**`, or `node_modules/` content. The tracked `.gitkeep` files and Linux reports published by CI are the exceptions.

## Fairness rules

These rules are adapted from `vue-benchmarks` and apply to every ranked surface:

1. Give every row the same corpus, requested operation, semantic options, warmup policy, and runner when the API permits it.
2. Do not preprocess, simplify, or filter inputs for one candidate only. A shared reference preflight may define one common corpus before timing, and exclusions must be counted in the report.
3. Split genuinely different work into separate comparison classes: Svelte version, client/server target, diagnostic sources, metadata depth, or another semantic difference. Engine, invocation, and thread count remain visible row properties.
4. If an API is missing, report `skipped`; do not substitute another workload. If work runs but fails a shared validation gate, retain the measurement as `unranked` with the reason.
5. Never add a tool-specific exemption to a shared correctness or coverage gate. Change a gate only when the new rule applies equally to every row in that class.
6. Persistent-cache work must not rank against full recompilation. Generated ranking corpora must remain content-unique.
7. Rotate tool order, require at least one discarded warmup, report variance, and exclude only through documented automatic rules.
8. Record exact packages and versions. Pair ports with the official Svelte patch version they target when known.
9. Keep wording factual. Describe the workload, conditions, and observed result without recommending a winner.

## Project layout

| Path                                         | Role                                                        |
| -------------------------------------------- | ----------------------------------------------------------- |
| `scripts/bench.mjs`                          | Generated-corpus throughput orchestrator                    |
| `scripts/bench-real-world.mjs`               | Pinned real-world, source-only orchestrator                 |
| `scripts/bench-memory.mjs`                   | Fresh-process compile/projection resource probes            |
| `scripts/ide-bench.mjs`                      | Validated hover and formatting LSP suite wrapper            |
| `scripts/lib/surfaces/`                      | One implementation per benchmark surface                    |
| `scripts/lib/real-world/`                    | Pinned project registry and corpus preparation              |
| `scripts/e2e-vscode/`                        | Separate VS Code extension-host benchmark                   |
| `tests/harness/`                             | Self-tests for measurement, validation, and reporting rules |
| `tests/confirm/`                             | Untimed correctness checks against real Svelte tools        |
| `.github/workflows/test.yml`                 | Harness and correctness validation on PRs and `main`        |
| `.github/workflows/pr.yml`                   | Non-publishing PR throughput smoke                          |
| `.github/workflows/benchmark.yml`            | Manual generated-corpus measurement and publishing          |
| `.github/workflows/benchmark-real-world.yml` | Manual per-project source measurement and publishing        |
| `.github/workflows/e2e-vscode.yml`           | Manual Svelte VS Code extension-host measurement            |

The generated benchmark deliberately keeps all tools and surfaces in one job. The real-world workflow may shard by project because projects are never ranked against one another; every tool and surface for one project must stay on the same runner.

## Adding a tool

1. Wire the tool only into surfaces its public Svelte API actually implements.
2. Add or extend a shared work gate that proves the requested Svelte work occurred.
3. Add a harness regression test for ranking/reporting behavior and a confirmation case for semantic behavior.
4. Record the installed package version in `scripts/lib/versions.mjs`.
5. Document semantic differences; use `skipped` rather than a proxy workload.

## Coding notes

- ESM only (`"type": "module"`) except VS Code-hosted CommonJS test files.
- Support Windows and Unix paths in scripts; prefer `node:path` over shell path manipulation.
- Keep Svelte TypeScript projection distinct from runtime compilation and from component-documentation metadata.

## License

Contributions are licensed under the [MIT License](LICENSE).
