// Boots the film: loads the timeline, land map and fonts, then exposes
// window.renderAt(t) for the frame renderer and a small player for previews.

import { W, H, C, FONT, FONT_T, clamp, ease, setLand, richText, text, card, drawSpace, drawGhost, font } from "./core.js";
import { SCENES, CHAPTERS } from "./scenes.js";

const XFADE = 0.5;
const SUB_MAX = 24;

const tl = await fetch("data/timeline.json").then((r) => r.json());
setLand(await fetch("data/land-dots.json").then((r) => r.json()));
await loadFonts();

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
const layer = document.createElement("canvas");
layer.width = W;
layer.height = H;
const lctx = layer.getContext("2d");

const subs = buildSubtitles(tl);

// Fontsource splits CJK fonts by unicode-range, and canvas text does not trigger
// those subsets to load. Ask for every character the film uses up front.
async function loadFonts() {
  const sources = await Promise.all(
    ["js/scenes.js", "js/scenes-a.js", "js/scenes-b.js", "js/props.js", "js/main.js", "js/core.js", "data/timeline.json"].map((u) => fetch(u).then((r) => r.text())));
  const chars = [...new Set([...sources.join("")].filter((c) => c.charCodeAt(0) > 127))].join("") + "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+-.,:%";
  const faces = ["400 40px", "700 40px", "900 40px"].map((w) => `${w} "Noto Sans SC"`).concat(['400 40px "ZCOOL KuaiLe"']);
  await Promise.all(faces.map((f) => document.fonts.load(f, chars)));
  await document.fonts.ready;
}

/** Split each narration line into subtitle chunks timed by character count. */
function buildSubtitles(tl) {
  const out = [];
  for (const sc of tl.scenes) {
    for (const ln of sc.lines) {
      const tokens = ln.text.match(/[^，。！？：；、]+[，。！？：；、]*/g) || [ln.text];
      const chunks = [];
      let cur = "";
      const vis = (s) => s.replace(/[【】]/g, "").length;
      for (const tk of tokens) {
        if (cur && vis(cur + tk) > SUB_MAX) {
          chunks.push(cur);
          cur = tk;
        } else cur += tk;
      }
      if (cur) chunks.push(cur);
      const weights = chunks.map((c) => vis(c) + 1.5);
      const sum = weights.reduce((a, b) => a + b, 0);
      let t = ln.start;
      chunks.forEach((c, i) => {
        const d = ((ln.end - ln.start) * weights[i]) / sum;
        out.push({ text: c.replace(/[，。；、]+$/, ""), start: t, end: t + d, last: i === chunks.length - 1 });
        t += d;
      });
    }
  }
  return out;
}

function sceneState(sc, t) {
  const lt = Math.max(0, t - sc.start);
  const L = sc.lines.map((l) => ({ s: l.start - sc.start, e: l.end - sc.start }));
  return {
    t: lt,
    dur: sc.end - sc.start,
    L,
    /** seconds since line i began (negative before) */
    at: (i, off = 0) => lt - L[i].s - off,
    /** eased 0→1 over d seconds starting off seconds after line i began */
    p: (i, d = 0.6, off = 0) => ease.out(clamp((lt - L[i].s - off) / d)),
    raw: (i, d = 0.6, off = 0) => clamp((lt - L[i].s - off) / d),
  };
}

function drawScene(sc, t, alpha) {
  if (alpha <= 0) return;
  lctx.save();
  lctx.clearRect(0, 0, W, H);
  SCENES[sc.id](lctx, sceneState(sc, t));
  lctx.restore();
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(layer, 0, 0);
  ctx.restore();
}

function drawSubtitle(t) {
  const s = subs.find((x) => t >= x.start && t < x.end + (x.last ? 0.25 : 0));
  if (!s) return;
  const a = Math.min(clamp((t - s.start) / 0.12), clamp((s.end + (s.last ? 0.25 : 0) - t) / 0.12));
  ctx.save();
  ctx.font = font(50, 700);
  const w = ctx.measureText(s.text.replace(/[【】]/g, "")).width;
  card(ctx, W / 2 - w / 2 - 34, 950 - 38, w + 68, 78, { r: 39, fill: "rgba(2,8,22,0.62)", stroke: null, alpha: a });
  richText(ctx, s.text, W / 2, 951, { size: 50, weight: 700, color: "#ffffff", hi: C.yellow, alpha: a });
  ctx.restore();
}

function drawChrome(t, sc) {
  const chap = CHAPTERS[sc.id];
  if (chap) {
    const a = clamp((t - sc.start) / 0.5);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = font(26, 700);
    const w = ctx.measureText(chap).width + 44;
    card(ctx, 40, 34, w, 50, { r: 25, fill: "rgba(139,233,255,0.12)", stroke: "rgba(139,233,255,0.5)" });
    text(ctx, chap, 40 + w / 2, 60, { size: 26, color: C.ice });
    ctx.restore();
  }
  if (sc.id !== "title" && sc.id !== "hook") {
    text(ctx, "2026 诺贝尔物理学奖", W - 44, 60, { size: 24, weight: 700, align: "right", color: "rgba(255,211,107,0.8)" });
  }
  // progress line with a tiny ghost riding it
  const p = clamp(t / tl.duration);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(0, H - 6, W, 6);
  ctx.fillStyle = "rgba(139,233,255,0.7)";
  ctx.fillRect(0, H - 6, W * p, 6);
  drawGhost(ctx, W * p, H - 26, 11, t, { alpha: 0.9 });
}

export function renderAt(t) {
  t = clamp(t, 0, tl.duration);
  ctx.save();
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  drawSpace(ctx, t);
  const i = tl.scenes.findIndex((s) => t >= s.start && t < s.end);
  const idx = i < 0 ? tl.scenes.length - 1 : i;
  const sc = tl.scenes[idx];
  const prev = tl.scenes[idx - 1];
  const next = tl.scenes[idx + 1];
  if (prev && t < sc.start + XFADE / 2) {
    const k = ease.inOut((t - (sc.start - XFADE / 2)) / XFADE);
    drawScene(prev, t, 1 - k);
    drawScene(sc, t, k);
  } else if (next && t > sc.end - XFADE / 2) {
    const k = ease.inOut((t - (sc.end - XFADE / 2)) / XFADE);
    drawScene(sc, t, 1 - k);
    drawScene(next, t, k);
  } else {
    drawScene(sc, t, 1);
  }
  // fade in from black at the very start, out at the very end
  const edge = Math.min(clamp(t / 0.8), clamp((tl.duration - t) / 1.2));
  if (edge < 1) {
    ctx.fillStyle = `rgba(0,0,0,${1 - edge})`;
    ctx.fillRect(0, 0, W, H);
  }
  drawChrome(t, sc);
  drawSubtitle(t);
  ctx.restore();
}

window.renderAt = renderAt;
window.DURATION = tl.duration;
window.FPS = 30;

const params = new URLSearchParams(location.search);
if (params.has("render")) {
  document.body.classList.add("render");
  window.READY = true;
} else {
  const audio = document.getElementById("audio");
  const seek = document.getElementById("seek");
  const clock = document.getElementById("clock");
  const btn = document.getElementById("play");
  let start = params.has("t") ? parseFloat(params.get("t")) : 0;
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  audio.currentTime = start;
  btn.onclick = () => (audio.paused ? audio.play() : audio.pause());
  audio.onplay = () => { btn.textContent = "❚❚ 暂停"; document.body.classList.remove("paused"); };
  audio.onpause = () => { btn.textContent = "▶ 播放"; document.body.classList.add("paused"); };
  seek.oninput = () => { audio.currentTime = (seek.value / 1000) * tl.duration; };
  const loop = () => {
    const t = audio.currentTime || start;
    renderAt(t);
    seek.value = String(Math.round((t / tl.duration) * 1000));
    clock.textContent = `${fmt(t)} / ${fmt(tl.duration)}`;
    requestAnimationFrame(loop);
  };
  loop();
  window.READY = true;
}
