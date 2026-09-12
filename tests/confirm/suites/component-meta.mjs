/**
 * Component metadata confirmation: a schema-neutral oracle. Each case states
 * OBSERVABLE public component information (props/required/defaults/types);
 * each tool's own serialization is normalized before assertion — tools are
 * never required to emit the same schema. AST-only and semantic modes remain
 * separate comparison classes in the benchmark; here we assert only what each
 * tool claims to provide.
 */
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createSuite } from "../lib/harness.mjs";
import { checkMetaTypeFacts } from "../lib/meta-type-facts.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const CASES = [
  {
    id: "typed-props-with-defaults",
    source: `<script lang="ts">
  let { title, count = 0 }: { title: string; count?: number } = $props();
</script>
<h1>{title}:{count}</h1>
`,
    expect: {
      props: [
        { name: "title", required: true, hasDefault: false },
        { name: "count", required: false, hasDefault: true },
      ],
    },
  },
  {
    id: "bindable-and-callbacks",
    source: `<script lang="ts">
  let {
    value = $bindable(0),
    onPing,
  }: { value?: number; onPing?: (n: number) => void } = $props();
</script>
<button onclick={() => onPing?.(value)}>{value}</button>
`,
    expect: {
      props: [
        { name: "value" },
        { name: "onPing" },
      ],
    },
  },
  {
    id: "callback-signatures",
    source: `<script lang="ts">
  let {
    onMove,
    onToggle,
  }: {
    onMove: (x: number, y: number) => void;
    onToggle?: (value?: boolean) => void;
  } = $props();
</script>
<button onclick={() => { onMove?.(1, 2); onToggle?.(true); }}>go</button>
`,
    expect: {
      props: [
        {
          name: "onMove",
          required: true,
          typeFacts: {
            paramCount: 2,
            params: [{ includes: "number" }, { includes: "number" }],
          },
        },
        {
          name: "onToggle",
          required: false,
          typeFacts: {
            paramCount: 1,
            params: [{ includes: "boolean", optional: true }],
          },
        },
      ],
    },
  },
  {
    id: "plain-component",
    source: `<p>plain</p>
`,
    expect: { props: [] },
  },
];

function typeMentions(entry, needles) {
  const blob = `${entry?.type ?? ""}${entry?.typeText ?? ""}${entry?.typeName ?? ""}`.toLowerCase();
  return needles.every((n) => blob.includes(n.toLowerCase()));
}

function normalizeSveldProps(component) {
    return (component?.props ?? []).map((p) => ({
      name: p.name,
      required: p?.isRequired === true,
      hasDefault: p?.defaultValue != null || p?.value != null,
      type: p?.type,
    }));
  }

function normalizeDocinfoProps(component) {
    return (component?.props ?? []).map((p) => ({
      name: p.name,
      required: p?.optional === false,
      hasDefault: p?.defaultValue != null || p?.default != null || p?.hasDefault === true,
      type: p?.type ?? p?.typeText,
    }));
  }

function checkExpect(props, expect, tool) {
  for (const expected of expect.props) {
    const found = props.find((p) => p.name === expected.name);
    assert.ok(found, `${tool}: prop "${expected.name}" missing (got: ${props.map((p) => p.name).join(", ") || "none"})`);
    // Exact flags: every compared tool reports requiredness/defaults, so a
    // missing value is a wrong value — "not true" is not enough.
    if (typeof expected.required === "boolean") {
      assert.equal(
        found.required,
        expected.required,
        `${tool}: prop "${expected.name}" required must be exactly ${expected.required} (got ${found.required})`,
      );
    }
    if (typeof expected.hasDefault === "boolean") {
      assert.equal(
        found.hasDefault,
        expected.hasDefault,
        `${tool}: prop "${expected.name}" hasDefault must be exactly ${expected.hasDefault} (got ${found.hasDefault})`,
      );
    }
    if (expected.typeIncludes) {
      assert.ok(
        typeMentions(found, expected.typeIncludes),
        `${tool}: prop "${expected.name}" type should mention ${expected.typeIncludes}`,
      );
    }
    for (const failure of checkMetaTypeFacts(found.type, expected.typeFacts)) {
      assert.fail(`${tool}: prop "${expected.name}": ${failure}`);
    }
  }
}

export async function runComponentMetaSuite() {
  const suite = createSuite("component-meta");
  const dir = join(rootDir, "work", "confirm", "metadata");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const files = [];
  for (const testCase of CASES) {
    const file = `${testCase.id}.svelte`;
    writeFileSync(join(dir, file), testCase.source);
    files.push({ testCase, file });
  }
  writeFileSync(
    join(dir, "index.js"),
    `${files.map((f) => `export { default as ${f.testCase.id.replace(/-(.)/g, (_, c) => c.toUpperCase())} } from "./${f.file}";`).join("\n")}\n`,
  );
  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify({ name: "confirm-meta", private: true, type: "module", svelte: "./index.js" }, null, 2)}\n`,
  );
  writeFileSync(
    join(dir, "tsconfig.json"),
    `${JSON.stringify({ compilerOptions: { allowJs: true, moduleResolution: "bundler" }, include: ["**/*.svelte", "index.js"] }, null, 2)}\n`,
  );

  for (const { testCase, file } of files) {
    await suite.run(testCase.id, "sveld", async () => {
      const sveld = await import("sveld");
      let captured;
      const writer = `confirm-${process.pid}`;
      sveld.registerWriter({
        name: writer,
        componentSet: "exported",
        write(components) {
          captured = components;
        },
      });
      await sveld.sveld({
        entry: relative(process.cwd(), join(dir, "index.js")),
        glob: true,
        types: false,
        json: false,
        markdown: false,
        resolveTypes: true,
        cache: false,
        quiet: true,
        additionalWriters: { [writer]: {} },
      });
      const values = captured instanceof Map ? [...captured.values()] : [];
      const component = values.find(
        (c) => basename(c.filePath ?? "") === file,
      );
      assert.ok(component, `sveld did not process ${file}`);
      checkExpect(normalizeSveldProps(component), testCase.expect, "sveld");
    });

    await suite.run(testCase.id, "svelte-docinfo", async () => {
      const docinfo = await import("svelte-docinfo");
      const analysis = await docinfo.analyzeFromFiles({
        projectRoot: dir,
        discovery: "glob",
        include: ["**/*.svelte"],
        exclude: [],
        sourceOptions: { sourcePaths: ["."] },
        resolveDependencies: false,
      });
      const records = (analysis.modules ?? []).flatMap((module) =>
        (module.declarations ?? [])
          .filter((d) => d.kind === "component")
          .map((component) => ({ file: basename(module.path ?? ""), component })),
      );
      const record = records.find((r) => r.file === file);
      assert.ok(record, `svelte-docinfo did not process ${file}`);
      checkExpect(normalizeDocinfoProps(record.component), testCase.expect, "svelte-docinfo");
    });

    await suite.run(testCase.id, "verter-typeinfo", async () => {
      const { createRequire } = await import("node:module");
      const { create, toBinary } = await import("@bufbuild/protobuf");
      const {
        FrameworkSurfaceKind,
        GraphOperation,
        GraphProjectionMode,
        GraphReductionDemand,
        TYPEINFO_GRAPH_SCHEMA_VERSION,
        TypeInfoGraphRequestSchema,
      } = await import("@verter/proto");
      const { decodeFrameworkSurfaceResponse } = await import("@verter/typeinfo");
      const require = createRequire(join(rootDir, "package.json"));
      const { VerterHost } = require("@verter/native");
      const host = new VerterHost({ analysisLevel: "full" });
      try {
        const id = join(dir, file).replaceAll("\\", "/");
        host.upsert({
          canonicalId: id,
          inputId: id,
          source: readFileSync(join(dir, file)),
          fileKind: "svelte",
        });
        const request = create(TypeInfoGraphRequestSchema, {
          schemaVersion: TYPEINFO_GRAPH_SCHEMA_VERSION,
          operation: GraphOperation.FRAMEWORK_SURFACES,
          payload: {
            case: "frameworkSurface",
            value: {
              selector: {
                canonicalId: id,
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
        });
        const { response } = host.resolveFrameworkSurfaceWithAudit(
          Buffer.from(toBinary(TypeInfoGraphRequestSchema, request)),
        );
        const decoded = decodeFrameworkSurfaceResponse(new Uint8Array(response));
        assert.equal("error" in decoded, false);
        const props = decoded.kinds.get(FrameworkSurfaceKind.PROPS);
        assert.equal(props.isSupported, true);
        if (testCase.expect.props.length === 0) {
          assert.equal(props.members.length, 0, "plain component should expose no props");
          return;
        }
        const normalized = props.members.map((m) => ({
          name: m.name,
          required: m.required ?? m.isRequired,
          hasDefault: Boolean(m.default != null || m.defaultValue != null || m.hasDefault),
          type: m.typeText ?? m.type,
        }));
        checkExpect(normalized, testCase.expect, "verter-typeinfo");
      } finally {
        host.close?.();
      }
    });
  }
  return suite.results;
}
