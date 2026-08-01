/**
 * Hover CONTENT gate for Svelte VS Code E2E.
 *
 * Probe: `const benchMarker: string = '…'` in script and `{benchMarker}` in markup.
 * Both positions should resolve to a TypeScript type involving the symbol / string.
 */

const HOVER_EXPECT_SYMBOL = "benchMarker";
const HOVER_EXPECT_TYPE = /\bstring\b/;

function classifyHover(text) {
  const bytes = Buffer.byteLength(text ?? "", "utf8");
  if (!text) return { ok: false, bytes, reason: "empty hover payload" };
  const hasSymbol = text.includes(HOVER_EXPECT_SYMBOL);
  const hasType = HOVER_EXPECT_TYPE.test(text) || /:\s*\w+/.test(text);
  if (!hasSymbol && !hasType) {
    return { ok: false, bytes, reason: `hover does not mention ${HOVER_EXPECT_SYMBOL} or a type` };
  }
  if (!hasType) {
    return {
      ok: false,
      bytes,
      reason: `hover names ${HOVER_EXPECT_SYMBOL} but carries no TypeScript type`,
    };
  }
  return { ok: true, bytes, reason: "" };
}

function classifyTemplateHover(text) {
  const bytes = Buffer.byteLength(text ?? "", "utf8");
  if (!text) {
    return { ok: false, bytes, reason: "empty hover payload at the template position" };
  }
  // Accept string type annotation or symbol with string
  if (HOVER_EXPECT_TYPE.test(text) || text.includes(HOVER_EXPECT_SYMBOL)) {
    if (HOVER_EXPECT_TYPE.test(text) || /:\s*\w+/.test(text)) {
      return { ok: true, bytes, reason: "" };
    }
  }
  return {
    ok: false,
    bytes,
    reason: `template hover does not look like a typed answer for ${HOVER_EXPECT_SYMBOL}`,
  };
}

function hoverText(hovers) {
  if (!hovers) return "";
  const list = Array.isArray(hovers) ? hovers : [hovers];
  const parts = [];
  for (const h of list) {
    const c = h?.contents ?? h;
    if (typeof c === "string") parts.push(c);
    else if (Array.isArray(c)) {
      for (const item of c) {
        parts.push(typeof item === "string" ? item : item?.value ?? "");
      }
    } else if (c?.value) parts.push(c.value);
    else if (c) parts.push(JSON.stringify(c));
  }
  return parts.join("\n");
}

module.exports = {
  classifyHover,
  classifyTemplateHover,
  hoverText,
  HOVER_EXPECT_SYMBOL,
};
