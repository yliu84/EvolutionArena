"""Turn the Meshy auto-rigged Bladeshell export into the valley boss runtime GLB.

This is the project's first authored boss model. The two existing bosses are not
models at all: the Thorn Sentinel is about thirty Three.js primitives and the
nest guardian is the Carapace prey scaled by 1.28.

It is also the first creature that could not use Meshy's official rigs. Only a
dog and a human are offered, and neither fits a body three times wider than it
is long with flat blades where a quadruped has forelegs. The auto-rig fits but
names every bone `Bone_NNN`, so roles are recovered geometrically by
`meshy_autorig_roles`. That step is not a workaround for this creature alone -
the Wing and Rift families will never map onto a quadruped template either.

Two consequences of the auto-rig, both handled here:

1. There is no imported Walk clip to keep and amplify, unlike the Shell and Swarm
   runs. Every clip is authored. For a boss that is acceptable: it barely walks,
   and its two patterns are the point.
2. Bone local axes are arbitrary per bone, so amplitudes are tuned by rendering
   rather than by reasoning about which axis is pitch.

Attack amplitude is deliberately large, on playtest instruction. The lesson from
the Swarm form's first rake applies and is stronger here: a limb swinging alone
on a still body reads as nothing. The wind-ups rock the whole shell, the sweeps
counter-rotate the spine, and the charge drops the body before it drives.

Usage:
  blender --background --python scripts/blender/process_bladeshell_meshy.py \
      -- source.glb public/assets/quality-3d/models/bladeshell-runtime-v1.glb
"""

import json
import math
import os
import sys
from pathlib import Path

import bpy
from mathutils import Euler

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from meshy_autorig_roles import assert_axes, classify_meshy_autorig

if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python process_bladeshell_meshy.py -- source.glb output.glb")

arguments = sys.argv[sys.argv.index("--") + 1:]
source_path = Path(arguments[0]).expanduser().resolve()
output_path = Path(arguments[1]).expanduser().resolve()
output_path.parent.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))
armature = next(item for item in bpy.context.scene.objects if item.type == "ARMATURE")
mesh = max((item for item in bpy.context.scene.objects if item.type == "MESH"), key=lambda item: len(item.data.vertices))

# Same viewport helper Meshy has shipped in every export so far. Left in, it is
# the floating debris the Shell run was first rejected for.
for pose_bone in armature.pose.bones:
    pose_bone.custom_shape = None
for item in list(bpy.context.scene.objects):
    if item.type == "MESH" and item != mesh:
        bpy.data.objects.remove(item, do_unlink=True)

assert_axes(armature, mesh)
roles = classify_meshy_autorig(armature)

mesh.name = "BladeshellMesh"
mesh.data.name = "BladeshellMeshData"
armature.name = "BladeshellRig"

for material in mesh.data.materials:
    material.name = "BladeshellMaterial"
    if material.use_nodes and material.node_tree:
        principled = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
        if principled:
            principled.inputs["Metallic"].default_value = 0.0
            principled.inputs["Roughness"].default_value = 0.74

# Role shorthands. Indices run outward from the body, so [0] is the shoulder or
# hip and [-1] is the blade tip or toe.
ARM_R, ARM_L = roles['armRight'], roles['armLeft']
LEG_R, LEG_L = roles['legRight'], roles['legLeft']
HEAD, TAIL, SPINE, ROOT = roles['head'], roles['tail'], roles['spine'], roles['root']
SHELL = [ROOT] + SPINE


def reset_pose():
    for bone in armature.pose.bones:
        bone.rotation_mode = "QUATERNION"
        bone.rotation_quaternion = (1, 0, 0, 0)
        bone.location = (0, 0, 0)
        bone.scale = (1, 1, 1)


def key_pose(frame, rotations=None, locations=None):
    reset_pose()
    for name, rotation in (rotations or {}).items():
        armature.pose.bones[name].rotation_quaternion = Euler(rotation, "XYZ").to_quaternion()
    for name, location in (locations or {}).items():
        armature.pose.bones[name].location = location
    for bone in armature.pose.bones:
        bone.keyframe_insert(data_path="rotation_quaternion", frame=frame, group=bone.name)
        bone.keyframe_insert(data_path="location", frame=frame, group=bone.name)


def add_track(action, frame_end):
    track = armature.animation_data.nla_tracks.new()
    track.name = action.name
    strip = track.strips.new(action.name, 0, action)
    strip.action_frame_start = 0
    strip.action_frame_end = frame_end


def make_action(name, frame_end, poses):
    action = bpy.data.actions.new(name=name)
    armature.animation_data.action = action
    for frame, rotations, locations in poses:
        key_pose(frame, rotations, locations)
    add_track(action, frame_end)
    armature.animation_data.action = None
    return action


def spread(bones, angle, axis=1, falloff=1.0):
    """Distribute a rotation along a chain so the whole limb bends, not one joint."""
    out = {}
    for index, name in enumerate(bones):
        scale = falloff ** index
        value = [0.0, 0.0, 0.0]
        value[axis] = angle * scale
        out[name] = tuple(value)
    return out


armature.animation_data_create()
while armature.animation_data.nla_tracks:
    armature.animation_data.nla_tracks.remove(armature.animation_data.nla_tracks[0])

D = math.radians

# Idle: an armoured animal settles. Only the shell breathes and the blades hang.
make_action("Idle", 72, [
    (0, {}, {}),
    (24, {**spread(SHELL, D(2.2)), **spread(ARM_R[:3], D(-3.5)), **spread(ARM_L[:3], D(-3.5))}, {}),
    (50, {**spread(SHELL, D(-1.8)), **spread(ARM_R[:3], D(2.6)), **spread(ARM_L[:3], D(2.6))}, {}),
    (72, {}, {}),
])

# Walk: heavy and slow, weight rolling side to side.
make_action("Walk", 40, [
    (0, {}, {}),
    (10, {**spread(SHELL, D(4.5), axis=0), **spread(LEG_R[:3], D(16)), **spread(LEG_L[:3], D(-14))}, {}),
    (20, {}, {}),
    (30, {**spread(SHELL, D(-4.5), axis=0), **spread(LEG_R[:3], D(-14)), **spread(LEG_L[:3], D(16))}, {}),
    (40, {}, {}),
])

make_action("Turn", 30, [
    (0, {}, {}),
    (12, {**spread(SHELL, D(9), axis=2), **spread(ARM_R[:3], D(-11), axis=2), **spread(ARM_L[:3], D(7), axis=2)}, {}),
    (22, {**spread(SHELL, D(-5), axis=2)}, {}),
    (30, {}, {}),
])

# BladeSweep: the ring pattern. The telegraph is 0.95s of the shell rearing and
# both blades drawing back, then one hard rotation that carries the whole body.
# This is the amplitude the playtest asked for - the arms alone would vanish.
make_action("BladeSweep", 58, [
    (0, {}, {}),
    (22, {
        **spread(SHELL, D(-13), axis=0),
        **spread(ARM_R, D(-46), falloff=0.82),
        **spread(ARM_L, D(-46), falloff=0.82),
        **spread(HEAD, D(-14)),
        **spread(TAIL, D(10)),
    }, {}),
    (30, {
        **spread(SHELL, D(16), axis=0),
        **spread(ARM_R, D(52), falloff=0.86),
        **spread(ARM_L, D(52), falloff=0.86),
        **spread(HEAD, D(12)),
    }, {}),
    (38, {
        **spread(SHELL, D(6), axis=2),
        **spread(ARM_R, D(38), axis=2, falloff=0.9),
        **spread(ARM_L, D(38), axis=2, falloff=0.9),
        **spread(TAIL, D(-12), axis=2),
    }, {}),
    (48, {**spread(SHELL, D(3), axis=0), **spread(ARM_R[:3], D(9)), **spread(ARM_L[:3], D(9))}, {}),
    (58, {}, {}),
])

# RiverCharge: the line pattern. Long crouch, then the whole body drives forward
# with the blades folded in front like a plough.
make_action("RiverCharge", 62, [
    (0, {}, {}),
    (24, {
        **spread(SHELL, D(-17), axis=0),
        **spread(LEG_R[:3], D(24)), **spread(LEG_L[:3], D(24)),
        **spread(ARM_R, D(-34), falloff=0.8), **spread(ARM_L, D(-34), falloff=0.8),
        **spread(HEAD, D(-18)),
    }, {}),
    (32, {
        **spread(SHELL, D(21), axis=0),
        **spread(LEG_R[:3], D(-20)), **spread(LEG_L[:3], D(-20)),
        **spread(ARM_R, D(30), falloff=0.86), **spread(ARM_L, D(30), falloff=0.86),
        **spread(HEAD, D(16)), **spread(TAIL, D(-14)),
    }, {}),
    (44, {
        **spread(SHELL, D(9), axis=0),
        **spread(ARM_R[:3], D(14)), **spread(ARM_L[:3], D(14)),
        **spread(HEAD, D(7)),
    }, {}),
    (62, {}, {}),
])

make_action("Hit", 22, [
    (0, {}, {}),
    (5, {**spread(SHELL, D(11), axis=0), **spread(HEAD, D(15)), **spread(ARM_R[:3], D(13)), **spread(ARM_L[:3], D(9))}, {}),
    (12, {**spread(SHELL, D(-4), axis=0), **spread(HEAD, D(-5))}, {}),
    (22, {}, {}),
])

make_action("Death", 54, [
    (0, {}, {}),
    (12, {**spread(SHELL, D(-9), axis=0), **spread(HEAD, D(13))}, {}),
    (30, {
        **spread(SHELL, D(14), axis=0), **spread(SHELL, D(19), axis=2),
        **spread(ARM_R, D(26), falloff=0.8), **spread(ARM_L, D(22), falloff=0.8),
        **spread(LEG_R[:3], D(28)), **spread(LEG_L[:3], D(26)),
        **spread(HEAD, D(-16)), **spread(TAIL, D(15)),
    }, {}),
    (42, {
        **spread(SHELL, D(16), axis=0), **spread(SHELL, D(22), axis=2),
        **spread(ARM_R, D(29), falloff=0.8), **spread(ARM_L, D(25), falloff=0.8),
        **spread(LEG_R[:3], D(31)), **spread(LEG_L[:3], D(29)),
        **spread(HEAD, D(-19)), **spread(TAIL, D(17)),
    }, {}),
    (54, {
        **spread(SHELL, D(16), axis=0), **spread(SHELL, D(22), axis=2),
        **spread(ARM_R, D(29), falloff=0.8), **spread(ARM_L, D(25), falloff=0.8),
        **spread(LEG_R[:3], D(31)), **spread(LEG_L[:3], D(29)),
        **spread(HEAD, D(-19)), **spread(TAIL, D(17)),
    }, {}),
])

armature.animation_data.action = None
reset_pose()

for image in bpy.data.images:
    if image.type == "IMAGE" and max(image.size) > 1024:
        image.scale(1024, 1024)
        image.pack()

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

print("EA_BLADESHELL_PROCESS=" + json.dumps({
    "source": str(source_path),
    "output": str(output_path),
    "mesh": mesh.name,
    "triangles": sum(len(polygon.loop_indices) - 2 for polygon in mesh.data.polygons),
    "bones": len(armature.data.bones),
    "roles": {key: (value if isinstance(value, str) else len(value)) for key, value in roles.items()},
    "actions": sorted(action.name for action in bpy.data.actions),
}, ensure_ascii=False))
