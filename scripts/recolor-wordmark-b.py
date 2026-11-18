from PIL import Image
import os

base = r'c:\Users\banbr\Desktop\Projekti\BookingApp\client\public\icons'

# Gradient stops aligned to blizari-mark (top cyan -> brand blue -> deep blue)
STOPS = [
    (0.00, (14, 185, 248)),
    (0.28, (20, 160, 245)),
    (0.52, (37, 99, 235)),  # brand #2563EB
    (0.78, (8, 96, 220)),
    (1.00, (0, 72, 200)),
]


def lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


def gradient_color(t):
    t = max(0.0, min(1.0, t))
    for i in range(len(STOPS) - 1):
        t0, c0 = STOPS[i]
        t1, c1 = STOPS[i + 1]
        if t <= t1:
            local = 0 if t1 == t0 else (t - t0) / (t1 - t0)
            return lerp(c0, c1, local)
    return STOPS[-1][1]


def find_first_letter_x_range(im, alpha_thresh=40):
    w, h = im.size
    px = im.load()
    cols = [sum(1 for y in range(h) if px[x, y][3] > alpha_thresh) for x in range(w)]
    start = next(i for i, v in enumerate(cols) if v > 5)
    in_gap = False
    gap_start = None
    end = None
    for x in range(start, w):
        if cols[x] < 3:
            if not in_gap:
                in_gap = True
                gap_start = x
        else:
            if in_gap and gap_start is not None and (x - gap_start) >= 2 and gap_start > start + 20:
                end = gap_start
                break
            in_gap = False
    if end is None:
        end = start + int(w * 0.22)
    return start, end


def recolor_b(path, ink_mode='dark'):
    im = Image.open(path).convert('RGBA')
    w, h = im.size
    px = im.load()
    x0, x1 = find_first_letter_x_range(im)
    ys = [y for x in range(x0, x1) for y in range(h) if px[x, y][3] > 40]
    y0, y1 = min(ys), max(ys)
    span = max(1, y1 - y0)

    out = im.copy()
    opx = out.load()
    changed = 0
    for x in range(x0, x1):
        for y in range(h):
            r, g, b, a = px[x, y]
            if a < 20:
                continue
            if ink_mode == 'dark':
                if r + g + b > 180:
                    continue
            else:
                if r + g + b < 500:
                    continue
            t = (y - y0) / span
            nr, ng, nb = gradient_color(t)
            opx[x, y] = (nr, ng, nb, a)
            changed += 1
    out.save(path, optimize=True)
    print(f'{os.path.basename(path)}: B x={x0}-{x1}, y={y0}-{y1}, pixels={changed}')


recolor_b(os.path.join(base, 'blizari-wordmark.png'), ink_mode='dark')
recolor_b(os.path.join(base, 'blizari-wordmark-on-dark.png'), ink_mode='light')
print('done')
