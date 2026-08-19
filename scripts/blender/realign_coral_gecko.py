"""Put the Coral Gecko's mesh back on its skeleton, then rebind it.

STATUS: the realignment is right and proven; the rebinding is not. Do not run
this as a fix.

Six weighting schemes were tried on the realigned mesh - the asset's own
positional regions, Blender's heat and envelope binding, nearest-bone,
nearest-limb-shared, and proximity in absolute and in bone-relative units. Each
one binds most of the skeleton and starves two or three bones somewhere else:
absolute proximity leaves the hind shins empty, bone-relative proximity fixes
those and empties Body and Jaw, the authored regions bind the hind legs at a
fortieth of the front ones. This is not a tuning problem with one more constant
in it.

What it establishes, and what the next attempt should start from:

  The mesh is symmetric about x = -0.140, not about zero. Mirroring it about its
  own plane leaves a mean mismatch of 0.023; about the skeleton's, 0.129. So the
  body sits 0.14 to one side of a rig centred on zero, and that single offset is
  why LegBL, ShinBL, FootBL and LegFL each owned no vertices at all in every
  version of this asset.

Three traps met on the way, all of them worth keeping:

  Unparenting a mesh without keeping its world matrix moves it off the skeleton,
  and weighting then binds nothing.

  Heat weighting reports FINISHED and writes its failure to the info log, so a
  mesh it cannot solve returns twenty-one empty vertex groups and no exception.
  The check has to be the number of weighted vertices, not the return value.

  glTF is Y-up and Blender is Z-up, so a measurement written against the file
  and one written against the scene disagree about which end is the head. Two
  separate conclusions here were drawn from that mistake before it was caught.

The player's starting body walked with its toes. Four leg bones drove almost
nothing - LegBL, ShinBL and FootBL owned no vertices at all, LegFL owned none
while its foot owned 201 - and Head owned 11,959 of 25,416, which is what
stretched the skin.

Neither the clips nor the sculpt were at fault. The mesh is symmetric; it is
simply not where the skeleton is. Mirroring it about x=0 leaves a mean mismatch
of 0.129, and about x=-0.140 leaves 0.023 - so the body sits 0.14 to one side of
a rig centred on zero, and the left legs had almost no geometry near them to
bind to. Every version of this asset carries the same zeroes because they all
came from that one offset.

So: find the plane the mesh is actually symmetric about, move it onto the
skeleton's, and rebind. The plane is measured rather than assumed, because a
number like 0.14 hard-coded here is the same class of mistake.

Usage:
  blender --background --python scripts/blender/realign_coral_gecko.py \
      -- in.glb out.glb
"""

import json
import sys
from pathlib import Path

import bpy
from mathutils import Vector

if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python realign_coral_gecko.py -- in.glb out.glb")

arguments = sys.argv[sys.argv.index("--") + 1:]
source_path = Path(arguments[0]).expanduser().resolve()
output_path = Path(arguments[1]).expanduser().resolve()
output_path.parent.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))
armature = next(item for item in bpy.context.scene.objects if item.type == "ARMATURE")
mesh = max((item for item in bpy.context.scene.objects if item.type == "MESH"), key=lambda item: len(item.data.vertices))

points = [mesh.matrix_world @ vertex.co for vertex in mesh.data.vertices]


def mirror_mismatch(plane):
    """Mean distance from a mirrored point to the nearest real one."""
    cell = 0.05
    buckets = {}
    for point in points:
        key = (round(point.y / cell), round(point.z / cell))
        buckets.setdefault(key, []).append(point)
    total = 0.0
    counted = 0
    for point in points[::7]:
        target = Vector((2 * plane - point.x, point.y, point.z))
        key = (round(target.y / cell), round(target.z / cell))
        best = None
        for dy in (-1, 0, 1):
            for dz in (-1, 0, 1):
                for candidate in buckets.get((key[0] + dy, key[1] + dz), ()):
                    distance = (candidate - target).length
                    if best is None or distance < best:
                        best = distance
        if best is not None:
            total += best
            counted += 1
    return total / max(1, counted)


# Swept rather than solved: the surface is not smooth enough for a derivative to
# help, and forty samples over the body's own width is cheap.
plane = min((round(-0.25 + step * 0.005, 4) for step in range(81)), key=mirror_mismatch)
mismatch = mirror_mismatch(plane)
centred = mirror_mismatch(0.0)
if mismatch > 0.05:
    raise SystemExit(f"Mesh is not symmetric about any plane (best {plane} at {mismatch:.3f}); this is not an offset")

# The skeleton is the thing the animation is authored against, so the mesh moves
# to it. Applied to the vertices rather than the object transform, so the shift
# survives the rebind and the export without an extra node in the hierarchy.
for vertex in mesh.data.vertices:
    vertex.co.x -= plane
mesh.data.update()

for modifier in [item for item in mesh.modifiers if item.type == "ARMATURE"]:
    mesh.modifiers.remove(modifier)
mesh.vertex_groups.clear()
# Keeping the world matrix matters: unparenting without it moves the mesh off
# the skeleton, and weighting then binds nothing at all.
world = mesh.matrix_world.copy()
mesh.parent = None
mesh.matrix_world = world
# Root is a carrier, not a deformer. Left deforming, heat weighting hands it the
# pelvis - it led 10,325 vertices - and both hind thighs end up influencing
# geometry without ever leading any, which is a back leg that still does not
# visibly move.
root_bone = next((bone for bone in armature.data.bones if bone.parent is None), None)
if root_bone is not None:
    root_bone.use_deform = False

armature.data.pose_position = "REST"
bpy.context.view_layer.update()


def paint_by_proximity():
    """Weight every vertex by how near it is to each bone.

    No thresholds. The scheme this creature was rigged with divides the body by
    absolute coordinates - `z < 0.43`, `-0.48 <= y <= 0.50` - and those were
    calibrated against a different mesh: applied here, low head vertices fell
    into the leg band while hind thighs fell out of it, which is why the front
    legs bound a thousand vertices and the back ones forty.

    Distance to the bone needs no calibration. Each vertex takes the three
    nearest bones, weighted by inverse square distance, which is what a skin
    does anyway: bend at the joint, follow the nearest limb, blend where two
    meet.
    """
    groups = {bone.name: (mesh.vertex_groups.get(bone.name) or mesh.vertex_groups.new(name=bone.name))
              for bone in armature.data.bones if bone.use_deform}
    segments = [
        (bone.name, bone.head_local.copy(), (bone.tail_local - bone.head_local).copy(), bone.length)
        for bone in armature.data.bones if bone.use_deform
    ]

    for vertex in mesh.data.vertices:
        ranked = []
        for name, head, axis, length in segments:
            along = max(0.0, min(1.0, (vertex.co - head).dot(axis) / (axis.length_squared or 1.0)))
            distance = (vertex.co - (head + axis * along)).length
            # Softened by the bone's own length, so a long spine does not
            # out-pull a short toe simply by being closer everywhere. This is
            # the closest any attempt got: only the two hind shins end up
            # unbound. Dividing by length instead - claiming geometry on each
            # bone's own scale - fixes those two and starves Body and Jaw, which
            # is the trade every attempt here has run into.
            ranked.append((distance + length * 0.12, name))
        ranked.sort()
        chosen = ranked[:3]
        shares = {name: 1.0 / (distance * distance) for distance, name in chosen}
        total = sum(shares.values()) or 1.0
        for name, value in shares.items():
            groups[name].add([vertex.index], value / total, "REPLACE")


mesh.parent = armature
mesh.matrix_parent_inverse = armature.matrix_world.inverted()
modifier = mesh.modifiers.new(name="Armature", type="ARMATURE")
modifier.object = armature
paint_by_proximity()
method = "proximity"

armature.data.pose_position = "POSE"
bpy.context.view_layer.update()

names = {group.index: group.name for group in mesh.vertex_groups}
owned = {group.name: 0 for group in mesh.vertex_groups}
dominant = {group.name: 0 for group in mesh.vertex_groups}
for vertex in mesh.data.vertices:
    best = None
    for element in vertex.groups:
        if element.weight > 0.15:
            owned[names[element.group]] = owned.get(names[element.group], 0) + 1
        if best is None or element.weight > best[1]:
            best = (names[element.group], element.weight)
    if best:
        dominant[best[0]] = dominant.get(best[0], 0) + 1

# Dominance, not influence. A vertex can sit above fifteen percent on four bones
# at once, so counting influence made every bone near the spine look like it
# owned a third of the body. What matters is which bone actually leads it.
total = len(mesh.data.vertices)
deform = [bone.name for bone in armature.data.bones if bone.use_deform]
starved = [name for name in deform if dominant.get(name, 0) == 0]
# A third, not a quarter. This creature's head carries a large crest and the
# authored scheme has always given it about thirty percent - v3 led 7,776
# vertices with it, the same number this produces. The ceiling is here to catch
# a bone swallowing the body, not to argue with the sculpt.
hogs = [(name, count) for name, count in dominant.items() if count > total * 0.34]
if starved:
    raise SystemExit(f"Bones still own no geometry: {starved}")
if hogs:
    raise SystemExit(f"A single bone owns more than a third of the mesh: {hogs}")

bpy.ops.object.select_all(action="DESELECT")
mesh.select_set(True)
armature.select_set(True)
bpy.context.view_layer.objects.active = armature
# Two degenerate normals survive the rebind and the glTF validator rejects them
# outright. Recalculated rather than tolerated: a model that fails validation is
# a model that may fail to load.
bpy.ops.object.select_all(action="DESELECT")
mesh.select_set(True)
bpy.context.view_layer.objects.active = mesh
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.object.mode_set(mode="OBJECT")

bpy.ops.object.select_all(action="DESELECT")
mesh.select_set(True)
armature.select_set(True)
bpy.context.view_layer.objects.active = armature
bpy.ops.export_scene.gltf(
    filepath=str(output_path),
    export_format="GLB",
    use_selection=True,
    export_yup=True,
    export_tangents=True,
    export_materials="EXPORT",
    export_animations=True,
    export_animation_mode="NLA_TRACKS",
    export_force_sampling=True,
    export_frame_range=False,
)

print("EA_REALIGN=" + json.dumps({
    "source": str(source_path),
    "output": str(output_path),
    "mirrorPlane": plane,
    "mismatchAtPlane": round(mismatch, 4),
    "mismatchAtZero": round(centred, 4),
    "method": method,
    "vertices": total,
    "influences": {name: owned.get(name, 0) for name in deform},
    "dominantFor": {name: dominant.get(name, 0) for name in deform},
}, ensure_ascii=False))
