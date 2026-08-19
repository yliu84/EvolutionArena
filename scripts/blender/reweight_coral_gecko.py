"""Rebind the Coral Gecko's skin to its skeleton.

STATUS: does not yet produce an acceptable result, and should not be run as a
fix. Kept for the measurements in it and for the two traps it documents.

The reason it cannot work as written is in the mesh, not in the binding. The
skeleton is symmetric - LegBL sits at x=+0.24 and LegBR at x=-0.24 - and the
mesh is not: its x median is -0.128 and its mean -0.130, with 12,599 vertices
below x=-0.13 against 562 above it. Three quarters of the body sits on one side
of a centred skeleton. No weighting scheme recovers from that; the left legs
have almost no geometry near them to bind.

The player's starting body walked with its toes. Measured on the shipped
runtime GLB, three of its leg bones influenced no geometry at all -
`LegBL`, `ShinBL`, `FootBL` and `LegFL` each owned zero vertices - so when the
walk cycle swung those bones by sixty degrees nothing followed but the foot,
which was the one part still bound. And `Head` owned 11,959 of 25,416
vertices, nearly half the mesh, which is what stretched the skin whenever it
turned.

The clips were never the problem: `Run` moves each thigh 62 degrees, each shin
42 and each foot 27, and `Idle` moves the legs not at all. Nor is the mesh. The
weighting was, and it has been wrong in every version of this asset - v2, v3 and
v4 all carry the same zeroes.

Rather than repair a positional weighting scheme written against an earlier
coordinate convention, this rebinds from the geometry itself and then checks the
result: every deform bone must own vertices, and no single bone may own more
than a quarter of the mesh.

Usage:
  blender --background --python scripts/blender/reweight_coral_gecko.py \
      -- in.glb out.glb
"""

import json
import sys
from pathlib import Path

import bpy
from mathutils import Vector

if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python reweight_coral_gecko.py -- in.glb out.glb")

arguments = sys.argv[sys.argv.index("--") + 1:]
source_path = Path(arguments[0]).expanduser().resolve()
output_path = Path(arguments[1]).expanduser().resolve()
output_path.parent.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))

armature = next(item for item in bpy.context.scene.objects if item.type == "ARMATURE")
mesh = max((item for item in bpy.context.scene.objects if item.type == "MESH"), key=lambda item: len(item.data.vertices))


def owned_vertices():
    """Vertices each bone holds at more than a fifteen percent share."""
    index_of = {group.index: group.name for group in mesh.vertex_groups}
    counts = {group.name: 0 for group in mesh.vertex_groups}
    for vertex in mesh.data.vertices:
        for element in vertex.groups:
            if element.weight > 0.15:
                counts[index_of[element.group]] = counts.get(index_of[element.group], 0) + 1
    return counts


before = owned_vertices()

# Rest pose, or the bind is computed against whatever frame happened to be
# loaded and every clip deforms from the wrong shape.
armature.data.pose_position = "REST"
bpy.context.view_layer.update()

for modifier in [m for m in mesh.modifiers if m.type == "ARMATURE"]:
    mesh.modifiers.remove(modifier)
mesh.vertex_groups.clear()
# Unparenting without keeping the world matrix moves the mesh off the skeleton,
# and heat weighting then finds no bone near any vertex and silently binds
# nothing. The first attempt at this left every one of the twenty-one bones
# owning zero geometry - worse than the bug it was fixing.
world = mesh.matrix_world.copy()
mesh.parent = None
mesh.matrix_world = world
bpy.context.view_layer.update()

mesh_centre = sum((mesh.matrix_world @ vertex.co for vertex in mesh.data.vertices), Vector()) / len(mesh.data.vertices)
bone_centre = sum((armature.matrix_world @ bone.head_local for bone in armature.data.bones), Vector()) / len(armature.data.bones)
if (mesh_centre - bone_centre).length > 1.5:
    raise SystemExit(f"Mesh and skeleton are {(mesh_centre - bone_centre).length:.2f} apart; binding would find nothing")

def bind(kind):
    bpy.ops.object.select_all(action="DESELECT")
    mesh.select_set(True)
    armature.select_set(True)
    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.parent_set(type=kind)
    return sum(1 for vertex in mesh.data.vertices if vertex.groups)


# Measured, not caught. Heat weighting reports FINISHED and writes its failure
# to the info log, so a mesh it cannot solve comes back with twenty-one empty
# vertex groups and no exception - which is exactly what this asset does. The
# first version of this script trusted the return value and produced a model
# with no skinning at all.
method = "heat"
weighted = bind("ARMATURE_AUTO")
if weighted == 0:
    mesh.vertex_groups.clear()
    for modifier in [m for m in mesh.modifiers if m.type == "ARMATURE"]:
        mesh.modifiers.remove(modifier)
    world_again = mesh.matrix_world.copy()
    mesh.parent = None
    mesh.matrix_world = world_again
    bpy.context.view_layer.update()
    # Envelopes are cruder, but they always produce a binding, and a crude leg
    # that moves beats a perfect one that does not.
    for bone in armature.data.bones:
        bone.envelope_distance = max(bone.envelope_distance, bone.length * 0.9)
    method = "envelope"
    weighted = bind("ARMATURE_ENVELOPE")
if weighted == 0:
    raise SystemExit("Neither heat nor envelope weighting bound a single vertex")

armature.data.pose_position = "POSE"
bpy.context.view_layer.update()

def nearest_bone_topup(names):
    """Gives a starved bone the geometry that is closest to it.

    Envelopes leave the odd bone empty where a neighbour's envelope swallows the
    same region - here it was one shin, whose opposite number bound fine. Rather
    than widen every envelope until the asymmetry happens to close, the vertices
    whose nearest bone segment *is* this one are handed to it directly, which is
    what an envelope was approximating in the first place.
    """
    for name in names:
        bone = armature.data.bones[name]
        head = armature.matrix_world @ bone.head_local
        tail = armature.matrix_world @ bone.tail_local
        axis = tail - head
        length_squared = axis.length_squared or 1.0
        group = mesh.vertex_groups.get(name) or mesh.vertex_groups.new(name=name)
        claimed = []
        for vertex in mesh.data.vertices:
            world = mesh.matrix_world @ vertex.co
            along = max(0.0, min(1.0, (world - head).dot(axis) / length_squared))
            if (world - (head + axis * along)).length <= bone.length * 0.75:
                claimed.append(vertex.index)
        if not claimed:
            continue
        group.add(claimed, 0.75, "REPLACE")

    # Weights are shares, so anything topped up has to be renormalised or the
    # claimed vertices would be driven harder than one bone's worth.
    for vertex in mesh.data.vertices:
        total = sum(element.weight for element in vertex.groups)
        if total <= 0:
            continue
        for element in vertex.groups:
            mesh.vertex_groups[element.group].add([vertex.index], element.weight / total, "REPLACE")


after = owned_vertices()
starved_now = [name for name in after if after[name] == 0]
if starved_now:
    nearest_bone_topup(starved_now)

after = owned_vertices()
total = len(mesh.data.vertices)
deform = [bone.name for bone in armature.data.bones if bone.use_deform]
starved = [name for name in deform if after.get(name, 0) == 0]
hogs = [(name, count) for name, count in after.items() if count > total * 0.25]
if starved:
    raise SystemExit(f"Bones still own no geometry after rebinding: {starved}")
if hogs:
    raise SystemExit(f"A single bone owns more than a quarter of the mesh: {hogs}")

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

print("EA_REWEIGHT=" + json.dumps({
    "source": str(source_path),
    "output": str(output_path),
    "method": method,
    "vertices": total,
    "before": {name: before.get(name, 0) for name in deform},
    "after": {name: after.get(name, 0) for name in deform},
}, ensure_ascii=False))
