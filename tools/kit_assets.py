"""Makes the web assets in img/ from the Belmont Estates brand kit.

Everything comes from the kit: the photos, crest frames, brushstrokes, flowing lines, textures, builder
logos and horseshoe band are the images inside "Landing Page/Belmont Estates - Unbridled Living.pdf";
the map, the Toll Brothers logo, the gold brushstroke and the small horseshoe are its vector drawings;
the masterplan and area attractions images are the kit's own PDFs; the logos are the kit's SVGs.

Run from the project folder:  python -I tools/kit_assets.py "<path to the unzipped Belmont Estates kit folder>"
"""
import shutil
import sys
from pathlib import Path

import fitz
from PIL import Image

KIT = Path(sys.argv[1])
OUT = Path('img')
OUT.mkdir(exist_ok=True)
lp = fitz.open(KIT / 'Landing Page' / 'Belmont Estates - Unbridled Living.pdf')
page = lp[0]


def pix(xref, keep_alpha=True):
    """An image from the landing page as a PIL image, with its transparency mask applied."""
    p = fitz.Pixmap(lp, xref)
    if p.n - p.alpha >= 4:
        p = fitz.Pixmap(fitz.csRGB, p)
    sm = lp.xref_get_key(xref, 'SMask')[1]
    im = Image.frombytes('RGBA' if p.alpha else 'RGB', (p.width, p.height), p.samples)
    if keep_alpha and sm not in ('null', ''):
        m = fitz.Pixmap(lp, int(sm.split()[0]))
        im = im.convert('RGB')
        im.putalpha(Image.frombytes('L', (m.width, m.height), m.samples).resize(im.size))
    return im


def save(im, name, q=84):
    im.save(OUT / name, quality=q, method=6)
    print(name, im.size)


# Photos (the hero keeps the design's angled bottom edge in its transparency)
save(pix(34), 'hero.webp', 86)
save(pix(40, keep_alpha=False), 'intro-family.webp')
save(pix(21, keep_alpha=False), 'dream-home.webp')
save(pix(43, keep_alpha=False), 'moments-garden.webp')
save(pix(22, keep_alpha=False), 'moments-picnic.webp')
# Crest-framed photos, script, brushstrokes, flowing lines, textures and the horseshoe band
for xref, name in [(42, 'crest-vase.webp'), (44, 'crest-lupines.webp'), (27, 'crest-aerial.webp'), (35, 'living.webp'),
                   (36, 'brush-mint-hero.webp'), (39, 'brush-saffron.webp'), (56, 'brush-mint-moments.webp'),
                   (28, 'brush-mint-developer.webp'), (52, 'brush-navy.webp'),
                   (41, 'line-intro.webp'), (58, 'line-moments.webp'), (26, 'line-students.webp'),
                   (12, 'texture-builders.webp'), (29, 'horseshoes.webp'),
                   (13, 'logo-partners-in-building.webp'), (16, 'logo-william-david.webp'), (19, 'logo-autograph.webp')]:
    save(pix(xref), name, 88)
save(pix(23, keep_alpha=False), 'texture-developer.webp', 80)

# More kit photos: the classroom placed (hidden) in the landing page, and the brand guide's photography
cls = pix(57, keep_alpha=False); cls.thumbnail((1920, 1920)); save(cls, 'schools-classroom.webp')
guide = fitz.open(KIT / 'Branding' / 'BEL 24002 Brand Standard Guidelines v1.pdf')
for pno, xref, name in [(7, 25, 'life-sprinkler.webp'), (11, 46, 'life-grandpa.webp'), (11, 44, 'home-interior.webp'), (11, 40, 'life-lupines.webp'), (11, 48, 'life-running.webp')]:
    gp = fitz.Pixmap(guide, xref)
    if gp.n - gp.alpha >= 4:
        gp = fitz.Pixmap(fitz.csRGB, gp)
    save(Image.frombytes('RGB', (gp.width, gp.height), gp.samples[:gp.width * gp.height * 3] if not gp.alpha else fitz.Pixmap(gp, 0).samples), name)

# The kit's masterplan and area attractions map, for the buttons that open them
for pdf, name, w in [('BEL 25000 Master Plan Update v2.pdf', 'masterplan.webp', 2400), ('BEL 24005 Area Attractions Map v4.pdf', 'area-attractions.webp', 2400)]:
    d = fitz.open(KIT / 'Community Assets' / pdf)
    p = d[0].get_pixmap(matrix=fitz.Matrix(w / d[0].rect.width, w / d[0].rect.width))
    save(Image.frombytes('RGB', (p.width, p.height), p.samples), name, 82)

# Logos
for src, name in [('Horizontal/Belmont-Estates-logo-horizontal.svg', 'logo-horizontal.svg'), ('Icon/Belmont-Estates-logo-icon.svg', 'logo-icon.svg')]:
    shutil.copy(KIT / 'Logo' / src, OUT / name)
# Every logo on the site is gold: the kit's gold, and a deeper gold where it sits on the pale header
logo = (OUT / 'logo-horizontal.svg').read_text(encoding='utf-8')
(OUT / 'logo-gold.svg').write_text(logo.replace('#747e7c', '#c7b36e'), encoding='utf-8')
(OUT / 'logo-gold-deep.svg').write_text(logo.replace('#747e7c', '#a98c43').replace('#c7b36e', '#a98c43'), encoding='utf-8')
print('done')
