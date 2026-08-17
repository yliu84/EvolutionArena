import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Euler, Quaternion


if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python augment_scarlet_gecko_meshy_rig.py -- source.glb output.glb")

arguments = sys.argv[sys.argv.index("--") + 1 :]
source_path = Path(arguments[0]).expanduser().resolve()
output_path = Path(arguments[1]).expanduser().resolve()
blend_path = output_path.with_suffix(".blend")
output_path.parent.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))
armature = next(item for item in bpy.context.scene.objects if item.type == "ARMATURE")
mesh = max((item for item in bpy.context.scene.objects if item.type == "MESH"), key=lambda item: len(item.data.vertices))

# Meshy adds an Icosphere as a viewport bone helper. It must never ship as a
# second game mesh. Clear every custom-shape reference before deleting it so
# Blender's glTF exporter cannot follow the dependency and restore the helper.
for pose_bone in armature.pose.bones:
    pose_bone.custom_shape = None
for item in list(bpy.context.scene.objects):
    if item.type == "MESH" and item != mesh:
        bpy.data.objects.remove(item, do_unlink=True)

mesh.name = "ScarletGeckoMesh"
mesh.data.name = "ScarletGeckoMeshData"
armature.name = "ScarletGeckoRig"

# This model is intentionally brighter and more organic than the rejected V1.
# Keep the generated color/normal textures, but remove metallic/plastic response
# and give the broad scale planes a readable semi-matte finish.
for material in mesh.data.materials:
    material.name = "ScarletGeckoV2Material"
    material.diffuse_color = (1.0, 1.0, 1.0, 1.0)
    if material.use_nodes and material.node_tree:
        principled = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
        if principled:
            principled.inputs["Metallic"].default_value = 0.0
            principled.inputs["Roughness"].default_value = 0.78


def channelbags(action):
    if not action.layers:
        return []
    layer = action.layers[0]
    if not layer.strips:
        return []
    strip = layer.strips[0]
    return [strip.channelbag(slot) for slot in action.slots if strip.channelbag(slot) is not None]


def remove_scale_curves(action):
    removed = 0
    for channelbag in channelbags(action):
        for curve in list(channelbag.fcurves):
            if curve.data_path.endswith(".scale"):
                channelbag.fcurves.remove(curve)
                removed += 1
    return removed


def amplify_quaternion_motion(action, bone_names, factor):
    changed_keys = 0
    paths = {f'pose.bones["{name}"].rotation_quaternion' for name in bone_names}
    for channelbag in channelbags(action):
        grouped = {}
        for curve in channelbag.fcurves:
            if curve.data_path in paths:
                grouped.setdefault(curve.data_path, {})[curve.array_index] = curve
        for curves in grouped.values():
            if set(curves) != {0, 1, 2, 3}:
                continue
            frames = sorted({point.co.x for curve in curves.values() for point in curve.keyframe_points})
            if not frames:
                continue
            base = Quaternion(tuple(curves[index].evaluate(frames[0]) for index in range(4))).normalized()
            samples = []
            for frame in frames:
                original = Quaternion(tuple(curves[index].evaluate(frame) for index in range(4))).normalized()
                delta = base.rotation_difference(original)
                if delta.w < 0:
                    delta = Quaternion(tuple(-value for value in delta))
                amplified_delta = Quaternion(delta.axis, min(delta.angle * factor, math.radians(58)))
                amplified = (base @ amplified_delta).normalized()
                samples.append((frame, tuple(amplified)))
            for frame, values in samples:
                for index, curve in curves.items():
                    point = min(curve.keyframe_points, key=lambda key: abs(key.co.x - frame))
                    if abs(point.co.x - frame) > 0.001:
                        continue
                    offset = values[index] - point.co.y
                    point.co.y = values[index]
                    point.handle_left.y += offset
                    point.handle_right.y += offset
                    changed_keys += 1
    return changed_keys


def reset_pose():
    for bone in armature.pose.bones:
        bone.rotation_mode = "QUATERNION"
        bone.rotation_quaternion = (1, 0, 0, 0)
        bone.location = (0, 0, 0)
        bone.scale = (1, 1, 1)


def key_full_pose(frame, rotations=None, locations=None):
    reset_pose()
    rotations = rotations or {}
    locations = locations or {}
    for name, rotation in rotations.items():
        armature.pose.bones[name].rotation_quaternion = Euler(rotation, "XYZ").to_quaternion()
    for name, location in locations.items():
        armature.pose.bones[name].location = location
    for bone in armature.pose.bones:
        bone.keyframe_insert(data_path="rotation_quaternion", frame=frame, group=bone.name)
        bone.keyframe_insert(data_path="location", frame=frame, group=bone.name)


def add_nla_track(action, frame_end):
    track = armature.animation_data.nla_tracks.new()
    track.name = action.name
    strip = track.strips.new(action.name, 0, action)
    strip.action_frame_start = 0
    strip.action_frame_end = frame_end


def make_action(name, frame_end, poses):
    action = bpy.data.actions.new(name=name)
    armature.animation_data.action = action
    for frame, rotations, locations in poses:
        key_full_pose(frame, rotations, locations)
    add_nla_track(action, frame_end)
    armature.animation_data.action = None
    return action


armature.animation_data_create()
imported_run = next(iter(bpy.data.actions))
imported_run.name = "Run"
removed_scale_curves = remove_scale_curves(imported_run)
amplified_run_keys = amplify_quaternion_motion(
    imported_run,
    {
        "frontleg", "frontleg0", "frontleg1", "frontleg2",
        "R_frontleg", "R_frontleg0", "R_frontleg1", "R_frontleg2",
        "backleg", "backleg0", "backleg1", "backleg2",
        "R_backleg", "R_backleg0", "R_backleg1", "R_backleg2",
    },
    1.22,
)

# Keep the authored Meshy gait: all four limbs have substantial keyed motion.
# Runtime owns world translation, while the clip owns alternating foot plants.
while armature.animation_data.nla_tracks:
    armature.animation_data.nla_tracks.remove(armature.animation_data.nla_tracks[0])
add_nla_track(imported_run, int(imported_run.frame_range[1]))

# A slower clip remains available for later exploration/menus; live hunting uses
# Run with the stage-specific playback rate.
walk_action = imported_run.copy()
walk_action.name = "Walk"
add_nla_track(walk_action, int(walk_action.frame_range[1]))

make_action(
    "Idle",
    64,
    [
        (0, {}, {}),
        (32, {
            "chest": (math.radians(1.5), 0, 0),
            "head": (math.radians(-1.8), 0, 0),
            "tail1": (0, math.radians(1.2), 0),
            "tail2": (0, math.radians(1.8), 0),
            "tail3": (0, math.radians(2.3), 0),
        }, {"Hips": (0, 0, -0.00012)}),
        (64, {}, {}),
    ],
)

make_action(
    "Turn",
    22,
    [
        (0, {}, {}),
        (11, {
            "Hips": (math.radians(-2), 0, math.radians(4)),
            "chest": (math.radians(2), 0, math.radians(-5)),
            "head": (0, 0, math.radians(-4)),
            "frontleg0": (math.radians(-4), 0, 0),
            "R_backleg0": (math.radians(4), 0, 0),
            "tail1": (0, math.radians(-3), 0),
            "tail2": (0, math.radians(-4), 0),
            "tail3": (0, math.radians(-5), 0),
        }, {"Hips": (0, 0, -0.00018)}),
        (22, {}, {}),
    ],
)

# The rig has no independent jaw. Bite therefore reads through a compact
# shoulder load and head/chest thrust; the shared runtime Pounce envelope adds
# the actual leap, forward travel and weighted landing without stretching legs.
make_action(
    "Bite",
    24,
    [
        (0, {}, {}),
        (5, {
            "Hips": (math.radians(-5), 0, 0),
            "chest": (math.radians(8), 0, 0),
            "head": (math.radians(7), 0, 0),
            "frontleg0": (math.radians(3), 0, 0),
            "R_frontleg0": (math.radians(3), 0, 0),
            "backleg0": (math.radians(5), 0, 0),
            "R_backleg0": (math.radians(5), 0, 0),
        }, {"Hips": (0, 0, -0.00055)}),
        (10, {
            "Hips": (math.radians(4), 0, 0),
            "chest": (math.radians(-9), 0, 0),
            "head": (math.radians(-12), 0, 0),
            "tail1": (0, math.radians(2), 0),
            "tail2": (0, math.radians(3), 0),
        }, {"Hips": (0, 0, -0.00015)}),
        (16, {"chest": (math.radians(-3), 0, 0), "head": (math.radians(-5), 0, 0)}, {}),
        (24, {}, {}),
    ],
)

# Kept for the cross-form clip contract and QA even though stage 1's live combo
# uses Bite/Pounce/TailSwipe. One forepaw lifts and plants without exceeding the
# source Walking rig's safe shoulder range.
make_action(
    "Claw",
    24,
    [
        (0, {}, {}),
        (6, {
            "chest": (math.radians(7), 0, math.radians(-4)),
            "head": (math.radians(3), 0, math.radians(2)),
            "frontleg": (math.radians(-4), math.radians(7), math.radians(-10)),
            "frontleg0": (math.radians(-11), 0, 0),
        }, {"Hips": (0, 0, -0.00038)}),
        (11, {
            "chest": (math.radians(-6), 0, math.radians(6)),
            "frontleg": (math.radians(3), math.radians(-4), math.radians(8)),
            "frontleg0": (math.radians(5), 0, 0),
        }, {}),
        (17, {"chest": (math.radians(-2), 0, math.radians(2))}, {}),
        (24, {}, {}),
    ],
)

brace = {
    "frontleg0": (math.radians(-4), 0, math.radians(3)),
    "R_frontleg0": (math.radians(-4), 0, math.radians(-3)),
    "backleg0": (math.radians(5), 0, math.radians(4)),
    "R_backleg0": (math.radians(5), 0, math.radians(-4)),
}
make_action(
    "TailSwipe",
    30,
    [
        (0, {}, {}),
        (7, {**brace,
            "Hips": (math.radians(-5), math.radians(-17), 0),
            "chest": (math.radians(3), math.radians(10), 0),
            "head": (0, math.radians(6), 0),
            "tail": (0, math.radians(-7), 0),
            "tailstart": (0, math.radians(-9), 0),
            "tail1": (0, math.radians(-11), 0),
            "tail2": (0, math.radians(-13), 0),
            "tail3": (0, math.radians(-15), 0),
        }, {"Hips": (0, 0, -0.00035)}),
        (15, {**brace,
            "Hips": (math.radians(-3), math.radians(25), 0),
            "chest": (math.radians(-2), math.radians(-15), 0),
            "head": (0, math.radians(-10), 0),
            "tail": (0, math.radians(8), 0),
            "tailstart": (0, math.radians(11), 0),
            "tail1": (0, math.radians(14), 0),
            "tail2": (0, math.radians(17), 0),
            "tail3": (0, math.radians(20), 0),
        }, {"Hips": (0, 0, -0.00022)}),
        (23, {**brace, "tail1": (0, math.radians(3), 0), "tail2": (0, math.radians(4), 0), "tail3": (0, math.radians(5), 0)}, {}),
        (30, {}, {}),
    ],
)

make_action(
    "Hit",
    16,
    [
        (0, {}, {}),
        (4, {
            "Hips": (math.radians(-3), math.radians(6), 0),
            "chest": (math.radians(5), math.radians(-7), 0),
            "head": (math.radians(9), math.radians(-8), 0),
            "tail1": (0, math.radians(-3), 0),
            "tail2": (0, math.radians(-4), 0),
        }, {}),
        (16, {}, {}),
    ],
)

make_action(
    "Death",
    42,
    [
        (0, {}, {}),
        (15, {
            "Hips": (math.radians(-4), 0, math.radians(22)),
            "chest": (math.radians(7), 0, math.radians(10)),
            "head": (math.radians(12), 0, math.radians(-14)),
        }, {}),
        (34, {
            "Hips": (math.radians(-6), 0, math.radians(72)),
            "chest": (math.radians(9), 0, math.radians(16)),
            "head": (math.radians(18), 0, math.radians(-22)),
            "frontleg0": (math.radians(8), 0, 0),
            "R_frontleg0": (math.radians(-8), 0, 0),
            "tail1": (0, math.radians(-4), 0),
            "tail2": (0, math.radians(-6), 0),
            "tail3": (0, math.radians(-8), 0),
        }, {}),
        (42, {
            "Hips": (math.radians(-6), 0, math.radians(74)),
            "chest": (math.radians(9), 0, math.radians(16)),
            "head": (math.radians(18), 0, math.radians(-22)),
            "frontleg0": (math.radians(8), 0, 0),
            "R_frontleg0": (math.radians(-8), 0, 0),
            "tail1": (0, math.radians(-4), 0),
            "tail2": (0, math.radians(-6), 0),
            "tail3": (0, math.radians(-8), 0),
        }, {}),
    ],
)

armature.animation_data.action = None
reset_pose()

# glTF requires a skinned mesh at a scene root. Preserve the bind matrix while
# clearing the Blender parent; the armature modifier keeps the skin relation.
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
    export_tangents=True,
    export_materials="EXPORT",
    export_animations=True,
    export_animation_mode="NLA_TRACKS",
    export_force_sampling=True,
    export_frame_range=False,
    export_anim_slide_to_zero=True,
)

print("EA_SCARLET_GECKO_AUGMENT=" + json.dumps({
    "source": str(source_path),
    "output": str(output_path),
    "blend": str(blend_path),
    "mesh": mesh.name,
    "triangles": sum(len(p.loop_indices) - 2 for p in mesh.data.polygons),
    "bones": [bone.name for bone in armature.data.bones],
    "actions": sorted(action.name for action in bpy.data.actions),
    "removed_imported_scale_curves": removed_scale_curves,
    "amplified_run_quaternion_keys": amplified_run_keys,
}, ensure_ascii=False))
