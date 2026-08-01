import { resolve } from "node:path";
import { collectSvelteFiles } from "./fixtures.mjs";

export function buildMemoryTasks(fixtureDir, options = {}) {
  const files = collectSvelteFiles(fixtureDir, options.fileLimit).map(
    (file) => ({
      filename: file,
      path: resolve(fixtureDir, file),
    }),
  );
  if (files.length === 0)
    throw new Error("memory benchmark found no Svelte files");
  const payload = { files };

  return [
    {
      id: "memory-svelte-5.56.8-client",
      label: "svelte/compiler 5.56.8",
      package: "svelte",
      surface: "compile",
      comparisonClass: "svelte-5.56.8-client-production",
      handler: "compile",
      payload: { ...payload, implementation: "svelte" },
    },
    {
      id: "memory-rsvelte-wasm-client",
      label: "@rsvelte/compiler (Wasm)",
      package: "@rsvelte/compiler",
      surface: "compile",
      comparisonClass: "svelte-5.56.8-client-production",
      handler: "compile",
      payload: { ...payload, implementation: "rsvelte-wasm" },
    },
    {
      id: "memory-rsvelte-native-client",
      label: "@rsvelte/native (NAPI)",
      package: "@rsvelte/vite-plugin-svelte-native",
      surface: "compile",
      comparisonClass: "svelte-5.56.8-client-production",
      handler: "compile",
      payload: { ...payload, implementation: "rsvelte-native" },
    },
    {
      id: "memory-svelte-5.56.4-client",
      label: "svelte/compiler 5.56.4",
      package: "svelte-mrwaip-reference",
      surface: "compile",
      comparisonClass: "svelte-5.56.4-client-production",
      handler: "compile",
      payload: { ...payload, implementation: "svelte-mrwaip-reference" },
    },
    {
      id: "memory-mrwaip-client",
      label: "@mrwaip/svelte-rs (NAPI)",
      package: "@mrwaip/svelte-rs",
      surface: "compile",
      comparisonClass: "svelte-5.56.4-client-production",
      handler: "compile",
      payload: { ...payload, implementation: "mrwaip" },
    },
    {
      id: "memory-verter-compile",
      label: "Verter runtime compile",
      package: "@verter/native",
      surface: "compile",
      comparisonClass: "verter-runtime-compile",
      skip: "No public Svelte runtime compile API; no proxy workload is sampled.",
    },
    {
      id: "memory-svelte2tsx",
      label: "svelte2tsx",
      package: "svelte2tsx",
      surface: "projection",
      comparisonClass: "svelte2tsx-compatible",
      handler: "projection",
      payload: { ...payload, implementation: "svelte2tsx" },
    },
    {
      id: "memory-rsvelte-svelte2tsx",
      label: "@rsvelte/svelte2tsx (Wasm)",
      package: "@rsvelte/svelte2tsx",
      surface: "projection",
      comparisonClass: "svelte2tsx-compatible",
      handler: "projection",
      payload: { ...payload, implementation: "rsvelte-svelte2tsx" },
    },
    {
      id: "memory-verter-projection",
      label: "Verter IDE projection",
      package: "@verter/native",
      surface: "projection",
      comparisonClass: "verter-ide-projection",
      handler: "projection",
      payload: { ...payload, implementation: "verter" },
    },
  ];
}
