#!/usr/bin/env python3
"""
Both decks, rendered to PDF from HTML.

    /tmp/logovenv/bin/python scripts/build-decks.py

Two decks, because they are for two different rooms:

    pitch/deck-see-the-future.html  -> pitch/BetterBarter-SEE-THE-FUTURE.pdf
        Columbia Climate School. The environmental thesis is the entry ticket,
        the impact model is the differentiator, and the honest concessions are
        the reason to believe the rest.

    pitch/deck-investor.html        -> pitch/BetterBarter-Investor.pdf
        Tessa's structure. Market, model, moat, money.

Both use pitch/deck.css, which is Tessa's palette with the ink fixed — see the
note at the top of that file for why every text pair in the original failed.

Slides are 1280x720 (16:9). Playwright drives headless Chromium, so what the
browser renders is what the PDF contains: web fonts, gradients, the lot.
"""

import asyncio
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

DECKS = [
    ("deck-see-the-future.html", "BetterBarter-SEE-THE-FUTURE.pdf"),
    ("deck-investor.html", "BetterBarter-Investor.pdf"),
]


async def render(page, src: pathlib.Path, out: pathlib.Path) -> None:
    await page.goto(src.as_uri(), wait_until="networkidle")
    # Webfonts decide the line breaks, so nothing is measured until they land.
    await page.evaluate("document.fonts.ready")
    await page.pdf(
        path=str(out),
        width="1280px",
        height="720px",
        print_background=True,
        margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
        prefer_css_page_size=True,
    )
    slides = await page.evaluate("document.querySelectorAll('.slide').length")
    # A slide taller than the page silently becomes two, which is the one
    # failure that looks fine in a browser and wrong in the PDF.
    over = await page.evaluate("""
        [...document.querySelectorAll('.slide')].map((s, i) => {
          const top = s.getBoundingClientRect().top;
          let worst = 0;
          // every descendant, not just the direct children — content nested in a
          // grid or a flex column is exactly where a slide silently overflows
          for (const el of s.querySelectorAll('*')) {
            if (el.classList.contains('blob') || el.classList.contains('bleed')) continue;
            const b = el.getBoundingClientRect().bottom - top;
            if (b > worst) worst = b;
          }
          return [i + 1, Math.round(worst)];
        }).filter(([, h]) => h > 706)
    """)
    kb = out.stat().st_size // 1024
    print(f"  {out.name}  ·  {slides} slides  ·  {kb} KB")
    if over:
        print(f"  ! slides overflowing 720px: {over}")


async def main() -> None:
    from playwright.async_api import async_playwright

    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        page = await browser.new_page(viewport={"width": 1280, "height": 720})
        for src_name, out_name in DECKS:
            src = ROOT / "pitch" / src_name
            if not src.exists():
                print(f"  ! missing {src_name}, skipped")
                continue
            await render(page, src, ROOT / "pitch" / out_name)
        await browser.close()


if __name__ == "__main__":
    print("Rendering decks…")
    asyncio.run(main())
    print("Done.")
