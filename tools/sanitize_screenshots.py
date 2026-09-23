"""
Create public-safe derivatives of the WIMS reference screenshots.

Usage:
    python tools/sanitize_screenshots.py <source-screenshot-dir> [--out public/assets/screenshots]

The source directory is never modified. Every sensitive text region is painted
over with a solid fill sampled from the surrounding UI surface and, where the
interface needs a value to stay legible, redrawn with FICTIONAL demonstration
text in the application's own typeface (Hanken Grotesk / JetBrains Mono).
Nothing relies on blur alone. A third-party crest used as the application logo
is replaced with a neutral monogram.

All replacement values below are fictional. Do not add real well codes,
personnel names, client names or report file names to this file.
"""
from __future__ import annotations

import argparse
import sys
from collections import Counter
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FONT_SANS = ROOT / "node_modules/@fontsource-variable/hanken-grotesk/files/hanken-grotesk-latin-wght-normal.woff2"
FONT_MONO = ROOT / "node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2"

_font_cache: dict[tuple, ImageFont.FreeTypeFont] = {}


def font(size: int, weight: int = 400, mono: bool = False) -> ImageFont.FreeTypeFont:
    key = (size, weight, mono)
    if key not in _font_cache:
        f = ImageFont.truetype(str(FONT_MONO if mono else FONT_SANS), size)
        f.set_variation_by_axes([weight])
        _font_cache[key] = f
    return _font_cache[key]


def pixels(region: Image.Image):
    getter = getattr(region, "get_flattened_data", None) or region.getdata
    return list(getter())


def dominant(img: Image.Image, box) -> tuple:
    region = img.crop(box).convert("RGB")
    return Counter(pixels(region)).most_common(1)[0][0]


def contrast_color(img: Image.Image, box, bg) -> tuple:
    region = img.crop(box).convert("RGB")
    return max(pixels(region), key=lambda p: sum((a - b) ** 2 for a, b in zip(p, bg)))


class Editor:
    def __init__(self, path: Path):
        self.img = Image.open(path).convert("RGB")
        self.draw = ImageDraw.Draw(self.img)

    # Replace the text inside `box` with `text`. Colours are sampled from the
    # original pixels before painting, unless given explicitly.
    def text(self, box, text, size, weight=600, mono=False, fg=None, bg=None, align="left", pad=2):
        x0, y0, x1, y1 = box
        if bg == "column":
            # Surface is a horizontal gradient: repaint each column from a clean row above.
            ref_y = y0 - pad - 3
            fg = fg or contrast_color(self.img, box, self.img.getpixel((x0, ref_y)))
            for x in range(x0 - pad, x1 + pad + 1):
                self.draw.line((x, y0 - pad, x, y1 + pad), fill=self.img.getpixel((x, ref_y)))
        else:
            bg = bg or dominant(self.img, box)
            fg = fg or contrast_color(self.img, box, bg)
            self.draw.rectangle((x0 - pad, y0 - pad, x1 + pad, y1 + pad), fill=bg)
        if text:
            f = font(size, weight, mono)
            cy = (y0 + y1) / 2
            if align == "left":
                self.draw.text((x0, cy), text, font=f, fill=fg, anchor="lm")
            elif align == "right":
                self.draw.text((x1, cy), text, font=f, fill=fg, anchor="rm")
            else:
                self.draw.text(((x0 + x1) / 2, cy), text, font=f, fill=fg, anchor="mm")

    def fill(self, box, color=None):
        self.draw.rectangle(box, fill=color or dominant(self.img, box))

    def bar(self, track_box, fraction, color, track_color):
        x0, y0, x1, y1 = track_box
        r = (y1 - y0) // 2
        self.draw.rectangle((x0 - 2, y0 - 1, x1 + 2, y1 + 1), fill=self.bg_at(x0 - 4, y0 - 3))
        self.draw.rounded_rectangle(track_box, radius=r, fill=track_color)
        if fraction > 0:
            end = max(x0 + 2 * r, x0 + int((x1 - x0) * fraction))
            self.draw.rounded_rectangle((x0, y0, end, y1), radius=r, fill=color)

    def bg_at(self, x, y):
        return self.img.getpixel((x, y))

    def monogram(self, box, bg_fill=None):
        """Replace a logo with a neutral 'W' monogram tile."""
        x0, y0, x1, y1 = box
        self.fill(box, bg_fill)
        s = min(x1 - x0, y1 - y0)
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        tile = (cx - s / 2, cy - s / 2, cx + s / 2, cy + s / 2)
        self.draw.rounded_rectangle(tile, radius=max(4, s // 5), fill=(11, 34, 57))
        self.draw.text((cx, cy + 1), "W", font=font(int(s * 0.55), 800), fill=(94, 200, 229), anchor="mm")

    def save(self, out: Path, crop=None, max_width=1400):
        img = self.img.crop(crop) if crop else self.img
        if img.width > max_width:
            img = img.resize((max_width, round(img.height * max_width / img.width)), Image.LANCZOS)
        out.parent.mkdir(parents=True, exist_ok=True)
        img.save(out, "WEBP", quality=84, method=6)
        return img.size


# --------------------------------------------------------------------------
# Per-screenshot recipes. Coordinates are in original-image pixel space.
# --------------------------------------------------------------------------

def s01(e: Editor):
    # Blur everything outside the modal much further so no backdrop text survives.
    modal = (530, 312, 1090, 652)
    inner = e.img.crop(modal)
    mask = Image.new("L", inner.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, inner.width - 1, inner.height - 1), radius=26, fill=255)
    e.img = e.img.filter(ImageFilter.GaussianBlur(18))
    e.img.paste(inner, modal[:2], mask)
    e.draw = ImageDraw.Draw(e.img)
    e.text((587, 472, 1030, 494), "SAMPLE FINAL INSPECTION WELL-A07.xlsx", 18, 650)
    e.text((960, 531, 1034, 549), "18 / 42", 14, 600, align="right")
    return (440, 250, 1180, 715)


def s02(e: Editor):
    e.text((415, 284, 690, 307), "SAMPLE FINAL INSPECTION W...", 18, 650)
    e.text((713, 284, 900, 307), "WELL-E #02", 18, 650)
    e.text((1011, 284, 1200, 307), "PLATFORM E", 18, 650)
    e.text((436, 566, 600, 589), "All platforms", 18, 600)
    e.text((436, 664, 900, 689), "WELL-E02 — PLATFORM E — NON ACTIVE", 18, 600)
    e.text((436, 771, 600, 794), "WELL-E02", 18, 650)
    e.text((720, 771, 900, 794), "PLATFORM E", 18, 650)
    return (384, 34, 1326, 934)


def dashboard_header(e: Editor, logo_box):
    e.monogram(logo_box, (255, 255, 255))


def s03(e: Editor):
    dashboard_header(e, (28, 14, 68, 56))
    e.text((56, 166, 700, 184), "Same population as Valve Maintenance Visits: 120 Active 2026 inspection records with valve data.", 15, 400)
    e.text((420, 326, 520, 362), "45", 38, 800)
    e.text((916, 326, 1020, 362), "75", 38, 800)
    # headline totals (right aligned)
    e.text((1070, 541, 1137, 574), "120", 31, 800, align="right")
    e.text((1150, 541, 1258, 574), "1,100", 31, 800, align="right")
    e.text((1275, 541, 1378, 574), "850", 31, 800, align="right")
    e.text((1280, 642, 1379, 659), "765  ·  90%", 14, 700, mono=True, align="right")
    e.text((1280, 697, 1379, 714), "51  ·  6%", 14, 700, mono=True, align="right")
    e.text((1280, 752, 1379, 769), "9  ·  1%", 14, 700, mono=True, align="right")
    e.text((1280, 807, 1379, 824), "25  ·  3%", 14, 700, mono=True, align="right")
    track = (226, 232, 240)
    e.bar((356, 669, 1378, 680), 0.90, (16, 185, 129), track)
    e.bar((356, 724, 1378, 735), 0.06, (239, 44, 52), track)
    e.bar((356, 779, 1378, 790), 0.012, (250, 176, 5), track)
    e.bar((356, 834, 1378, 845), 0.03, (148, 163, 184), track)
    e.text((150, 745, 240, 782), "90%", 36, 800, align="center")
    e.text((100, 851, 290, 868), "250 excluded from score", 14, 600, align="center")
    e.text((372, 873, 900, 892), "Excluded: 250 Lock Open / Pneumatic / Production Choke records.", 15, 450)
    return (0, 0, 1440, 934)


def s04(e: Editor):
    e.text((106, 69, 700, 93), "12 Valve Maintenance positions need correction", 22, 700)
    rows = [
        (180, 208, "WELL-C15 · B-annulus Valve 1.1", "SAMPLE FINAL INSPECTION PLATFORM-C #15.xlsx", 187),
        (301, 330, "WELL-D05 · Swab Valve", "SAMPLE FINAL INSPECTION PLATFORM-D #05.xlsx", 180),
        (422, 451, "WELL-D05 · Wing Valve 1.1", "SAMPLE FINAL INSPECTION PLATFORM-D #05.xlsx", 180),
    ]
    for y_title, y_file, title, fname, x in rows:
        e.text((x, y_title - 13, 720, y_title + 13), title, 19, 600)
        e.text((31, y_file - 9, 520, y_file + 9), fname, 14, 400)
    return (0, 0, 1412, 508)


def s05(e: Editor):
    e.text((123, 124, 1010, 143), "Names are matched against the latest company roster. Review Work shows the exact well, file, and valve checks needing confirmation.", 14, 400, bg="column")
    e.text((1085, 74, 1180, 104), "6", 28, 800, align="right")
    e.text((1215, 74, 1360, 104), "14", 28, 800, align="right")
    names = [
        (255, 280, "INSPECTOR A", "Not found in roster — please confirm"),
        (368, 393, "INSPECTOR B", "Company roster matched"),
        (464, 489, "INSPECTOR C*", "Company roster matched"),
    ]
    for y_name, y_sub, name, sub in names:
        e.text((53, y_name - 11, 240, y_name + 11), name, 17, 700)
        e.text((53, y_sub - 8, 250, y_sub + 8), sub, 12, 650)
    e.text((53, 270, 295, 306), "", 12, bg=(255, 255, 255))  # clear the two-line status
    e.text((53, 272, 250, 288), "Not found in roster — please", 12, 650, fg=(194, 65, 12), bg=(255, 255, 255))
    e.text((53, 290, 250, 305), "confirm", 12, 650, fg=(194, 65, 12), bg=(255, 255, 255))
    e.text((53, 503, 250, 518), "Read as: INSPECTOR C", 12, 400)
    stats = [
        (274, ["18", "126 / 170", "124", "2", "44", "98%"]),
        (380, ["15", "110 / 142", "110", "0", "32", "100%"]),
        (486, ["12", "84 / 118", "81", "3", "34", "96%"]),
    ]
    cols = [(540, 600), (630, 740), (780, 840), (880, 930), (990, 1050), (1060, 1132)]
    for y, vals in stats:
        for (x0, x1), v in zip(cols, vals):
            weight = 800 if x0 == 1060 else 700
            size = 20 if x0 == 1060 else 18
            e.text((x0, y - 12, x1, y + 12), v, size, weight, align="center" if x0 != 1060 else "right")
    return (0, 14, 1437, 526)


def s06(e: Editor):
    dashboard_header(e, (33, 16, 73, 56))
    e.text((35, 209, 160, 230), "40 results", 18, 600)
    rows = [
        (360, "SAMPLE FINAL INSPECTION PLATFORM-B #28.xlsx", "WELL-B28", "PLATFORM B ·", "NON ACTIVE", "2026-03-", "18", "6", "Highest: High"),
        (473, "SAMPLE FINAL INSPECTION PLATFORM-Y #11.xlsx", "WELL-Y11", "PLATFORM Y ·", "NON ACTIVE", "2026-03-", "16", "3", "Highest:"),
        (585, "SAMPLE FINAL INSPECTION PLATFORM-B #32.xlsx", "WELL-B32", "PLATFORM B ·", "NON ACTIVE", "2026-03-", "16", "5", "Highest: High"),
        (696, "SAMPLE FINAL INSPECTION PLATFORM-B #22.xlsx", "WELL-B22", "PLATFORM B ·", "ACTIVE", "2026-03-", "15", "4", "Highest: High"),
        (808, "SAMPLE FINAL INSPECTION PLATFORM-Y #12.xlsx", "WELL-Y12", "PLATFORM Y ·", "ACTIVE", "2026-03-", "15", "2", "Highest:"),
    ]
    anomaly_y = [359, 461, 584, 695, 797]
    for (y, fname, well, plat, status, d1, d2, anom, high), ay in zip(rows, anomaly_y):
        e.text((56, y - 11, 460, y + 11), fname, 18, 500)
        e.text((56, y + 18, 220, y + 37), "Uploaded to library", 15, 400)
        e.fill((490, y - 24, 612, y + 50), (255, 255, 255))
        e.text((496, y - 20, 610, y + 3), well, 18, 500, fg=(15, 23, 42), bg=(255, 255, 255))
        e.text((496, y + 6, 610, y + 24), plat, 15, 400, fg=(100, 116, 139), bg=(255, 255, 255))
        e.text((496, y + 26, 610, y + 44), status, 15, 400, fg=(100, 116, 139), bg=(255, 255, 255))
        e.text((630, y - 22, 712, y - 3), d1, 16, 700, mono=True)
        e.text((630, y + 4, 712, y + 23), d2, 16, 700, mono=True)
        e.text((1014, ay - 13, 1070, ay + 12), anom, 18, 500)
    return (0, 0, 1440, 898)


def s07(e: Editor):
    e.monogram((19, 51, 79, 111), (255, 255, 255))
    e.monogram((350, 46, 384, 82), (255, 255, 255))
    e.text((370, 204, 460, 232), "40", 26, 800, mono=True)
    e.text((833, 204, 920, 232), "42", 26, 800, mono=True)
    rows = [
        (447, 471, "WELL-A08", "PLATFORM A · 1 visit", "2025-01-14", "2025-07-14"),
        (584, 608, "WELL-D02", "PLATFORM D · 1 visit", "2025-10-06", "2026-04-06"),
    ]
    for y, y2, well, plat, last, nxt in rows:
        e.text((370, y - 11, 560, y + 11), well, 19, 800)
        e.text((370, y2 - 9, 600, y2 + 9), plat, 14, 400)
        e.text((774, y + 11, 900, y + 31), last, 15, 700, mono=True)
        e.text((1068, y + 11, 1200, y + 31), nxt, 15, 700, mono=True)
    e.text((370, 709, 560, 731), "WELL-D13", 19, 800)
    return (0, 26, 1286, 736)


def s08(e: Editor):
    e.text((49, 216, 300, 258), "1,100", 44, 800, fg=(255, 255, 255))
    e.text((49, 265, 420, 283), "900 manual/other · 200 pneumatic", 15, 500, fg=(255, 255, 255))
    e.text((514, 216, 760, 258), "40", 44, 800, fg=(255, 255, 255))
    e.text((514, 265, 880, 283), "15 active · 25 non-active", 15, 500, fg=(255, 255, 255))
    e.text((978, 214, 1300, 242), "850 scored valves", 25, 800, fg=(255, 255, 255))
    redraw_trend(e)
    return (0, 0, 1411, 867)


def redraw_trend(e: Editor):
    """Replace the real cumulative series with a fictional illustrative one."""
    d = e.draw
    x0, x1 = 125, 1350
    y100, y0 = 454, 759
    white = (255, 255, 255)
    grid = (229, 231, 235)
    d.rectangle((x0 + 2, 440, 1395, 757), fill=white)
    d.rectangle((110, 762, 1395, 790), fill=white)
    for i in range(5):
        y = y0 - (y0 - y100) * i / 4
        if i:
            for x in range(x0 + 4, x1, 8):
                d.line((x, y, x + 4, y), fill=grid)
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    for i, m in enumerate(months):
        x = x0 + (x1 - x0) * i / 5
        for y in range(y100, y0, 8):
            d.line((x, y, x, y + 4), fill=grid)
        d.line((x, y0, x, y0 + 5), fill=(107, 114, 128))
        d.text((x, 775), m, font=font(14, 400), fill=(75, 85, 99), anchor="mm")
    # fictional cumulative pass % (deterministic)
    series = [0, 100, 100, 96, 94, 95, 93, 91, 90, 90.5, 91, 91.5, 90.8, 90.4, 90.9, 91.3, 91.8, 91.2,
              90.6, 90.9, 91.4, 91.9, 92.1, 91.6, 91.0, 90.7, 90.9, 91.2, 91.5, 91.3, 91.0, 90.8, 91.1,
              91.4, 91.6, 91.4, 91.2, 91.0, 91.1, 91.3]
    pts = []
    for i, v in enumerate(series):
        x = x0 + (x1 - x0) * i / (len(series) - 1)
        y = y0 - (y0 - y100) * v / 100
        pts.append((x, y))
    green = (16, 185, 129)
    d.line(pts, fill=green, width=4, joint="curve")
    for x, y in pts:
        d.ellipse((x - 5, y - 5, x + 5, y + 5), fill=white, outline=green, width=3)


RECIPES = {
    "01_auto_scan_report_import.png": ("01-auto-scan-import.webp", s01),
    "02_manual_well_mapping_qc.png": ("02-manual-well-mapping-qc.webp", s02),
    "03_operational_dashboard.png": ("03-operational-dashboard.webp", s03),
    "04_need_attention_corrections.png": ("04-need-attention-corrections.webp", s04),
    "05_crew_performance.png": ("05-crew-performance.webp", s05),
    "06_report_dictionary.png": ("06-report-dictionary.webp", s06),
    "07_visit_history_and_next_due.png": ("07-visit-history-next-due.webp", s07),
    "08_well_integrity_performance.png": ("08-performance-trend.webp", s08),
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("source")
    ap.add_argument("--out", default=str(ROOT / "public/assets/screenshots"))
    ap.add_argument("--only")
    args = ap.parse_args()
    src, out = Path(args.source), Path(args.out)
    for name, (out_name, recipe) in RECIPES.items():
        if args.only and args.only not in name:
            continue
        path = src / name
        if not path.exists():
            print(f"missing: {name}", file=sys.stderr)
            continue
        e = Editor(path)
        crop = recipe(e)
        size = e.save(out / out_name, crop)
        print(f"{out_name}: {size[0]}x{size[1]}  {(out / out_name).stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
