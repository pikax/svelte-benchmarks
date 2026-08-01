# Methodology

This suite follows the reporting and publishing conventions of [vue-benchmarks](https://github.com/pikax/vue-benchmarks), adapted to the APIs that Svelte tools actually expose. Shared principles are copied; Vue-only workloads are not.

## Measurement principles

- The primary metric is the median of measured runs.
- At least one complete pass is discarded before measurement. `--warmups 0` is clamped to one.
- Tool order rotates on every warmup and measured pass, including rows that later fail a work gate.
- A timing is unranked when there are fewer measured passes than active variants, because every variant cannot visit every execution position.
- A failed gate does not erase a time. The row is shown in brackets and excluded from `vs fastest` and throughput rankings.
- Rows above 50% coefficient of variation are unranked when at least three samples exist. The rule applies to every row, including an official baseline.
- No cold-start column is published. A cold JavaScript process pays JIT startup that an already-native executable does not, so it is a different question from warmed throughput.
- Speed and resource use are not measured in the same process. This repository currently publishes speed only.

The harness applies the same rule to every implementation on a surface. It does not add exemptions for an official, Rust, native, Wasm, or experimental tool.

## Comparison boundaries

A table can contain rows with different invocation modes, thread counts, or TypeScript engines because some tools expose only one mode. Those properties are printed on the row and in its notes. The table makes the measurements visible together; it does not make the modes equivalent.

In particular:

- CLI rows pay process startup and configuration discovery on every run.
- In-process rows amortize process startup.
- `1T`, `workers`, and `max` are different execution modes.
- Typecheck and LSP rows tagged **(JS)** use the JavaScript TypeScript engine. Untagged native rows may use tsgo. A cross-engine ratio includes that engine difference.

## Fixture corpus

`pnpm generate` creates deterministic, flat `.svelte` corpora:

| Path                  | Purpose                                                             |
| --------------------- | ------------------------------------------------------------------- |
| `fixtures/N`          | Unique Svelte source bodies; primary ranking corpus.                |
| `fixtures/N-repeated` | Repeated bodies; cache demonstration only, never a primary ranking. |

Files are sorted before a limit is applied, so every tool receives the same prefix. Generated fixtures and work directories are disposable and excluded from Git.

## Surface rules

### Compile

The matrix is:

- target: `client` or `server`;
- environment: `production` or `development`;

Within a pinned compiler-version class, every row compiles the same in-memory sources in a cell. Real-world eligibility is established independently by that class's official compiler, and the report shows each row's file count. Each input must return its own non-empty code artifact; a large aggregate from only part of the corpus is not accepted as coverage.

Compared paths:

- official `svelte/compiler` `compile()` with `runes: true` for generated fixtures and compiler auto-detection for real-world sources;
- `@mrwaip/svelte-rs` through its compiler-compatible NAPI API;
- `@rsvelte/compiler` Wasm `compile(source, options)` API;
- `@rsvelte/vite-plugin-svelte-native` NAPI bindings;
- Verter is reported `skipped` because the installed package exposes an experimental Svelte IDE projection but no public Svelte runtime compile API. Its different runtime-render batching API is not substituted.

Compile version classes are explicit. rsvelte is ranked with the primary `svelte@5.56.8` reference. MrWaip documents parity against `svelte@5.56.4`, so the harness installs that exact official version under `svelte-mrwaip-reference` and ranks those two together. A skipped Verter row is not mixed into either version ranking.

Every compiler output must parse as JavaScript, emit the expected Svelte client/server runtime import, retain the fixture's unique marker, match the applicable official reference's external-CSS presence, and must not leave a `$state(...)` call uncompiled. Production and development output must differ. Matching reference CSS avoids mistaking an SVG-internal `<style>` element for a component stylesheet. The rsvelte Wasm matrix uses the option-bearing `compile()` API; its `compile_client`/`compile_server` convenience calls are not used because they cannot represent the shared dev and CSS options.

Artifact byte counts are printed as a diagnostic census, not as a correctness proof. Smaller generated code can be an optimization, an omitted transform, or simply a different runtime strategy. The harness does not infer which from byte count alone.

### Svelte TypeScript projection

Official `svelte2tsx` and `@rsvelte/svelte2tsx` receive the same sources and Svelte 5 options through synchronous in-process APIs. Every output must parse as TSX and contain Svelte projection helpers.

The rsvelte output is compared against official output after TypeScript parses and reprints both. This ignores formatting-only whitespace but preserves syntax and comments. A structural difference leaves the time visible and unranked. This is the `.svelte`-to-TypeScript representation used by Svelte language tooling; it is not a standalone JSX application-compile workload, runtime compilation, or component documentation.

Verter's `ensureIdeCompiled()`/`getIde()` path emits a Svelte IDE projection using `@verter/svelte-jsx`. It must parse as TSX and carry that Svelte helper marker. Because its carrier and helper contract are not `svelte2tsx`-compatible, it is measured in a separate comparison class rather than assigned a cross-schema speed ratio.

### Typecheck

All checkers run as fresh CLI processes. Every warmup and measured invocation receives a new byte-identical project directory and `tsconfig.json`; copying and cleanup occur outside the command timer. This prevents `.svelte-check`, build-info, or checker-specific disk caches from leaking across tools or runs.

The work gate has three independent checks:

1. a plain TypeScript assignment error inside `<script lang="ts">`;
2. a type error that exists only in Svelte markup;
3. a combined plant inserted into the staged corpus and included by its `tsconfig`.

All three must produce diagnostic-like output. The combined plant is then removed before measurement, so the reported file count and clean-corpus workload remain accurate. This prevents a generic TypeScript checker that ignores Svelte markup from ranking as a Svelte typechecker.

Diagnostic totals for the timed corpus are informational. Different tools can legitimately report different diagnostics; a non-zero count is not automatically more work or better correctness. A non-zero exit is accepted only when the output contains diagnostics attributable to source files. Startup, option, and backend failures are errors rather than fast checks.

The shared comparison class selects `--diagnostic-sources ts,svelte`; CSS is excluded because `svelte-check-native` does not implement CSS diagnostics. `svelte-check-rs` does not expose that selector, so its default-source workload is reported in a separate class. `verter-tsc` remains an experimental Svelte class. These classes are not ranked against each other.

### Format

Every timed formatter receives a fresh copy because formatting is destructive. All use write mode; no row benefits from an early-exit check mode.

Two untimed gates run before ranking:

- A deliberately messy `.svelte` file sits in a nested directory. The formatter must change its markup, not only its `<script>` block. The nesting catches non-recursive globs that would otherwise measure only CLI startup.
- Every corpus file receives the same deliberately mis-spaced top-level markup append. The tool runs once with its timed invocation, and the harness counts how many Svelte files changed. Anything below the full corpus is unranked. A census failure is also unranked rather than treated as a silent pass.

Output style is not normalized. This surface compares whole-SFC format throughput after minimum-work gates; it does not claim byte-identical formatting.

The pinned Oxfmt release excludes `.svelte` files. Its row is skipped rather than timing CLI startup as a formatting proxy; the confirmation suite keeps a known-failure check so future Svelte support cannot arrive unnoticed.

### Lint

Every tool receives the same isolated subset.

The minimum semantic gate is `{@html ...}`, expected to trigger `svelte/no-at-html-tags` or an equivalent Svelte-aware diagnostic. A tool that ignores markup remains measured but unranked.

The same-file-set census adds the planted markup issue to every corpus file:

- directory-walk CLIs must name every planted Svelte file in their reporter output;
- API rows handed an explicit file list are marked coverage-by-construction;
- a missing file or failed census unranks the row.

Rule sets still differ, so ESLint recommended rules, rsvelte native rules, and Verter diagnostics are separate workload classes with no cross-engine ratio. ESLint is exposed in single-threaded API, worker-pool API, and CLI modes so the cost of invocation and parallelism is visible within its identical-rule-set class.

Lint CLIs may use exit 1 to report source diagnostics. Exit 2 or higher is treated as an operational failure and cannot rank, even if the process printed partial diagnostics first. This prevents a parser, rule, configuration, or internal crash from being timed as successful lint work.

### LSP

Each measured pass starts a fresh language-server process over the same one-file workspace.

The primary interval is `didOpen` to a non-empty hover on `benchMarker`. The response must carry plausible type content at both the script declaration and its template use. A server that starts but returns an empty, stale, or script-only answer is unranked.

The stdio surface excludes VS Code extension-host overhead. The optional end-to-end VS Code scripts are a separate workload and are not merged into this ranking.

### LSP formatting

Formatting is separate from hover because `@rsvelte/language-server` currently implements formatting and lint diagnostics, not TypeScript hover/completion. Every pass starts a fresh server, opens the same valid Svelte 5 component, and times `textDocument/formatting` after initialization. Output must rewrite both the script and nested markup.

### Component metadata

`sveld` is measured twice with its persistent cache disabled:

- AST-only, its default workload;
- `resolveTypes`, its TypeScript-semantic workload.

`sveld(resolveTypes)` analyzes an exported barrel/project, while `svelte-docinfo` globs Svelte files with dependency traversal disabled. Both are semantic, but the current gate does not prove equal type/default/event/slot products, so they remain separate informational classes. Verter is exercised through `@verter/typeinfo`'s wire decoder over `@verter/native`'s dedicated per-file Svelte framework-surface executor and is also separate. The higher-level `@verter/component-meta` wrapper is not substituted because its current Svelte `$props()` result failed the shared prop gate.

The AST-only row is a separate class. Component record basenames must match the staged source set exactly, with no missing or extra identities; every generated source containing `$props()` must yield prop metadata for that same basename. The gate proves minimum coverage, not identical metadata schemas or identical semantic depth.

`svelte2tsx` is recommended and benchmarked separately because it produces a TypeScript projection rather than a component-documentation model. `sveltedoc-parser` is not included: its latest published release predates Svelte 5 and documents Svelte 2/3-era syntax.

### Memory and resource probes

Memory is never sampled inside a speed benchmark. Each tool/sample runs in a fresh `node --expose-gc` worker. The worker forces GC and records baseline RSS before importing the tool or reading the corpus, performs the same gated compile or projection work over the same ordered file set, forces GC again, and records retained RSS/heap deltas. Peak RSS uses the operating system high-water mark exposed by `process.resourceUsage().maxRSS`.

Peak RSS delta is the primary resource number. Retained deltas describe memory still live or mapped after work; native allocator pages that remain mapped are not automatically leaks. CPU and wall time are emitted only as diagnostic context because explicit GC and resource isolation perturb timing. No resource report computes a speed ratio.

Compile resource rows use client/production/external-CSS options and stay inside their pinned Svelte compiler-version classes. Projection keeps the svelte2tsx-compatible implementations separate from Verter's IDE projection schema. Verter runtime compile remains skipped because no public Svelte runtime compile API is exposed; a different operation is not substituted.

Published resource reports are Linux-only and require at least three isolated samples per tool. The speed and memory CI jobs use separate runners and artifacts, so their values must not be correlated as if captured during one execution.

### Vite bundle

The bundle surface compares the official Svelte Vite plugin with rsvelte's documented drop-in fork. Both use Vite 7.3.6: it is the newest Vite major supported by both pinned plugin lines and their shared inspector dependency without a peer conflict. Both receive the same generated entry, ordered component list, compiler options, external Svelte runtime imports, disabled tree-shaking, disabled minification, and in-process Vite build boundary.

Before timing, a post-transform census requires every selected `.svelte` module to reach non-empty generated code containing a Svelte runtime import. The emitted bundle must also be non-empty. A partial or invalid graph remains visible but unranked. Artifact bytes are diagnostic; equal bytes are not assumed, and smaller output is not automatically better.

This surface measures one controlled generated module graph. It is not presented as Carbon, Huly, Open WebUI, Flowbite, or SMUI's project-native build.

### Vite incremental transform

The `hmr` command measures only the warm server-side compilation path used after an edit. Each pass creates a fresh Vite dev server, performs and discards the initial transform of the same component, writes a unique valid markup change, then times module invalidation plus the updated transform. The result must contain the changed marker. Server creation, initial transform, source write/restoration, and shutdown are outside the interval.

Filesystem watcher debounce, WebSocket delivery, browser fetch/execution, and DOM patching are excluded. The report therefore labels this a warm incremental transform, not an end-to-end HMR round trip.

## Real-world corpora

The manual real-world workflow uses pinned immutable commits from:

- Carbon Components Svelte;
- Huly Platform;
- Open WebUI;
- Flowbite Svelte;
- Svelte Material UI (SMUI).

Tags are paired with expected 40-character commit SHAs. Fetch fails if a tag moves or a configured file count drifts. Each report records repository, tag, commit, date, corpus kind, license, file count, byte count, and truncation state.

Real-world runs are source-only. No third-party dependency, install script, build, test, or lifecycle hook is executed. Sources are copied byte-for-byte into a deterministic flat staging directory so destructive formatters cannot mutate checkouts. Compile, projection, format, and lint do not resolve project imports, so flattening changes filenames but not the measured source bytes.

Project preprocessors are not installed. Before compile and projection timing, the corresponding official reference APIs are run over every raw source. Projection uses one official schema. Each compile version class uses only the files accepted by its own pinned official compiler; rejection by the older reference cannot shrink the newer class. Exclusions and per-row file counts are reported. This defines the direct-API workload without hiding a failure unique to a candidate implementation.

The workflow shards by project, never by surface: every tool and surface for one project stays on one runner. Rankings are within one project and one surface only. A `--file-limit` takes an alphabetical prefix and is marked as truncated; published runs use complete corpora.

Project-native build/HMR rows are deliberately absent. The controlled generated-fixture Vite surfaces compare the official and rsvelte drop-in plugins, but all five third-party projects do not expose one shared replacement mechanism or package-manager lifecycle. Modifying and installing each project differently would make a pooled project ranking tool-dependent.

## Reporting

Each full artifact contains:

- runner, platform, CPU, Node version, and tool versions;
- measured-run and warmup counts;
- methodology and row notes;
- raw run values;
- status and artifact census data.

The README contains summary tables only. `scripts/update-readme.mjs` writes full artifacts to `docs/results/` and links them from each summary. Real-world publication requires current JSON and Markdown artifacts for every configured project, every required surface, no file limit, at least five measured runs, and zero surface-process failures. Partial or failed matrices remain downloadable diagnostics but cannot update published results or inherit a fresh date.

Published benchmarks are manual-dispatch only. Pull requests and pushes run harness self-tests and an untimed correctness-confirmation suite but do not publish measurements. Known upstream failures are explicit and become CI failures when they unexpectedly start passing, forcing stale exceptions to be removed.

## Quick start

```bash
pnpm install
pnpm generate
pnpm test:harness
pnpm confirm
pnpm bench
```

Useful flags:

```text
--fixture PATH
--surfaces compile,projection,typecheck,format,lint,component-meta,lsp,lsp-format,bundle,hmr
--runs N
--warmups N
--file-limit N
--check-file-limit N
--lint-file-limit N
--compile-targets client,server
--compile-envs production,development
--json FILE
--out FILE
```

## Limitations

- Generated fixtures provide controlled plants; real-world corpora provide syntax diversity. Neither replaces the other.
- The work gates establish minimum comparable work, not full semantic conformance.
- CI does not flush the operating-system page cache between rows; rotation reduces order bias but cannot remove every shared-machine effect.
- Package versions and runner hardware are part of every report. Results from different reports should not be combined into one ranking.
- Experimental Svelte support can change independently of the harness. Unsupported behavior is reported as skipped, error, or unranked rather than replaced with a different framework workload.
