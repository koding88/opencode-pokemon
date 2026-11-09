"""Image -> colored terminal art, for previewing the sidebar idea.

usage: python3 img2ansi.py IMAGE [--width 36] [--mode half|ascii] [--crop x0,y0,x1,y1] [--key]

half  : '▀' half-blocks, 2 pixels per cell (top = fg, bottom = bg) -> most faithful
ascii : one character per cell picked by brightness, colored -> "real ASCII" look
--key : treat near-background pixels (sampled from the corners) as transparent
"""
import argparse
from PIL import Image, ImageOps

RAMP = " .:-=+*#%@"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("image")
    ap.add_argument("--width", type=int, default=36)
    ap.add_argument("--mode", choices=["half", "ascii"], default="half")
    ap.add_argument("--crop")
    ap.add_argument("--key", action="store_true")
    ap.add_argument("--tol", type=int, default=60)
    a = ap.parse_args()

    img = ImageOps.exif_transpose(Image.open(a.image)).convert("RGBA")
    if a.crop:
        img = img.crop(tuple(int(v) for v in a.crop.split(",")))
    if a.key:
        w, h = img.size
        corners = [img.getpixel(p)[:3] for p in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]]
        px = img.load()
        for y in range(h):
            for x in range(w):
                r, g, b, _ = px[x, y]
                if min(abs(r - c[0]) + abs(g - c[1]) + abs(b - c[2]) for c in corners) < a.tol:
                    px[x, y] = (0, 0, 0, 0)

    bbox = img.getchannel("A").point(lambda v: 255 if v >= 128 else 0).getbbox()
    if bbox:
        img = img.crop(bbox)

    w = a.width
    if a.mode == "half":
        h = max(2, round(img.height * w / img.width / 2) * 2)  # cells are ~2x taller than wide
        small = img.resize((w, h), Image.LANCZOS)
        for y in range(0, h, 2):
            line = []
            for x in range(w):
                t, b = small.getpixel((x, y)), small.getpixel((x, y + 1))
                if t[3] < 128 and b[3] < 128:
                    line.append("\x1b[0m ")
                elif b[3] < 128:
                    line.append(f"\x1b[0m\x1b[38;2;{t[0]};{t[1]};{t[2]}m▀")
                elif t[3] < 128:
                    line.append(f"\x1b[0m\x1b[38;2;{b[0]};{b[1]};{b[2]}m▄")
                else:
                    line.append(f"\x1b[38;2;{t[0]};{t[1]};{t[2]};48;2;{b[0]};{b[1]};{b[2]}m▀")
            print("".join(line) + "\x1b[0m")
    else:
        h = max(1, round(img.height * w / img.width / 2))
        small = img.resize((w, h), Image.LANCZOS)
        for y in range(h):
            line = []
            for x in range(w):
                r, g, b, al = small.getpixel((x, y))
                if al < 128:
                    line.append(" ")
                    continue
                lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
                ch = RAMP[min(len(RAMP) - 1, 1 + int(lum * (len(RAMP) - 1)))]
                line.append(f"\x1b[38;2;{r};{g};{b}m{ch}")
            print("".join(line) + "\x1b[0m")


if __name__ == "__main__":
    main()
