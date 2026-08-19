"""Turn the Meshy auto-rigged Ford Fang export into the valley prey runtime GLB.

The first *modelled* prey on this project. Every creature in the 3D body so far
is either a player form, a boss, or code-built geometry - the Fang, Carapace and
Swarm prey are Three.js primitives. That difference sets the budget, and it is
the opposite way round from what it looks like: a boss is one instance on
screen and prey arrive in packs of three or four, so this body gets a *tighter*
triangle budget than the accepted player forms, not a looser one.

Three defects in the source, all already on the list this project keeps:

1. An Icosphere viewport helper, shipped in every Meshy export so far. It is 2
   units across against the creature's 0.026, so anything that measures the
   scene with it still in gets an answer 230 times too big - which is exactly
   what happened while reviewing this model.
2. A non-unit armature scale, here 0.01.
3. One baked take named `Armature|Unreal Take|baselayer`, not a clip set.

What is *better* than previous runs: the auto-rig came back with semantic
quadruped names - `frontleg`/`backleg` with `R_` for the right side, a
four-segment tail, a chest and a head. The geometric role classifier written for
the Bladeshell is not needed. The names are still checked against the rest pose
rather than trusted, because a name is a claim and the rest pose is evidence.

Usage:
  blender --background --python scripts/blender/process_ford_fang_meshy.py \
      -- source.glb public/assets/quality-3d/models/ford-fang-runtime-v1.glb
"""

import json
import math
import os
import sys
from pathlib import Path

import bpy
from mathutils import Euler, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from meshy_cleanup import remove_degenerate_uv_faces, remove_invalid_tangent_faces

if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python process_ford_fang_meshy.py -- source.glb output.glb")

arguments = sys.argv[sys.argv.index("--") + 1:]
source_path = Path(arguments[0]).expanduser().resolve()
output_path = Path(arguments[1]).expanduser().resolve()
output_path.parent.mkdir(parents=True, exist_ok=True)

# Prey, not a boss. Four of these can be on screen at once against a boss's one,
# and the valley's scenery already draws 2.5M triangles, so the budget sits
# below the accepted player forms (Fang 19,406, Shell 20,391) rather than beside
# them. The source arrives at 230,859.
TARGET_RUNTIME_TRIANGLES = 14_000

# Authoritative collision radius for the Fang family, from
# `GLOAMWOOD_PREY_BODY_RADII`. The visible body is sized to match it rather than
# to any authored height: blocking that does not match the visible footprint is
# the Goal 2 lesson, and it is cheaper to enforce here than to discover in a
# fight.
FANG_BODY_RADIUS = 1.02

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


def chain(*names):
    """A limb as a list, checked to exist. Runs outward: [0] is the shoulder."""
    missing = [name for name in names if name not in armature.data.bones]
    if missing:
        raise SystemExit(f"Rig is missing expected bones: {missing}")
    return list(names)


ROOT = chain("Hips")
CHEST = chain("chest")
HEAD = chain("head")
TAIL = chain("tail", "tailstart", "tail1", "tail2", "tail3")
FRONT_L = chain("frontleg", "frontleg0", "frontleg1", "frontleg2")
FRONT_R = chain("R_frontleg", "R_frontleg0", "R_frontleg1", "R_frontleg2")
BACK_L = chain("backleg", "backleg0", "backleg1", "backleg2")
BACK_R = chain("R_backleg", "R_backleg0", "R_backleg1", "R_backleg2")
SPINE = ROOT + CHEST

bones = armature.data.bones


def head_of(name):
    return bones[name].head_local


# The rest pose is the evidence; the names are only the claim. A rig whose
# `frontleg` is behind its `backleg` would animate a creature walking backwards
# and every clip would look subtly wrong with nothing obviously broken.
forward_axis = max(range(3), key=lambda axis: abs(head_of("head")[axis] - head_of("tail3")[axis]))
forward_sign = 1 if head_of("head")[forward_axis] > head_of("tail3")[forward_axis] else -1
if (head_of(FRONT_L[0])[forward_axis] - head_of(BACK_L[0])[forward_axis]) * forward_sign <= 0:
    raise SystemExit("Front legs are not forward of the back legs; the rig names cannot be trusted")

side_axis = max(range(3), key=lambda axis: abs(head_of(FRONT_L[0])[axis] - head_of(FRONT_R[0])[axis]))
for left, right in ((FRONT_L, FRONT_R), (BACK_L, BACK_R)):
    if head_of(left[0])[side_axis] * head_of(right[0])[side_axis] >= 0:
        raise SystemExit(f"{left[0]} and {right[0]} are on the same side of the body")

up_axis = next(axis for axis in range(3) if axis not in (forward_axis, side_axis))

mesh.name = "FordFangMesh"
mesh.data.name = "FordFangMeshData"
armature.name = "FordFangRig"
for material in mesh.data.materials:
    material.name = "FordFangMaterial"
    if material.use_nodes and material.node_tree:
        principled = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
        if principled:
            principled.inputs["Metallic"].default_value = 0.0
            # Wet river hide, not the dry matte the kit rocks use.
            principled.inputs["Roughness"].default_value = 0.58

# --- Size ------------------------------------------------------------------
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
world_up = max(range(3), key=lambda axis: 0)  # placeholder, replaced below
# In world space after the glTF import the vertical axis is whichever is
# smallest for a long low animal, so it is taken from the rig instead of guessed.
world_axes = sorted(range(3), key=lambda axis: source_size[axis])
longest = max(range(3), key=lambda axis: source_size[axis])
scale_factor = (FANG_BODY_RADIUS * 2) / source_size[longest]
armature.scale = tuple(value * scale_factor for value in armature.scale)
bpy.context.view_layer.update()
runtime_size = source_size * scale_factor

# --- Triangles -------------------------------------------------------------
source_triangles = sum(len(polygon.loop_indices) - 2 for polygon in mesh.data.polygons)
bpy.ops.object.select_all(action="DESELECT")
mesh.select_set(True)
bpy.context.view_layer.objects.active = mesh
decimate = mesh.modifiers.new(name="WebRuntimeRetopology", type="DECIMATE")
decimate.decimate_type = "COLLAPSE"
decimate.ratio = min(1.0, TARGET_RUNTIME_TRIANGLES / source_triangles)
decimate.use_collapse_triangulate = True
# First in the stack, or it would be evaluated after the armature deform.
bpy.ops.object.modifier_move_to_index(modifier=decimate.name, index=0)
bpy.ops.object.modifier_apply(modifier=decimate.name)
for polygon in mesh.data.polygons:
    polygon.use_smooth = True
removed_uv_faces = remove_degenerate_uv_faces(mesh.data)
removed_tangent_faces = remove_invalid_tangent_faces(mesh.data)
runtime_triangles = sum(len(polygon.loop_indices) - 2 for polygon in mesh.data.polygons)

for image in bpy.data.images:
    if image.type == "IMAGE" and max(image.size) > 1024:
        image.scale(1024, 1024)
        image.pack()

# --- Clips -----------------------------------------------------------------
armature.animation_data_create()
while armature.animation_data.nla_tracks:
    armature.animation_data.nla_tracks.remove(armature.animation_data.nla_tracks[0])
# The single imported take is a walk cycle in a naming scheme the runtime cannot
# select from, and it is the only motion in the file. Every clip below is
# authored, as the Bladeshell's were.
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


def probe_rotation_axes(spine_chain, tip_bone, up_axis, side_axis, angle=math.radians(20)):
    """Find which bone-local axis is pitch and which is yaw, by trying them.

    Bone local axes in an auto-rig are whatever the solver produced, and they
    differ between exports of the same kind of animal. The Ford Fang's rig
    happened to put pitch on the first axis; this one does not, and the clip
    authored on that assumption tumbled the whole creature nose-over instead of
    rearing it.

    So the axes are measured rather than assumed: rotate the spine a little on
    each axis in turn and watch where the far end of the animal actually goes.
    Pitch is the axis that moves it vertically, yaw the one that swings it
    sideways. Returns both, and the sign of pitch that drops the nose.
    """
    def displacement(axis, sign):
        reset_pose()
        for name in spine_chain:
            value = [0.0, 0.0, 0.0]
            value[axis] = angle * sign
            armature.pose.bones[name].rotation_quaternion = Euler(value, "XYZ").to_quaternion()
        bpy.context.view_layer.update()
        moved = armature.matrix_world @ armature.pose.bones[tip_bone].tail
        reset_pose()
        bpy.context.view_layer.update()
        rest = armature.matrix_world @ armature.pose.bones[tip_bone].tail
        return moved - rest

    deltas = {axis: displacement(axis, 1) for axis in range(3)}
    pitch = max(range(3), key=lambda axis: abs(deltas[axis][up_axis]))
    yaw = max((axis for axis in range(3) if axis != pitch),
              key=lambda axis: abs(deltas[axis][side_axis]))
    # Positive pitch should drop the nose, so a wind-up reads as a rear-back and
    # the strike as a drive downward rather than the reverse.
    pitch_sign = -1 if deltas[pitch][up_axis] > 0 else 1
    reset_pose()
    return pitch, yaw, pitch_sign


def spread(chain_bones, angle, axis, falloff=1.0):
    """Bend a whole chain by `angle` in total, distributed along it.

    The total matters because rotations compound down a hierarchy. Applying the
    angle to every bone bends the chain by the angle times its length, so the
    same call that read as a 26-degree rear-back on a two-bone spine threw a
    seven-bone one through 112 degrees and tumbled the animal nose over tail.
    Chain length is a property of whichever rig the solver produced, so it can
    never be an input to how hard a clip swings.

    Pitch is signed by the probe, so every clip below is authored as "positive
    drops the nose" whichever way this rig's axis happens to run.
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
PITCH, YAW, PITCH_SIGN = probe_rotation_axes(SPINE + HEAD, HEAD[-1], up_axis, side_axis)

# Idle: an ambusher barely moves. Breath through the spine, a slow tail.
make_action("Idle", 96, [
    (0, {}),
    (32, merge(spread(SPINE, D(3), PITCH), spread(TAIL, D(12), YAW, 0.85))),
    (64, merge(spread(SPINE, D(-2), PITCH), spread(TAIL, D(-13), YAW, 0.85))),
    (96, {}),
])

# Walk: a low sprawling gait, diagonal pairs, body rolling with it.
make_action("Walk", 48, [
    (0, {}),
    (12, merge(
        spread(SPINE, D(7), YAW),
        spread(FRONT_L, D(60), PITCH, 0.75), spread(BACK_R, D(55), PITCH, 0.75),
        spread(FRONT_R, D(-38), PITCH, 0.75), spread(BACK_L, D(-33), PITCH, 0.75),
        spread(TAIL, D(20), YAW, 0.8),
    )),
    (24, {}),
    (36, merge(
        spread(SPINE, D(-7), YAW),
        spread(FRONT_R, D(60), PITCH, 0.75), spread(BACK_L, D(55), PITCH, 0.75),
        spread(FRONT_L, D(-38), PITCH, 0.75), spread(BACK_R, D(-33), PITCH, 0.75),
        spread(TAIL, D(-20), YAW, 0.8),
    )),
    (48, {}),
])

# Bite: the identity. Fang prey commit, and the long snout is what sells it, so
# the wind-up coils the whole animal back and the strike drives the head through
# on the body rather than nodding it. A jaw that snaps alone reads as nothing -
# the same lesson the Swarm form's first rake taught.
make_action("Bite", 34, [
    (0, {}),
    (11, merge(
        spread(SPINE, D(-26), PITCH), spread(HEAD, D(-19), PITCH),
        spread(FRONT_L, D(-47), PITCH, 0.8), spread(FRONT_R, D(-47), PITCH, 0.8),
        spread(TAIL, D(45), PITCH, 0.9),
    )),
    (17, merge(
        spread(SPINE, D(38), PITCH), spread(HEAD, D(27), PITCH),
        spread(FRONT_L, D(71), PITCH, 0.8), spread(FRONT_R, D(71), PITCH, 0.8),
        spread(TAIL, D(-61), PITCH, 0.9),
    )),
    (24, merge(spread(SPINE, D(12), PITCH), spread(HEAD, D(8), PITCH))),
    (34, {}),
])

make_action("Hit", 20, [
    (0, {}),
    (4, merge(
        spread(SPINE, D(24), PITCH), spread(HEAD, D(16), YAW),
        spread(TAIL, D(-37), YAW, 0.9),
    )),
    (11, merge(spread(SPINE, D(-10), PITCH), spread(HEAD, D(-6), YAW))),
    (20, {}),
])

make_action("Death", 56, [
    (0, {}),
    (10, merge(spread(SPINE, D(-22), PITCH), spread(HEAD, D(14), PITCH))),
    (30, merge(
        spread(SPINE, D(30), PITCH), spread(SPINE, D(48), YAW),
        spread(HEAD, D(-18), PITCH),
        spread(FRONT_L, D(77), PITCH, 0.8), spread(FRONT_R, D(62), PITCH, 0.8),
        spread(BACK_L, D(71), PITCH, 0.8), spread(BACK_R, D(83), PITCH, 0.8),
        spread(TAIL, D(70), YAW, 0.85),
    )),
    (44, merge(
        spread(SPINE, D(34), PITCH), spread(SPINE, D(54), YAW),
        spread(HEAD, D(-21), PITCH),
        spread(FRONT_L, D(86), PITCH, 0.8), spread(FRONT_R, D(71), PITCH, 0.8),
        spread(BACK_L, D(80), PITCH, 0.8), spread(BACK_R, D(92), PITCH, 0.8),
        spread(TAIL, D(82), YAW, 0.85),
    )),
    (56, merge(
        spread(SPINE, D(34), PITCH), spread(SPINE, D(54), YAW),
        spread(HEAD, D(-21), PITCH),
        spread(FRONT_L, D(86), PITCH, 0.8), spread(FRONT_R, D(71), PITCH, 0.8),
        spread(BACK_L, D(80), PITCH, 0.8), spread(BACK_R, D(92), PITCH, 0.8),
        spread(TAIL, D(82), YAW, 0.85),
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

print("EA_FORD_FANG_PROCESS=" + json.dumps({
    "source": str(source_path),
    "output": str(output_path),
    "removedHelperMeshes": removed_helpers,
    "sourceTriangles": source_triangles,
    "runtimeTriangles": runtime_triangles,
    "removedUvFaces": removed_uv_faces,
    "removedTangentFaces": removed_tangent_faces,
    "bones": len(armature.data.bones),
    "scaleFactor": round(scale_factor, 4),
    "runtimeSize": [round(value, 3) for value in runtime_size],
    "lengthToHeight": round(max(runtime_size) / min(runtime_size), 2),
    "axes": {"forward": forward_axis, "side": side_axis, "up": up_axis},
    "boneAxes": {"pitch": PITCH, "yaw": YAW, "pitchSign": PITCH_SIGN},
    "actions": sorted(action.name for action in bpy.data.actions),
}, ensure_ascii=False))
