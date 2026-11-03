"""Writes vector parts of the kit's landing page design as small SVGs in img/: the area map, the Toll Brothers
logo, the gold brushstroke, the small horseshoe and the hero's flowing lines.

Run from the project folder:  python -I tools/kit_vectors.py "<kit folder>/Landing Page/Belmont Estates - Unbridled Living.pdf"
"""
import sys
import fitz

SRC = sys.argv[1]
d = fitz.open(SRC); page = d[0]
DR = page.get_drawings()


def col(c):
    return 'none' if c is None else '#%02X%02X%02X' % tuple(round(v * 255) for v in c[:3])


def region(name, x0, y0, x1, y1, skip_fill=(), pad=0):
    clip = fitz.Rect(x0, y0, x1, y1)
    out = []
    for dr in DR:
        r = dr['rect']
        if not clip.contains(r) and not (pad and clip.intersects(r)):
            continue
        if dr.get('fill') and col(dr['fill']) in skip_fill and r.width * r.height > 2000:
            continue
        p, cur = '', None
        def mv(pt):
            nonlocal_p = '' if cur is not None and abs(cur.x - pt.x) < .01 and abs(cur.y - pt.y) < .01 else f'M{pt.x - x0:.2f},{pt.y - y0:.2f}'
            return nonlocal_p
        for it in dr['items']:
            k = it[0]
            if k == 'l':
                a, b = it[1], it[2]; p += mv(a) + f'L{b.x - x0:.2f},{b.y - y0:.2f}'; cur = b
            elif k == 'c':
                a, c1, c2, b = it[1:5]; p += mv(a) + f'C{c1.x - x0:.2f},{c1.y - y0:.2f} {c2.x - x0:.2f},{c2.y - y0:.2f} {b.x - x0:.2f},{b.y - y0:.2f}'; cur = b
            elif k == 're':
                q = it[1]; p += f'M{q.x0 - x0:.2f},{q.y0 - y0:.2f}H{q.x1 - x0:.2f}V{q.y1 - y0:.2f}H{q.x0 - x0:.2f}Z'; cur = None
            elif k == 'qu':
                q = it[1]; p += f'M{q.ul.x - x0:.2f},{q.ul.y - y0:.2f}L{q.ur.x - x0:.2f},{q.ur.y - y0:.2f}L{q.lr.x - x0:.2f},{q.lr.y - y0:.2f}L{q.ll.x - x0:.2f},{q.ll.y - y0:.2f}Z'; cur = None
        if dr.get('closePath'):
            p += 'Z'
        p = p.replace('Z M', 'ZM')
        attrs = f'fill="{col(dr.get("fill"))}"'
        if dr.get('fill') is not None and dr.get('even_odd'):
            attrs += ' fill-rule="evenodd"'
        if dr.get('fill_opacity') not in (None, 1):
            attrs += f' fill-opacity="{dr["fill_opacity"]:.2f}"'
        if dr.get('color') is not None and dr.get('width'):
            attrs += f' stroke="{col(dr["color"])}" stroke-width="{dr["width"]:.2f}"'
            if dr.get('stroke_opacity') not in (None, 1):
                attrs += f' stroke-opacity="{dr["stroke_opacity"]:.2f}"'
            if dr.get('lineCap'):
                attrs += ' stroke-linecap="round"'
        out.append(f'<path {attrs} d="{p}"/>')
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {x1 - x0:g} {y1 - y0:g}">' + ''.join(out) + '</svg>'
    open(name, 'w', encoding='utf-8', newline='\n').write(svg)
    print(name, len(out), 'paths', len(svg) // 1024, 'KB')


BIG = ('#C38B53', '#FFFFFF', '#3F4748', '#42516B', '#EFECE5', '#000000', '#FAF8F2')
region('img/map.svg', 770, 4440, 1500, 5060, skip_fill=BIG, pad=1)
region('img/logo-toll-brothers.svg', 915, 3225, 1080, 3300)
region('img/brush-gold.svg', 480, 2490, 1558, 2760, skip_fill=BIG, pad=1)
region('img/horseshoe.svg', 740, 1290, 820, 1370, skip_fill=BIG)
region('img/lines-hero.svg', 0, 780, 1558, 1160, skip_fill=BIG, pad=1)
