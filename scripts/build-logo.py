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

# ── The mark ────────────────────────────────────────────────────────────────
# Two B's facing each other, cut from Fredoka itself rather than drawn to look
# like it. The wordmark is set in Fredoka, so a monogram approximating it was
# always going to sit slightly wrong beside it — this is the same letter.
#
# The stem of Fredoka's B at weight 600 is exactly 152 units wide (38.5 to
# 190.5, measured by scanline, constant up the letter), so where the mirror line
# falls decides everything:
#
#   x = 114.5   the stems fully merge     one solid slab, four small holes
#   x = 38.5    the stems touch           a body, with the bowls as wings
#   x = 16      a 45-unit gap             two separate letters
#
# 38.5 is the one. The two stems together make a spine down the middle and the
# four bowls flare off it, which is a butterfly before it is a monogram — and it
# still holds at 16px, where the counters stay open.
FREDOKA_URL = (
    "https://raw.githubusercontent.com/google/fonts/main/ofl/fredoka/"
    "Fredoka%5Bwdth%2Cwght%5D.ttf"
)
MIRROR_AT = 38.5        # the two stems touch, making one body
GLYPH_BOX = (2 * MIRROR_AT - 590, 590, -8.75, 690.75)   # x0, x1, y0, y1

PINE = (28, 122, 79)        # kept for reference; the brand moved to lime
LIME = (223, 233, 88)       # #dfe958
INK = (20, 24, 10)          # #14180a


def fredoka_b() -> str:
    """The B outline as an SVG path, at weight 600."""
    from fontTools.ttLib import TTFont
    from fontTools.varLib.instancer import instantiateVariableFont
    from fontTools.pens.svgPathPen import SVGPathPen

    FONT_DIR.mkdir(exist_ok=True)
    dest = FONT_DIR / "Fredoka.ttf"
    if not dest.exists() or dest.stat().st_size < 100_000:
        req = urllib.request.Request(FREDOKA_URL, headers={"User-Agent": "curl/8"})
        with urllib.request.urlopen(req, timeout=60) as r:
            data = r.read()
        if data[:4] not in (b"\x00\x01\x00\x00", b"true", b"OTTO"):
            raise ValueError(f"not a TrueType file (magic {data[:4]!r})")
        dest.write_bytes(data)
        print(f"  fetched Fredoka ({len(data) // 1024} KB)")

    font = TTFont(dest)
    inst = instantiateVariableFont(font, {"wght": 600, "wdth": 100}, inplace=False)
    gs = inst.getGlyphSet()
    pen = SVGPathPen(gs)
    gs[inst.getBestCmap()[ord("B")]].draw(pen)
    return pen.getCommands()


def mark_transform(box: float = 100, pad: float = 8):
    """Fit the pair into a square box, flipping y from font space to SVG space."""
    x0, x1, y0, y1 = GLYPH_BOX
    w, h = x1 - x0, y1 - y0
    sc = (box - pad * 2) / max(w, h)
    tx = pad + (box - pad * 2 - w * sc) / 2 - x0 * sc
    ty = pad + (box - pad * 2 - h * sc) / 2 + y1 * sc
    return tx, ty, sc


def svg_mark(fill: str, d: str, box: float = 100, pad: float = 8) -> str:
    tx, ty, sc = mark_transform(box, pad)
    return (
        f'  <g transform="translate({tx:.3f} {ty:.3f}) scale({sc:.5f} -{sc:.5f})" fill="{fill}">\n'
        f'    <path d="{d}"/>\n'
        f'    <path d="{d}" transform="translate({2 * MIRROR_AT} 0) scale(-1 1)"/>\n'
        f'  </g>'
    )


# ── Rasteriser ───────────────────────────────────────────────────────────────
# The PNGs are rendered from the very SVG that ships, through the same browser
# engine, so a PNG icon and an SVG favicon can never disagree about the shape.


async def _shoot(pairs):
    from playwright.async_api import async_playwright

    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        for svg, out, size in pairs:
            tmp = ROOT / "scripts" / ".fonts" / "_render.svg"
            tmp.write_text(svg)
            page = await browser.new_page(viewport={"width": size, "height": size},
                                          device_scale_factor=1)
            await page.goto(tmp.as_uri())
            await page.screenshot(path=str(out), omit_background=True)
            await page.close()
            print(f"  wrote {out.relative_to(ROOT)}  ({size}x{size})")
        await browser.close()
    (ROOT / "scripts" / ".fonts" / "_render.svg").unlink(missing_ok=True)


def png_icons(d):
    import asyncio

    def tile(size, radius):
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" '
            f'width="{size}" height="{size}">\n'
            f'  <rect width="100" height="100" rx="{radius}" fill="#dfe958"/>\n'
            + svg_mark("#14180a", d, pad=14)
            + "\n</svg>"
        )

    asyncio.run(_shoot([
        (tile(192, 0), ROOT / "public/icon-192.png", 192),
        (tile(512, 0), ROOT / "public/icon-512.png", 512),
        (tile(512, 22), ROOT / "pitch/BetterBarter-icon-512.png", 512),
    ]))


def html_lockup(d, w=1000, h=270):
    """The wordmark, set in the real Fredoka from Google Fonts."""
    tx, ty, sc = mark_transform(100, 8)
    return f"""<!doctype html><meta charset=utf-8>
<link rel=stylesheet href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600&display=swap">
<style>
  html,body{{margin:0;padding:0}}
  body{{width:{w}px;height:{h}px;display:flex;align-items:center;gap:34px;padding-left:34px;
        box-sizing:border-box;background:transparent}}
  .w{{font-family:Fredoka,sans-serif;font-weight:600;font-size:{int(h*0.44)}px;
      letter-spacing:-0.028em;color:#14180a;line-height:1}}
</style>
<svg width="{int(h*0.62)}" height="{int(h*0.62)}" viewBox="0 0 100 100">
  <g transform="translate({tx:.3f} {ty:.3f}) scale({sc:.5f} -{sc:.5f})" fill="#14180a">
    <path d="{d}"/><path d="{d}" transform="translate({2*MIRROR_AT} 0) scale(-1 1)"/>
  </g>
</svg>
<div class=w>BetterBarter</div>"""


def png_lockup(d, w=1000, h=270):
    import asyncio
    from playwright.async_api import async_playwright

    async def go():
        async with async_playwright() as pw:
            b = await pw.chromium.launch()
            page = await b.new_page(viewport={"width": w, "height": h})
            tmp = ROOT / "scripts" / ".fonts" / "_lockup.html"
            tmp.write_text(html_lockup(d, w, h))
            await page.goto(tmp.as_uri(), wait_until="networkidle")
            await page.evaluate("document.fonts.ready")
            out = ROOT / "pitch/BetterBarter-logo.png"
            await page.screenshot(path=str(out), omit_background=True)
            await b.close()
            tmp.unlink(missing_ok=True)
            print(f"  wrote {out.relative_to(ROOT)}  ({w}x{h})")

    asyncio.run(go())


def main():
    print("Building every logo file from one glyph…")
    d = fredoka_b()

    (ROOT / "public/icon.svg").write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n'
        + svg_mark("#14180a", d) + "\n</svg>\n")
    print("  wrote public/icon.svg")

    (ROOT / "pitch/logomark.svg").write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n'
        '  <rect width="100" height="100" rx="22" fill="#dfe958"/>\n'
        + svg_mark("#14180a", d, pad=14) + "\n</svg>\n")
    print("  wrote pitch/logomark.svg")

    tx, ty, sc = mark_transform(100, 8)
    (ROOT / "pitch/logo.svg").write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 980 220" width="980" height="220">\n'
        '  <g transform="translate(24 40) scale(1.4)">\n'
        + svg_mark("#14180a", d) + "\n  </g>\n"
        '  <text x="196" y="140" font-family="Fredoka, sans-serif" font-size="104"\n'
        '        font-weight="600" letter-spacing="-3" fill="#14180a">BetterBarter</text>\n'
        "</svg>\n")
    print("  wrote pitch/logo.svg  (text needs Fredoka — use the PNG where it may be missing)")

    # the React component, from the same geometry
    (ROOT / "src/site/Mark.tsx").write_text(f'''/**
 * The mark: two B\'s, cut from Fredoka itself.
 *
 * The wordmark is set in Fredoka, so a monogram merely drawn to look like it
 * always sat slightly wrong beside it. This is the same letter, mirrored, with
 * a 45-unit gap between the stems — sharing the stem instead reads as one solid
 * slab rather than as two letters.
 *
 * Generated by scripts/build-logo.py. Do not edit the path by hand; change the
 * script and re-run it so the favicon, the PWA icons, the app tile and the
 * 1000x270 lockup all move together.
 */
const D =
  \'{d}\'

export function Mark({{ size = 20 }}: {{ size?: number }}) {{
  return (
    <svg
      width={{size}}
      height={{size}}
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden="true"
      style={{{{ display: \'block\', flex: \'none\' }}}}
    >
      <g transform="translate({tx:.3f} {ty:.3f}) scale({sc:.5f} -{sc:.5f})">
        <path d={{D}} />
        <path d={{D}} transform="translate({2*MIRROR_AT} 0) scale(-1 1)" />
      </g>
    </svg>
  )
}}
''')
    print("  wrote src/site/Mark.tsx")

    png_icons(d)
    png_lockup(d)
    print("Done.")


if __name__ == "__main__":
    main()
