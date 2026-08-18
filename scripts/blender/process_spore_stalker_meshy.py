"""Turn the Meshy quadruped Walking export into the Swarm stage-1 runtime GLB.

Source is Meshy's official quadruped rig - the same 27-bone template the
accepted Fang and Shell forms use, verified bone for bone on this export - so
axis conventions carry over: X is pitch, Y is yaw, Z is roll.

The same three source defects appear and are repaired the same way:

1. An Icosphere viewport helper ships as a second, unskinned mesh. Left in, it
   becomes the floating debris the Shell run was first rejected for.
2. Hips carries a constant uniform scale key. The runtime forbids non-unit bone
   scale; removing it is safe because it is constant and uniform and the runtime
   normalises to the stage world height anyway.
3. Meshy parks Hips away from the bind position for the whole clip, which drops
   the body off its planted feet the moment Walk starts.

Attack vocabulary is Bite -> Pounce -> TailSwipe, the Fang chain rather than the
Shell one. This form earns the leap the Shell form could not: hind legs run 59%
of standing height against a light narrow body, which is the anatomy a pounce
needs. The tail is long and thin, so TailSwipe whips from the tip instead of
sweeping as a plated club.

Usage:
  blender --background --python scripts/blender/process_spore_stalker_meshy.py \
      -- source.glb public/assets/quality-3d/models/spore-stalker-rigged-v1.glb
"""

import json
import math
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Euler, Quaternion


if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python process_stone_pangolin_meshy.py -- source.glb output.glb")

arguments = sys.argv[sys.argv.index("--") + 1 :]
source_path = Path(arguments[0]).expanduser().resolve()
output_path = Path(arguments[1]).expanduser().resolve()
blend_path = output_path.with_suffix(".blend")
output_path.parent.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))
armature = next(item for item in bpy.context.scene.objects if item.type == "ARMATURE")
mesh = max((item for item in bpy.context.scene.objects if item.type == "MESH"), key=lambda item: len(item.data.vertices))

# Clear every custom-shape reference before deleting the helper, or the glTF
# exporter follows the dependency and restores it.
for pose_bone in armature.pose.bones:
    pose_bone.custom_shape = None
for item in list(bpy.context.scene.objects):
    if item.type == "MESH" and item != mesh:
        bpy.data.objects.remove(item, do_unlink=True)

mesh.name = "SporeStalkerMesh"
mesh.data.name = "SporeStalkerMeshData"
armature.name = "SporeStalkerRig"

# Contract: damp organic hide, zero metalness. Slightly glossier than the Shell
# form's stone so the body reads as living tissue, but well short of a plastic
# highlight that would compete with the spore sac for attention.
for material in mesh.data.materials:
    material.name = "SporeStalkerMaterial"
    material.diffuse_color = (1.0, 1.0, 1.0, 1.0)
    if material.use_nodes and material.node_tree:
        principled = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
        if principled:
            principled.inputs["Metallic"].default_value = 0.0
            principled.inputs["Roughness"].default_value = 0.68


def channelbags(action):
    if not action.layers:
        return []
    layer = action.layers[0]
    if not layer.strips:
        return []
    strip = layer.strips[0]
    return [strip.channelbag(slot) for slot in action.slots if strip.channelbag(slot) is not None]


def remove_scale_curves(action):
    removed = 0
    for channelbag in channelbags(action):
        for curve in list(channelbag.fcurves):
            if curve.data_path.endswith(".scale"):
                channelbag.fcurves.remove(curve)
                removed += 1
    return removed


def amplify_quaternion_motion(action, bone_names, factor, ceiling_degrees=58):
    changed_keys = 0
    paths = {f'pose.bones["{name}"].rotation_quaternion' for name in bone_names}
    for channelbag in channelbags(action):
        grouped = {}
        for curve in channelbag.fcurves:
            if curve.data_path in paths:
                grouped.setdefault(curve.data_path, {})[curve.array_index] = curve
        for curves in grouped.values():
            if set(curves) != {0, 1, 2, 3}:
                continue
            frames = sorted({point.co.x for curve in curves.values() for point in curve.keyframe_points})
            if not frames:
                continue
            base = Quaternion(tuple(curves[index].evaluate(frames[0]) for index in range(4))).normalized()
            samples = []
            for frame in frames:
                original = Quaternion(tuple(curves[index].evaluate(frame) for index in range(4))).normalized()
                delta = base.rotation_difference(original)
                if delta.w < 0:
                    delta = Quaternion(tuple(-value for value in delta))
                amplified_delta = Quaternion(delta.axis, min(delta.angle * factor, math.radians(ceiling_degrees)))
                amplified = (base @ amplified_delta).normalized()
                samples.append((frame, tuple(amplified)))
            for frame, values in samples:
                for index, curve in curves.items():
                    point = min(curve.keyframe_points, key=lambda key: abs(key.co.x - frame))
                    if abs(point.co.x - frame) > 0.001:
                        continue
                    offset = values[index] - point.co.y
                    point.co.y = values[index]
                    point.handle_left.y += offset
                    point.handle_right.y += offset
                    changed_keys += 1
    return changed_keys


def neutralise_root_location(action, bone_name="Hips"):
    """Remove the constant root displacement Meshy bakes into its clips.

    The exported Walking action parks Hips about -0.38 from the bind position and
    only oscillates 0.0075 around it. The authored clips key the rest position
    instead, so entering Walk snapped the body down and left it hovering with the
    torso pulled away from the planted feet. Subtracting each channel's mean
    keeps the cyclic weight bob while restoring the bind height, which is also
    the project's existing division of labour: the runtime owns world
    translation and the clip owns foot plants.
    """
    path = f'pose.bones["{bone_name}"].location'
    shifted = 0
    for channelbag in channelbags(action):
        for curve in channelbag.fcurves:
            if curve.data_path != path or not curve.keyframe_points:
                continue
            mean = sum(point.co.y for point in curve.keyframe_points) / len(curve.keyframe_points)
            if abs(mean) < 1e-9:
                continue
            for point in curve.keyframe_points:
                point.co.y -= mean
                point.handle_left.y -= mean
                point.handle_right.y -= mean
            shifted += 1
    return shifted


def reset_pose():
    for bone in armature.pose.bones:
        bone.rotation_mode = "QUATERNION"
        bone.rotation_quaternion = (1, 0, 0, 0)
        bone.location = (0, 0, 0)
        bone.scale = (1, 1, 1)


def key_full_pose(frame, rotations=None, locations=None):
    reset_pose()
    rotations = rotations or {}
    locations = locations or {}
    for name, rotation in rotations.items():
        armature.pose.bones[name].rotation_quaternion = Euler(rotation, "XYZ").to_quaternion()
    for name, location in locations.items():
        armature.pose.bones[name].location = location
    for bone in armature.pose.bones:
        bone.keyframe_insert(data_path="rotation_quaternion", frame=frame, group=bone.name)
        bone.keyframe_insert(data_path="location", frame=frame, group=bone.name)


def add_nla_track(action, frame_end):
    track = armature.animation_data.nla_tracks.new()
    track.name = action.name
    strip = track.strips.new(action.name, 0, action)
    strip.action_frame_start = 0
    strip.action_frame_end = frame_end


def make_action(name, frame_end, poses):
    action = bpy.data.actions.new(name=name)
    armature.animation_data.action = action
    for frame, rotations, locations in poses:
        key_full_pose(frame, rotations, locations)
    add_nla_track(action, frame_end)
    armature.animation_data.action = None
    return action


def remove_degenerate_uv_faces(mesh, threshold=0.00000001):
    uv_layer = mesh.uv_layers.active
    face_indices = []
    if uv_layer:
        for polygon in mesh.polygons:
            if polygon.loop_total != 3:
                continue
            uv_a, uv_b, uv_c = [uv_layer.data[index].uv for index in polygon.loop_indices]
            signed_area_twice = (uv_b.x - uv_a.x) * (uv_c.y - uv_a.y) - (uv_b.y - uv_a.y) * (uv_c.x - uv_a.x)
            if abs(signed_area_twice) < threshold:
                face_indices.append(polygon.index)
    cleanup_bm = bmesh.new()
    cleanup_bm.from_mesh(mesh)
    cleanup_bm.faces.ensure_lookup_table()
    if face_indices:
        bmesh.ops.delete(cleanup_bm, geom=[cleanup_bm.faces[index] for index in face_indices], context="FACES")
    bmesh.ops.dissolve_degenerate(cleanup_bm, dist=0.000001, edges=list(cleanup_bm.edges))
    bmesh.ops.recalc_face_normals(cleanup_bm, faces=list(cleanup_bm.faces))
    cleanup_bm.to_mesh(mesh)
    cleanup_bm.free()
    mesh.validate(clean_customdata=True)
    mesh.update()
    return len(face_indices)


def remove_invalid_tangent_faces(mesh, threshold=0.0000000001, max_passes=8):
    """Remove only triangles whose UV tangent basis cannot be normalized.

    Blender's glTF exporter writes tangents per split loop. A nearly collapsed
    UV island can survive the area test above yet still yield a zero tangent,
    which glTF Validator correctly rejects. Recalculate the real loop tangents
    and remove the owning triangles until every exported tangent is valid.
    """
    removed_faces = 0
    for _pass_index in range(max_passes):
        mesh.calc_tangents()
        bad_polygon_indices = {
            polygon.index
            for polygon in mesh.polygons
            if any(
                mesh.loops[loop_index].tangent.length_squared <= threshold
                for loop_index in polygon.loop_indices
            )
        }
        mesh.free_tangents()
        if not bad_polygon_indices:
            break

        cleanup_bm = bmesh.new()
        cleanup_bm.from_mesh(mesh)
        cleanup_bm.faces.ensure_lookup_table()
        bmesh.ops.delete(
            cleanup_bm,
            geom=[cleanup_bm.faces[index] for index in sorted(bad_polygon_indices)],
            context="FACES",
        )
        bmesh.ops.recalc_face_normals(cleanup_bm, faces=list(cleanup_bm.faces))
        cleanup_bm.to_mesh(mesh)
        cleanup_bm.free()
        mesh.validate(clean_customdata=True)
        mesh.update()
        removed_faces += len(bad_polygon_indices)
    return removed_faces

# The Walking export arrives at 239,194 triangles - an order of magnitude over
# the stage-1 budget the accepted forms hold (Fang 19,406, Shell 20,391) and 12x
# what the Shell export happened to arrive at. Collapse decimation runs on the
# already-skinned mesh so vertex groups survive it, and it has to sit first in
# the modifier stack or it would be evaluated after the armature deform.
TARGET_RUNTIME_TRIANGLES = 20_000
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
# Collapse decimation leaves a few triangles whose UV island has no area, and
# those export a zero-length tangent that the glTF validator rejects outright.
removed_uv_faces = remove_degenerate_uv_faces(mesh.data)
removed_tangent_faces = remove_invalid_tangent_faces(mesh.data)
runtime_triangles = sum(len(polygon.loop_indices) - 2 for polygon in mesh.data.polygons)

# One-kilopixel maps are the established runtime budget for this character class.
for image in bpy.data.images:
    if image.type == "IMAGE" and max(image.size) > 1024:
        image.scale(1024, 1024)
        image.pack()


def build_spore_emissive_mask(source_image, low=0.30, high=0.62):
    """Restrict self-illumination to the spore sac, speckles and eye.

    Meshy exports emissiveFactor [1,1,1] over the whole base colour texture, so
    every pixel of the body emits its own albedo at full strength. The hide is a
    near-black teal that is supposed to sit in shadow and take lighting; lit
    that way it rendered as flat pale grey and the sac stopped being the
    brightest thing on the creature, which is the one feature the silhouette is
    built around.

    The mask is the texture's own cyan excess - how far green and blue run ahead
    of red - ramped rather than thresholded so the sac keeps a soft edge instead
    of an aliased cut-out.

    The hide is itself teal, so the ramp cannot start near zero. Measured on this
    texture through Blender's own pixel buffer: the body fills p50=0.10 to
    p90=0.17 while the sac, speckles and eye run p95=0.36 to p99=0.77. Ramping
    0.30 to 0.62 splits those two populations and lights roughly the top 6%.

    Measure through Blender rather than offline: reading the same JPEG with an
    outside decoder and converting sRGB to linear by hand gave a median of 0.02
    against Blender's 0.10, and thresholds picked from those numbers lit the
    entire body twice over.
    """
    width, height = source_image.size
    buffer = [0.0] * (width * height * 4)
    source_image.pixels.foreach_get(buffer)
    emissive = bpy.data.images.new("SporeStalkerEmissive", width, height, alpha=True)
    span = max(high - low, 1e-6)
    lit_pixels = 0
    for index in range(0, len(buffer), 4):
        red, green, blue = buffer[index], buffer[index + 1], buffer[index + 2]
        cyan_excess = (green + blue) * 0.5 - red
        weight = min(1.0, max(0.0, (cyan_excess - low) / span))
        if weight > 0.01:
            lit_pixels += 1
        buffer[index] = red * weight
        buffer[index + 1] = green * weight
        buffer[index + 2] = blue * weight
        buffer[index + 3] = 1.0
    emissive.pixels.foreach_set(buffer)
    emissive.pack()
    return emissive, lit_pixels / (width * height)


emissive_image = None
emissive_coverage = 0.0
for material in mesh.data.materials:
    if not (material.use_nodes and material.node_tree):
        continue
    principled = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
    if not principled:
        continue
    base_link = next((link for link in material.node_tree.links
                      if link.to_node == principled and link.to_socket.name == "Base Color"), None)
    if not base_link or not getattr(base_link.from_node, "image", None):
        continue
    emissive_image, emissive_coverage = build_spore_emissive_mask(base_link.from_node.image)
    emissive_node = material.node_tree.nodes.new("ShaderNodeTexImage")
    emissive_node.image = emissive_image
    emissive_node.location = (base_link.from_node.location.x, base_link.from_node.location.y - 340)
    material.node_tree.links.new(emissive_node.outputs["Color"], principled.inputs["Emission Color"])
    principled.inputs["Emission Strength"].default_value = 1.0
    # Meshy also exports a 2x specular colour, which lifts the whole hide again.
    if "Specular Tint" in principled.inputs:
        principled.inputs["Specular Tint"].default_value = (1.0, 1.0, 1.0, 1.0)
    if "Specular IOR Level" in principled.inputs:
        principled.inputs["Specular IOR Level"].default_value = 0.5

bpy.context.view_layer.objects.active = armature

armature.animation_data_create()

LEG_BONES = {
    "frontleg", "frontleg0", "frontleg1", "frontleg2",
    "R_frontleg", "R_frontleg0", "R_frontleg1", "R_frontleg2",
    "backleg", "backleg0", "backleg1", "backleg2",
    "R_backleg", "R_backleg0", "R_backleg1", "R_backleg2",
}

# Keep Meshy's gait rather than re-authoring it: the export already carries real
# keyed motion on all four limbs. Walk is the source cadence; Run amplifies the
# same curves harder than the Shell form's 1.18, because this body's identity is
# speed and a heavy-footed run would read as the wrong animal.
imported = next(iter(bpy.data.actions))
imported.name = "Walk"
removed_scale_curves = remove_scale_curves(imported)
recentred_root_channels = neutralise_root_location(imported)
walk_end = int(imported.frame_range[1])

# glTF animation names come from NLA track names, not action names, so the
# imported track's original name would otherwise ship as a tenth animation.
while armature.animation_data.nla_tracks:
    armature.animation_data.nla_tracks.remove(armature.animation_data.nla_tracks[0])
add_nla_track(imported, walk_end)

run_action = imported.copy()
run_action.name = "Run"
amplified_run_keys = amplify_quaternion_motion(run_action, LEG_BONES, 1.32)
add_nla_track(run_action, walk_end)

# A light animal never fully settles. Idle is quicker than the Shell form's and
# carries a head scan, so a standing creature still reads as alert prey-hunter
# rather than a statue.
make_action(
    "Idle",
    52,
    [
        (0, {}, {}),
        (13, {
            "chest": (math.radians(2.4), 0, 0),
            "head": (math.radians(-2.0), math.radians(4.5), 0),
            "tail1": (0, math.radians(3.0), 0),
            "tail2": (0, math.radians(4.2), 0),
            "tail3": (0, math.radians(5.0), 0),
        }, {"Hips": (0, 0, -0.00012)}),
        (30, {
            "chest": (math.radians(-1.8), 0, 0),
            "head": (math.radians(2.2), math.radians(-5.5), 0),
            "tail1": (0, math.radians(-2.6), 0),
            "tail2": (0, math.radians(-3.8), 0),
            "tail3": (0, math.radians(-4.6), 0),
        }, {"Hips": (0, 0, 0.00010)}),
        (52, {}, {}),
    ],
)

make_action(
    "Turn",
    22,
    [
        (0, {}, {}),
        (8, {
            "Hips": (0, math.radians(-9), 0),
            "chest": (0, math.radians(-7), 0),
            "head": (0, math.radians(-11), 0),
            "frontleg0": (math.radians(-7), 0, 0),
            "R_frontleg0": (math.radians(6), 0, 0),
            "tail1": (0, math.radians(8), 0),
            "tail2": (0, math.radians(11), 0),
            "tail3": (0, math.radians(13), 0),
        }, {"Hips": (0, 0, -0.00016)}),
        (15, {
            "Hips": (0, math.radians(5), 0),
            "chest": (0, math.radians(4), 0),
            "head": (0, math.radians(7), 0),
            "tail1": (0, math.radians(-4), 0),
            "tail2": (0, math.radians(-6), 0),
        }, {}),
        (22, {}, {}),
    ],
)

# Bite opens the chain. The long neck does the work, so the reach comes from the
# head and chest rather than a step forward.
make_action(
    "Bite",
    20,
    [
        (0, {}, {}),
        (5, {
            "Hips": (math.radians(-3), 0, 0),
            "chest": (math.radians(9), 0, 0),
            "head": (math.radians(13), 0, 0),
        }, {"Hips": (0, 0, -0.00034)}),
        (8, {
            "Hips": (math.radians(3), 0, 0),
            "chest": (math.radians(-12), 0, 0),
            "head": (math.radians(-19), 0, 0),
            "tail1": (0, math.radians(3), 0),
            "tail2": (0, math.radians(4), 0),
        }, {"Hips": (0, 0, -0.00010)}),
        (13, {"chest": (math.radians(-4), 0, 0), "head": (math.radians(-6), 0, 0)}, {}),
        (20, {}, {}),
    ],
)

# Claw is a two-paw rake inside a single clip: left lead, then right. The chain
# plays it twice in a row, and one paw repeated would read as a stutter while a
# built-in alternation reads as a flurry. Short and shallow - this is the cheap
# middle of the chain, not a payoff.
make_action(
    "Claw",
    18,
    [
        (0, {}, {}),
        (3, {
            "chest": (math.radians(4), math.radians(-7), 0),
            "head": (math.radians(3), math.radians(-6), 0),
            "frontleg": (math.radians(-21), 0, 0),
            "frontleg0": (math.radians(-17), 0, 0),
            "tail1": (0, math.radians(5), 0),
        }, {"Hips": (0, 0, -0.00022)}),
        (7, {
            "chest": (math.radians(-3), math.radians(6), 0),
            "head": (math.radians(-4), math.radians(5), 0),
            "frontleg": (math.radians(16), 0, 0),
            "frontleg0": (math.radians(13), 0, 0),
            "R_frontleg": (math.radians(-19), 0, 0),
            "R_frontleg0": (math.radians(-15), 0, 0),
            "tail1": (0, math.radians(-4), 0),
        }, {"Hips": (0, 0, -0.00010)}),
        (12, {
            "chest": (math.radians(-2), math.radians(-4), 0),
            "head": (math.radians(-3), math.radians(-3), 0),
            "R_frontleg": (math.radians(14), 0, 0),
            "R_frontleg0": (math.radians(11), 0, 0),
            "tail1": (0, math.radians(3), 0),
        }, {}),
        (18, {}, {}),
    ],
)

# Pounce is this form's signature and the thing the Shell form could not do.
# Four beats: coil onto the hind legs, launch, an airborne frame with the body
# extended and the tail streamed out as a counterweight, then a absorbed landing
# on bent forelimbs. The airborne frame is what sells it, so it gets the largest
# root rise in the whole set.
make_action(
    "Pounce",
    34,
    [
        (0, {}, {}),
        (9, {
            "Hips": (math.radians(-13), 0, 0),
            "chest": (math.radians(11), 0, 0),
            "head": (math.radians(9), 0, 0),
            "backleg": (math.radians(17), 0, 0),
            "backleg0": (math.radians(22), 0, 0),
            "R_backleg": (math.radians(17), 0, 0),
            "R_backleg0": (math.radians(22), 0, 0),
            "frontleg0": (math.radians(-9), 0, 0),
            "R_frontleg0": (math.radians(-9), 0, 0),
            "tail1": (0, math.radians(-5), 0),
            "tail2": (0, math.radians(-7), 0),
        }, {"Hips": (0, 0, -0.00120)}),
        (15, {
            "Hips": (math.radians(9), 0, 0),
            "chest": (math.radians(-7), 0, 0),
            "head": (math.radians(-11), 0, 0),
            "backleg": (math.radians(-19), 0, 0),
            "backleg0": (math.radians(-24), 0, 0),
            "R_backleg": (math.radians(-19), 0, 0),
            "R_backleg0": (math.radians(-24), 0, 0),
            "frontleg": (math.radians(-16), 0, 0),
            "frontleg0": (math.radians(-21), 0, 0),
            "R_frontleg": (math.radians(-16), 0, 0),
            "R_frontleg0": (math.radians(-21), 0, 0),
            "tail1": (0, math.radians(7), 0),
            "tail2": (0, math.radians(10), 0),
            "tail3": (0, math.radians(12), 0),
        }, {"Hips": (0, 0, 0.00210)}),
        (21, {
            "Hips": (math.radians(-6), 0, 0),
            "chest": (math.radians(8), 0, 0),
            "head": (math.radians(12), 0, 0),
            "frontleg": (math.radians(14), 0, 0),
            "frontleg0": (math.radians(19), 0, 0),
            "R_frontleg": (math.radians(14), 0, 0),
            "R_frontleg0": (math.radians(19), 0, 0),
            "backleg0": (math.radians(13), 0, 0),
            "R_backleg0": (math.radians(13), 0, 0),
            "tail1": (0, math.radians(-6), 0),
            "tail2": (0, math.radians(-9), 0),
        }, {"Hips": (0, 0, -0.00095)}),
        (27, {
            "Hips": (math.radians(-2), 0, 0),
            "chest": (math.radians(3), 0, 0),
            "head": (math.radians(4), 0, 0),
            "frontleg0": (math.radians(6), 0, 0),
            "R_frontleg0": (math.radians(6), 0, 0),
        }, {"Hips": (0, 0, -0.00028)}),
        (34, {}, {}),
    ],
)

# The tail is long, thin and lightly weighted, so it whips: the tip leads the
# base by a wide margin. The Shell form braced its legs to plant a heavy body;
# this one lets the whole body counter-rotate instead, which is what a light
# animal actually does.
make_action(
    "TailSwipe",
    30,
    [
        (0, {}, {}),
        (7, {
            "Hips": (math.radians(-3), math.radians(-19), 0),
            "chest": (math.radians(2), math.radians(12), 0),
            "head": (0, math.radians(9), 0),
            "tail": (0, math.radians(-11), 0),
            "tailstart": (0, math.radians(-15), 0),
            "tail1": (0, math.radians(-21), 0),
            "tail2": (0, math.radians(-27), 0),
            "tail3": (0, math.radians(-32), 0),
            "backleg0": (math.radians(4), 0, math.radians(5)),
            "R_backleg0": (math.radians(4), 0, math.radians(-5)),
        }, {"Hips": (0, 0, -0.00026)}),
        (16, {
            "Hips": (math.radians(-1), math.radians(27), 0),
            "chest": (math.radians(-2), math.radians(-16), 0),
            "head": (0, math.radians(-12), 0),
            "tail": (0, math.radians(14), 0),
            "tailstart": (0, math.radians(19), 0),
            "tail1": (0, math.radians(26), 0),
            "tail2": (0, math.radians(33), 0),
            "tail3": (0, math.radians(39), 0),
            "backleg0": (math.radians(4), 0, math.radians(-4)),
            "R_backleg0": (math.radians(4), 0, math.radians(4)),
        }, {"Hips": (0, 0, -0.00014)}),
        # The chain's last step ends the creature already leaning off the
        # target with its weight over the hind legs, rather than settling back
        # to neutral. The disengage is a pose, not translation: world movement
        # belongs to the runtime, and a clip that walked the body backwards
        # would fight the approach order that walked it in.
        (23, {
            "Hips": (math.radians(7), math.radians(11), 0),
            "chest": (math.radians(-6), math.radians(-8), 0),
            "head": (math.radians(-9), math.radians(-7), 0),
            "frontleg": (math.radians(12), 0, 0),
            "frontleg0": (math.radians(9), 0, 0),
            "R_frontleg": (math.radians(11), 0, 0),
            "R_frontleg0": (math.radians(8), 0, 0),
            "backleg0": (math.radians(-8), 0, 0),
            "R_backleg0": (math.radians(-8), 0, 0),
            "tail1": (0, math.radians(9), 0),
            "tail2": (0, math.radians(12), 0),
            "tail3": (0, math.radians(14), 0),
        }, {"Hips": (0, 0, 0.00030)}),
        (30, {
            "Hips": (math.radians(3), math.radians(4), 0),
            "chest": (math.radians(-2), math.radians(-3), 0),
            "head": (math.radians(-4), math.radians(-3), 0),
        }, {"Hips": (0, 0, 0.00010)}),
    ],
)

# A fragile body takes a hit hard: more recoil than the armoured form, and the
# long neck whips further than the torso.
make_action(
    "Hit",
    16,
    [
        (0, {}, {}),
        (4, {
            "Hips": (math.radians(8), 0, math.radians(6)),
            "chest": (math.radians(12), 0, math.radians(9)),
            "head": (math.radians(17), 0, math.radians(8)),
            "frontleg0": (math.radians(9), 0, 0),
            "R_frontleg0": (math.radians(6), 0, 0),
            "tail1": (0, math.radians(-7), 0),
            "tail2": (0, math.radians(-10), 0),
        }, {"Hips": (0, 0, -0.00040)}),
        (9, {
            "chest": (math.radians(-4), 0, math.radians(-3)),
            "head": (math.radians(-6), 0, 0),
            "tail1": (0, math.radians(4), 0),
        }, {}),
        (16, {}, {}),
    ],
)

# Legs fold before the body goes down - a light animal collapses rather than
# topples. The last two keys are identical so the clip holds its final pose.
make_action(
    "Death",
    42,
    [
        (0, {}, {}),
        (7, {
            "Hips": (math.radians(-8), 0, 0),
            "chest": (math.radians(12), 0, 0),
            "head": (math.radians(15), 0, 0),
        }, {"Hips": (0, 0, 0.00022)}),
        (20, {
            "Hips": (math.radians(6), 0, math.radians(15)),
            "chest": (math.radians(-8), 0, math.radians(19)),
            "head": (math.radians(-12), 0, math.radians(14)),
            "frontleg": (math.radians(19), 0, 0),
            "frontleg0": (math.radians(26), 0, 0),
            "R_frontleg": (math.radians(17), 0, 0),
            "R_frontleg0": (math.radians(24), 0, 0),
            "backleg0": (math.radians(20), 0, 0),
            "R_backleg0": (math.radians(22), 0, 0),
            "tail1": (0, math.radians(11), 0),
            "tail2": (0, math.radians(15), 0),
            "tail3": (0, math.radians(18), 0),
        }, {"Hips": (0, 0, -0.00135)}),
        (32, {
            "Hips": (math.radians(4), 0, math.radians(20)),
            "chest": (math.radians(-4), 0, math.radians(23)),
            "head": (math.radians(-7), 0, math.radians(18)),
            "frontleg": (math.radians(21), 0, 0),
            "frontleg0": (math.radians(28), 0, 0),
            "R_frontleg": (math.radians(19), 0, 0),
            "R_frontleg0": (math.radians(26), 0, 0),
            "backleg0": (math.radians(22), 0, 0),
            "R_backleg0": (math.radians(24), 0, 0),
            "tail1": (0, math.radians(13), 0),
            "tail2": (0, math.radians(17), 0),
            "tail3": (0, math.radians(21), 0),
        }, {"Hips": (0, 0, -0.00152)}),
        (42, {
            "Hips": (math.radians(4), 0, math.radians(20)),
            "chest": (math.radians(-4), 0, math.radians(23)),
            "head": (math.radians(-7), 0, math.radians(18)),
            "frontleg": (math.radians(21), 0, 0),
            "frontleg0": (math.radians(28), 0, 0),
            "R_frontleg": (math.radians(19), 0, 0),
            "R_frontleg0": (math.radians(26), 0, 0),
            "backleg0": (math.radians(22), 0, 0),
            "R_backleg0": (math.radians(24), 0, 0),
            "tail1": (0, math.radians(13), 0),
            "tail2": (0, math.radians(17), 0),
            "tail3": (0, math.radians(21), 0),
        }, {"Hips": (0, 0, -0.00152)}),
    ],
)

armature.animation_data.action = None
reset_pose()

# glTF requires a skinned mesh at a scene root. Preserve the bind matrix while
# clearing the Blender parent; the armature modifier keeps the skin relation.
mesh_world = mesh.matrix_world.copy()
mesh.parent = None
mesh.matrix_world = mesh_world

bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
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

print("EA_SPORE_STALKER_PROCESS=" + json.dumps({
    "source": str(source_path),
    "output": str(output_path),
    "blend": str(blend_path),
    "mesh": mesh.name,
    "source_triangles": source_triangles,
    "runtime_triangles": runtime_triangles,
    "removed_degenerate_uv_faces": removed_uv_faces,
    "removed_invalid_tangent_faces": removed_tangent_faces,
    "emissive_mask_coverage": round(emissive_coverage, 5),
    "bones": [bone.name for bone in armature.data.bones],
    "actions": sorted(action.name for action in bpy.data.actions),
    "removed_imported_scale_curves": removed_scale_curves,
    "recentred_root_location_channels": recentred_root_channels,
    "amplified_run_quaternion_keys": amplified_run_keys,
}, ensure_ascii=False))
