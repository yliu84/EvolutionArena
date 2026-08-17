import json
import math
import sys
from pathlib import Path

import bpy


if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python augment_scarlet_hunter_meshy_rig.py -- source.glb output.glb")

arguments = sys.argv[sys.argv.index("--") + 1 :]
source_path = Path(arguments[0]).expanduser().resolve()
output_path = Path(arguments[1]).expanduser().resolve()
blend_path = output_path.with_suffix(".blend")
output_path.parent.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))
armature = next(item for item in bpy.context.scene.objects if item.type == "ARMATURE")
mesh = max((item for item in bpy.context.scene.objects if item.type == "MESH"), key=lambda item: len(item.data.vertices))

# Meshy uses a small Icosphere as a viewport-only custom bone shape. Remove all
# references before deleting it, otherwise Blender's glTF exporter follows the
# dependency and silently puts the helper back into the game file.
for pose_bone in armature.pose.bones:
    pose_bone.custom_shape = None
for item in list(bpy.context.scene.objects):
    if item.type == "MESH" and item != mesh:
        bpy.data.objects.remove(item, do_unlink=True)

mesh.name = "ScarletHunterMesh"
armature.name = "ScarletHunterRig"

def reset_pose():
    for bone in armature.pose.bones:
        bone.rotation_mode = "XYZ"
        bone.rotation_euler = (0, 0, 0)
        bone.location = (0, 0, 0)
        bone.scale = (1, 1, 1)


def key_full_pose(frame, rotations=None, locations=None):
    reset_pose()
    rotations = rotations or {}
    locations = locations or {}
    for name, rotation in rotations.items():
        armature.pose.bones[name].rotation_euler = rotation
    for name, location in locations.items():
        armature.pose.bones[name].location = location
    for bone in armature.pose.bones:
        bone.keyframe_insert(data_path="rotation_euler", frame=frame, group=bone.name)
        bone.keyframe_insert(data_path="location", frame=frame, group=bone.name)


def make_action(name, frame_end, poses):
    action = bpy.data.actions.new(name=name)
    armature.animation_data_create()
    armature.animation_data.action = action
    for frame, rotations, locations in poses:
        key_full_pose(frame, rotations, locations)
    track = armature.animation_data.nla_tracks.new()
    track.name = name
    strip = track.strips.new(name, 0, action)
    strip.action_frame_start = 0
    strip.action_frame_end = frame_end
    armature.animation_data.action = None
    return action


armature.animation_data_create()
armature.animation_data.action = None
while armature.animation_data.nla_tracks:
    armature.animation_data.nla_tracks.remove(armature.animation_data.nla_tracks[0])
for imported_action in list(bpy.data.actions):
    bpy.data.actions.remove(imported_action)

# The downloaded "Walking" export only moved Hips.location.z. Every limb curve
# was static, so the character slid over the ground. These cycles use a stable
# diagonal quadruped gait: left-front/right-rear advance together, then the
# opposite diagonal. The amplitudes stay deliberately modest because the Meshy
# skin weights are dense around the shoulders and collapse under extreme Euler
# edits.
walk_a = {
    "frontleg": (math.radians(-5), 0, 0),
    "frontleg0": (math.radians(-7), 0, 0),
    "R_frontleg": (math.radians(5), 0, 0),
    "R_frontleg0": (math.radians(7), 0, 0),
    "backleg": (math.radians(5), 0, 0),
    "backleg0": (math.radians(7), 0, 0),
    "R_backleg": (math.radians(-5), 0, 0),
    "R_backleg0": (math.radians(-7), 0, 0),
    "chest": (math.radians(-1.5), 0, math.radians(1.4)),
    "head": (math.radians(1.4), 0, math.radians(-1.2)),
    "tail1": (0, math.radians(-1.5), 0),
    "tail2": (0, math.radians(-2.1), 0),
    "tail3": (0, math.radians(-2.7), 0),
}
walk_b = {name: tuple(-value for value in rotation) for name, rotation in walk_a.items()}
make_action(
    "Walk",
    28,
    [
        (0, walk_a, {"Hips": (0, 0, -0.00016)}),
        (7, {}, {"Hips": (0, 0, -0.00034)}),
        (14, walk_b, {"Hips": (0, 0, -0.00016)}),
        (21, {}, {"Hips": (0, 0, -0.00034)}),
        (28, walk_a, {"Hips": (0, 0, -0.00016)}),
    ],
)

run_a = {
    "frontleg": (math.radians(-8), 0, 0),
    "frontleg0": (math.radians(-10), 0, 0),
    "R_frontleg": (math.radians(8), 0, 0),
    "R_frontleg0": (math.radians(10), 0, 0),
    "backleg": (math.radians(8), 0, 0),
    "backleg0": (math.radians(10), 0, 0),
    "R_backleg": (math.radians(-8), 0, 0),
    "R_backleg0": (math.radians(-10), 0, 0),
    "chest": (math.radians(-3), 0, math.radians(2)),
    "head": (math.radians(2.5), 0, math.radians(-1.8)),
    "tail1": (0, math.radians(-2.5), 0),
    "tail2": (0, math.radians(-3.3), 0),
    "tail3": (0, math.radians(-4.1), 0),
}
run_b = {name: tuple(-value for value in rotation) for name, rotation in run_a.items()}
make_action(
    "Run",
    20,
    [
        (0, run_a, {"Hips": (0, 0, -0.00012)}),
        (5, {}, {"Hips": (0, 0, -0.00048)}),
        (10, run_b, {"Hips": (0, 0, -0.00012)}),
        (15, {}, {"Hips": (0, 0, -0.00048)}),
        (20, run_a, {"Hips": (0, 0, -0.00012)}),
    ],
)

make_action(
    "Idle",
    60,
    [
        (0, {}, {}),
        (30, {"chest": (math.radians(1.2), 0, 0), "head": (math.radians(-1.8), 0, 0), "tail1": (0, math.radians(1.2), 0), "tail2": (0, math.radians(1.5), 0), "tail3": (0, math.radians(1.8), 0)}, {}),
        (60, {}, {}),
    ],
)

make_action(
    "Turn",
    20,
    [
        (0, {}, {}),
        (10, {"Hips": (math.radians(-2), 0, math.radians(4)), "chest": (math.radians(2), 0, math.radians(-5)), "head": (0, 0, math.radians(-4)), "frontleg0": (math.radians(-4), 0, 0), "R_backleg0": (math.radians(4), 0, 0), "tail1": (0, math.radians(-3), 0), "tail2": (0, math.radians(-4), 0), "tail3": (0, math.radians(-5), 0)}, {}),
        (20, {}, {}),
    ],
)

make_action(
    "Claw",
    24,
    [
        (0, {}, {}),
        (5, {"Hips": (math.radians(-7), 0, math.radians(-5)), "chest": (math.radians(15), 0, math.radians(-7)), "head": (math.radians(8), 0, math.radians(4)), "frontleg": (math.radians(2.7), math.radians(19.5), math.radians(-34.6)), "frontleg0": (math.radians(-8), 0, 0), "R_frontleg0": (math.radians(-4), 0, 0), "backleg0": (math.radians(6), 0, 0), "R_backleg0": (math.radians(6), 0, 0)}, {"Hips": (0, 0, -0.00145)}),
        (9, {"Hips": (math.radians(5), 0, math.radians(7)), "chest": (math.radians(-12), 0, math.radians(11)), "head": (math.radians(-9), 0, math.radians(-7)), "frontleg": (math.radians(-4.8), math.radians(-8.6), math.radians(17.9)), "frontleg0": (math.radians(5), 0, 0), "frontleg1": (math.radians(4), 0, 0), "R_frontleg0": (math.radians(-5), 0, 0), "tail1": (0, math.radians(-4), 0), "tail2": (0, math.radians(-5), 0), "tail3": (0, math.radians(-6), 0)}, {"Hips": (0, 0, -0.0005)}),
        (15, {"Hips": (math.radians(1), 0, math.radians(3)), "chest": (math.radians(-4), 0, math.radians(5)), "frontleg": (math.radians(5), 0, math.radians(-2)), "frontleg0": (math.radians(5), 0, 0)}, {"Hips": (0, 0, -0.0003)}),
        (24, {}, {}),
    ],
)

make_action(
    "Pounce",
    28,
    [
        (0, {}, {}),
        # Anticipation: shoulders rise, but the forearms unfold forward so the
        # paws read above and ahead of the chest instead of disappearing under it.
        (6, {"Hips": (math.radians(-12), 0, 0), "chest": (math.radians(21), 0, 0), "head": (math.radians(11), 0, 0), "frontleg": (math.radians(2.0), math.radians(14.6), math.radians(-26.0)), "R_frontleg": (math.radians(1.8), math.radians(-14.8), math.radians(25.9)), "frontleg0": (math.radians(-30), 0, 0), "R_frontleg0": (math.radians(-30), 0, 0), "frontleg1": (math.radians(8), 0, 0), "R_frontleg1": (math.radians(8), 0, 0), "backleg0": (math.radians(11), 0, 0), "R_backleg0": (math.radians(11), 0, 0), "tail1": (0, math.radians(-3), 0), "tail2": (0, math.radians(-4), 0)}, {"Hips": (0, 0, -0.0018)}),
        # Contact: reverse the shoulder sweep and drive both extended paws down
        # through the target. The previous version increased the backward sweep
        # here, which made the attack look like both paws were retracting.
        (12, {"Hips": (math.radians(8), 0, 0), "chest": (math.radians(-13), 0, 0), "head": (math.radians(-10), 0, 0), "frontleg": (math.radians(-4.3), math.radians(-7.8), math.radians(16.1)), "R_frontleg": (math.radians(-4.2), math.radians(7.9), math.radians(-16.0)), "frontleg0": (math.radians(-18), 0, 0), "R_frontleg0": (math.radians(-18), 0, 0), "frontleg1": (math.radians(-5), 0, 0), "R_frontleg1": (math.radians(-5), 0, 0), "backleg0": (math.radians(13), 0, 0), "R_backleg0": (math.radians(13), 0, 0), "tail1": (0, math.radians(5), 0), "tail2": (0, math.radians(7), 0), "tail3": (0, math.radians(9), 0)}, {"Hips": (0, 0, -0.0025)}),
        (18, {"Hips": (math.radians(3), 0, 0), "chest": (math.radians(-7), 0, 0), "head": (math.radians(-10), 0, 0), "frontleg": (math.radians(-2), 0, math.radians(6)), "R_frontleg": (math.radians(-2), 0, math.radians(-6)), "frontleg0": (math.radians(-8), 0, 0), "R_frontleg0": (math.radians(-8), 0, 0), "backleg0": (math.radians(7), 0, 0), "R_backleg0": (math.radians(7), 0, 0), "tail1": (0, math.radians(2), 0), "tail2": (0, math.radians(3), 0)}, {"Hips": (0, 0, -0.00045)}),
        (28, {}, {}),
    ],
)

brace = {
    "frontleg0": (math.radians(-5), 0, math.radians(3)),
    "R_frontleg0": (math.radians(-5), 0, math.radians(-3)),
    "backleg0": (math.radians(6), 0, math.radians(4)),
    "R_backleg0": (math.radians(6), 0, math.radians(-4)),
}
make_action(
    "TailSwipe",
    28,
    [
        (0, {}, {}),
        (7, {**brace, "Hips": (math.radians(-6), math.radians(-22), 0), "chest": (math.radians(3), math.radians(13), 0), "head": (0, math.radians(9), 0), "tail": (0, math.radians(-9), 0), "tailstart": (0, math.radians(-11), 0), "tail1": (0, math.radians(-13), 0), "tail2": (0, math.radians(-15), 0), "tail3": (0, math.radians(-18), 0)}, {"Hips": (0, 0, -0.00045)}),
        (15, {**brace, "Hips": (math.radians(-4), math.radians(34), 0), "chest": (math.radians(-2), math.radians(-21), 0), "head": (0, math.radians(-15), 0), "tail": (0, math.radians(12), 0), "tailstart": (0, math.radians(15), 0), "tail1": (0, math.radians(18), 0), "tail2": (0, math.radians(21), 0), "tail3": (0, math.radians(25), 0)}, {"Hips": (0, 0, -0.0003)}),
        (22, {**brace, "Hips": (math.radians(-2), math.radians(7), 0), "chest": (0, math.radians(-4), 0), "tail1": (0, math.radians(3), 0), "tail2": (0, math.radians(3.5), 0), "tail3": (0, math.radians(4), 0)}, {}),
        (28, {}, {}),
    ],
)

make_action(
    "Hit",
    14,
    [
        (0, {}, {}),
        (4, {"Hips": (math.radians(-3), math.radians(7), 0), "chest": (math.radians(6), math.radians(-8), 0), "head": (math.radians(10), math.radians(-9), 0), "tail1": (0, math.radians(-3), 0), "tail2": (0, math.radians(-4), 0)}, {}),
        (14, {}, {}),
    ],
)

make_action(
    "Death",
    38,
    [
        (0, {}, {}),
        (14, {"Hips": (math.radians(-5), 0, math.radians(24)), "chest": (math.radians(8), 0, math.radians(10)), "head": (math.radians(14), 0, math.radians(-16)), "frontleg0": (math.radians(12), 0, 0), "R_frontleg0": (math.radians(-10), 0, 0)}, {}),
        (30, {"Hips": (math.radians(-7), 0, math.radians(78)), "chest": (math.radians(10), 0, math.radians(18)), "head": (math.radians(20), 0, math.radians(-25)), "tail1": (0, math.radians(-5), 0), "tail2": (0, math.radians(-7), 0), "tail3": (0, math.radians(-9), 0)}, {}),
        (38, {"Hips": (math.radians(-7), 0, math.radians(82)), "chest": (math.radians(10), 0, math.radians(18)), "head": (math.radians(20), 0, math.radians(-25)), "tail1": (0, math.radians(-5), 0), "tail2": (0, math.radians(-7), 0), "tail3": (0, math.radians(-9), 0)}, {}),
    ],
)

armature.animation_data.action = None
# A skinned mesh must be a scene root in glTF. The armature modifier retains the
# skin binding, while clearing the Blender parent avoids NODE_SKINNED_MESH_NON_ROOT.
mesh_world = mesh.matrix_world.copy()
mesh.parent = None
mesh.matrix_world = mesh_world
bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
bpy.ops.object.select_all(action="DESELECT")
mesh.select_set(True)
armature.select_set(True)
bpy.context.view_layer.objects.active = armature

bpy.ops.export_scene.gltf(
    filepath=str(output_path),
    export_format="GLB",
    use_selection=True,
    export_yup=True,
    export_tangents=False,
    export_materials="EXPORT",
    export_animations=True,
    export_animation_mode="NLA_TRACKS",
    export_force_sampling=True,
    export_frame_range=False,
    export_anim_slide_to_zero=True,
)

print("EA_SCARLET_HUNTER_AUGMENT=" + json.dumps({
    "source": str(source_path),
    "output": str(output_path),
    "blend": str(blend_path),
    "bones": [bone.name for bone in armature.data.bones],
    "actions": [action.name for action in bpy.data.actions],
}, ensure_ascii=False))
