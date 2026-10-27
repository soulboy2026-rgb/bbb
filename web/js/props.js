// Reusable props for the scenes: hand, medal, Pauli, the IceCube array in 3D, etc.

import { C, TAU, W, H, clamp, lerp, ease, prog, rnd, rgba, glow, text, font, roundRect, card, drawDOM, mixHex } from "./core.js";

/** Check (ok=true) or cross mark drawn as strokes, so no glyph font is needed. */
export function mark(ctx, x, y, s, ok, o = {}) {
  const { color = ok ? C.green : C.red, alpha = 1, lw = s * 0.22 } = o;
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= clamp(alpha);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  if (ok) {
    ctx.moveTo(x - s * 0.5, y);
    ctx.lineTo(x - s * 0.12, y + s * 0.4);
    ctx.lineTo(x + s * 0.55, y - s * 0.45);
  } else {
    ctx.moveTo(x - s * 0.42, y - s * 0.42);
    ctx.lineTo(x + s * 0.42, y + s * 0.42);
    ctx.moveTo(x + s * 0.42, y - s * 0.42);
    ctx.lineTo(x - s * 0.42, y + s * 0.42);
  }
  ctx.stroke();
  ctx.restore();
}

/** Digits drawn in fixed-width cells so counters don't jitter. */
export function digits(ctx, str, x, y, o = {}) {
  const { size = 72, color = C.white, alpha = 1, glowColor = null } = o;
  const cw = size * 0.62, sw = size * 0.3;
  const widths = [...str].map((c) => (/[0-9]/.test(c) ? cw : sw));
  let cx = x - widths.reduce((a, b) => a + b, 0) / 2;
  ctx.save();
  ctx.globalAlpha *= clamp(alpha);
  ctx.font = font(size, 900);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (glowColor) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 24;
  }
  ctx.fillStyle = color;
  [...str].forEach((c, i) => {
    ctx.fillText(c, cx + widths[i] / 2, y);
    cx += widths[i];
  });
  ctx.restore();
}

export const fmtInt = (n) => Math.floor(n).toLocaleString("en-US");

/** Keep the first n visible characters of a 【】-marked string, closing an open mark. */
export function partialMarks(str, n) {
  let out = "", count = 0, open = false;
  for (const ch of str) {
    if (ch === "【") { open = true; out += ch; continue; }
    if (ch === "】") { open = false; out += ch; continue; }
    if (count >= n) break;
    out += ch;
    count++;
  }
  return open ? out + "】" : out;
}

/** A friendly open hand, palm centre at (x, y). */
export function drawHand(ctx, x, y, s, t, o = {}) {
  const { alpha = 1, glowA = 0.5 } = o;
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= clamp(alpha);
  glow(ctx, x, y - 40 * s, 420 * s, C.ice, glowA * 0.5);
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.rotate(Math.sin(t * 0.8) * 0.03);
  const parts = (path) => {
    path(() => { ctx.beginPath(); ctx.roundRect(-112, -70, 224, 240, 80); });
    const fingers = [[-108, -250], [-50, -292], [8, -282], [64, -226]];
    for (const [fx, fy] of fingers) path(() => { ctx.beginPath(); ctx.roundRect(fx, fy, 48, -fy + 10, 24); });
    path(() => {
      ctx.save();
      ctx.translate(-104, 58);
      ctx.rotate(-0.75);
      ctx.beginPath();
      ctx.roundRect(-26, -150, 52, 160, 26);
      ctx.restore();
    });
    path(() => { ctx.beginPath(); ctx.roundRect(-82, 140, 164, 140, 30); });
  };
  ctx.strokeStyle = C.ice;
  ctx.lineWidth = 12;
  parts((p) => { p(); ctx.stroke(); });
  ctx.fillStyle = "#0e2747";
  parts((p) => { p(); ctx.fill(); });
  // palm lines
  ctx.strokeStyle = rgba(C.ice, 0.35);
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-70, 10);
  ctx.quadraticCurveTo(0, 50, 80, 0);
  ctx.moveTo(-60, 70);
  ctx.quadraticCurveTo(10, 90, 70, 60);
  ctx.stroke();
  ctx.restore();
}

/** Gold Nobel-style medal (generic design, no portrait). */
export function drawMedal(ctx, x, y, r, t, o = {}) {
  const { alpha = 1, spin = 1, label = "2026" } = o;
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= clamp(alpha);
  glow(ctx, x, y, r * 2.2, C.gold, 0.45);
  ctx.translate(x, y);
  ctx.scale(Math.max(0.05, Math.abs(spin)), 1);
  const rg = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
  rg.addColorStop(0, "#fff4c4");
  rg.addColorStop(0.45, "#f5c04a");
  rg.addColorStop(1, "#a86f12");
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = "#8a5a10";
  ctx.lineWidth = r * 0.04;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.86, 0, TAU);
  ctx.stroke();
  // laurel leaves
  ctx.fillStyle = "rgba(120,78,10,0.55)";
  for (const side of [-1, 1]) {
    for (let k = 0; k < 9; k++) {
      const a = Math.PI / 2 + side * (0.35 + k * 0.17);
      const lx = Math.cos(a) * r * 0.68, ly = Math.sin(a) * r * 0.68;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(a + side * 0.9);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.085, r * 0.035, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }
  text(ctx, "NOBEL", 0, -r * 0.18, { size: r * 0.22, weight: 900, color: "#7a4c08" });
  text(ctx, label, 0, r * 0.14, { size: r * 0.26, weight: 900, color: "#7a4c08" });
  // shine sweep
  const sx = ((t * 0.5) % 2) * r * 3 - r * 1.5;
  ctx.globalCompositeOperation = "lighter";
  const lg = ctx.createLinearGradient(sx - r * 0.3, -r, sx + r * 0.3, r);
  lg.addColorStop(0, "rgba(255,255,255,0)");
  lg.addColorStop(0.5, "rgba(255,255,255,0.35)");
  lg.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = lg;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/** Cartoon Pauli: round face and round glasses (an affectionate caricature). */
export function drawPauli(ctx, x, y, s, t, o = {}) {
  const { alpha = 1, sweat = 0 } = o;
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= clamp(alpha);
  ctx.translate(x, y);
  ctx.scale(s, s);
  // body
  ctx.fillStyle = "#2b3550";
  ctx.beginPath();
  ctx.moveTo(-110, 230);
  ctx.quadraticCurveTo(-100, 110, 0, 105);
  ctx.quadraticCurveTo(100, 110, 110, 230);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#f4f4f4";
  ctx.beginPath();
  ctx.moveTo(-30, 108);
  ctx.lineTo(0, 170);
  ctx.lineTo(30, 108);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#b03a48";
  ctx.beginPath();
  ctx.moveTo(-9, 118);
  ctx.lineTo(9, 118);
  ctx.lineTo(12, 175);
  ctx.lineTo(0, 190);
  ctx.lineTo(-12, 175);
  ctx.closePath();
  ctx.fill();
  // head
  ctx.fillStyle = "#f1c9a1";
  ctx.beginPath();
  ctx.ellipse(0, 0, 92, 100, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#3a2a22";
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + 0.25 + (i / 8) * (Math.PI - 0.5);
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 78, Math.sin(a) * 80 - 8, 26, 0, TAU);
    ctx.fill();
  }
  // glasses
  ctx.strokeStyle = "#1b1b1b";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(-34, 2, 25, 0, TAU);
  ctx.moveTo(59, 2);
  ctx.arc(34, 2, 25, 0, TAU);
  ctx.moveTo(-9, 0);
  ctx.lineTo(9, 0);
  ctx.stroke();
  const blink = (t + 1.3) % 3.1 < 0.12 ? 0.15 : 1;
  ctx.fillStyle = "#1b1b1b";
  ctx.beginPath();
  ctx.ellipse(-34, 4, 6, 7 * blink, 0, 0, TAU);
  ctx.ellipse(34, 4, 6, 7 * blink, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = "#7a3d2a";
  ctx.lineWidth = 5;
  ctx.beginPath();
  if (sweat > 0) ctx.arc(0, 62, 14, Math.PI * 1.15, Math.PI * 1.85);
  else ctx.arc(0, 44, 18, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();
  if (sweat > 0) {
    const dy = ((t * 0.8) % 1) * 30;
    ctx.globalAlpha *= sweat;
    ctx.fillStyle = "#9fdcff";
    ctx.beginPath();
    ctx.moveTo(78, -50 + dy);
    ctx.quadraticCurveTo(92, -20 + dy, 78, -14 + dy);
    ctx.quadraticCurveTo(64, -20 + dy, 78, -50 + dy);
    ctx.fill();
  }
  ctx.restore();
}

/** Nuclear power plant cooling tower with steam. */
export function drawTower(ctx, x, y, s, t, o = {}) {
  const { alpha = 1 } = o;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.scale(s, s);
  for (let i = 0; i < 6; i++) {
    const u = ((t * 0.25 + i / 6) % 1);
    ctx.fillStyle = `rgba(230,240,255,${0.35 * (1 - u)})`;
    ctx.beginPath();
    ctx.arc(Math.sin(i * 2 + t) * 20 + u * 60, -260 - u * 220, 50 + u * 70, 0, TAU);
    ctx.fill();
  }
  const lg = ctx.createLinearGradient(-120, 0, 120, 0);
  lg.addColorStop(0, "#7d8aa3");
  lg.addColorStop(0.5, "#c9d3e6");
  lg.addColorStop(1, "#6a7690");
  ctx.fillStyle = lg;
  ctx.beginPath();
  ctx.moveTo(-130, 0);
  ctx.quadraticCurveTo(-60, -130, -80, -250);
  ctx.lineTo(80, -250);
  ctx.quadraticCurveTo(60, -130, 130, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** A hot-air balloon (Victor Hess, 1912). */
export function drawBalloon(ctx, x, y, s, t, o = {}) {
  const { alpha = 1 } = o;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y + Math.sin(t * 1.3) * 10);
  ctx.scale(s, s);
  const stripes = ["#ff7e7e", "#ffe18a", "#ff7e7e", "#ffe18a", "#ff7e7e"];
  stripes.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(0, 0, 110 - i * 22, 130, 0, 0, TAU);
    ctx.fill();
  });
  ctx.strokeStyle = "#d9c4a0";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-60, 105);
  ctx.lineTo(-28, 190);
  ctx.moveTo(60, 105);
  ctx.lineTo(28, 190);
  ctx.stroke();
  ctx.fillStyle = "#8a5a2b";
  ctx.fillRect(-32, 188, 64, 44);
  ctx.restore();
}

/** Small satellite (Fermi-like) with solar panels. */
export function drawSatellite(ctx, x, y, s, t, o = {}) {
  const { alpha = 1 } = o;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.rotate(Math.sin(t * 0.7) * 0.08);
  ctx.scale(s, s);
  ctx.fillStyle = "#3d6fd1";
  for (const sx of [-1, 1]) {
    ctx.fillRect(sx * 70 - (sx < 0 ? 110 : 0), -28, 110, 56);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 2;
    for (let k = 1; k < 4; k++) {
      ctx.beginPath();
      const bx = sx * 70 - (sx < 0 ? 110 : 0) + k * 27.5;
      ctx.moveTo(bx, -28);
      ctx.lineTo(bx, 28);
      ctx.stroke();
    }
  }
  ctx.fillStyle = "#d8c27a";
  ctx.fillRect(-60, -50, 120, 100);
  ctx.fillStyle = "#b9a35c";
  ctx.fillRect(-60, 20, 120, 30);
  ctx.restore();
}

/** Telescope dome icon. */
export function drawObservatory(ctx, x, y, s, o = {}) {
  const { alpha = 1, lit = 0 } = o;
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (lit > 0) glow(ctx, x, y - 10 * s, 70 * s, C.yellow, lit);
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = "#dfe8f5";
  ctx.beginPath();
  ctx.arc(0, 0, 30, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(-30, 0, 60, 26);
  ctx.fillStyle = "#24324f";
  ctx.fillRect(-6, -30, 12, 30);
  ctx.restore();
}

/** Burj Khalifa-like stepped tower silhouette, base at (x, y), height h px. */
export function drawSkyscraper(ctx, x, y, h, o = {}) {
  const { alpha = 1, color = "#c9d6ea" } = o;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = color;
  const steps = [[0.0, 0.11], [0.25, 0.09], [0.45, 0.07], [0.62, 0.05], [0.76, 0.035], [0.86, 0.02]];
  ctx.beginPath();
  ctx.moveTo(x - h * 0.11, y);
  for (const [u, hw] of steps) {
    ctx.lineTo(x - h * hw, y - h * u);
    ctx.lineTo(x - h * hw, y - h * (u + 0.1));
  }
  ctx.lineTo(x - 2, y - h);
  ctx.lineTo(x + 2, y - h);
  for (const [u, hw] of [...steps].reverse()) {
    ctx.lineTo(x + h * hw, y - h * (u + 0.1));
    ctx.lineTo(x + h * hw, y - h * u);
  }
  ctx.lineTo(x + h * 0.11, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** IceCube Lab building on the ice surface; (x, y) is ground centre. */
export function drawICL(ctx, x, y, s, o = {}) {
  const { alpha = 1 } = o;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = "#5b6f8f";
  ctx.fillRect(-60, -12, 8, 12);
  ctx.fillRect(52, -12, 8, 12);
  ctx.fillStyle = "#d7e2f2";
  ctx.fillRect(-90, -62, 180, 50);
  ctx.fillStyle = "#9fb3cf";
  ctx.fillRect(-70, -100, 34, 40);
  ctx.fillRect(36, -100, 34, 40);
  ctx.fillStyle = "#ffd36b";
  for (let k = 0; k < 6; k++) ctx.fillRect(-78 + k * 28, -46, 14, 12);
  ctx.restore();
}

/** Drill tower (A-frame) on the surface; (x, y) is ground centre. */
export function drawDrill(ctx, x, y, s, t, o = {}) {
  const { alpha = 1 } = o;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = "#ff9f43";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-50, 0);
  ctx.lineTo(0, -150);
  ctx.lineTo(50, 0);
  ctx.moveTo(-34, -50);
  ctx.lineTo(34, -50);
  ctx.moveTo(-18, -100);
  ctx.lineTo(18, -100);
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const u = ((t * 0.5 + i / 4) % 1);
    ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - u)})`;
    ctx.beginPath();
    ctx.arc(10 + u * 30, -150 - u * 90, 14 + u * 22, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- IceCube in 3D

/** 86 string positions (metres) on a triangular grid with 125 m spacing. */
export const STRINGS = (() => {
  const pts = [];
  for (let q = -5; q <= 5; q++)
    for (let r = -5; r <= 5; r++) {
      if (Math.abs(-q - r) > 5) continue;
      pts.push([125 * (q + r / 2), 125 * ((r * Math.sqrt(3)) / 2)]);
    }
  pts.sort((a, b) => Math.hypot(a[0], a[1]) - Math.hypot(b[0], b[1]));
  return pts.slice(0, 86);
})();

/** Perspective camera around the array. y is up (metres, 0 = detector centre). */
export function camera(cx, cy, k, yaw, pitch = 0.32, D = 2600) {
  const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  return (x, y, z) => {
    const X = x * cyw - z * syw;
    const Z = x * syw + z * cyw;
    const Y2 = y * cp - Z * sp;
    const Z2 = y * sp + Z * cp;
    const f = D / (D + Z2);
    return [cx + X * k * f, cy - Y2 * k * f, Z2, f];
  };
}

/** Rainbow by arrival time (IceCube event-display convention: red early → blue late). */
export function timeColor(u) {
  const stops = ["#ff3b3b", "#ff9f43", "#ffe066", "#6dffa8", "#4fc3ff", "#6b7bff"];
  const x = clamp(u) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  return mixHex(stops[i], stops[i + 1], x - i);
}

/**
 * Draw the in-ice array. `lit(x, y, z)` may return {a, color} to light a module.
 * `reveal` (0..1) grows strings from the top down.
 */
export function drawArray(ctx, cam, o = {}) {
  const { alpha = 1, per = 15, lit = null, reveal = 1, frame = true, domR = 4.2, strings = STRINGS.length } = o;
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= clamp(alpha);
  if (frame) {
    const c = [-560, 560];
    const corners = [];
    for (const x of c) for (const y of [-500, 500]) for (const z of c) corners.push(cam(x, y, z));
    const edges = [[0, 1], [0, 2], [1, 3], [2, 3], [4, 5], [4, 6], [5, 7], [6, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
    ctx.strokeStyle = "rgba(139,233,255,0.22)";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    for (const [a, b] of edges) {
      ctx.beginPath();
      ctx.moveTo(corners[a][0], corners[a][1]);
      ctx.lineTo(corners[b][0], corners[b][1]);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }
  const order = STRINGS.slice(0, strings).map((p, i) => ({ p, i, z: cam(p[0], 0, p[1])[2] })).sort((a, b) => b.z - a.z);
  const lights = [];
  for (const { p, i } of order) {
    const r = clamp(reveal * 1.4 - (i / STRINGS.length) * 0.4);
    if (r <= 0) continue;
    const top = cam(p[0], 500, p[1]);
    const bot = cam(p[0], 500 - 1000 * r, p[1]);
    ctx.strokeStyle = "rgba(170,220,255,0.42)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(top[0], top[1]);
    ctx.lineTo(bot[0], bot[1]);
    ctx.stroke();
    for (let k = 0; k < per; k++) {
      const y = 500 - (1000 * (k + 0.5)) / per;
      if (y < 500 - 1000 * r) break;
      const q = cam(p[0], y, p[1]);
      const L = lit ? lit(p[0], y, p[1]) : null;
      const depthA = 0.45 + 0.55 * clamp(1 - (q[2] + 700) / 1800);
      ctx.fillStyle = `rgba(210,236,255,${0.9 * depthA})`;
      ctx.fillRect(q[0] - (domR * q[3]) / 2, q[1] - (domR * q[3]) / 2, domR * q[3], domR * q[3]);
      if (L && L.a > 0.02) lights.push([q, L]);
    }
  }
  for (const [q, L] of lights) {
    glow(ctx, q[0], q[1], (10 + 34 * L.a) * q[3], L.color, Math.min(1, 0.5 + L.a));
    ctx.fillStyle = L.color;
    ctx.beginPath();
    ctx.arc(q[0], q[1], (2.5 + 9 * L.a) * q[3], 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

/** Simple house door for the "never knocks" gag. */
export function drawDoor(ctx, x, y, s, o = {}) {
  const { alpha = 1, open = 0 } = o;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = "#26344f";
  roundRect(ctx, -130, -250, 260, 290, 20);
  ctx.fill();
  ctx.fillStyle = "#c0773c";
  roundRect(ctx, -100, -220, 200, 260, 12);
  ctx.fill();
  ctx.strokeStyle = "#8f5427";
  ctx.lineWidth = 6;
  ctx.strokeRect(-76, -196, 152, 90);
  ctx.strokeRect(-76, -90, 152, 110);
  ctx.fillStyle = C.gold;
  ctx.beginPath();
  ctx.arc(70, -60, 11, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/** Nucleus: a cluster of protons and neutrons. */
export function drawNucleus(ctx, x, y, r, t, o = {}) {
  const { alpha = 1, burst = 0 } = o;
  ctx.save();
  ctx.globalAlpha *= alpha;
  for (let i = 0; i < 14; i++) {
    const a = rnd(i, 70) * TAU, d = Math.sqrt(rnd(i, 71)) * r * 0.75 + burst * r * (2 + rnd(i, 72) * 5);
    const px = x + Math.cos(a) * d + Math.sin(t * 9 + i) * 2, py = y + Math.sin(a) * d;
    const rg = ctx.createRadialGradient(px - r * 0.1, py - r * 0.1, 1, px, py, r * 0.32);
    const col = i % 2 ? "#ff6b6b" : "#9fb0c8";
    rg.addColorStop(0, "#ffffff");
    rg.addColorStop(0.35, col);
    rg.addColorStop(1, col);
    ctx.fillStyle = rg;
    ctx.globalAlpha = alpha * (1 - burst * 0.8);
    ctx.beginPath();
    ctx.arc(px, py, r * 0.3, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

/** Jet airplane silhouette pointing right. */
export function drawJet(ctx, x, y, s, o = {}) {
  const { alpha = 1 } = o;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = "#dfe8f5";
  ctx.beginPath();
  ctx.moveTo(60, 0);
  ctx.lineTo(20, -8);
  ctx.lineTo(-50, -8);
  ctx.lineTo(-62, -26);
  ctx.lineTo(-70, -26);
  ctx.lineTo(-64, 0);
  ctx.lineTo(-70, 8);
  ctx.lineTo(-50, 8);
  ctx.lineTo(20, 8);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(-30, 34);
  ctx.lineTo(-42, 34);
  ctx.lineTo(-20, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Mach/Cherenkov cone: wavefronts emitted along a path from (x0,y) moving right
 * at speed v; waves expand at speed c (< v). `age` is time since departure.
 */
export function drawCone(ctx, x0, y, v, c, age, o = {}) {
  const { color = "#9fb0c8", n = 14, every = 0.12, alpha = 1, glowFront = false } = o;
  ctx.save();
  ctx.globalAlpha *= alpha;
  for (let k = 0; k < n; k++) {
    const te = age - k * every; // when this wavefront was emitted
    if (te < 0) continue;
    ctx.strokeStyle = rgba(color, 0.6 * (1 - k / n));
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x0 + v * te, y, c * k * every, 0, TAU);
    ctx.stroke();
  }
  // envelope: the cone the wavefronts pile up into
  const head = x0 + v * age;
  const half = Math.asin(clamp(c / v));
  const len = v * Math.min(age, n * every);
  ctx.strokeStyle = rgba(color, 0.95);
  ctx.lineWidth = 4;
  if (glowFront) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 24;
  }
  ctx.beginPath();
  ctx.moveTo(head - len * Math.cos(half), y - len * Math.sin(half) * 1.0);
  ctx.lineTo(head, y);
  ctx.lineTo(head - len * Math.cos(half), y + len * Math.sin(half) * 1.0);
  ctx.stroke();
  ctx.restore();
}

/** Year badge. */
export function yearBadge(ctx, year, x, y, a, o = {}) {
  const { color = C.gold, size = 64 } = o;
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  ctx.translate(x, y);
  const s = lerp(1.4, 1, ease.out(a));
  ctx.scale(s, s);
  ctx.font = font(size, 900);
  const w = ctx.measureText(year).width + 48;
  card(ctx, -w / 2, -size * 0.72, w, size * 1.44, { r: 18, fill: rgba(color, 0.16), stroke: color, lw: 3 });
  text(ctx, year, 0, 2, { size, weight: 900, color });
  ctx.restore();
}

/** Small lightning bolt icon. */
export function drawBolt(ctx, x, y, s, o = {}) {
  const { color = C.yellow, alpha = 1 } = o;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(6, -40);
  ctx.lineTo(-18, 6);
  ctx.lineTo(-2, 6);
  ctx.lineTo(-8, 40);
  ctx.lineTo(18, -8);
  ctx.lineTo(2, -8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export { W, H };
