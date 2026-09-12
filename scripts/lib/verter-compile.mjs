/** The published batch entrypoint, also used by the isolated validity probes. */
export function compileVerterBatch(host, sources, { generate, dev, sourceMap = false }) {
  return host.compileMany(sources.map((file) => ({
    canonicalId: file.filename.replaceAll("\\", "/"),
    source: file.source,
    requestedMode: "stateless",
  })), {
    target: "runtime-render",
    defaultMode: "stateless",
    compileProfile: {
      isProduction: !dev,
      customElement: false,
      ssr: generate === "server",
      forceJs: true,
      forceVapor: false,
      sourceMap,
      hmrStrategy: "none",
    },
  });
}

export function createVerterCompiler(VerterHost) {
  const host = new VerterHost({ hostCpuThreads: 1 });
  return (source, options) => {
    const [output] = compileVerterBatch(host, [{ filename: options.filename, source }], options);
    if (!output || output.errors?.length) {
      throw new Error(output?.errors?.join("; ") || "Verter returned no output entry");
    }
    // Preserve actual output. No Vue-to-Svelte conversion or invented CSS.
    return { code: output.code, map: output.sourceMap };
  };
}
