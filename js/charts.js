/* Lightweight pure-SVG chart helpers (no chart library). */
window.App = window.App || {};

App.Charts = (function () {
  function ring(value, target, opts) {
    opts = opts || {};
    const size = opts.size || 140;
    const stroke = opts.stroke || 12;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const pct = target > 0 ? Math.max(0, Math.min(value / target, 1.25)) : 0;
    const dash = Math.min(pct, 1) * c;
    const color = opts.color || (pct > 1 ? "var(--danger)" : pct > 0.85 ? "var(--orange-600)" : "var(--green-600)");
    const mid = size / 2;
    return '' +
      '<svg class="progress-ring" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + " " + size + '" role="img" aria-label="' + App.UI.esc(opts.aria || "progress") + '">' +
        '<circle class="track" cx="' + mid + '" cy="' + mid + '" r="' + r + '" fill="none" stroke-width="' + stroke + '"/>' +
        '<circle class="value" cx="' + mid + '" cy="' + mid + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="' + stroke + '" ' +
          'stroke-dasharray="' + c + '" stroke-dashoffset="' + (c - dash) + '"/>' +
        '<text x="' + mid + '" y="' + (mid - 2) + '" text-anchor="middle" font-size="' + (size * 0.2) + '" font-weight="700" fill="var(--text)">' + App.I18N.fmtNum(value) + "</text>" +
        '<text x="' + mid + '" y="' + (mid + size * 0.16) + '" text-anchor="middle" font-size="' + (size * 0.1) + '" fill="var(--muted)">of ' + App.I18N.fmtNum(target) + "</text>" +
      "</svg>";
  }

  function lineChart(series, opts) {
    opts = opts || {};
    const w = opts.width || 640;
    const h = opts.height || 200;
    const pad = { t: 14, r: 14, b: 26, l: 34 };
    const max = opts.max || Math.max.apply(null, series.map((d) => d.value).concat([1]));
    const innerW = w - pad.l - pad.r;
    const innerH = h - pad.t - pad.b;
    const stepX = series.length > 1 ? innerW / (series.length - 1) : 0;
    const color = opts.color || "var(--blue-600)";

    const pts = series.map((d, i) => {
      const x = pad.l + i * stepX;
      const y = pad.t + innerH - (max > 0 ? (d.value / max) * innerH : 0);
      return { x: x, y: y, d: d };
    });
    const line = pts.map((p) => p.x + "," + p.y).join(" ");
    const area = pad.l + "," + (pad.t + innerH) + " " + line + " " + (pad.l + innerW) + "," + (pad.t + innerH);
    const gridLines = [0, 0.5, 1].map((f) => {
      const y = pad.t + innerH - f * innerH;
      return '<line x1="' + pad.l + '" y1="' + y + '" x2="' + (pad.l + innerW) + '" y2="' + y + '" stroke="var(--border)" stroke-width="1"/>' +
        '<text x="' + (pad.l - 6) + '" y="' + (y + 3) + '" text-anchor="end" font-size="10" fill="var(--muted)">' + App.I18N.fmtNum(max * f) + "</text>";
    }).join("");
    const dots = pts.map((p) =>
      '<circle cx="' + p.x + '" cy="' + p.y + '" r="3.5" fill="' + (p.d.color || color) + '"/>'
    ).join("");
    const labels = pts.map((p) =>
      '<text x="' + p.x + '" y="' + (h - 8) + '" text-anchor="middle" font-size="10" fill="var(--muted)">' + App.UI.esc(p.d.label) + "</text>"
    ).join("");

    return '<svg viewBox="0 0 ' + w + " " + h + '" width="100%" height="' + h + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + App.UI.esc(opts.aria || "trend chart") + '">' +
      gridLines +
      '<polygon points="' + area + '" fill="' + color + '" opacity="0.08"/>' +
      '<polyline points="' + line + '" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' +
      dots + labels + "</svg>";
  }

  function bars(series, opts) {
    opts = opts || {};
    const w = opts.width || 640;
    const h = opts.height || 210;
    const pad = { t: 14, r: 14, b: 34, l: 34 };
    const max = opts.max || Math.max.apply(null, series.map((d) => d.value).concat([1]));
    const innerW = w - pad.l - pad.r;
    const innerH = h - pad.t - pad.b;
    const slot = innerW / series.length;
    const barW = Math.min(38, slot * 0.6);
    const grid = [0, 0.5, 1].map((f) => {
      const y = pad.t + innerH - f * innerH;
      return '<line x1="' + pad.l + '" y1="' + y + '" x2="' + (pad.l + innerW) + '" y2="' + y + '" stroke="var(--border)" stroke-width="1"/>' +
        '<text x="' + (pad.l - 6) + '" y="' + (y + 3) + '" text-anchor="end" font-size="10" fill="var(--muted)">' + App.I18N.fmtNum(max * f) + "</text>";
    }).join("");
    const rects = series.map((d, i) => {
      const bh = max > 0 ? (d.value / max) * innerH : 0;
      const x = pad.l + i * slot + (slot - barW) / 2;
      const y = pad.t + innerH - bh;
      const color = d.color || "var(--green-600)";
      return '<rect x="' + x + '" y="' + y + '" width="' + barW + '" height="' + Math.max(bh, 1) + '" rx="4" fill="' + color + '"/>' +
        '<text x="' + (x + barW / 2) + '" y="' + (h - 18) + '" text-anchor="middle" font-size="10" fill="var(--muted)">' + App.UI.esc(d.label) + "</text>";
    }).join("");
    return '<svg viewBox="0 0 ' + w + " " + h + '" width="100%" height="' + h + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + App.UI.esc(opts.aria || "bar chart") + '">' +
      grid + rects + "</svg>";
  }

  return { ring, lineChart, bars };
})();
