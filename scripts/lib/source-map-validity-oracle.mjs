/**
 * Exact source-coordinate evidence for the artifacts returned by Svelte
 * compiler APIs. Ported from the vue-benchmarks oracle (2026-09-12 audit):
 * the contract is framework-agnostic.
 *
 * An anchor selects a concrete generated token plus its original offset. The
 * trace must START at that generated column (a stale map shifted before the
 * token cannot pass via the consumer's greatest-lower-bound fallback), map to
 * the exact source file, carry sourcesContent equal to the complete original
 * component, and land on the exact original line/column.
 */
import { pathToFileURL } from "node:url";
import { AnyMap, originalPositionFor, sourceContentFor } from "@jridgewell/trace-mapping";

function fileUrl(filename) {
  const path = String(filename ?? "").replaceAll("\\", "/");
  if (/^[a-z]:\//i.test(path)) return new URL(`file:///${path}`).href;
  if (path.startsWith("//")) return new URL(`file:${path}`).href;
  if (path.startsWith("/")) return new URL(`file://${path}`).href;
  if (/^[a-z][a-z\d+.-]*:/i.test(path)) return new URL(path).href;
  return new URL(path, pathToFileURL(`${process.cwd()}/`).href).href;
}

function sourceIdentity(filename) {
  const url = new URL(fileUrl(filename));
  if (url.protocol !== "file:") return url.href;
  const path = decodeURIComponent(url.pathname).replaceAll("\\", "/");
  if (url.hostname) return `//${url.hostname}${path}`;
  // Drive paths are Windows paths even if the oracle runs on Linux. A POSIX
  // path keeps its case; merely sharing a basename is never enough.
  return /^[\/]?[a-z]:\//i.test(path) ? path.toLowerCase() : path;
}

function normalizeWindowsSources(map) {
  const absolute = (value) =>
    typeof value === "string" && /^[a-z]:[\\/]/i.test(value) ? fileUrl(value) : value;
  return {
    ...map,
    ...(map.sources ? { sources: map.sources.map(absolute) } : {}),
    ...(map.sourceRoot ? { sourceRoot: absolute(map.sourceRoot) } : {}),
    ...(map.sections
      ? { sections: map.sections.map((section) => ({ ...section, map: normalizeWindowsSources(section.map) })) }
      : {}),
  };
}

/** Source-map lines are one-based and columns count UTF-16 code units. */
function positionAt(source, offset) {
  const lines = source.slice(0, offset).split("\n");
  return { line: lines.length, column: lines.at(-1).length };
}

function generatedOffset(code, anchor) {
  const token = anchor.generatedToken;
  if (typeof token !== "string" || !token.length) throw new Error("generatedToken must be nonempty");
  if (anchor.generatedOffset !== undefined) {
    const offset = anchor.generatedOffset;
    if (!Number.isInteger(offset) || offset < 0 || !code.startsWith(token, offset)) {
      throw new Error("generatedOffset does not identify generatedToken");
    }
    return offset;
  }
  const first = code.indexOf(token);
  if (first < 0) throw new Error(`generated token ${JSON.stringify(token)} is missing`);
  if (code.indexOf(token, first + 1) >= 0) {
    throw new Error(`generated token ${JSON.stringify(token)} is ambiguous; select its occurrence with generatedOffset`);
  }
  return first;
}

/**
 * anchors: [{ id, generatedToken, originalOffset, generatedOffset? }].
 * Offsets refer to UTF-16 code units in the exact supplied strings. This
 * oracle never searches multiple mappings for whichever one passes.
 */
export function judgeSourceMapArtifact({ code, map, source, filename, anchors }) {
  const failures = [];
  const traces = [];
  let traced;
  let expectedSource;
  try {
    if (typeof code !== "string" || !code.length) throw new Error("generated code is missing");
    if (typeof source !== "string" || !source.length) throw new Error("original source is missing");
    if (typeof filename !== "string" || !filename.length) throw new Error("source filename is missing");
    if (!Array.isArray(anchors) || !anchors.length) throw new Error("no source-map anchors were supplied");
    const raw = typeof map === "string" ? JSON.parse(map) : map?.toJSON ? map.toJSON() : map;
    if (!raw || typeof raw !== "object" || raw.version !== 3) {
      throw new Error("missing or invalid version-3 source map");
    }
    if (
      !raw.sections &&
      (!Array.isArray(raw.sources) || !(typeof raw.mappings === "string" || Array.isArray(raw.mappings)))
    ) {
      throw new Error("source map has no sources/mappings");
    }
    expectedSource = sourceIdentity(filename);
    // URI resolution treats `D:/...` as a relative source, despite this being
    // the absolute filename emitted by several Windows compiler APIs.
    traced = new AnyMap(normalizeWindowsSources(raw), fileUrl(filename));
  } catch (error) {
    return { ok: false, failures: [error.message], traces };
  }
  for (const anchor of anchors) {
    const trace = { id: anchor?.id ?? "unnamed", ok: false };
    traces.push(trace);
    try {
      if (!Number.isInteger(anchor?.originalOffset) || anchor.originalOffset < 0 || anchor.originalOffset >= source.length) {
        throw new Error("originalOffset is outside the full source");
      }
      const offset = generatedOffset(code, anchor);
      trace.generatedOffset = offset;
      trace.generated = positionAt(code, offset);
      trace.expected = { source: filename, ...positionAt(source, anchor.originalOffset) };
      // Svelte adaptation: the reference oracle required a mapping segment to
      // START exactly at the token (anti-greatest-lower-bound). Svelte
      // candidates legitimately emit sparser segments (e.g. one per verbatim
      // source line) whose fallback trace is still exact, so density alone is
      // not an error here. Exact original line+column equality below is the
      // load-bearing check: a shifted, stale or wrong-file map cannot land on
      // the token's true position.
      trace.original = originalPositionFor(traced, trace.generated);
      if (trace.original.source == null || trace.original.line == null || trace.original.column == null) {
        throw new Error("generated token has no original mapping");
      }
      if (sourceIdentity(trace.original.source) !== expectedSource) {
        throw new Error(`mapped to ${JSON.stringify(trace.original.source)} instead of ${JSON.stringify(filename)}`);
      }
      if (sourceContentFor(traced, trace.original.source) !== source) {
        throw new Error("sourcesContent does not equal the complete original component");
      }
      if (trace.original.line !== trace.expected.line || trace.original.column !== trace.expected.column) {
        throw new Error(`mapped to ${trace.original.line}:${trace.original.column}; expected ${trace.expected.line}:${trace.expected.column}`);
      }
      trace.ok = true;
    } catch (error) {
      trace.failure = error.message;
      failures.push(`${trace.id}: ${error.message}`);
    }
  }
  return { ok: failures.length === 0, failures, traces };
}
