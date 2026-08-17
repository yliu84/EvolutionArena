"""Turn the Meshy quadruped Walking export into the Shell stage-1 runtime GLB.

Source is Meshy's official quadruped rig (27 bones, the same skeleton template
the accepted scarlet-gecko uses), so bone names and axis conventions match the
existing forms: X is pitch, Y is yaw, Z is roll, and Hips location Z carries the
small vertical offset at the rig's authored 0.01 armature scale.

Three defects come out of Meshy and are repaired here:

1. An Icosphere viewport helper ships as a second mesh.
2. Hips carries a constant, uniform 1.7692 scale key. The runtime forbids
   non-unit bone scale and reports maximum bone-scale deviation, which must be
   0. Removing it is safe because the scale is uniform and constant and the
   runtime normalises the model to the stage world height anyway.
3. The armature object sits at 0.01 scale. That is left alone, exactly as on the
   accepted stage-1 form, because the runtime rescales by measured height.

Attack vocabulary follows the production contract: Bite, Slam, TailSwipe. Pounce
is deliberately absent - short stout forelimbs and a low head cannot sell a leap
(standard rule 4), and inheriting the Fang chain is what made the stage-2
native-toon candidates unreadable. Amplitudes stay inside what the source
weights tolerate; the coral-gecko V3 stretch came from rotations exceeding that
range, not from scale curves.

Usage:
  blender --background --python scripts/blender/process_stone_pangolin_meshy.py \
      -- source.glb public/assets/quality-3d/models/stone-pangolin-rigged-v1.glb
"""

import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Euler, Quaternion


if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python process_stone_pangolin_meshy.py -- source.glb output.glb")

arguments = sys.argv[sys.argv.index("--") + 1 :]
source_path = Path(arguments[0]).expanduser().resolve()
output_path = Path(arguments[1]).expanduser().resolve()
blend_path = output_path.with_suffix(".blend")
output_path.parent.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))
armature = next(item for item in bpy.context.scene.objects if item.type == "ARMATURE")
mesh = max((item for item in bpy.context.scene.objects if item.type == "MESH"), key=lambda item: len(item.data.vertices))

# Clear every custom-shape reference before deleting the helper, or the glTF
# exporter follows the dependency and restores it.
for pose_bone in armature.pose.bones:
    pose_bone.custom_shape = None
for item in list(bpy.context.scene.objects):
    if item.type == "MESH" and item != mesh:
        bpy.data.objects.remove(item, do_unlink=True)

mesh.name = "StonePangolinMesh"
mesh.data.name = "StonePangolinMeshData"
armature.name = "StonePangolinRig"

# Contract: semi-matte, zero metalness. Stone plates must keep readable planes
# in the forest's bright and shadow zones rather than a plastic highlight.
for material in mesh.data.materials:
    material.name = "StonePangolinMaterial"
    material.diffuse_color = (1.0, 1.0, 1.0, 1.0)
    if material.use_nodes and material.node_tree:
        principled = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
        if principled:
            principled.inputs["Metallic"].default_value = 0.0
            principled.inputs["Roughness"].default_value = 0.82


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


def amplify_quaternion_motion(action, bone_names, factor, ceiling_degrees=58):
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
                amplified_delta = Quaternion(delta.axis, min(delta.angle * factor, math.radians(ceiling_degrees)))
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

LEG_BONES = {
    "frontleg", "frontleg0", "frontleg1", "frontleg2",
    "R_frontleg", "R_frontleg0", "R_frontleg1", "R_frontleg2",
    "backleg", "backleg0", "backleg1", "backleg2",
    "R_backleg", "R_backleg0", "R_backleg1", "R_backleg2",
}

# The Meshy Walking export already carries substantial keyed motion on all four
# limbs (measured 130 degrees at frontleg2), so the gait is kept rather than
# re-authored. Walk is the source cadence; Run amplifies the same curves.
imported = next(iter(bpy.data.actions))
imported.name = "Walk"
removed_scale_curves = remove_scale_curves(imported)
walk_end = int(imported.frame_range[1])

# glTF animation names come from NLA track names, not action names. The import
# already left a track carrying Meshy's original name, so clear it before adding
# the authored tracks or that name ships as a tenth animation.
while armature.animation_data.nla_tracks:
    armature.animation_data.nla_tracks.remove(armature.animation_data.nla_tracks[0])
add_nla_track(imported, walk_end)

run_action = imported.copy()
run_action.name = "Run"
amplified_run_keys = amplify_quaternion_motion(run_action, LEG_BONES, 1.18)
add_nla_track(run_action, walk_end)

# A heavy armoured body settles rather than sways. Idle keeps the plates almost
# still and lets only the chest and head carry a slow breath.
make_action(
    "Idle",
    64,
    [
        (0, {}, {}),
        (18, {
            "chest": (math.radians(1.6), 0, 0),
            "head": (math.radians(-1.2), 0, 0),
            "tail1": (0, math.radians(1.4), 0),
            "tail2": (0, math.radians(1.8), 0),
        }, {"Hips": (0, 0, -0.00008)}),
        (40, {
            "chest": (math.radians(-1.2), 0, 0),
            "head": (math.radians(1.4), 0, 0),
            "tail1": (0, math.radians(-1.2), 0),
            "tail2": (0, math.radians(-1.6), 0),
        }, {"Hips": (0, 0, 0.00006)}),
        (64, {}, {}),
    ],
)

make_action(
    "Turn",
    26,
    [
        (0, {}, {}),
        (9, {
            "Hips": (0, math.radians(-6), 0),
            "chest": (0, math.radians(-5), 0),
            "head": (0, math.radians(-7), 0),
            "frontleg0": (math.radians(-5), 0, 0),
            "R_frontleg0": (math.radians(4), 0, 0),
            "tail1": (0, math.radians(5), 0),
            "tail2": (0, math.radians(7), 0),
        }, {"Hips": (0, 0, -0.00012)}),
        (18, {
            "Hips": (0, math.radians(4), 0),
            "chest": (0, math.radians(3), 0),
            "head": (0, math.radians(5), 0),
            "tail1": (0, math.radians(-3), 0),
        }, {}),
        (26, {}, {}),
    ],
)

# Bite is the chain's fast opener: short wind-up, snap, quick recovery. The head
# sits low under the plate rim, so the reach comes from chest thrust.
make_action(
    "Bite",
    22,
    [
        (0, {}, {}),
        (5, {
            "Hips": (math.radians(-4), 0, 0),
            "chest": (math.radians(7), 0, 0),
            "head": (math.radians(8), 0, 0),
            "frontleg0": (math.radians(3), 0, 0),
            "R_frontleg0": (math.radians(3), 0, 0),
        }, {"Hips": (0, 0, -0.00040)}),
        (9, {
            "Hips": (math.radians(3), 0, 0),
            "chest": (math.radians(-10), 0, 0),
            "head": (math.radians(-14), 0, 0),
            "tail1": (0, math.radians(2), 0),
            "tail2": (0, math.radians(3), 0),
        }, {"Hips": (0, 0, -0.00012)}),
        (14, {"chest": (math.radians(-3), 0, 0), "head": (math.radians(-5), 0, 0)}, {}),
        (22, {}, {}),
    ],
)

# Slam is this form's signature and replaces Pounce. The contract asks for
# visible anticipation, a hard contact frame and a slow recovery, because fast
# symmetric motion is what makes armour read as foam. Timing is deliberately
# asymmetric: 14 frames of load, 4 frames of drop, then a long settle.
make_action(
    "Slam",
    38,
    [
        (0, {}, {}),
        (14, {
            "Hips": (math.radians(-11), 0, 0),
            "chest": (math.radians(15), 0, 0),
            "head": (math.radians(10), 0, 0),
            "frontleg": (math.radians(-12), 0, 0),
            "frontleg0": (math.radians(-14), 0, 0),
            "R_frontleg": (math.radians(-12), 0, 0),
            "R_frontleg0": (math.radians(-14), 0, 0),
            "backleg0": (math.radians(9), 0, 0),
            "R_backleg0": (math.radians(9), 0, 0),
            "tail1": (0, math.radians(-4), 0),
            "tail2": (0, math.radians(-6), 0),
        }, {"Hips": (0, 0, 0.00055)}),
        (18, {
            "Hips": (math.radians(9), 0, 0),
            "chest": (math.radians(-17), 0, 0),
            "head": (math.radians(-12), 0, 0),
            "frontleg": (math.radians(10), 0, 0),
            "frontleg0": (math.radians(12), 0, 0),
            "R_frontleg": (math.radians(10), 0, 0),
            "R_frontleg0": (math.radians(12), 0, 0),
            "backleg0": (math.radians(-5), 0, 0),
            "R_backleg0": (math.radians(-5), 0, 0),
            "tail1": (0, math.radians(6), 0),
            "tail2": (0, math.radians(8), 0),
            "tail3": (0, math.radians(9), 0),
        }, {"Hips": (0, 0, -0.00075)}),
        (22, {
            "Hips": (math.radians(4), 0, 0),
            "chest": (math.radians(-7), 0, 0),
            "head": (math.radians(-5), 0, 0),
            "tail1": (0, math.radians(3), 0),
        }, {"Hips": (0, 0, -0.00030)}),
        (30, {"chest": (math.radians(-2), 0, 0)}, {"Hips": (0, 0, -0.00008)}),
        (38, {}, {}),
    ],
)

# The tail is short and fully plated, so it sweeps rather than whips. Bracing
# the legs keeps the heavy body planted through the swing.
brace = {
    "frontleg0": (math.radians(-4), 0, math.radians(3)),
    "R_frontleg0": (math.radians(-4), 0, math.radians(-3)),
    "backleg0": (math.radians(5), 0, math.radians(4)),
    "R_backleg0": (math.radians(5), 0, math.radians(-4)),
}
make_action(
    "TailSwipe",
    32,
    [
        (0, {}, {}),
        (8, {**brace,
            "Hips": (math.radians(-4), math.radians(-15), 0),
            "chest": (math.radians(3), math.radians(9), 0),
            "head": (0, math.radians(6), 0),
            "tail": (0, math.radians(-8), 0),
            "tailstart": (0, math.radians(-10), 0),
            "tail1": (0, math.radians(-13), 0),
            "tail2": (0, math.radians(-16), 0),
            "tail3": (0, math.radians(-18), 0),
        }, {"Hips": (0, 0, -0.00030)}),
        (17, {**brace,
            "Hips": (math.radians(-2), math.radians(22), 0),
            "chest": (math.radians(-2), math.radians(-13), 0),
            "head": (0, math.radians(-9), 0),
            "tail": (0, math.radians(10), 0),
            "tailstart": (0, math.radians(13), 0),
            "tail1": (0, math.radians(17), 0),
            "tail2": (0, math.radians(21), 0),
            "tail3": (0, math.radians(24), 0),
        }, {"Hips": (0, 0, -0.00018)}),
        (24, {
            "Hips": (0, math.radians(7), 0),
            "tail1": (0, math.radians(6), 0),
            "tail2": (0, math.radians(8), 0),
            "tail3": (0, math.radians(9), 0),
        }, {}),
        (32, {}, {}),
    ],
)

make_action(
    "Hit",
    18,
    [
        (0, {}, {}),
        (4, {
            "Hips": (math.radians(6), 0, math.radians(4)),
            "chest": (math.radians(9), 0, math.radians(6)),
            "head": (math.radians(11), 0, math.radians(5)),
            "frontleg0": (math.radians(6), 0, 0),
            "R_frontleg0": (math.radians(4), 0, 0),
        }, {"Hips": (0, 0, -0.00030)}),
        (10, {
            "chest": (math.radians(-3), 0, math.radians(-2)),
            "head": (math.radians(-4), 0, 0),
        }, {}),
        (18, {}, {}),
    ],
)

make_action(
    "Death",
    46,
    [
        (0, {}, {}),
        (8, {
            "Hips": (math.radians(-7), 0, 0),
            "chest": (math.radians(10), 0, 0),
            "head": (math.radians(12), 0, 0),
        }, {"Hips": (0, 0, 0.00020)}),
        (22, {
            "Hips": (math.radians(5), 0, math.radians(13)),
            "chest": (math.radians(-6), 0, math.radians(16)),
            "head": (math.radians(-9), 0, math.radians(12)),
            "frontleg0": (math.radians(14), 0, 0),
            "R_frontleg0": (math.radians(12), 0, 0),
            "backleg0": (math.radians(11), 0, 0),
            "R_backleg0": (math.radians(13), 0, 0),
            "tail1": (0, math.radians(9), 0),
            "tail2": (0, math.radians(12), 0),
        }, {"Hips": (0, 0, -0.00090)}),
        (34, {
            "Hips": (math.radians(3), 0, math.radians(17)),
            "chest": (math.radians(-3), 0, math.radians(19)),
            "head": (math.radians(-5), 0, math.radians(15)),
            "frontleg0": (math.radians(16), 0, 0),
            "R_frontleg0": (math.radians(14), 0, 0),
            "backleg0": (math.radians(13), 0, 0),
            "R_backleg0": (math.radians(15), 0, 0),
            "tail1": (0, math.radians(11), 0),
            "tail2": (0, math.radians(14), 0),
        }, {"Hips": (0, 0, -0.00105)}),
        (46, {
            "Hips": (math.radians(3), 0, math.radians(17)),
            "chest": (math.radians(-3), 0, math.radians(19)),
            "head": (math.radians(-5), 0, math.radians(15)),
            "frontleg0": (math.radians(16), 0, 0),
            "R_frontleg0": (math.radians(14), 0, 0),
            "backleg0": (math.radians(13), 0, 0),
            "R_backleg0": (math.radians(15), 0, 0),
            "tail1": (0, math.radians(11), 0),
            "tail2": (0, math.radians(14), 0),
        }, {"Hips": (0, 0, -0.00105)}),
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

print("EA_STONE_PANGOLIN_PROCESS=" + json.dumps({
    "source": str(source_path),
    "output": str(output_path),
    "blend": str(blend_path),
    "mesh": mesh.name,
    "triangles": sum(len(polygon.loop_indices) - 2 for polygon in mesh.data.polygons),
    "bones": [bone.name for bone in armature.data.bones],
    "actions": sorted(action.name for action in bpy.data.actions),
    "removed_imported_scale_curves": removed_scale_curves,
    "amplified_run_quaternion_keys": amplified_run_keys,
}, ensure_ascii=False))
