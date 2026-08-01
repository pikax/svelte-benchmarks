# How to read the tables

- The primary number is the **median of warmed measured runs**. Min, standard deviation, and CV% show spread.
- CV% above 10 is flagged as noisy. Above 50%, a row with at least three samples is **too noisy to rank** and is bracketed.
- A suite with fewer runs than active variants cannot cover every execution position; those diagnostic timings are bracketed and unranked.
- Name markers: **⚠** measured but unranked · **❌** measurement error · **⏭** skipped or unavailable.
- A bracketed time remains useful evidence, but it is excluded from `vs fastest` and throughput comparisons.
- **(JS)** identifies the JavaScript TypeScript engine. Untagged native rows may use tsgo; cross-engine ratios include that difference.
- CLI, in-process, thread count, and cache mode are row properties. Compare like modes before attributing a difference to the tool implementation.
- Headings such as `TS+SVELTE`, `DEFAULT-SOURCES`, `AST`, and `SEMANTIC` are separate workload classes. Their rows are not ranked across headings.
- Real-world tables are comparable only within the same pinned project and surface. Files/second across different projects mostly measures different source code.
- Artifact columns are censuses, not universal correctness scores. Read the row note and full report before interpreting a large difference.
- Every summary links a full report under [`docs/results/`](results/) with environment, versions, methodology, row notes, and raw runs.

Corpus design and exact validation gates are documented in [methodology.md](methodology.md).
