"""Turn the Meshy Pebble Dumpling export into the valley's scree grazer runtime GLB.

The third passive body, and the one that belongs on rock. The valley's scree
branches are dressed with the same three boulders scaled three to twelve times,
so a creature that reads as one of them until it moves is free tension - it
needs no mechanic, only to be placed among real stones.

Its rig has no spine to speak of: all four legs hang off a single trunk
vertebra, which is what a round animal looks like to a solver. The shared-bone
rule in `meshy_autorig_quadruped` exists because of this body.

Usage:
  blender --background --python scripts/blender/process_pebble_dumpling_meshy.py \
      -- source.glb art-source/quality-3d-models/pebble-dumpling-runtime-v1.glb
"""

import json
import math
import os
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from meshy_autorig_quadruped import resolve_unnamed_quadruped
from meshy_cleanup import remove_degenerate_uv_faces, remove_invalid_tangent_faces
from meshy_quadruped_rig import make_action_builder, make_spread, merge, probe_rotation_axes, reset_pose

if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python process_pebble_dumpling_meshy.py -- source.glb output.glb")

arguments = sys.argv[sys.argv.index("--") + 1:]
source_path = Path(arguments[0]).expanduser().resolve()
output_path = Path(arguments[1]).expanduser().resolve()
output_path.parent.mkdir(parents=True, exist_ok=True)

TARGET_RUNTIME_TRIANGLES = 14_000

# Carapace family radius. Round, slow and armoured is what this animal is, and
# sizing by footprint keeps the circle that blocks the player matched to the body
# they can see.
PEBBLE_BODY_RADIUS = 1.42

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))
armature = next(item for item in bpy.context.scene.objects if item.type == "ARMATURE")
mesh = max((item for item in bpy.context.scene.objects if item.type == "MESH"), key=lambda item: len(item.data.vertices))

for pose_bone in armature.pose.bones:
    pose_bone.custom_shape = None
removed_helpers = []
for item in list(bpy.context.scene.objects):
    if item.type == "MESH" and item != mesh:
        removed_helpers.append(item.name)
        bpy.data.objects.remove(item, do_unlink=True)

roles, axes = resolve_unnamed_quadruped(armature)
BODY, HEAD = roles["spine"], roles["head"]
FRONT_L, FRONT_R = roles["frontLeft"], roles["frontRight"]
BACK_L, BACK_R = roles["backLeft"], roles["backRight"]

# The face and tail nubs hang off the head bone and the resolver leaves them
# unclaimed, because it only names what every quadruped has. Taken by position:
# forward of the root is the face, behind it is the tail.
by_name = {bone.name: bone for bone in armature.data.bones}
root_forward = by_name[roles["root"][0]].head_local[axes["forward"]]
extras = [bone for bone in by_name[HEAD[-1]].children] if HEAD else []
FACE = [bone.name for bone in extras if bone.head_local[axes["forward"]] > root_forward]
TAIL = [bone.name for bone in extras if bone.head_local[axes["forward"]] <= root_forward]

mesh.name = "PebbleDumplingMesh"
mesh.data.name = "PebbleDumplingMeshData"
armature.name = "PebbleDumplingRig"
for material in mesh.data.materials:
    material.name = "PebbleDumplingMaterial"
    if material.use_nodes and material.node_tree:
        principled = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
        if principled:
            principled.inputs["Metallic"].default_value = 0.0
            # River stone, worn smooth, with a damp moss cap. Less rough than the
            # Cliff Maw's dry fractured sandstone - this one has been in water.
            principled.inputs["Roughness"].default_value = 0.72
            # Same reasoning as the Cliff Maw: a 1.6MB map encoding "not metal,
            # somewhat rough" over a creature that is uniformly both.
            for socket in ("Metallic", "Roughness"):
                for link in list(principled.inputs[socket].links):
                    material.node_tree.links.remove(link)

depsgraph = bpy.context.evaluated_depsgraph_get()
evaluated = mesh.evaluated_get(depsgraph)
evaluated_mesh = evaluated.to_mesh()
low = Vector((1e18, 1e18, 1e18))
high = Vector((-1e18, -1e18, -1e18))
for vertex in evaluated_mesh.vertices:
    world = evaluated.matrix_world @ vertex.co
    for axis in range(3):
        low[axis] = min(low[axis], world[axis])
        high[axis] = max(high[axis], world[axis])
evaluated.to_mesh_clear()
source_size = high - low
half_extent = max(source_size.x, source_size.y) / 2
scale_factor = PEBBLE_BODY_RADIUS / max(1e-9, half_extent)
armature.scale = tuple(value * scale_factor for value in armature.scale)
bpy.context.view_layer.update()
runtime_size = source_size * scale_factor

source_triangles = sum(len(polygon.loop_indices) - 2 for polygon in mesh.data.polygons)
bpy.ops.object.select_all(action="DESELECT")
mesh.select_set(True)
bpy.context.view_layer.objects.active = mesh
decimate = mesh.modifiers.new(name="WebRuntimeRetopology", type="DECIMATE")
decimate.decimate_type = "COLLAPSE"
decimate.ratio = min(1.0, TARGET_RUNTIME_TRIANGLES / source_triangles)
decimate.use_collapse_triangulate = True
bpy.ops.object.modifier_move_to_index(modifier=decimate.name, index=0)
bpy.ops.object.modifier_apply(modifier=decimate.name)
for polygon in mesh.data.polygons:
    polygon.use_smooth = True
removed_uv_faces = remove_degenerate_uv_faces(mesh.data)
removed_tangent_faces = remove_invalid_tangent_faces(mesh.data)
runtime_triangles = sum(len(polygon.loop_indices) - 2 for polygon in mesh.data.polygons)

resized = []
for image in bpy.data.images:
    if image.type == "IMAGE" and max(image.size) > 1024:
        resized.append([image.name, list(image.size)])
        image.scale(1024, 1024)
        image.pack()

armature.animation_data_create()
while armature.animation_data.nla_tracks:
    armature.animation_data.nla_tracks.remove(armature.animation_data.nla_tracks[0])
for action in list(bpy.data.actions):
    bpy.data.actions.remove(action)

PITCH, YAW, PITCH_SIGN = probe_rotation_axes(armature, BODY, (HEAD or BODY)[-1], axes["up"], axes["side"])
spread = make_spread(PITCH, PITCH_SIGN)
make_action = make_action_builder(armature)
D = math.radians

# Idle: it is pretending to be a rock, and mostly succeeding. Almost nothing
# moves except a slow blink of the head - which is the whole joke and the whole
# tension: the player walks past a boulder that was watching them.
make_action("Idle", 144, [
    (0, {}),
    (52, merge(spread(BODY, D(1.1), PITCH), spread(HEAD, D(3.5), PITCH))),
    (96, merge(spread(BODY, D(-0.8), PITCH), spread(HEAD, D(-2.6), PITCH), spread(HEAD, D(4), YAW))),
    (144, {}),
])

# Walk: a rock with short legs. The body barely swings; the work is the legs
# reaching out from under a shell that stays level.
make_action("Walk", 60, [
    (0, {}),
    (15, merge(
        spread(BODY, D(2.2), YAW),
        spread(FRONT_L, D(24), PITCH, 0.7), spread(BACK_R, D(21), PITCH, 0.7),
        spread(FRONT_R, D(-15), PITCH, 0.7), spread(BACK_L, D(-13), PITCH, 0.7),
    )),
    (30, {}),
    (45, merge(
        spread(BODY, D(-2.2), YAW),
        spread(FRONT_R, D(24), PITCH, 0.7), spread(BACK_L, D(21), PITCH, 0.7),
        spread(FRONT_L, D(-15), PITCH, 0.7), spread(BACK_R, D(-13), PITCH, 0.7),
    )),
    (60, {}),
])

# Shove: struck, it defends itself the only way this anatomy can - it leans back
# and drops its whole weight forward. No bite, no claw, no leap: it is a stone
# with legs and the contact pose has to say so.
make_action("Shove", 38, [
    (0, {}),
    (13, merge(
        spread(BODY, D(-18), PITCH), spread(HEAD, D(-14), PITCH),
        spread(FRONT_L, D(-26), PITCH, 0.75), spread(FRONT_R, D(-26), PITCH, 0.75),
    )),
    (19, merge(
        spread(BODY, D(24), PITCH), spread(HEAD, D(18), PITCH),
        spread(FRONT_L, D(32), PITCH, 0.75), spread(FRONT_R, D(32), PITCH, 0.75),
    )),
    (27, merge(spread(BODY, D(6), PITCH), spread(HEAD, D(5), PITCH))),
    (38, {}),
])

make_action("Hit", 20, [
    (0, {}),
    (4, merge(spread(BODY, D(11), PITCH), spread(BODY, D(9), YAW), spread(HEAD, D(16), YAW))),
    (11, merge(spread(BODY, D(-4), PITCH), spread(HEAD, D(-6), YAW))),
    (20, {}),
])

# Death: the legs pull in and it settles. It ends as what it was pretending to
# be, which is the only ending this silhouette has.
make_action("Death", 54, [
    (0, {}),
    (12, merge(spread(BODY, D(-9), PITCH), spread(HEAD, D(14), PITCH))),
    (32, merge(
        spread(BODY, D(13), PITCH), spread(BODY, D(21), YAW), spread(HEAD, D(-18), PITCH),
        spread(FRONT_L, D(-34), PITCH, 0.8), spread(FRONT_R, D(-31), PITCH, 0.8),
        spread(BACK_L, D(-29), PITCH, 0.8), spread(BACK_R, D(-33), PITCH, 0.8),
    )),
    (44, merge(
        spread(BODY, D(15), PITCH), spread(BODY, D(24), YAW), spread(HEAD, D(-21), PITCH),
        spread(FRONT_L, D(-38), PITCH, 0.8), spread(FRONT_R, D(-35), PITCH, 0.8),
        spread(BACK_L, D(-33), PITCH, 0.8), spread(BACK_R, D(-37), PITCH, 0.8),
    )),
    (54, merge(
        spread(BODY, D(15), PITCH), spread(BODY, D(24), YAW), spread(HEAD, D(-21), PITCH),
        spread(FRONT_L, D(-38), PITCH, 0.8), spread(FRONT_R, D(-35), PITCH, 0.8),
        spread(BACK_L, D(-33), PITCH, 0.8), spread(BACK_R, D(-37), PITCH, 0.8),
    )),
])

armature.animation_data.action = None
reset_pose(armature)

mesh_world = mesh.matrix_world.copy()
mesh.parent = None
mesh.matrix_world = mesh_world

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
    export_anim_slide_to_zero=True,
)

print("EA_PEBBLE_PROCESS=" + json.dumps({
    "source": str(source_path),
    "output": str(output_path),
    "removedHelperMeshes": removed_helpers,
    "sourceTriangles": source_triangles,
    "runtimeTriangles": runtime_triangles,
    "removedUvFaces": removed_uv_faces,
    "removedTangentFaces": removed_tangent_faces,
    "resizedImages": resized,
    "bones": len(armature.data.bones),
    "scaleFactor": round(scale_factor, 4),
    "runtimeSize": [round(value, 3) for value in runtime_size],
    "bodyRadius": PEBBLE_BODY_RADIUS,
    "roles": roles,
    "face": FACE,
    "tail": TAIL,
    "axes": axes,
    "boneAxes": {"pitch": PITCH, "yaw": YAW, "pitchSign": PITCH_SIGN},
    "actions": sorted(action.name for action in bpy.data.actions),
}, ensure_ascii=False))
