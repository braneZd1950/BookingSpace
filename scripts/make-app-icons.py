"""
Rebuild Blizari app icons with Android adaptive-icon safe padding.

Android masks crop the outer ~18% of the 1024 canvas. Content should sit
inside ~66% of the canvas so the full "B" mark stays visible.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(r"c:\Users\banbr\Desktop\Projekti\BookingApp")
MARK = ROOT / "mobile" / "assets" / "blizari-mark.png"
OUT_MOBILE = ROOT / "mobile" / "assets"
OUT_CLIENT = ROOT / "client" / "public" / "icons"

# Fraction of canvas used by the mark (centered).
# Keep well under Android's ~0.66 safe zone so the B reads like a logo glyph
# (Facebook-style), not a cropped circle.
CONTENT_RATIO = 0.38


def trim_alpha(im: Image.Image, threshold: int = 12) -> Image.Image:
    if im.mode != "RGBA":
        im = im.convert("RGBA")
    alpha = im.split()[-1]
    bbox = alpha.point(lambda a: 255 if a > threshold else 0).getbbox()
    if not bbox:
        return im
    return im.crop(bbox)


def place_mark(
    mark: Image.Image,
    size: int,
    *,
    background: tuple[int, int, int, int] | None,
    content_ratio: float = CONTENT_RATIO,
) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), background or (0, 0, 0, 0))
    target = max(1, int(round(size * content_ratio)))
    fitted = mark.copy()
    fitted.thumbnail((target, target), Image.Resampling.LANCZOS)
    x = (size - fitted.width) // 2
    y = (size - fitted.height) // 2
    canvas.alpha_composite(fitted, (x, y))
    return canvas


def save_rgb(im: Image.Image, path: Path, bg=(255, 255, 255)) -> None:
    out = Image.new("RGB", im.size, bg)
    out.paste(im, mask=im.split()[-1])
    path.parent.mkdir(parents=True, exist_ok=True)
    out.save(path, "PNG", optimize=True)
    print(f"wrote {path} ({out.size[0]}x{out.size[1]})")


def save_rgba(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "PNG", optimize=True)
    print(f"wrote {path} ({im.size[0]}x{im.size[1]})")


def main() -> None:
    mark = trim_alpha(Image.open(MARK))
    print(f"mark trimmed: {mark.size[0]}x{mark.size[1]}")

    # Expo master icon (opaque white)
    icon = place_mark(mark, 1024, background=(255, 255, 255, 255))
    save_rgb(icon, OUT_MOBILE / "icon.png")

    # Android adaptive foreground — transparent, padded for mask crop
    fg = place_mark(mark, 1024, background=None)
    save_rgba(fg, OUT_MOBILE / "android-icon-foreground.png")
    save_rgba(fg, OUT_MOBILE / "adaptive-icon.png")

    # Splash — same clean mark on white, a bit smaller feel via same ratio
    splash = place_mark(mark, 1024, background=(255, 255, 255, 255), content_ratio=0.42)
    save_rgb(splash, OUT_MOBILE / "splash-icon.png")

    # Favicon / smaller web icons
    fav = place_mark(mark, 192, background=(255, 255, 255, 255))
    save_rgb(fav, OUT_MOBILE / "favicon.png")

    # Keep web PWA icons consistent
    for name, size in (("icon-180.png", 180), ("icon-192.png", 192), ("icon-512.png", 512)):
        web = place_mark(mark, size, background=(255, 255, 255, 255))
        save_rgb(web, OUT_CLIENT / name)

    # Solid white adaptive background (already expected)
    bg = Image.new("RGB", (1024, 1024), (255, 255, 255))
    bg_path = OUT_MOBILE / "android-icon-background.png"
    bg.save(bg_path, "PNG", optimize=True)
    print(f"wrote {bg_path}")


if __name__ == "__main__":
    main()
