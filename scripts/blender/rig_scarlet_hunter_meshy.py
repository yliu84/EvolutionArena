import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python rig_scarlet_hunter_meshy.py -- source.glb output.glb")

arguments = sys.argv[sys.argv.index("--") + 1 :]
source_path = Path(arguments[0]).expanduser().resolve()
output_path = Path(arguments[1]).expanduser().resolve()
automatic_weighting = len(arguments) > 2 and arguments[2] == "automatic"
output_path.parent.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))
mesh = next(item for item in bpy.context.scene.objects if item.type == "MESH")
mesh.name = "ScarletHunterMesh"
mesh.data.name = "ScarletHunterWebMesh"

# This rig is authored around the accepted Meshy V2 anatomy. The source faces
# -Y, its curled tail rises through +Y/+Z, and the four feet rest at Z=0.
bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
armature = bpy.context.object
armature.name = "ScarletHunterRig"
armature.data.name = "ScarletHunterSkeleton"
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


add_bone("Root", (0, 0.03, 0.03), (0, 0.03, 0.23), deform=False)
add_bone("Pelvis", (0, 0.30, 0.43), (0, 0.05, 0.48), "Root")
add_bone("Spine", (0, 0.10, 0.47), (0, -0.17, 0.52), "Pelvis")
add_bone("Chest", (0, -0.14, 0.52), (0, -0.39, 0.60), "Spine")
add_bone("Neck", (0, -0.36, 0.60), (0, -0.57, 0.66), "Chest")
add_bone("Head", (0, -0.54, 0.65), (0, -0.88, 0.60), "Neck")
add_bone("Jaw", (0, -0.57, 0.49), (0, -0.88, 0.45), "Head")

tail_points = [
    (0, 0.25, 0.44),
    (0, 0.48, 0.39),
    (0, 0.70, 0.43),
    (0, 0.88, 0.58),
    (0, 0.91, 0.79),
    (0, 0.76, 0.96),
    (0, 0.53, 0.94),
]
for index in range(6):
    add_bone(
        f"Tail_{index}",
        tail_points[index],
        tail_points[index + 1],
        "Pelvis" if index == 0 else f"Tail_{index - 1}",
    )

limb_specs = {
    "FL": {
        "side": 1,
        "scapula": ((0.11, -0.31, 0.60), (0.28, -0.34, 0.54)),
        "upper": ((0.28, -0.34, 0.54), (0.31, -0.36, 0.31)),
        "lower": ((0.31, -0.36, 0.31), (0.32, -0.41, 0.10)),
        "foot": ((0.32, -0.41, 0.10), (0.32, -0.57, 0.045)),
        "parent": "Chest",
    },
    "FR": {
        "side": -1,
        "scapula": ((-0.11, -0.31, 0.60), (-0.28, -0.34, 0.54)),
        "upper": ((-0.28, -0.34, 0.54), (-0.31, -0.36, 0.31)),
        "lower": ((-0.31, -0.36, 0.31), (-0.32, -0.41, 0.10)),
        "foot": ((-0.32, -0.41, 0.10), (-0.32, -0.57, 0.045)),
        "parent": "Chest",
    },
    "HL": {
        "side": 1,
        "scapula": ((0.10, 0.19, 0.53), (0.28, 0.22, 0.49)),
        "upper": ((0.28, 0.22, 0.49), (0.31, 0.25, 0.30)),
        "lower": ((0.31, 0.25, 0.30), (0.31, 0.19, 0.10)),
        "foot": ((0.31, 0.19, 0.10), (0.31, 0.03, 0.045)),
        "parent": "Pelvis",
    },
    "HR": {
        "side": -1,
        "scapula": ((-0.10, 0.19, 0.53), (-0.28, 0.22, 0.49)),
        "upper": ((-0.28, 0.22, 0.49), (-0.31, 0.25, 0.30)),
        "lower": ((-0.31, 0.25, 0.30), (-0.31, 0.19, 0.10)),
        "foot": ((-0.31, 0.19, 0.10), (-0.31, 0.03, 0.045)),
        "parent": "Pelvis",
    },
}
for suffix, spec in limb_specs.items():
    add_bone(f"Scapula{suffix}", *spec["scapula"], spec["parent"])
    add_bone(f"Upper{suffix}", *spec["upper"], f"Scapula{suffix}")
    add_bone(f"Lower{suffix}", *spec["lower"], f"Upper{suffix}")
    add_bone(f"Foot{suffix}", *spec["foot"], f"Lower{suffix}")

bpy.ops.object.mode_set(mode="OBJECT")
if automatic_weighting:
    bpy.ops.object.select_all(action="DESELECT")
    mesh.select_set(True)
    armature.select_set(True)
    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.parent_set(type="ARMATURE_AUTO", keep_transform=True)
    modifier = next(item for item in mesh.modifiers if item.type == "ARMATURE")
else:
    modifier = mesh.modifiers.new(name="ScarletHunterArmature", type="ARMATURE")
    modifier.object = armature
modifier.name = "ScarletHunterArmature"
modifier.object = armature
modifier.use_deform_preserve_volume = True

deform_bones = [bone.name for bone in armature.data.bones if bone.use_deform]
groups = {name: mesh.vertex_groups.get(name) or mesh.vertex_groups.new(name=name) for name in deform_bones}


def segment_distance(point, start, end):
    start = Vector(start)
    end = Vector(end)
    segment = end - start
    t = max(0.0, min(1.0, (point - start).dot(segment) / max(segment.length_squared, 1e-9)))
    return (point - (start + segment * t)).length, t


def normalized(weights):
    weights = {name: max(0.0, value) for name, value in weights.items() if value > 0}
    total = sum(weights.values())
    if total <= 0:
        return {"Spine": 1.0}
    return {name: value / total for name, value in weights.items()}


def tail_weights(point):
    distances = []
    for index in range(6):
        distance, along = segment_distance(point, tail_points[index], tail_points[index + 1])
        distances.append((distance, index, along))
    distance, index, along = min(distances)
    if distance > 0.235:
        return None
    weights = {f"Tail_{index}": 0.78}
    if along < 0.28 and index > 0:
        weights[f"Tail_{index - 1}"] = 0.22
    elif along > 0.72 and index < 5:
        weights[f"Tail_{index + 1}"] = 0.22
    else:
        weights[f"Tail_{index}"] = 1.0
    if index == 0:
        weights["Pelvis"] = max(0.0, 0.32 * (1.0 - along))
    return weights


def limb_weights(point, suffix):
    """Blend continuously across the exact four-bone limb chain.

    Meshy produced a single sculpted surface across armor, muscle and joints.
    Hard Z bands split neighboring triangle vertices between distant bones and
    create long spikes in attack poses. Distance fields keep every joint and
    armor transition continuous while preserving planted feet.
    """
    spec = limb_specs[suffix]
    segments = {
        f"Scapula{suffix}": spec["scapula"],
        f"Upper{suffix}": spec["upper"],
        f"Lower{suffix}": spec["lower"],
        f"Foot{suffix}": spec["foot"],
    }
    scores = {}
    for name, (start, end) in segments.items():
        distance, _along = segment_distance(point, start, end)
        scores[name] = 1.0 / (distance * distance + 0.0025)
    strongest = sorted(scores, key=scores.get, reverse=True)[:2]
    weights = {name: scores[name] for name in strongest}
    if point.z < 0.105:
        weights[f"Foot{suffix}"] = max(weights.get(f"Foot{suffix}", 0), max(scores.values()) * 3.5)
    if abs(point.x) < 0.235 and point.z > 0.38:
        anchor = "Chest" if suffix.startswith("F") else "Pelvis"
        weights[anchor] = max(scores.values()) * min(1.2, (0.235 - abs(point.x)) / 0.08)
    return weights


for vertex in mesh.data.vertices:
    if automatic_weighting:
        break
    point = vertex.co.copy()
    x, y, z = point
    weights = None

    # The curled tail overlaps the pelvis in Y, so follow its authored 3D
    # centerline instead of inheriting the old gecko's one-axis tail weights.
    if y > 0.22 or (y > 0.38 and z > 0.70):
        weights = tail_weights(point)

    # Independent jaw selection leaves the crown/upper skull on Head while the
    # cream lower muzzle receives a clean hinge. The blend band preserves lips.
    if weights is None and y < -0.58:
        jaw_line = 0.525 + (-y - 0.58) * -0.10
        if z < jaw_line and abs(x) < 0.29:
            blend = min(1.0, max(0.0, (jaw_line - z) / 0.13))
            weights = {"Jaw": 0.72 + 0.26 * blend, "Head": 0.28 - 0.20 * blend}
        else:
            weights = {"Head": 0.94, "Neck": 0.06}

    if weights is None and y < -0.45:
        blend = min(1.0, max(0.0, (-y - 0.45) / 0.13))
        weights = {"Head": 0.58 + 0.36 * blend, "Neck": 0.42 - 0.30 * blend}

    # Each limb owns a different anatomic volume. Broad shoulder/hip armor gets
    # scapula support; lower joints and planted feet remain isolated and stable.
    if weights is None and abs(x) > 0.155 and z < 0.59 and -0.57 < y < 0.43:
        suffix = ("F" if y < -0.10 else "H") + ("L" if x > 0 else "R")
        weights = limb_weights(point, suffix)

    if weights is None and y < -0.25:
        blend = min(1.0, max(0.0, (-y - 0.25) / 0.20))
        weights = {"Neck": 0.70 * blend, "Chest": 1.0 - 0.55 * blend}
    elif weights is None and y < -0.02:
        blend = min(1.0, max(0.0, (-y - 0.02) / 0.23))
        weights = {"Chest": 0.52 + 0.38 * blend, "Spine": 0.48 - 0.28 * blend}
    elif weights is None:
        blend = min(1.0, max(0.0, (y + 0.02) / 0.28))
        weights = {"Spine": 0.62 - 0.26 * blend, "Pelvis": 0.38 + 0.26 * blend}

    for name, value in normalized(weights).items():
        groups[name].add([vertex.index], value, "REPLACE")


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


tail_idle = {f"Tail_{index}": (0, 0, math.radians(index * 0.65)) for index in range(6)}
make_action(
    "Idle",
    60,
    [
        (0, {}, {}),
        (30, {"Chest": (math.radians(1.7), 0, 0), "Neck": (math.radians(-2.0), 0, 0), "Head": (math.radians(1.4), 0, 0), **tail_idle}, {"Pelvis": (0, 0, 0.008)}),
        (60, {}, {}),
    ],
)

run_poses = []
for frame, phase in [(0, 0), (6, math.pi / 2), (12, math.pi), (18, math.pi * 1.5), (24, math.pi * 2)]:
    rotations = {
        "Pelvis": (math.radians(math.sin(phase * 2) * 1.5), 0, math.radians(math.sin(phase) * 1.8)),
        "Chest": (math.radians(-math.sin(phase * 2) * 1.2), 0, math.radians(-math.sin(phase) * 1.3)),
        "Neck": (math.radians(math.sin(phase * 2) * 1.8), 0, 0),
        "Head": (math.radians(-math.sin(phase * 2) * 2.4), 0, 0),
    }
    for suffix, offset in {"FL": 0, "HR": 0, "FR": math.pi, "HL": math.pi}.items():
        swing = math.sin(phase + offset)
        lift = max(0.0, swing)
        rotations[f"Upper{suffix}"] = (math.radians(swing * 27), 0, 0)
        rotations[f"Lower{suffix}"] = (math.radians(-10 - lift * 26), 0, 0)
        rotations[f"Foot{suffix}"] = (math.radians(7 + lift * 22), 0, 0)
    for index in range(6):
        rotations[f"Tail_{index}"] = (0, 0, math.radians(math.sin(phase - index * 0.42) * (1.5 + index * 0.5)))
    run_poses.append((frame, rotations, {"Pelvis": (0, 0, 0.022 * abs(math.sin(phase * 2))) }))
make_action("Run", 24, run_poses)

make_action(
    "Turn",
    24,
    [
        (0, {}, {}),
        (8, {"Pelvis": (0, 0, math.radians(6)), "Chest": (0, 0, math.radians(7)), "Neck": (0, 0, math.radians(9)), "Head": (0, 0, math.radians(12)), **{f"Tail_{i}": (0, 0, math.radians(-2 - i * 0.5)) for i in range(6)}}, {"Pelvis": (0, 0, -0.012)}),
        (16, {"Pelvis": (0, 0, math.radians(-3)), "Chest": (0, 0, math.radians(-4)), "Neck": (0, 0, math.radians(-5)), "Head": (0, 0, math.radians(-6))}, {}),
        (24, {}, {}),
    ],
)

# Claw: one planted-side pounce and one dominant foreleg. The opposite foreleg
# and both hind feet stay braced, so the silhouette cannot read as dancing.
make_action(
    "Claw",
    22,
    [
        (0, {}, {}),
        (4, {"Pelvis": (math.radians(-4), 0, math.radians(-6)), "Chest": (math.radians(6), 0, math.radians(-8)), "Neck": (math.radians(8), 0, math.radians(5)), "ScapulaFL": (math.radians(-14), 0, math.radians(4)), "UpperFL": (math.radians(-20), 0, math.radians(4)), "LowerFL": (math.radians(-18), 0, 0), "FootFL": (math.radians(18), 0, 0), "UpperFR": (math.radians(5), 0, 0), "LowerFR": (math.radians(-10), 0, 0), "UpperHL": (math.radians(-6), 0, 0), "UpperHR": (math.radians(-6), 0, 0)}, {"Pelvis": (0.018, 0.035, -0.03)}),
        (7, {"Pelvis": (math.radians(4), 0, math.radians(7)), "Chest": (math.radians(-7), 0, math.radians(11)), "Neck": (math.radians(-9), 0, math.radians(-6)), "Head": (math.radians(-7), 0, math.radians(-7)), "ScapulaFL": (math.radians(24), 0, math.radians(-5)), "UpperFL": (math.radians(25), math.radians(2), math.radians(-4)), "LowerFL": (math.radians(6), 0, 0), "FootFL": (math.radians(-15), 0, math.radians(3)), "UpperFR": (math.radians(-7), 0, 0), "LowerFR": (math.radians(-14), 0, 0), "UpperHL": (math.radians(8), 0, 0), "UpperHR": (math.radians(8), 0, 0), **{f"Tail_{i}": (0, 0, math.radians(-1.2 - i * 0.3)) for i in range(6)}}, {"Pelvis": (-0.014, -0.08, 0)}),
        (11, {"Pelvis": (math.radians(2), 0, math.radians(5)), "Chest": (math.radians(-3), 0, math.radians(7)), "ScapulaFL": (math.radians(14), 0, math.radians(-3)), "UpperFL": (math.radians(18), 0, math.radians(-3)), "LowerFL": (math.radians(4), 0, 0), "FootFL": (math.radians(-8), 0, 0)}, {"Pelvis": (-0.008, -0.05, 0)}),
        (22, {}, {}),
    ],
)

# Bite: the jaw opens before the neck accelerates, then snaps at contact and
# reopens slightly for the tear. Body translation supports, never replaces, it.
make_action(
    "Bite",
    20,
    [
        (0, {}, {}),
        (7, {"Pelvis": (math.radians(-2), 0, 0), "Chest": (math.radians(3), 0, 0), "Neck": (math.radians(16), 0, 0), "Head": (math.radians(13), 0, 0), "Jaw": (math.radians(40), 0, 0)}, {"Pelvis": (0, 0.03, -0.018)}),
        (12, {"Pelvis": (math.radians(1), 0, 0), "Chest": (math.radians(-4), 0, 0), "Neck": (math.radians(-27), 0, 0), "Head": (math.radians(-24), 0, 0), "Jaw": (math.radians(-3), 0, 0), **{f"Tail_{i}": (0, 0, math.radians(0.5 + i * 0.3)) for i in range(6)}}, {"Pelvis": (0, -0.07, 0)}),
        (15, {"Pelvis": (math.radians(4), 0, math.radians(-5)), "Chest": (math.radians(-5), 0, math.radians(-7)), "Neck": (math.radians(-12), 0, math.radians(10)), "Head": (math.radians(-8), 0, math.radians(12)), "Jaw": (math.radians(12), 0, 0)}, {"Pelvis": (0.025, -0.105, 0.006)}),
        (20, {}, {}),
    ],
)

# Tail swipe: feet are locked in a wide brace. Pelvis starts the action and six
# tail bones carry a low accelerating wave around Z.
brace = {
    "UpperFL": (math.radians(-7), 0, math.radians(5)),
    "UpperFR": (math.radians(-7), 0, math.radians(-5)),
    "UpperHL": (math.radians(9), 0, math.radians(6)),
    "UpperHR": (math.radians(9), 0, math.radians(-6)),
    "LowerFL": (math.radians(-15), 0, 0),
    "LowerFR": (math.radians(-15), 0, 0),
    "LowerHL": (math.radians(-17), 0, 0),
    "LowerHR": (math.radians(-17), 0, 0),
}
make_action(
    "TailSwipe",
    28,
    [
        (0, {}, {}),
        (7, {**brace, "Pelvis": (math.radians(-5), 0, math.radians(-16)), "Chest": (math.radians(4), 0, math.radians(11)), "Neck": (0, 0, math.radians(8)), "Head": (0, 0, math.radians(10)), **{f"Tail_{i}": (0, 0, math.radians(-4 - i * 1.0)) for i in range(6)}}, {"Pelvis": (0.025, 0.018, -0.035)}),
        (16, {**brace, "Pelvis": (math.radians(-4), 0, math.radians(27)), "Chest": (math.radians(3), 0, math.radians(-18)), "Neck": (0, 0, math.radians(-10)), "Head": (0, 0, math.radians(-14)), **{f"Tail_{i}": (0, 0, math.radians(5 + i * 1.3)) for i in range(6)}}, {"Pelvis": (-0.035, -0.025, -0.028)}),
        (21, {**brace, "Pelvis": (math.radians(-2), 0, math.radians(8)), "Chest": (0, 0, math.radians(-5)), **{f"Tail_{i}": (0, 0, math.radians(2 + i * 0.5)) for i in range(6)}}, {"Pelvis": (-0.008, -0.008, -0.01)}),
        (28, {}, {}),
    ],
)

make_action(
    "Hit",
    14,
    [
        (0, {}, {}),
        (4, {"Pelvis": (math.radians(-4), 0, math.radians(10)), "Chest": (math.radians(6), 0, math.radians(-12)), "Neck": (math.radians(10), 0, math.radians(-10)), "Head": (math.radians(13), 0, math.radians(-13)), **{f"Tail_{i}": (0, 0, math.radians(-4 - i * 2)) for i in range(6)}}, {"Pelvis": (0.025, 0.018, -0.03)}),
        (14, {}, {}),
    ],
)

make_action(
    "Death",
    38,
    [
        (0, {}, {}),
        (14, {"Pelvis": (math.radians(-5), 0, math.radians(30)), "Chest": (math.radians(8), 0, math.radians(12)), "Neck": (math.radians(12), 0, math.radians(-18)), "Head": (math.radians(18), 0, math.radians(-22)), "Jaw": (math.radians(8), 0, 0)}, {"Pelvis": (0.045, 0.01, -0.12)}),
        (30, {"Pelvis": (math.radians(-7), 0, math.radians(80)), "Chest": (math.radians(10), 0, math.radians(18)), "Neck": (math.radians(17), 0, math.radians(-25)), "Head": (math.radians(23), 0, math.radians(-31)), "Jaw": (math.radians(13), 0, 0), "UpperFL": (math.radians(22), 0, math.radians(18)), "UpperFR": (math.radians(-19), 0, math.radians(-17)), "UpperHL": (math.radians(18), 0, math.radians(15)), "UpperHR": (math.radians(-16), 0, math.radians(-14)), **{f"Tail_{i}": (0, 0, math.radians(-10 - i * 3.0)) for i in range(6)}}, {"Pelvis": (0.07, 0.015, -0.31)}),
        (38, {"Pelvis": (math.radians(-7), 0, math.radians(83)), "Chest": (math.radians(10), 0, math.radians(18)), "Neck": (math.radians(17), 0, math.radians(-25)), "Head": (math.radians(23), 0, math.radians(-31)), "Jaw": (math.radians(13), 0, 0), **{f"Tail_{i}": (0, 0, math.radians(-10 - i * 3.0)) for i in range(6)}}, {"Pelvis": (0.07, 0.015, -0.32)}),
    ],
)

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
print("EA_SCARLET_HUNTER_RIG=" + json.dumps({
    "source": str(source_path),
    "output": str(output_path),
    "triangles": len(mesh.data.loop_triangles),
    "bones": [bone.name for bone in armature.data.bones],
    "deform_bones": deform_bones,
    "actions": [action.name for action in bpy.data.actions],
    "dimensions": [round(value, 6) for value in mesh.dimensions],
    "weighting": "automatic" if automatic_weighting else "form-specific-spatial",
}, ensure_ascii=False))
