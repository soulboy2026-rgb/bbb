// Scenes 7–12: building IceCube, how it detects, discoveries, why it matters, future, outro.

import {
  W, H, C, FONT_T, TAU, clamp, lerp, ease, prog, rnd, rgba, glow, text, popText, card, chip, stamp, arrow,
  bubble, drawIceSection, depthRuler, stream, sparkle, drawGhost, drawGlobe, project, isoCube, drawBlackHole,
  drawDust, drawGalaxy, drawFlatMap, mapXY, drawDOM, roundRect,
} from "./core.js";
import {
  mark, digits, fmtInt, drawHand, drawMedal, drawSkyscraper, drawICL, drawDrill, drawArray, camera, timeColor,
  drawNucleus, drawJet, drawCone, yearBadge, drawBalloon, drawSatellite, drawObservatory,
} from "./props.js";
import { show, dur } from "./scenes-a.js";

function shake(ctx, t, amt) {
  if (amt > 0) ctx.translate(Math.sin(t * 90) * amt, Math.cos(t * 77) * amt);
}

// ------------------------------------------------------------------ 7 build

export function build(ctx, S) {
  const t = S.t;

  // 0: "that's crazy"
  const a0 = show(S, 0, 1);
  if (a0 > 0) {
    isoCube(ctx, 960, 560, 220, { alpha: a0 });
    text(ctx, "南极 · 1 立方公里", 960, 830, { size: 36, color: C.ice, alpha: a0 });
    bubble(ctx, "在南极钻冰？？", 470, 330, 760, 470, { alpha: a0 * S.p(0, 0.3, 0.2), size: 40 });
    bubble(ctx, "一立方公里？！", 1470, 300, 1170, 450, { alpha: a0 * S.p(0, 0.3, 0.7), size: 40 });
    bubble(ctx, "疯了吧！", 1500, 700, 1180, 640, { alpha: a0 * S.p(0, 0.3, 1.2), size: 40 });
  }

  // 1–2: AMANDA, then deeper
  const a1 = show(S, 1, 3);
  if (a1 > 0) {
    const y0 = 170, y1 = 930, depth = (m) => lerp(y0, y1, m / 2800);
    ctx.save();
    shake(ctx, t, (1 - prog(S.at(2), 0, 0.8)) * (S.at(2) > 0 ? 10 : 0));
    drawIceSection(ctx, y0, y1, { alpha: a1 });
    ctx.save();
    ctx.globalAlpha = a1;
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 240; i++) {
      const m = Math.pow(rnd(i, 60), 1.8) * 1400;
      ctx.beginPath();
      ctx.arc(260 + rnd(i, 62) * 1600, depth(m) + 6, 2 + (1 - m / 1400) * 6 * rnd(i, 61), 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    depthRuler(ctx, 120, y0, y1, 2800, [0, 1000, 2000], { alpha: a1 });
    const bottom = lerp(1000, 2000, ease.inOut(prog(S.at(2), 0.4, 1.6)));
    for (let k = 0; k < 5; k++) {
      const x = 760 + k * 100;
      ctx.save();
      ctx.globalAlpha = a1;
      ctx.strokeStyle = "rgba(230,240,255,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y0);
      ctx.lineTo(x, depth(bottom));
      ctx.stroke();
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.moveTo(x - 10, depth(bottom));
      ctx.lineTo(x + 10, depth(bottom));
      ctx.lineTo(x, depth(bottom) + 20);
      ctx.fill();
      ctx.restore();
      for (let j = 0; j < 5; j++) drawDOM(ctx, x, depth(bottom - 200 + j * 45), 9, { alpha: a1 });
    }
    // scattered light in bubbly ice
    const zp = prog(S.at(1), 1.0, 3.0) * (1 - S.raw(2, 0.4));
    if (zp > 0) {
      ctx.save();
      ctx.globalAlpha = a1 * (1 - S.raw(2, 0.4));
      ctx.strokeStyle = C.yellow;
      ctx.lineWidth = 4;
      ctx.shadowColor = C.yellow;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      let x = 1060, y = depth(900);
      ctx.moveTo(x, y);
      const n = Math.floor(16 * zp);
      for (let k = 0; k < n; k++) {
        const a = rnd(k, 80) * TAU;
        x += Math.cos(a) * 55;
        y += Math.sin(a) * 40;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }
    chip(ctx, "试验探测器 AMANDA · 1990 年代", 960, 118, { alpha: a1, size: 32 });
    if (S.at(1) > 3.6 && S.at(2) < 0.4) {
      stamp(ctx, "气泡太多！", 1480, depth(850), S.at(1) - 3.6, { color: C.red });
    }
    // deep, clear: a straight ray
    const sp = ease.out(prog(S.at(2), 1.6, 1.2));
    if (sp > 0) {
      const y = depth(1900);
      ctx.save();
      ctx.globalAlpha = a1;
      ctx.strokeStyle = C.yellow;
      ctx.lineWidth = 6;
      ctx.shadowColor = C.yellow;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(1260, y);
      ctx.lineTo(lerp(1260, 1850, sp), y);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    popText(ctx, "钻得更深！", 1420, depth(1450), S.at(2) - 0.1, { size: 104, shadow: C.orange, color: "#fff4e0" });
  }

  // 3–5: building IceCube
  const a3 = show(S, 3, 6);
  if (a3 > 0) {
    const y0 = 290, y1 = 900, depth = (m) => lerp(y0, y1, m / 2600);
    drawIceSection(ctx, y0, y1, { alpha: a3 });
    ctx.save();
    ctx.globalAlpha = a3;
    ctx.fillStyle = "#f4fbff";
    ctx.fillRect(0, y0 - 12, W, 12);
    ctx.restore();
    depthRuler(ctx, 120, y0, y1, 2600, [0, 1450, 2450], { alpha: a3 });
    const HOLES = 13, hx = (k) => 330 + k * 82;
    const holeT = (k) => 0.3 + k * 0.4;
    for (let k = 0; k < HOLES; k++) {
      const hp = ease.out(prog(S.at(3), holeT(k), 0.5));
      if (hp <= 0) continue;
      ctx.save();
      ctx.globalAlpha = a3;
      ctx.strokeStyle = "rgba(220,240,255,0.8)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(hx(k), y0);
      ctx.lineTo(hx(k), depth(2500 * hp));
      ctx.stroke();
      ctx.restore();
      // modules lowered like a string of pearls
      const lp = ease.inOut(prog(S.at(4), 0.2 + k * 0.12, 1.6));
      for (let j = 0; j < 10; j++) {
        const target = 1450 + (j * 1000) / 9;
        const m = target - (1 - lp) * 2450;
        if (m > 0) drawDOM(ctx, hx(k), depth(m), 7, { alpha: a3 });
      }
    }
    const k = Math.min(HOLES - 1, Math.max(0, Math.floor((S.at(3) - 0.3) / 0.4)));
    drawDrill(ctx, hx(k), y0 - 10, 0.9, t, { alpha: a3 * (1 - S.raw(4, 0.6)) });
    drawICL(ctx, 1420, y0 - 10, 1.0, { alpha: a3 });
    const holes = Math.floor(86 * prog(S.at(3), 0.3, HOLES * 0.4 + 0.3));
    chip(ctx, `深洞：${holes} / 86`, 520, 190, { alpha: a3 * S.p(3, 0.4) * (1 - S.raw(5, 0.4)), size: 36 });
    const doms = Math.floor(5160 * prog(S.at(4), 0.2, 3.0));
    chip(ctx, `光学眼睛：${fmtInt(doms)} / 5,160`, 960, 190, { alpha: a3 * S.p(4, 0.4) * (1 - S.raw(5, 0.4)), size: 36 });

    // three Burj Khalifas stacked ≈ 2.5 km
    const ba = a3 * S.p(3, 0.5, 2.0) * (1 - S.raw(4, 0.5));
    if (ba > 0) {
      const hpx = depth(828) - depth(0);
      for (let s = 0; s < 3; s++) drawSkyscraper(ctx, 1700, depth(2484 - 828 * s), hpx, { alpha: ba, color: s % 2 ? "#e4ecf7" : "#c2d0e4" });
      chip(ctx, "≈ 3 座哈利法塔", 1730, y0 - 60, { alpha: ba, size: 32 });
    }
    // callout: an optical module
    const ca = a3 * S.p(4, 0.5, 1.8) * (1 - S.raw(5, 0.5));
    if (ca > 0) {
      card(ctx, 1450, 330, 420, 500, { alpha: ca, fill: "rgba(8,24,52,0.92)" });
      drawDOM(ctx, 1660, 480, 100, { alpha: ca, lit: 0.25 + 0.15 * Math.sin(t * 4) });
      ctx.save();
      ctx.globalAlpha = ca;
      ctx.fillStyle = "rgba(30,40,60,0.85)";
      ctx.beginPath();
      ctx.arc(1660, 500, 72, Math.PI, 0);
      ctx.fill();
      ctx.restore();
      text(ctx, "数字光学模块", 1660, 640, { size: 40, alpha: ca });
      text(ctx, "≈ 篮球大小", 1660, 700, { size: 32, color: C.dim, alpha: ca });
      text(ctx, "内藏超灵敏的光探测器", 1660, 752, { size: 30, color: C.dim, alpha: ca });
    }
    // 5: seven summers
    const sa = a3 * S.p(5, 0.4);
    if (sa > 0) {
      const years = ["04/05", "05/06", "06/07", "07/08", "08/09", "09/10", "10/11"];
      years.forEach((y, i) => {
        const on = prog(S.at(5), 0.3 + i * 0.5, 0.3);
        const x = 360 + i * 140;
        glow(ctx, x, 165, 60, C.yellow, sa * (0.2 + 0.8 * on));
        ctx.save();
        ctx.globalAlpha = sa;
        ctx.fillStyle = on > 0 ? C.yellow : "rgba(255,224,102,0.3)";
        ctx.beginPath();
        ctx.arc(x, 165, 24, 0, TAU);
        ctx.fill();
        ctx.restore();
        text(ctx, y, x, 222, { size: 24, color: C.white, alpha: sa });
      });
      chip(ctx, "南极的夏天也有零下 30℃", 1620, 360, { alpha: sa * S.p(5, 0.4, 1.0), size: 32 });
      chip(ctx, "2010 年 12 月 完工", 1620, 450, { alpha: sa * S.p(5, 0.4, 3.8), size: 36, stroke: C.green, fill: rgba(C.green, 0.15) });
    }
  }

  // 6: a telescope that looks down
  const a6 = S.p(6, 0.6);
  if (a6 > 0) {
    const cam = camera(900, 560, 0.5, 0.5 + t * 0.12, 0.3);
    drawArray(ctx, cam, { alpha: a6, reveal: S.raw(6, 2.2) });
    chip(ctx, "冰立方：5160 只“眼睛”，藏在 1 立方公里的冰里", 960, 175, { alpha: a6, size: 36 });
    const da = a6 * S.p(6, 0.4, 3.4);
    arrow(ctx, 1640, 380, 1640, 800, { color: C.yellow, lw: 8, head: 34, alpha: da });
    text(ctx, "朝脚下看", 1640, 330, { size: 44, color: C.yellow, alpha: da });
  }
}

// ------------------------------------------------------------------ 8 detect

function iceBackdrop(ctx, a) {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  const lg = ctx.createLinearGradient(0, 0, 0, H);
  lg.addColorStop(0, "#0b3f6e");
  lg.addColorStop(1, "#041a35");
  ctx.fillStyle = lg;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

const TRACK_A = [-950, 620, -320], TRACK_B = [950, -620, 360];

function trackLit(u) {
  const ab = TRACK_B.map((v, i) => v - TRACK_A[i]);
  const ab2 = ab.reduce((s, v) => s + v * v, 0);
  return (x, y, z) => {
    const ap = [x - TRACK_A[0], y - TRACK_A[1], z - TRACK_A[2]];
    const s = (ap[0] * ab[0] + ap[1] * ab[1] + ap[2] * ab[2]) / ab2;
    const q = ab.map((v, i) => TRACK_A[i] + v * s);
    const d = Math.hypot(x - q[0], y - q[1], z - q[2]);
    if (d > 300 || u < s + d / 4000) return null;
    return { a: Math.exp(-d / 120), color: timeColor((s - 0.15) / 0.7) };
  };
}

export function detect(ctx, S) {
  const t = S.t;

  // 0: detective ghost
  const a0 = show(S, 0, 1);
  if (a0 > 0) {
    drawGhost(ctx, 900, 500, 130, t, { hat: "detective", alpha: a0, look: 6 });
    ctx.save();
    ctx.globalAlpha = a0;
    ctx.strokeStyle = C.gold;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(1160, 560, 80, 0, TAU);
    ctx.moveTo(1216, 616);
    ctx.lineTo(1290, 690);
    ctx.stroke();
    ctx.restore();
    glow(ctx, 1160, 560, 80, C.ice, a0 * 0.4);
  }

  iceBackdrop(ctx, S.p(1, 0.6) * (1 - S.raw(5, 0.5)));

  // 1: a collision in the ice
  const a1 = show(S, 1, 2);
  if (a1 > 0) {
    const hitT = 1.7;
    const at = S.at(1);
    const nx = 900, ny = 560;
    drawNucleus(ctx, nx, ny, 70, t, { alpha: a1, burst: ease.out(prog(at, hitT, 0.8)) });
    if (at < hitT) {
      const u = ease.in(prog(at, 0.1, hitT - 0.1));
      drawGhost(ctx, lerp(260, nx - 40, u), lerp(900, ny + 30, u), 44, t, { alpha: a1 });
      text(ctx, "原子核", nx, ny - 110, { size: 34, alpha: a1 });
      text(ctx, "中微子", lerp(260, nx - 40, u), lerp(900, ny + 30, u) + 80, { size: 30, color: C.ice, alpha: a1 });
    }
    sparkle(ctx, nx, ny, at - hitT, { r: 220, color: "#ffffff", dur: 1.0 });
    if (at > hitT) {
      const d = (at - hitT) * 420;
      const mx = nx + d * 0.83, my = ny - d * 0.56;
      glow(ctx, mx, my, 44, C.orange, a1);
      chip(ctx, "μ子（带电）", mx, my - 70, { alpha: a1, size: 30, stroke: C.orange, fill: rgba(C.orange, 0.16) });
    }
  }

  // 2: faster than light in ice
  const a2 = show(S, 2, 3);
  if (a2 > 0) {
    const go = S.at(2) - 0.5;
    const L = 1320;
    const xl = 300 + Math.min(L, Math.max(0, go) * (L / 3.0));
    const xm = 300 + Math.min(L, Math.max(0, go) * (L / 2.28));
    ctx.save();
    ctx.globalAlpha = a2;
    ctx.setLineDash([14, 12]);
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(1620, 340);
    ctx.lineTo(1620, 720);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.fillRect(280, 400, 1360, 60);
    ctx.fillRect(280, 600, 1360, 60);
    ctx.restore();
    text(ctx, "冰里的光：约 0.75 倍真空光速", 300, 370, { size: 34, align: "left", color: C.yellow, alpha: a2 });
    text(ctx, "μ子：几乎就是真空光速", 300, 570, { size: 34, align: "left", color: C.orange, alpha: a2 });
    glow(ctx, xl, 430, 40, C.yellow, a2);
    glow(ctx, xm, 630, 44, C.orange, a2);
    text(ctx, "μ", xm, 630, { size: 34, weight: 900, color: "#fff", alpha: a2 });
    if (go > 2.3) stamp(ctx, "μ子更快！", 1500, 800, go - 2.3, { color: C.orange, rot: -0.06 });
  }

  // 3: sonic boom vs. Cherenkov light
  const a3 = show(S, 3, 4);
  if (a3 > 0) {
    const age = (S.at(3) + 0.6) % 3.0;
    ctx.save();
    ctx.globalAlpha = a3;
    ctx.beginPath();
    ctx.rect(0, 0, 958, H);
    ctx.clip();
    drawCone(ctx, 100, 540, 260, 130, age, { color: "#c8d2e2", n: 14, every: 0.18 });
    drawJet(ctx, 100 + 260 * age, 540, 1.3);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = a3;
    ctx.beginPath();
    ctx.rect(962, 0, 958, H);
    ctx.clip();
    drawCone(ctx, 1040, 540, 260, 260 * 0.763, age, { color: "#4fb8ff", n: 14, every: 0.18, glowFront: true });
    glow(ctx, 1040 + 260 * age, 540, 40, C.orange, 1);
    text(ctx, "μ", 1040 + 260 * age, 540, { size: 30, weight: 900, color: "#fff" });
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = a3 * 0.5;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(958, 120, 4, 760);
    ctx.restore();
    chip(ctx, "飞机比声音快 → 音爆", 480, 220, { alpha: a3, size: 36 });
    chip(ctx, "μ子比冰里的光快 → 光学音爆", 1440, 220, { alpha: a3, size: 36, stroke: "#4fb8ff", fill: "rgba(79,184,255,0.16)" });
    text(ctx, "切伦科夫辐射", 1440, 830, { size: 54, family: FONT_T, weight: 400, color: "#7fd0ff", alpha: a3 * S.p(3, 0.5, 3.2), shadow: "#4fb8ff" });
  }

  // 4: the event display
  const a4 = show(S, 4, 5);
  if (a4 > 0) {
    const u = prog(S.at(4), 0.3, 3.6) * 1.15;
    const cam = camera(960, 540, 0.48, 0.55 + t * 0.05, 0.3);
    drawArray(ctx, cam, { alpha: a4, lit: trackLit(u), per: 16 });
    const A = cam(...TRACK_A), B = cam(...TRACK_B);
    const hu = clamp(u);
    const hx = lerp(A[0], B[0], hu), hy = lerp(A[1], B[1], hu);
    ctx.save();
    ctx.globalAlpha = a4 * 0.85;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(A[0], A[1]);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    ctx.restore();
    if (u < 1) glow(ctx, hx, hy, 40, C.orange, a4);
    text(ctx, "颜色 = 光到达的先后", 70, 170, { size: 32, align: "left", alpha: a4 });
    text(ctx, "大小 = 光的强弱", 70, 225, { size: 32, align: "left", alpha: a4 });
    const ra = a4 * S.p(4, 0.5, 4.6);
    if (ra > 0) {
      arrow(ctx, lerp(A[0], B[0], 0.25), lerp(A[1], B[1], 0.25) - 70, lerp(A[0], B[0], 0.75), lerp(A[1], B[1], 0.75) - 70, { color: C.yellow, lw: 7, head: 30, alpha: ra });
      chip(ctx, "反推出：方向 + 能量", 1540, 820, { alpha: ra, size: 36, stroke: C.yellow, fill: rgba(C.yellow, 0.15) });
    }
  }

  // 5: the Earth as a filter (South Pole at the top)
  const a5 = S.p(5, 0.6);
  if (a5 > 0) {
    ctx.save();
    ctx.translate(960, 600);
    ctx.rotate(Math.PI);
    drawGlobe(ctx, { cx: 0, cy: 0, R: 300, lon0: t * 12, lat0: 0 }, { alpha: a5 });
    ctx.restore();
    stream(ctx, t, { cx: 960, cy: 620, ang: -Math.PI / 2, w: 260, len: 1100, count: 30, speed: 520, seed: 12, alpha: a5 * S.p(5, 0.5, 2.2), trail: 80 });
    glow(ctx, 960, 300, 70, C.ice, a5);
    chip(ctx, "冰立方（南极）", 1190, 300, { alpha: a5, size: 32 });
    // downgoing atmospheric muons
    for (let i = 0; i < 9; i++) {
      const u = ((t * 0.7 + rnd(i, 30)) % 1);
      const x = 780 + rnd(i, 31) * 360, y = lerp(90, 270, u);
      glow(ctx, x, y, 16, C.red, a5 * (1 - u) * S.p(5, 0.4, 0.4));
    }
    chip(ctx, "头顶来的：大气μ子，过滤掉", 470, 200, { alpha: a5 * S.p(5, 0.4, 0.6), size: 32, stroke: C.red, fill: rgba(C.red, 0.14) });
    mark(ctx, 220, 200, 34, false, { alpha: a5 * S.p(5, 0.4, 0.6) });
    chip(ctx, "脚下来的：只可能是中微子", 1440, 860, { alpha: a5 * S.p(5, 0.4, 2.6), size: 32 });
    mark(ctx, 1180, 860, 34, true, { alpha: a5 * S.p(5, 0.4, 2.6) });
    text(ctx, "地球 = 天然过滤网", 400, 650, { size: 52, family: FONT_T, weight: 400, color: C.yellow, alpha: a5 * S.p(5, 0.5, 1.0) });
  }
}

// ------------------------------------------------------------------ 9 discoveries

function cascade(R, center = [0, 0, 0]) {
  return (x, y, z) => {
    const r = Math.hypot(x - center[0], y - center[1], z - center[2]);
    if (r > R) return null;
    return { a: Math.exp(-r / 240) * 0.9, color: timeColor(r / 520) };
  };
}

export function discover(ctx, S) {
  const t = S.t;

  // 0
  const a0 = show(S, 0, 1);
  if (a0 > 0) {
    drawArray(ctx, camera(960, 560, 0.45, t * 0.1, 0.3), { alpha: a0 });
    for (let k = 0; k < 3; k++) {
      const a = t * 0.5 + (k * TAU) / 3;
      text(ctx, "？", 960 + Math.cos(a) * 520, 520 + Math.sin(a) * 220, { size: 90, family: FONT_T, weight: 400, color: C.yellow, alpha: a0 });
    }
  }

  // 1–2: Bert & Ernie
  const a1 = show(S, 1, 3);
  if (a1 > 0) {
    yearBadge(ctx, "2013", 200, 170, a1 * S.p(1, 0.5));
    [[500, "伯特 Bert"], [1020, "厄尼 Ernie"]].forEach(([cx, name], k) => {
      const R = 520 * ease.out(prog(S.at(1), 0.4 + k * 0.5, 1.6));
      const cam = camera(cx, 520, 0.3, 0.4 + k + t * 0.1, 0.3);
      drawArray(ctx, cam, { alpha: a1, lit: cascade(R), per: 12, frame: false, domR: 2.6 });
      const ea = a1 * S.p(2, 0.4, 0.3 + k * 0.4);
      if (ea > 0) {
        const blink = (t + k) % 3 < 0.12 ? 0.15 : 1;
        ctx.save();
        ctx.globalAlpha = ea;
        ctx.fillStyle = "#101a2e";
        ctx.beginPath();
        ctx.ellipse(cx - 26, 505, 11, 16 * blink, 0, 0, TAU);
        ctx.ellipse(cx + 26, 505, 11, 16 * blink, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = "#101a2e";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(cx, 530, 22, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
        ctx.restore();
        chip(ctx, name, cx, 780, { alpha: ea, size: 40, stroke: C.yellow, fill: rgba(C.yellow, 0.15) });
      }
    });
    const ba = a1 * S.p(1, 0.5, 2.6);
    if (ba > 0) {
      card(ctx, 1290, 250, 580, 470, { alpha: ba });
      text(ctx, "能量对比", 1580, 300, { size: 36, color: C.gold, alpha: ba });
      const g = ease.out(prog(S.at(1), 3.0, 1.2));
      ctx.save();
      ctx.globalAlpha = ba;
      ctx.fillStyle = C.orange;
      ctx.fillRect(1330, 400, Math.max(5, 500 * 0.0068 * g), 40);
      ctx.fillStyle = C.ice;
      ctx.fillRect(1330, 540, 500 * g, 40);
      ctx.restore();
      text(ctx, "对撞机里的质子 ≈ 7 TeV", 1330, 375, { size: 28, align: "left", alpha: ba });
      text(ctx, "伯特 / 厄尼 ≈ 1000 TeV", 1330, 515, { size: 28, align: "left", alpha: ba });
      text(ctx, "（1 千万亿电子伏特）", 1330, 610, { size: 26, align: "left", color: C.dim, alpha: ba });
      text(ctx, "× 150", 1580, 670, { size: 60, weight: 900, color: C.gold, alpha: ba * prog(S.at(1), 4.2, 0.4) });
    }
  }

  // 3: from beyond the solar system
  const a3 = show(S, 3, 4);
  if (a3 > 0) {
    const sx = 700, sy = 520;
    stream(ctx, t, { cx: 1250, cy: sy, ang: Math.PI + 0.05, w: 700, len: 1500, count: 40, speed: 700, seed: 21, alpha: a3 });
    glow(ctx, sx, sy, 90, C.yellow, a3);
    ctx.save();
    ctx.globalAlpha = a3;
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 2;
    for (const r of [60, 95, 135, 180]) {
      ctx.beginPath();
      ctx.ellipse(sx, sy, r, r * 0.45, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = rgba(C.ice, 0.7);
    ctx.beginPath();
    ctx.ellipse(sx, sy, 250, 250 * 0.5, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
    text(ctx, "太阳系", sx, sy - 160, { size: 32, color: C.ice, alpha: a3 });
    chip(ctx, "来自太阳系之外的遥远宇宙！", 1340, 230, { alpha: a3 * S.p(3, 0.4, 0.5), size: 38, stroke: C.yellow, fill: rgba(C.yellow, 0.15) });
    const pa = a3 * S.p(3, 0.4, 3.4);
    text(ctx, "此前人类只抓到过：", 250, 760, { size: 32, align: "left", color: C.dim, alpha: pa });
    chip(ctx, "太阳的中微子", 620, 760, { alpha: pa, size: 30, align: "left" });
    chip(ctx, "超新星 1987A", 870, 760, { alpha: a3 * S.p(3, 0.4, 4.4), size: 30, align: "left" });
  }

  // 4: the 2017 alert
  const a4 = show(S, 4, 5);
  if (a4 > 0) {
    const g = { cx: 960, cy: 600, R: 240, lon0: -60 + t * 8, lat0: -25 };
    drawGlobe(ctx, g, { alpha: a4 });
    const [px, py] = project(0, -90, g);
    for (let k = 0; k < 3; k++) {
      const u = ((S.at(4) * 0.8 + k / 3) % 1);
      ctx.save();
      ctx.globalAlpha = a4 * (1 - u);
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(px, py, 20 + u * 140, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    for (let k = 0; k < 8; k++) {
      const ang = -Math.PI * 0.95 + (k / 7) * Math.PI * 0.9;
      const ox = 960 + Math.cos(ang) * 470, oy = 600 + Math.sin(ang) * 330;
      const lit = prog(S.at(4), 2.2 + k * 0.25, 0.3);
      if (lit > 0) arrow(ctx, px, py, lerp(px, ox, lit), lerp(py, oy, lit) + 30, { color: rgba(C.red, 0.7), lw: 3, head: 14, alpha: a4, dash: [8, 8] });
      drawObservatory(ctx, ox, oy, 1.1, { alpha: a4, lit });
    }
    const blink = 0.75 + 0.25 * Math.sin(t * 10);
    card(ctx, 410, 135, 1100, 80, { alpha: a4 * blink, fill: "rgba(200,30,50,0.85)", stroke: "#ff9aa5", r: 16 });
    text(ctx, "警报！IceCube-170922A · 2017 年 9 月 22 日", 960, 176, { size: 38, weight: 900, alpha: a4 });
    chip(ctx, "从探测到发出警报：不到 1 分钟", 1600, 855, { alpha: a4 * S.p(4, 0.4, 3.0), size: 28, stroke: C.yellow, fill: rgba(C.yellow, 0.14) });
  }

  // 5: Fermi looks, finds a flaring blazar
  const a5 = show(S, 5, 6);
  if (a5 > 0) {
    drawSatellite(ctx, 360, 330, 0.85, t, { alpha: a5 });
    text(ctx, "费米伽马射线太空望远镜", 360, 450, { size: 30, alpha: a5 });
    const bp = ease.out(prog(S.at(5), 0.6, 1.4));
    ctx.save();
    ctx.globalAlpha = a5 * 0.35 * bp;
    const lg = ctx.createLinearGradient(420, 0, 1400, 0);
    lg.addColorStop(0, "rgba(255,224,102,0.9)");
    lg.addColorStop(1, "rgba(255,224,102,0)");
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(440, 340);
    ctx.lineTo(lerp(440, 1400, bp), 340 + 220 * bp - 120 * bp);
    ctx.lineTo(lerp(440, 1400, bp), 340 + 220 * bp + 120 * bp);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    const fa = a5 * prog(S.at(5), 1.6, 0.6);
    drawGalaxy(ctx, 1400, 560, 150, t, { alpha: fa, tilt: 0.5, n: 500, seed: 3 });
    glow(ctx, 1400, 560, 120 + 60 * Math.sin(t * 7), "#c9b8ff", fa);
    chip(ctx, "TXS 0506+056 · 近 40 亿光年外", 1400, 780, { alpha: fa, size: 32 });
    text(ctx, "耀变体", 1400, 360, { size: 56, family: FONT_T, weight: 400, color: "#d9ccff", alpha: fa * S.p(5, 0.4, 3.4) });
  }

  // 6: a searchlight aimed at Earth
  const a6 = show(S, 6, 7);
  if (a6 > 0) {
    const ex = 1640, ey = 820;
    const ang = Math.atan2(ey - 470, ex - 820);
    ctx.save();
    ctx.globalAlpha = a6 * 0.3;
    const lg = ctx.createLinearGradient(820, 470, ex, ey);
    lg.addColorStop(0, "rgba(160,220,255,0.9)");
    lg.addColorStop(1, "rgba(160,220,255,0.1)");
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(820, 470);
    ctx.lineTo(ex + Math.cos(ang + Math.PI / 2) * 160, ey + Math.sin(ang + Math.PI / 2) * 160);
    ctx.lineTo(ex - Math.cos(ang + Math.PI / 2) * 160, ey - Math.sin(ang + Math.PI / 2) * 160);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    drawBlackHole(ctx, 820, 470, 60, t, { alpha: a6, jetAng: ang, jet: 1.3 });
    drawGlobe(ctx, { cx: ex, cy: ey, R: 70, lon0: t * 30, lat0: 20 }, { alpha: a6 });
    text(ctx, "地球", ex, ey + 105, { size: 30, alpha: a6 });
    chip(ctx, "耀变体 = 喷流正对着地球的巨型黑洞", 960, 190, { alpha: a6, size: 38 });
  }

  // 7: the first link
  const a7 = show(S, 7, 8);
  if (a7 > 0) {
    drawGhost(ctx, 560, 540, 80, t, { alpha: a7 });
    drawBlackHole(ctx, 1360, 540, 50, t, { alpha: a7 });
    const lp = ease.out(prog(S.at(7), 0.2, 0.8));
    arrow(ctx, 700, 520, lerp(700, 1220, lp), 520, { color: C.yellow, lw: 6, alpha: a7 });
    arrow(ctx, 1220, 580, lerp(1220, 700, lp), 580, { color: C.yellow, lw: 6, alpha: a7 });
    text(ctx, "高能中微子", 560, 700, { size: 36, alpha: a7 });
    text(ctx, "具体的天体", 1360, 700, { size: 36, alpha: a7 });
    stamp(ctx, "史上第一次", 960, 300, S.at(7) - 0.8, { color: C.gold, size: 64, rot: -0.05 });
  }

  // 8: NGC 1068, hidden in gamma rays, bright in neutrinos
  const a8 = show(S, 8, 9);
  if (a8 > 0) {
    yearBadge(ctx, "2022", 640, 175, a8);
    text(ctx, "NGC 1068 · 4700 万光年外", 1180, 175, { size: 40, alpha: a8 });
    [[560, "伽马射线：几乎看不见", false], [1360, "中微子：格外明亮", true]].forEach(([cx, label, nu], k) => {
      const pa = a8 * S.p(8, 0.5, 1.0 + k * 2.4);
      card(ctx, cx - 360, 260, 720, 560, { alpha: pa, fill: "rgba(6,14,32,0.85)", stroke: nu ? C.ice : "rgba(200,180,255,0.5)" });
      drawGalaxy(ctx, cx, 540, 230, t, { alpha: pa * (nu ? 0.45 : 0.6), tilt: 0.55, n: 700, seed: 9 });
      if (nu) {
        glow(ctx, cx, 540, 150 + 25 * Math.sin(t * 5), C.ice, pa);
        glow(ctx, cx, 540, 60, "#ffffff", pa);
      } else {
        drawDust(ctx, cx, 540, 170, t, { alpha: pa * 1.6, color: "#3a2a1c", n: 26, seed: 4 });
      }
      text(ctx, label, cx, 770, { size: 36, color: nu ? C.ice : "#d5c8ff", alpha: pa });
    });
  }

  // 9: the Milky Way in neutrinos
  const a9 = S.p(9, 0.5);
  if (a9 > 0) {
    yearBadge(ctx, "2023", 230, 190, a9);
    ctx.save();
    ctx.globalAlpha = a9;
    for (let i = 0; i < 1500; i++) {
      const x = rnd(i, 100) * W;
      const gy = (rnd(i, 101) + rnd(i, 102) + rnd(i, 103) - 1.5) * 120;
      const y = 540 + gy + Math.sin(x * 0.003) * 30;
      ctx.globalAlpha = a9 * (0.25 + 0.6 * (1 - Math.abs(gy) / 180));
      ctx.fillStyle = rnd(i, 104) > 0.8 ? "#ffe2c2" : "#ffffff";
      const s = 1.2 + rnd(i, 105) * 2;
      ctx.fillRect(x, y, s, s);
    }
    ctx.restore();
    const scan = lerp(-100, W + 100, ease.inOut(prog(S.at(9), 0.8, 2.4)));
    for (let k = 0; k < 60; k++) {
      const x = (k / 60) * W + 16;
      if (x > scan) break;
      const y = 540 + Math.sin(x * 0.003) * 30;
      const core = Math.exp(-Math.pow((x - W / 2) / 500, 2));
      glow(ctx, x, y, 90 + 60 * core, k % 2 ? C.ice : C.purple, a9 * (0.22 + 0.28 * core));
    }
    if (scan < W + 100) {
      ctx.save();
      ctx.globalAlpha = a9 * 0.6;
      ctx.fillStyle = C.ice;
      ctx.fillRect(scan, 300, 3, 480);
      ctx.restore();
    }
    chip(ctx, "第一幅用中微子“看见”的银河系", 960, 230, { alpha: a9 * S.p(9, 0.4, 0.6), size: 40, stroke: C.ice });
  }
}

// ------------------------------------------------------------------ 10 why it matters

export function why(ctx, S) {
  const t = S.t;

  const a0 = show(S, 0, 1);
  if (a0 > 0) {
    popText(ctx, "厉害在哪？", 900, 500, S.at(0), { size: 160, shadow: C.gold, color: "#fff6dc" });
    drawGhost(ctx, 1480, 520, 70, t, { alpha: a0 * S.p(0, 0.4, 0.6), medal: true, mood: "wink" });
  }

  // 1–2: new windows on the universe
  const a1 = show(S, 1, 3);
  if (a1 > 0) {
    const nodes = [
      [250, "1609", "可见光", "伽利略的望远镜", 0.2],
      [600, "1930 年代", "射电", "射电望远镜", 4.0],
      [950, "1960 年代", "X 射线", "太空望远镜", 5.0],
      [1300, "2015", "引力波", "第一次“听见”", 6.6],
    ];
    const axisP = ease.inOut(prog(S.at(1), 0, dur(S, 1) + 1.6));
    ctx.save();
    ctx.globalAlpha = a1;
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(150, 540);
    ctx.lineTo(lerp(150, 1790, axisP), 540);
    ctx.stroke();
    ctx.restore();
    nodes.forEach(([x, year, name, sub, at]) => {
      const a = a1 * S.p(1, 0.4, at);
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = "rgba(20,40,80,0.95)";
      ctx.strokeStyle = C.ice;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, 540, 78 * ease.back(prog(S.at(1), at, 0.5)), 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      text(ctx, name, x, 540, { size: name.length > 3 ? 30 : 36, alpha: a });
      text(ctx, year, x, 420, { size: 34, color: C.gold, alpha: a });
      text(ctx, sub, x, 660, { size: 28, color: C.dim, alpha: a });
    });
    const na = a1 * S.p(2, 0.5, 0.4);
    if (na > 0) {
      const x = 1660;
      glow(ctx, x, 540, 220, C.ice, na);
      ctx.save();
      ctx.globalAlpha = na;
      ctx.fillStyle = "rgba(20,60,110,0.95)";
      ctx.strokeStyle = C.yellow;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(x, 540, 105 * ease.back(S.raw(2, 0.6, 0.4)), 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      drawGhost(ctx, x, 530, 46, t, { alpha: na });
      text(ctx, "2013 →", x, 400, { size: 34, color: C.gold, alpha: na });
      text(ctx, "高能中微子天文学", x, 690, { size: 34, color: C.yellow, alpha: na });
      stamp(ctx, "全新窗口", x, 800, S.at(2) - 1.4, { color: C.yellow, size: 40 });
    }
  }

  // 3: seeing where light can't escape
  const a3 = show(S, 3, 4);
  if (a3 > 0) {
    const cx = 960, cy = 540;
    for (let i = 0; i < 50; i++) {
      const ang = rnd(i, 120) * TAU;
      const d = 90 + ((t * 380 * (0.7 + rnd(i, 121) * 0.6) + rnd(i, 122) * 900) % 900);
      glow(ctx, cx + Math.cos(ang) * d, cy + Math.sin(ang) * d * 0.85, 13, C.ghost, a3 * (1 - d / 1000));
    }
    drawDust(ctx, cx, cy, 300, t, { alpha: a3 * 1.4, color: "#4a3626", n: 34, seed: 7 });
    for (let i = 0; i < 18; i++) {
      const x = cx + Math.sin(t * (2 + rnd(i, 130) * 3) + i) * 170 * rnd(i, 131);
      const y = cy + Math.cos(t * (2.5 + rnd(i, 132) * 3) + i * 2) * 130 * rnd(i, 133);
      glow(ctx, x, y, 14, C.yellow, a3 * 0.9);
    }
    drawBlackHole(ctx, cx, cy, 44, t, { alpha: a3, jet: 0.6 });
    chip(ctx, "光：困在里面出不来", 380, 300, { alpha: a3 * S.p(3, 0.4, 0.5), size: 34, stroke: C.yellow, fill: rgba(C.yellow, 0.14) });
    chip(ctx, "中微子：畅通无阻", 1540, 780, { alpha: a3 * S.p(3, 0.4, 1.4), size: 34 });
  }

  // 4: a century-old mystery
  const a4 = show(S, 4, 5);
  if (a4 > 0) {
    drawBalloon(ctx, 420, 420, 0.95, t, { alpha: a4 });
    chip(ctx, "1912 · 赫斯乘气球发现了宇宙线", 420, 760, { alpha: a4, size: 32 });
    for (let i = 0; i < 18; i++) {
      const u = ((t * 0.35 + rnd(i, 140)) % 1);
      const x = 900 + rnd(i, 141) * 900 + Math.sin(u * 9 + i) * 60;
      glow(ctx, x, lerp(120, 880, u), 14, C.red, a4 * Math.sin(u * Math.PI));
    }
    text(ctx, "？", 1320, 470 + Math.sin(t * 3) * 12, { size: 280, family: FONT_T, weight: 400, color: C.yellow, alpha: a4 });
    chip(ctx, "超高能粒子从哪儿来？悬了 114 年", 1320, 760, { alpha: a4 * S.p(4, 0.4, 2.6), size: 32, stroke: C.yellow, fill: rgba(C.yellow, 0.14) });
  }

  // 5: 38 years, 450 scientists
  const a5 = show(S, 5, 6);
  if (a5 > 0) {
    const yx = (y) => lerp(260, 1660, (y - 1988) / 38);
    const bp = ease.inOut(prog(S.at(5), 0.2, 3.2));
    ctx.save();
    ctx.globalAlpha = a5;
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    roundRect(ctx, 260, 360, 1400, 16, 8);
    ctx.fill();
    ctx.fillStyle = C.gold;
    roundRect(ctx, 260, 360, 1400 * bp, 16, 8);
    ctx.fill();
    ctx.restore();
    [[1988, "大胆构想"], [2010, "建成"], [2013, "首次发现"], [2026, "诺贝尔奖"]].forEach(([y, lab]) => {
      const a = a5 * prog(bp, (y - 1988) / 38 - 0.02, 0.05);
      glow(ctx, yx(y), 368, 30, C.gold, a);
      text(ctx, String(y), yx(y), 315, { size: 32, weight: 900, color: C.gold, alpha: a });
      text(ctx, lab, yx(y), 420, { size: 28, color: C.dim, alpha: a });
    });
    popText(ctx, "整整 38 年", 960, 225, S.at(5) - 3.2, { size: 72, shadow: C.gold, color: "#fff2c8" });
    const cols = ["#8be9ff", "#ffd36b", "#ff7eb6", "#6dffa8", "#b18cff", "#ff9f43", "#7fa8ff", "#ffe066", "#4fd1c5", "#f78fb3", "#c4e86b", "#ffb38a", "#9ad0ff", "#e0a3ff"];
    ctx.save();
    for (let i = 0; i < 450; i++) {
      const c = i % 30, r = Math.floor(i / 30);
      const a = a5 * prog(S.at(5), 4.6 + (c + r) * 0.03, 0.3);
      if (a <= 0) continue;
      const x = 520 + c * 30, y = 540 + r * 25;
      ctx.globalAlpha = a;
      ctx.fillStyle = cols[(i * 7) % 14];
      ctx.beginPath();
      ctx.arc(x, y - 5, 5, 0, TAU);
      ctx.fill();
      ctx.fillRect(x - 5, y + 1, 10, 9);
    }
    ctx.restore();
    chip(ctx, "14 个国家", 300, 640, { alpha: a5 * S.p(5, 0.4, 6.4), size: 34 });
    chip(ctx, "约 450 位科学家", 1650, 640, { alpha: a5 * S.p(5, 0.4, 7.0), size: 34 });
  }

  // 6: five neutrino Nobel prizes
  const a6 = S.p(6, 0.5);
  if (a6 > 0) {
    const prizes = [
      ["1988", "发现 μ 中微子"], ["1995", "首次探测到中微子"], ["2002", "太阳与超新星中微子"],
      ["2015", "中微子振荡"], ["2026", "高能宇宙中微子"],
    ];
    prizes.forEach(([y, cap], k) => {
      const a = a6 * S.p(6, 0.4, 0.3 + k * 0.45);
      const x = 240 + k * 290;
      drawMedal(ctx, x, 480, (k === 4 ? 110 : 85) * ease.back(S.raw(6, 0.5, 0.3 + k * 0.45)), t + k, { alpha: a, label: y });
      text(ctx, y, x, 630, { size: 38, weight: 900, color: C.gold, alpha: a });
      text(ctx, cap, x, 685, { size: 28, color: C.dim, alpha: a });
    });
    drawGhost(ctx, 1720, 470, 70, t, { alpha: a6 * S.p(6, 0.4, 3.0), medal: true, wave: 1 });
    chip(ctx, "诺奖常客 × 5", 1720, 650, { alpha: a6 * S.p(6, 0.4, 3.4), size: 36, stroke: C.gold, color: C.gold, fill: rgba(C.gold, 0.14) });
  }
}

// ------------------------------------------------------------------ 11 future

export function future(ctx, S) {
  const t = S.t;
  const a0 = show(S, 0, 1);
  if (a0 > 0) {
    isoCube(ctx, 420, 620, 90, { alpha: a0 });
    text(ctx, "现在：1 立方公里", 420, 790, { size: 32, alpha: a0 });
    const e = 165, c30 = Math.cos(Math.PI / 6) * e, s30 = Math.sin(Math.PI / 6) * e;
    const cubes = [];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) cubes.push([i, j, k]);
    cubes.sort((a, b) => a[0] + a[1] - (b[0] + b[1]) || a[2] - b[2]);
    cubes.forEach(([i, j, k], n) => {
      const a = a0 * S.p(0, 0.35, 0.4 + n * 0.22);
      isoCube(ctx, 1180 + (i - j) * c30, 560 + (i + j) * s30 - k * e - 40 * (1 - a), e, { alpha: a, glowA: 0.15 });
    });
    popText(ctx, "冰立方二代：约 8 立方公里", 1180, 175, S.at(0) - 1.6, { size: 64, shadow: C.ice });
  }

  const a1 = S.p(1, 0.5);
  if (a1 > 0) {
    const mx = 240, my = 160, mw = 1440, mh = 720;
    drawFlatMap(ctx, mx, my, mw, mh, { alpha: a1 * 0.8 });
    const pins = [
      [0, -64, "南极 · 冰立方", 0, 30, 0],
      [16, 37, "地中海 · KM3NeT", 0.2, -250, -30],
      [105, 52, "贝加尔湖 · Baikal-GVD", 1.4, 0, -70],
      [114, 17, "南海 · 海铃（规划中）", 3.0, 250, 30],
    ];
    pins.forEach(([lon, lat, label, at, dx, dy]) => {
      const a = a1 * S.p(1, 0.35, at);
      if (a <= 0) return;
      const [px, py] = mapXY(lon, lat, mx, my, mw, mh);
      const drop = (1 - ease.out(S.raw(1, 0.4, at))) * 60;
      const ring = (S.at(1) - at) % 1.6;
      ctx.save();
      ctx.globalAlpha = a * (1 - ring / 1.6);
      ctx.strokeStyle = C.ice;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px, py, 10 + ring * 40, 0, TAU);
      ctx.stroke();
      ctx.restore();
      glow(ctx, px, py - drop, 34, C.pink, a);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = C.pink;
      ctx.beginPath();
      ctx.arc(px, py - 30 - drop, 12, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(px - 7, py - 25 - drop);
      ctx.lineTo(px, py - drop);
      ctx.lineTo(px + 7, py - 25 - drop);
      ctx.fill();
      ctx.restore();
      chip(ctx, label, px + dx, py - 70 + dy, { alpha: a, size: 30 });
    });
    drawGhost(ctx, 1720, 820, 50, t, { alpha: a1 * S.p(1, 0.4, 3.6), mood: "wow" });
    bubble(ctx, "被包围了！", 1590, 690, 1680, 770, { alpha: a1 * S.p(1, 0.4, 3.9), size: 32 });
  }
}

// ------------------------------------------------------------------ 12 outro

export function outro(ctx, S) {
  const t = S.t;
  const endT = S.L[1].e + 0.4;
  const fade = 1 - prog(t, endT, 0.8);
  drawHand(ctx, 960, 640, 0.95, t, { alpha: S.p(0, 0.8) * fade });
  stream(ctx, t, { cx: 960, cy: 520, ang: 2.25, w: 1900, len: 2400, count: 110, speed: 1150, seed: 1, alpha: S.p(1, 0.8) * fade });
  const ca = S.p(1, 0.6) * fade;
  if (ca > 0) {
    text(ctx, "就在这一秒，又有：", 960, 110, { size: 34, color: C.dim, alpha: ca });
    digits(ctx, fmtInt(Math.max(0, S.at(1)) * 1e14), 960, 185, { size: 78, color: C.ice, alpha: ca, glowColor: C.ice });
  }
  drawGhost(ctx, 1470, 430, 70, t, { alpha: S.p(1, 0.6, 1.0) * fade, wave: 1, mood: "wink" });

  // end card
  const e = prog(t, endT + 0.3, 0.8);
  if (e > 0) {
    drawMedal(ctx, 960, 260, 105, t, { alpha: e });
    text(ctx, "2026 诺贝尔物理学奖", 960, 420, { size: 42, color: C.gold, alpha: e });
    text(ctx, "弗朗西斯·哈尔岑", 960, 510, { size: 92, family: FONT_T, weight: 400, alpha: e, shadow: rgba(C.ice, 0.6) });
    text(ctx, "表彰他对冰立方中微子天文台的决定性贡献，以及发现了来自天体物理源的高能中微子", 960, 600, { size: 30, weight: 400, color: C.dim, alpha: e });
    const ca2 = prog(t, endT + 1.0, 0.8);
    text(ctx, "资料来源：诺贝尔奖官网新闻稿 · IceCube 合作组 · Physics Today · NASA", 960, 720, { size: 26, weight: 400, color: "rgba(214,232,255,0.55)", alpha: ca2 });
    text(ctx, "画面与音乐均由代码生成（Vibe Coding）· 旁白为 AI 语音合成", 960, 765, { size: 26, weight: 400, color: "rgba(214,232,255,0.55)", alpha: ca2 });
    drawGhost(ctx, 1560, 470, 60, t, { alpha: ca2, wave: 1 });
    bubble(ctx, "下次见~", 1700, 340, 1600, 420, { alpha: prog(t, endT + 1.6, 0.4), size: 34 });
  }
}

