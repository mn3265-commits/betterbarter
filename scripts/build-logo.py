#!/usr/bin/env python3
"""
Every logo file, cut from one geometry.

The old identity drifted into two unrelated marks because each file was drawn by
hand, separately. This script is the fix: the mark is defined once, here and in
src/site/Mark.tsx, and everything else is generated.

    /tmp/logovenv/bin/python scripts/build-logo.py

Writes:
    public/icon.svg                     favicon, mark in pine on nothing
    public/icon-192.png                 PWA icon, white on pine
    public/icon-512.png                 PWA icon + maskable
    pitch/logomark.svg                  512x512 app icon for the submission
    pitch/logo.svg                      wordmark lockup (text needs Fraunces)
    pitch/BetterBarter-logo.png         1000x270 lockup, text rendered from the
                                        real font so it does not depend on the
                                        viewer having it installed

Needs Pillow. Fraunces is downloaded once to scripts/.fonts/ and cached; if the
download fails the PNG lockup is skipped and everything else still builds, with
a warning — a missing PNG is better than a PNG in the wrong typeface.
"""

import math
import pathlib
import re
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
FONT_DIR = pathlib.Path(__file__).resolve().parent / ".fonts"

PINE = (28, 122, 79)        # #1c7a4f
PAPER = (241, 243, 239)     # #f1f3ef

# ── The mark, on a 100x100 grid ──────────────────────────────────────────────
# Kept identical to MARK_PATHS in src/site/Mark.tsx. Two B's, one spine.
MARK_PATHS = [
    "M50 16v68",
    "M50 22h13a14 14 0 0 1 0 28H50",
    "M50 50h15a14 14 0 0 1 0 28H50",
    "M50 22H37a14 14 0 0 0 0 28h13",
    "M50 50H35a14 14 0 0 0 0 28h15",
]

# The same shapes as primitives, for the rasteriser. Segments are either a
# straight line or a semicircular arc; both are drawn as round-capped strokes so
# they match the SVG exactly.
#   ("line", x1, y1, x2, y2)
#   ("arc", cx, cy, r, start_deg, end_deg)   angles clockwise from +x, y down
MARK_PRIMS = [
    ("line", 50, 16, 50, 84),                 # spine
    ("line", 50, 22, 63, 22),                 # right upper bowl
    ("arc", 63, 36, 14, -90, 90),
    ("line", 63, 50, 50, 50),
    ("line", 50, 50, 65, 50),                 # right lower bowl
    ("arc", 65, 64, 14, -90, 90),
    ("line", 65, 78, 50, 78),
    ("line", 50, 22, 37, 22),                 # mirrored upper bowl
    ("arc", 37, 36, 14, 90, 270),
    ("line", 37, 50, 50, 50),
    ("line", 50, 50, 35, 50),                 # mirrored lower bowl
    ("arc", 35, 64, 14, 90, 270),
    ("line", 35, 78, 50, 78),
]


def svg_mark(stroke: str, width: float = 8.5) -> str:
    paths = "\n".join(f'    <path d="{d}"/>' for d in MARK_PATHS)
    return (
        f'  <g fill="none" stroke="{stroke}" stroke-width="{width}" '
        f'stroke-linecap="round" stroke-linejoin="round">\n{paths}\n  </g>'
    )


# ── Rasteriser ───────────────────────────────────────────────────────────────
# Drawn at 6x and downsampled, which is cheaper than antialiasing by hand and
# gives cleaner joins than PIL's own arc drawing at final size.
SS = 6


def draw_mark(draw, ox, oy, scale, width, colour):
    """Stroke the mark with round caps, by stamping discs along each segment."""
    r = width * scale / 2.0

    def dot(x, y):
        draw.ellipse([x - r, y - r, x + r, y + r], fill=colour)

    def to_px(x, y):
        return ox + x * scale, oy + y * scale

    for prim in MARK_PRIMS:
        if prim[0] == "line":
            _, x1, y1, x2, y2 = prim
            ax, ay = to_px(x1, y1)
            bx, by = to_px(x2, y2)
            steps = max(2, int(math.hypot(bx - ax, by - ay) / max(1.0, r * 0.25)))
            for i in range(steps + 1):
                t = i / steps
                dot(ax + (bx - ax) * t, ay + (by - ay) * t)
        else:
            _, cx, cy, rad, a0, a1 = prim
            px, py = to_px(cx, cy)
            rr = rad * scale
            steps = max(8, int(abs(a1 - a0) / 1.2))
            for i in range(steps + 1):
                a = math.radians(a0 + (a1 - a0) * i / steps)
                dot(px + rr * math.cos(a), py + rr * math.sin(a))


def png_icon(path, size, fg, bg, corner=None, pad_ratio=0.22, width=9.0):
    from PIL import Image, ImageDraw

    big = size * SS
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if bg is not None:
        if corner:
            d.rounded_rectangle([0, 0, big - 1, big - 1], radius=int(corner * SS), fill=bg)
        else:
            d.rectangle([0, 0, big, big], fill=bg)

    inner = big * (1 - pad_ratio * 2)
    draw_mark(d, big * pad_ratio, big * pad_ratio, inner / 100.0, width, fg)

    img = img.resize((size, size), Image.LANCZOS)
    img.save(path)
    print(f"  wrote {path.relative_to(ROOT)}  ({size}x{size})")


# ── Fraunces, for the wordmark ───────────────────────────────────────────────
# The upstream repository ships the real variable TTF, which Pillow can read.
# Google Fonts' CSS endpoint hands back a subset in a private format instead —
# it downloads fine and then fails to parse, which is a confusing way to fail.
FRAUNCES_URL = (
    "https://raw.githubusercontent.com/googlefonts/fraunces/master/fonts/"
    "Fraunces%5BSOFT%2CWONK%2Copsz%2Cwght%5D.ttf"
)


def fraunces():
    FONT_DIR.mkdir(exist_ok=True)
    dest = FONT_DIR / "Fraunces.ttf"
    if dest.exists() and dest.stat().st_size > 200_000:
        return dest
    try:
        req = urllib.request.Request(FRAUNCES_URL, headers={"User-Agent": "curl/8"})
        with urllib.request.urlopen(req, timeout=60) as r:
            data = r.read()
        if data[:4] not in (b"\x00\x01\x00\x00", b"true", b"OTTO"):
            raise ValueError(f"not a TrueType file (magic {data[:4]!r})")
        dest.write_bytes(data)
        print(f"  fetched Fraunces ({len(data) // 1024} KB)")
        return dest
    except Exception as exc:  # noqa: BLE001
        print(f"  ! could not fetch Fraunces: {exc}")
        return None


def png_lockup(path, w=1000, h=270):
    from PIL import Image, ImageDraw, ImageFont

    font_path = fraunces()
    if font_path is None:
        print("  ! skipping the PNG lockup — it would be in the wrong typeface")
        return

    big_w, big_h = w * 2, h * 2
    img = Image.new("RGBA", (big_w, big_h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    mark_box = big_h * 0.66
    mark_x = big_h * 0.17
    mark_y = (big_h - mark_box) / 2
    draw_mark(d, mark_x, mark_y, mark_box / 100.0, 8.5, PINE)

    size = int(big_h * 0.46)
    font = ImageFont.truetype(str(font_path), size)

    # The axis order is the font's, not the filename's. Fraunces' filename reads
    # [SOFT,WONK,opsz,wght]; the font actually orders them opsz, wght, SOFT,
    # WONK. Passing the filename's order silently clamped wght to its minimum
    # and rendered the wordmark hairline-thin — set them by name and let a
    # mismatch raise, rather than swallowing it and shipping the wrong weight.
    axes = {}
    for i, a in enumerate(font.get_variation_axes()):
        name = a["name"].decode() if isinstance(a["name"], bytes) else a["name"]
        axes[name] = i
    values = [a["default"] for a in font.get_variation_axes()]
    for name, want in (("Optical Size", 120.0), ("Weight", 600.0),
                       ("Softness", 80.0), ("Wonky", 1.0)):
        values[axes[name]] = want          # KeyError here is the right failure
    font.set_variation_by_axes(values)

    text = "BetterBarter"
    tx = mark_x + mark_box + big_h * 0.20
    bbox = d.textbbox((0, 0), text, font=font)
    ty = (big_h - (bbox[3] - bbox[1])) / 2 - bbox[1]
    d.text((tx, ty), text, font=font, fill=PINE)

    img.resize((w, h), Image.LANCZOS).save(path)
    print(f"  wrote {path.relative_to(ROOT)}  ({w}x{h})")


def main():
    print("Building every logo file from one geometry…")

    (ROOT / "public/icon.svg").write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n'
        + svg_mark("#1c7a4f")
        + "\n</svg>\n"
    )
    print("  wrote public/icon.svg")

    (ROOT / "pitch/logomark.svg").write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">\n'
        '  <rect width="512" height="512" rx="112" fill="#1c7a4f"/>\n'
        '  <g transform="translate(112 112) scale(2.88)">\n'
        + svg_mark("#f1f3ef", 9)
        + "\n  </g>\n</svg>\n"
    )
    print("  wrote pitch/logomark.svg")

    (ROOT / "pitch/logo.svg").write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 980 220" width="980" height="220">\n'
        '  <g transform="translate(36 44) scale(1.32)">\n'
        + svg_mark("#1c7a4f")
        + "\n  </g>\n"
        '  <text x="216" y="146" font-family="Fraunces, Georgia, serif" font-size="104"\n'
        "        font-weight=\"600\" font-variation-settings=\"'SOFT' 100, 'WONK' 1, 'opsz' 120\"\n"
        '        letter-spacing="-3" fill="#1c7a4f">BetterBarter</text>\n'
        "</svg>\n"
    )
    print("  wrote pitch/logo.svg  (text needs Fraunces — use the PNG where it may be missing)")

    png_icon(ROOT / "public/icon-192.png", 192, PAPER, PINE, corner=0, pad_ratio=0.20, width=9)
    png_icon(ROOT / "public/icon-512.png", 512, PAPER, PINE, corner=0, pad_ratio=0.20, width=9)
    png_icon(ROOT / "pitch/BetterBarter-icon-512.png", 512, PAPER, PINE, corner=112, pad_ratio=0.22, width=9)
    png_lockup(ROOT / "pitch/BetterBarter-logo.png")

    print("Done.")


if __name__ == "__main__":
    main()
