"""Turn the Meshy Cliff Maw export into the valley's gate-two boss runtime GLB.

The first source this project has received that already fits its budget: 16,984
triangles against a boss allowance of 26,000, so nothing is decimated. What it
does not have is bone names - this is a UniRig auto-rig - or a single frame of
animation.

Roles are recovered geometrically by `meshy_autorig_quadruped`, which was written
for this creature after the beetle-shaped classifier returned nothing usable.
Two things it got wrong on the way are now asserts rather than assumptions: the
"up" axis is found from how the feet sit rather than from distance to the root,
and "side" is the axis the feet mirror across rather than the one they spread
furthest along - those two answers differ here by two and a half percent and
point at different axes.

The rig has no neck. The root sits between the shoulders and the hips with one
mid-line chain running forward to the front legs and another back to the rear
ones, so there is a `spine` and a `hips` and no head bone at all; the brow slab
is skinned to the forward chain.

Usage:
  blender --background --python scripts/blender/process_cliff_maw_meshy.py \
      -- source.glb art-source/quality-3d-models/cliff-maw-runtime-v1.glb
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
    raise SystemExit("Usage: blender --background --python process_cliff_maw_meshy.py -- source.glb output.glb")

arguments = sys.argv[sys.argv.index("--") + 1:]
source_path = Path(arguments[0]).expanduser().resolve()
output_path = Path(arguments[1]).expanduser().resolve()
output_path.parent.mkdir(parents=True, exist_ok=True)

# Boss budget: one instance on screen against prey packs of three or four.
TARGET_RUNTIME_TRIANGLES = 26_000

# The contract proposed a world height of 3.2 and a body radius of 2.0 and said
# both were to be checked rather than assumed. They are inconsistent with the
# model that arrived: it is 1.05 as long as it is tall, so a height of 3.2 gives
# a footprint radius of 1.68 - narrower than the nest guardian's 1.82, which is
# wrong for a gate boss, and it would leave the collision circle wider than the
# visible body.
#
# The radius is the number that matters, because it is the one collision reads
# and it has to exceed the guardian's. The height follows from the model's own
# proportions at roughly 3.8, which is what a piece of canyon wall standing up
# should be next to a 2.55 player.
CLIFF_MAW_BODY_RADIUS = 2.0

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
SPINE, HIPS = roles["spine"], roles["hips"]
FRONT_L, FRONT_R = roles["frontLeft"], roles["frontRight"]
BACK_L, BACK_R = roles["backLeft"], roles["backRight"]
BODY = SPINE

mesh.name = "CliffMawMesh"
mesh.data.name = "CliffMawMeshData"
armature.name = "CliffMawRig"
for material in mesh.data.materials:
    material.name = "CliffMawMaterial"
    if material.use_nodes and material.node_tree:
        principled = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
        if principled:
            principled.inputs["Metallic"].default_value = 0.0
            # Dry fractured sandstone. Nothing about this creature is wet, and a
            # low roughness would put a sheen on it that reads as ice.
            principled.inputs["Roughness"].default_value = 0.9
            # The metallic-roughness map is 1.6MB encoding "not metal, somewhat
            # rough" across a creature that is uniformly both. On faceted stone
            # the silhouette and the base colour carry the read; the map is
            # payload for a variation nobody can see at this distance.
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
# Sized by footprint, so the circle that blocks the player matches the body they
# can see. Height is whatever the model's proportions make it.
half_extent = max(source_size.x, source_size.y) / 2
scale_factor = CLIFF_MAW_BODY_RADIUS / max(1e-9, half_extent)
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
    polygon.use_smooth = False  # Faceted stone. Smoothing it would undo the silhouette.
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

PITCH, YAW, PITCH_SIGN = probe_rotation_axes(armature, SPINE, SPINE[-1], axes["up"], axes["side"])
spread = make_spread(PITCH, PITCH_SIGN)
make_action = make_action_builder(armature)
D = math.radians

# Idle: stone does not breathe. Almost nothing moves, which is the point - it
# has to read as part of the canyon until it decides otherwise.
make_action("Idle", 120, [
    (0, {}),
    (44, merge(spread(BODY, D(1.2), PITCH), spread(HIPS, D(-0.8), PITCH))),
    (84, merge(spread(BODY, D(-0.9), PITCH), spread(HIPS, D(0.6), PITCH))),
    (120, {}),
])

# Walk: enormous weight moving one corner at a time. Slower than anything else
# in the valley, and the body drops onto each planted foot.
make_action("Walk", 72, [
    (0, {}),
    (18, merge(
        spread(BODY, D(5), YAW), spread(HIPS, D(-4), YAW),
        spread(FRONT_L, D(26), PITCH, 0.75), spread(BACK_R, D(22), PITCH, 0.75),
        spread(FRONT_R, D(-15), PITCH, 0.75), spread(BACK_L, D(-13), PITCH, 0.75),
        spread(BODY, D(3), PITCH),
    )),
    (36, {}),
    (54, merge(
        spread(BODY, D(-5), YAW), spread(HIPS, D(4), YAW),
        spread(FRONT_R, D(26), PITCH, 0.75), spread(BACK_L, D(22), PITCH, 0.75),
        spread(FRONT_L, D(-15), PITCH, 0.75), spread(BACK_R, D(-13), PITCH, 0.75),
        spread(BODY, D(3), PITCH),
    )),
    (72, {}),
])

make_action("Turn", 40, [
    (0, {}),
    (16, merge(spread(BODY, D(13), YAW), spread(HIPS, D(-9), YAW),
               spread(FRONT_L, D(15), PITCH, 0.8), spread(BACK_R, D(11), PITCH, 0.8))),
    (28, merge(spread(BODY, D(-6), YAW), spread(HIPS, D(4), YAW))),
    (40, {}),
])

# Slam, 1.45s of wind-up at 24fps. The whole mass rears - symmetric, both
# forelimbs off the ground, the body climbing - and then comes down.
#
# The contract's requirement is that this and the sweep are told apart from the
# wind-up alone. That is what makes the wind-up symmetric here and one-sided
# there: the player reads "it is going up" versus "it is loading one shoulder",
# and never has to time two things that look the same.
make_action("Slam", 56, [
    (0, {}),
    (35, merge(
        spread(BODY, D(-34), PITCH), spread(HIPS, D(12), PITCH),
        spread(FRONT_L, D(-46), PITCH, 0.8), spread(FRONT_R, D(-46), PITCH, 0.8),
        spread(BACK_L, D(9), PITCH, 0.8), spread(BACK_R, D(9), PITCH, 0.8),
    )),
    (42, merge(
        spread(BODY, D(40), PITCH), spread(HIPS, D(-14), PITCH),
        spread(FRONT_L, D(54), PITCH, 0.8), spread(FRONT_R, D(54), PITCH, 0.8),
    )),
    (49, merge(spread(BODY, D(9), PITCH), spread(FRONT_L, D(12), PITCH, 0.8), spread(FRONT_R, D(12), PITCH, 0.8))),
    (56, {}),
])

# Sweep, 0.62s of wind-up. One shoulder plate drags back and the body coils to
# that side; the blow rotates the whole animal through the horizontal.
make_action("Sweep", 30, [
    (0, {}),
    (15, merge(
        spread(BODY, D(-30), YAW), spread(HIPS, D(11), YAW),
        spread(FRONT_R, D(-38), YAW, 0.82), spread(FRONT_L, D(9), YAW, 0.82),
        spread(BODY, D(-6), PITCH),
    )),
    (21, merge(
        spread(BODY, D(38), YAW), spread(HIPS, D(-15), YAW),
        spread(FRONT_R, D(52), YAW, 0.85), spread(FRONT_L, D(-12), YAW, 0.85),
        spread(BODY, D(5), PITCH),
    )),
    (30, {}),
])

make_action("Hit", 18, [
    (0, {}),
    (4, merge(spread(BODY, D(7), PITCH), spread(BODY, D(6), YAW), spread(HIPS, D(-4), YAW))),
    (10, merge(spread(BODY, D(-3), PITCH))),
    (18, {}),
])

# Death: it does not fall over, it comes apart at the knees and settles. Stone
# collapses downward; a topple would read as a statue being pushed.
make_action("Death", 60, [
    (0, {}),
    (14, merge(spread(BODY, D(-11), PITCH), spread(FRONT_L, D(-14), PITCH, 0.8), spread(FRONT_R, D(-14), PITCH, 0.8))),
    (36, merge(
        spread(BODY, D(26), PITCH), spread(BODY, D(13), YAW), spread(HIPS, D(-9), PITCH),
        spread(FRONT_L, D(58), PITCH, 0.78), spread(FRONT_R, D(52), PITCH, 0.78),
        spread(BACK_L, D(44), PITCH, 0.78), spread(BACK_R, D(48), PITCH, 0.78),
    )),
    (48, merge(
        spread(BODY, D(30), PITCH), spread(BODY, D(16), YAW), spread(HIPS, D(-11), PITCH),
        spread(FRONT_L, D(64), PITCH, 0.78), spread(FRONT_R, D(58), PITCH, 0.78),
        spread(BACK_L, D(50), PITCH, 0.78), spread(BACK_R, D(54), PITCH, 0.78),
    )),
    (60, merge(
        spread(BODY, D(30), PITCH), spread(BODY, D(16), YAW), spread(HIPS, D(-11), PITCH),
        spread(FRONT_L, D(64), PITCH, 0.78), spread(FRONT_R, D(58), PITCH, 0.78),
        spread(BACK_L, D(50), PITCH, 0.78), spread(BACK_R, D(54), PITCH, 0.78),
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

print("EA_CLIFF_MAW_PROCESS=" + json.dumps({
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
    "bodyRadius": CLIFF_MAW_BODY_RADIUS,
    "collisionFloor": round(1.56 + CLIFF_MAW_BODY_RADIUS + 0.22, 2),
    "roles": roles,
    "axes": axes,
    "boneAxes": {"pitch": PITCH, "yaw": YAW, "pitchSign": PITCH_SIGN},
    "actions": sorted(action.name for action in bpy.data.actions),
}, ensure_ascii=False))
