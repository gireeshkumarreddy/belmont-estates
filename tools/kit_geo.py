"""Places the Belmont Estates masterplan on the real map.

The masterplan is an illustration, not a survey, so it can't simply be stretched over a map. This matches points on
the plan (street junctions, cul-de-sacs, pond corners, homesite pads) to the same points on satellite imagery of the
site, east of Bois D'Arc Lane, and fits a smooth warp through them. From that it writes:
- js/plan-geo.js: every homesite outline, the parcel, the amenity markers and the entries in longitude and latitude;
- img/site-plan-geo.webp: the masterplan artwork warped onto the map, with everything outside the parcel transparent;
- img/site-lakes-geo.webp: just the lakes from that artwork, for the satellite view.

The positions are a best fit to imagery, not a survey.

Run from the project folder, after kit_plan_update.py:  python -I tools/kit_geo.py
"""
import json
import math
from pathlib import Path

import cv2
import numpy as np

Z, TX0, TY0 = 17, 30626, 54212     # the imagery the points were read from: zoom and top-left tile
# (plan x, plan y) -> (x, y) in pixels on that imagery
POINTS = [
    ((8, 25), (100, 405)), ((700, 25), (1215, 400)), ((698, 462), (1215, 1150)), ((18, 492), (100, 1150)),   # parcel corners
    ((0, 122), (100, 577)), ((0, 332), (102, 905)),                                                          # west entries
    ((90, 118), (230, 570)), ((205, 152), (395, 612)), ((258, 182), (510, 667)), ((350, 225), (660, 735)),   # north street
    ((540, 228), (945, 768)), ((537, 365), (945, 990)), ((250, 378), (483, 996)), ((175, 383), (360, 995)),  # east and south streets
    ((140, 380), (295, 990)), ((88, 343), (218, 922)),
    ((115, 418), (255, 1070)), ((90, 188), (232, 672)), ((241, 237), (475, 765)),                            # cul-de-sacs
    ((545, 28), (960, 435)), ((565, 103), (972, 535)), ((292, 32), (590, 436)), ((405, 95), (790, 525)),      # north pond
    ((587, 23), (1055, 445)), ((690, 47), (1190, 465)), ((688, 88), (1180, 515)), ((605, 105), (1080, 545)),  # east pond
    # homesite pads
    ((30, 100), (130, 535)), ((58, 100), (182, 535)), ((90, 100), (230, 535)), ((120, 100), (280, 535)),
    ((238, 145), (467, 607)), ((265, 158), (510, 632)), ((293, 172), (552, 660)), ((320, 186), (595, 682)), ((348, 200), (642, 702)),
    ((393, 212), (717, 730)), ((427, 210), (777, 730)), ((459, 210), (832, 730)), ((492, 210), (885, 730)),
    ((198, 410), (392, 1040)), ((229, 410), (440, 1040)), ((259, 410), (495, 1040)), ((290, 410), (542, 1040)), ((321, 410), (595, 1040)),
    ((413, 408), (742, 1030)), ((444, 408), (790, 1030)), ((474, 408), (840, 1030)), ((505, 408), (892, 1030)), ((536, 408), (942, 1030)),
    ((566, 408), (992, 1030)), ((597, 408), (1042, 1030)), ((629, 408), (1082, 1025)),
    ((193, 355), (390, 960)), ((236, 355), (460, 960)), ((282, 355), (532, 957)), ((328, 352), (605, 962)),
    ((418, 350), (752, 960)), ((464, 350), (827, 957)), ((509, 350), (902, 957)), ((567, 345), (995, 955)), ((606, 345), (1052, 955)),
    ((40, 310), (140, 865)), ((81, 318), (200, 870)), ((37, 352), (137, 942)),
    ((60, 156), (190, 615)), ((60, 199), (185, 667)),
]
PARCEL = [(5, 25), (560, 4), (701, 26), (699, 463), (19, 493)]   # the plan's outer edge, in plan units
SMOOTH = 3000.0                                                  # keeps the warp from chasing small reading errors
ART_SCALE = 2.0                                                  # output pixels per imagery pixel


def kernel(r2):
    with np.errstate(divide='ignore', invalid='ignore'):
        return np.nan_to_num(r2 * np.log(r2) * .5)


class Warp:
    """A smoothed thin-plate spline from one set of points to another."""

    def __init__(self, src, dst):
        n = len(src); self.src = src
        a = np.c_[np.ones(n), src]
        m = np.zeros((n + 3, n + 3)); m[:n, :n] = kernel(((src[:, None] - src[None]) ** 2).sum(2)) + SMOOTH * np.eye(n)
        m[:n, n:] = a; m[n:, :n] = a.T
        self.w = np.linalg.solve(m, np.r_[dst, np.zeros((3, 2))])

    def __call__(self, pts):
        pts = np.asarray(pts, float)
        return kernel(((pts[:, None] - self.src[None]) ** 2).sum(2)) @ self.w[:-3] + np.c_[np.ones(len(pts)), pts] @ self.w[-3:]


def lonlat(px):
    """Imagery pixels to [longitude, latitude]."""
    n = 256 * 2 ** Z
    x = (TX0 * 256 + px[:, 0]) / n; y = (TY0 * 256 + px[:, 1]) / n
    return np.c_[x * 360 - 180, np.degrees(np.arctan(np.sinh(math.pi * (1 - 2 * y))))]


def r(a):
    return np.round(a, 6).tolist()


plan = np.array([p[0] for p in POINTS], float); img = np.array([p[1] for p in POINTS], float)
to_img, to_plan = Warp(plan, img), Warp(img, plan)
err = np.linalg.norm(to_img(plan) - img, axis=1)
print('points', len(plan), 'rms error', round(float(np.sqrt((err ** 2).mean())) * 1.04, 1), 'm')

text = Path('js/plan-data.js').read_text(encoding='utf-8')
data = json.loads(text[text.index('{'):text.rindex('}') + 1])
know = json.loads(Path('content/knowledge.json').read_text(encoding='utf-8'))
lots = []
for lot in data['plan']['lots']:
    pts = [tuple(map(float, p.split(','))) for p in lot['d'].replace('M', '').replace('Z', '').split()]
    lots.append(r(lonlat(to_img(pts + pts[:1]))))
mid = r(lonlat(to_img([lot['p'] for lot in data['plan']['lots']])))   # where each homesite's number sits: on its house pad
parcel_px = to_img(PARCEL + PARCEL[:1])
pins = {a['id']: r(lonlat(to_img(a['at']))) if a['at'] else [] for a in know['amenities']}

# the artwork, warped: every output pixel looks up where it came from on the plan
x0, y0 = np.floor(parcel_px.min(0)) - 6; x1, y1 = np.ceil(parcel_px.max(0)) + 6
w, h = int((x1 - x0) * ART_SCALE), int((y1 - y0) * ART_SCALE)
gx, gy = np.meshgrid(np.linspace(x0, x1, w // 8 + 2), np.linspace(y0, y1, h // 8 + 2))
coarse = to_plan(np.c_[gx.ravel(), gy.ravel()]).reshape(gx.shape + (2,)).astype(np.float32)
fine = cv2.resize(coarse, (w, h), interpolation=cv2.INTER_CUBIC)
art = cv2.imread('img/site-plan.webp', cv2.IMREAD_COLOR)
per_unit = art.shape[1] / data['plan']['w']
mask = np.zeros(art.shape[:2], np.uint8)
cv2.fillPoly(mask, [np.round(np.array(PARCEL) * per_unit).astype(np.int32)], 255, lineType=cv2.LINE_AA)
out = cv2.remap(np.dstack([art, mask]), fine[:, :, 0] * per_unit, fine[:, :, 1] * per_unit, cv2.INTER_LINEAR, borderValue=0)
cv2.imwrite('img/site-plan-geo.webp', out, [cv2.IMWRITE_WEBP_QUALITY, 84])
water = np.zeros(art.shape[:2], np.uint8)
for d in data['plan']['lakes']:
    pts = np.array([tuple(map(float, p.split(','))) for p in d.replace('M', '').replace('Z', '').split()])
    cv2.fillPoly(water, [np.round(pts * per_unit).astype(np.int32)], 255, lineType=cv2.LINE_AA)
lakes = cv2.remap(np.dstack([art, water]), fine[:, :, 0] * per_unit, fine[:, :, 1] * per_unit, cv2.INTER_LINEAR, borderValue=0)
cv2.imwrite('img/site-lakes-geo.webp', lakes, [cv2.IMWRITE_WEBP_QUALITY, 84])
corners = lonlat(np.array([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]))

geo = {
    'center': r(lonlat(parcel_px.mean(0, keepdims=True))[0]),
    'parcel': r(lonlat(parcel_px)),
    'art': r(corners),
    'lots': lots,
    'mid': mid,
    'pins': pins,
    'entries': r(lonlat(np.array([[100.0, 577.0], [102.0, 905.0]]))),
}
Path('js/plan-geo.js').write_text('// Generated by tools/kit_geo.py: the masterplan on the real map. A best fit to imagery, not a survey.\nwindow.BE_GEO = '
                                  + json.dumps(geo, separators=(',', ':')) + ';\n', encoding='utf-8', newline='\n')
print('site-plan-geo.webp', out.shape, 'plan-geo.js', round(Path('js/plan-geo.js').stat().st_size / 1024), 'KB')
print('center', geo['center'], 'entries', geo['entries'])
