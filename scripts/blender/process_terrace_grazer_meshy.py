"""Turn the Meshy Terrace Grazer export into the valley's passive grazer runtime GLB.

The third creature to arrive on Meshy's semantic quadruped skeleton, identical
to the Ford Fang's down to the bone names, so the rig handling is shared. What
is not shared is the motion: a river ambusher and a grazing goat moving the same
way would undo the reason for having two bodies.

This one is passive. It does not hunt, it does not flee - it stands on the bank
and eats, and the player decides whether to bother. That decision is the whole
point of the tier, and it only exists because the silhouette says "harmless" on
sight: hooves, short horns, a calm eye. The beetle reads as armoured, which
reads as a fight.

It still needs an attack. Passive means it does not start one, not that it
cannot finish one - struck, it wakes and defends itself, and it has horns.

Usage:
  blender --background --python scripts/blender/process_terrace_grazer_meshy.py \
      -- source.glb art-source/quality-3d-models/terrace-grazer-runtime-v1.glb
"""

import json
import math
import os
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from meshy_cleanup import remove_degenerate_uv_faces, remove_invalid_tangent_faces
from meshy_quadruped_rig import (
    make_action_builder,
    make_spread,
    merge,
    probe_rotation_axes,
    reset_pose,
    resolve_quadruped_roles,
)

if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python process_terrace_grazer_meshy.py -- source.glb output.glb")

arguments = sys.argv[sys.argv.index("--") + 1:]
source_path = Path(arguments[0]).expanduser().resolve()
output_path = Path(arguments[1]).expanduser().resolve()
output_path.parent.mkdir(parents=True, exist_ok=True)

# Prey budget. Grazers are the most numerous creature in the valley - eighteen
# of them against nine packs - so this is the last body that should be given
# room it does not need.
TARGET_RUNTIME_TRIANGLES = 14_000

# Sized to the Fang family's collision radius. A light, fast-looking animal on
# hooves, not an armoured dome: it takes the Fang body so it needs no frontal
# damage rule, and so the footprint the player walks around matches what they
# see. Blocking that does not match the visible footprint is the Goal 2 lesson.
GRAZER_BODY_RADIUS = 1.02

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

roles, axes = resolve_quadruped_roles(armature)
SPINE, HEAD, TAIL = roles["spine"], roles["head"], roles["tail"]
FRONT_L, FRONT_R = roles["frontLeft"], roles["frontRight"]
BACK_L, BACK_R = roles["backLeft"], roles["backRight"]

mesh.name = "TerraceGrazerMesh"
mesh.data.name = "TerraceGrazerMeshData"
armature.name = "TerraceGrazerRig"
for material in mesh.data.materials:
    material.name = "TerraceGrazerMaterial"
    if material.use_nodes and material.node_tree:
        principled = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
        if principled:
            principled.inputs["Metallic"].default_value = 0.0
            # Dry hide and sandstone-coloured hair. Nothing on this animal is wet.
            principled.inputs["Roughness"].default_value = 0.82

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
scale_factor = (GRAZER_BODY_RADIUS * 2) / max(source_size)
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

PITCH, YAW, PITCH_SIGN = probe_rotation_axes(armature, SPINE + HEAD, HEAD[-1], axes["up"], axes["side"])
spread = make_spread(PITCH, PITCH_SIGN)
make_action = make_action_builder(armature)
D = math.radians

# Idle: it grazes. The head goes down, stays down, comes up to look around and
# goes back. This is the animation the player sees most often in the valley -
# eighteen of these stand on the banks - and a grazer that stands to attention
# is the tell that the map is a shooting gallery with scenery.
make_action("Idle", 168, [
    (0, {}),
    (28, merge(spread(SPINE, D(6), PITCH), spread(HEAD, D(34), PITCH))),
    (64, merge(spread(SPINE, D(7), PITCH), spread(HEAD, D(37), PITCH), spread(HEAD, D(5), YAW))),
    (92, merge(spread(SPINE, D(6), PITCH), spread(HEAD, D(33), PITCH), spread(HEAD, D(-6), YAW))),
    # Up to look around, which is what makes it read as alive rather than as a
    # prop bolted to the ground at an angle.
    (116, merge(spread(HEAD, D(-8), PITCH), spread(HEAD, D(11), YAW), spread(TAIL, D(9), YAW, 0.8))),
    (140, merge(spread(HEAD, D(-5), PITCH), spread(HEAD, D(-9), YAW), spread(TAIL, D(-8), YAW, 0.8))),
    (168, {}),
])

# Walk: an unhurried four-beat. Hooves, so the legs stay under the body and the
# spine barely moves - the roll belongs to the beetle and the sprawl to the
# crocodilian.
make_action("Walk", 56, [
    (0, {}),
    (14, merge(
        spread(SPINE, D(3), YAW),
        spread(FRONT_L, D(46), PITCH, 0.7), spread(BACK_R, D(40), PITCH, 0.7),
        spread(FRONT_R, D(-28), PITCH, 0.7), spread(BACK_L, D(-24), PITCH, 0.7),
        spread(TAIL, D(7), YAW, 0.8), spread(HEAD, D(4), PITCH),
    )),
    (28, {}),
    (42, merge(
        spread(SPINE, D(-3), YAW),
        spread(FRONT_R, D(46), PITCH, 0.7), spread(BACK_L, D(40), PITCH, 0.7),
        spread(FRONT_L, D(-28), PITCH, 0.7), spread(BACK_R, D(-24), PITCH, 0.7),
        spread(TAIL, D(-7), YAW, 0.8), spread(HEAD, D(4), PITCH),
    )),
    (56, {}),
])

# Butt: the horns. Passive means it does not start a fight, not that it cannot
# finish one - struck, it wakes and defends itself. The wind-up rocks back onto
# the hind legs and drops the head, so the tell is the head going down and the
# blow is the whole animal arriving behind it.
make_action("Butt", 36, [
    (0, {}),
    (12, merge(
        spread(SPINE, D(-24), PITCH), spread(HEAD, D(-18), PITCH),
        spread(FRONT_L, D(-30), PITCH, 0.75), spread(FRONT_R, D(-30), PITCH, 0.75),
        spread(TAIL, D(14), PITCH, 0.85),
    )),
    (18, merge(
        spread(SPINE, D(32), PITCH), spread(HEAD, D(26), PITCH),
        spread(FRONT_L, D(38), PITCH, 0.75), spread(FRONT_R, D(38), PITCH, 0.75),
        spread(TAIL, D(-18), PITCH, 0.85),
    )),
    (26, merge(spread(SPINE, D(8), PITCH), spread(HEAD, D(7), PITCH))),
    (36, {}),
])

make_action("Hit", 20, [
    (0, {}),
    (4, merge(
        spread(SPINE, D(14), PITCH), spread(SPINE, D(11), YAW),
        spread(HEAD, D(19), YAW), spread(TAIL, D(-12), YAW, 0.85),
    )),
    (11, merge(spread(SPINE, D(-6), PITCH), spread(HEAD, D(-7), YAW))),
    (20, {}),
])

# Death: the legs fold and it goes down on its side. A hoofed animal collapses
# rather than splaying - the splay belongs to the reptile.
make_action("Death", 58, [
    (0, {}),
    (12, merge(spread(SPINE, D(-12), PITCH), spread(HEAD, D(18), PITCH))),
    (32, merge(
        spread(SPINE, D(18), PITCH), spread(SPINE, D(42), YAW),
        spread(HEAD, D(-26), PITCH),
        spread(FRONT_L, D(-52), PITCH, 0.8), spread(FRONT_R, D(-48), PITCH, 0.8),
        spread(BACK_L, D(-44), PITCH, 0.8), spread(BACK_R, D(-50), PITCH, 0.8),
        spread(TAIL, D(24), YAW, 0.85),
    )),
    (46, merge(
        spread(SPINE, D(20), PITCH), spread(SPINE, D(47), YAW),
        spread(HEAD, D(-30), PITCH),
        spread(FRONT_L, D(-58), PITCH, 0.8), spread(FRONT_R, D(-54), PITCH, 0.8),
        spread(BACK_L, D(-50), PITCH, 0.8), spread(BACK_R, D(-56), PITCH, 0.8),
        spread(TAIL, D(27), YAW, 0.85),
    )),
    (58, merge(
        spread(SPINE, D(20), PITCH), spread(SPINE, D(47), YAW),
        spread(HEAD, D(-30), PITCH),
        spread(FRONT_L, D(-58), PITCH, 0.8), spread(FRONT_R, D(-54), PITCH, 0.8),
        spread(BACK_L, D(-50), PITCH, 0.8), spread(BACK_R, D(-56), PITCH, 0.8),
        spread(TAIL, D(27), YAW, 0.85),
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

print("EA_TERRACE_GRAZER_PROCESS=" + json.dumps({
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
    "axes": axes,
    "boneAxes": {"pitch": PITCH, "yaw": YAW, "pitchSign": PITCH_SIGN},
    "actions": sorted(action.name for action in bpy.data.actions),
}, ensure_ascii=False))
