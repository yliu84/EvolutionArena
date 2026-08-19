"""Shared rig handling for Meshy's semantic quadruped exports.

Three creatures have now arrived on the same skeleton - 27 bones named `Hips`,
`chest`, `head`, a four-segment tail and `frontleg`/`backleg` chains with `R_`
for the right side. The names are a claim and the rest pose is the evidence, so
they are checked rather than trusted; the checks live here because a third copy
of them would be a third place for them to drift.

What is deliberately not shared is the clips. Every creature moves differently,
and a shared "quadruped walk" is how a river ambusher and a grazing goat end up
indistinguishable in motion.
"""

import math

import bpy
from mathutils import Euler


def resolve_quadruped_roles(armature):
    """Bone chains by role, checked against the rest pose.

    A rig whose `frontleg` is behind its `backleg` would animate a creature
    walking backwards, and every clip would look subtly wrong with nothing
    obviously broken.
    """
    def chain(*names):
        missing = [name for name in names if name not in armature.data.bones]
        if missing:
            raise SystemExit(f"Rig is missing expected bones: {missing}")
        return list(names)

    roles = {
        "root": chain("Hips"),
        "chest": chain("chest"),
        "head": chain("head"),
        "tail": chain("tail", "tailstart", "tail1", "tail2", "tail3"),
        "frontLeft": chain("frontleg", "frontleg0", "frontleg1", "frontleg2"),
        "frontRight": chain("R_frontleg", "R_frontleg0", "R_frontleg1", "R_frontleg2"),
        "backLeft": chain("backleg", "backleg0", "backleg1", "backleg2"),
        "backRight": chain("R_backleg", "R_backleg0", "R_backleg1", "R_backleg2"),
    }
    roles["spine"] = roles["root"] + roles["chest"]

    bones = armature.data.bones
    head_of = lambda name: bones[name].head_local
    forward = max(range(3), key=lambda axis: abs(head_of("head")[axis] - head_of("tail3")[axis]))
    forward_sign = 1 if head_of("head")[forward] > head_of("tail3")[forward] else -1
    if (head_of(roles["frontLeft"][0])[forward] - head_of(roles["backLeft"][0])[forward]) * forward_sign <= 0:
        raise SystemExit("Front legs are not forward of the back legs; the rig names cannot be trusted")

    side = max(range(3), key=lambda axis: abs(head_of(roles["frontLeft"][0])[axis] - head_of(roles["frontRight"][0])[axis]))
    for left, right in (("frontLeft", "frontRight"), ("backLeft", "backRight")):
        if head_of(roles[left][0])[side] * head_of(roles[right][0])[side] >= 0:
            raise SystemExit(f"{left} and {right} are on the same side of the body")

    up = next(axis for axis in range(3) if axis not in (forward, side))
    return roles, {"forward": forward, "side": side, "up": up, "forwardSign": forward_sign}


def reset_pose(armature):
    for pose_bone in armature.pose.bones:
        pose_bone.rotation_mode = "QUATERNION"
        pose_bone.rotation_quaternion = (1, 0, 0, 0)
        pose_bone.location = (0, 0, 0)
        pose_bone.scale = (1, 1, 1)


def probe_rotation_axes(armature, spine_chain, tip_bone, up_axis, side_axis, angle=math.radians(20)):
    """Find which bone-local axis is pitch and which is yaw, by trying them.

    Bone local axes in these exports are whatever the solver produced and they
    differ between creatures on the same skeleton. Guessing was right once and
    wrong once - the wrong one tumbled a beetle nose over tail - so they are
    measured: rotate the spine a little on each axis and watch where the far end
    of the animal actually goes. Returns pitch, yaw, and the sign of pitch that
    drops the nose.
    """
    def displacement(axis):
        reset_pose(armature)
        for name in spine_chain:
            value = [0.0, 0.0, 0.0]
            value[axis] = angle
            armature.pose.bones[name].rotation_quaternion = Euler(value, "XYZ").to_quaternion()
        bpy.context.view_layer.update()
        moved = armature.matrix_world @ armature.pose.bones[tip_bone].tail
        reset_pose(armature)
        bpy.context.view_layer.update()
        return moved - (armature.matrix_world @ armature.pose.bones[tip_bone].tail)

    deltas = {axis: displacement(axis) for axis in range(3)}
    pitch = max(range(3), key=lambda axis: abs(deltas[axis][up_axis]))
    yaw = max((axis for axis in range(3) if axis != pitch), key=lambda axis: abs(deltas[axis][side_axis]))
    pitch_sign = -1 if deltas[pitch][up_axis] > 0 else 1
    reset_pose(armature)
    return pitch, yaw, pitch_sign


def make_spread(pitch_axis, pitch_sign):
    """Builds the chain-bending helper, bound to this rig's measured pitch.

    The angle is a total across the chain, not a per-bone value. Rotations
    compound down a hierarchy, so applying the angle to every bone bends the
    chain by the angle times its length: the call that read as a 26-degree
    rear-back on a two-bone spine threw a seven-bone one through 112 degrees.
    Chain length belongs to whichever rig the solver produced and can never be
    an input to how hard a clip swings.
    """
    def spread(chain_bones, angle, axis, falloff=1.0):
        if axis == pitch_axis:
            angle *= pitch_sign
        weights = [falloff ** index for index in range(len(chain_bones))]
        total = sum(weights) or 1
        out = {}
        for name, weight in zip(chain_bones, weights):
            value = [0.0, 0.0, 0.0]
            value[axis] = angle * weight / total
            out[name] = tuple(value)
        return out
    return spread


def merge(*parts):
    out = {}
    for part in parts:
        out.update(part)
    return out


def make_action_builder(armature):
    """Returns `make_action(name, frame_end, poses)` bound to this armature."""
    def key_pose(frame, rotations=None):
        reset_pose(armature)
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
    return make_action
