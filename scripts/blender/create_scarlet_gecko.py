import json
import colorsys
import math
import sys
from pathlib import Path

import bpy


if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python create_scarlet_gecko.py -- source.glb output.glb [scarlet-gecko|scarlet-hunter]")

arguments = sys.argv[sys.argv.index("--") + 1 :]
source_path = Path(arguments[0]).expanduser().resolve()
output_path = Path(arguments[1]).expanduser().resolve()
target_form = arguments[2] if len(arguments) > 2 else "scarlet-gecko"
if target_form not in {"scarlet-gecko", "scarlet-hunter"}:
    raise SystemExit(f"Unsupported target form: {target_form}")
is_hunter = target_form == "scarlet-hunter"
target_title = "ScarletHunter" if is_hunter else "ScarletGecko"
body_plan = "predator-drake" if is_hunter else "crested-gecko"
output_path.parent.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))

armature = next(item for item in bpy.context.scene.objects if item.type == "ARMATURE")
mesh = max(
    (item for item in bpy.context.scene.objects if item.type == "MESH"),
    key=lambda item: len(item.data.polygons),
)
armature.name = f"{target_title}Rig"
armature.data.name = f"{target_title}Skeleton"
mesh.name = f"{target_title}Mesh"
mesh_world = mesh.matrix_world.copy()
mesh.parent = None
mesh.matrix_world = mesh_world
armature["ea_form_id"] = target_form
armature["ea_body_plan"] = body_plan
armature["ea_source_asset"] = source_path.name

# Remove the imported helper/collision mesh while preserving the accepted skinned web mesh.
for item in list(bpy.context.scene.objects):
    if item.type == "MESH" and item != mesh:
        bpy.data.objects.remove(item, do_unlink=True)


def smoothstep(edge0, edge1, value):
    if edge1 == edge0:
        return 0.0
    t = max(0.0, min(1.0, (value - edge0) / (edge1 - edge0)))
    return t * t * (3.0 - 2.0 * t)


# Reshape the accepted topology without touching the source GLB. The first evolution stays
# lean and crested. The second evolution deliberately stops extending that silhouette: it
# gains a broad rib cage, heavy pelvis, thick tail root and lower crown so the gameplay view
# reads as a volumetric hunting drake rather than a longer flat gecko.
for vertex in mesh.data.vertices:
    x, y, z = vertex.co
    original_y = y
    original_z = z
    # Hunter v1 accidentally tested -Y against negative thresholds, leaving the head mask
    # effectively at zero. Keep the accepted stage-1 bake unchanged, but fix the stage-2
    # anatomical mask so crown/skull/snout changes actually reach the exported mesh.
    head = smoothstep(-0.34, -0.72, original_y) if is_hunter else smoothstep(-0.34, -0.72, -original_y)
    tail = smoothstep(0.18, 0.92, original_y)
    torso = 1.0 - max(head, tail)
    planted = 1.0 - smoothstep(0.10, 0.34, original_z)

    if is_hunter:
        # Width is the principal stage-2 change. Keep feet near their accepted tracking
        # plane while broadening the living mass above them. The base of the tail remains
        # muscular and then tapers, avoiding a uniformly extruded ribbon.
        tail_base = tail * (1.0 - smoothstep(0.52, 0.92, original_y))
        width_factor = (
            1.12
            + torso * 0.43
            + head * 0.05
            + tail_base * 0.34
            - tail * smoothstep(0.58, 0.96, original_y) * 0.24
        )
        width_factor = width_factor * (1.0 - planted * 0.12) * 1.30 * (1.0 - head * 0.45)
        x *= width_factor

        # Stage 1 already lengthened the animal. Stage 2 adds only modest reach and puts
        # the visual budget into chest/hip volume instead of another long horizontal strip.
        if original_y < -0.34:
            y = -0.34 + (original_y + 0.34) * 1.14
        elif original_y > 0.18:
            y = 0.18 + (original_y - 0.18) * 0.96
        else:
            y *= 0.96
        y *= 0.92

        upper = smoothstep(0.16, 0.56, original_z)
        shoulder = torso * smoothstep(-0.30, -0.02, original_y) * (1.0 - smoothstep(0.08, 0.24, original_y))
        hip = torso * smoothstep(0.02, 0.18, original_y)
        z += upper * (0.105 + shoulder * 0.075 + hip * 0.045)
        z += tail_base * smoothstep(0.18, 0.46, original_z) * 0.065
        z += smoothstep(0.07, 0.46, original_z) * 0.095

        # Mature the head as one coherent volume. Scaling around the skull center preserves
        # the sculpted crown curves; independently crushing only high crown vertices created
        # a flat snout and vertical spike artifacts in the rejected second iteration.
        mature_head_z = 0.55 + (z - 0.55) * 0.68
        z = z * (1.0 - head) + mature_head_z * head
    else:
        x *= 0.76 + planted * 0.18
        if original_y < -0.34:
            y = -0.34 + (original_y + 0.34) * 1.34
        elif original_y > 0.18:
            y = 0.18 + (original_y - 0.18) * 1.40
        else:
            y *= 1.10

        upper = smoothstep(0.18, 0.58, original_z)
        z += upper * (0.12 + head * 0.095 + torso * 0.035)
        z += head * 0.055
    vertex.co = (x, y, max(0.0, z))

mesh.data.update()


if is_hunter:
    # Topology is unchanged from the accepted stage-1 source, so retain its audited
    # jaw membership before rebuilding the rest of the weights. Spatially guessing
    # the lower jaw captured throat/chest vertices and produced stretched skin sheets.
    source_jaw_group = mesh.vertex_groups.get("Jaw")
    source_jaw_weights = {}
    if source_jaw_group:
        for vertex in mesh.data.vertices:
            membership = next((item for item in vertex.groups if item.group == source_jaw_group.index), None)
            if membership and membership.weight > 0.05:
                source_jaw_weights[vertex.index] = membership.weight

    # Re-seat the 21-bone rig inside the new anatomy. Feet remain on the accepted ground
    # plane, while shoulder/hip sockets move outward and the axial chain rises with the
    # thicker torso. This avoids asking stage-1 bind positions to drive a different body.
    bpy.context.view_layer.objects.active = armature
    armature.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    for bone in armature.data.edit_bones:
        for point_name in ("head", "tail"):
            point = getattr(bone, point_name).copy()
            name = bone.name
            if name.startswith(("Leg", "Shin", "Foot")):
                point.x *= 1.24
                point.y *= 0.93
                if point.z > 0.14:
                    point.z += 0.10 * smoothstep(0.14, 0.46, point.z)
            elif name in {"Body", "Neck", "Head", "Jaw"}:
                point.y *= 0.93
                point.z += 0.12 if name == "Body" else 0.13
            elif name.startswith("Tail_"):
                tail_progress = smoothstep(0.20, 1.00, point.y)
                point.y = (0.20 + (point.y - 0.20) * 0.96) * 0.92
                point.z += 0.085 * (1.0 - tail_progress)
            setattr(bone, point_name, point)
    bpy.ops.object.mode_set(mode="OBJECT")
    armature["ea_skeleton_revision"] = "broad-chested-hunter-v2"

    # Rebind the transformed anatomy instead of inheriting stage-1 weights. The rejected
    # action pass exposed torso vertices blended into leg groups, which pulled the chest
    # into flat sheets whenever Body and a leg rotated in different directions.
    deform_names = [bone.name for bone in armature.data.bones if bone.use_deform]
    vertex_indices = [vertex.index for vertex in mesh.data.vertices]
    groups = {}
    for name in deform_names:
        group = mesh.vertex_groups.get(name) or mesh.vertex_groups.new(name=name)
        group.remove(vertex_indices)
        groups[name] = group

    def normalized_weights(weights):
        total = sum(max(0.0, value) for value in weights.values())
        if total <= 0:
            return {"Body": 1.0}
        return {name: max(0.0, value) / total for name, value in weights.items() if value > 0}

    for vertex in mesh.data.vertices:
        x, y, z = vertex.co
        weights = {}
        source_jaw_weight = source_jaw_weights.get(vertex.index, 0.0)
        if source_jaw_weight > 0:
            weights = {"Jaw": source_jaw_weight, "Head": 1.0 - source_jaw_weight}
        elif y < -0.43 and z >= 0.44:
            blend = min(1.0, max(0.0, (-y - 0.38) / 0.24))
            weights = {"Head": 0.72 + blend * 0.24, "Neck": 0.28 - blend * 0.20}
        elif y < -0.19 and z > 0.34:
            blend = min(1.0, max(0.0, (-y - 0.19) / 0.25))
            weights = {"Neck": 0.58 + blend * 0.30, "Body": 0.42 - blend * 0.26}
        elif z < 0.58 and abs(x) > 0.20 and -0.54 <= y <= 0.52:
            row = "F" if y < 0 else "B"
            side = "L" if x > 0 else "R"
            suffix = row + side
            if z < 0.14:
                weights = {f"Foot{suffix}": 0.84, f"Shin{suffix}": 0.14, "Body": 0.02}
            elif z < 0.34:
                shin_blend = min(1.0, max(0.0, (0.34 - z) / 0.20))
                weights = {f"Shin{suffix}": 0.60 + shin_blend * 0.22, f"Leg{suffix}": 0.30, "Body": 0.10}
            else:
                weights = {f"Leg{suffix}": 0.82, "Body": 0.18}
        elif y > 0.21:
            if y < 0.43:
                weights = {"Tail_0": 0.82, "Body": 0.18}
            elif y < 0.62:
                blend = min(1.0, max(0.0, (y - 0.43) / 0.19))
                weights = {"Tail_0": 1.0 - blend, "Tail_1": blend}
            elif y < 0.79:
                blend = min(1.0, max(0.0, (y - 0.62) / 0.17))
                weights = {"Tail_1": 1.0 - blend, "Tail_2": blend}
            else:
                blend = min(1.0, max(0.0, (y - 0.79) / 0.20))
                weights = {"Tail_2": 1.0 - blend, "Tail_3": blend}
        else:
            weights = {"Body": 1.0}
        for name, weight in normalized_weights(weights).items():
            groups[name].add([vertex.index], weight, "REPLACE")


def tune_imported_material(material):
    material.name = "HunterCrimsonPBR" if is_hunter else "ScarletScalePBR"
    material.diffuse_color = (0.50, 0.105, 0.055, 1.0) if is_hunter else (0.72, 0.085, 0.045, 1.0)
    material.metallic = 0.02
    material.roughness = 0.47 if is_hunter else 0.61
    material["ea_palette"] = "layered-burnished-crimson" if is_hunter else "scarlet-umber"
    if not material.use_nodes:
        return
    principled = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
    if principled:
        base_color = principled.inputs["Base Color"]
        source_link = base_color.links[0] if base_color.links else None
        texture_node = source_link.from_node if source_link and source_link.from_node.type == "TEX_IMAGE" else None
        if texture_node and texture_node.image:
            source_image = texture_node.image
            image = source_image.copy()
            image.name = f"{target_title}BaseColor"
            pixels = list(image.pixels)
            for index in range(0, len(pixels), 4):
                red, green, blue = pixels[index : index + 3]
                hue, saturation, value = colorsys.rgb_to_hsv(red, green, blue)
                if is_hunter and value < 0.11:
                    # Lift crushed blacks into warm charcoal so normal/roughness detail
                    # remains visible under the forest lighting.
                    red, green, blue = colorsys.hsv_to_rgb(0.018, 0.46, 0.12 + value * 0.55)
                    pixels[index : index + 3] = red, green, blue
                    continue
                if is_hunter and (hue >= 0.92 or hue <= 0.08) and saturation >= 0.18:
                    red, green, blue = colorsys.hsv_to_rgb(
                        0.012,
                        min(0.92, max(0.64, saturation * 1.04)),
                        min(0.90, max(0.25, value * 0.92 + 0.10)),
                    )
                    pixels[index : index + 3] = red, green, blue
                    continue
                # Replace the source's blue-green scales while preserving amber eyes,
                # pale horns, dark creases and the baked surface detail.
                if 0.32 <= hue <= 0.64 and saturation >= 0.12 and value >= 0.10:
                    # Green body scales become a layered burnt-red/burnished-copper range.
                    # Original brightness still drives variation, preserving the baked scale
                    # texture instead of flooding the whole body with one black tint.
                    target_hue = 0.018 + smoothstep(0.10, 0.82, value) * 0.025 if is_hunter else (0.985 if hue < 0.49 else 0.015)
                    red, green, blue = colorsys.hsv_to_rgb(
                        target_hue,
                        min(0.92 if is_hunter else 1.0, max(0.56, saturation * (1.02 if is_hunter else 1.15))),
                        min(0.88 if is_hunter else 1.0, max(0.23 if is_hunter else 0.0, value * (0.68 if is_hunter else 0.78) + (0.16 if is_hunter else 0.0))),
                    )
                    pixels[index : index + 3] = red, green, blue
            image.pixels.foreach_set(pixels)
            image.pack()
            texture_node.image = image
        else:
            base_color.default_value = (0.56, 0.045, 0.028, 1.0)
        principled.inputs["Metallic"].default_value = 0.02
        principled.inputs["Roughness"].default_value = 0.47 if is_hunter else 0.61


for material in mesh.data.materials:
    tune_imported_material(material)

attachments = []

# Preserve all eight accepted state names, but give the derived asset its own action records.
required_actions = {"Idle", "Run", "Turn", "Bite", "Claw", "TailSwipe", "Hit", "Death"}
available_actions = {action.name for action in bpy.data.actions}
missing_actions = sorted(required_actions - available_actions)
if missing_actions:
    raise RuntimeError(f"Source combat contract incomplete: {missing_actions}")


def reset_pose():
    for pose_bone in armature.pose.bones:
        pose_bone.rotation_mode = "XYZ"
        pose_bone.rotation_euler = (0, 0, 0)
        pose_bone.location = (0, 0, 0)
        pose_bone.scale = (1, 1, 1)


def key_pose(frame, rotations, locations):
    bpy.context.scene.frame_set(frame)
    for name, values in rotations.items():
        pose_bone = armature.pose.bones.get(name)
        if pose_bone:
            pose_bone.rotation_mode = "XYZ"
            pose_bone.rotation_euler = values
            pose_bone.keyframe_insert(data_path="rotation_euler", frame=frame, group=name)
    for name, values in locations.items():
        pose_bone = armature.pose.bones.get(name)
        if pose_bone:
            pose_bone.location = values
            pose_bone.keyframe_insert(data_path="location", frame=frame, group=name)


def replace_hunter_action(name, frame_end, poses):
    if armature.animation_data:
        for track in list(armature.animation_data.nla_tracks):
            if track.name == name or any(strip.action and strip.action.name == name for strip in track.strips):
                armature.animation_data.nla_tracks.remove(track)
        armature.animation_data.action = None
    old_action = bpy.data.actions.get(name)
    if old_action:
        bpy.data.actions.remove(old_action, do_unlink=True)
    reset_pose()
    action = bpy.data.actions.new(name=name)
    armature.animation_data_create()
    armature.animation_data.action = action
    for frame, rotations, locations in poses:
        key_pose(frame, rotations, locations)
    track = armature.animation_data.nla_tracks.new()
    track.name = name
    strip = track.strips.new(name, 0, action)
    strip.action_frame_start = 0
    strip.action_frame_end = frame_end
    track.mute = True
    action["ea_form_id"] = target_form
    action["ea_motion_language"] = "pounce-rend-crush-slam"


if is_hunter:
    # Imported NLA tracks overlap at frame zero. Mute them while authoring so Blender does
    # not evaluate another action over the pose immediately before keyframe insertion.
    for source_track in armature.animation_data.nla_tracks:
        source_track.mute = True
    # Stage-2 ordinary attacks remain on the single primary button, but receive newly
    # authored bone poses and silhouettes instead of replaying the stage-1 clips.
    replace_hunter_action("Claw", 18, [
        (0, {"Body": (0, 0, 0), "Neck": (0, 0, 0), "Head": (0, 0, 0)}, {}),
        (4, {
            "Body": (math.radians(-2), 0, 0), "Neck": (math.radians(9), 0, 0),
            "Head": (math.radians(11), 0, 0),
            "LegFL": (math.radians(-10), math.radians(-2), math.radians(3)),
            "LegFR": (math.radians(-10), math.radians(2), math.radians(-3)),
            "ShinBL": (math.radians(-5), 0, 0), "ShinBR": (math.radians(-5), 0, 0),
            "Tail_0": (0, 0, math.radians(-8)), "Tail_1": (0, 0, math.radians(-13)),
            "Tail_2": (0, 0, math.radians(-17)), "Tail_3": (0, 0, math.radians(-21)),
        }, {"Body": (0, 0.04, -0.042)}),
        (7, {
            "Body": (math.radians(2), 0, math.radians(2)), "Neck": (math.radians(-12), 0, math.radians(-4)),
            "Head": (math.radians(-15), 0, math.radians(-5)),
            "LegFL": (math.radians(12), math.radians(-2), math.radians(-4)),
            "LegFR": (math.radians(9), math.radians(2), math.radians(4)),
            "ShinFL": (math.radians(3), 0, 0), "ShinFR": (math.radians(3), 0, 0),
            "FootFL": (math.radians(-4), 0, 0), "FootFR": (math.radians(-4), 0, 0),
            "Tail_0": (0, 0, math.radians(10)), "Tail_1": (0, 0, math.radians(16)),
            "Tail_2": (0, 0, math.radians(21)), "Tail_3": (0, 0, math.radians(26)),
        }, {"Body": (0, -0.17, 0.032)}),
        (12, {"Body": (math.radians(5), 0, math.radians(-6)), "Neck": (math.radians(-5), 0, 0),
              "Head": (math.radians(-7), 0, 0), "LegFL": (math.radians(12), 0, 0),
              "LegFR": (math.radians(12), 0, 0)}, {"Body": (0, -0.08, 0.01)}),
        (18, {"Body": (0, 0, 0), "Neck": (0, 0, 0), "Head": (0, 0, 0),
              "LegFL": (0, 0, 0), "LegFR": (0, 0, 0)}, {}),
    ])
    replace_hunter_action("Bite", 24, [
        # Readable predator bite: lift and expose the gape, snap shut at contact,
        # keep the jaw clamped through two short tear beats, then release. Damage
        # remains a single authoritative event at the first closure.
        (0, {"Body": (0, 0, 0), "Neck": (0, 0, 0), "Head": (0, 0, 0), "Jaw": (0, 0, 0)}, {}),
        (4, {"Body": (math.radians(-3), 0, 0), "Neck": (math.radians(-5), 0, 0),
             "Head": (math.radians(-8), 0, 0), "Jaw": (math.radians(5), 0, 0),
             "Tail_0": (0, 0, math.radians(-4)), "Tail_1": (0, 0, math.radians(-7)),
             "Tail_2": (0, 0, math.radians(-10)), "Tail_3": (0, 0, math.radians(-13))},
            {"Body": (0, 0.025, -0.025)}),
        (7, {"Body": (math.radians(-4), 0, 0), "Neck": (math.radians(-11), 0, 0),
             "Head": (math.radians(-14), 0, 0), "Jaw": (math.radians(12), 0, 0),
             "Tail_0": (0, 0, math.radians(-7)), "Tail_1": (0, 0, math.radians(-11)),
             "Tail_2": (0, 0, math.radians(-15)), "Tail_3": (0, 0, math.radians(-19))},
            {"Body": (0, 0.055, -0.04)}),
        (10, {"Body": (math.radians(-1), 0, 0), "Neck": (math.radians(-10), 0, 0),
              "Head": (math.radians(-13), 0, 0), "Jaw": (math.radians(8), 0, 0),
              "Tail_0": (0, 0, math.radians(3)), "Tail_1": (0, 0, math.radians(5)),
              "Tail_2": (0, 0, math.radians(7)), "Tail_3": (0, 0, math.radians(9))},
             {"Body": (0, -0.105, 0.012)}),
        (12, {"Body": (math.radians(3), 0, 0), "Neck": (math.radians(-15), 0, 0),
              "Head": (math.radians(-20), 0, 0), "Jaw": (math.radians(-4), 0, 0),
              "Tail_0": (0, 0, math.radians(8)), "Tail_1": (0, 0, math.radians(13)),
              "Tail_2": (0, 0, math.radians(17)), "Tail_3": (0, 0, math.radians(21))},
             {"Body": (0, -0.17, 0.026)}),
        (15, {"Body": (math.radians(5), 0, math.radians(-3)),
              "Neck": (math.radians(-13), 0, math.radians(5)),
              "Head": (math.radians(-16), 0, math.radians(10)), "Jaw": (math.radians(2), 0, 0),
              "Tail_0": (0, 0, math.radians(5)), "Tail_1": (0, 0, math.radians(8)),
              "Tail_2": (0, 0, math.radians(11)), "Tail_3": (0, 0, math.radians(14))},
             {"Body": (0, -0.145, 0.022)}),
        (18, {"Body": (math.radians(5), 0, math.radians(3)),
              "Neck": (math.radians(-11), 0, math.radians(-4)),
              "Head": (math.radians(-13), 0, math.radians(-8)), "Jaw": (math.radians(3), 0, 0),
              "Tail_0": (0, 0, math.radians(2)), "Tail_1": (0, 0, math.radians(4)),
              "Tail_2": (0, 0, math.radians(6)), "Tail_3": (0, 0, math.radians(8))},
             {"Body": (0, -0.115, 0.018)}),
        (21, {"Body": (math.radians(1), 0, 0), "Neck": (math.radians(3), 0, 0),
              "Head": (math.radians(5), 0, 0), "Jaw": (math.radians(13), 0, 0)},
             {"Body": (0, -0.045, 0.006)}),
        (24, {"Body": (0, 0, 0), "Neck": (0, 0, 0), "Head": (0, 0, 0), "Jaw": (0, 0, 0)}, {}),
    ])
    replace_hunter_action("TailSwipe", 32, [
        (0, {"Body": (0, 0, 0), "Neck": (0, 0, 0), "Head": (0, 0, 0)}, {}),
        (8, {"Body": (math.radians(-2), 0, 0), "Neck": (math.radians(8), 0, 0),
             "Head": (math.radians(10), 0, 0), "Tail_0": (math.radians(-8), 0, math.radians(-5)),
             "Tail_1": (math.radians(-12), 0, math.radians(-8)), "Tail_2": (math.radians(-18), 0, math.radians(-12)),
             "Tail_3": (math.radians(-24), 0, math.radians(-16)), "ShinFL": (math.radians(-4), 0, 0),
             "ShinFR": (math.radians(-4), 0, 0)}, {"Body": (0, 0.025, -0.035)}),
        (16, {"Body": (math.radians(2), 0, 0), "Neck": (math.radians(-8), 0, 0),
              "Head": (math.radians(-10), 0, 0), "Tail_0": (math.radians(8), 0, math.radians(6)),
              "Tail_1": (math.radians(12), 0, math.radians(10)), "Tail_2": (math.radians(18), 0, math.radians(15)),
              "Tail_3": (math.radians(24), 0, math.radians(21)), "LegBL": (math.radians(3), 0, 0),
              "LegBR": (math.radians(3), 0, 0)}, {"Body": (0, -0.055, 0.022)}),
        (23, {"Body": (math.radians(6), 0, 0), "Neck": (math.radians(-5), 0, 0),
              "Head": (math.radians(-7), 0, 0), "Tail_0": (math.radians(12), 0, 0),
              "Tail_1": (math.radians(18), 0, 0), "Tail_2": (math.radians(24), 0, 0),
              "Tail_3": (math.radians(30), 0, 0)}, {"Body": (0, -0.02, 0.012)}),
        (32, {"Body": (0, 0, 0), "Neck": (0, 0, 0), "Head": (0, 0, 0),
              "Tail_0": (0, 0, 0), "Tail_1": (0, 0, 0), "Tail_2": (0, 0, 0),
              "Tail_3": (0, 0, 0)}, {}),
    ])
    armature.animation_data.action = None
    for export_track in armature.animation_data.nla_tracks:
        export_track.mute = False

for action in bpy.data.actions:
    action.name = action.name.split(".")[0]
    action["ea_form_id"] = target_form
    action["ea_motion_language"] = "pounce-rend-crush-slam" if is_hunter else "mature-crested-gecko"

bpy.context.scene.frame_start = 0
bpy.context.scene.frame_end = 60
bpy.ops.object.select_all(action="DESELECT")
for item in [mesh, armature, *attachments]:
    item.select_set(True)
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

triangle_count = 0
for item in [mesh, *attachments]:
    item.data.calc_loop_triangles()
    triangle_count += len(item.data.loop_triangles)

print(
    f"EA_{target_form.upper().replace('-', '_')}="
    + json.dumps(
        {
            "source": str(source_path),
            "output": str(output_path),
            "triangles": triangle_count,
            "bones": [bone.name for bone in armature.data.bones],
            "actions": sorted(action.name for action in bpy.data.actions),
            "attachments": len(attachments),
            "dimensions": [round(value, 6) for value in mesh.dimensions],
        },
        separators=(",", ":"),
    )
)
