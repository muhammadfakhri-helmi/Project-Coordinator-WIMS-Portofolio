"""
Resize the pre-redacted documentary photographs into the files the site uses.

Usage:
    python3 tools/build_documentary.py [--src portfolio-assets/oses-project-coordinator/real-documentary]

Input: the five PNGs, already redacted by the owner (projected slides,
documents, logos, readable names and client data covered before upload).
Output: public/assets/documentary/<name>-{640,1024,1600}.{avif,webp}.
Only resizing and re-encoding happen here: no generative edits, no retouching.
EXIF and other metadata are dropped.
"""
from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
NAMES = [
    "01-real-spr-presentation",
    "02-real-crew-planning",
    "03-real-project-review",
    "04-real-client-performance-review",
    "05-real-hse-review",
]
WIDTHS = (640, 1024, 1600)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=str(ROOT / "portfolio-assets/oses-project-coordinator/real-documentary"))
    ap.add_argument("--out", default=str(ROOT / "public/assets/documentary"))
    args = ap.parse_args()
    src, out = Path(args.src), Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    for name in NAMES:
        path = next((p for p in (src / f"{name}{ext}" for ext in (".png", ".jpg", ".jpeg", ".webp")) if p.exists()), None)
        if not path:
            print(f"missing: {name}")
            continue
        im = Image.open(path)
        im = im.convert("RGB")  # drops alpha and metadata
        for w in WIDTHS:
            # never upscale: a small source is written at its own size
            r = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS) if w < im.width else im
            r.save(out / f"{name}-{w}.webp", "WEBP", quality=80, method=6)
            r.save(out / f"{name}-{w}.avif", "AVIF", quality=55)
        print(f"{name}: {im.width}x{im.height}")


if __name__ == "__main__":
    main()
