"""Renders how a cut-out image looks in the terminal sidebar, as a PNG to check by eye.

usage: python3 preview_png.py CUT.png OUT.png [--width 22]
Writes two panels side by side: half-block (left) and colored ASCII (right), on the sidebar's dark background.
"""
import sys
from PIL import Image, ImageDraw, ImageFont

BG = (20, 20, 20)
CW, CH = 10, 20  # one terminal cell in preview pixels
RAMP = ".:-=+*#%@"


def half_panel(img, w):
    h = max(2, round(img.height * w / img.width / 2) * 2)
    small = img.resize((w, h), Image.LANCZOS)
    out = Image.new("RGB", (w * CW, h // 2 * CH), BG)
    d = ImageDraw.Draw(out)
    for y in range(h):
        for x in range(w):
            r, g, b, a = small.getpixel((x, y))
            if a >= 128:
                top = (y // 2) * CH + (y % 2) * CH // 2
                d.rectangle([x * CW, top, x * CW + CW - 1, top + CH // 2 - 1], fill=(r, g, b))
    return out


def ascii_panel(img, w):
    h = max(1, round(img.height * w / img.width / 2))
    small = img.resize((w, h), Image.LANCZOS)
    out = Image.new("RGB", (w * CW, h * CH), BG)
    d = ImageDraw.Draw(out)
    font = ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", 16)
    for y in range(h):
        for x in range(w):
            r, g, b, a = small.getpixel((x, y))
            if a < 128:
                continue
            lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
            ch = RAMP[min(len(RAMP) - 1, int(lum * len(RAMP)))]
            d.text((x * CW, y * CH), ch, fill=(r, g, b), font=font)
    return out


def main():
    src, dst = sys.argv[1], sys.argv[2]
    w = int(sys.argv[sys.argv.index("--width") + 1]) if "--width" in sys.argv else 22
    img = Image.open(src).convert("RGBA")
    bbox = img.getchannel("A").point(lambda v: 255 if v >= 128 else 0).getbbox()
    img = img.crop(bbox)
    left, right = half_panel(img, w), ascii_panel(img, w)
    sheet = Image.new("RGB", (left.width + right.width + 40, max(left.height, right.height) + 20), BG)
    sheet.paste(left, (10, 10))
    sheet.paste(right, (left.width + 30, 10))
    sheet.save(dst)
    print(f"{w} cols x {left.height // CH} rows (half) / {right.height // CH} rows (ascii)")


if __name__ == "__main__":
    main()
