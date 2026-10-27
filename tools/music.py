"""Synthesize the soundtrack: background music, sound effects, and the final mix.

Reads web/data/timeline.json (scene and line times), script/narration.json
(sound-effect cues) and build/narration.wav, and writes build/mix.wav plus
web/data/soundtrack.m4a for the browser player.

Everything is generated from scratch with numpy (no samples), so it is
deterministic and royalty-free.

  python3 tools/music.py
"""
import json
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.ndimage import maximum_filter1d
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = Path(__file__).resolve().parent.parent
SR = 44100
RNG = np.random.default_rng(2026)

BPM = 92
BEAT = 60 / BPM
BAR = 4 * BEAT
# Dmaj7 – Bm7 – Gmaj7 – A, two bars each
CHORDS = [[62, 66, 69, 73], [59, 62, 66, 69], [55, 59, 62, 66], [57, 61, 64, 69]]
ROOTS = [38, 35, 31, 33]

# per scene: pad, arpeggio, bass, drums
MIX = {
    "hook": (0.8, 0.35, 0.0, 0.0), "title": (1.0, 0.9, 0.9, 0.5), "laureate": (0.8, 0.7, 0.6, 0.0),
    "ghost": (0.8, 0.8, 0.7, 0.3), "couriers": (0.8, 0.8, 0.8, 0.6), "bigdoor": (0.8, 0.8, 0.8, 0.5),
    "build": (0.8, 0.8, 0.8, 0.6), "detect": (0.9, 0.7, 0.8, 0.4), "discover": (0.9, 1.0, 0.9, 0.8),
    "why": (1.0, 1.0, 1.0, 0.8), "future": (1.0, 1.0, 1.0, 0.7), "outro": (1.0, 0.6, 0.3, 0.0),
}


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def lowpass(x, f, order=2):
    return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x)


def highpass(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)


def bandpass(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def tvec(dur):
    return np.arange(int(dur * SR)) / SR


def add(buf, at, x, gain=1.0, pan=0.0):
    """Mix mono x into stereo buf at time `at` (seconds) with equal-power pan."""
    i = int(at * SR)
    if i >= buf.shape[1]:
        return
    if i < 0:
        x, i = x[-i:], 0
    n = min(len(x), buf.shape[1] - i)
    a = (pan + 1) * np.pi / 4
    buf[0, i:i + n] += x[:n] * gain * np.cos(a)
    buf[1, i:i + n] += x[:n] * gain * np.sin(a)


# ------------------------------------------------------------------ instruments

def pad_voice(f, dur, detune=0.0):
    t = tvec(dur)
    f = f * 2 ** (detune / 1200)
    x = sum(np.sin(2 * np.pi * f * n * t + n) / n ** 1.6 for n in range(1, 6))
    env = np.minimum(1, t / 0.9) * np.minimum(1, (dur - t) / 1.2)
    return x * env * (0.85 + 0.15 * np.sin(2 * np.pi * 0.21 * t))


def pluck(f, dur=0.9, tau=0.28):
    t = tvec(dur)
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    return x * np.exp(-t / tau) * np.minimum(1, t / 0.004)


def bass_note(f, dur=1.0):
    t = tvec(dur)
    x = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)
    return x * np.exp(-t / 0.45) * np.minimum(1, t / 0.01)


def kick(dur=0.45):
    t = tvec(dur)
    f = 45 + 85 * np.exp(-t / 0.04)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.18)


def hat(dur=0.06):
    t = tvec(dur)
    return highpass(RNG.standard_normal(len(t)), 7000) * np.exp(-t / 0.012)


def clap(dur=0.25):
    t = tvec(dur)
    return bandpass(RNG.standard_normal(len(t)), 900, 2500) * np.exp(-t / 0.05)


# ------------------------------------------------------------------ sound effects

def sfx_whoosh(dur=0.9):
    t = tvec(dur)
    n = RNG.standard_normal(len(t))
    env = np.sin(np.pi * t / dur) ** 2
    lo = lowpass(n, 1200)
    hi = bandpass(n, 1500, 6000)
    return (lo * (1 - t / dur) + hi * (t / dur)) * env * 0.9


def sfx_boo(dur=0.9):
    t = tvec(dur)
    f = 280 + 260 * np.sin(np.pi * t / dur) + 12 * np.sin(2 * np.pi * 6 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph)
    return lowpass(x, 1800) * np.sin(np.pi * t / dur) ** 0.6 * 0.6


def sfx_boom(dur=2.2):
    t = tvec(dur)
    f = 32 + 70 * np.exp(-t / 0.12)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.7)
    noise = lowpass(RNG.standard_normal(len(t)), 500) * np.exp(-t / 0.25) * 0.5
    shimmer = sum(np.sin(2 * np.pi * hz(m) * t) for m in (74, 78, 81)) * np.exp(-t / 0.9) * 0.08 * np.minimum(1, t / 0.05)
    return (body + noise + shimmer) * 0.9


def bell(f, dur=1.6, tau=0.55):
    t = tvec(dur)
    x = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / (tau / r ** 0.5)) for r, a in ((1, 1), (2.76, 0.4), (5.4, 0.15)))
    return x * np.minimum(1, t / 0.003)


def sfx_chime():
    out = np.zeros(int(2.0 * SR))
    for k, m in enumerate((86, 90, 93)):
        b = bell(hz(m))
        i = int(k * 0.09 * SR)
        out[i:i + len(b)] += b[: len(out) - i] * 0.45
    return out


def sfx_pop(dur=0.16):
    t = tvec(dur)
    f = 380 + 900 * (1 - np.exp(-t / 0.03))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.045) * 0.8


def sfx_thud(dur=0.4):
    t = tvec(dur)
    f = 55 + 80 * np.exp(-t / 0.03)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12)
    return x + lowpass(RNG.standard_normal(len(t)), 900) * np.exp(-t / 0.02) * 0.4


def sfx_wobble(dur=0.9):
    t = tvec(dur)
    f = 360 - 120 * t / dur + 70 * np.sin(2 * np.pi * 7 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) + 0.3 * np.sin(2 * ph)) * np.sin(np.pi * t / dur) * 0.45


def sfx_drill(dur=1.4):
    t = tvec(dur)
    f = 110 + 25 * t
    ph = 2 * np.pi * np.cumsum(f) / SR
    buzz = sum(np.sin(n * ph) / n for n in range(1, 9))
    am = 0.6 + 0.4 * np.sin(2 * np.pi * 19 * t)
    grit = bandpass(RNG.standard_normal(len(t)), 800, 3000) * 0.25
    return lowpass(buzz * am + grit, 2500) * np.minimum(1, t / 0.08) * np.minimum(1, (dur - t) / 0.3) * 0.35


def sfx_zap(dur=0.35):
    t = tvec(dur)
    f = 200 + 2200 * np.exp(-t / 0.06)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.tanh(3 * np.sin(ph)) * np.exp(-t / 0.12) * 0.4


def sfx_sparkle(dur=1.0):
    out = np.zeros(int(dur * SR) + SR)
    for k in range(7):
        b = bell(RNG.uniform(1800, 4200), 0.6, 0.18)
        i = int(RNG.uniform(0, dur * 0.7) * SR)
        out[i:i + len(b)] += b * 0.22
    return out


def sfx_alert():
    out = np.zeros(int(1.3 * SR))
    for k in range(6):
        t = tvec(0.17)
        f = 880 if k % 2 == 0 else 660
        x = np.tanh(2 * np.sin(2 * np.pi * f * t)) * np.minimum(1, t / 0.005) * np.minimum(1, (0.17 - t) / 0.02)
        i = int(k * 0.2 * SR)
        out[i:i + len(x)] += x * 0.28
    return out


SFX = {
    "whoosh": (sfx_whoosh, 0.55), "boo": (sfx_boo, 0.6), "boom": (sfx_boom, 0.9), "chime": (sfx_chime, 0.5),
    "pop": (sfx_pop, 0.5), "thud": (sfx_thud, 0.7), "wobble": (sfx_wobble, 0.55), "drill": (sfx_drill, 0.6),
    "zap": (sfx_zap, 0.6), "sparkle": (sfx_sparkle, 0.55), "alert": (sfx_alert, 0.6),
}


# ------------------------------------------------------------------ build

def mix_curve(timeline, total, k):
    """Per-sample level for instrument k, crossfading ~1.5 s between scenes."""
    knots_t, knots_v = [], []
    for sc in timeline["scenes"]:
        v = MIX[sc["id"]][k]
        knots_t += [sc["start"] + 0.75, sc["end"] - 0.75]
        knots_v += [v, v]
    return np.interp(np.arange(total) / SR, knots_t, knots_v)


def reverb(x, seconds=2.6, decay=0.55):
    t = tvec(seconds)
    irs = []
    for ch in range(2):
        ir = RNG.standard_normal(len(t)) * np.exp(-t / decay)
        irs.append(lowpass(ir, 5000) / np.sqrt(np.sum(ir ** 2)))
    return np.stack([fftconvolve(x[c], irs[c])[: x.shape[1]] for c in range(2)])


def main():
    tl = json.loads((ROOT / "web/data/timeline.json").read_text())
    script = json.loads((ROOT / "script/narration.json").read_text())
    narr, sr = sf.read(ROOT / "build/narration.wav", dtype="float32")
    assert sr == SR
    total = int(tl["duration"] * SR) + SR
    narr = np.pad(narr, (0, total - len(narr)))

    # beat grid: put a downbeat exactly where the title card lands
    title = next(s for s in tl["scenes"] if s["id"] == "title")["start"]
    origin = title - np.ceil(title / BAR) * BAR

    music = np.zeros((4, 2, total))  # pad, arp, bass, drums
    n_bars = int((tl["duration"] - origin) / BAR) + 2
    for b in range(n_bars):
        t0 = origin + b * BAR
        ci = (b // 2) % 4
        if b % 2 == 0:
            for m in CHORDS[ci] + [CHORDS[ci][0] - 12]:
                for det, pan in ((-5, -0.6), (5, 0.6)):
                    add(music[0], t0 - 0.3, pad_voice(hz(m), 2 * BAR + 1.6, det), 0.05, pan)
        pattern = [0, 1, 2, 3, 2, 1, 2, 3]
        for s in range(8):
            m = CHORDS[ci][pattern[s]] + 12
            vel = 1.0 if s % 2 == 0 else 0.7
            add(music[1], t0 + s * BEAT / 2, pluck(hz(m)), 0.08 * vel, -0.35 if s % 2 else 0.35)
        for beat in (0, 2.5):
            add(music[2], t0 + beat * BEAT, bass_note(hz(ROOTS[ci])), 0.22)
        for beat in (0, 2):
            add(music[3], t0 + beat * BEAT, kick(), 0.35)
        for beat in (1, 3):
            add(music[3], t0 + beat * BEAT, clap(), 0.07)
        for s in range(8):
            add(music[3], t0 + s * BEAT / 2 + BEAT / 4, hat(), 0.05, 0.3)

    bus = np.zeros((2, total))
    for k in range(4):
        bus += music[k] * mix_curve(tl, total, k)

    # fade the music in at the start and out over the end card
    tt = np.arange(total) / SR
    bus *= np.clip(tt / 2.0, 0, 1) * np.clip((tl["duration"] - tt) / 4.0, 0, 1)

    # duck under the voice
    env = maximum_filter1d(np.abs(narr), int(0.08 * SR))
    env = lowpass(env, 2.5)
    env = np.clip(env / np.percentile(env[env > 0.01], 90), 0, 1)
    bus *= 1 - 0.62 * env

    # sound effects
    fx = np.zeros((2, total))
    lines = [ln for sc in script["scenes"] for ln in sc["lines"]]
    tlines = [ln for sc in tl["scenes"] for ln in sc["lines"]]
    for src, ln in zip(lines, tlines):
        if src.get("sfx"):
            fn, g = SFX[src["sfx"]]
            add(fx, ln["start"] + src.get("sfxAt", 0.0), fn(), g, float(RNG.uniform(-0.25, 0.25)))
    for sc in tl["scenes"][1:]:
        add(fx, sc["start"] - 0.45, sfx_whoosh(0.9), 0.18)

    wet = reverb(bus * 0.6 + fx * 0.5)
    out = bus + fx + 0.28 * wet
    out += np.stack([narr, narr]) * 1.0
    out = np.tanh(out * 1.1) / np.tanh(1.1)  # gentle soft clip
    out *= 0.89 / np.max(np.abs(out))
    out = out[:, : int(tl["duration"] * SR)]

    sf.write(ROOT / "build/mix.wav", out.T, SR, subtype="PCM_16")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(ROOT / "build/mix.wav"), "-c:a", "aac",
                    "-b:a", "128k", str(ROOT / "web/data/soundtrack.m4a")], check=True)
    print(f"wrote build/mix.wav and web/data/soundtrack.m4a ({out.shape[1] / SR:.1f}s)")


if __name__ == "__main__":
    main()
