// Drawing toolkit shared by every scene. Everything here is a pure function of
// its arguments (no per-frame state), so any frame can be rendered in any order.

export const W = 1920;
export const H = 1080;

export const C = {
  bg0: "#030716",
  bg1: "#0b1838",
  ice: "#8be9ff",
  iceDeep: "#0a3a66",
  ghost: "#9ff6ff",
  gold: "#ffd36b",
  pink: "#ff7eb6",
  red: "#ff5a5f",
  orange: "#ff9f43",
  yellow: "#ffe066",
  green: "#6dffa8",
  purple: "#b18cff",
  white: "#f4fbff",
  dim: "rgba(214,232,255,0.62)",
  ink: "#0d1a33",
};

export const FONT_T = '"ZCOOL KuaiLe", "Noto Sans SC", sans-serif';
export const FONT = '"Noto Sans SC", sans-serif';

// ---------------------------------------------------------------- math

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const TAU = Math.PI * 2;

export const ease = {
  out: (t) => 1 - Math.pow(1 - clamp(t), 3),
  in: (t) => Math.pow(clamp(t), 3),
  inOut: (t) => {
    t = clamp(t);
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  },
  back: (t) => {
    t = clamp(t);
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  elastic: (t) => {
    t = clamp(t);
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (TAU / 3)) + 1;
  },
};

/** 0→1 over [start, start+dur]. */
export const prog = (t, start, dur = 1) => clamp((t - start) / dur);

/** Rises over `inDur` after `start`, falls over `outDur` before `end`. */
export function window01(t, start, end, inDur = 0.4, outDur = 0.4) {
  return Math.min(prog(t, start, inDur), 1 - prog(t, end - outDur, outDur));
}

/** Deterministic pseudo-random in [0,1). */
export function rnd(i, salt = 0) {
  const x = Math.sin(i * 127.1 + salt * 311.7 + 0.123) * 43758.5453123;
  return x - Math.floor(x);
}

export function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgba(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

export function mixHex(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  const c = A.map((v, i) => Math.round(lerp(v, B[i], clamp(t))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

// ---------------------------------------------------------------- glow

const glowCache = new Map();
function glowSprite(color) {
  let s = glowCache.get(color);
  if (s) return s;
  s = document.createElement("canvas");
  s.width = s.height = 128;
  const g = s.getContext("2d");
  const [r, gg, b] = hexToRgb(color);
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, `rgba(${r},${gg},${b},1)`);
  gr.addColorStop(0.18, `rgba(${r},${gg},${b},0.6)`);
  gr.addColorStop(0.45, `rgba(${r},${gg},${b},0.16)`);
  gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  glowCache.set(color, s);
  return s;
}

/** Additive soft light blob. */
export function glow(ctx, x, y, r, color, a = 1) {
  if (a <= 0 || r <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha *= clamp(a);
  ctx.drawImage(glowSprite(color), x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

// ---------------------------------------------------------------- text

export function font(size, weight = 700, family = FONT) {
  return `${weight} ${size}px ${family}`;
}

export function text(ctx, str, x, y, o = {}) {
  const {
    size = 48, weight = 700, family = FONT, color = C.white, align = "center",
    base = "middle", alpha = 1, shadow = null, blur = 24, stroke = null, strokeW = 0,
  } = o;
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= clamp(alpha);
  ctx.font = font(size, weight, family);
  ctx.textAlign = align;
  ctx.textBaseline = base;
  if (stroke) {
    ctx.lineJoin = "round";
    ctx.lineWidth = strokeW;
    ctx.strokeStyle = stroke;
    ctx.strokeText(str, x, y);
  }
  if (shadow) {
    ctx.shadowColor = shadow;
    ctx.shadowBlur = blur;
  }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
  ctx.restore();
}

/** Title text that pops in character by character. */
export function popText(ctx, str, x, y, t, o = {}) {
  const { size = 96, family = FONT_T, weight = 400, color = C.white, stagger = 0.05, shadow = null, align = "center" } = o;
  ctx.save();
  ctx.font = font(size, weight, family);
  const chars = [...str];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0);
  let cx = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
  chars.forEach((c, i) => {
    const p = prog(t, i * stagger, 0.45);
    if (p > 0) {
      const s = ease.back(p);
      ctx.save();
      ctx.translate(cx + widths[i] / 2, y + (1 - ease.out(p)) * size * 0.5);
      ctx.scale(s, s);
      text(ctx, c, 0, 0, { size, family, weight, color, alpha: p * (o.alpha ?? 1), shadow, blur: o.blur ?? 30 });
      ctx.restore();
    }
    cx += widths[i];
  });
  ctx.restore();
}

/** Parse "普通【高亮】普通" into segments. */
export function parseMarks(str) {
  const segs = [];
  const re = /【([^】]*)】/g;
  let last = 0, m;
  while ((m = re.exec(str))) {
    if (m.index > last) segs.push({ s: str.slice(last, m.index), hi: false });
    segs.push({ s: m[1], hi: true });
    last = re.lastIndex;
  }
  if (last < str.length) segs.push({ s: str.slice(last), hi: false });
  return segs;
}

/** One line of text with 【】 highlights, centred on x. */
export function richText(ctx, str, x, y, o = {}) {
  const { size = 48, weight = 700, color = C.white, hi = C.ice, stroke = null, strokeW = 0, alpha = 1, align = "center" } = o;
  const segs = parseMarks(str);
  ctx.save();
  ctx.globalAlpha *= clamp(alpha);
  ctx.font = font(size, weight);
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  const total = segs.reduce((a, s) => a + ctx.measureText(s.s).width, 0);
  let cx = align === "center" ? x - total / 2 : x;
  for (const s of segs) {
    if (stroke) {
      ctx.lineJoin = "round";
      ctx.lineWidth = strokeW;
      ctx.strokeStyle = stroke;
      ctx.strokeText(s.s, cx, y);
    }
    ctx.fillStyle = s.hi ? hi : color;
    ctx.fillText(s.s, cx, y);
    cx += ctx.measureText(s.s).width;
  }
  ctx.restore();
  return total;
}

/** Break CJK text into lines no wider than maxW. */
export function wrap(ctx, str, maxW) {
  const lines = [];
  let cur = "";
  for (const ch of str) {
    if (ctx.measureText(cur + ch).width > maxW && cur) {
      lines.push(cur);
      cur = ch;
    } else cur += ch;
  }
  if (cur) lines.push(cur);
  return lines;
}

// ---------------------------------------------------------------- shapes

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Rounded card with optional border. */
export function card(ctx, x, y, w, h, o = {}) {
  const { r = 24, fill = "rgba(12,28,60,0.78)", stroke = "rgba(140,220,255,0.45)", lw = 2, alpha = 1 } = o;
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= clamp(alpha);
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
  ctx.restore();
}

/** Pill-shaped label. */
export function chip(ctx, str, x, y, o = {}) {
  const { size = 34, color = C.white, fill = "rgba(139,233,255,0.16)", stroke = C.ice, alpha = 1, padX = 26, h = size * 1.7 } = o;
  if (alpha <= 0) return 0;
  ctx.save();
  ctx.font = font(size, 700);
  const w = ctx.measureText(str).width + padX * 2;
  const bx = o.align === "left" ? x : x - w / 2;
  card(ctx, bx, y - h / 2, w, h, { r: h / 2, fill, stroke, alpha });
  text(ctx, str, bx + w / 2, y + 1, { size, color, alpha });
  ctx.restore();
  return w;
}

/** A rubber stamp (✓ / ✗ verdicts). */
export function stamp(ctx, str, x, y, t, o = {}) {
  const { color = C.red, size = 44, rot = -0.12 } = o;
  const p = prog(t, 0, 0.35);
  if (p <= 0) return;
  const s = lerp(2.2, 1, ease.out(p));
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.globalAlpha *= p;
  ctx.font = font(size, 900);
  const w = ctx.measureText(str).width + 40;
  ctx.lineWidth = 5;
  ctx.strokeStyle = color;
  roundRect(ctx, -w / 2, -size * 0.8, w, size * 1.6, 12);
  ctx.stroke();
  text(ctx, str, 0, 2, { size, weight: 900, color });
  ctx.restore();
}

export function arrow(ctx, x1, y1, x2, y2, o = {}) {
  const { color = C.white, lw = 5, head = 22, alpha = 1, dash = null } = o;
  if (alpha <= 0) return;
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.globalAlpha *= clamp(alpha);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - Math.cos(a) * head * 0.6, y2 - Math.sin(a) * head * 0.6);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(a - 0.45) * head, y2 - Math.sin(a - 0.45) * head);
  ctx.lineTo(x2 - Math.cos(a + 0.45) * head, y2 - Math.sin(a + 0.45) * head);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Speech bubble with a tail pointing to (tx, ty). */
export function bubble(ctx, str, x, y, tx, ty, o = {}) {
  const { size = 38, alpha = 1, fill = "#ffffff", color = C.ink, maxW = 640 } = o;
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= clamp(alpha);
  ctx.font = font(size, 700);
  const lines = wrap(ctx, str, maxW);
  const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 56;
  const h = lines.length * size * 1.35 + 36;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x - 24, y + h / 2 - 4);
  ctx.lineTo(tx, ty);
  ctx.lineTo(x + 24, y + h / 2 - 4);
  ctx.closePath();
  ctx.fill();
  roundRect(ctx, x - w / 2, y - h / 2, w, h, 28);
  ctx.fill();
  lines.forEach((l, i) =>
    text(ctx, l, x, y - ((lines.length - 1) * size * 1.35) / 2 + i * size * 1.35, { size, color }));
  ctx.restore();
}

// ---------------------------------------------------------------- backdrops

let bgCanvas = null;
function bgLayer() {
  if (bgCanvas) return bgCanvas;
  bgCanvas = document.createElement("canvas");
  bgCanvas.width = W;
  bgCanvas.height = H;
  const g = bgCanvas.getContext("2d");
  const lg = g.createLinearGradient(0, 0, 0, H);
  lg.addColorStop(0, C.bg0);
  lg.addColorStop(1, C.bg1);
  g.fillStyle = lg;
  g.fillRect(0, 0, W, H);
  const blobs = [[300, 200, 600, "#3a1d6e", 0.35], [1600, 300, 700, "#0f4c75", 0.35], [1100, 950, 800, "#1b2a6b", 0.3]];
  for (const [x, y, r, c, a] of blobs) {
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, rgba(c, a));
    rg.addColorStop(1, rgba(c, 0));
    g.fillStyle = rg;
    g.fillRect(0, 0, W, H);
  }
  return bgCanvas;
}

export function drawSpace(ctx, t, o = {}) {
  const { stars = 420, drift = 6, alpha = 1 } = o;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(bgLayer(), 0, 0);
  for (let i = 0; i < stars; i++) {
    const depth = 0.3 + rnd(i, 3) * 0.7;
    const x = (((rnd(i, 1) * W - t * drift * depth) % W) + W) % W;
    const y = rnd(i, 2) * H;
    const tw = 0.55 + 0.45 * Math.sin(t * (1 + rnd(i, 4) * 2.5) + rnd(i, 5) * TAU);
    const s = depth * (rnd(i, 6) > 0.97 ? 3.2 : 1.8);
    ctx.globalAlpha = alpha * tw * depth;
    ctx.fillStyle = rnd(i, 7) > 0.85 ? "#ffd9a8" : rnd(i, 7) > 0.7 ? "#a8d8ff" : "#ffffff";
    ctx.fillRect(x, y, s, s);
  }
  ctx.restore();
}

/** Aurora curtains, drawn additively. */
export function drawAurora(ctx, t, o = {}) {
  const { y = 260, alpha = 1, colors = ["#3dffb0", "#38d6ff", "#b18cff"] } = o;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  colors.forEach((c, k) => {
    for (let x = -40; x < W + 40; x += 12) {
      const yy = y + Math.sin(x * 0.004 + t * 0.6 + k * 1.7) * 70 + Math.sin(x * 0.011 - t * 0.9 + k) * 26;
      const hgt = 220 + 90 * Math.sin(x * 0.007 + t * 0.8 + k * 2.3);
      const a = alpha * (0.07 + 0.05 * Math.sin(x * 0.02 + t * 2 + k * 3)) * (1 - k * 0.2);
      const lg = ctx.createLinearGradient(0, yy - hgt, 0, yy + 40);
      lg.addColorStop(0, rgba(c, 0));
      lg.addColorStop(0.75, rgba(c, a));
      lg.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = lg;
      ctx.fillRect(x, yy - hgt, 12, hgt + 40);
    }
  });
  ctx.restore();
}

/** Snowy Antarctic surface with a horizon at y. */
export function drawIceSurface(ctx, y, t, o = {}) {
  const { alpha = 1 } = o;
  ctx.save();
  ctx.globalAlpha *= alpha;
  const lg = ctx.createLinearGradient(0, y, 0, H);
  lg.addColorStop(0, "#e8f7ff");
  lg.addColorStop(0.05, "#bfe6fa");
  lg.addColorStop(0.35, "#4aa3d6");
  lg.addColorStop(1, "#06213f");
  ctx.fillStyle = lg;
  ctx.beginPath();
  ctx.moveTo(0, y);
  for (let x = 0; x <= W; x += 40) ctx.lineTo(x, y + Math.sin(x * 0.01) * 6 + Math.sin(x * 0.033) * 3);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Vertical cross-section of the ice sheet from y0 (surface) to y1 (bedrock). */
export function drawIceSection(ctx, y0, y1, o = {}) {
  const { alpha = 1, x0 = 0, x1 = W } = o;
  ctx.save();
  ctx.globalAlpha *= alpha;
  const lg = ctx.createLinearGradient(0, y0, 0, y1);
  lg.addColorStop(0, "#d9f2ff");
  lg.addColorStop(0.08, "#6cc0ea");
  lg.addColorStop(0.45, "#1d6aa8");
  lg.addColorStop(1, "#06223f");
  ctx.fillStyle = lg;
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  // faint annual layers
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 2;
  for (let k = 1; k < 30; k++) {
    const yy = y0 + ((y1 - y0) * k) / 30;
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 60) ctx.lineTo(x, yy + Math.sin(x * 0.004 + k) * 4);
    ctx.stroke();
  }
  ctx.fillStyle = "#2a2230";
  ctx.fillRect(x0, y1, x1 - x0, H - y1);
  ctx.fillStyle = "#3b3140";
  for (let i = 0; i < 40; i++) {
    const x = x0 + rnd(i, 50) * (x1 - x0);
    ctx.beginPath();
    ctx.ellipse(x, y1 + 6 + rnd(i, 51) * 50, 20 + rnd(i, 52) * 40, 8, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

/** Depth ruler on the left edge of an ice section. */
export function depthRuler(ctx, x, y0, y1, maxM, marks, o = {}) {
  const { alpha = 1, color = "rgba(255,255,255,0.85)" } = o;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y0);
  ctx.lineTo(x, y1);
  ctx.stroke();
  for (const m of marks) {
    const yy = lerp(y0, y1, m / maxM);
    ctx.beginPath();
    ctx.moveTo(x - 10, yy);
    ctx.lineTo(x + 10, yy);
    ctx.stroke();
    text(ctx, `${m} 米`, x + 20, m === 0 ? yy + 26 : yy, { size: 26, align: "left", color });
  }
  ctx.restore();
}

// ---------------------------------------------------------------- particles

/**
 * A steady stream of neutrinos: `count` particles crossing a band of width `w`
 * centred on (cx, cy), moving along angle `ang` over a travel length `len`.
 */
export function stream(ctx, t, o = {}) {
  const {
    cx = W / 2, cy = H / 2, ang = 2.2, w = 1400, len = 2600, count = 90, speed = 900,
    color = C.ghost, alpha = 1, trail = 70, seed = 0, size = 10, stopAt = null,
  } = o;
  if (alpha <= 0) return;
  const dx = Math.cos(ang), dy = Math.sin(ang);
  const px = -dy, py = dx;
  ctx.save();
  ctx.lineCap = "round";
  for (let i = 0; i < count; i++) {
    const v = rnd(i, seed + 11) - 0.5;
    const sp = speed * (0.75 + rnd(i, seed + 12) * 0.5);
    let u = ((t * sp) / len + rnd(i, seed + 13)) % 1;
    let d = u * len - len / 2;
    if (stopAt && rnd(i, seed + 14) < stopAt.frac && d > stopAt.d) continue;
    const x = cx + dx * d + px * v * w;
    const y = cy + dy * d + py * v * w;
    const a = alpha * Math.min(1, Math.sin(u * Math.PI) * 3);
    const lg = ctx.createLinearGradient(x - dx * trail, y - dy * trail, x, y);
    lg.addColorStop(0, rgba(color, 0));
    lg.addColorStop(1, rgba(color, 0.75 * a));
    ctx.strokeStyle = lg;
    ctx.lineWidth = size * 0.35;
    ctx.beginPath();
    ctx.moveTo(x - dx * trail, y - dy * trail);
    ctx.lineTo(x, y);
    ctx.stroke();
    glow(ctx, x, y, size * 2.2, color, a * 0.9);
  }
  ctx.restore();
}

/** Burst of sparkles centred at (x,y), age `t` seconds. */
export function sparkle(ctx, x, y, t, o = {}) {
  const { n = 14, r = 120, color = C.ice, dur = 0.9, seed = 0 } = o;
  if (t < 0 || t > dur) return;
  const p = t / dur;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rnd(i, seed) * 0.6;
    const d = r * ease.out(p) * (0.6 + rnd(i, seed + 1) * 0.6);
    glow(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, 14 * (1 - p) + 4, color, 1 - p);
  }
  glow(ctx, x, y, r * 0.8 * (1 - p), "#ffffff", (1 - p) * 0.8);
}

// ---------------------------------------------------------------- mascot

/**
 * 小幽, the neutrino ghost. (x, y) is the centre of its head; s ≈ head radius.
 * mood: "happy" | "wow" | "boo" | "wink" | "sad"
 */
export function drawGhost(ctx, x, y, s, t, o = {}) {
  const { alpha = 1, mood = "happy", look = 0, tint = C.ghost, wave = 0, flip = false, hat = null, medal = false } = o;
  if (alpha <= 0 || s <= 0) return;
  const bob = Math.sin(t * 2.4) * s * 0.08;
  glow(ctx, x, y + bob + s * 0.3, s * 2.6, tint, 0.45 * alpha);
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale((flip ? -1 : 1) * s / 50, s / 50);
  ctx.globalAlpha *= clamp(alpha);

  // arms
  const armA = Math.sin(t * 5) * 0.4;
  ctx.fillStyle = "rgba(225,252,255,0.9)";
  ctx.save();
  ctx.translate(-50, 28);
  ctx.rotate(-0.5 - armA * 0.3);
  ctx.beginPath();
  ctx.ellipse(-6, 0, 14, 8, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(50, 28);
  ctx.rotate(0.5 + (wave ? -1.6 + Math.sin(t * 9) * 0.5 : armA * 0.3));
  ctx.beginPath();
  ctx.ellipse(6, 0, 14, 8, 0, 0, TAU);
  ctx.fill();
  ctx.restore();

  // body
  ctx.beginPath();
  ctx.moveTo(-50, 0);
  ctx.arc(0, 0, 50, Math.PI, 0);
  ctx.lineTo(50, 62);
  const bumps = 4;
  for (let k = 0; k <= 24; k++) {
    const u = k / 24;
    const bx = 50 - u * 100;
    const by = 62 + Math.sin(u * bumps * TAU + t * 7) * 7 + Math.abs(Math.sin(u * bumps * Math.PI)) * 6;
    ctx.lineTo(bx, by);
  }
  ctx.closePath();
  const lg = ctx.createLinearGradient(0, -50, 0, 70);
  lg.addColorStop(0, "rgba(255,255,255,0.97)");
  lg.addColorStop(0.55, rgba(tint, 0.9));
  lg.addColorStop(1, rgba(tint, 0.35));
  ctx.fillStyle = lg;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.stroke();

  // face
  const blink = (t + 0.7) % 3.6 < 0.13 ? 0.12 : 1;
  ctx.fillStyle = "#13203a";
  if (mood === "wink") {
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#13203a";
    ctx.beginPath();
    ctx.arc(-17 + look, -2, 7, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.ellipse(-17 + look, -4, 7, 10 * blink, 0, 0, TAU);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.ellipse(17 + look, -4, 7, 10 * blink, 0, 0, TAU);
  ctx.fill();
  if (blink === 1) {
    ctx.fillStyle = "#fff";
    if (mood !== "wink") {
      ctx.beginPath();
      ctx.arc(-15 + look, -8, 2.6, 0, TAU);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(19 + look, -8, 2.6, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(255,126,182,0.55)";
  ctx.beginPath();
  ctx.ellipse(-30 + look, 12, 8, 5, 0, 0, TAU);
  ctx.ellipse(30 + look, 12, 8, 5, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = "#13203a";
  ctx.fillStyle = "#13203a";
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  if (mood === "wow") {
    ctx.ellipse(look, 18, 6, 8, 0, 0, TAU);
    ctx.fill();
  } else if (mood === "boo") {
    ctx.ellipse(look, 18, 11, 12, 0, 0, TAU);
    ctx.fill();
  } else if (mood === "sad") {
    ctx.arc(look, 24, 8, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  } else {
    ctx.arc(look, 10, 9, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  }

  if (hat === "detective") {
    ctx.fillStyle = "#6b4a2b";
    ctx.beginPath();
    ctx.ellipse(0, -44, 46, 10, 0, 0, TAU);
    ctx.fill();
    roundRect(ctx, -28, -78, 56, 36, 10);
    ctx.fill();
  }
  if (medal) {
    ctx.strokeStyle = "#e0485a";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-14, 30);
    ctx.lineTo(0, 46);
    ctx.lineTo(14, 30);
    ctx.stroke();
    ctx.fillStyle = C.gold;
    ctx.beginPath();
    ctx.arc(0, 52, 11, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#b8862d";
    ctx.beginPath();
    ctx.arc(0, 52, 6, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- globe

let LAND = [];
export function setLand(dots) {
  // The grid is equal-angle, so dots crowd together near the poles. The globe
  // thins them by cos(latitude); the flat map (which is stretched the same way) keeps all.
  // A little fixed jitter hides the grid so the land looks less like a fingerprint.
  LAND = dots.map(([lon, lat], i) => {
    const p = ((lat + (rnd(i, 97) - 0.5) * 1.4) * Math.PI) / 180;
    const l = ((lon + (rnd(i, 98) - 0.5) * 1.4) * Math.PI) / 180;
    return [l, p, rnd(i, 99) < Math.cos(p) + 0.08];
  });
}

/** Project lon/lat (degrees) onto an orthographic globe. Returns [x, y, depth]. */
export function project(lon, lat, g) {
  const l = (lon * Math.PI) / 180 - (g.lon0 * Math.PI) / 180;
  const p = (lat * Math.PI) / 180;
  const p0 = (g.lat0 * Math.PI) / 180;
  const x = Math.cos(p) * Math.sin(l), y = Math.sin(p), z = Math.cos(p) * Math.cos(l);
  const y2 = y * Math.cos(p0) - z * Math.sin(p0);
  const z2 = y * Math.sin(p0) + z * Math.cos(p0);
  return [g.cx + g.R * x, g.cy - g.R * y2, z2];
}

export function drawGlobe(ctx, g, o = {}) {
  const { alpha = 1, land = "#7fe3ff", ocean = ["#0f3b6e", "#061733"], atmo = C.ice, dot = null } = o;
  if (alpha <= 0) return;
  const { cx, cy, R } = g;
  ctx.save();
  ctx.globalAlpha *= clamp(alpha);
  glow(ctx, cx, cy, R * 1.35, atmo, 0.35);
  const rg = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
  rg.addColorStop(0, ocean[0]);
  rg.addColorStop(1, ocean[1]);
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, TAU);
  ctx.fill();
  const l0 = (g.lon0 * Math.PI) / 180, p0 = (g.lat0 * Math.PI) / 180;
  const cp0 = Math.cos(p0), sp0 = Math.sin(p0);
  const ds = dot ?? Math.max(1.6, R / 120);
  const iceLat = (-60 * Math.PI) / 180;
  for (let i = 0; i < LAND.length; i++) {
    const [lon, lat, keep] = LAND[i];
    if (!keep) continue;
    const l = lon - l0;
    const cl = Math.cos(lat);
    const x = cl * Math.sin(l), y = Math.sin(lat), z = cl * Math.cos(l);
    const z2 = y * sp0 + z * cp0;
    if (z2 <= 0.02) continue;
    const y2 = y * cp0 - z * sp0;
    ctx.globalAlpha = alpha * (0.35 + 0.65 * z2);
    ctx.fillStyle = lat < iceLat ? "#e8f6ff" : land;
    ctx.fillRect(cx + R * x - ds / 2, cy - R * y2 - ds / 2, ds, ds);
  }
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = rgba(atmo, 0.6);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

/** Flat equirectangular dot map inside the box (x, y, w, h). */
export function drawFlatMap(ctx, x, y, w, h, o = {}) {
  const { alpha = 1, color = "#5fcff5" } = o;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = color;
  const s = Math.max(2, w / 260);
  for (const [lon, lat] of LAND) {
    if (lat < (-62 * Math.PI) / 180) continue;
    const px = x + ((lon / Math.PI + 1) / 2) * w;
    const py = y + ((1 - lat / (Math.PI / 2)) / 2) * h;
    ctx.fillRect(px - s / 2, py - s / 2, s, s);
  }
  ctx.restore();
}

export function mapXY(lon, lat, x, y, w, h) {
  return [x + ((lon / 180 + 1) / 2) * w, y + ((1 - lat / 90) / 2) * h];
}

// ---------------------------------------------------------------- icons

/** Isometric cube centred at (cx, cy) with edge length e (px). */
export function isoCube(ctx, cx, cy, e, o = {}) {
  const { alpha = 1, color = C.ice, fill = 0.18, lw = 3, glowA = 0.4 } = o;
  if (alpha <= 0 || e <= 0) return;
  const c30 = Math.cos(Math.PI / 6) * e, s30 = Math.sin(Math.PI / 6) * e;
  // top face corners
  const top = [[cx, cy - e / 2 - s30], [cx + c30, cy - e / 2], [cx, cy - e / 2 + s30], [cx - c30, cy - e / 2]];
  const bot = top.map(([x, y]) => [x, y + e]);
  ctx.save();
  ctx.globalAlpha *= clamp(alpha);
  glow(ctx, cx, cy, e * 1.4, color, glowA);
  const faces = [
    [top[0], top[1], top[2], top[3], 1.0],
    [top[3], top[2], bot[2], bot[3], 0.6],
    [top[2], top[1], bot[1], bot[2], 0.8],
  ];
  for (const [a, b, c, d, k] of faces) {
    ctx.beginPath();
    ctx.moveTo(...a);
    ctx.lineTo(...b);
    ctx.lineTo(...c);
    ctx.lineTo(...d);
    ctx.closePath();
    ctx.fillStyle = rgba(color, fill * k);
    ctx.fill();
    ctx.strokeStyle = rgba(color, 0.95);
    ctx.lineWidth = lw;
    ctx.stroke();
  }
  ctx.restore();
  return { top, bot };
}

/** Optical module: glass sphere with a photomultiplier inside. */
export function drawDOM(ctx, x, y, r, o = {}) {
  const { lit = 0, color = C.ice, alpha = 1 } = o;
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (lit > 0) glow(ctx, x, y, r * (2 + lit * 3), color, lit);
  const rg = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
  rg.addColorStop(0, "rgba(255,255,255,0.95)");
  rg.addColorStop(0.5, "rgba(170,210,235,0.75)");
  rg.addColorStop(1, "rgba(60,90,120,0.85)");
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/** Black hole with accretion disk and twin jets. */
export function drawBlackHole(ctx, x, y, r, t, o = {}) {
  const { alpha = 1, jet = 1, tilt = 0.32, jetAng = -Math.PI / 2 } = o;
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (jet > 0) {
    for (const s of [1, -1]) {
      const ang = jetAng + (s < 0 ? Math.PI : 0);
      const L = r * 6 * jet;
      for (let k = 0; k < 18; k++) {
        const u = ((k / 18 + t * 0.6) % 1);
        glow(ctx, x + Math.cos(ang) * L * u, y + Math.sin(ang) * L * u, r * (0.25 + u * 0.6), "#8fd3ff", (1 - u) * 0.7 * jet);
      }
    }
  }
  glow(ctx, x, y, r * 3.2, C.orange, 0.5);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, tilt);
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    ctx.arc(0, 0, r * (1.5 + k * 0.45), 0, TAU);
    ctx.lineWidth = r * 0.35;
    ctx.strokeStyle = rgba(k === 0 ? "#fff1c1" : k === 1 ? C.orange : "#ff5a36", 0.75 - k * 0.2);
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255,220,160,0.8)";
  ctx.stroke();
  // front half of disk
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, tilt);
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.7, 0.05, Math.PI - 0.05);
  ctx.lineWidth = r * 0.5;
  ctx.strokeStyle = rgba("#ffd28a", 0.85);
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}

/** Dusty cloud blob. */
export function drawDust(ctx, x, y, r, t, o = {}) {
  const { alpha = 1, color = "#8a6a4a", n = 22, seed = 0 } = o;
  ctx.save();
  ctx.globalAlpha *= alpha;
  for (let i = 0; i < n; i++) {
    const a = rnd(i, seed) * TAU;
    const d = rnd(i, seed + 1) * r * 0.7;
    const rr = r * (0.3 + rnd(i, seed + 2) * 0.4);
    const px = x + Math.cos(a + t * 0.1) * d, py = y + Math.sin(a + t * 0.1) * d * 0.7;
    const rg = ctx.createRadialGradient(px, py, 0, px, py, rr);
    rg.addColorStop(0, rgba(color, 0.35));
    rg.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(px, py, rr, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

/** Spiral galaxy made of dots. */
export function drawGalaxy(ctx, x, y, r, t, o = {}) {
  const { alpha = 1, tilt = 0.45, rot = 0, color = "#cfe3ff", core = "#fff3d6", n = 900, seed = 0 } = o;
  ctx.save();
  ctx.globalAlpha *= alpha;
  for (let i = 0; i < n; i++) {
    const arm = i % 2;
    const u = Math.pow(rnd(i, seed), 0.7);
    const ang = u * 7 + arm * Math.PI + rot + t * 0.05 + (rnd(i, seed + 1) - 0.5) * 0.7;
    const d = u * r;
    const px = Math.cos(ang) * d, py = Math.sin(ang) * d;
    ctx.globalAlpha = alpha * (1 - u * 0.6) * 0.8;
    ctx.fillStyle = rnd(i, seed + 2) > 0.8 ? "#ffd2f0" : color;
    const s = 1.5 + rnd(i, seed + 3) * 2;
    ctx.fillRect(x + px, y + py * tilt, s, s);
  }
  ctx.globalAlpha = alpha;
  glow(ctx, x, y, r * 0.55, core, 0.9);
  ctx.restore();
}
