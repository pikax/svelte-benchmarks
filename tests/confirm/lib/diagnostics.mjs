/**
 * Diagnostic parsing + evidence-at-the-pin scoring.
 *
 * A tool "printed an error somewhere" is not evidence it DIAGNOSED the plant.
 * Plants pin their planted error with a `// @plant-error` (script) or
 * `<!-- @plant-error -->` (template) comment; the scorer accepts a diagnostic
 * only when it is attributed to the planted FILE and located at the pinned
 * LINE. Line-format regexes are deliberately avoided where a location-aware
 * parse is possible.
 */

const ANSI_ESCAPE_RE =
  // eslint-disable-next-line no-control-regex
  /\u001B\][\s\S]*?(?:\u0007|\u001B\\)|\u001B\[[0-9;?]*[ -\/]*[@-~]|\u001B[@-Z\\-_]/g;

export function stripAnsi(text) {
  return String(text).replace(ANSI_ESCAPE_RE, "");
}

/**
 * Parse the diagnostic grammars the compared CLIs actually emit:
 *   tsc/svelte-check:  path(line,col): error TS1234: message
 *   rsvelte:           error:line:col [TS1234] message   (file from a previous
 *                      bare path line)
 * Continuation lines fold into the previous diagnostic.
 */
export function parseDiagnostics(rawText) {
  const text = stripAnsi(rawText).replaceAll("\r\n", "\n");
  const diagnostics = [];
  let lastFile = null;
  const lines = text.split("\n");
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index].trimEnd();
    if (!line) continue;
    // svelte-check pretty grammar:
    //   <file>:<line>:<col>\n<Error|Warning>: <message> (ts|js|svelte)\n<excerpt>
    const pretty = /^(\S+\.svelte):(\d+):(\d+)$/.exec(line.trim());
    if (pretty) {
      const next = (lines[index + 1] ?? "").trim();
      const severity =
        /^(Error|Warning):\s*(.*?)(?:\s+\((ts|js|svelte)\))?$/.exec(next);
      if (severity) {
        diagnostics.push({
          file: pretty[1].replaceAll("\\", "/"),
          line: Number(pretty[2]),
          col: Number(pretty[3]),
          severity: severity[1].toLowerCase(),
          code: severity[3] ? severity[3].toUpperCase() : "",
          message: severity[2],
          raw: `${line} | ${next}`,
        });
        index += 1; // severity line consumed
        continue;
      }
    }
    const tsc = /^(\S+\.svelte|\S+\.ts)\((\d+),(\d+)\):\s+(error|warning)\s+(TS\d+):\s*(.*)$/i.exec(
      line,
    );
    if (tsc) {
      lastFile = tsc[1].replaceAll("\\", "/");
      diagnostics.push({
        file: lastFile,
        line: Number(tsc[2]),
        col: Number(tsc[3]),
        severity: tsc[4].toLowerCase(),
        code: tsc[5],
        message: tsc[6],
        raw: line,
      });
      continue;
    }
    // rsvelte-check 0.5.28+ single-line grammar:
    //   ERROR <file>:<line>:<col> (ts): <message>
    const rsvelteCheck =
      /^ERROR\s+(\S+\.(?:svelte|ts)):(\d+):(\d+)\s+\((ts|js|svelte)\):\s*(.*)$/i.exec(
        line,
      );
    if (rsvelteCheck) {
      diagnostics.push({
        file: rsvelteCheck[1].replaceAll("\\", "/"),
        line: Number(rsvelteCheck[2]),
        col: Number(rsvelteCheck[3]),
        severity: "error",
        code: rsvelteCheck[4].toUpperCase(),
        message: rsvelteCheck[5],
        raw: line,
      });
      continue;
    }
    const rsvelte = /^error:(\d+):(\d+)\s+\[(TS\d+)\]\s*(.*)$/i.exec(line);
    if (rsvelte) {
      diagnostics.push({
        file: lastFile,
        line: Number(rsvelte[1]),
        col: Number(rsvelte[2]),
        severity: "error",
        code: rsvelte[3],
        message: rsvelte[4],
        raw: line,
      });
      continue;
    }
    const bare = /^(\S+\.(?:svelte|ts)):?$/i.exec(line.trim());
    if (bare) {
      lastFile = bare[1].replaceAll("\\", "/");
      continue;
    }
    if (diagnostics.length) {
      // Fold continuation text into the previous diagnostic so message
      // matching sees identifiers printed on wrapped lines.
      diagnostics[diagnostics.length - 1].message += ` ${line.trim()}`;
    }
  }
  return diagnostics;
}

/**
 * Find `@plant-error` pins in a plant source. Pin comments are STRIPPED from
 * the working copy so planted code line numbers stay put; each pin reports
 * the comment line, the target line (next non-empty line) and the line the
 * tool will see after stripping every pin above it.
 */
export function findExpectErrorPins(filename, source) {
  const lines = source.split("\n");
  const pins = [];
  let strippedCount = 0;
  for (let i = 0; i < lines.length; i++) {
    const isPin =
      /^\s*(\/\/|\/\*)\s*@plant-error/.test(lines[i]) ||
      /^\s*<!--\s*@plant-error/.test(lines[i]);
    if (!isPin) continue;
    let target = i + 1;
    while (target < lines.length && !lines[target].trim()) target += 1;
    pins.push({
      file: filename,
      commentLine: i + 1,
      targetLine: target + 1,
      strippedLine: i + 1 - strippedCount,
      text: lines[i].trim(),
    });
    strippedCount += 1;
  }
  const stripped = lines
    .filter(
      (l) =>
        !/^\s*(\/\/|\/\*)\s*@plant-error/.test(l) &&
        !/^\s*<!--\s*@plant-error/.test(l),
    )
    .join("\n");
  return { pins, stripped };
}

function fileMatches(diagFile, pinFile) {
  if (!diagFile) return false;
  // Complete path segment only: a bare endsWith(pinFile) attributes
  // other-script-type-error/App.svelte's diagnostics to
  // script-type-error/App.svelte.
  return diagFile === pinFile || diagFile.endsWith(`/${pinFile}`);
}

function mentions(text, needle) {
  const hay = String(text).toLowerCase();
  if (hay.includes(needle.toLowerCase())) return true;
  // Identifier-boundary match so differently-quoted identifiers still match
  // without becoming a phrasing lottery.
  try {
    return new RegExp(
      `(^|[^a-z0-9_$])${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9_$]|$)`,
      "i",
    ).test(hay);
  } catch {
    return false;
  }
}

/**
 * Score parsed diagnostics against a plant's expectation.
 *
 * opts: { diagnostics, pins, expectErrors = 1, maxErrors, mustMention: [],
 *         fileName }  — when pins exist, message evidence is evaluated only
 * against diagnostics located AT the pin; a planted error plus twenty extras
 * is a maxErrors failure, not a pass.
 */
export function scoreDiagnostics(opts) {
  const {
    diagnostics,
    pins = [],
    expectErrors = 1,
    maxErrors = Infinity,
    mustMention = [],
    fileName,
  } = opts;
  const failures = [];
  const fileDiags = diagnostics.filter((d) => fileMatches(d.file, fileName));
  if (fileDiags.length < expectErrors) {
    failures.push(
      `${fileName}: expected ≥${expectErrors} diagnostic(s) in this file, found ${fileDiags.length}`,
    );
  }
  if (fileDiags.length > maxErrors) {
    failures.push(
      `${fileName}: ${fileDiags.length} diagnostics exceeds maxErrors=${maxErrors} — planted error plus noise is not a diagnosis`,
    );
  }
  for (const pin of pins) {
    const onPin = fileDiags.filter(
      (d) => d.line === pin.strippedLine || d.line === pin.targetLine || d.line === pin.commentLine,
    );
    if (onPin.length === 0) {
      failures.push(
        `no diagnostic at ${pin.file}:${pin.strippedLine} (@plant-error) — the tool did not locate the planted error`,
      );
      continue;
    }
    for (const needle of mustMention) {
      const hit = onPin.some((d) => mentions(d.message, needle) || mentions(d.raw, needle));
      if (!hit) {
        failures.push(
          `diagnostic at ${pin.file}:${pin.strippedLine} did not mention "${needle}"`,
        );
      }
    }
  }
  if (pins.length === 0) {
    for (const needle of mustMention) {
      const hit = diagnostics.some(
        (d) => mentions(d.message, needle) || mentions(d.raw, needle),
      );
      if (!hit) failures.push(`no diagnostic mentioned "${needle}"`);
    }
  }
  return { ok: failures.length === 0, failures };
}
