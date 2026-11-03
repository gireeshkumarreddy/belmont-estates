"""Makes the interactive maps' data and art from the Belmont Estates kit.

- Site plan: the map area of "BEL 25000 Master Plan Update v2" as an image (img/site-plan.webp), and every homesite
  traced from it as a polygon with its builder colour (Phase 1) or Future Development.
- Area map: the roads and labels of "BEL 24005 Area Attractions Map v4" as SVG (img/area-roads.svg), and the 28
  numbered places with their positions and category colours.
Both go to js/plan-data.js.

Run from the project folder:  python -I tools/kit_site_data.py "<path to the unzipped Belmont Estates kit folder>"
"""
import json
import re
import sys
from collections import Counter
from pathlib import Path

import cv2
import fitz
import numpy as np
from PIL import Image

KIT = Path(sys.argv[1])
ASSETS = KIT / 'Community Assets'


def hexc(c):
    return '#%02X%02X%02X' % tuple(round(v * 255) for v in c[:3])


# ---------------- site plan ----------------
mp = fitz.open(ASSETS / 'BEL 25000 Master Plan Update v2.pdf')[0]
X0, Y0, X1, Y1 = 180, 180, 885, 680          # the map area of the masterplan, in PDF points
W, H = X1 - X0, Y1 - Y0
art = mp.get_pixmap(matrix=fitz.Matrix(2.6, 2.6), clip=fitz.Rect(X0, Y0, X1, Y1))
Image.frombytes('RGB', (art.width, art.height), art.samples).save('img/site-plan.webp', quality=84, method=6)

Z = 4
pix = mp.get_pixmap(matrix=fitz.Matrix(Z, Z), clip=fitz.Rect(X0, Y0, X1, Y1))
im = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)[:, :, :3].astype(int)
COLS = {'future': (252, 249, 242), 'wdh': (199, 178, 109), 'toll': (195, 139, 81), 'pib': (124, 80, 65), 'autograph': (67, 81, 108)}
mask = np.zeros(im.shape[:2], np.uint8)
label = np.full(im.shape[:2], -1, np.int8)
for k, c in enumerate(COLS.values()):
    m = np.sqrt(((im - np.array(c)) ** 2).sum(2)) < 26
    mask[m] = 255
    label[m] = k
mask = cv2.erode(mask, np.ones((3, 3), np.uint8), iterations=2)
n, cc, stats, cent = cv2.connectedComponentsWithStats(mask, 8)
lots = []
for i in range(1, n):
    x, y, w, h, a = stats[i]
    if a < 4000 or x <= 2 or y <= 2 or x + w >= pix.width - 3 or y + h >= pix.height - 3:
        continue  # specks, and the page margin around the plan
    region = (cc == i).astype(np.uint8)
    region = cv2.dilate(region, np.ones((3, 3), np.uint8), iterations=2)
    cs, _ = cv2.findContours(region, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cs, key=cv2.contourArea)
    poly = cv2.approxPolyDP(c, 2.2, True)[:, 0, :] / Z
    ys, xs = np.where(cc == i)
    b = list(COLS)[Counter(label[ys, xs].tolist()).most_common(1)[0][0]]
    lots.append({'b': '' if b == 'future' else b, 'c': [round(cent[i][0] / Z, 1), round(cent[i][1] / Z, 1)],
                 'd': 'M' + ' '.join(f'{px:.1f},{py:.1f}' for px, py in poly) + 'Z'})
# Number the homesites block by block, so neighbours get neighbouring numbers. The masterplan has no lot numbers,
# so each block lists where its homesites sit (map points), in order; each point takes the nearest homesite.
BLOCKS = [
    [(30, 73), (58, 72), (90, 70), (120, 65), (151, 65), (179, 78), (210, 95)],                                # north-west row
    [(248, 117), (276, 130), (304, 143), (332, 158), (358, 173)],                                             # diagonal row
    [(394, 192), (427, 186), (459, 185), (492, 186), (528, 181), (569, 182)],                                 # north-east row
    [(579, 231), (579, 274), (567, 326), (606, 328), (667, 327)],                                             # east
    [(48, 156), (118, 158), (42, 199), (66, 235)],                                                            # west cul-de-sac
    [(154, 174), (218, 195), (118, 230)],                                                                     # centre-west
    [(187, 232), (290, 229), (332, 274), (285, 274), (241, 290), (190, 273)],                                 # centre cul-de-sac
    [(372, 277), (416, 277), (461, 276), (506, 274)],                                                         # middle row
    [(129, 316), (157, 339), (193, 344), (236, 346), (282, 344), (328, 342), (373, 340), (418, 338), (464, 336), (509, 335)],
    [(40, 285), (81, 293), (37, 372), (89, 391)],                                                             # south-west
    [(63, 438), (88, 467), (143, 465), (160, 425)],                                                           # south cul-de-sac
    [(198, 440), (229, 439), (259, 438), (290, 436), (321, 435), (352, 434), (382, 432), (413, 431), (444, 430), (474, 428),
     (505, 427), (536, 426), (566, 424), (597, 423), (629, 425), (679, 416)],                                  # south row
]
left, ordered = list(lots), []
for p in (p for b in BLOCKS for p in b):
    near = min(left, key=lambda l: (l['c'][0] - p[0]) ** 2 + (l['c'][1] - p[1]) ** 2)
    assert (near['c'][0] - p[0]) ** 2 + (near['c'][1] - p[1]) ** 2 < 100, ('no homesite near', p)
    left.remove(near); ordered.append(near)
assert not left, ('homesites missing from BLOCKS', [l['c'] for l in left])
lots = ordered
print('homesites', len(lots), Counter(l['b'] or 'future' for l in lots))

# ---------------- area map ----------------
am = fitz.open(ASSETS / 'BEL 24005 Area Attractions Map v4.pdf')[0]
AX0, AY0, AX1, AY1 = 20, 330, 1560, 1390      # the map, without the legend panel
words = am.get_text('words')
legend_x = 1600
nums = [w for w in words if re.fullmatch(r'\d{1,2}', w[4]) and w[0] < legend_x and AY0 < w[1] < AY1]
drawings = am.get_drawings()
circles = [d for d in drawings if d.get('fill') and 20 < d['rect'].width < 60 and abs(d['rect'].width - d['rect'].height) < 3 and d['rect'].x0 < legend_x]
places = {}
for w in nums:
    cx, cy = (w[0] + w[2]) / 2, (w[1] + w[3]) / 2
    best = min(circles, key=lambda d: (d['rect'].x0 + d['rect'].x1 - 2 * cx) ** 2 + (d['rect'].y0 + d['rect'].y1 - 2 * cy) ** 2, default=None)
    if not best or abs((best['rect'].x0 + best['rect'].x1) / 2 - cx) > 30:
        continue  # road shield numbers, not places
    r = best['rect']
    places[int(w[4])] = {'x': round((r.x0 + r.x1) / 2 - AX0, 1), 'y': round((r.y0 + r.y1) / 2 - AY0, 1), 'r': round(r.width / 2, 1), 'fill': hexc(best['fill'])}
print('places', len(places), sorted(places))
home = max((d for d in drawings if d.get('fill') and 90 < d['rect'].width < 140 and d['rect'].x0 < 800 and d['rect'].y0 > 1000), key=lambda d: d['rect'].width)
hr = home['rect']
HOME = {'x': round((hr.x0 + hr.x1) / 2 - AX0, 1), 'y': round((hr.y0 + hr.y1) / 2 - AY0, 1), 'r': round(hr.width / 2, 1)}

# Roads and their labels as SVG (no pins, brushstrokes or background)
skip = {'#C38B53', '#C38B52', '#C48B53'}
out = []
for d in drawings:
    r = d['rect']
    if r.x1 < AX0 or r.x0 > AX1 or r.y1 < AY0 or r.y0 > AY1 or r.x0 > legend_x:
        continue
    if d in circles or d is home:
        continue
    f = d.get('fill')
    if f is not None and (r.width * r.height > 400000 or hexc(f) in skip):
        continue
    if hr.contains(r):
        continue  # the Belmont mark inside the home circle; the page draws its own
    if f is not None and hexc(f) not in ('#FFFFFF', '#44526C', '#FCFAF4', '#FCF9F2') and not d.get('color'):
        continue  # brushstrokes and textures
    p, curp = '', None
    for it in d['items']:
        k = it[0]
        if k == 'l':
            a, b = it[1], it[2]
            if curp is None or abs(curp.x - a.x) > .01 or abs(curp.y - a.y) > .01:
                p += f'M{a.x - AX0:.1f},{a.y - AY0:.1f}'
            p += f'L{b.x - AX0:.1f},{b.y - AY0:.1f}'; curp = b
        elif k == 'c':
            a, c1, c2, b = it[1:5]
            if curp is None or abs(curp.x - a.x) > .01 or abs(curp.y - a.y) > .01:
                p += f'M{a.x - AX0:.1f},{a.y - AY0:.1f}'
            p += f'C{c1.x - AX0:.1f},{c1.y - AY0:.1f} {c2.x - AX0:.1f},{c2.y - AY0:.1f} {b.x - AX0:.1f},{b.y - AY0:.1f}'; curp = b
        elif k == 're':
            q = it[1]; p += f'M{q.x0 - AX0:.1f},{q.y0 - AY0:.1f}H{q.x1 - AX0:.1f}V{q.y1 - AY0:.1f}H{q.x0 - AX0:.1f}Z'; curp = None
        elif k == 'qu':
            q = it[1]; p += f'M{q.ul.x - AX0:.1f},{q.ul.y - AY0:.1f}L{q.ur.x - AX0:.1f},{q.ur.y - AY0:.1f}L{q.lr.x - AX0:.1f},{q.lr.y - AY0:.1f}L{q.ll.x - AX0:.1f},{q.ll.y - AY0:.1f}Z'; curp = None
    if d.get('closePath'):
        p += 'Z'
    attrs = f'fill="{hexc(f) if f is not None else "none"}"'
    if d.get('color') is not None and d.get('width'):
        attrs += f' stroke="{hexc(d["color"])}" stroke-width="{d["width"]:.1f}"'
        if d.get('lineCap'):
            attrs += ' stroke-linecap="round"'
    out.append(f'<path {attrs} d="{p}"/>')
# Road names and shield numbers (real text in the PDF)
labels = []
for b in am.get_text('dict')['blocks']:
    for l in b.get('lines', []):
        txt = ''.join(s['text'] for s in l['spans']).strip()
        if not txt or re.fullmatch(r'\d{1,2}', txt) and int(txt) in places and not txt in ('99', '6'):
            continue
        x0, y0, x1, y1 = l['bbox']
        if x0 > AX1 - 10 or y1 < AY0 or y0 > AY1 or 'scale' in txt:
            continue
        if re.fullmatch(r'\d{1,2}', txt) and any(abs(v['x'] + AX0 - (x0 + x1) / 2) < 25 and abs(v['y'] + AY0 - (y0 + y1) / 2) < 25 for v in places.values()):
            continue
        s = l['spans'][0]
        dx, dy = l['dir']
        ox, oy = s['origin']
        rot = 0 if abs(dy) < .01 else round(np.degrees(np.arctan2(dy, dx)), 1)
        fill = '#%06X' % s['color']
        labels.append(f'<text x="{ox - AX0:.1f}" y="{oy - AY0:.1f}" font-size="{s["size"]:.1f}" fill="{fill}"' + (f' transform="rotate({rot} {ox - AX0:.1f} {oy - AY0:.1f})"' if rot else '') + f'>{txt.replace("’", "&#8217;")}</text>')
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {AX1 - AX0} {AY1 - AY0}">' + ''.join(out) +
       '<g font-family="Public Sans, Arial, sans-serif" font-weight="600">' + ''.join(labels) + '</g></svg>')
Path('img/area-roads.svg').write_text(svg, encoding='utf-8', newline='\n')
print('area-roads.svg', len(out), 'paths', len(labels), 'labels', len(svg) // 1024, 'KB')

data = {'plan': {'w': W, 'h': H, 'lots': lots}, 'area': {'w': AX1 - AX0, 'h': AY1 - AY0, 'home': HOME, 'pins': places}}
Path('js/plan-data.js').write_text('// Generated from the Belmont Estates kit by tools/kit_site_data.py. Edit the kit, not this file.\nwindow.BE_DATA = ' + json.dumps(data, separators=(',', ':')) + ';\n', encoding='utf-8', newline='\n')
print('js/plan-data.js written')
