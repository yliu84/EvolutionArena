"""Turn the Meshy auto-rigged Spotted Fordbug export into the valley prey runtime GLB.

The cleanest source this project has received. It arrives at 20,899 triangles
rather than the 230,000 the last two did, has no baked take to strip, and its
silhouette passes the contract's gates without argument.

What it does not have is bone names. This is a UniRig auto-rig - `Bone_000`
through `Bone_044` - so roles have to be recovered from the rest pose, the same
problem the Bladeshell had. The classifier written for that body was tried here
first and returned all forty-four bones as one right arm: it assumes a wide
bladed body and this is a dome with four legs, two elytra and a pair of
antennae. Rather than bend a working classifier around a second shape it was
never designed for and risk the accepted Bladeshell, the roles are derived here
from geometry and then asserted.

The derivation is by position only, never by index. Bone numbering in a UniRig
export follows the order the solver happened to visit joints, so `Bone_011` is
a back leg on this creature and would be something else on the next one.

Usage:
  blender --background --python scripts/blender/process_spotted_fordbug_meshy.py \
      -- source.glb public/assets/quality-3d/models/spotted-fordbug-runtime-v1.glb
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
    raise SystemExit("Usage: blender --background --python process_spotted_fordbug_meshy.py -- source.glb output.glb")

arguments = sys.argv[sys.argv.index("--") + 1:]
source_path = Path(arguments[0]).expanduser().resolve()
output_path = Path(arguments[1]).expanduser().resolve()
output_path.parent.mkdir(parents=True, exist_ok=True)

# Same prey budget as the Ford Fang: packs of three or four on screen against a
# boss's one, over scenery that already draws 2.5M triangles.
TARGET_RUNTIME_TRIANGLES = 14_000

# Sized to the Carapace family's collision radius, because that is physically
# what this animal is - a slow dome. Sizing is not typing: this does NOT give it
# the family's frontal damage reduction, which the contract reserves as a
# separate decision. What it does guarantee is that blocking matches the visible
# footprint, which is the Goal 2 lesson.
DOME_BODY_RADIUS = 1.42

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

bones = armature.data.bones
root = next(bone for bone in bones if bone.parent is None)


def descend(bone):
    yield bone
    for child in bone.children:
        yield from descend(child)


def chain_from(bone):
    """A bone and its single-file descendants, outward from the body."""
    out = [bone.name]
    current = bone
    while len(current.children) == 1:
        current = current.children[0]
        out.append(current.name)
    return out


# --- Axes, from the rest pose ---------------------------------------------
# Up is the axis the feet are furthest along from the root; forward is the axis
# the longest run of the skeleton lies along, once up is excluded.
all_bones = list(descend(root))
extent = [
    max(bone.head_local[axis] for bone in all_bones) - min(bone.head_local[axis] for bone in all_bones)
    for axis in range(3)
]
UP = min(range(3), key=lambda axis: extent[axis])


def mirror_score(axis):
    """How much the skeleton pairs up when reflected through this axis.

    The side axis is not simply the widest one - this animal is longer than it
    is broad, and picking by extent chose front-to-back and then failed to find
    a spine at all. What actually distinguishes left-from-right is that limbs
    come in mirrored pairs across it, and nothing pairs across the forward axis.
    """
    tolerance = max(extent) * 0.06
    paired = 0
    for bone in all_bones:
        head = bone.head_local
        if abs(head[axis]) < tolerance:
            continue
        for other in all_bones:
            if other is bone:
                continue
            head2 = other.head_local
            if abs(head2[axis] + head[axis]) > tolerance:
                continue
            if all(abs(head2[other_axis] - head[other_axis]) <= tolerance
                   for other_axis in range(3) if other_axis != axis):
                paired += 1
                break
    return paired


SIDE = max((axis for axis in range(3) if axis != UP), key=mirror_score)
FORWARD = next(axis for axis in range(3) if axis not in (UP, SIDE))
if mirror_score(SIDE) < 4:
    raise SystemExit("Could not find a mirror plane; the rig is not bilaterally symmetric")

# The spine is the longest walk from the root that stays near the mid-line.
def spine_walk(bone):
    best = [bone.name]
    for child in bone.children:
        # Near the mid-line, in units of the creature's own size.
        if abs(child.head_local[SIDE]) > extent[SIDE] * 0.12:
            continue
        candidate = [bone.name] + spine_walk(child)
        if len(candidate) > len(best):
            best = candidate
    return best


SPINE = spine_walk(root)
if len(SPINE) < 5:
    raise SystemExit(f"Could not find a spine; got {SPINE}")

# Head is whichever end of the spine reaches furthest along forward. Its sign is
# then the definition of forward for every other test.
spine_start = bones[SPINE[0]].head_local[FORWARD]
spine_end = bones[SPINE[-1]].head_local[FORWARD]
FORWARD_SIGN = 1 if spine_end > spine_start else -1
HEAD = SPINE[-3:]
TORSO = SPINE[:-3]

# Legs: chains whose tips are lowest. Split by side, then by whether they hang
# off the front or the back half of the spine.
limbs = []
for bone in all_bones:
    if bone.name in SPINE:
        continue
    if bone.parent is None or bone.parent.name not in SPINE:
        continue
    limb = chain_from(bone)
    tip = bones[limb[-1]].head_local
    limbs.append({"chain": limb, "tip": tip, "root": bone.head_local, "drop": tip[UP]})

ground = min(limb["drop"] for limb in limbs)
# Low, and off the mid-line. Without the second test a short centre stub under
# the belly comes back as a fifth leg - it is as close to the ground as the
# real ones and only its position across the body tells them apart.
legs = [
    limb for limb in limbs
    if limb["drop"] < ground + (extent[UP] * 0.35)
    and abs(limb["root"][SIDE]) > extent[SIDE] * 0.12
]
if len(legs) != 4:
    raise SystemExit(f"Expected four legs, found {len(legs)}: {[leg['chain'][0] for leg in legs]}")

front_legs = sorted(legs, key=lambda leg: -leg["root"][FORWARD] * FORWARD_SIGN)[:2]
back_legs = [leg for leg in legs if leg not in front_legs]
FRONT_R, FRONT_L = [leg["chain"] for leg in sorted(front_legs, key=lambda leg: leg["root"][SIDE])]
BACK_R, BACK_L = [leg["chain"] for leg in sorted(back_legs, key=lambda leg: leg["root"][SIDE])]

# Elytra: the remaining pair that sits highest and is by far the longest. These
# are the shell halves and they must not be animated like limbs.
rest = [limb for limb in limbs if limb not in legs]
elytra = sorted(rest, key=lambda limb: -sum(bones[name].length for name in limb["chain"]))[:2]
ELYTRON_R, ELYTRON_L = [limb["chain"] for limb in sorted(elytra, key=lambda limb: limb["root"][SIDE])]

# Antennae: short symmetric pair hanging off the head.
antennae = []
for bone in all_bones:
    if bone.parent is None or bone.parent.name not in HEAD or bone.name in SPINE:
        continue
    if abs(bone.head_local[SIDE]) < 0.1:
        continue
    antennae.append(chain_from(bone))
if len(antennae) != 2:
    raise SystemExit(f"Expected two antennae, found {len(antennae)}")
ANTENNA_R, ANTENNA_L = sorted(antennae, key=lambda limb: bones[limb[0]].head_local[SIDE])

for pair, label in ((( FRONT_R, FRONT_L), "front legs"), ((BACK_R, BACK_L), "back legs"),
                    ((ELYTRON_R, ELYTRON_L), "elytra"), ((ANTENNA_R, ANTENNA_L), "antennae")):
    right, left = pair
    if bones[right[0]].head_local[SIDE] * bones[left[0]].head_local[SIDE] >= 0:
        raise SystemExit(f"{label} are on the same side of the body")
if bones[FRONT_R[0]].head_local[FORWARD] * FORWARD_SIGN <= bones[BACK_R[0]].head_local[FORWARD] * FORWARD_SIGN:
    raise SystemExit("Front legs are not forward of the back legs")

mesh.name = "SpottedFordbugMesh"
mesh.data.name = "SpottedFordbugMeshData"
armature.name = "SpottedFordbugRig"
for material in mesh.data.materials:
    material.name = "SpottedFordbugMaterial"
    if material.use_nodes and material.node_tree:
        principled = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
        if principled:
            principled.inputs["Metallic"].default_value = 0.0
            # A beetle's elytra are the one glossy surface in the valley kit.
            principled.inputs["Roughness"].default_value = 0.38

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
footprint = max(source_size[axis] for axis in range(3) if axis != UP) if False else max(source_size)
scale_factor = (DOME_BODY_RADIUS * 2) / footprint
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
bpy.ops.object.modifier_move_to_index(modifier=decimate.name, index=0)
bpy.ops.object.modifier_apply(modifier=decimate.name)
for polygon in mesh.data.polygons:
    polygon.use_smooth = True
removed_uv_faces = remove_degenerate_uv_faces(mesh.data)
removed_tangent_faces = remove_invalid_tangent_faces(mesh.data)
runtime_triangles = sum(len(polygon.loop_indices) - 2 for polygon in mesh.data.polygons)

# Three maps here, one of them 4096. A single 4k normal map is 7MB of a 16.8MB
# file, on prey that is a hand's width on screen.
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
PITCH, YAW, PITCH_SIGN = probe_rotation_axes(SPINE, SPINE[-1], UP, SIDE)

# Idle: a grazer. The antennae carry almost all of the motion, because a dome
# that rocks reads as a wobble rather than as breathing.
make_action("Idle", 108, [
    (0, {}),
    (36, merge(spread(TORSO, D(1.4), PITCH), spread(ANTENNA_R, D(7), PITCH, 0.7), spread(ANTENNA_L, D(-5), PITCH, 0.7))),
    (72, merge(spread(TORSO, D(-1.1), PITCH), spread(ANTENNA_R, D(-6), PITCH, 0.7), spread(ANTENNA_L, D(8), PITCH, 0.7))),
    (108, {}),
])

# Walk: slow and trundling, diagonal pairs, the dome held level. The elytra are
# never keyed - a shell that flexes as the animal walks stops reading as shell.
make_action("Walk", 64, [
    (0, {}),
    (16, merge(
        spread(TORSO, D(2.4), YAW),
        spread(FRONT_R, D(17), PITCH, 0.7), spread(BACK_L, D(15), PITCH, 0.7),
        spread(FRONT_L, D(-11), PITCH, 0.7), spread(BACK_R, D(-9), PITCH, 0.7),
    )),
    (32, {}),
    (48, merge(
        spread(TORSO, D(-2.4), YAW),
        spread(FRONT_L, D(17), PITCH, 0.7), spread(BACK_R, D(15), PITCH, 0.7),
        spread(FRONT_R, D(-11), PITCH, 0.7), spread(BACK_L, D(-9), PITCH, 0.7),
    )),
    (64, {}),
])

# Bump: the contract's body-check. This anatomy cannot sell a bite or a claw
# swipe, so the whole animal rears back on its hind legs and drops its mass
# forward. Large, because a small shove on a round body reads as nothing.
make_action("Bump", 38, [
    (0, {}),
    (13, merge(
        spread(TORSO, D(-16), PITCH), spread(HEAD, D(-12), PITCH),
        spread(FRONT_R, D(-24), PITCH, 0.75), spread(FRONT_L, D(-24), PITCH, 0.75),
        spread(ANTENNA_R, D(-18), PITCH, 0.8), spread(ANTENNA_L, D(-18), PITCH, 0.8),
    )),
    (19, merge(
        spread(TORSO, D(21), PITCH), spread(HEAD, D(15), PITCH),
        spread(FRONT_R, D(29), PITCH, 0.75), spread(FRONT_L, D(29), PITCH, 0.75),
        spread(ANTENNA_R, D(22), PITCH, 0.8), spread(ANTENNA_L, D(22), PITCH, 0.8),
    )),
    (27, merge(spread(TORSO, D(5), PITCH), spread(HEAD, D(4), PITCH))),
    (38, {}),
])

make_action("Hit", 20, [
    (0, {}),
    (4, merge(
        spread(TORSO, D(10), PITCH), spread(TORSO, D(9), YAW),
        spread(ANTENNA_R, D(26), PITCH, 0.8), spread(ANTENNA_L, D(21), PITCH, 0.8),
    )),
    (11, merge(spread(TORSO, D(-4), PITCH), spread(ANTENNA_R, D(-9), PITCH), spread(ANTENNA_L, D(-7), PITCH))),
    (20, {}),
])

# Death: a beetle ends up on its back. The legs fold in rather than splaying,
# which is what separates a dead insect from a sleeping one.
make_action("Death", 60, [
    (0, {}),
    (12, merge(spread(TORSO, D(-9), PITCH), spread(ANTENNA_R, D(19), PITCH), spread(ANTENNA_L, D(15), PITCH))),
    (34, merge(
        spread(TORSO, D(14), PITCH), spread(TORSO, D(34), YAW),
        spread(FRONT_R, D(-31), PITCH, 0.8), spread(FRONT_L, D(-29), PITCH, 0.8),
        spread(BACK_R, D(-27), PITCH, 0.8), spread(BACK_L, D(-30), PITCH, 0.8),
        spread(ANTENNA_R, D(-24), PITCH), spread(ANTENNA_L, D(-21), PITCH),
    )),
    (48, merge(
        spread(TORSO, D(16), PITCH), spread(TORSO, D(38), YAW),
        spread(FRONT_R, D(-35), PITCH, 0.8), spread(FRONT_L, D(-33), PITCH, 0.8),
        spread(BACK_R, D(-31), PITCH, 0.8), spread(BACK_L, D(-34), PITCH, 0.8),
        spread(ANTENNA_R, D(-27), PITCH), spread(ANTENNA_L, D(-24), PITCH),
    )),
    (60, merge(
        spread(TORSO, D(16), PITCH), spread(TORSO, D(38), YAW),
        spread(FRONT_R, D(-35), PITCH, 0.8), spread(FRONT_L, D(-33), PITCH, 0.8),
        spread(BACK_R, D(-31), PITCH, 0.8), spread(BACK_L, D(-34), PITCH, 0.8),
        spread(ANTENNA_R, D(-27), PITCH), spread(ANTENNA_L, D(-24), PITCH),
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

print("EA_FORDBUG_PROCESS=" + json.dumps({
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
    "axes": {"forward": FORWARD, "side": SIDE, "up": UP, "forwardSign": FORWARD_SIGN},
    "boneAxes": {"pitch": PITCH, "yaw": YAW, "pitchSign": PITCH_SIGN},
    "roles": {
        "spine": SPINE, "head": HEAD,
        "frontRight": FRONT_R, "frontLeft": FRONT_L,
        "backRight": BACK_R, "backLeft": BACK_L,
        "elytronRight": ELYTRON_R, "elytronLeft": ELYTRON_L,
        "antennaRight": ANTENNA_R, "antennaLeft": ANTENNA_L,
    },
    "actions": sorted(action.name for action in bpy.data.actions),
}, ensure_ascii=False))
