# How to read the tables

- The primary number is the **median of warmed measured runs** (Warm). Min, standard deviation, and CV% show spread. Compiler tables add a separately sampled **Fresh child** column — the first timed workload in a new child process (startup/imports/setup excluded). Fresh child is context, never the ranking metric.
- CV% above 10 is flagged as noisy. Above 50%, a row with at least three samples is **too noisy to rank** and is bracketed.
- A suite with fewer runs than active variants cannot cover every execution position; those diagnostic timings are bracketed and unranked.
- Name markers: **⚠** measured but unranked · **❌** measurement error · **⏭** skipped or unavailable.
- Charts use the Vue benchmark renderer with stable colours for each tool family (Svelte orange, rsvelte blue, Verter red). Compiler range bars show **warm median** in solid fill and **fresh child** in lighter fill, both starting at zero. Values label both endpoints; hatched bars and struck names are unranked. Skipped and errored tools stay visible in the tables without an invented timing.
- The README shows production compiler workloads with separate charts for each compatibility class. Expand a timing table for ratios and memory, or follow the full-results link for development builds, notes, and validation evidence. A class with fewer than two valid measurements has no speed ratio.
- A bracketed time remains useful evidence, but it is excluded from `vs fastest` and throughput comparisons.
- **(JS)** identifies the JavaScript TypeScript engine. Untagged native rows may use tsgo; cross-engine ratios include that difference.
- CLI, in-process, thread count, and cache mode are row properties. Compare like modes before attributing a difference to the tool implementation.
- Headings such as `TS+SVELTE`, `DEFAULT-SOURCES`, `AST`, and `SEMANTIC` are separate workload classes. Their rows are not ranked across headings.
- Real-world tables are comparable only within the same pinned project and surface. Files/second across different projects mostly measures different source code.
- Artifact columns are censuses, not universal correctness scores. Read the row note and full report before interpreting a large difference.
- Every table links a full page under [`docs/`](.) with provenance, tool versions, raw samples, validation verdicts, and the artifact census. The JSON snapshots under `results/benchmarks/` are the source of truth; pages are generated.

Corpus design and exact validation gates are documented in [methodology.md](methodology.md).
