"""Brings the kit's masterplan up to the latest Belmont Estates site plan.

The latest plan keeps the streets and all 74 homesites of the kit's "BEL 25000 Master Plan Update v2", and changes these:
- five shared lakes across the rear of the homesites, which stay part of each lot, with the lot lines dotted across them;
- a house pad on every homesite, set toward the street;
- no trail along the north boundary;
- green space where the kit shows the far north-east pond, and along the east edge.

The latest plan was supplied only as a photo, so tools/plan-latest.json holds what was traced from it after matching the
photo to the kit's streets: the lakes, the green space and the pads, in map units, and which homesites touch a lake.
This redraws the rest from the kit's own vectors. It writes:
- img/site-plan.webp: the plan artwork;
- img/masterplan.webp: the kit's poster with that artwork and a longer legend;
- js/plan-data.js: adds the lakes, each homesite's pad and whether it backs onto a lake.

Run from the project folder, after kit_site_data.py and before kit_geo.py:
  python -I tools/kit_plan_update.py "<path to the unzipped Belmont Estates kit folder>" "<path to PublicSans[wght].ttf>"
"""
import json
import math
import sys
from pathlib import Path

import cv2
import fitz
import numpy as np
from PIL import Image, ImageDraw, ImageFont

KIT, FONT = Path(sys.argv[1]), sys.argv[2]
LATEST = json.loads(Path('tools/plan-latest.json').read_text(encoding='utf-8'))
X0, Y0, X1, Y1 = 180, 180, 885, 680        # the map area of the masterplan, in PDF points (one point = one map unit)
OUT = 3.2                                  # output pixels per map unit
R = OUT * 2                                # drawn at twice that, then scaled down for clean edges
LAKE_EDGE, LAKE_CORE = (0x4B, 0x78, 0x94), (0x7D, 0xB2, 0xC6)
SHORE = (0xF3, 0xEC, 0xDC)
GREEN = (0x6A, 0x8C, 0x78)
LINE = (0.46, 0.5, 0.49)                   # the kit's lot line colour


def rgb(c):
    return np.array(c, np.float32)


def px(pts):
    return np.round(np.asarray(pts, np.float64) * R).astype(np.int32)


def fill(shape, polys, grow=0.0):
    m = np.zeros(shape, np.uint8)
    for p in polys:
        cv2.fillPoly(m, [px(p)], 255, lineType=cv2.LINE_AA)
    if grow:
        k = int(grow * R) * 2 + 1
        m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))
    return m


def over(img, colour, alpha):
    a = (alpha.astype(np.float32) / 255)[..., None]
    return img * (1 - a) + colour * a


def bezier(a, b, c, d, t0=0.0, t1=1.0, n=24):
    out = []
    for t in np.linspace(t0, t1, n):
        u = 1 - t
        out.append((u**3 * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t**3 * d.x - X0,
                    u**3 * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t**3 * d.y - Y0))
    return out


page = fitz.open(KIT / 'Community Assets' / 'BEL 25000 Master Plan Update v2.pdf')[0]
drawings = page.get_drawings()
pix = page.get_pixmap(matrix=fitz.Matrix(R, R), clip=fitz.Rect(X0, Y0, X1, Y1))
img = np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width, pix.n)[:, :, :3].astype(np.float32)
shape = img.shape[:2]

# No trail along the north boundary: lift it from the loop around the north pond, keeping the side south of the pond
loop = next(d for d in drawings if d.get('dashes') and d['dashes'].startswith('[ 3.031'))
north = []
for k, it in enumerate(loop['items']):
    if 6 <= k <= 19:
        north += bezier(*it[1:5], t0=.5 if k == 6 else 0)
mask = np.zeros(shape, np.uint8)
cv2.polylines(mask, [px(north)], False, 255, int(3.4 * R), cv2.LINE_AA)
keep = 1 - mask.astype(np.float32) / 255
heal = cv2.GaussianBlur(img * keep[..., None], (0, 0), 16) / np.maximum(cv2.GaussianBlur(keep, (0, 0), 16), 1e-3)[..., None]
img = over(img, heal, cv2.GaussianBlur(mask, (0, 0), 1.5))

# Green space in place of the far north-east pond, and along the east edge
pond = next(d for d in drawings if d.get('fill') and round(d['fill'][0], 2) == .46 and round(d['fill'][1], 2) == .68 and d['rect'].x0 > 760)
pond_pts = [(it[1].x - X0, it[1].y - Y0) for it in pond['items']]
mask = fill(shape, [pond_pts], 2.2)
for g in LATEST['green']:
    mask = np.maximum(mask, fill(shape, [g]))
mask = (cv2.GaussianBlur(mask, (0, 0), 5 * R / 2) > 127).astype(np.uint8) * 255
img = over(img, rgb(GREEN), cv2.GaussianBlur(mask, (0, 0), 1.2))

# The shared lakes, drawn over the rear of the homesites like the kit's own pond
lakes = fill(shape, LATEST['lakes'])
img = over(img, rgb(SHORE), fill(shape, LATEST['lakes'], .9))
depth = cv2.distanceTransform((lakes > 127).astype(np.uint8), cv2.DIST_L2, 5) / R
t = np.clip(depth / 11, 0, 1)
t = (t * t * (3 - 2 * t))[..., None]
water = rgb(LAKE_EDGE) * (1 - t) + rgb(LAKE_CORE) * t
img = img * (1 - lakes[..., None] / 255.0) + water * (lakes[..., None] / 255.0)

# The lot lines carry on across the water as dots. The kit draws some lines twice, so the dots are set by position, not
# along each line: a line drawn twice still reads as one dotted line
across, along = np.zeros(shape, np.uint8), np.zeros(shape, np.uint8)
for d in drawings:
    c = d.get('color')
    if d['type'] not in ('s', 'fs') or c is None or tuple(round(v, 2) for v in c[:3]) != LINE:
        continue
    run = []
    for it in d['items']:
        if it[0] == 'l':
            run += [(it[1].x - X0, it[1].y - Y0), (it[2].x - X0, it[2].y - Y0)]
        elif it[0] == 'c':
            run += bezier(*it[1:5], n=12)
    for a, b in zip(run, run[1:]):
        wide = abs(b[0] - a[0]) >= abs(b[1] - a[1])
        cv2.line(along if wide else across, tuple(px(a).tolist()), tuple(px(b).tolist()), 255, max(2, int(.72 * R)), cv2.LINE_AA)
yy, xx = np.mgrid[:shape[0], :shape[1]]
PERIOD = 5.6 * R
dots = np.maximum(np.where((xx % PERIOD) < PERIOD * .55, along, 0), np.where((yy % PERIOD) < PERIOD * .55, across, 0))
img = over(img, rgb((255, 255, 255)), np.minimum(dots, cv2.erode(lakes, np.ones((5, 5), np.uint8))))

# A house pad on every homesite
PW, PH = 15.0, 13.5
shadow, body, edge = np.zeros(shape, np.uint8), np.zeros(shape, np.uint8), []
for x, y, ang in LATEST['pads']:
    box = cv2.boxPoints(((x * R, y * R), (PW * R, PH * R), ang))
    edge.append(np.round(box).astype(np.int32))
    cv2.fillPoly(body, [edge[-1]], 255, lineType=cv2.LINE_AA)
    cv2.fillPoly(shadow, [np.round(box + (1.3 * R, 1.6 * R)).astype(np.int32)], 255, lineType=cv2.LINE_AA)
img = over(img, rgb((0x2E, 0x36, 0x37)), (cv2.GaussianBlur(shadow, (0, 0), 1.3 * R) * .34).astype(np.uint8))
img = over(img, rgb((255, 255, 255)), body)
line = np.zeros(shape, np.uint8)
cv2.polylines(line, edge, True, 255, max(2, int(.3 * R)), cv2.LINE_AA)
img = over(img, rgb((0x5B, 0x65, 0x66)), (line * .55).astype(np.uint8))

out = cv2.resize(np.clip(img, 0, 255).astype(np.uint8), (int(705 * OUT), int(500 * OUT)), interpolation=cv2.INTER_AREA)
art = Image.fromarray(out)
art.save('img/site-plan.webp', quality=86, method=6)

# The kit's poster with the new artwork, and the lakes, trail and green space in its legend
k = 2400 / page.rect.width
poster = page.get_pixmap(matrix=fitz.Matrix(k, k))
poster = Image.frombytes('RGB', (poster.width, poster.height), poster.samples)
poster.paste(art.resize((round((X1 - X0) * k), round((Y1 - Y0) * k)), Image.LANCZOS), (round(X0 * k), round(Y0 * k)))
d = ImageDraw.Draw(poster)
font = ImageFont.truetype(FONT, 30)
font.set_variation_by_axes([400])
small = ImageFont.truetype(FONT, 14)
small.set_variation_by_axes([400])
ink, cx, tx, y = '#3F4748', 1867, 1905, 973
for label, colour in (('Shared Lakes', '#6FA3B8'), ('Amenity Pond', '#4B7894'), ('Green Space', '#6A8C78')):
    d.ellipse((cx - 18, y - 18, cx + 18, y + 18), fill=colour)
    d.text((tx, y), label, fill=ink, font=font, anchor='lm')
    y += 64
d.ellipse((cx - 18, y - 18, cx + 18, y + 18), outline='#8FA39B', width=2)
for i in range(-14, 16, 8):
    d.line((cx + i - 3, y, cx + i + 3, y), fill='#6A8C78', width=4)
d.text((tx, y), 'Walking Trail', fill=ink, font=font, anchor='lm')
d.rectangle((1950, 1400, 2385, 1432), fill='#FFFFFF')
d.text((2365, 1417), 'Conceptual rendering. Subject to change without notice.', fill='#6B7374', font=small, anchor='rm')
poster.save('img/masterplan.webp', quality=86, method=6)

# The data the site reads
path = Path('js/plan-data.js')
text = path.read_text(encoding='utf-8')
head = text[:text.index('window.BE_DATA')]
data = json.loads(text[text.index('{'):text.rindex('}') + 1])
for i, lot in enumerate(data['plan']['lots']):
    lot['p'] = LATEST['pads'][i][:2]
    lot['l'] = 1 if i + 1 in LATEST['onLake'] else 0
data['plan']['lakes'] = ['M' + ' '.join(f'{x:.1f},{y:.1f}' for x, y in lake) + 'Z' for lake in LATEST['lakes']]
path.write_text(head + 'window.BE_DATA = ' + json.dumps(data, separators=(',', ':')) + ';\n', encoding='utf-8', newline='\n')
print('site-plan.webp', art.size, '| masterplan.webp', poster.size, '| homesites on a lake', len(LATEST['onLake']))
