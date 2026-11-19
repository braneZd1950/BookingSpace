"""
Rebuild Blizari app icons with brand surface + adaptive-icon safe padding.

Android masks crop the outer ~18% of the 1024 canvas (visible ~66%).
CONTENT_RATIO ~0.54 fills most of that tile top→bottom without clipping the B.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(r"c:\Users\banbr\Desktop\Projekti\BookingApp")
MARK = ROOT / "mobile" / "assets" / "blizari-mark.png"
OUT_MOBILE = ROOT / "mobile" / "assets"
OUT_CLIENT = ROOT / "client" / "public" / "icons"

# Brand tokens (mobile/src/lib/brandColors.js)
BRAND_NAVY = (15, 23, 42)       # #0F172A
BRAND_BLUE = (37, 99, 235)      # #2563EB
BRAND_BLUE_DEEP = (30, 64, 175) # #1E40AF
BRAND_MID = (21, 35, 59)        # #15233B

# Mark size vs full canvas — ~top-to-bottom of the phone icon tile.
CONTENT_RATIO = 0.54


def trim_alpha(im: Image.Image, threshold: int = 12) -> Image.Image:
    if im.mode != "RGBA":
        im = im.convert("RGBA")
    alpha = im.split()[-1]
    bbox = alpha.point(lambda a: 255 if a > threshold else 0).getbbox()
    if not bbox:
        return im
    return im.crop(bbox)


def brand_gradient(size: int) -> Image.Image:
    """Blue → mid → navy, same feel as DARK_SURFACE.gradient."""
    im = Image.new("RGB", (size, size))
    draw = ImageDraw.Draw(im)
    stops = [
        (0.0, BRAND_BLUE_DEEP),
        (0.42, BRAND_MID),
        (1.0, BRAND_NAVY),
    ]
    for y in range(size):
        t = y / max(1, size - 1)
        for i in range(len(stops) - 1):
            t0, c0 = stops[i]
            t1, c1 = stops[i + 1]
            if t <= t1 or i == len(stops) - 2:
                local = 0 if t1 == t0 else (t - t0) / (t1 - t0)
                local = max(0.0, min(1.0, local))
                color = tuple(int(round(c0[j] + (c1[j] - c0[j]) * local)) for j in range(3))
                draw.line([(0, y), (size, y)], fill=color)
                break
    return im


def place_mark(
    mark: Image.Image,
    size: int,
    *,
    background: Image.Image | tuple[int, int, int, int] | None,
    content_ratio: float = CONTENT_RATIO,
) -> Image.Image:
    if isinstance(background, Image.Image):
        canvas = background.convert("RGBA")
        if canvas.size != (size, size):
            canvas = canvas.resize((size, size), Image.Resampling.LANCZOS)
    else:
        canvas = Image.new("RGBA", (size, size), background or (0, 0, 0, 0))
    target = max(1, int(round(size * content_ratio)))
    fitted = mark.copy()
    fitted.thumbnail((target, target), Image.Resampling.LANCZOS)
    x = (size - fitted.width) // 2
    y = (size - fitted.height) // 2
    canvas.alpha_composite(fitted, (x, y))
    return canvas


def save_rgb(im: Image.Image, path: Path) -> None:
    out = im.convert("RGB")
    path.parent.mkdir(parents=True, exist_ok=True)
    out.save(path, "PNG", optimize=True)
    print(f"wrote {path} ({out.size[0]}x{out.size[1]})")


def save_rgba(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "PNG", optimize=True)
    print(f"wrote {path} ({im.size[0]}x{im.size[1]})")


def main() -> None:
    mark = trim_alpha(Image.open(MARK))
    print(f"mark trimmed: {mark.size[0]}x{mark.size[1]}  content_ratio={CONTENT_RATIO}")

    bg1024 = brand_gradient(1024)

    # Expo master icon — brand surface + B
    icon = place_mark(mark, 1024, background=bg1024)
    save_rgb(icon, OUT_MOBILE / "icon.png")

    # Android adaptive: transparent FG (OS composites over backgroundColor/image)
    fg = place_mark(mark, 1024, background=None)
    save_rgba(fg, OUT_MOBILE / "android-icon-foreground.png")
    save_rgba(fg, OUT_MOBILE / "adaptive-icon.png")

    # Splash — same brand surface, slightly smaller mark
    splash = place_mark(mark, 1024, background=bg1024, content_ratio=0.42)
    save_rgb(splash, OUT_MOBILE / "splash-icon.png")

    # Favicon / web PWA
    fav_bg = brand_gradient(192)
    fav = place_mark(mark, 192, background=fav_bg)
    save_rgb(fav, OUT_MOBILE / "favicon.png")

    for name, size in (("icon-180.png", 180), ("icon-192.png", 192), ("icon-512.png", 512)):
        web = place_mark(mark, size, background=brand_gradient(size))
        save_rgb(web, OUT_CLIENT / name)

    bg_path = OUT_MOBILE / "android-icon-background.png"
    bg1024.save(bg_path, "PNG", optimize=True)
    print(f"wrote {bg_path}")


if __name__ == "__main__":
    main()
