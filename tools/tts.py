"""Synthesize the narration line by line and lay out the film's timeline.

Each line becomes build/tts/NNN.wav; line and scene start/end times go to
web/data/timeline.json, which drives both the animation and the music mix.

  python3 tools/tts.py --models /path/to/sherpa-onnx-models

Models (sherpa-onnx GitHub releases):
  tts-models/matcha-icefall-zh-baker.tar.bz2
  vocoder-models/vocos-22khz-univ.onnx
"""
import argparse
import json
import re
from pathlib import Path

import numpy as np
import sherpa_onnx as so
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
SR = 44100
LINE_GAP = 0.32  # silence between two lines of the same scene, seconds


def build_tts(models: Path) -> so.OfflineTts:
    d = models / "matcha-icefall-zh-baker"
    cfg = so.OfflineTtsConfig(
        model=so.OfflineTtsModelConfig(
            matcha=so.OfflineTtsMatchaModelConfig(
                acoustic_model=str(d / "model-steps-3.onnx"),
                vocoder=str(models / "vocos-22khz-univ.onnx"),
                lexicon=str(d / "lexicon.txt"),
                tokens=str(d / "tokens.txt"),
                dict_dir=str(d / "dict"),
            ),
            num_threads=4,
        ),
        rule_fsts=f"{d}/phone.fst,{d}/date.fst,{d}/number.fst",
    )
    return so.OfflineTts(cfg)


def spoken(line: dict) -> str:
    # The model's lexicon has no entries for dashes or quote marks: a dash
    # becomes a comma pause and the decorative marks are dropped.
    text = line.get("say", line["text"]).replace("——", "，")
    return re.sub(r"[【】“”《》]", "", text)


def trim(samples: np.ndarray, sr: int, thresh=0.012, keep=0.04) -> np.ndarray:
    """Cut leading/trailing silence, keeping a few ms so plosives aren't clipped."""
    loud = np.flatnonzero(np.abs(samples) > thresh)
    if loud.size == 0:
        return samples
    pad = int(keep * sr)
    return samples[max(0, loud[0] - pad): loud[-1] + pad]


def resample(x: np.ndarray, sr_in: int, sr_out: int) -> np.ndarray:
    n = int(round(len(x) * sr_out / sr_in))
    return np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x).astype(np.float32)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--models", required=True, type=Path)
    ap.add_argument("--speed", type=float, default=1.15)
    args = ap.parse_args()

    script = json.loads((ROOT / "script/narration.json").read_text())
    out_dir = ROOT / "build/tts"
    out_dir.mkdir(parents=True, exist_ok=True)
    tts = build_tts(args.models)

    t = 0.0
    idx = 0
    clips = []
    scenes = []
    for scene in script["scenes"]:
        start = t
        t += scene.get("lead", 0.5)
        lines = []
        for k, line in enumerate(scene["lines"]):
            if k:
                t += LINE_GAP
            audio = tts.generate(spoken(line), sid=0, speed=args.speed)
            x = resample(trim(np.asarray(audio.samples, dtype=np.float32), audio.sample_rate),
                         audio.sample_rate, SR)
            sf.write(out_dir / f"{idx:03d}.wav", x, SR)
            dur = len(x) / SR
            lines.append({"i": idx, "text": line["text"], "start": round(t, 3),
                          "end": round(t + dur, 3), "sfx": line.get("sfx")})
            clips.append((t, x))
            print(f"{idx:03d} {dur:5.2f}s {spoken(line)}")
            t += dur
            idx += 1
        t += scene.get("tail", 0.5)
        scenes.append({"id": scene["id"], "start": round(start, 3), "end": round(t, 3), "lines": lines})

    total = round(t, 3)
    narration = np.zeros(int(total * SR) + SR, dtype=np.float32)
    for at, x in clips:
        i = int(at * SR)
        narration[i:i + len(x)] += x
    peak = np.abs(narration).max()
    narration *= 0.89 / peak
    sf.write(ROOT / "build/narration.wav", narration[: int(total * SR)], SR)

    (ROOT / "web/data/timeline.json").write_text(
        json.dumps({"title": script["title"], "duration": total, "scenes": scenes},
                   ensure_ascii=False, indent=1))
    print(f"total {total:.1f}s, {idx} lines")


if __name__ == "__main__":
    main()
