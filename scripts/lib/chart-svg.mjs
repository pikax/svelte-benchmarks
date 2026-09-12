/** Shared SVG charts; page-level <picture> selects explicit light/dark twins. */
export function slugify(name) {
  return String(name).toLowerCase().replace(/[<>]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
export function chartFileName(name) {
  const slug = slugify(name);
  if (slug.length <= 72) return slug;
  let hash = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) hash = Math.imul(hash ^ slug.charCodeAt(i), 0x01000193) >>> 0;
  return slug.slice(0, 64) + "-" + hash.toString(36).padStart(7, "0");
}
export function formatDuration(ms) {
  if (!Number.isFinite(ms)) return "–";
  if (ms >= 1000) return (ms / 1000).toFixed(ms >= 10000 ? 1 : 2) + " s";
  return ms.toFixed(ms >= 100 ? 0 : 1) + " ms";
}
export const TOOL_COLORS = Object.freeze({
  svelte: "#e34b20", rsvelte: "#2563eb", mrwaip: "#7c3aed", verter: "#e11d48",
  prettier: "#d6a529", eslint: "#6250cf", checkRs: "#0d9488", checkNative: "#b77820",
  sveld: "#0891b2", docinfo: "#a855f7", oxc: "#ca8a04", other: "#64748b",
});
export function colorForTool(label) {
  const n = String(label).toLowerCase();
  for (const [needle, family] of [
    ["verter", "verter"], ["mrwaip", "mrwaip"], ["rsvelte", "rsvelte"],
    ["svelte-check-native", "checkNative"], ["svelte-check-rs", "checkRs"],
    ["prettier", "prettier"], ["eslint", "eslint"], ["svelte-docinfo", "docinfo"],
    ["sveld", "sveld"], ["oxfmt", "oxc"], ["oxlint", "oxc"], ["svelte", "svelte"],
  ]) if (n.includes(needle)) return TOOL_COLORS[family];
  return TOOL_COLORS.other;
}
export const CHART_THEMES = Object.freeze({
  light: { ink: "#1f2328", inkSoft: "#59636e", grid: "#eaeef2", track: "#afb8c126" },
  dark: { ink: "#f0f6fc", inkSoft: "#a6adb7", grid: "#2a313a", track: "#6e768133" },
});
export function escapeXml(text) {
  return String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
function fitLabel(text, maxWidth, fontPx = 12) {
  const count = Math.max(4, Math.floor(maxWidth / (0.62 * fontPx)));
  return text.length <= count ? text : text.slice(0, count - 1) + "…";
}
/** value is the primary median; value2 is the independent fresh-child median. */
export function barChartSvg({ title, subtitle, unit = "ms", bars, lowerIsBetter = true, maxValue, theme = "light" }) {
  const t = CHART_THEMES[theme] ?? CHART_THEMES.light;
  const valid = (v) => Number.isFinite(v) && v >= 0;
  const rows = bars.filter((r) => valid(r.value) || ["skipped", "error"].includes(r.status))
    .map((r) => ({ ...r, unranked: Boolean(r.unranked || r.status === "unranked") }));
  if (!rows.length) return "";
  const order = (r) => !valid(r.value) ? 2 : r.unranked ? 1 : 0;
  rows.sort((a, b) => order(a) - order(b) ||
    (lowerIsBetter ? a.value - b.value : b.value - a.value) || a.label.localeCompare(b.label));
  const width = 760, labelW = 258, plotW = 478, rowH = 54, barH = 12;
  const headerH = subtitle ? 84 : 64;
  const height = headerH + rows.length * rowH + 30;
  const hasFresh = rows.some((r) => valid(r.value2));
  const peak = Math.max(Number.EPSILON, unit === "%" ? 100 : 0, valid(maxValue) ? maxValue : 0,
    ...rows.flatMap((r) => [r.value, r.value2].filter(valid)));
  const fmt = unit === "ms" ? formatDuration : unit === "%" ? (v) => v.toFixed(0) + "%" : (v) => v.toFixed(1) + " " + unit;
  const text = (x, y, value, attrs = "", fill = t.ink) =>
    '<text x="' + x + '" y="' + y + '" fill="' + fill + '" ' + attrs + '>' + escapeXml(value) + '</text>';
  const better = lowerIsBetter ? "Lower is better" : "Higher is better";
  const parts = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="' + escapeXml(title) + '">',
    '<title>' + escapeXml(title) + '</title><desc>' + escapeXml((subtitle ?? "") + ". " + better + ". Hatched bars are unranked; unavailable tools have no bar.") + '</desc>',
    '<style><![CDATA[text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;}]]></style>',
    text(16, 22, fitLabel(title, width - 32, 15), 'font-size="15" font-weight="600"'),
  ];
  if (subtitle) parts.push(text(16, 42, fitLabel(subtitle, width - 32), 'font-size="12"', t.inkSoft));
  parts.push(text(16, headerH - 15, better + (hasFresh ? " · Solid: warm (primary) · Outline: fresh child" : " · Median of measured runs"), 'font-size="11"', t.inkSoft));
  if (rows.some((r) => valid(r.value))) for (let i = 0; i <= 4; i++) {
    const x = labelW + plotW * i / 4;
    parts.push('<line x1="' + x + '" y1="' + (headerH - 2) + '" x2="' + x + '" y2="' + (height - 30) + '" stroke="' + t.grid + '"/>',
      text(x, height - 10, fmt(peak * i / 4), 'font-size="10" text-anchor="middle"', t.inkSoft));
  }
  rows.forEach((row, i) => {
    const y = headerH + i * rowH, color = colorForTool(row.label);
    const status = row.status === "skipped" ? "Skipped" : row.status === "error" ? "Error" : row.unranked ? "Unranked" : "";
    parts.push('<g data-tool="' + escapeXml(row.label) + '"><title>' + escapeXml(row.label + (status ? " · " + status : "") + (row.note ? ": " + row.note : "")) + '</title>',
      '<circle cx="21" cy="' + (y + 21) + '" r="4" fill="' + color + '"/>',
      text(32, y + 25, fitLabel(row.label, labelW - 46), 'font-size="12" font-weight="500"'));
    if (status) parts.push(text(32, y + 41, status, 'font-size="10"', t.inkSoft));
    if (!valid(row.value)) {
      parts.push(text(labelW, y + 25, fitLabel(row.note || "No timing available", plotW), 'font-size="11"', t.inkSoft), "</g>");
      return;
    }
    const primaryW = row.value / peak * plotW;
    const freshW = valid(row.value2) ? row.value2 / peak * plotW : null;
    const hatchId = "hatch-" + i;
    if (row.unranked) parts.push('<defs><pattern id="' + hatchId + '" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="7" height="7" fill="' + color + '"/><line x1="0" y1="0" x2="0" y2="7" stroke="#fff" stroke-width="2" stroke-opacity="0.5"/></pattern></defs>');
    parts.push('<rect x="' + labelW + '" y="' + (y + 24) + '" width="' + plotW + '" height="' + barH + '" rx="3" fill="' + t.track + '"/>');
    // Both series share zero; the outline stays visible when fresh is faster.
    if (freshW != null) parts.push('<rect data-series="fresh" x="' + labelW + '" y="' + (y + 21) + '" width="' + freshW.toFixed(2) + '" height="' + (barH + 6) + '" rx="3" fill="none" stroke="' + color + '" stroke-width="1.5"/>');
    parts.push('<rect data-series="primary" x="' + labelW + '" y="' + (y + 24) + '" width="' + primaryW.toFixed(2) + '" height="' + barH + '" rx="3" fill="' + (row.unranked ? "url(#" + hatchId + ")" : color) + '"/>');
    const value = fmt(row.value) + (freshW != null ? " warm / " + fmt(row.value2) + " fresh child" : "");
    // Labels above the bar stay legible for tiny bars and either page theme.
    parts.push(text(labelW, y + 14, row.unranked ? "(" + value + ")" : value, 'font-size="12" font-weight="600"'), "</g>");
  });
  return [...parts, "</svg>"].join("\n");
}
export function chartTwin(options) {
  return { light: barChartSvg({ ...options, theme: "light" }), dark: barChartSvg({ ...options, theme: "dark" }) };
}
export function chartPicture(leaf, title = "Benchmark results", chartsHref = "charts") {
  return '<picture>\n  <source media="(prefers-color-scheme: dark)" srcset="' + chartsHref + '/' + leaf + '-dark.svg">\n  <img src="' + chartsHref + '/' + leaf + '.svg" alt="' + escapeXml(title) + '" width="760">\n</picture>';
}
export function readmeChartPicture(leaf, title) {
  return chartPicture(leaf, title, "docs/charts");
}
