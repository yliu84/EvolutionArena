import json
import sys
from pathlib import Path

import bpy
from mathutils import Quaternion


if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python repair_coral_gecko_attack_deformation.py -- source.glb output.glb")

arguments = sys.argv[sys.argv.index("--") + 1 :]
source_path = Path(arguments[0]).expanduser().resolve()
output_path = Path(arguments[1]).expanduser().resolve()
output_path.parent.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))
armature = next(item for item in bpy.context.scene.objects if item.type == "ARMATURE")
mesh = next(item for item in bpy.context.scene.objects if item.type == "MESH" and len(item.data.vertices) > 1_000)


def smoothstep(value):
    value = max(0.0, min(1.0, value))
    return value * value * (3.0 - 2.0 * value)


def group_weight(vertex, group):
    return next((membership.weight for membership in vertex.groups if membership.group == group.index), 0.0)


# V3's automatic Jaw group included 4,183 strongly weighted vertices extending
# from the snout through the chest and forelimbs. Opening the mouth therefore
# pulled a sheet of body geometry downward. Transfer the old Jaw influence to
# Head, then return only a smooth lower-snout wedge to Jaw.
jaw_group = mesh.vertex_groups["Jaw"]
head_group = mesh.vertex_groups["Head"]
jaw_vertices = 0
strong_jaw_vertices = 0
for vertex in mesh.data.vertices:
    old_jaw = group_weight(vertex, jaw_group)
    if old_jaw <= 0:
        continue
    old_head = group_weight(vertex, head_group)
    combined = min(1.0, old_jaw + old_head)
    # Keep the deforming group in a thin wedge below the actual hinge
    # (Jaw head z=0.535).  A wide vertical falloff reintroduces the chest
    # curtain visible in the V3 Bite contact pose.
    y_score = smoothstep((-0.60 - vertex.co.y) / 0.14)
    lower_score = smoothstep((vertex.co.z - 0.40) / 0.05)
    upper_score = smoothstep((0.56 - vertex.co.z) / 0.06)
    jaw_score = y_score * lower_score * upper_score
    new_jaw = combined * 0.62 * jaw_score
    new_head = combined - new_jaw
    jaw_group.remove([vertex.index])
    head_group.remove([vertex.index])
    if new_jaw > 0.001:
        jaw_group.add([vertex.index], new_jaw, "REPLACE")
        jaw_vertices += 1
        strong_jaw_vertices += int(new_jaw >= 0.5)
    if new_head > 0.001:
        head_group.add([vertex.index], new_head, "REPLACE")


def action_curves(action):
    curves = []
    for slot in action.slots:
        channelbag = action.layers[0].strips[0].channelbag(slot)
        if channelbag is not None:
            curves.extend(channelbag.fcurves)
    return curves


def retain_bone_rotation(action, bone_name, factor):
    path = f'pose.bones["{bone_name}"].rotation_quaternion'
    curves = sorted((curve for curve in action_curves(action) if curve.data_path == path), key=lambda curve: curve.array_index)
    if len(curves) != 4:
        raise RuntimeError(f"Expected four quaternion curves for {action.name}:{bone_name}, found {len(curves)}")
    key_count = min(len(curve.keyframe_points) for curve in curves)
    identity = Quaternion((1, 0, 0, 0))
    for key_index in range(key_count):
        rotation = Quaternion(tuple(curves[axis].keyframe_points[key_index].co.y for axis in range(4)))
        rotation.normalize()
        safe_rotation = identity.slerp(rotation, factor)
        for axis, curve in enumerate(curves):
            point = curve.keyframe_points[key_index]
            point.co.y = safe_rotation[axis]
            point.interpolation = "LINEAR"


# The V3 attack clips rotate the foreleg chains far beyond what the inherited
# automatic weights can hold. Keep 15% of those local rotations; torso/head/tail
# twist remains intact and runtime root motion supplies the readable lunge.
for action_name in ["Claw", "Bite"]:
    action = bpy.data.actions.get(action_name)
    if action is None:
        raise RuntimeError(f"Missing {action_name} action")
    for bone_name in ["LegFL", "LegFR", "ShinFL", "ShinFR", "FootFL", "FootFR"]:
        retain_bone_rotation(action, bone_name, 0.15)

# Head and Neck weights from the original automatic rig also spill into the
# shoulder sheet.  Retain the jaw opening, but limit Bite's inherited head and
# neck rotations so those vertices cannot be pulled past the limb silhouette.
bite = bpy.data.actions["Bite"]
for bone_name in ["Head", "Neck"]:
    retain_bone_rotation(bite, bone_name, 0.25)
retain_bone_rotation(bite, "Jaw", 0.55)

for action in bpy.data.actions:
    for curve in action_curves(action):
        if curve.data_path.endswith("scale"):
            for point in curve.keyframe_points:
                point.co.y = 1.0
                point.interpolation = "LINEAR"

armature.animation_data.action = None
bpy.context.scene.frame_start = 0
bpy.context.scene.frame_end = 60
# glTF skin joints reference the armature directly; the skinned mesh must stay
# a scene root or the validator reports NODE_SKINNED_MESH_NON_ROOT. Blender's
# importer adds an object parent for editing convenience, so remove only that
# parent while preserving the mesh world transform and Armature modifier.
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

mesh.data.calc_loop_triangles()
print("EA_CORAL_ATTACK_REPAIR=" + json.dumps({
    "source": str(source_path),
    "output": str(output_path),
    "triangles": len(mesh.data.loop_triangles),
    "bones": len(armature.data.bones),
    "actions": sorted(action.name for action in bpy.data.actions),
    "jaw_vertices": jaw_vertices,
    "strong_jaw_vertices": strong_jaw_vertices,
    "safe_attack_forelimb_rotation_retained": 0.15,
    "bite_head_neck_rotation_retained": 0.25,
    "bite_jaw_rotation_retained": 0.55,
}))
