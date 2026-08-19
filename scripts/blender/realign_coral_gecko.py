"""Put the Coral Gecko's mesh back on its skeleton, then rebind it.

STATUS: the realignment is right and proven; the rebinding is not finished, and
this does not yet produce a shippable model. Its output still fails glTF
validation on two degenerate normals, and the hind legs bind about a fortieth of
what the front legs do. Do not run it as a fix.

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


def paint_authored_weights():
    """The scheme this creature was rigged with, re-applied to a centred mesh.

    Blender's automatic methods were tried first and are the wrong tool here.
    Heat weighting refuses this mesh outright; envelopes bind everything but
    smear it - the jaw came out leading seven thousand vertices, a quarter of the
    body. The original scheme divides the animal into regions by position, which
    is exactly what a low-poly quadruped wants, and its only fault was that it
    assumed a centred mesh. It has one now.

    Axes here are Blender's after a glTF import: x across, y along the body
    (head negative), z up.
    """
    groups = {bone.name: (mesh.vertex_groups.get(bone.name) or mesh.vertex_groups.new(name=bone.name))
              for bone in armature.data.bones if bone.use_deform}

    # The band's ceiling, taken from the thigh bones rather than written down.
    #
    # It used to be a flat 0.43 for the whole body, and the hind thigh bones
    # start at exactly 0.43 - so the entire upper hind leg fell outside the band
    # and into the body, and the back legs bound a fortieth of what the front
    # ones did. Each row now reaches as high as its own thigh does.
    def row_ceiling(prefix):
        heads = [armature.data.bones[f"Leg{prefix}{side}"].head_local.z
                 for side in ("L", "R") if f"Leg{prefix}{side}" in armature.data.bones]
        return (max(heads) + 0.09) if heads else 0.43

    front_ceiling = row_ceiling("F")
    back_ceiling = row_ceiling("B")

    def leg_ceiling(y):
        return front_ceiling if y < 0 else back_ceiling

    def share(weights):
        total = sum(max(0.0, value) for value in weights.values())
        if total <= 0:
            return {}
        return {name: max(0.0, value) / total for name, value in weights.items() if value > 0}

    for vertex in mesh.data.vertices:
        x, y, z = vertex.co
        if y < -0.49 and z < 0.535:
            blend = min(1.0, max(0.0, (-y - 0.45) / 0.26))
            weights = {"Jaw": 0.72 + blend * 0.20, "Head": 0.28 - blend * 0.16}
        elif y < -0.46:
            blend = min(1.0, max(0.0, (-y - 0.38) / 0.20))
            weights = {"Head": 0.72 + blend * 0.24, "Neck": 0.28 - blend * 0.20}
        elif y < -0.22 and z > 0.30:
            blend = min(1.0, max(0.0, (-y - 0.22) / 0.24))
            weights = {"Neck": 0.55 + blend * 0.35, "Body": 0.45 - blend * 0.30}
        elif z < leg_ceiling(y) and abs(x) > 0.13 and -0.48 <= y <= 0.50:
            suffix = ("F" if y < 0 else "B") + ("L" if x > 0 else "R")
            if z < 0.115:
                weights = {f"Foot{suffix}": 0.82, f"Shin{suffix}": 0.16, "Body": 0.02}
            elif z < 0.275:
                blend = min(1.0, max(0.0, (0.275 - z) / 0.16))
                weights = {f"Shin{suffix}": 0.62 + blend * 0.20, f"Leg{suffix}": 0.28, "Body": 0.10}
            else:
                weights = {f"Leg{suffix}": 0.76, "Body": 0.24}
        elif y > 0.23:
            along = min(0.999, max(0.0, (y - 0.23) / 0.78)) * 4
            segment = min(3, int(along))
            blend = along - segment
            weights = {f"Tail_{segment}": 1.0 - blend}
            if segment < 3:
                weights[f"Tail_{segment + 1}"] = blend
            else:
                weights["Tail_3"] = 1.0
            if y < 0.38:
                weights["Body"] = (0.38 - y) / 0.15 * 0.35
        else:
            weights = {"Body": 0.88, "Neck": 0.12 if y < -0.12 else 0.0}
        for name, value in share(weights).items():
            if name in groups:
                groups[name].add([vertex.index], value, "REPLACE")


mesh.parent = armature
mesh.matrix_parent_inverse = armature.matrix_world.inverted()
modifier = mesh.modifiers.new(name="Armature", type="ARMATURE")
modifier.object = armature
paint_authored_weights()
method = "authored-regions"

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
