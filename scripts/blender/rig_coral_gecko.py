import json
import math
import sys
from pathlib import Path

import bpy


if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python rig_coral_gecko.py -- source.glb output.glb")

arguments = sys.argv[sys.argv.index("--") + 1 :]
source_path = Path(arguments[0]).expanduser().resolve()
output_path = Path(arguments[1]).expanduser().resolve()
output_path.parent.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))
mesh = next(item for item in bpy.context.scene.objects if item.type == "MESH")
mesh.name = "CoralGeckoMesh"

bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
armature = bpy.context.object
armature.name = "CoralGeckoRig"
armature.data.name = "CoralGeckoSkeleton"
armature.show_in_front = True
armature.data.edit_bones.remove(armature.data.edit_bones[0])


def add_bone(name, head, tail, parent=None, deform=True):
    bone = armature.data.edit_bones.new(name)
    bone.head = head
    bone.tail = tail
    bone.use_deform = deform
    if parent:
        bone.parent = armature.data.edit_bones[parent]
    return bone


add_bone("Root", (0, 0, 0.02), (0, 0, 0.22), deform=False)
add_bone("Body", (0, 0.26, 0.40), (0, -0.24, 0.50), "Root")
add_bone("Neck", (0, -0.20, 0.50), (0, -0.48, 0.57), "Body")
add_bone("Head", (0, -0.43, 0.56), (0, -0.83, 0.59), "Neck")
add_bone("Jaw", (0, -0.49, 0.535), (0, -0.80, 0.515), "Head")

tail_points = [
    (0, 0.22, 0.40),
    (0, 0.45, 0.34),
    (0, 0.65, 0.28),
    (0, 0.82, 0.22),
    (0, 0.98, 0.16),
]
for index in range(4):
    add_bone(
        f"Tail_{index}",
        tail_points[index],
        tail_points[index + 1],
        "Body" if index == 0 else f"Tail_{index - 1}",
    )

leg_specs = {
    "FL": (0.23, -0.28),
    "FR": (-0.23, -0.28),
    "BL": (0.24, 0.24),
    "BR": (-0.24, 0.24),
}
for suffix, (x, y) in leg_specs.items():
    outward = 0.08 if x > 0 else -0.08
    add_bone(f"Leg{suffix}", (x, y, 0.43), (x + outward, y, 0.24), "Body")
    add_bone(f"Shin{suffix}", (x + outward, y, 0.24), (x + outward * 1.18, y - 0.015, 0.075), f"Leg{suffix}")
    add_bone(
        f"Foot{suffix}",
        (x + outward * 1.18, y - 0.015, 0.075),
        (x + outward * 1.18, y - 0.13, 0.045),
        f"Shin{suffix}",
    )

bpy.ops.object.mode_set(mode="OBJECT")
modifier = mesh.modifiers.new(name="CoralGeckoArmature", type="ARMATURE")
modifier.object = armature
modifier.use_deform_preserve_volume = True

deform_bones = [bone.name for bone in armature.data.bones if bone.use_deform]
groups = {name: mesh.vertex_groups.new(name=name) for name in deform_bones}


def normalized(weights):
    total = sum(max(0.0, value) for value in weights.values())
    if total <= 0:
        return {"Body": 1.0}
    return {name: max(0.0, value) / total for name, value in weights.items() if value > 0}


for vertex in mesh.data.vertices:
    x, y, z = vertex.co
    weights = {}

    # The head and crest occupy the negative-Y end of the sculpt.
    if y < -0.49 and z < 0.535:
        jaw_blend = min(1.0, max(0.0, (-y - 0.45) / 0.26))
        weights = {"Jaw": 0.72 + jaw_blend * 0.20, "Head": 0.28 - jaw_blend * 0.16}
    elif y < -0.46:
        head_blend = min(1.0, max(0.0, (-y - 0.38) / 0.20))
        weights = {"Head": 0.72 + head_blend * 0.24, "Neck": 0.28 - head_blend * 0.20}
    elif y < -0.22 and z > 0.30:
        neck_blend = min(1.0, max(0.0, (-y - 0.22) / 0.24))
        weights = {"Neck": 0.55 + neck_blend * 0.35, "Body": 0.45 - neck_blend * 0.30}
    # Low, outward vertices in the torso band are assigned to one of four legs.
    elif z < 0.43 and abs(x) > 0.13 and -0.48 <= y <= 0.50:
        row = "F" if y < 0 else "B"
        side = "L" if x > 0 else "R"
        suffix = row + side
        if z < 0.115:
            weights = {f"Foot{suffix}": 0.82, f"Shin{suffix}": 0.16, "Body": 0.02}
        elif z < 0.275:
            shin_blend = min(1.0, max(0.0, (0.275 - z) / 0.16))
            weights = {f"Shin{suffix}": 0.62 + shin_blend * 0.20, f"Leg{suffix}": 0.28, "Body": 0.10}
        else:
            weights = {f"Leg{suffix}": 0.76, "Body": 0.24}
    elif y > 0.23:
        tail_t = min(0.999, max(0.0, (y - 0.23) / 0.78))
        scaled = tail_t * 4
        segment = min(3, int(scaled))
        blend = scaled - segment
        weights = {f"Tail_{segment}": 1.0 - blend}
        if segment < 3:
            weights[f"Tail_{segment + 1}"] = blend
        elif blend > 0:
            weights["Tail_3"] = 1.0
        if y < 0.38:
            weights["Body"] = (0.38 - y) / 0.15 * 0.35
    else:
        weights = {"Body": 0.88, "Neck": 0.12 if y < -0.12 else 0.0}

    for name, value in normalized(weights).items():
        groups[name].add([vertex.index], value, "REPLACE")


def set_rotation(pose_bone, xyz):
    pose_bone.rotation_mode = "XYZ"
    pose_bone.rotation_euler = xyz


def key_pose(frame, rotations=None, locations=None):
    rotations = rotations or {}
    locations = locations or {}
    for name, rotation in rotations.items():
        bone = armature.pose.bones[name]
        set_rotation(bone, rotation)
        bone.keyframe_insert(data_path="rotation_euler", frame=frame, group=name)
    for name, location in locations.items():
        bone = armature.pose.bones[name]
        bone.location = location
        bone.keyframe_insert(data_path="location", frame=frame, group=name)


def reset_pose():
    for bone in armature.pose.bones:
        bone.rotation_mode = "XYZ"
        bone.rotation_euler = (0, 0, 0)
        bone.location = (0, 0, 0)
        bone.scale = (1, 1, 1)


def make_action(name, frame_end, poses):
    reset_pose()
    action = bpy.data.actions.new(name=name)
    armature.animation_data_create()
    armature.animation_data.action = action
    for frame, rotations, locations in poses:
        key_pose(frame, rotations, locations)
    action.frame_range = (0, frame_end)
    track = armature.animation_data.nla_tracks.new()
    track.name = name
    strip = track.strips.new(name, 0, action)
    strip.action_frame_start = 0
    strip.action_frame_end = frame_end
    return action


idle_poses = []
for frame, wave in [(0, 0.0), (30, 1.0), (60, 0.0)]:
    idle_poses.append(
        (
            frame,
            {
                "Body": (0, math.radians(1.2 * wave), 0),
                "Neck": (0, math.radians(-1.8 * wave), math.radians(1.2 * wave)),
                "Head": (math.radians(1.6 * wave), 0, math.radians(-1.5 * wave)),
                "Tail_0": (0, 0, math.radians(4.0 * wave)),
                "Tail_1": (0, 0, math.radians(5.5 * wave)),
                "Tail_2": (0, 0, math.radians(6.5 * wave)),
                "Tail_3": (0, 0, math.radians(7.5 * wave)),
            },
            {"Body": (0, 0, 0.009 * wave)},
        )
    )
make_action("Idle", 60, idle_poses)

run_poses = []
for frame, phase in [(0, 0.0), (6, math.pi / 2), (12, math.pi), (18, math.pi * 1.5), (24, math.pi * 2)]:
    rotations = {
        "Body": (0, math.radians(math.sin(phase) * 2.0), math.radians(math.sin(phase * 2) * 1.2)),
        "Neck": (math.radians(math.sin(phase * 2) * 1.5), 0, math.radians(-math.sin(phase) * 2.2)),
        "Head": (math.radians(-math.sin(phase * 2) * 2.0), 0, math.radians(math.sin(phase) * 2.5)),
    }
    diagonal_phase = {"FL": 0, "BR": 0, "FR": math.pi, "BL": math.pi}
    for suffix, offset in diagonal_phase.items():
        swing = math.sin(phase + offset)
        lift = max(0.0, math.sin(phase + offset))
        rotations[f"Leg{suffix}"] = (math.radians(swing * 31), 0, math.radians((1 if "L" in suffix else -1) * 3.2))
        rotations[f"Shin{suffix}"] = (math.radians(-9 - lift * 32 + max(0.0, -swing) * 10), 0, 0)
        rotations[f"Foot{suffix}"] = (math.radians(8 + lift * 27), 0, 0)
    for index in range(4):
        rotations[f"Tail_{index}"] = (0, 0, math.radians(math.sin(phase - index * 0.55) * (7 + index * 2)))
    run_poses.append((frame, rotations, {"Body": (0, 0, 0.032 * abs(math.sin(phase * 2))) }))
make_action("Run", 24, run_poses)

turn_poses = []
for frame, amount in [(0, 0.0), (8, 1.0), (16, -0.55), (24, 0.0)]:
    rotations = {
        "Body": (0, 0, math.radians(amount * 7)),
        "Neck": (0, 0, math.radians(amount * 8)),
        "Head": (0, 0, math.radians(amount * 11)),
        "Tail_0": (0, 0, math.radians(-amount * 8)),
        "Tail_1": (0, 0, math.radians(-amount * 11)),
        "Tail_2": (0, 0, math.radians(-amount * 14)),
        "Tail_3": (0, 0, math.radians(-amount * 17)),
    }
    for suffix in leg_specs:
        brace = 7 if suffix in ("FL", "BR") else -7
        rotations[f"Leg{suffix}"] = (math.radians(brace * amount), 0, 0)
        rotations[f"Shin{suffix}"] = (math.radians(-10 - abs(amount) * 7), 0, 0)
        rotations[f"Foot{suffix}"] = (math.radians(8), 0, 0)
    turn_poses.append((frame, rotations, {"Body": (0, 0, 0.008 * abs(amount))}))
make_action("Turn", 24, turn_poses)

bite_poses = [
    (0, {"Body": (0, 0, 0), "Neck": (0, 0, 0), "Head": (0, 0, 0), "Jaw": (0, 0, 0)}, {}),
    (
        5,
        {
            "Body": (math.radians(-5), 0, 0),
            "Neck": (math.radians(14), 0, 0),
            "Head": (math.radians(16), 0, 0),
            "Jaw": (math.radians(42), 0, 0),
            "Tail_0": (0, 0, math.radians(-5)),
            "Tail_1": (0, 0, math.radians(-8)),
            "Tail_2": (0, 0, math.radians(-10)),
            "Tail_3": (0, 0, math.radians(-12)),
        },
        {"Body": (0, 0.055, -0.018)},
    ),
    (
        9,
        {
            "Body": (math.radians(10), 0, 0),
            "Neck": (math.radians(-27), 0, 0),
            "Head": (math.radians(-32), 0, 0),
            "Jaw": (math.radians(-2), 0, 0),
            "Tail_0": (0, 0, math.radians(6)),
            "Tail_1": (0, 0, math.radians(9)),
            "Tail_2": (0, 0, math.radians(11)),
            "Tail_3": (0, 0, math.radians(13)),
        },
        {"Body": (0, -0.17, 0.014)},
    ),
    (18, {"Body": (0, 0, 0), "Neck": (0, 0, 0), "Head": (0, 0, 0), "Jaw": (0, 0, 0)}, {}),
]
make_action("Bite", 18, bite_poses)

claw_poses = [
    (0, {"Body": (0, 0, 0), "Neck": (0, 0, 0), "Head": (0, 0, 0)}, {}),
    (
        5,
        {
            "Body": (math.radians(-7), 0, math.radians(-16)),
            "Neck": (math.radians(8), 0, math.radians(12)),
            "Head": (math.radians(10), 0, math.radians(16)),
            "LegFL": (math.radians(-60), math.radians(-11), math.radians(18)),
            "ShinFL": (math.radians(-50), 0, 0),
            "FootFL": (math.radians(38), 0, math.radians(-15)),
            "Tail_0": (0, 0, math.radians(-7)),
            "Tail_1": (0, 0, math.radians(-11)),
            "Tail_2": (0, 0, math.radians(-14)),
            "Tail_3": (0, 0, math.radians(-17)),
        },
        {"Body": (0.04, 0.04, -0.028)},
    ),
    (
        9,
        {
            "Body": (math.radians(9), 0, math.radians(22)),
            "Neck": (math.radians(-11), 0, math.radians(-16)),
            "Head": (math.radians(-13), 0, math.radians(-21)),
            "LegFL": (math.radians(70), math.radians(10), math.radians(-25)),
            "ShinFL": (math.radians(14), 0, 0),
            "FootFL": (math.radians(-24), 0, math.radians(13)),
            "LegFR": (math.radians(-48), math.radians(9), math.radians(-15)),
            "ShinFR": (math.radians(-42), 0, 0),
            "FootFR": (math.radians(31), 0, math.radians(14)),
        },
        {"Body": (-0.055, -0.09, 0.02)},
    ),
    (
        14,
        {
            "Body": (math.radians(8), 0, math.radians(-23)),
            "Neck": (math.radians(-10), 0, math.radians(16)),
            "Head": (math.radians(-12), 0, math.radians(22)),
            "LegFL": (math.radians(-18), 0, math.radians(8)),
            "LegFR": (math.radians(72), math.radians(-10), math.radians(26)),
            "ShinFR": (math.radians(15), 0, 0),
            "FootFR": (math.radians(-26), 0, math.radians(-14)),
            "Tail_0": (0, 0, math.radians(8)),
            "Tail_1": (0, 0, math.radians(12)),
            "Tail_2": (0, 0, math.radians(16)),
            "Tail_3": (0, 0, math.radians(20)),
        },
        {"Body": (0.065, -0.075, 0.018)},
    ),
    (22, {"Body": (0, 0, 0), "Neck": (0, 0, 0), "Head": (0, 0, 0), "LegFL": (0, 0, 0), "LegFR": (0, 0, 0)}, {}),
]
make_action("Claw", 22, claw_poses)

tail_swipe_poses = [
    (0, {"Body": (0, 0, 0), "Neck": (0, 0, 0), "Head": (0, 0, 0)}, {}),
    (
        6,
        {
            "Body": (math.radians(-8), 0, math.radians(-18)),
            "Neck": (math.radians(8), 0, math.radians(14)),
            "Head": (math.radians(11), 0, math.radians(19)),
            "Tail_0": (0, 0, math.radians(-24)),
            "Tail_1": (0, 0, math.radians(-38)),
            "Tail_2": (0, 0, math.radians(-52)),
            "Tail_3": (0, 0, math.radians(-66)),
        },
        {"Body": (0.04, 0.035, -0.032)},
    ),
    (
        12,
        {
            "Body": (math.radians(8), 0, math.radians(30)),
            "Neck": (math.radians(-8), 0, math.radians(-20)),
            "Head": (math.radians(-11), 0, math.radians(-26)),
            "Tail_0": (0, 0, math.radians(32)),
            "Tail_1": (0, 0, math.radians(50)),
            "Tail_2": (0, 0, math.radians(68)),
            "Tail_3": (0, 0, math.radians(82)),
            "LegFL": (math.radians(-8), 0, math.radians(7)),
            "LegBR": (math.radians(8), 0, math.radians(-7)),
        },
        {"Body": (-0.055, -0.045, 0.014)},
    ),
    (
        18,
        {
            "Body": (math.radians(2), 0, math.radians(-7)),
            "Neck": (0, 0, math.radians(5)),
            "Head": (0, 0, math.radians(7)),
            "Tail_0": (0, 0, math.radians(12)),
            "Tail_1": (0, 0, math.radians(18)),
            "Tail_2": (0, 0, math.radians(23)),
            "Tail_3": (0, 0, math.radians(28)),
        },
        {"Body": (0.01, 0, -0.006)},
    ),
    (26, {"Body": (0, 0, 0), "Neck": (0, 0, 0), "Head": (0, 0, 0), "Tail_0": (0, 0, 0), "Tail_1": (0, 0, 0), "Tail_2": (0, 0, 0), "Tail_3": (0, 0, 0)}, {}),
]
make_action("TailSwipe", 26, tail_swipe_poses)

hit_poses = [
    (0, {"Body": (0, 0, 0), "Neck": (0, 0, 0), "Head": (0, 0, 0)}, {}),
    (
        4,
        {
            "Body": (math.radians(-5), 0, math.radians(12)),
            "Neck": (math.radians(9), 0, math.radians(-10)),
            "Head": (math.radians(12), 0, math.radians(-15)),
            "Tail_0": (0, 0, math.radians(-9)),
            "Tail_1": (0, 0, math.radians(-14)),
            "Tail_2": (0, 0, math.radians(-18)),
            "Tail_3": (0, 0, math.radians(-22)),
        },
        {"Body": (0.035, 0.025, -0.035)},
    ),
    (14, {"Body": (0, 0, 0), "Neck": (0, 0, 0), "Head": (0, 0, 0)}, {}),
]
make_action("Hit", 14, hit_poses)

death_poses = [
    (0, {"Body": (0, 0, 0), "Neck": (0, 0, 0), "Head": (0, 0, 0)}, {}),
    (
        12,
        {
            "Body": (math.radians(-6), 0, math.radians(28)),
            "Neck": (math.radians(12), 0, math.radians(-16)),
            "Head": (math.radians(18), 0, math.radians(-20)),
            "LegFL": (math.radians(18), 0, math.radians(16)),
            "LegFR": (math.radians(-14), 0, math.radians(-14)),
            "LegBL": (math.radians(16), 0, math.radians(13)),
            "LegBR": (math.radians(-12), 0, math.radians(-12)),
        },
        {"Body": (0.05, 0.015, -0.11)},
    ),
    (
        28,
        {
            "Body": (math.radians(-8), 0, math.radians(78)),
            "Neck": (math.radians(18), 0, math.radians(-22)),
            "Head": (math.radians(24), 0, math.radians(-30)),
            "Jaw": (math.radians(8), 0, 0),
            "LegFL": (math.radians(25), 0, math.radians(23)),
            "LegFR": (math.radians(-22), 0, math.radians(-21)),
            "LegBL": (math.radians(21), 0, math.radians(18)),
            "LegBR": (math.radians(-18), 0, math.radians(-17)),
            "Tail_0": (0, 0, math.radians(-15)),
            "Tail_1": (0, 0, math.radians(-20)),
            "Tail_2": (0, 0, math.radians(-24)),
            "Tail_3": (0, 0, math.radians(-28)),
        },
        {"Body": (0.08, 0.02, -0.27)},
    ),
    (
        36,
        {
            "Body": (math.radians(-8), 0, math.radians(82)),
            "Neck": (math.radians(18), 0, math.radians(-24)),
            "Head": (math.radians(24), 0, math.radians(-32)),
            "Jaw": (math.radians(10), 0, 0),
            "Tail_0": (0, 0, math.radians(-16)),
            "Tail_1": (0, 0, math.radians(-21)),
            "Tail_2": (0, 0, math.radians(-25)),
            "Tail_3": (0, 0, math.radians(-29)),
        },
        {"Body": (0.08, 0.02, -0.285)},
    ),
]
make_action("Death", 36, death_poses)

armature.animation_data.action = None
bpy.context.scene.frame_start = 0
bpy.context.scene.frame_end = 60

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

mesh.data.calc_loop_triangles()
print(
    "EA_CORAL_GECKO_RIG="
    + json.dumps(
        {
            "source": str(source_path),
            "output": str(output_path),
            "triangles": len(mesh.data.loop_triangles),
            "bones": [bone.name for bone in armature.data.bones],
            "deform_bones": deform_bones,
            "actions": [action.name for action in bpy.data.actions],
            "dimensions": [round(value, 6) for value in mesh.dimensions],
        },
        separators=(",", ":"),
    )
)
