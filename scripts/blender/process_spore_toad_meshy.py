"""Turn the Meshy auto-rigged Spore Toad export into the valley prey runtime GLB.

The last unmodelled family on the valley map. Fourteen Swarm creatures stood on
the road as code-built primitives while everything around them was an authored
body; this is what replaces them.

The source is the cleanest this project has received: one connected mesh, 18,522
triangles, no baked take, no helper geometry, and zero loose parts - it passes
the debris gate at 0.00% before anything is done to it.

Roles come from `meshy_autorig_quadruped.resolve_unnamed_quadruped` rather than
from a classifier written here. Every previous creature grew its own, because
each had something a plain quadruped does not: bladed arms, elytra, antennae.
This animal has four legs, a spine and a head and nothing else, which is exactly
what that shared resolver was written for - and reusing it is the difference
between one tested classifier and a sixth private copy of the same idea.

Bone numbering is never an input. A UniRig export numbers joints in the order
the solver visited them, so `Bone_011` is a back leg here and something else on
the next animal.

Usage:
  blender --background --python scripts/blender/process_spore_toad_meshy.py \
      -- source.glb public/assets/quality-3d/models/spore-toad-runtime-v1.glb
"""

import json
import math
import os
import sys
from pathlib import Path

import bpy
from mathutils import Euler, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from meshy_autorig_quadruped import resolve_unnamed_quadruped
from meshy_cleanup import remove_degenerate_uv_faces, remove_invalid_tangent_faces

if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python process_spore_toad_meshy.py -- source.glb output.glb")

arguments = sys.argv[sys.argv.index("--") + 1:]
source_path = Path(arguments[0]).expanduser().resolve()
output_path = Path(arguments[1]).expanduser().resolve()
output_path.parent.mkdir(parents=True, exist_ok=True)

# The same prey budget the other valley creatures carry. This one arrives in
# packs of two and three, over scenery already drawing millions of triangles.
TARGET_RUNTIME_TRIANGLES = 12_000

# The Swarm family's collision radius, and the smallest body on the map. Sizing
# is not typing: this gives it the family's footprint so that what blocks the
# player is the creature they can see, and nothing else.
BODY_RADIUS = 0.64

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))
armature = next(item for item in bpy.context.scene.objects if item.type == "ARMATURE")
mesh = max((item for item in bpy.context.scene.objects if item.type == "MESH"), key=lambda item: len(item.data.vertices))

# Meshy ships an Icosphere as a viewport bone helper. Clear the custom-shape
# references before deleting it, or the glTF exporter follows the dependency and
# restores it as a second game mesh.
for pose_bone in armature.pose.bones:
    pose_bone.custom_shape = None
removed_helpers = []
for item in list(bpy.context.scene.objects):
    if item.type == "MESH" and item != mesh:
        removed_helpers.append(item.name)
        bpy.data.objects.remove(item, do_unlink=True)

roles, axes = resolve_unnamed_quadruped(armature)
FORWARD, SIDE, UP = axes["forward"], axes["side"], axes["up"]
SPINE = roles["spine"]
HIPS = roles["hips"]
HEAD = roles["head"] or roles["spine"][-1:]
FRONT_R, FRONT_L = roles["frontRight"], roles["frontLeft"]
BACK_R, BACK_L = roles["backRight"], roles["backLeft"]

# --- Size ------------------------------------------------------------------
bpy.context.view_layer.update()
corners = [mesh.matrix_world @ Vector(corner) for corner in mesh.bound_box]
source_size = Vector((
    max(c.x for c in corners) - min(c.x for c in corners),
    max(c.y for c in corners) - min(c.y for c in corners),
    max(c.z for c in corners) - min(c.z for c in corners),
))
# The footprint is the widest horizontal extent, which is what the runtime
# measures and what collision uses. Height follows it; a squat animal sized by
# height would come out enormous.
footprint = max(source_size[axis] for axis in range(3) if axis != UP)
scale_factor = (BODY_RADIUS * 2) / footprint
armature.scale = tuple(value * scale_factor for value in armature.scale)
bpy.context.view_layer.update()
runtime_size = source_size * scale_factor

# --- Triangles and textures ------------------------------------------------
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

# A 17MB source on a creature that is 1.28 units across at the far end of a
# valley. The other prey ship at 1024 and none of them lost anything visible.
resized = []
for image in bpy.data.images:
    if image.type == "IMAGE" and max(image.size) > 1024:
        resized.append([image.name, list(image.size)])
        image.scale(1024, 1024)
        image.pack()

# --- Clips -----------------------------------------------------------------
armature.animation_data_create()
while armature.animation_data.nla_tracks:
    armature.animation_data.nla_tracks.remove(armature.animation_data.nla_tracks[0])
for action in list(bpy.data.actions):
    bpy.data.actions.remove(action)


def reset_pose():
    for pose_bone in armature.pose.bones:
        pose_bone.rotation_mode = "QUATERNION"
        pose_bone.rotation_quaternion = (1, 0, 0, 0)
        pose_bone.location = (0, 0, 0)
        pose_bone.scale = (1, 1, 1)


def key_pose(frame, rotations=None):
    reset_pose()
    for name, rotation in (rotations or {}).items():
        armature.pose.bones[name].rotation_quaternion = Euler(rotation, "XYZ").to_quaternion()
    for pose_bone in armature.pose.bones:
        pose_bone.keyframe_insert(data_path="rotation_quaternion", frame=frame, group=pose_bone.name)


def make_action(name, frame_end, poses):
    action = bpy.data.actions.new(name=name)
    armature.animation_data.action = action
    for frame, rotations in poses:
        key_pose(frame, rotations)
    track = armature.animation_data.nla_tracks.new()
    track.name = name
    strip = track.strips.new(name, 0, action)
    strip.action_frame_start = 0
    strip.action_frame_end = frame_end
    armature.animation_data.action = None
    return action


def probe_rotation_axes(chain, tip_bone, up_axis, side_axis, angle=math.radians(20)):
    """Which bone-local axis is pitch and which is yaw, measured rather than assumed.

    Auto-rig bone axes are whatever the solver produced and differ between
    exports of the same kind of animal. A clip authored on an assumption
    tumbled the Ford Fang nose over tail.
    """
    def displacement(axis, sign):
        reset_pose()
        for name in chain:
            value = [0.0, 0.0, 0.0]
            value[axis] = angle * sign
            armature.pose.bones[name].rotation_quaternion = Euler(value, "XYZ").to_quaternion()
        bpy.context.view_layer.update()
        moved = armature.matrix_world @ armature.pose.bones[tip_bone].tail
        reset_pose()
        bpy.context.view_layer.update()
        return moved - (armature.matrix_world @ armature.pose.bones[tip_bone].tail)

    deltas = {axis: displacement(axis, 1) for axis in range(3)}
    pitch = max(range(3), key=lambda axis: abs(deltas[axis][up_axis]))
    yaw = max((axis for axis in range(3) if axis != pitch), key=lambda axis: abs(deltas[axis][side_axis]))
    pitch_sign = -1 if deltas[pitch][up_axis] > 0 else 1
    reset_pose()
    return pitch, yaw, pitch_sign


def spread(chain_bones, angle, axis, falloff=1.0):
    """Bend a chain by `angle` in total, distributed along it.

    The total matters because rotations compound down a hierarchy: applying the
    angle to every bone bends the chain by the angle times its length. Chain
    length is a property of whichever rig the solver produced, so it can never
    be an input to how hard a clip swings.
    """
    if axis == PITCH:
        angle *= PITCH_SIGN
    weights = [falloff ** index for index in range(len(chain_bones))]
    total = sum(weights) or 1
    out = {}
    for name, weight in zip(chain_bones, weights):
        value = [0.0, 0.0, 0.0]
        value[axis] = angle * weight / total
        out[name] = tuple(value)
    return out


def merge(*parts):
    out = {}
    for part in parts:
        out.update(part)
    return out


D = math.radians
PITCH, YAW, PITCH_SIGN = probe_rotation_axes(SPINE, SPINE[-1], UP, SIDE)

# Idle: a toad sitting. Almost all of the motion is a slow breath through the
# body; the legs stay planted, because a squat animal that shifts its feet at
# rest reads as agitated and this one is the calmest thing on the map.
make_action("Idle", 120, [
    (0, {}),
    (30, merge(spread(SPINE, D(3), PITCH, 0.7), spread(HEAD, D(4), PITCH))),
    (60, {}),
    (90, merge(spread(SPINE, D(-2), PITCH, 0.7), spread(HEAD, D(-3), PITCH))),
    (120, {}),
])

# Walk: a hop, not a stride. Diagonal pairs together, the body rising with them,
# because a toad that walks like a lizard is a lizard - and not looking like the
# player is the whole reason this form exists.
make_action("Walk", 48, [
    (0, {}),
    (12, merge(
        spread(FRONT_R, D(-30), PITCH, 0.8), spread(BACK_L, D(-34), PITCH, 0.8),
        spread(FRONT_L, D(16), PITCH, 0.8), spread(BACK_R, D(18), PITCH, 0.8),
        spread(SPINE, D(-7), PITCH, 0.7),
    )),
    (24, {}),
    (36, merge(
        spread(FRONT_L, D(-30), PITCH, 0.8), spread(BACK_R, D(-34), PITCH, 0.8),
        spread(FRONT_R, D(16), PITCH, 0.8), spread(BACK_L, D(18), PITCH, 0.8),
        spread(SPINE, D(-7), PITCH, 0.7),
    )),
    (48, {}),
])

# Lunge: the attack. One take, wind-up through recovery, because the runtime
# stretches a single clip over the authority's telegraph and strike and never
# reads the animation back. A short rock back, then the whole body driven
# forward - it has no jaws worth showing at this size.
make_action("Lunge", 40, [
    (0, {}),
    (14, merge(
        spread(SPINE, D(-16), PITCH, 0.7), spread(HEAD, D(-12), PITCH),
        spread(FRONT_R, D(20), PITCH, 0.8), spread(FRONT_L, D(20), PITCH, 0.8),
    )),
    (22, merge(
        spread(SPINE, D(26), PITCH, 0.7), spread(HEAD, D(18), PITCH),
        spread(FRONT_R, D(-34), PITCH, 0.8), spread(FRONT_L, D(-34), PITCH, 0.8),
        spread(BACK_R, D(-14), PITCH, 0.8), spread(BACK_L, D(-14), PITCH, 0.8),
    )),
    (40, {}),
])

# Hit: a flinch that reads at a hand's width on screen. Restarted every time it
# is entered, so a creature struck twice flinches twice.
make_action("Hit", 22, [
    (0, {}),
    (6, merge(spread(SPINE, D(-13), PITCH, 0.7), spread(HEAD, D(-16), PITCH), spread(SPINE, D(9), YAW, 0.7))),
    (22, {}),
])

# Death: it settles rather than topples. A wide low animal has nowhere to fall.
make_action("Death", 56, [
    (0, {}),
    (20, merge(spread(SPINE, D(-10), PITCH, 0.7), spread(HEAD, D(-14), PITCH))),
    (56, merge(
        spread(SPINE, D(16), PITCH, 0.7), spread(HEAD, D(22), PITCH),
        spread(FRONT_R, D(-30), PITCH, 0.8), spread(FRONT_L, D(-28), PITCH, 0.8),
        spread(BACK_R, D(-26), PITCH, 0.8), spread(BACK_L, D(-29), PITCH, 0.8),
    )),
])

armature.animation_data.action = None
reset_pose()

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

print("EA_SPORE_TOAD_PROCESS=" + json.dumps({
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
    "axes": {"forward": FORWARD, "side": SIDE, "up": UP},
    "boneAxes": {"pitch": PITCH, "yaw": YAW, "pitchSign": PITCH_SIGN},
    "roles": {"spine": SPINE, "hips": HIPS, "head": HEAD,
              "frontRight": FRONT_R, "frontLeft": FRONT_L,
              "backRight": BACK_R, "backLeft": BACK_L},
    "actions": sorted(action.name for action in bpy.data.actions),
}, ensure_ascii=False))
