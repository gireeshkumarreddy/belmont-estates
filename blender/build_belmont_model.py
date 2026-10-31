"""Builds the Belmont Estates master-plan model from the Clark Condon site plan.

Run headless, from the project folder:
    blender -b --factory-startup --python blender/build_belmont_model.py

Writes assets/model/belmont.glb (for the web viewer) and assets/model/belmont-poster.png;
the page shows a cropped WebP copy of the poster (belmont-poster.webp) while the model loads.
All positions are traced from assets/img/site-plan-wide.webp at 2000 x 1445 px;
one model unit is 10 px, the plan's centre is the origin, and north (the top of the plan) is +Y.
"""
import math
import os
import random

import bmesh
import bpy
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'model')
os.makedirs(OUT, exist_ok=True)
random.seed(1093)


def P(px, py):
    return Vector(((px - 1000) * .1, -(py - 722.5) * .1))


# ---------------------------------------------------------------- traced plan
PARCELS = [  # cream homesite land
    [(28, 148), (430, 128), (688, 252), (52, 1360), (28, 1362)],
    [(735, 262), (800, 292), (1080, 462), (1645, 480), (1690, 690), (1760, 1085), (1790, 1345), (1120, 1398), (108, 1415), (80, 1398)],
    [(1800, 895), (1897, 893), (1897, 1345), (1845, 1345), (1808, 1100)],
]
FIELDS = [  # darker open fields at the east edge
    [(1612, 140), (1890, 165), (1890, 370), (1660, 370), (1612, 300)],
    [(1695, 470), (1800, 470), (1890, 520), (1900, 855), (1765, 855)],
]
PONDS = [
    [(62, 190), (80, 158), (400, 152), (445, 165), (640, 255), (662, 290), (650, 322), (615, 332), (585, 322), (415, 250), (110, 250), (72, 235)],
    [(806, 160), (830, 140), (1490, 122), (1508, 138), (1550, 350), (1538, 370), (1515, 368), (822, 192)],
    [(690, 325), (705, 302), (745, 305), (1080, 462), (1360, 478), (1385, 500), (1390, 535), (1368, 562), (1335, 568), (1100, 566), (1060, 560), (732, 388), (695, 358)],
    [(76, 770), (96, 726), (140, 720), (225, 758), (305, 764), (332, 778), (340, 805), (328, 832), (290, 836), (205, 822), (110, 836), (80, 818)],
    [(356, 880), (372, 805), (420, 782), (470, 792), (560, 842), (650, 878), (740, 884), (850, 818), (935, 793), (1095, 880), (1405, 872), (1432, 885), (1442, 915), (1430, 942), (1398, 950), (480, 976), (400, 962), (365, 932)],
    [(530, 1272), (545, 1256), (1095, 1258), (1110, 1272), (1110, 1374), (1095, 1390), (545, 1390), (530, 1375)],
]
FOUNTAINS = [(255, 205), (490, 235), (860, 415), (1105, 518), (130, 778), (490, 895), (860, 910), (810, 1335), (1155, 1322)]
STREETS = {
    'Preakness_Stakes_Drive': [(12, 425), (40, 425), (110, 421), (260, 415), (400, 410), (470, 430), (560, 480), (740, 580), (900, 668), (1000, 710), (1080, 720), (1300, 716), (1440, 712), (1468, 703)],
    'Count_Fleet_Lane': [(1478, 718), (1480, 800), (1484, 900), (1488, 1000), (1492, 1084)],
    'Belmont_Stakes_Drive': [(12, 985), (50, 985), (130, 980), (210, 995), (300, 1040), (400, 1100), (470, 1120), (600, 1115), (800, 1108), (1000, 1100), (1200, 1094), (1492, 1085), (1790, 1075), (1965, 1070)],
    'Court_West': [(260, 417), (259, 500), (258, 575)],
    'Court_Centre': [(742, 583), (715, 620), (690, 670), (674, 696)],
    'Court_South': [(388, 1110), (365, 1160), (342, 1203)],
}
CUL_DE_SACS = [(1485, 700), (258, 597), (668, 718), (328, 1225)]
BOIS_DARC = [(12, -20), (12, 1465)]
TRAILS = [
    [(722, 252), (800, 294), (1080, 462), (1300, 470), (1640, 478), (1668, 455)],
    [(1668, 455), (1692, 600), (1730, 800), (1766, 960), (1796, 1090), (1802, 1340)],
    [(722, 252), (760, 140), (792, 116), (1500, 108), (1526, 122), (1562, 360), (1604, 422), (1668, 455)],
    [(712, 258), (75, 1388)],
]
HOMES = [  # (x px, y px, clockwise turn in degrees)
    (95, 348, 0), (175, 345, 0), (258, 342, 0), (335, 340, 2), (403, 350, 10), (468, 375, 25), (540, 408, 25),
    (190, 494, 0), (318, 497, 0), (178, 588, 0), (227, 664, -25), (307, 655, 25), (460, 510, 15),
    (655, 468, 25), (728, 508, 25), (805, 545, 25), (878, 582, 25), (955, 620, 25),
    (642, 628, 25), (762, 682, 25), (592, 712, 0), (605, 778, -30), (672, 800, 0), (735, 775, 30), (935, 750, 15),
    (1085, 665, 0), (1185, 668, 0), (1270, 662, 0), (1360, 660, 0), (1453, 625, 0), (1530, 640, 30),
    (1035, 785, 0), (1150, 795, 0), (1270, 788, 0), (1395, 782, 0), (1560, 730, 0), (1538, 835, 0),
    (128, 922, 0), (213, 932, 15), (115, 1048, 0), (330, 1000, 25), (432, 1052, 25),
    (540, 1072, 0), (660, 1068, 0), (785, 1062, 0), (910, 1055, 0), (1035, 1050, 0), (1158, 1045, 0), (1282, 1040, 0), (1405, 1035, 0), (1563, 1025, 0), (1658, 1020, 0), (1838, 1015, 0),
    (540, 1195, 0), (632, 1192, 0), (715, 1190, 0), (800, 1188, 0), (885, 1185, 0), (970, 1180, 0), (1055, 1178, 0), (1138, 1175, 0), (1222, 1172, 0), (1305, 1168, 0), (1390, 1165, 0), (1475, 1160, 0), (1560, 1155, 0), (1645, 1150, 0), (1720, 1150, 0), (1862, 1140, 0),
    (295, 1140, 30), (410, 1205, 30), (250, 1250, -15), (295, 1295, 25), (360, 1298, -20),
]

# ---------------------------------------------------------------- palette
COLOURS = {
    'Plinth': '#414649', 'Surround': '#DCD8CC', 'Grass': '#A9BB8F', 'Field': '#8FA57B', 'Parcel': '#F1EAD8',
    'Water': '#8FB9C1', 'Bank': '#7FA48E', 'Road': '#7B8083', 'Trail': '#F7F2E6', 'Wall': '#FAFAF4', 'Roof': '#45506B',
    'Canopy': '#6F8F5E', 'CanopyLight': '#88A26C', 'Trunk': '#6B5640', 'Stone': '#CDBFA3', 'Gold': '#C7B36D', 'Timber': '#3A3430',
    'Spray': '#FFFFFF',
}


def material(name):
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    hexa = COLOURS[name].lstrip('#')
    rgb = [int(hexa[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    srgb = [c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in rgb]
    bsdf = mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*srgb, 1)
    bsdf.inputs['Roughness'].default_value = .2 if name == 'Water' else .85
    mat.diffuse_color = (*srgb, 1)
    return mat


def collection(name):
    col = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(col)
    return col


def link(obj, col):
    col.objects.link(obj)
    return obj


# ---------------------------------------------------------------- geometry helpers
def chaikin(points, rounds=3, closed=True):
    pts = [Vector(p) for p in points]
    for _ in range(rounds):
        out = []
        count = len(pts) if closed else len(pts) - 1
        if not closed:
            out.append(pts[0])
        for i in range(count):
            a, b = pts[i], pts[(i + 1) % len(pts)]
            out += [a.lerp(b, .25), a.lerp(b, .75)]
        if not closed:
            out.append(pts[-1])
        pts = out
    return pts


def flat_shape(name, points_px, z, mat, col, smooth=0, depth=0.0):
    pts = [P(*p) for p in points_px]
    if smooth:
        pts = chaikin(pts, smooth)
    bm = bmesh.new()
    verts = [bm.verts.new((p.x, p.y, z)) for p in pts]
    face = bm.faces.new(verts)
    if depth:
        ext = bmesh.ops.extrude_face_region(bm, geom=[face])
        moved = [v for v in ext['geom'] if isinstance(v, bmesh.types.BMVert)]
        bmesh.ops.translate(bm, verts=moved, vec=(0, 0, -depth))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    mesh.materials.append(material(mat))
    return link(bpy.data.objects.new(name, mesh), col)


def ribbon(name, points_px, width, z, mat, col, smooth=2):
    pts = chaikin([P(*p) for p in points_px], smooth, closed=False) if smooth else [P(*p) for p in points_px]
    bm = bmesh.new()
    left, right = [], []
    for i, p in enumerate(pts):
        a = pts[max(0, i - 1)]
        b = pts[min(len(pts) - 1, i + 1)]
        t = (b - a).normalized()
        n = Vector((-t.y, t.x))
        left.append(bm.verts.new((*(p + n * width / 2), z)))
        right.append(bm.verts.new((*(p - n * width / 2), z)))
    for i in range(len(pts) - 1):
        bm.faces.new((left[i], right[i], right[i + 1], left[i + 1]))
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    mesh.materials.append(material(mat))
    return link(bpy.data.objects.new(name, mesh), col), pts


def disc(name, centre_px, radius, z, mat, col, segments=28):
    c = P(*centre_px)
    bm = bmesh.new()
    verts = [bm.verts.new((c.x + math.cos(a) * radius, c.y + math.sin(a) * radius, z))
             for a in (i / segments * math.tau for i in range(segments))]
    bm.faces.new(verts)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    mesh.materials.append(material(mat))
    return link(bpy.data.objects.new(name, mesh), col)


def box(bm, cx, cy, z0, w, d, h):
    result = bmesh.ops.create_cube(bm, size=1)
    verts = result['verts']
    bmesh.ops.scale(bm, vec=(w, d, h), verts=verts)
    bmesh.ops.translate(bm, vec=(cx, cy, z0 + h / 2), verts=verts)
    return verts


# ---------------------------------------------------------------- shared meshes
def home_mesh():
    """A single-storey ranch home: a wide main block and a garage wing, both with hipped roofs."""
    bm = bmesh.new()
    walls = []
    roofs = []

    def hipped(cx, cy, w, d, h, rise, over=.22):
        walls.extend(box(bm, cx, cy, 0, w, d, h))
        x, y = w / 2 + over, d / 2 + over
        ridge = max(0.0, (w - d) / 2)
        e = [bm.verts.new((cx + sx * x, cy + sy * y, h)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
        r = [bm.verts.new((cx - ridge, cy, h + rise)), bm.verts.new((cx + ridge, cy, h + rise))]
        faces = [bm.faces.new((e[0], e[1], r[1], r[0])), bm.faces.new((e[2], e[3], r[0], r[1])),
                 bm.faces.new((e[1], e[2], r[1])), bm.faces.new((e[3], e[0], r[0])), bm.faces.new((e[3], e[2], e[1], e[0]))]
        roofs.extend(faces)

    hipped(0, .2, 3.9, 2.7, 1.05, 1.0)
    hipped(-2.35, -.55, 1.6, 1.6, .95, .7, over=.16)
    mesh = bpy.data.meshes.new('Home')
    bm.normal_update()
    roof_set = set(roofs)
    for face in bm.faces:
        face.material_index = 1 if face in roof_set else 0
    bm.to_mesh(mesh)
    bm.free()
    mesh.materials.append(material('Wall'))
    mesh.materials.append(material('Roof'))
    return mesh


def tree_mesh(name, canopy):
    bm = bmesh.new()
    trunk = bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=.13, radius2=.1, depth=.8)['verts']
    bmesh.ops.translate(bm, vec=(0, 0, .4), verts=trunk)
    crown = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=.9)['verts']
    bmesh.ops.scale(bm, vec=(1, 1, 1.12), verts=crown)
    bmesh.ops.translate(bm, vec=(0, 0, 1.45), verts=crown)
    crown_set = set(crown)
    for face in bm.faces:
        face.material_index = 1 if all(v in crown_set for v in face.verts) else 0
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    mesh.materials.append(material('Trunk'))
    mesh.materials.append(material(canopy))
    return mesh


# ---------------------------------------------------------------- build
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

land = collection('Land')
water = collection('Water')
streets = collection('Streets')
homes = collection('Homes')
trees = collection('Trees')
features = collection('Features')

# A model on a plinth: a dark base, a warm surround, then grass, fields and homesite land.
flat_shape('Plinth', [(-30, -30), (2030, -30), (2030, 1475), (-30, 1475)], 0, 'Plinth', land, depth=3)
flat_shape('Surround', [(-30, -30), (2030, -30), (2030, 1475), (-30, 1475)], .01, 'Surround', land)
flat_shape('Grass', [(20, 30), (1905, 40), (1912, 1440), (20, 1440)], .03, 'Grass', land)
for i, field in enumerate(FIELDS):
    flat_shape(f'Field_{i + 1}', field, .05, 'Field', land)
for i, parcel in enumerate(PARCELS):
    flat_shape(f'Homesites_{i + 1}', parcel, .06, 'Parcel', land)

for i, pond in enumerate(PONDS):
    # Water inset inside a narrow grassy bank, as one object with two materials.
    pts = chaikin([P(*p) for p in pond], 3)
    bm = bmesh.new()
    face = bm.faces.new([bm.verts.new((p.x, p.y, .09)) for p in pts])
    bank = bmesh.ops.inset_individual(bm, faces=[face], thickness=.45, depth=0)['faces']
    for f in bank:
        f.material_index = 0
    face.material_index = 1
    mesh = bpy.data.meshes.new(f'Pond_{i + 1}')
    bm.to_mesh(mesh)
    bm.free()
    mesh.materials.append(material('Bank'))
    mesh.materials.append(material('Water'))
    link(bpy.data.objects.new(f'Pond_{i + 1}', mesh), water)

spray = bpy.data.meshes.new('Fountain')
bm = bmesh.new()
cone = bmesh.ops.create_cone(bm, cap_ends=True, segments=10, radius1=.42, radius2=.05, depth=.9)['verts']
bmesh.ops.translate(bm, vec=(0, 0, .55), verts=cone)
bm.to_mesh(spray)
bm.free()
spray.materials.append(material('Spray'))
for i, (x, y) in enumerate(FOUNTAINS):
    obj = link(bpy.data.objects.new(f'Fountain_{i + 1}', spray), water)
    obj.location = (*P(x, y), .1)

ribbon('Bois_DArc_Road', BOIS_DARC, 1.7, .07, 'Road', streets, smooth=0)
street_lines = {}
for name, line in STREETS.items():
    _, pts = ribbon(name, line, 1.5, .12, 'Road', streets)
    street_lines[name] = pts
for i, c in enumerate(CUL_DE_SACS):
    disc(f'Cul_de_sac_{i + 1}', c, 2.5, .12, 'Road', streets)
for i, trail in enumerate(TRAILS):
    ribbon(f'Trail_{i + 1}', trail, .55, .11 if i < 3 else .07, 'Trail', streets)

# Homes face their street; each is its own object so the web viewer can pick it.
house = home_mesh()
for i, (x, y, turn) in enumerate(HOMES):
    obj = link(bpy.data.objects.new(f'Home_{i + 1:02d}', house), homes)
    obj.location = (*P(x, y), .06)
    obj.rotation_euler.z = -math.radians(turn)

# Street trees line both kerbs, plus loose groups around the north lake and the greenbelt.
tree_meshes = [tree_mesh('Tree_A', 'Canopy'), tree_mesh('Tree_B', 'CanopyLight')]
centres = [P(*c) for c in CUL_DE_SACS]
home_spots = [P(x, y) for x, y, _ in HOMES]
spots = []
for name, pts in street_lines.items():
    travelled, step = 0.0, 2.7
    for a, b in zip(pts, pts[1:]):
        seg = (b - a)
        length = seg.length
        if not length:
            continue
        t, n = seg.normalized(), Vector((-seg.y, seg.x)).normalized()
        while travelled < length:
            p = a + t * travelled
            for side in (1, -1):
                q = p + n * side * 1.75
                if all((q - c).length > 3.3 for c in centres) and all((q - h).length > 3.0 for h in home_spots):
                    spots.append(q)
            travelled += step
        travelled -= length
for pond in (PONDS[1],):
    ring = chaikin([P(*p) for p in pond], 2)
    for k, p in enumerate(ring):
        if k % 2 == 0:
            centre = sum(ring, Vector((0, 0))) / len(ring)
            spots.append(p + (p - centre).normalized() * random.uniform(2.2, 4.5))
for k in range(26):
    t = k / 25
    base = P(712, 258).lerp(P(75, 1388), t)
    spots.append(base + Vector((random.uniform(-1.2, 1.2), random.uniform(-1.2, 1.2))))
for y in range(160, 1400, 30):
    spots.append(P(30, y) + Vector((random.uniform(-.3, .3), 0)))
for i, q in enumerate(spots):
    obj = link(bpy.data.objects.new(f'Tree_{i + 1:03d}', tree_meshes[i % 2]), trees)
    obj.location = (q.x, q.y, .06)
    s = random.uniform(.78, 1.18)
    obj.scale = (s, s, s * random.uniform(.92, 1.1))
    obj.rotation_euler.z = random.uniform(0, math.tau)

# Entries: a stone tower with a gold cap at the main entry, lower columns at the secondary entry.
def entry(name, px, py, height, width):
    bm = bmesh.new()
    stone = []
    stone += box(bm, 0, 0, 0, width, width, height)
    stone += box(bm, 0, 0, height, width * 1.25, width * 1.25, .18)
    gold = box(bm, 0, 0, height + .18, width * .55, width * .55, .35)
    gold_set = set(gold)
    for face in bm.faces:
        face.material_index = 1 if all(v in gold_set for v in face.verts) else 0
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    mesh.materials.append(material('Stone'))
    mesh.materials.append(material('Gold'))
    obj = link(bpy.data.objects.new(name, mesh), features)
    obj.location = (*P(px, py), .06)
    return obj


entry('Entry_Main_North', 36, 403, 3.0, 1.1)
entry('Entry_Main_South', 36, 447, 2.2, .8)
entry('Entry_Secondary_North', 40, 966, 1.8, .7)
entry('Entry_Secondary_South', 40, 1004, 1.8, .7)

# Column and timber fence along the Bois D'Arc Road frontage.
bm = bmesh.new()
for y in range(150, 1360, 34):
    if 395 < y < 455 or 955 < y < 1015:
        continue
    box(bm, *P(26, y), 0, .45, .45, .95)
    box(bm, *(P(26, y) + Vector((0, -1.7))), .45, .12, 3.4, .1)
    box(bm, *(P(26, y) + Vector((0, -1.7))), .7, .12, 3.4, .1)
fence = bpy.data.meshes.new('Fence')
bm.to_mesh(fence)
bm.free()
fence.materials.append(material('Timber'))
link(bpy.data.objects.new('Column_Timber_Fence', fence), features).location = (0, 0, .06)

# ---------------------------------------------------------------- light, camera, poster
world = bpy.data.worlds.new('World')
scene.world = world
world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (.93, .92, .87, 1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value = .45

sun = bpy.data.objects.new('Sun', bpy.data.lights.new('Sun', 'SUN'))
sun.data.energy = 2.1
sun.data.angle = math.radians(6)
sun.rotation_euler = (math.radians(48), 0, math.radians(-38))
scene.collection.objects.link(sun)

cam = bpy.data.objects.new('Camera', bpy.data.cameras.new('Camera'))
cam.data.lens = 50
scene.collection.objects.link(cam)
scene.camera = cam
# Matches the viewer's opening 3D view: from the south, tilted 52 degrees off vertical.
polar, azimuth, distance = math.radians(52), math.radians(-14), 400
cam.location = (distance * math.sin(polar) * math.sin(azimuth), -distance * math.sin(polar) * math.cos(azimuth), distance * math.cos(polar))
direction = Vector((0, 0, 0)) - cam.location
cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()

for engine in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
    try:
        scene.render.engine = engine
        break
    except TypeError:
        continue
scene.render.resolution_x, scene.render.resolution_y = 1600, 1000
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.view_settings.view_transform = 'Standard'
scene.render.filepath = os.path.join(OUT, 'belmont-poster.png')
bpy.ops.render.render(write_still=True)

# ---------------------------------------------------------------- export for the web
bpy.ops.object.select_all(action='DESELECT')
for obj in scene.objects:
    obj.select_set(obj.type == 'MESH')
bpy.ops.export_scene.gltf(
    filepath=os.path.join(OUT, 'belmont.glb'), export_format='GLB', use_selection=True,
    export_apply=True, export_yup=True, export_materials='EXPORT')

counts = {col.name: len(col.objects) for col in bpy.data.collections}
print('BELMONT_MODEL', counts, os.path.getsize(os.path.join(OUT, 'belmont.glb')))
