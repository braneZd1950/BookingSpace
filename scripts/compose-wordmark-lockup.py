"""Compose Blizari lockup: ribbon mark as leading b + 'lizari' text."""
from PIL import Image
import os

ICONS = r'c:\Users\banbr\Desktop\Projekti\BookingApp\client\public\icons'
OUT_W, OUT_H = 1024, 299


def tight_crop(im, alpha_thresh=12, pad=2):
    px = im.load()
    w, h = im.size
    xs, ys = [], []
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > alpha_thresh:
                # skip near-black fully opaque bg sometimes left in mark exports
                r, g, b, a = px[x, y]
                if a > 200 and r + g + b < 18:
                    continue
                xs.append(x)
                ys.append(y)
    if not xs:
        return im.copy()
    box = (
        max(0, min(xs) - pad),
        max(0, min(ys) - pad),
        min(w, max(xs) + 1 + pad),
        min(h, max(ys) + 1 + pad),
    )
    return im.crop(box)


def black_to_alpha(im, thresh=28):
    """Turn solid black (or near-black) background into transparency."""
    out = im.copy()
    px = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if r <= thresh and g <= thresh and b <= thresh:
                px[x, y] = (0, 0, 0, 0)
    return out


def find_gaps(im, alpha_thresh=40):
    w, h = im.size
    px = im.load()
    cols = [sum(1 for y in range(h) if px[x, y][3] > alpha_thresh) for x in range(w)]
    start = next(i for i, v in enumerate(cols) if v > 5)
    end = max(i for i, v in enumerate(cols) if v > 5)
    gaps = []
    in_gap = False
    gs = None
    for x in range(start, w):
        if cols[x] < 3:
            if not in_gap:
                in_gap = True
                gs = x
        else:
            if in_gap and gs is not None and x - gs >= 2:
                gaps.append((gs, x))
            in_gap = False
    return start, end, gaps, cols


def crop_lizari(wordmark_path):
    im = Image.open(wordmark_path).convert('RGBA')
    start, end, gaps, _ = find_gaps(im)
    # first gap is between b and l
    lizari_x0 = gaps[0][1]
    # vertical tight crop of remaining letters
    crop = im.crop((lizari_x0, 0, end + 1, im.size[1]))
    return tight_crop(crop, pad=0)


def compose(mark, lizari, canvas_w=OUT_W, canvas_h=OUT_H, gap_ratio=0.045):
    # Scale mark to letter height of lizari (full glyph height)
    target_h = lizari.size[1]
    scale = target_h / mark.size[1]
    mark_w = max(1, int(round(mark.size[0] * scale)))
    mark_r = mark.resize((mark_w, target_h), Image.Resampling.LANCZOS)

    gap = max(8, int(round(target_h * gap_ratio)))
    content_w = mark_r.size[0] + gap + lizari.size[0]
    content_h = max(mark_r.size[1], lizari.size[1])

    # Fit into canvas with padding
    pad_x = max(8, int((canvas_w - content_w) / 2))
    pad_y = max(8, int((canvas_h - content_h) / 2))
    # If too wide, scale whole lockup down
    max_w = canvas_w - 16
    max_h = canvas_h - 16
    scale2 = min(1.0, max_w / content_w, max_h / content_h)
    if scale2 < 1.0:
        mark_r = mark_r.resize(
            (max(1, int(mark_r.size[0] * scale2)), max(1, int(mark_r.size[1] * scale2))),
            Image.Resampling.LANCZOS,
        )
        lizari = lizari.resize(
            (max(1, int(lizari.size[0] * scale2)), max(1, int(lizari.size[1] * scale2))),
            Image.Resampling.LANCZOS,
        )
        gap = max(6, int(gap * scale2))
        content_w = mark_r.size[0] + gap + lizari.size[0]
        content_h = max(mark_r.size[1], lizari.size[1])
        pad_x = max(8, int((canvas_w - content_w) / 2))
        pad_y = max(8, int((canvas_h - content_h) / 2))

    canvas = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))
    y_mark = pad_y + (content_h - mark_r.size[1]) // 2
    y_text = pad_y + (content_h - lizari.size[1]) // 2
    canvas.alpha_composite(mark_r, (pad_x, y_mark))
    canvas.alpha_composite(lizari, (pad_x + mark_r.size[0] + gap, y_text))
    return canvas


def main():
    mark = Image.open(os.path.join(ICONS, 'blizari-mark.png')).convert('RGBA')
    mark = black_to_alpha(mark, thresh=24)
    mark = tight_crop(mark, pad=4)

    lizari_dark = crop_lizari(os.path.join(ICONS, 'blizari-wordmark.png'))
    lizari_light = crop_lizari(os.path.join(ICONS, 'blizari-wordmark-on-dark.png'))

    dark = compose(mark, lizari_dark)   # navy text for light backgrounds
    light = compose(mark, lizari_light)  # white text for dark backgrounds

    dark_path = os.path.join(ICONS, 'blizari-wordmark.png')
    light_path = os.path.join(ICONS, 'blizari-wordmark-on-dark.png')
    dark.save(dark_path, optimize=True)
    light.save(light_path, optimize=True)
    print('mark cropped', mark.size)
    print('lizari dark', lizari_dark.size, 'light', lizari_light.size)
    print('wrote', dark_path, dark.size)
    print('wrote', light_path, light.size)


if __name__ == '__main__':
    main()
