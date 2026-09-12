import assert from "node:assert/strict";
import { test } from "./helpers.mjs";
import { judgeSourceMapArtifact } from "../../scripts/lib/source-map-validity-oracle.mjs";
import {
  SOURCE_MAP_PLANTS,
  SOURCE_MAP_SUITE_HASH,
  SOURCE_MAP_SUITE_VERSION,
} from "../../scripts/lib/source-map-validity-plants.mjs";
import { applyCompileValidityGates } from "../../scripts/lib/compile-validity-gates.mjs";

const plant = SOURCE_MAP_PLANTS.find((p) => p.id === "lf-raw");

async function officialArtifacts() {
  const { compile } = await import("svelte/compiler");
  const out = compile(plant.source, {
    filename: "Plant.svelte",
    generate: "client",
    dev: false,
    css: "external",
    runes: true,
  });
  return { code: out.js.code, map: out.js.map };
}

function anchors() {
  return plant.anchors.map((a) => ({
    ...a,
    generatedOffset: undefined,
  }));
}

test("the reference compiler's own maps pass the oracle", async () => {
  const { code, map } = await officialArtifacts();
  const verdict = judgeSourceMapArtifact({
    code,
    map,
    source: plant.source,
    filename: "Plant.svelte",
    anchors: plant.anchors.map((a) =>
      a.id === "script" ? { ...a, generatedOffset: code.indexOf(a.generatedToken) } : a,
    ),
  });
  assert.equal(verdict.ok, true, verdict.failures.join("; "));
});

test("a missing map fails", async () => {
  const { code } = await officialArtifacts();
  const verdict = judgeSourceMapArtifact({
    code,
    map: null,
    source: plant.source,
    filename: "Plant.svelte",
    anchors: anchors(),
  });
  assert.equal(verdict.ok, false);
});

test("a wrong-source map fails", async () => {
  const { code, map } = await officialArtifacts();
  const verdict = judgeSourceMapArtifact({
    code,
    map: { ...map, sources: ["Other.svelte"] },
    source: plant.source,
    filename: "Plant.svelte",
    anchors: anchors(),
  });
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((f) => f.includes("instead of")));
});

test("stale sourcesContent fails", async () => {
  const { code, map } = await officialArtifacts();
  const verdict = judgeSourceMapArtifact({
    code,
    map: { ...map, sourcesContent: ["<script>const stale = 1;</script>"] },
    source: plant.source,
    filename: "Plant.svelte",
    anchors: anchors(),
  });
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((f) => f.includes("sourcesContent")));
});

test("a shifted mapping fails (stale map)", async () => {
  const { code, map } = await officialArtifacts();
  // Drop the FIRST mapping entry of the first mapped line: every subsequent
  // segment keeps its delta, so all traces shift — the classic stale map.
  const lines = map.mappings.split(";");
  const firstWithContent = lines.findIndex((l) => l.length > 0);
  lines[firstWithContent] = lines[firstWithContent].split(",").slice(1).join(",");
  const shifted = { ...map, mappings: lines.join(";") };
  const verdict = judgeSourceMapArtifact({
    code,
    map: shifted,
    source: plant.source,
    filename: "Plant.svelte",
    anchors: anchors(),
  });
  assert.equal(verdict.ok, false);
});

test("anchors outside the source are rejected, not guessed", () => {
  const verdict = judgeSourceMapArtifact({
    code: "const x = 1;",
    map: { version: 3, sources: ["Plant.svelte"], sourcesContent: ["const x = 1;"], mappings: "AAAA" },
    source: "const x = 1;",
    filename: "Plant.svelte",
    anchors: [{ id: "bogus", generatedToken: "x", originalOffset: 9999 }],
  });
  assert.equal(verdict.ok, false);
});

test("plant manifest carries LF/CRLF and non-BMP column pressure", () => {
  assert.equal(SOURCE_MAP_PLANTS.length, 4);
  const crlf = SOURCE_MAP_PLANTS.find((p) => p.id === "crlf-styles");
  assert.ok(crlf.source.includes("\r\n"));
  for (const p of SOURCE_MAP_PLANTS) {
    assert.ok(p.source.includes("🧪"), "every plant carries a non-BMP marker");
    for (const a of p.anchors) {
      assert.ok(Number.isInteger(a.originalOffset) && a.originalOffset >= 0);
    }
  }
  assert.match(SOURCE_MAP_SUITE_HASH, /^[a-f0-9]{64}$/);
  assert.equal(typeof SOURCE_MAP_SUITE_VERSION, "string");
});

test("gates unrank rows whose source-map verdict is not PASS", () => {
  const semantics = {
    matrix: {
      "client/production/source-map-off": {
        configuration: { generate: "client", env: "production", sourceMap: false },
        status: "FAIL",
        entrypoints: {
          "svelte-official": {
            status: "PASS",
            passed: 33,
            plantCount: 33,
            exactPath: "official",
            results: [],
            sourceMap: {
              status: "FAIL",
              results: [
                { id: "lf-raw", status: "FAIL", failures: ["js.template: mapped to 5:35; expected 5:33"] },
              ],
            },
          },
        },
      },
    },
  };
  const rows = [
    { id: "svelte-official-1t-client-prod", label: "official", status: "ok", throughput: "x", notes: "", baseline: true },
  ];
  applyCompileValidityGates(rows, semantics, {
    generate: "client",
    env: "production",
    sourceMap: false,
  });
  assert.equal(rows[0].status, "unranked");
  assert.match(rows[0].notes, /SOURCE-MAP COORDINATE VALIDITY FAIL/);
  assert.match(rows[0].notes, /lf-raw/);
});
