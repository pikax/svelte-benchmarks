/**
 * Deterministic probe positions inside a `.svelte` source.
 *
 * SCRIPT: `const benchMarker` declaration
 * MARKUP: `{benchMarker}` Svelte expression
 */

function offsetToPosition(source, offset) {
  let line = 0;
  let lineStart = 0;
  for (let i = 0; i < offset; i++) {
    if (source[i] === "\n") {
      line += 1;
      lineStart = i + 1;
    }
  }
  return { line, character: offset - lineStart };
}

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Position of `<symbol>` in its `const <symbol>` declaration.
 */
function findScriptPosition(source, symbol) {
  if (!symbol) return null;
  const re = new RegExp(`\\bconst\\s+(${escapeRe(symbol)})\\b`);
  const m = re.exec(source);
  if (!m) return null;
  return offsetToPosition(source, m.index + m[0].length - m[1].length);
}

/**
 * Position of `<symbol>` inside a Svelte `{...}` expression (not a block).
 * Prefers markup section after </script>; falls back to first non-block match.
 */
function findTemplatePosition(source, symbol) {
  if (!symbol) return null;
  const word = new RegExp(`\\b${escapeRe(symbol)}\\b`);

  // Prefer content after the first </script>
  const afterScript = source.search(/<\/script>/i);
  const searchFrom = afterScript >= 0 ? afterScript : 0;

  let from = searchFrom;
  for (;;) {
    const open = source.indexOf("{", from);
    if (open === -1) break;
    // Skip block openers {# {: {@
    const next = source[open + 1];
    if (next === "#" || next === ":" || next === "@" || next === "/") {
      from = open + 1;
      continue;
    }
    const close = source.indexOf("}", open + 1);
    if (close === -1) break;
    const span = source.slice(open + 1, close);
    // Skip pure whitespace / control
    if (/^\s*$/.test(span) || span.startsWith("#") || span.startsWith(":")) {
      from = close + 1;
      continue;
    }
    const m = word.exec(span);
    if (m) return offsetToPosition(source, open + 1 + m.index);
    from = close + 1;
  }

  // Fallback: any occurrence of {symbol}
  const re = new RegExp(`\\{[^}]*\\b(${escapeRe(symbol)})\\b[^}]*\\}`);
  const m = re.exec(source);
  if (m) {
    const inner = m[0].indexOf(symbol);
    return offsetToPosition(source, m.index + inner);
  }
  return null;
}

function findFallbackPosition(source) {
  const lines = source.split(/\r?\n/);
  for (let i = Math.floor(lines.length * 0.3); i < lines.length; i++) {
    const m = lines[i].match(/\b([A-Za-z_][A-Za-z0-9_]{3,})\b/);
    if (m) return { line: i, character: m.index };
  }
  return { line: 0, character: 0 };
}

module.exports = {
  offsetToPosition,
  findScriptPosition,
  findTemplatePosition,
  findFallbackPosition,
};
