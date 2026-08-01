import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { createRequire } from "node:module";
import { create, toBinary } from "@bufbuild/protobuf";
import {
  FrameworkSurfaceKind,
  GraphOperation,
  GraphProjectionMode,
  GraphReductionDemand,
  TYPEINFO_GRAPH_SCHEMA_VERSION,
  TypeInfoGraphRequestSchema,
} from "@verter/proto";
import { decodeFrameworkSurfaceResponse } from "@verter/typeinfo";
import {
  collectSvelteFiles,
  copyFixtureSubset,
  readSources,
  totalBytes,
  writeTsconfig,
} from "../fixtures.mjs";
import { measureVariants, timedAsync, timedSync } from "../timing.mjs";

const require = createRequire(import.meta.url);

let sveldRegistered = false;
let sveldCapture = null;

function expectedMetadata(sources) {
  const components = new Set();
  const propFiles = new Set();
  const propsByFile = new Map();
  for (const file of sources) {
    const identity = basename(file.filename);
    components.add(identity);
    const names = new Set();
    for (const match of file.source.matchAll(
      /\blet\s*\{([\s\S]*?)\}\s*(?::[^=]+)?=\s*\$props\s*\(\s*\)/g,
    )) {
      for (const part of match[1].split(",")) {
        const name = part
          .trim()
          .replace(/^\.\.\./, "")
          .split(/[=:]/, 1)[0]
          ?.trim();
        if (/^[A-Za-z_$][\w$]*$/.test(name)) names.add(name);
      }
    }
    propsByFile.set(identity, names);
    if (names.size > 0) propFiles.add(identity);
  }
  return { components, propFiles, propsByFile };
}

function summarizeSveld(components) {
  const values = components instanceof Map ? [...components.values()] : [];
  const propsByFile = new Map(
    values.map((component) => [
      basename(component?.filePath ?? ""),
      new Set(
        (component?.props ?? [])
          .map((prop) => prop?.name)
          .filter((name) => typeof name === "string"),
      ),
    ]),
  );
  return {
    componentRecords: values.length,
    components: new Set(
      values.map((component) => basename(component?.filePath ?? "")),
    ),
    propRecords: values.filter(
      (component) => (component?.props?.length ?? 0) > 0,
    ).length,
    propFiles: new Set(
      values
        .filter((component) => (component?.props?.length ?? 0) > 0)
        .map((component) => basename(component?.filePath ?? "")),
    ),
    props: values.reduce(
      (count, component) => count + (component?.props?.length ?? 0),
      0,
    ),
    propsByFile,
  };
}

function summarizeDocinfo(result) {
  const records = (result?.modules ?? []).flatMap((module) =>
    (module?.declarations ?? [])
      .filter((declaration) => declaration?.kind === "component")
      .map((component) => ({
        component,
        identity: basename(module?.path ?? ""),
      })),
  );
  return {
    componentRecords: records.length,
    components: new Set(records.map((record) => record.identity)),
    propRecords: records.filter(
      (record) => (record.component?.props?.length ?? 0) > 0,
    ).length,
    propFiles: new Set(
      records
        .filter((record) => (record.component?.props?.length ?? 0) > 0)
        .map((record) => record.identity),
    ),
    props: records.reduce(
      (count, record) => count + (record.component?.props?.length ?? 0),
      0,
    ),
    propsByFile: new Map(
      records.map((record) => [
        record.identity,
        new Set(
          (record.component?.props ?? [])
            .map((prop) => prop?.name)
            .filter((name) => typeof name === "string"),
        ),
      ]),
    ),
  };
}

function encodeVerterSurfaceRequest(canonicalId) {
  return Buffer.from(
    toBinary(
      TypeInfoGraphRequestSchema,
      create(TypeInfoGraphRequestSchema, {
        schemaVersion: TYPEINFO_GRAPH_SCHEMA_VERSION,
        operation: GraphOperation.FRAMEWORK_SURFACES,
        payload: {
          case: "frameworkSurface",
          value: {
            selector: {
              canonicalId,
              exportName: "",
              hasExportName: false,
              frameworkAdapterId: "svelte",
            },
            context: {
              mode: GraphProjectionMode.NAVIGATE,
              demand: GraphReductionDemand.PUBLISHED,
            },
            closure: { kind: { case: "oneLevel", value: {} } },
            displayPolicy: {
              qualification: 1,
              branding: 1,
              budgets: { maxStringLength: 4096, maxDepth: 16 },
            },
            includeProvenance: false,
            includeDiagnostics: true,
            includeProjection: [],
            schemaVersion: TYPEINFO_GRAPH_SCHEMA_VERSION,
          },
        },
      }),
    ),
  );
}

function runVerterTypeinfo(VerterHost, sources) {
  const host = new VerterHost({ analysisLevel: "full" });
  try {
    const records = [];
    for (const file of sources) {
      const id = file.path.replaceAll("\\", "/");
      host.upsert({
        canonicalId: id,
        inputId: id,
        source: readFileSync(file.path),
        fileKind: "svelte",
      });
      const { response } = host.resolveFrameworkSurfaceWithAudit(
        encodeVerterSurfaceRequest(id),
      );
      const decoded = decodeFrameworkSurfaceResponse(new Uint8Array(response));
      if ("error" in decoded) {
        throw new Error(`${file.filename}: ${JSON.stringify(decoded.error)}`);
      }
      const props = decoded.kinds.get(FrameworkSurfaceKind.PROPS);
      if (!props?.isSupported || props.isPartial) {
        throw new Error(
          `${file.filename}: Svelte props surface is unsupported or partial`,
        );
      }
      records.push({ identity: basename(file.filename), props: props.members });
    }
    return {
      componentRecords: records.length,
      components: new Set(records.map((record) => record.identity)),
      propRecords: records.filter((record) => record.props.length > 0).length,
      propFiles: new Set(
        records
          .filter((record) => record.props.length > 0)
          .map((record) => record.identity),
      ),
      props: records.reduce((count, record) => count + record.props.length, 0),
      propsByFile: new Map(
        records.map((record) => [
          record.identity,
          new Set(record.props.map((prop) => prop.name)),
        ]),
      ),
    };
  } finally {
    host.close?.();
  }
}

function setDifference(left, right) {
  return [...left].filter((value) => !right.has(value));
}

function metadataGate(summary, expected) {
  const missingComponents = setDifference(
    expected.components,
    summary.components,
  );
  const extraComponents = setDifference(
    summary.components,
    expected.components,
  );
  const missingProps = setDifference(expected.propFiles, summary.propFiles);
  const extraProps = setDifference(summary.propFiles, expected.propFiles);
  const propMismatches = [...expected.components].filter((identity) => {
    const expectedNames = expected.propsByFile.get(identity) ?? new Set();
    const actualNames = summary.propsByFile.get(identity) ?? new Set();
    return (
      setDifference(expectedNames, actualNames).length > 0 ||
      setDifference(actualNames, expectedNames).length > 0
    );
  });
  const ok =
    summary.componentRecords === expected.components.size &&
    summary.propRecords === expected.propFiles.size &&
    missingComponents.length === 0 &&
    extraComponents.length === 0 &&
    missingProps.length === 0 &&
    extraProps.length === 0 &&
    propMismatches.length === 0;
  return {
    ok,
    detail:
      `${summary.componentRecords}/${expected.components.size} component records (${summary.components.size} unique) · ` +
      `${summary.propRecords}/${expected.propFiles.size} prop-bearing records (${summary.propFiles.size} unique) · ${summary.props} props` +
      (ok
        ? ""
        : ` · missing=${[...missingComponents, ...missingProps].join(",") || "none"} extra=${[...extraComponents, ...extraProps].join(",") || "none"} prop-mismatch=${propMismatches.join(",") || "none"}`),
  };
}

function prepareMetaDir(fixtureDir, files, workRoot) {
  const dir = join(workRoot, "component-meta", `n${files.length}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  copyFixtureSubset(fixtureDir, dir, files);
  writeFileSync(
    join(dir, "index.js"),
    files
      .map(
        (file, index) =>
          `export { default as Component${String(index).padStart(5, "0")} } from ${JSON.stringify(`./${file.replaceAll("\\", "/")}`)};`,
      )
      .join("\n") + "\n",
  );
  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify({ name: "svelte-bench-component-meta", private: true, type: "module", svelte: "./index.js" }, null, 2)}\n`,
  );
  writeTsconfig(dir, { include: ["**/*.svelte", "index.js"] });
  return dir;
}

export async function runComponentMetaSurface(fixtureDir, options) {
  const files = collectSvelteFiles(fixtureDir, options.fileLimit);
  const sources = readSources(fixtureDir, files);
  const bytes = totalBytes(fixtureDir, files);
  const expected = expectedMetadata(sources);
  const dir = prepareMetaDir(fixtureDir, files, options.workRoot);

  let sveldModule;
  let docinfoModule;
  let verterModule;
  try {
    sveldModule = await import("sveld");
    if (!sveldRegistered) {
      sveldModule.registerWriter({
        name: "svelte-bench-capture",
        // The staged barrel exports every file exactly once. `all` would also
        // add filename-derived aliases and double the component count.
        componentSet: "exported",
        write(components) {
          sveldCapture = components;
        },
      });
      sveldRegistered = true;
    }
  } catch (error) {
    sveldModule = {
      error: error instanceof Error ? error.message : String(error),
    };
  }
  try {
    docinfoModule = await import("svelte-docinfo");
  } catch (error) {
    docinfoModule = {
      error: error instanceof Error ? error.message : String(error),
    };
  }
  try {
    verterModule = require("@verter/native");
  } catch (error) {
    verterModule = {
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const runSveld = async (resolveTypes) => {
    sveldCapture = null;
    await sveldModule.sveld({
      entry: relative(process.cwd(), join(dir, "index.js")),
      glob: true,
      types: false,
      json: false,
      markdown: false,
      resolveTypes,
      cache: false,
      quiet: true,
      failFast: false,
      additionalWriters: { "svelte-bench-capture": {} },
    });
    return summarizeSveld(sveldCapture);
  };

  const runDocinfo = async () =>
    summarizeDocinfo(
      await docinfoModule.analyzeFromFiles({
        projectRoot: dir,
        discovery: "glob",
        include: ["**/*.svelte"],
        exclude: [],
        sourceOptions: { sourcePaths: ["."] },
        resolveDependencies: false,
      }),
    );

  const variants = [];
  if (typeof sveldModule?.sveld === "function") {
    for (const resolveTypes of [false, true]) {
      let gate;
      try {
        gate = metadataGate(await runSveld(resolveTypes), expected);
      } catch (error) {
        gate = {
          ok: false,
          detail: error instanceof Error ? error.message : String(error),
        };
      }
      variants.push({
        id: resolveTypes ? "sveld-semantic" : "sveld-ast",
        label: resolveTypes ? "sveld (resolveTypes)" : "sveld (AST-only)",
        package: "sveld",
        target: resolveTypes ? "semantic" : "ast",
        comparisonClass: resolveTypes
          ? "sveld-resolve-types-project"
          : "sveld-ast-project",
        threading: "1t",
        invocation: "in-process",
        artifactLabel: "Metadata items",
        unranked: !gate.ok,
        notes: `${resolveTypes ? "TypeScript semantic resolution enabled" : "default AST-only extraction"}; cache disabled | gate: ${gate.ok ? "✓" : "✗"} ${gate.detail}`,
        measure: async () => {
          let summary;
          const { ms } = await timedAsync(async () => {
            summary = await runSveld(resolveTypes);
          });
          return { ms, artifact: summary.componentRecords + summary.props };
        },
      });
    }
  } else {
    variants.push({
      id: "sveld",
      label: "sveld",
      package: "sveld",
      skip: true,
      notes: sveldModule?.error ?? "sveld API unavailable",
    });
  }

  if (typeof docinfoModule?.analyzeFromFiles === "function") {
    let gate;
    try {
      gate = metadataGate(await runDocinfo(), expected);
    } catch (error) {
      gate = {
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
      };
    }
    variants.push({
      id: "svelte-docinfo",
      label: "svelte-docinfo",
      package: "svelte-docinfo",
      target: "semantic",
      comparisonClass: "svelte-docinfo-files-no-dependencies",
      threading: "1t",
      invocation: "in-process",
      artifactLabel: "Metadata items",
      unranked: !gate.ok,
      notes: `TypeScript semantic analysis; dependency graph disabled because generated files have no imports | gate: ${gate.ok ? "✓" : "✗"} ${gate.detail}`,
      measure: async () => {
        let summary;
        const { ms } = await timedAsync(async () => {
          summary = await runDocinfo();
        });
        return { ms, artifact: summary.componentRecords + summary.props };
      },
    });
  } else {
    variants.push({
      id: "svelte-docinfo",
      label: "svelte-docinfo",
      package: "svelte-docinfo",
      skip: true,
      notes: docinfoModule?.error ?? "analyzeFromFiles API unavailable",
    });
  }

  if (typeof verterModule?.VerterHost === "function") {
    let gate;
    try {
      gate = metadataGate(
        runVerterTypeinfo(verterModule.VerterHost, sources),
        expected,
      );
    } catch (error) {
      gate = {
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
      };
    }
    variants.push({
      id: "verter-typeinfo",
      label: "Verter typeinfo (Svelte framework surface)",
      package: "@verter/typeinfo",
      target: "semantic",
      comparisonClass: "verter-framework-surface",
      threading: "1t",
      invocation: "in-process/native",
      artifactLabel: "Metadata items",
      unranked: !gate.ok,
      notes: `@verter/typeinfo wire decoder over @verter/native's dedicated Svelte framework-surface executor | gate: ${gate.ok ? "✓" : "✗"} ${gate.detail}`,
      measure: async () => {
        let summary;
        const { ms } = timedSync(() => {
          summary = runVerterTypeinfo(verterModule.VerterHost, sources);
        });
        return { ms, artifact: summary.componentRecords + summary.props };
      },
    });
  } else {
    variants.push({
      id: "verter-typeinfo",
      label: "Verter typeinfo (Svelte framework surface)",
      package: "@verter/typeinfo",
      target: "semantic",
      comparisonClass: "verter-framework-surface",
      skip: true,
      notes: verterModule?.error ?? "VerterHost API unavailable",
    });
  }

  return {
    id: "component-meta",
    label: "Component metadata",
    files: files.length,
    bytes,
    variants: await measureVariants(variants, {
      runs: options.runs,
      warmups: options.warmups,
      fileCount: files.length,
    }),
    methodology: [
      "Every metadata API is a separate workload class unless its discovery, dependency traversal, semantic products, and correctness gates are equivalent. Current metadata timings are informational, without cross-tool ratios.",
      "sveld(resolveTypes) analyzes the generated barrel/project; svelte-docinfo globs Svelte files with dependency traversal disabled. Both are semantic, but their work products are not asserted equivalent.",
      "Verter uses @verter/typeinfo's wire decoder over @verter/native's dedicated Svelte framework-surface executor. It is a separate API/workload class because sveld and svelte-docinfo perform project discovery and barrel analysis.",
      "Persistent caches are disabled and every measured pass re-analyzes the same staged files.",
      "Identity gate: component records and exact per-file prop-name sets must match the staged sources, with no missing, extra, or duplicated records.",
      `Staged entry: ${basename(join(dir, "index.js"))}; svelte-docinfo dependency traversal is disabled because this generated corpus has no component imports.`,
    ],
  };
}
