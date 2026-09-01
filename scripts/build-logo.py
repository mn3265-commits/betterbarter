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
# Two B's sharing one spine, drawn rather than cut from the typeface.
#
# The Fredoka glyph version was tried on 31 August in three spacings and reverted
# on Agung's call. Real letterforms are filled, so two of them make a heavy block
# whichever way they are spaced; these strokes stay open, which is what lets the
# mark hold at 16px and sit lightly beside a wordmark that is already solid.
#
# One known reading: the spine runs past the bowls top and bottom, which is the
# construction of the Bitcoin B. In lime with a wordmark beside it that has not
# been a problem, but it is the thing to watch if the mark ever appears alone.
MARK_PATHS = [
    'M50 16v68',                          # the spine both letters hang on
    'M50 22h13a14 14 0 0 1 0 28H50',      # right B, upper bowl
    'M50 50h15a14 14 0 0 1 0 28H50',      # right B, lower bowl (wider, as a B is)
    'M50 22H37a14 14 0 0 0 0 28h13',      # mirrored B, upper bowl
    'M50 50H35a14 14 0 0 0 0 28h15',      # mirrored B, lower bowl
]

LIME = (223, 233, 88)       # #dfe958
INK = (20, 24, 10)          # #14180a

FREDOKA_URL = (
    "https://raw.githubusercontent.com/google/fonts/main/ofl/fredoka/"
    "Fredoka%5Bwdth%2Cwght%5D.ttf"
)


def fredoka_ttf():
    """Only the wordmark needs the font now; the mark is drawn."""
    FONT_DIR.mkdir(exist_ok=True)
    dest = FONT_DIR / "Fredoka.ttf"
    if not dest.exists() or dest.stat().st_size < 100_000:
        req = urllib.request.Request(FREDOKA_URL, headers={"User-Agent": "curl/8"})
        with urllib.request.urlopen(req, timeout=60) as r:
            data = r.read()
        dest.write_bytes(data)
        print(f"  fetched Fredoka ({len(data) // 1024} KB)")
    return dest


def svg_mark(stroke: str, width: float = 8.5) -> str:
    paths = "\n".join(f'    <path d="{d}"/>' for d in MARK_PATHS)
    return (
        f'  <g fill="none" stroke="{stroke}" stroke-width="{width}" '
        f'stroke-linecap="round" stroke-linejoin="round">\n{paths}\n  </g>'
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


def png_icons():
    import asyncio

    def tile(size, radius, width):
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" '
            f'width="{size}" height="{size}">\n'
            f'  <rect width="100" height="100" rx="{radius}" fill="#dfe958"/>\n'
            + svg_mark("#14180a", width)
            + "\n</svg>"
        )

    asyncio.run(_shoot([
        (tile(192, 0, 9), ROOT / "public/icon-192.png", 192),
        (tile(512, 0, 9), ROOT / "public/icon-512.png", 512),
        (tile(512, 22, 9), ROOT / "pitch/BetterBarter-icon-512.png", 512),
    ]))


def html_lockup(w=1000, h=270):
    """The wordmark, set in the real Fredoka, beside the drawn mark."""
    return f"""<!doctype html><meta charset=utf-8>
<link rel=stylesheet href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600&display=swap">
<style>
  html,body{{margin:0;padding:0}}
  body{{width:{w}px;height:{h}px;display:flex;align-items:center;gap:30px;padding-left:30px;
        box-sizing:border-box;background:transparent}}
  .w{{font-family:Fredoka,sans-serif;font-weight:600;font-size:{int(h*0.44)}px;
      letter-spacing:-0.028em;color:#14180a;line-height:1}}
</style>
<svg width="{int(h*0.66)}" height="{int(h*0.66)}" viewBox="0 0 100 100">
{svg_mark("#14180a", 8.5)}
</svg>
<div class=w>BetterBarter</div>"""


def png_lockup(w=1000, h=270):
    import asyncio
    from playwright.async_api import async_playwright

    fredoka_ttf()

    async def go():
        async with async_playwright() as pw:
            b = await pw.chromium.launch()
            page = await b.new_page(viewport={"width": w, "height": h})
            tmp = ROOT / "scripts" / ".fonts" / "_lockup.html"
            tmp.write_text(html_lockup(w, h))
            await page.goto(tmp.as_uri(), wait_until="networkidle")
            await page.evaluate("document.fonts.ready")
            out = ROOT / "pitch/BetterBarter-logo.png"
            await page.screenshot(path=str(out), omit_background=True)
            await b.close()
            tmp.unlink(missing_ok=True)
            print(f"  wrote {out.relative_to(ROOT)}  ({w}x{h})")

    asyncio.run(go())


def main():
    print("Building every logo file from one geometry…")

    (ROOT / "public/icon.svg").write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n'
        + svg_mark("#14180a") + "\n</svg>\n")
    print("  wrote public/icon.svg")

    (ROOT / "pitch/logomark.svg").write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n'
        '  <rect width="100" height="100" rx="22" fill="#dfe958"/>\n'
        + svg_mark("#14180a", 9) + "\n</svg>\n")
    print("  wrote pitch/logomark.svg")

    (ROOT / "pitch/logo.svg").write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 980 220" width="980" height="220">\n'
        '  <g transform="translate(20 38) scale(1.44)">\n'
        + svg_mark("#14180a") + "\n  </g>\n"
        '  <text x="188" y="140" font-family="Fredoka, sans-serif" font-size="104"\n'
        '        font-weight="600" letter-spacing="-3" fill="#14180a">BetterBarter</text>\n'
        "</svg>\n")
    print("  wrote pitch/logo.svg  (text needs Fredoka — use the PNG where it may be missing)")

    paths = "\n        ".join(f"<path d=\"{d}\" />" for d in MARK_PATHS)
    (ROOT / "src/site/Mark.tsx").write_text(f'''/**
 * The mark: two B\'s sharing one spine.
 *
 * Drawn rather than cut from Fredoka. The glyph version was tried on 31 August
 * and reverted: real letterforms are filled, so two of them make a heavy block
 * however they are spaced, while these strokes stay open — which is what lets
 * the mark hold at 16px and sit lightly beside a wordmark that is already solid.
 *
 * Generated by scripts/build-logo.py. Do not edit by hand; change the script and
 * re-run it so the favicon, the PWA icons, the app tile and the 1000x270 lockup
 * all move together.
 */
export function Mark({{ size = 20, strokeWidth }}: {{ size?: number; strokeWidth?: number }}) {{
  // Small sizes need a heavier stroke or the counters close up and it greys out.
  const w = strokeWidth ?? (size <= 18 ? 10 : size <= 28 ? 9 : 8.5)
  return (
    <svg
      width={{size}}
      height={{size}}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth={{w}}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{{{ display: \'block\', flex: \'none\' }}}}
    >
        {paths}
    </svg>
  )
}}
''')
    print("  wrote src/site/Mark.tsx")

    png_icons()
    png_lockup()
    print("Done.")


if __name__ == "__main__":
    main()
