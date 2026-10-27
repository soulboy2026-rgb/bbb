// Render the film frame by frame in headless Chromium and encode it with ffmpeg.
//
//   node tools/render.mjs --stills 3,20,95 [--outdir build/stills]   # PNG spot checks
//   node tools/render.mjs [--workers 4] [--fps 30] [--audio build/mix.wav] [--out out/video.mp4]
//
// Every frame is drawn by window.renderAt(t), a pure function of time, so the
// frame range can be split across several browsers and the pieces concatenated.

import { createServer } from "node:http";
import { readFile, mkdir, writeFile, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { extname, join, resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]?.startsWith("--") ? true : all[i + 1] ?? true]] : acc), []));

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".woff2": "font/woff2", ".woff": "font/woff", ".m4a": "audio/mp4" };

function serve() {
  const server = createServer(async (req, res) => {
    try {
      const path = join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname));
      if (!path.startsWith(ROOT)) throw new Error("outside root");
      const body = await readFile(path);
      res.writeHead(200, { "content-type": TYPES[extname(path)] ?? "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok(server)));
}

async function openPage(browser, port) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.error("[page error]", e.message));
  page.on("console", (m) => m.type() === "error" && console.error("[console]", m.text()));
  await page.goto(`http://127.0.0.1:${port}/web/index.html?render=1`);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 120000 });
  return page;
}

const grab = (page) => page.screenshot({ type: "jpeg", quality: 93, clip: { x: 0, y: 0, width: 1920, height: 1080 } });

function run(cmd, argv, opts = {}) {
  return new Promise((ok, fail) => {
    const p = spawn(cmd, argv, { stdio: opts.stdin ? ["pipe", "ignore", "inherit"] : ["ignore", "ignore", "inherit"] });
    p.on("exit", (code) => (code === 0 ? ok() : fail(new Error(`${cmd} exited ${code}`))));
    if (opts.stdin) opts.stdin(p.stdin);
  });
}

async function stills(port) {
  const times = String(args.stills).split(",").map(Number);
  const outdir = resolve(ROOT, args.outdir ?? "build/stills");
  await mkdir(outdir, { recursive: true });
  const browser = await chromium.launch();
  const page = await openPage(browser, port);
  for (const t of times) {
    await page.evaluate((t) => window.renderAt(t), t);
    const file = join(outdir, `t${String(t).padStart(6, "0")}.png`);
    await writeFile(file, await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: 1920, height: 1080 } }));
    console.log(file);
  }
  await browser.close();
}

async function video(port) {
  const fps = Number(args.fps ?? 30);
  const workers = Number(args.workers ?? 4);
  const out = resolve(ROOT, args.out ?? "out/ghost-particle-hunter.mp4");
  const segDir = resolve(ROOT, "build/segments");
  await rm(segDir, { recursive: true, force: true });
  await mkdir(segDir, { recursive: true });
  await mkdir(resolve(out, ".."), { recursive: true });

  const probe = await chromium.launch();
  const duration = await (await openPage(probe, port)).evaluate(() => window.DURATION);
  await probe.close();
  // --range a:b renders only seconds a..b (handy for preview clips)
  const [r0, r1] = args.range ? String(args.range).split(":").map(Number) : [0, duration];
  const first = Math.floor(r0 * fps);
  const total = Math.ceil(Math.min(duration, r1) * fps) - first;
  const per = Math.ceil(total / workers);
  console.log(`${total} frames @ ${fps} fps, ${workers} workers`);
  const t0 = Date.now();

  const done = new Array(workers).fill(0);
  const tick = setInterval(() => {
    const n = done.reduce((a, b) => a + b, 0);
    const el = (Date.now() - t0) / 1000;
    console.log(`  ${n}/${total} frames, ${el.toFixed(0)}s elapsed, ~${((el / Math.max(1, n)) * (total - n)).toFixed(0)}s left`);
  }, 15000);

  await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const from = first + w * per, to = first + Math.min(total, (w + 1) * per);
    const browser = await chromium.launch();
    const page = await openPage(browser, port);
    await run("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-",
      "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-r", String(fps), join(segDir, `seg${w}.mp4`)], {
      stdin: async (stdin) => {
        for (let f = from; f < to; f++) {
          await page.evaluate((t) => window.renderAt(t), f / fps);
          const buf = await grab(page);
          if (!stdin.write(buf)) await new Promise((ok) => stdin.once("drain", ok));
          done[w]++;
        }
        stdin.end();
        await browser.close();
      },
    });
  }));
  clearInterval(tick);

  const list = join(segDir, "list.txt");
  await writeFile(list, Array.from({ length: workers }, (_, w) => `file '${join(segDir, `seg${w}.mp4`)}'`).join("\n"));
  const audio = args.audio ? ["-i", resolve(ROOT, args.audio)] : [];
  await run("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, ...audio,
    "-c:v", "copy", ...(args.audio ? ["-c:a", "aac", "-b:a", "192k", "-shortest"] : []), "-movflags", "+faststart", out]);
  console.log(`wrote ${out} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}

const server = await serve();
const port = server.address().port;
try {
  if (args.stills) await stills(port);
  else await video(port);
} finally {
  server.close();
}
