"""Draws scene rows ({text, fg, bg} segments) as a PNG, side by side, like a dark terminal would."""
import json
import sys
from PIL import Image, ImageDraw, ImageFont

CW, CH, BG = 10, 20, (20, 20, 20)
font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Unicode.ttf", 14)
rgb = lambda c: tuple(int(c[i : i + 2], 16) for i in (1, 3, 5))

scenes = json.load(open(sys.argv[1]))
panels = []
for rows in scenes.values():
    width = sum(len(seg["text"]) for seg in rows[0])
    im = Image.new("RGB", (width * CW, len(rows) * CH), BG)
    d = ImageDraw.Draw(im)
    for y, row in enumerate(rows):
        x = 0
        for seg in row:
            fg = rgb(seg["fg"]) if seg.get("fg") else (200, 200, 200)
            bg = rgb(seg["bg"]) if seg.get("bg") else None
            for ch in seg["text"]:
                X, Y = x * CW, y * CH
                if bg:
                    d.rectangle([X, Y, X + CW - 1, Y + CH - 1], fill=bg)
                if ch == "▀":
                    d.rectangle([X, Y, X + CW - 1, Y + CH // 2 - 1], fill=fg)
                elif ch == "▄":
                    d.rectangle([X, Y + CH // 2, X + CW - 1, Y + CH - 1], fill=fg)
                elif ch != " ":
                    d.text((X + 1, Y + 2), ch, fill=fg, font=font)
                x += 1
    panels.append(im)

sheet = Image.new("RGB", (sum(p.width for p in panels) + 10 * (len(panels) + 1), max(p.height for p in panels) + 20), (45, 45, 45))
x = 10
for p in panels:
    sheet.paste(p, (x, 10))
    x += p.width + 10
sheet.save(sys.argv[2])
print("wrote", sys.argv[2])
