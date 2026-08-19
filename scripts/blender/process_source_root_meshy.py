"""Turn the Meshy Source Root export into the valley's final boss runtime GLB.

The end of the run, and the only creature the player meets after the mutations
have stopped arriving - the one fight where what they built is all they have.

Five of the contract's six silhouette gates pass. The sixth asked for a single
amber eye and the model has a pair; waived by the producer on 2026-08-18 on the
grounds that at a camera 11.8 up and 16.25 back nobody counts eyes, and that the
root feet, the bark, the moss and the low sprawling spread already separate this
head from everything else in the map. The waiver is recorded in the contract
rather than left implicit, because the gates are only worth having if a failure
is visible afterwards.

Usage:
  blender --background --python scripts/blender/process_source_root_meshy.py \
      -- source.glb art-source/quality-3d-models/source-root-runtime-v1.glb
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
    raise SystemExit("Usage: blender --background --python process_source_root_meshy.py -- source.glb output.glb")

arguments = sys.argv[sys.argv.index("--") + 1:]
source_path = Path(arguments[0]).expanduser().resolve()
output_path = Path(arguments[1]).expanduser().resolve()
output_path.parent.mkdir(parents=True, exist_ok=True)

TARGET_RUNTIME_TRIANGLES = 26_000

# The contract proposed a world height of 3.6 and a body radius of 2.2 and asked
# for both to be checked. As with the Cliff Maw they are inconsistent: this body
# is 1.83 as long as it is tall, so a height of 3.6 gives a radius of 3.29 and a
# collision floor of 5.07 - and the ring burst's *inner* radius would then have
# to exceed 5.07 or the pattern always hits, which is the failure the contract
# itself names.
#
# The radius is kept. It makes the final boss the widest thing in the valley -
# 4.4 across against the Cliff Maw's 4.0 - and lower, which is the right threat
# shape for a creature whose three patterns all cover floor.
SOURCE_ROOT_BODY_RADIUS = 2.2

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
BODY, HIPS = roles["spine"], roles["hips"]
FRONT_L, FRONT_R = roles["frontLeft"], roles["frontRight"]
BACK_L, BACK_R = roles["backLeft"], roles["backRight"]

mesh.name = "SourceRootMesh"
mesh.data.name = "SourceRootMeshData"
armature.name = "SourceRootRig"
for material in mesh.data.materials:
    material.name = "SourceRootMaterial"
    if material.use_nodes and material.node_tree:
        principled = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
        if principled:
            principled.inputs["Metallic"].default_value = 0.0
            # Wet bark and living moss. Lower than the Cliff Maw's dry stone on
            # purpose: the two bosses stand three minutes apart and the sheen is
            # part of what says one is alive and the other is not.
            principled.inputs["Roughness"].default_value = 0.62
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
scale_factor = SOURCE_ROOT_BODY_RADIUS / max(1e-9, half_extent)
armature.scale = tuple(value * scale_factor for value in armature.scale)
bpy.context.view_layer.update()
runtime_size = source_size * scale_factor

source_triangles = sum(len(polygon.loop_indices) - 2 for polygon in mesh.data.polygons)
decimated = False
if source_triangles > TARGET_RUNTIME_TRIANGLES:
    bpy.ops.object.select_all(action="DESELECT")
    mesh.select_set(True)
    bpy.context.view_layer.objects.active = mesh
    decimate = mesh.modifiers.new(name="WebRuntimeRetopology", type="DECIMATE")
    decimate.decimate_type = "COLLAPSE"
    decimate.ratio = TARGET_RUNTIME_TRIANGLES / source_triangles
    decimate.use_collapse_triangulate = True
    bpy.ops.object.modifier_move_to_index(modifier=decimate.name, index=0)
    bpy.ops.object.modifier_apply(modifier=decimate.name)
    decimated = True
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

PITCH, YAW, PITCH_SIGN = probe_rotation_axes(armature, BODY, BODY[-1], axes["up"], axes["side"])
spread = make_spread(PITCH, PITCH_SIGN)
make_action = make_action_builder(armature)
D = math.radians

# Idle: it is a tree that has decided to move. Slow, deep, and mostly in the
# limbs - the body itself barely shifts, because roots hold.
make_action("Idle", 156, [
    (0, {}),
    (52, merge(spread(BODY, D(2.2), PITCH), spread(HIPS, D(-1.4), PITCH),
               spread(FRONT_L, D(3), PITCH, 0.7), spread(FRONT_R, D(-2.4), PITCH, 0.7))),
    (104, merge(spread(BODY, D(-1.8), PITCH), spread(HIPS, D(1.2), PITCH),
                spread(FRONT_R, D(3), PITCH, 0.7), spread(FRONT_L, D(-2.4), PITCH, 0.7))),
    (156, {}),
])

# Walk: root feet lift and grip. Wide, low and deliberate.
make_action("Walk", 76, [
    (0, {}),
    (19, merge(
        spread(BODY, D(4), YAW), spread(HIPS, D(-3), YAW),
        spread(FRONT_L, D(30), PITCH, 0.72), spread(BACK_R, D(26), PITCH, 0.72),
        spread(FRONT_R, D(-17), PITCH, 0.72), spread(BACK_L, D(-15), PITCH, 0.72),
    )),
    (38, {}),
    (57, merge(
        spread(BODY, D(-4), YAW), spread(HIPS, D(3), YAW),
        spread(FRONT_R, D(30), PITCH, 0.72), spread(BACK_L, D(26), PITCH, 0.72),
        spread(FRONT_L, D(-17), PITCH, 0.72), spread(BACK_R, D(-15), PITCH, 0.72),
    )),
    (76, {}),
])

make_action("Turn", 44, [
    (0, {}),
    (18, merge(spread(BODY, D(15), YAW), spread(HIPS, D(-10), YAW),
               spread(FRONT_L, D(17), PITCH, 0.8), spread(BACK_R, D(12), PITCH, 0.8))),
    (31, merge(spread(BODY, D(-6), YAW), spread(HIPS, D(4), YAW))),
    (44, {}),
])

# Slam: both forelimbs up and down. Symmetric, like the Cliff Maw's - and that
# is fine, because the player never sees the two bosses in the same fight. What
# must differ is this creature's own three patterns from each other.
make_action("Slam", 54, [
    (0, {}),
    (32, merge(
        spread(BODY, D(-28), PITCH), spread(HIPS, D(10), PITCH),
        spread(FRONT_L, D(-52), PITCH, 0.8), spread(FRONT_R, D(-52), PITCH, 0.8),
    )),
    (40, merge(
        spread(BODY, D(34), PITCH), spread(HIPS, D(-12), PITCH),
        spread(FRONT_L, D(60), PITCH, 0.8), spread(FRONT_R, D(60), PITCH, 0.8),
    )),
    (47, merge(spread(BODY, D(8), PITCH), spread(FRONT_L, D(14), PITCH, 0.8), spread(FRONT_R, D(14), PITCH, 0.8))),
    (54, {}),
])

# Lunge: the whole body drives forward along its own axis, root feet dragging.
# Told apart from the slam by where the mass goes - forward rather than up -
# which is the only thing separating them at a glance.
make_action("Lunge", 46, [
    (0, {}),
    (22, merge(
        spread(BODY, D(-14), PITCH), spread(HIPS, D(16), PITCH),
        spread(FRONT_L, D(-22), PITCH, 0.75), spread(FRONT_R, D(-22), PITCH, 0.75),
        spread(BACK_L, D(-26), PITCH, 0.75), spread(BACK_R, D(-26), PITCH, 0.75),
    )),
    (30, merge(
        spread(BODY, D(22), PITCH), spread(HIPS, D(-18), PITCH),
        spread(FRONT_L, D(34), PITCH, 0.75), spread(FRONT_R, D(34), PITCH, 0.75),
        spread(BACK_L, D(30), PITCH, 0.75), spread(BACK_R, D(30), PITCH, 0.75),
    )),
    (38, merge(spread(BODY, D(6), PITCH))),
    (46, {}),
])

# RingBurst: phase two. The wind-up is the opposite of the other two - the body
# gathers *inward and down* over the chest knot, limbs drawing under it, so the
# tell is the creature getting smaller before it gets bigger. The contract asked
# for a ring the player can look at during the wind-up; the knot is where it
# comes from and this pose puts it at the centre.
make_action("RingBurst", 64, [
    (0, {}),
    (34, merge(
        spread(BODY, D(20), PITCH), spread(HIPS, D(14), PITCH),
        spread(FRONT_L, D(30), PITCH, 0.8), spread(FRONT_R, D(30), PITCH, 0.8),
        spread(BACK_L, D(26), PITCH, 0.8), spread(BACK_R, D(26), PITCH, 0.8),
    )),
    (42, merge(
        spread(BODY, D(-26), PITCH), spread(HIPS, D(-20), PITCH),
        spread(FRONT_L, D(-44), PITCH, 0.78), spread(FRONT_R, D(-44), PITCH, 0.78),
        spread(BACK_L, D(-38), PITCH, 0.78), spread(BACK_R, D(-38), PITCH, 0.78),
    )),
    (52, merge(spread(BODY, D(-6), PITCH), spread(HIPS, D(-4), PITCH))),
    (64, {}),
])

make_action("Hit", 20, [
    (0, {}),
    (4, merge(spread(BODY, D(9), PITCH), spread(BODY, D(8), YAW), spread(HIPS, D(-5), YAW))),
    (11, merge(spread(BODY, D(-4), PITCH))),
    (20, {}),
])

# Death: the roots let go. It sinks rather than topples - the limbs splay out
# under the weight and the body settles onto the ground it came out of.
make_action("Death", 66, [
    (0, {}),
    (16, merge(spread(BODY, D(-12), PITCH), spread(FRONT_L, D(-18), PITCH, 0.8), spread(FRONT_R, D(-18), PITCH, 0.8))),
    (40, merge(
        spread(BODY, D(22), PITCH), spread(BODY, D(15), YAW), spread(HIPS, D(-10), PITCH),
        spread(FRONT_L, D(62), PITCH, 0.78), spread(FRONT_R, D(56), PITCH, 0.78),
        spread(BACK_L, D(48), PITCH, 0.78), spread(BACK_R, D(52), PITCH, 0.78),
    )),
    (54, merge(
        spread(BODY, D(26), PITCH), spread(BODY, D(18), YAW), spread(HIPS, D(-12), PITCH),
        spread(FRONT_L, D(68), PITCH, 0.78), spread(FRONT_R, D(62), PITCH, 0.78),
        spread(BACK_L, D(54), PITCH, 0.78), spread(BACK_R, D(58), PITCH, 0.78),
    )),
    (66, merge(
        spread(BODY, D(26), PITCH), spread(BODY, D(18), YAW), spread(HIPS, D(-12), PITCH),
        spread(FRONT_L, D(68), PITCH, 0.78), spread(FRONT_R, D(62), PITCH, 0.78),
        spread(BACK_L, D(54), PITCH, 0.78), spread(BACK_R, D(58), PITCH, 0.78),
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

print("EA_SOURCE_ROOT_PROCESS=" + json.dumps({
    "source": str(source_path),
    "output": str(output_path),
    "removedHelperMeshes": removed_helpers,
    "sourceTriangles": source_triangles,
    "runtimeTriangles": runtime_triangles,
    "decimated": decimated,
    "removedUvFaces": removed_uv_faces,
    "removedTangentFaces": removed_tangent_faces,
    "resizedImages": resized,
    "bones": len(armature.data.bones),
    "scaleFactor": round(scale_factor, 4),
    "runtimeSize": [round(value, 3) for value in runtime_size],
    "bodyRadius": SOURCE_ROOT_BODY_RADIUS,
    "collisionFloor": round(1.56 + SOURCE_ROOT_BODY_RADIUS + 0.22, 2),
    "roles": roles,
    "axes": axes,
    "boneAxes": {"pitch": PITCH, "yaw": YAW, "pitchSign": PITCH_SIGN},
    "actions": sorted(action.name for action in bpy.data.actions),
}, ensure_ascii=False))
