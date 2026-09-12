/**
 * Deterministic single-file SVG bar charts for generated docs.
 *
 * Safari constraint (same as the Vue reference implementation): GitHub loads
 * SVGs through <img>, and Safari does not reliably apply
 * prefers-color-scheme INSIDE such an image. Charts therefore ship as explicit
 * light + dark twins with fixed fills and no media queries; the page selects
 * via <picture><source media="(prefers-color-scheme: dark)">.
 *
 * Deterministic filenames: slugified chart names ≤72 chars pass through;
 * longer names become first-64-chars + "-" + 7-char base36 FNV-1a hash of the
 * full string (truncating alone made sibling charts overwrite each other).
 */

export function slugify(name) {
  return String(name)
    .toLowerCase()
    .replace(/[<>]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function fnv1a(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36);
}

export function chartFileName(name) {
  const slug = slugify(name);
  if (slug.length <= 72) return slug;
  return `${slug.slice(0, 64)}-${fnv1a(slug).slice(0, 7)}`;
}

export function formatDuration(ms) {
  if (!Number.isFinite(ms)) return "n/a";
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)} s`;
  return `${ms.toFixed(1)} ms`;
}

/** Stable tool colors — a tool keeps its color across pages of a run. */
const TOOL_COLORS = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#9333ea",
  "#ea580c",
  "#0891b2",
  "#ca8a04",
  "#db2777",
  "#4f46e5",
  "#059669",
];
const colorByLabel = new Map();
export function colorForTool(label) {
  if (!colorByLabel.has(label)) {
    colorByLabel.set(
      label,
      TOOL_COLORS[colorByLabel.size % TOOL_COLORS.length],
    );
  }
  return colorByLabel.get(label);
}

export const CHART_THEMES = Object.freeze({
  light: {
    ink: "#1f2328",
    inkSoft: "#59636e",
    axis: "#d1d9e0",
    grid: "#eaeef2",
    surface: "transparent",
  },
  dark: {
    ink: "#f0f6fc",
    inkSoft: "#9198a1",
    axis: "#3d444d",
    grid: "#2a313a",
    surface: "transparent",
  },
});

function luminance(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(
    (c) => c / 255,
  );
  const f = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function escapeXml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Safari clips overflowing labels — approximate width and ellipsize. */
function fitLabel(text, maxWidth, charWidth = 0.62, fontPx = 12) {
  const maxChars = Math.max(4, Math.floor(maxWidth / (charWidth * fontPx)));
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(1, maxChars - 1))}…`;
}

/**
 * Render a horizontal bar chart.
 *
 * bars: [{ label, value, value2?, unranked? }] — value2 (when finite) draws an
 * overlaid second series (fresh child vs warm); unranked rows sort last and
 * render hatched with a struck-through name.
 */
export function barChartSvg({
  title,
  unit = "ms",
  bars,
  lowerIsBetter = true,
  maxValue,
  theme = "light",
}) {
  const t = CHART_THEMES[theme] ?? CHART_THEMES.light;
  const width = 760;
  const labelW = 248;
  const rowH = 36;
  const barH = 22;
  const headerH = 40;
  const rows = [...bars].sort((a, b) =>
    a.unranked === b.unranked
      ? lowerIsBetter
        ? a.value - b.value
        : b.value - a.value
      : a.unranked
        ? 1
        : -1,
  );
  const height = headerH + rows.length * rowH + 12;
  const plotW = width - labelW - 96;
  const peak =
    Number.isFinite(maxValue) && maxValue > 0
      ? maxValue
      : Math.max(
          1e-9,
          ...rows.map((r) => Math.max(r.value ?? 0, r.value2 ?? 0)),
        );
  const fmt =
    unit === "ms"
      ? formatDuration
      : unit === "%"
        ? (v) => `${v.toFixed(0)}%`
        : (v) => `${Math.round(v).toLocaleString()} ${unit}`;

  const parts = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(title)}">`,
  );
  parts.push(
    `<style><![CDATA[text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;}]]></style>`,
  );
  parts.push(
    `<text x="0" y="18" font-size="13" font-weight="600" fill="${t.ink}">${escapeXml(fitLabel(title, width))}</text>`,
  );

  // 4 axis gridlines with tick labels
  for (let i = 0; i <= 4; i++) {
    const x = labelW + (plotW * i) / 4;
    parts.push(
      `<line x1="${x}" y1="${headerH - 8}" x2="${x}" y2="${height - 10}" stroke="${i === 0 ? t.axis : t.grid}" stroke-width="1"/>`,
    );
    parts.push(
      `<text x="${x}" y="${height - 2}" font-size="10" fill="${t.inkSoft}" text-anchor="middle">${escapeXml(fmt((peak * i) / 4))}</text>`,
    );
  }

  rows.forEach((row, i) => {
    const y = headerH + i * rowH;
    const color = colorForTool(row.label);
    const name = fitLabel(row.label, labelW - 26) + (row.unranked ? " · unranked" : "");
    const strike = row.unranked
      ? ` stroke="${t.inkSoft}" stroke-width="1" text-decoration="line-through"`
      : "";
    parts.push(
      `<text x="${labelW - 10}" y="${y + 15}" font-size="12" fill="${t.inkSoft}" text-anchor="end"${strike}>${escapeXml(name)}</text>`,
    );

    const drawBar = (x0, w, fill, { hatch = false, opacity = 1 } = {}) => {
      if (w <= 0) return;
      if (hatch) {
        parts.push(
          `<rect x="${x0}" y="${y}" width="${w}" height="${barH}" fill="${fill}" fill-opacity="0.25" stroke="${fill}" stroke-width="1"/>`,
        );
        parts.push(
          `<line x1="${x0}" y1="${y + barH}" x2="${x0 + barH}" y2="${y}" stroke="${fill}" stroke-width="1" opacity="0.7"/>`,
          `<line x1="${x0 + barH / 2}" y1="${y + barH}" x2="${x0 + barH}" y2="${y}" stroke="${fill}" stroke-width="1" opacity="0.7"/>`,
        );
      } else {
        parts.push(
          `<rect x="${x0}" y="${y}" width="${w}" height="${barH}" fill="${fill}" fill-opacity="${opacity}" rx="2"/>`,
        );
      }
    };

    const baseW = Math.max(0, (Math.max(row.value ?? 0, row.value2 ?? 0) / peak) * plotW);
    drawBar(labelW, baseW, color, { hatch: Boolean(row.unranked) });
    if (Number.isFinite(row.value2) && row.value2 !== row.value) {
      // Second series (e.g. warm) overlaid on the fresh-child extent.
      const w2 = Math.max(0, (row.value2 / peak) * plotW);
      drawBar(labelW, w2, color, { opacity: 0.55 });
      parts.push(
        `<line x1="${labelW + w2}" y1="${y - 2}" x2="${labelW + w2}" y2="${y + barH + 2}" stroke="${t.inkSoft}" stroke-width="1"/>`,
      );
    }

    // On-bar value label, ink chosen from the bar's own WCAG luminance.
    const ink = luminance(color) > 0.45 ? "#ffffff" : "#0b0f14";
    const label =
      Number.isFinite(row.value2) && row.value2 !== row.value
        ? `${fmt(row.value)} / ${fmt(row.value2)}`
        : fmt(row.value);
    const inside = baseW > 96;
    parts.push(
      `<text x="${inside ? labelW + baseW - 6 : labelW + baseW + 6}" y="${y + 15}" font-size="11" fill="${ink === "#ffffff" ? ink : t.ink}" text-anchor="${inside ? "end" : "start"}">${escapeXml(label)}</text>`,
    );
  });

  parts.push("</svg>");
  return parts.join("");
}

export function darkVariant(svg) {
  return svg; // caller passes theme explicitly per twin; kept for API symmetry
}

/** Both twins in one call: { light, dark } file contents. */
export function chartTwin(options) {
  return {
    light: barChartSvg({ ...options, theme: "light" }),
    dark: barChartSvg({ ...options, theme: "dark" }),
  };
}

export function chartPicture(leaf) {
  return `<picture>\n  <source media="(prefers-color-scheme: dark)" srcset="../charts/${leaf}-dark.svg">\n  <img src="../charts/${leaf}.svg" alt="" width="760">\n</picture>`;
}

export function readmeChartPicture(leaf) {
  return `<picture>\n  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/${leaf}-dark.svg">\n  <img src="docs/charts/${leaf}.svg" alt="" width="760">\n</picture>`;
}
