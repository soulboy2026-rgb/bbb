// Scenes 1–6: hook, title, laureate, the ghost particle, three couriers, the big door.
// Each scene receives S (see sceneState in main.js): S.t is local time, S.at(i)
// is time since narration line i began, S.p(i, d, off) an eased 0→1 beat.

import {
  W, H, C, FONT_T, TAU, clamp, lerp, ease, prog, rnd, rgba, glow, text, popText, richText, card, chip, stamp,
  arrow, bubble, drawAurora, drawIceSurface, drawIceSection, depthRuler, stream, sparkle, drawGhost, drawGlobe,
  project, isoCube, drawBlackHole, drawDust, roundRect,
} from "./core.js";
import {
  mark, digits, fmtInt, partialMarks, drawHand, drawMedal, drawPauli, drawTower, drawSkyscraper, drawICL,
  drawDoor, drawBolt,
} from "./props.js";

/** Visible from line a until line b begins. */
export const show = (S, a, b = null, d = 0.45) => Math.min(S.p(a, d), b == null ? 1 : 1 - S.raw(b, d));
export const dur = (S, i) => S.L[i].e - S.L[i].s;

// ------------------------------------------------------------------ 1 hook

export function hook(ctx, S) {
  const t = S.t;
  const handA = prog(t, 0.3, 0.9) * (1 - 0.5 * S.raw(3, 0.6));
  const hy = 640 + (1 - ease.out(prog(t, 0.3, 1.2))) * 80;

  drawHand(ctx, 960, hy, 0.95, t, { alpha: handA });

  // "look at it for one second": a ring that fills in one second
  const ringA = prog(S.at(0), 1.2, 0.3) * (1 - S.raw(1, 0.5));
  if (ringA > 0) {
    const rp = prog(S.at(0), 1.5, 1.0);
    ctx.save();
    ctx.globalAlpha = ringA;
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(139,233,255,0.15)";
    ctx.beginPath();
    ctx.arc(960, hy - 90, 340, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = C.ice;
    ctx.beginPath();
    ctx.arc(960, hy - 90, 340, -Math.PI / 2, -Math.PI / 2 + TAU * rp);
    ctx.stroke();
    ctx.restore();
    chip(ctx, rp < 1 ? "计时中…" : "1 秒！", 960, hy - 450, { alpha: ringA, size: 34 });
  }

  // a second of neutrinos
  const sA = S.p(1, 0.8);
  stream(ctx, t, { cx: 960, cy: 520, ang: 2.25, w: 1900, len: 2400, count: 120, speed: 1150, seed: 1, alpha: sA });
  const cA = sA * (1 - S.raw(3, 0.5));
  if (cA > 0) {
    text(ctx, "这一秒，穿过你身体的中微子：", 960, 110, { size: 34, color: C.dim, alpha: cA });
    digits(ctx, fmtInt(1e14 * clamp(S.at(1) / 1.6) + Math.max(0, S.at(1) - 1.6) * 1e14), 960, 185,
      { size: 78, color: C.ice, alpha: cA, glowColor: C.ice });
  }

  // "felt anything?"
  bubble(ctx, "嗯？完全没感觉……", 1430, 360, 1130, 470, { alpha: show(S, 2, 3), size: 40 });
  chip(ctx, "相互作用：几乎为 0", 470, 400, { alpha: show(S, 2, 3, 0.4) * S.p(2, 0.4, 1.4), size: 34, stroke: C.pink, fill: rgba(C.pink, 0.14) });

  // the ghost arrives
  const g = S.raw(3, 1.3);
  if (g > 0) {
    const gx = lerp(1750, 960, ease.out(g));
    drawGhost(ctx, gx, 520, 125, t, { mood: S.at(3) > 1.1 ? "boo" : "happy", alpha: clamp(g * 3), wave: S.at(3) > 1.4 ? 1 : 0 });
    bubble(ctx, "Boo~！", 1260, 330, 1060, 430, { alpha: S.p(3, 0.3, 1.1), size: 46 });
    popText(ctx, "幽灵粒子", 960, 205, S.at(3) - 0.9, { size: 140, shadow: C.ice, stagger: 0.09 });
  }
}

// ------------------------------------------------------------------ 2 title

export function title(ctx, S) {
  const t = S.t;
  drawAurora(ctx, t, { y: 360, alpha: prog(t, 0, 1.2) });
  stream(ctx, t, { cx: 960, cy: 420, ang: 1.83, w: 2400, len: 1100, count: 46, speed: 620, seed: 7, alpha: 0.75, trail: 90 });
  drawIceSurface(ctx, 790, t);
  for (let k = 0; k < 12; k++) {
    const P = 2.6, age = (t + rnd(k, 90) * P) % P;
    if (age < 0.7) {
      const x = 120 + rnd(k + Math.floor((t + rnd(k, 90) * P) / P) * 13, 91) * 1680;
      glow(ctx, x, 860 + rnd(k, 92) * 180, 60 * (1 - age / 0.7), C.ice, 1 - age / 0.7);
    }
  }
  drawICL(ctx, 960, 792, 1.15);
  chip(ctx, "2026 诺贝尔物理学奖", 960, 225, { alpha: prog(t, 0.2, 0.6), size: 38, color: C.gold, stroke: C.gold, fill: rgba(C.gold, 0.14) });
  popText(ctx, "幽灵粒子猎人", 960, 410, t - 0.4, { size: 176, shadow: C.ice, stagger: 0.08, blur: 40 });
  text(ctx, "在南极冰层下，捕捉来自宇宙深处的信使", 960, 565, { size: 48, weight: 700, color: "#dff6ff", alpha: prog(t, 1.6, 0.8) });
  drawGhost(ctx, 1590, 700, 56, t, { mood: "wink", alpha: prog(t, 2.6, 0.6), wave: 1 });
}

// ------------------------------------------------------------------ 3 laureate

export function laureate(ctx, S) {
  const t = S.t;
  const gA = 1 - S.raw(1, 0.5);
  const mp = S.raw(0, 1.1);
  drawMedal(ctx, 470, 450, 190 * ease.back(clamp(mp * 1.3)), t, { alpha: gA * clamp(mp * 3), spin: Math.cos((1 - ease.out(mp)) * TAU) });
  chip(ctx, "一人独享 · 2026 物理学奖", 470, 735, { alpha: gA * S.p(0, 0.4, 3.4), size: 32, color: C.gold, stroke: C.gold, fill: rgba(C.gold, 0.14) });

  const nA = gA * S.p(0, 0.6, 0.4);
  const slide = (1 - S.p(0, 0.8, 0.4)) * 50;
  text(ctx, "弗朗西斯·哈尔岑", 800 + slide, 320, { size: 108, family: FONT_T, weight: 400, align: "left", alpha: nA, shadow: rgba(C.ice, 0.6) });
  text(ctx, "Francis Halzen", 806 + slide, 420, { size: 46, weight: 400, align: "left", color: C.dim, alpha: nA });
  ["1944 年生于比利时", "美国威斯康星大学麦迪逊分校", "冰立方中微子天文台 首席科学家"].forEach((s, k) =>
    chip(ctx, s, 806, 515 + k * 82, { align: "left", alpha: gA * S.p(0, 0.4, 1.3 + k * 0.9), size: 34 }));

  // the official citation, typed out
  const qa = show(S, 1, null, 0.5);
  if (qa > 0) {
    const y0 = lerp(300, 210, S.p(2, 0.6));
    card(ctx, 210, y0 - 70, 1500, 330, { alpha: qa, fill: "rgba(10,24,52,0.85)", stroke: rgba(C.gold, 0.55) });
    text(ctx, "获奖理由", 290, y0 - 22, { size: 32, align: "left", color: C.gold, alpha: qa });
    const q1 = "“表彰他对【冰立方中微子天文台】的决定性贡献，";
    const q2 = "以及发现了【来自天体物理源的高能中微子】。”";
    const n1 = q1.replace(/[【】]/g, "").length, n2 = q2.replace(/[【】]/g, "").length;
    const n = Math.floor((n1 + n2) * prog(S.at(1), 0.2, dur(S, 1) * 0.85));
    richText(ctx, partialMarks(q1, n), 960, y0 + 60, { size: 56, hi: C.yellow, alpha: qa });
    richText(ctx, partialMarks(q2, Math.max(0, n - n1)), 960, y0 + 160, { size: 56, hi: C.yellow, alpha: qa });
  }

  // break it into four keywords
  const keys = [
    ["中微子", (x, y) => drawGhost(ctx, x, y - 6, 34, t)],
    ["天体物理源", (x, y) => drawBlackHole(ctx, x, y, 20, t, { jet: 0.7 })],
    ["冰立方", (x, y) => isoCube(ctx, x, y, 62, { glowA: 0.2 })],
    ["高能", (x, y) => drawBolt(ctx, x, y, 1.1)],
  ];
  keys.forEach(([label, icon], k) => {
    const a = S.p(2, 0.45, 0.5 + k * 0.35);
    if (a <= 0) return;
    const cx = 960 + (k - 1.5) * 390, cy = 690 + (1 - a) * 60;
    card(ctx, cx - 170, cy - 110, 340, 220, { alpha: a, fill: "rgba(12,30,64,0.9)" });
    ctx.save();
    ctx.globalAlpha = a;
    icon(cx, cy - 30);
    ctx.restore();
    text(ctx, label, cx, cy + 62, { size: 42, alpha: a });
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = C.ice;
    ctx.beginPath();
    ctx.arc(cx - 140, cy - 80, 22, 0, TAU);
    ctx.fill();
    ctx.restore();
    text(ctx, String(k + 1), cx - 140, cy - 79, { size: 28, weight: 900, color: C.ink, alpha: a });
  });
}

// ------------------------------------------------------------------ 4 the ghost particle

export function ghost(ctx, S) {
  const t = S.t;

  // 0: meet the protagonist
  const a0 = show(S, 0, 1);
  if (a0 > 0) {
    drawGhost(ctx, 960, 480, 160 * ease.back(S.raw(0, 0.7)), t, { alpha: a0, wave: 1 });
    chip(ctx, "大名：中微子（ν）", 480, 500, { alpha: a0 * S.p(0, 0.4, 0.5), size: 40 });
    chip(ctx, "外号：幽灵粒子", 1440, 500, { alpha: a0 * S.p(0, 0.4, 1.1), size: 40, stroke: C.pink, fill: rgba(C.pink, 0.14) });
  }

  // 1–2: Pauli and the energy ledger
  const a1 = show(S, 1, 3);
  if (a1 > 0) {
    drawPauli(ctx, 330, 560, 1.05, t, { alpha: a1 * S.p(1, 0.6), sweat: S.p(2, 0.5) });
    chip(ctx, "泡利 · 1930 年", 330, 850, { alpha: a1 * S.p(1, 0.6), size: 32 });
    const la = a1 * S.p(1, 0.6, 0.3) * (1 - 0.55 * S.raw(2, 0.5));
    card(ctx, 640, 270, 1140, 470, { alpha: la });
    text(ctx, "能量账本：原子核衰变", 1210, 330, { size: 40, alpha: la, color: C.gold });
    const rows = [["衰变前", 1, C.gold], ["电子带走", 0.68, "#4fc3ff"]];
    rows.forEach(([lab, w, col], k) => {
      const y = 420 + k * 95;
      text(ctx, lab, 690, y, { size: 36, align: "left", alpha: la });
      ctx.save();
      ctx.globalAlpha = la;
      ctx.fillStyle = col;
      roundRect(ctx, 900, y - 26, 800 * w * S.p(1, 0.8, 0.5 + k * 0.5), 52, 12);
      ctx.fill();
      ctx.restore();
    });
    const y3 = 610;
    const found = S.raw(1, 0.5, Math.min(3.4, dur(S, 1) - 0.8));
    text(ctx, found > 0.5 ? "被它带走" : "去哪儿了？", 690, y3, { size: 36, align: "left", alpha: la * S.p(1, 0.4, 1.6), color: found > 0.5 ? C.ice : C.red });
    if (S.at(1) > 1.6) {
      ctx.save();
      ctx.globalAlpha = la;
      ctx.setLineDash([12, 10]);
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 4;
      roundRect(ctx, 900 + 800 * 0.68, y3 - 26, 800 * 0.32, 52, 12);
      ctx.stroke();
      ctx.setLineDash([]);
      if (found > 0) {
        ctx.globalAlpha = la * found;
        ctx.fillStyle = rgba(C.ghost, 0.85);
        roundRect(ctx, 900 + 800 * 0.68, y3 - 26, 800 * 0.32, 52, 12);
        ctx.fill();
      }
      ctx.restore();
      if (found < 1) text(ctx, "？", 900 + 800 * 0.84, y3 + 2, { size: 46, weight: 900, color: C.red, alpha: la * (1 - found) * (0.6 + 0.4 * Math.sin(t * 8)) });
      drawGhost(ctx, 900 + 800 * 0.84, y3 - 6, 22, t, { alpha: la * found });
    }
    bubble(ctx, "我干了件可怕的事：预言了一种根本探测不到的粒子！", 1060, 165, 470, 430,
      { alpha: a1 * S.p(2, 0.4), size: 40, maxW: 1100 });
  }

  // 3: three properties
  const a3 = show(S, 3, 4);
  if (a3 > 0) {
    const cards = [
      ["不带电", "电磁力管不着它", 0.2],
      ["几乎没有质量", "比电子至少轻一百万倍", 1.3],
      ["几乎不和物质反应", "只受弱力和引力影响", 2.7],
    ];
    cards.forEach(([h, sub, at], k) => {
      const a = a3 * S.p(3, 0.45, at);
      if (a <= 0) return;
      const cx = 960 + (k - 1) * 540, cy = 520 + (1 - a) * 50;
      card(ctx, cx - 240, cy - 200, 480, 400, { alpha: a });
      ctx.save();
      ctx.globalAlpha = a;
      if (k === 0) {
        drawBolt(ctx, cx, cy - 70, 1.6);
        mark(ctx, cx, cy - 70, 90, false);
      } else if (k === 1) {
        const rg = ctx.createRadialGradient(cx - 80, cy - 80, 4, cx - 70, cy - 70, 55);
        rg.addColorStop(0, "#c9e6ff");
        rg.addColorStop(1, "#2f6fd1");
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(cx - 70, cy - 70, 55, 0, TAU);
        ctx.fill();
        text(ctx, "电子", cx - 70, cy - 70, { size: 28 });
        glow(ctx, cx + 90, cy - 70, 22, C.ghost, 1);
        text(ctx, "中微子", cx + 90, cy - 22, { size: 26, color: C.ice });
      } else {
        ctx.fillStyle = "#5c6b85";
        ctx.fillRect(cx - 18, cy - 150, 36, 160);
        const gx = cx - 130 + ((t * 120) % 260);
        drawGhost(ctx, gx, cy - 80, 32, t, { alpha: Math.abs(gx - cx) < 40 ? 0.55 : 1 });
      }
      ctx.restore();
      text(ctx, h, cx, cy + 70, { size: 44, alpha: a });
      text(ctx, sub, cx, cy + 135, { size: 30, weight: 400, color: C.dim, alpha: a });
    });
  }

  // 4: through the whole Earth
  const a4 = show(S, 4, 5);
  if (a4 > 0) {
    drawGlobe(ctx, { cx: 960, cy: 530, R: 290, lon0: t * 25, lat0: 15 }, { alpha: a4 });
    stream(ctx, t, { cx: 960, cy: 530, ang: 0, w: 640, len: 2300, count: 60, speed: 900, seed: 3, alpha: a4 });
    const gx = lerp(220, 1720, prog(S.at(4), 0.1, dur(S, 4) + 0.3));
    drawGhost(ctx, gx, 530, 64, t, { alpha: a4 * (Math.abs(gx - 960) < 290 ? 0.55 : 1), mood: "happy" });
    chip(ctx, "穿过地球 ≈ 走过一阵薄雾", 960, 175, { alpha: a4, size: 40 });
  }

  // 5: a light-year of lead
  const a5 = show(S, 5, 6);
  if (a5 > 0) {
    const p = ease.inOut(prog(S.at(5), 0.4, dur(S, 5) - 0.4));
    stream(ctx, t, { cx: 960, cy: 545, ang: 0, w: 360, len: 2400, count: 80, speed: 900, seed: 5, alpha: a5, stopAt: { frac: 0.5 * p, d: -310 } });
    const x0 = 650, x1 = lerp(780, 1870, p);
    ctx.save();
    ctx.globalAlpha = a5 * 0.88;
    ctx.fillStyle = "#6f7787";
    ctx.fillRect(x0, 345, x1 - x0, 400);
    ctx.strokeStyle = "rgba(40,44,54,0.6)";
    ctx.lineWidth = 3;
    for (let r = 0; r < 8; r++) {
      const y = 345 + r * 50;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
      ctx.stroke();
      for (let x = x0 + (r % 2) * 50; x < x1; x += 100) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 50);
        ctx.stroke();
      }
    }
    ctx.restore();
    text(ctx, "铅 Pb", x0 + 110, 545, { size: 54, weight: 900, color: "#e9edf5", alpha: a5 });
    const labels = ["1 米", "1 公里", "1 万公里（≈ 地球直径）", "1.5 亿公里（≈ 日地距离）", "1 光年（≈ 9.46 万亿公里）"];
    const li = Math.min(labels.length - 1, Math.floor(p * labels.length * 0.999 + (p > 0.97 ? 1 : 0)));
    text(ctx, "铅墙厚度：", 960, 205, { size: 40, color: C.dim, alpha: a5, align: "right" });
    text(ctx, labels[li], 960, 205, { size: 52, color: p > 0.97 ? C.yellow : C.white, alpha: a5, align: "left" });
    chip(ctx, "只挡下一半！", 1500, 850, { alpha: a5 * prog(p, 0.95, 0.05), size: 36, stroke: C.yellow, fill: rgba(C.yellow, 0.14) });
  }

  // 6: 1956, caught at last
  const a6 = S.p(6, 0.5);
  if (a6 > 0) {
    drawTower(ctx, 470, 800, 1.1, t, { alpha: a6 });
    text(ctx, "核反应堆", 470, 845, { size: 32, color: C.dim, alpha: a6 });
    stream(ctx, t, { cx: 1000, cy: 650, ang: 0, w: 120, len: 1300, count: 30, speed: 800, seed: 9, alpha: a6 });
    card(ctx, 1150, 560, 460, 240, { alpha: a6, fill: "rgba(20,70,140,0.75)", stroke: C.ice });
    text(ctx, "探测器", 1380, 840, { size: 32, color: C.dim, alpha: a6 });
    const hit = S.at(6) - 2.0;
    sparkle(ctx, 1380, 680, hit, { r: 160, color: C.ice });
    drawGhost(ctx, 1380, 670, 46, t, { alpha: a6 * prog(hit, 0, 0.3), mood: "wow" });
    bubble(ctx, "抓到了！", 1500, 420, 1400, 560, { alpha: a6 * prog(hit, 0.1, 0.3), size: 42 });
    const ya = S.p(6, 0.5, 0.3);
    if (ya > 0) {
      ctx.save();
      ctx.globalAlpha = ya;
      text(ctx, "1956", 960, 230, { size: 90, weight: 900, color: C.gold });
      text(ctx, "人类第一次探测到中微子", 960, 330, { size: 44 });
      ctx.restore();
    }
  }
}

// ------------------------------------------------------------------ 5 three couriers

const LANES = [330, 540, 750];

function photon(ctx, x, y, t, a) {
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.strokeStyle = rgba(C.yellow, 0.8);
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let k = 0; k <= 40; k++) {
    const xx = x - k * 4;
    ctx.lineTo(xx, y + Math.sin(xx * 0.08 - t * 20) * 12 * (1 - k / 40));
  }
  ctx.stroke();
  ctx.restore();
  glow(ctx, x, y, 40, C.yellow, a);
}

function parcel(ctx, x, y, rot, a) {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = "#c98b4b";
  ctx.fillRect(-18, -14, 36, 28);
  ctx.fillStyle = "#e8c48f";
  ctx.fillRect(-4, -14, 8, 28);
  ctx.restore();
}

function cosmicPath(u) {
  const x = lerp(420, 1560, u) + 80 * Math.sin(u * TAU * 3) * Math.sin(u * Math.PI);
  const y = 540 - 170 * Math.sin(u * TAU * 1.5) * Math.sin(u * Math.PI) - 140 * u * u;
  return [x, y];
}

export function couriers(ctx, S) {
  const t = S.t;

  const a0 = show(S, 0, 1);
  if (a0 > 0) {
    drawGhost(ctx, 960, 500, 120, t, { mood: "wow", alpha: a0 });
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * TAU + t * 0.4;
      text(ctx, "？", 960 + Math.cos(a) * 260, 500 + Math.sin(a) * 190, { size: 90, family: FONT_T, weight: 400, color: C.yellow, alpha: a0 * S.p(0, 0.3, k * 0.15) });
    }
  }

  // 1: the cosmic accelerator
  const lanesOn = S.p(2, 1.0);
  const bx = lerp(960, 200, lanesOn), br = lerp(80, 46, lanesOn);
  const a1 = S.p(1, 0.6);
  if (a1 > 0) {
    drawBlackHole(ctx, bx, 530, br, t, { alpha: a1 * (1 - S.raw(6, 0.5)) });
    const em = a1 * (1 - lanesOn);
    if (em > 0) {
      const cols = [C.yellow, C.red, C.ghost];
      for (let i = 0; i < 70; i++) {
        const ang = rnd(i, 20) * TAU;
        const d = 120 + (((t * 260 * (0.6 + rnd(i, 21))) + rnd(i, 22) * 900) % 900);
        glow(ctx, bx + Math.cos(ang) * d, 530 + Math.sin(ang) * d * 0.8, 14, cols[i % 3], em * (1 - d / 1020));
      }
      chip(ctx, "宇宙天然的超级粒子加速器", 960, 190, { alpha: em, size: 40 });
    }
  }

  // 2–5: three lanes
  const la = lanesOn * (1 - S.raw(6, 0.5));
  if (la > 0) {
    drawGlobe(ctx, { cx: 1700, cy: 540, R: 120, lon0: t * 30, lat0: 20 }, { alpha: la });
    ctx.save();
    ctx.globalAlpha = la * 0.35;
    ctx.setLineDash([6, 14]);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    for (const y of LANES) {
      ctx.beginPath();
      ctx.moveTo(300, y);
      ctx.lineTo(1570, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
    // obstacles: dust on lanes 1 and 3, magnetic field across lanes 2 and 3
    const oa = la * S.p(2, 0.6, 1.5);
    drawDust(ctx, 960, 330, 150, t, { alpha: oa, seed: 1 });
    drawDust(ctx, 1200, 750, 140, t, { alpha: oa, seed: 2 });
    ctx.save();
    ctx.globalAlpha = oa * 0.7;
    ctx.strokeStyle = C.purple;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([10, 10]);
    ctx.lineDashOffset = -t * 30;
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.ellipse(960, 645, 160 + k * 55, 70 + k * 38, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
    text(ctx, "宇宙磁场", 960, 645, { size: 28, color: C.purple, alpha: oa });
    text(ctx, "尘埃气体", 960, 225, { size: 28, color: "#d8b48c", alpha: oa });

    const names = [["1号 光子", C.yellow], ["2号 宇宙线", C.red], ["3号 中微子", C.ghost]];
    names.forEach(([n, col], k) =>
      chip(ctx, n, 420, LANES[k] - 100, { alpha: la * S.p(2, 0.4, 0.6 + k * 0.45), size: 30, stroke: col, fill: rgba(col, 0.14) }));

    // courier 1: photon, stopped by dust
    const p1 = ease.inOut(prog(S.at(3), 0.3, 1.5));
    const lost = prog(S.at(3), 1.8, 0.4);
    const x1 = lerp(420, 900, p1);
    photon(ctx, x1, LANES[0] + Math.sin(t * 3) * 4, t, la * S.p(2, 0.4, 0.6) * (1 - lost));
    sparkle(ctx, 900, LANES[0], S.at(3) - 1.8, { color: C.yellow });
    const fall = Math.max(0, S.at(3) - 1.8);
    parcel(ctx, x1 + fall * 40, LANES[0] - 34 + fall * fall * 260, fall * 3, la * S.p(2, 0.4, 0.6) * (1 - prog(fall, 0.8, 0.4)));
    if (S.at(3) > 2.0) {
      stamp(ctx, "被拦下", 1300, LANES[0], S.at(3) - 2.0, { color: C.red });
      mark(ctx, 1185, LANES[0], 40, false, { alpha: la * prog(S.at(3), 2.0, 0.3) });
    }

    // courier 2: cosmic ray, bent by magnetic fields
    const u2 = ease.inOut(prog(S.at(4), 0.3, 4.2));
    ctx.save();
    ctx.globalAlpha = la;
    ctx.strokeStyle = rgba(C.red, 0.6);
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 8]);
    ctx.beginPath();
    for (let k = 0; k <= 80; k++) {
      const [px, py] = cosmicPath((u2 * k) / 80);
      ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    const [cx2, cy2] = cosmicPath(u2);
    const ca = la * S.p(2, 0.4, 1.05);
    glow(ctx, cx2, cy2, 36, C.red, ca);
    text(ctx, "+", cx2, cy2 - 2, { size: 34, weight: 900, color: "#fff", alpha: ca });
    parcel(ctx, cx2, cy2 - 32, 0, ca);
    if (S.at(4) > 4.6) stamp(ctx, "认不出来路", 1290, 470, S.at(4) - 4.6, { color: C.orange });

    // courier 3: neutrino, straight through everything
    const u3 = ease.inOut(prog(S.at(5), 0.3, 2.8));
    const x3 = lerp(420, 1560, u3);
    if (u3 > 0) {
      ctx.save();
      ctx.globalAlpha = la * 0.8;
      ctx.strokeStyle = C.ghost;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(420, LANES[2]);
      ctx.lineTo(x3, LANES[2]);
      ctx.stroke();
      ctx.restore();
    }
    const na = la * S.p(2, 0.4, 1.5);
    drawGhost(ctx, x3, LANES[2] - 6, 34, t, { alpha: na });
    parcel(ctx, x3, LANES[2] - 52, 0, na);
    if (S.at(5) > 3.2) {
      stamp(ctx, "笔直送达", 1330, 855, S.at(5) - 3.2, { color: C.green, rot: 0.06 });
      mark(ctx, 1190, 855, 40, true, { alpha: la * prog(S.at(5), 3.2, 0.3) });
    }
  }

  // 6: it never knocks
  const a6 = S.p(6, 0.6);
  if (a6 > 0) {
    drawDoor(ctx, 960, 680, 1.25, { alpha: a6 });
    const gx = lerp(560, 1400, prog(S.at(6), 1.0, 2.6));
    const inside = Math.abs(gx - 960) < 140;
    drawGhost(ctx, gx, 520, 60, t, { alpha: a6 * (inside ? 0.45 : 1), mood: gx > 1100 ? "wink" : "happy" });
    bubble(ctx, "敲门？不存在的~", 1450, 300, 1400, 420, { alpha: a6 * prog(S.at(6), 3.0, 0.3), size: 40 });
    chip(ctx, "绝大多数中微子：直接穿过，不留痕迹", 960, 190, { alpha: a6 * S.p(6, 0.4, 0.4), size: 38 });
  }
}

// ------------------------------------------------------------------ 6 the big door

export function bigdoor(ctx, S) {
  const t = S.t;

  // 0–1: make the door big enough
  const a01 = show(S, 0, 2);
  if (a01 > 0) {
    stream(ctx, t, { cx: 960, cy: 520, ang: Math.PI / 2 + 0.12, w: 2100, len: 1300, count: 80, speed: 620, seed: 4, alpha: a01, trail: 60 });
    const grow = ease.back(prog(S.at(0), 2.7, 0.9));
    const w = lerp(150, 760, grow), h = lerp(110, 430, grow);
    const cx = 960, cy = 610;
    card(ctx, cx - w / 2, cy - h / 2, w, h, { alpha: a01, fill: "rgba(20,60,120,0.55)", stroke: C.ice, lw: 4, r: 18 });
    text(ctx, grow < 0.5 ? "小探测器" : "超大探测器", cx, cy - h / 2 - 34, { size: 34, alpha: a01, color: C.ice });
    let hits = 0;
    for (let k = 0; k < 12; k++) {
      const te = S.at(0) - (3.7 + k * 0.72);
      if (te < 0) continue;
      hits++;
      const hx = cx + (rnd(k, 40) - 0.5) * (w - 80), hy = cy + (rnd(k, 41) - 0.5) * (h - 80);
      sparkle(ctx, hx, hy, te, { r: 70, color: C.ice, dur: 0.7, seed: k });
      if (te > 0.7) glow(ctx, hx, hy, 10, C.ice, 0.6);
    }
    if (S.at(0) < 2.6) text(ctx, "撞上了：0 个", cx, cy, { size: 30, color: C.dim, alpha: a01 });
    else text(ctx, `撞上了：${hits} 个`, cx, cy + h / 2 + 40, { size: 38, alpha: a01 * prog(S.at(0), 3.4, 0.4), color: C.yellow });
    const fa = a01 * S.p(1, 0.4);
    if (fa > 0) {
      chip(ctx, "撞上的几率：极小", 520, 190, { alpha: fa, size: 36 });
      text(ctx, "×", 790, 190, { size: 56, alpha: S.p(1, 0.4, 0.6) * a01 });
      chip(ctx, "原子的数量：极多", 1060, 190, { alpha: a01 * S.p(1, 0.4, 0.6), size: 36 });
      text(ctx, "=", 1330, 190, { size: 56, alpha: a01 * S.p(1, 0.4, 1.4) });
      chip(ctx, "总能逮到几个！", 1560, 190, { alpha: a01 * S.p(1, 0.4, 1.4), size: 36, stroke: C.yellow, fill: rgba(C.yellow, 0.16) });
    }
  }

  // 2–4: one cubic kilometre
  const a2 = show(S, 2, 5);
  if (a2 > 0) {
    const shift = S.p(3, 0.8) * (1 - S.p(4, 0.8));
    const e = 380 * ease.back(S.raw(2, 0.9)) - 50 * shift;
    const cx = lerp(960, 560, shift), cy = 560;
    const geo = isoCube(ctx, cx, cy, e, { alpha: a2 });
    if (geo && S.at(2) > 0.6) {
      const { top, bot } = geo;
      const la = a2 * S.p(2, 0.4, 0.6);
      const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const [m1x, m1y] = mid(bot[2], bot[1]);
      const [m2x, m2y] = mid(bot[3], bot[2]);
      const [m3x, m3y] = mid(top[2], bot[2]);
      text(ctx, "1 公里", m1x + 60, m1y + 34, { size: 34, alpha: la });
      text(ctx, "1 公里", m2x - 60, m2y + 34, { size: 34, alpha: la });
      text(ctx, "1 公里", m3x + 70, m3y, { size: 34, alpha: la * (1 - shift) });
      popText(ctx, "1 立方公里", 960, 165, S.at(2) - 0.2, { size: 110, shadow: C.ice });
      // Burj Khalifa to scale: 828 m against the 1000 m edge
      if (shift > 0) {
        const ground = bot[2][1];
        drawSkyscraper(ctx, cx + e * 1.25, ground, e * 0.828, { alpha: a2 * shift });
        text(ctx, "哈利法塔 828 米", cx + e * 1.25, ground - e * 0.828 - 34, { size: 30, alpha: a2 * shift });
        text(ctx, "1000 米", m3x - 80, m3y, { size: 30, alpha: a2 * shift, color: C.ice });
        // swimming pools
        const pa = a2 * S.p(3, 0.4, 2.4);
        const n = Math.floor(192 * prog(S.at(3), 2.4, 2.4));
        ctx.save();
        ctx.globalAlpha = pa;
        for (let i = 0; i < n; i++) {
          const c = i % 16, r = Math.floor(i / 16);
          ctx.fillStyle = i % 7 === 0 ? "#7fdcff" : "#3aa6e0";
          ctx.fillRect(1180 + c * 38, 330 + r * 30, 30, 20);
        }
        ctx.restore();
        text(ctx, "≈ 40 万个标准游泳池", 1480, 740, { size: 44, color: C.yellow, alpha: pa * prog(S.at(3), 4.6, 0.4) });
      }
    }
    // 4: where can we find it?
    const qa = a2 * S.p(4, 0.4);
    if (qa > 0) {
      text(ctx, "？", 1420, 520 + Math.sin(t * 3) * 14, { size: 300, family: FONT_T, weight: 400, color: C.yellow, alpha: qa });
      chip(ctx, "要足够大", 1660, 700, { alpha: qa, size: 34 });
      chip(ctx, "要极其透明", 1660, 790, { alpha: a2 * S.p(4, 0.4, 0.8), size: 34 });
    }
  }

  // 5: the South Pole
  const a5 = show(S, 5, 6);
  if (a5 > 0) {
    const g = { cx: 960, cy: 560, R: 330, lon0: 40 + t * 6, lat0: lerp(15, -70, ease.inOut(S.raw(5, 2.4))) };
    drawGlobe(ctx, g, { alpha: a5 });
    const [px, py, pz] = project(0, -90, g);
    if (pz > 0) {
      const pa = a5 * S.p(5, 0.4, 2.3);
      glow(ctx, px, py, 60, C.pink, pa);
      ctx.save();
      ctx.globalAlpha = pa;
      ctx.fillStyle = C.pink;
      ctx.beginPath();
      ctx.arc(px, py - 40, 14, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(px - 8, py - 34);
      ctx.lineTo(px, py);
      ctx.lineTo(px + 8, py - 34);
      ctx.fill();
      ctx.restore();
      chip(ctx, "南极点", px + 140, py - 40, { alpha: pa, size: 34, stroke: C.pink, fill: rgba(C.pink, 0.16) });
    }
    ctx.save();
    ctx.globalAlpha = a5 * S.p(5, 0.4);
    text(ctx, "1988", 300, 230, { size: 96, weight: 900, color: C.gold });
    text(ctx, "哈尔岑的大胆构想", 300, 320, { size: 36, color: C.dim });
    ctx.restore();
  }

  // 6: clear deep ice
  const a6 = S.p(6, 0.6);
  if (a6 > 0) {
    const y0 = 230, y1 = 900, depth = (m) => lerp(y0, y1, m / 2800);
    drawIceSection(ctx, y0, y1, { alpha: a6 });
    ctx.save();
    ctx.globalAlpha = a6;
    ctx.fillStyle = "#f4fbff";
    ctx.fillRect(0, y0 - 14, W, 14);
    ctx.restore();
    depthRuler(ctx, 120, y0, y1, 2800, [0, 1000, 2000, 2800], { alpha: a6 });
    ctx.save();
    ctx.globalAlpha = a6;
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 260; i++) {
      const m = Math.pow(rnd(i, 60), 1.8) * 1500;
      const r = 2 + (1 - m / 1500) * 7 * rnd(i, 61);
      const x = 260 + rnd(i, 62) * 1600;
      ctx.beginPath();
      ctx.arc(x, depth(m) + 8 + Math.sin(t + i) * 2, r, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    const lp = ease.out(prog(S.at(6), 1.2, 3.0));
    const ly = depth(2200);
    if (lp > 0) {
      const lg = ctx.createLinearGradient(420, 0, lerp(420, 1650, lp), 0);
      lg.addColorStop(0, rgba(C.yellow, 0.9));
      lg.addColorStop(1, rgba(C.yellow, 0.25));
      ctx.save();
      ctx.globalAlpha = a6;
      ctx.strokeStyle = lg;
      ctx.lineWidth = 8;
      ctx.shadowColor = C.yellow;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(420, ly);
      ctx.lineTo(lerp(420, 1650, lp), ly);
      ctx.stroke();
      ctx.restore();
      glow(ctx, lerp(420, 1650, lp), ly, 50, C.yellow, a6);
      text(ctx, "光可以走上百米", 1040, ly - 50, { size: 40, color: C.yellow, alpha: a6 * prog(S.at(6), 2.0, 0.5) });
    }
    chip(ctx, "浅层：气泡多", 1560, depth(400), { alpha: a6 * S.p(6, 0.4, 0.5), size: 34 });
    chip(ctx, "深层：上万年挤压，几乎没有气泡", 1300, depth(1550), { alpha: a6 * S.p(6, 0.4, 1.0), size: 34, stroke: C.green, fill: rgba(C.green, 0.14) });
  }
}
