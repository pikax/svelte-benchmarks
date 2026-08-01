# Memory and resource probes

Speed and memory are measured in separate processes. Each tool/sample below uses a fresh worker with explicit garbage collection and an OS peak-RSS high-water mark. The baseline is captured before loading the tool or corpus, and retained deltas are captured after a final GC.

Only like-for-like workload classes may be compared. Compile currently covers the client/production paths for the two pinned Svelte compiler-version classes; projection covers the official-compatible svelte2tsx class and Verter's separate IDE schema. CPU time is diagnostic context, not a speed ranking. Native retained RSS can include allocator pages that remain mapped and is not automatically a leak.

<!-- MEMORY_RESULTS_START -->

No Linux memory result has been published yet. Run the manual **Benchmark** workflow on `main`.

<!-- MEMORY_RESULTS_END -->
