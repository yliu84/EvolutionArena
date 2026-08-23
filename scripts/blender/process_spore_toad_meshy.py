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

# --- Colour ----------------------------------------------------------------
#
# Measured off the baked map rather than judged: the sac is 22% of the texture
# at RGB (5, 180, 192) and the body is the other 77% at RGB (19, 30, 28). That
# body is 12% brightness - near black - and on the valley's green ground at a
# 0.64 radius it reads as a shadow rather than as an animal. Reported as
# "the body colour looks black".
#
# Two changes, and they are different jobs. The body is lifted so it is a dark
# blue-green instead of a dark nothing. The sac is made *emissive*, because it
# was never anything but bright paint - the contract says the body stays dark so
# the sac carries the read, and that only works if the sac is actually light.
# Lifting the whole creature to compensate would have thrown away the contrast
# the design is built on.
BODY_GAIN = 2.7
BODY_FLOOR = 0.02
EMISSIVE_STRENGTH = 1.6

import numpy as np

base_image = next((image for image in bpy.data.images
                   if image.type == "IMAGE" and "BaseColor" in image.name), None)
colour_report = {}
if base_image is not None:
    buffer = np.empty(len(base_image.pixels), dtype=np.float32)
    base_image.pixels.foreach_get(buffer)
    pixels = buffer.reshape(-1, 4)
    rgb = pixels[:, :3]
    # The sac is picked out by a percentile of its own distribution rather than
    # a fixed threshold, because Blender hands these back in a different colour
    # space than the PNG they were measured in and a hard number would be wrong
    # in one of the two.
    brightness = (rgb[:, 1] + rgb[:, 2]) * 0.5
    cut = float(np.percentile(brightness, 76))
    glow = brightness > cut
    body = ~glow

    before = rgb[body].mean(axis=0).tolist()
    lifted = np.clip(rgb[body] * BODY_GAIN + BODY_FLOOR, 0.0, 1.0)
    # Never let the body reach the sac. The whole read depends on one of them
    # being the bright thing.
    rgb[body] = np.minimum(lifted, cut * 0.85)
    after = rgb[body].mean(axis=0).tolist()
    pixels[:, :3] = rgb
    base_image.pixels.foreach_set(pixels.reshape(-1))
    base_image.pack()

    emissive = bpy.data.images.new("Baked_Emissive", base_image.size[0], base_image.size[1])
    lit = np.zeros_like(pixels)
    lit[:, 3] = 1.0
    lit[glow, :3] = rgb[glow]
    emissive.pixels.foreach_set(lit.reshape(-1))
    emissive.pack()

    for material in mesh.data.materials:
        if not material.use_nodes or material.node_tree is None:
            continue
        principled = next((n for n in material.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
        if principled is None:
            continue
        texture = material.node_tree.nodes.new("ShaderNodeTexImage")
        texture.image = emissive
        texture.location = (principled.location.x - 420, principled.location.y - 320)
        material.node_tree.links.new(principled.inputs["Emission Color"], texture.outputs["Color"])
        principled.inputs["Emission Strength"].default_value = EMISSIVE_STRENGTH

    colour_report = {
        "sacShare": round(float(glow.mean()), 3),
        "bodyBefore": [round(v, 3) for v in before],
        "bodyAfter": [round(v, 3) for v in after],
        "emissiveStrength": EMISSIVE_STRENGTH,
    }

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
# Roll is whichever bone-local axis the probe did not claim: pitch moves the far
# end vertically, yaw swings it sideways, and the third turns the body about its
# own length. Derived rather than assumed, for the same reason the other two are.
ROLL = next(axis for axis in range(3) if axis not in (PITCH, YAW))

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

# Death: it goes over onto its back.
#
# It used to settle in place, on the reasoning that a wide low animal has
# nowhere to fall. True of the body and wrong about the read: a toad on its back
# with its legs in the air is the one death on this map that cannot be mistaken
# for anything else, and this creature is the smallest thing in the game - at a
# 0.64 radius a settle is a dark shape getting slightly darker.
#
# The roll goes on the root, and it goes on last.
#
# On the root because every leg chain begins at the shoulder vertebra one bone
# down - the resolver reports `frontRight` starting at the same bone the spine
# does - so a roll written there is overwritten by whichever leg pose is merged
# after it. The first attempt turned the creature twelve degrees instead of a
# hundred and eighty for exactly that reason, and the bounding box barely moved.
#
# Last because `merge` is last-wins, and this is the one rotation in the clip
# that must not be quietly replaced by another.
#
# Rolling at the root does not swing the body through an arc even though the
# root sits at the nose: roll is rotation about the bone's own length, and that
# line runs down the middle of the animal, so it turns over where it stands.
ROLL_BONE = SPINE[:1]
make_action("Death", 64, [
    (0, {}),
    # A stagger first, so the flip is a consequence rather than an event.
    (12, merge(
        spread(SPINE, D(-14), PITCH, 0.7), spread(HEAD, D(-16), PITCH),
        spread(SPINE, D(11), YAW, 0.7),
    )),
    (34, merge(
        spread(FRONT_R, D(-24), PITCH, 0.8), spread(FRONT_L, D(-20), PITCH, 0.8),
        spread(BACK_R, D(-18), PITCH, 0.8), spread(BACK_L, D(-22), PITCH, 0.8),
        spread(ROLL_BONE, D(105), ROLL),
    )),
    (64, merge(
        # Legs drawn up and slightly curled, which is what makes it read as
        # dead rather than as a creature lying on its back.
        spread(FRONT_R, D(-46), PITCH, 0.8), spread(FRONT_L, D(-42), PITCH, 0.8),
        spread(BACK_R, D(-38), PITCH, 0.8), spread(BACK_L, D(-44), PITCH, 0.8),
        spread(HEAD, D(12), PITCH),
        spread(ROLL_BONE, D(180), ROLL),
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
    "boneAxes": {"pitch": PITCH, "yaw": YAW, "roll": ROLL, "pitchSign": PITCH_SIGN},
    "roles": {"spine": SPINE, "hips": HIPS, "head": HEAD,
              "frontRight": FRONT_R, "frontLeft": FRONT_L,
              "backRight": BACK_R, "backLeft": BACK_L},
    "colour": colour_report,
    "actions": sorted(action.name for action in bpy.data.actions),
}, ensure_ascii=False))
