"""Rebuild browser favicons from blizari-mark.png with a transparent canvas."""
from __future__ import annotations

import base64
import io
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ICONS = ROOT / 'client' / 'public' / 'icons'
MARK = ICONS / 'blizari-mark.png'


def square_icon(src: Image.Image, size: int, pad_ratio: float = 0.02) -> Image.Image:
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    inner = max(1, int(size * (1 - 2 * pad_ratio)))
    fitted = src.copy()
    fitted.thumbnail((inner, inner), Image.Resampling.LANCZOS)
    x = (size - fitted.width) // 2
    y = (size - fitted.height) // 2
    canvas.paste(fitted, (x, y), fitted)
    return canvas


def main() -> None:
    mark = Image.open(MARK).convert('RGBA')
    for size, name in ((32, 'favicon-32.png'), (64, 'favicon-64.png')):
        out = square_icon(mark, size)
        out.save(ICONS / name, format='PNG', optimize=True)
        print('wrote', name, out.size)

    # Transparent SVG favicon (no white plate) — embed 192px mark for crisp tabs.
    embedded = square_icon(mark, 192, pad_ratio=0.02)
    buf = io.BytesIO()
    embedded.save(buf, format='PNG', optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode('ascii')
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" role="img" aria-label="Blizari">
  <image href="data:image/png;base64,{b64}" x="0" y="0" width="192" height="192" preserveAspectRatio="xMidYMid meet"/>
</svg>
'''
    (ICONS / 'icon.svg').write_text(svg, encoding='utf-8', newline='\n')
    print('wrote icon.svg (transparent)')


if __name__ == '__main__':
    main()
