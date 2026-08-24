"""Turn the Meshy quadruped Walking export into the Shell stage-2 runtime GLB.

Source is Meshy's official quadruped rig again. Its 27 bones were diffed against
the shipped Shell stage-1 runtime and are byte-for-byte the same set, so the
existing rig mapping, axis conventions (X pitch, Y yaw, Z roll) and pose
vocabulary all carry over unchanged. That is why this script is close to
`process_stone_pangolin_meshy.py` and deliberately stays close to it.

Two things are different from every previous creature in this project:

1. **No decimation.** The export arrives at 20,660 triangles, already inside the
   contract's 20,000-24,000 runtime budget. The stage-1 Shell source was
   1,986,110 and the Swarm source 239,194, both of which needed staged collapse.
   Decimating here would round off the hard lifted lips on the megalith slabs,
   and those lips are this form's identity - it is the one creature where the
   cheap thing and the right thing agree.

2. **Smooth shading is not forced.** The stage-1 script sets every polygon
   smooth after decimation. This body reads as cracked cliff rock and the source
   normals already carry that faceting, so they are left alone.

The Icosphere viewport helper ships as a second, unskinned mesh as usual. It is
2.0 units across against a creature 0.017 units across, so until it is deleted
it *is* the bounding box: it silently corrupted two separate proportion readings
during source review and rendered the first review turntable as a single speck.

Attack vocabulary is Bite -> Slam -> TailSwipe, inherited from Shell stage 1.
Pounce stays absent for the same anatomical reason. What changes is weight and
where the payoff sits: the source carries a fused stone club at the tail tip, so
TailSwipe stops being a sweep and becomes a mace strike, and it is the heaviest
single blow in the chain rather than the lightest.

Usage:
  blender --background --python scripts/blender/process_basalt_bulwark_meshy.py \
      -- source.glb public/assets/quality-3d/models/basalt-bulwark-rigged-v1.glb
"""

import json
import math
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Euler, Quaternion


if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python process_basalt_bulwark_meshy.py -- source.glb output.glb")

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
removed_helper_meshes = 0
for item in list(bpy.context.scene.objects):
    if item.type == "MESH" and item != mesh:
        removed_helper_meshes += 1
        bpy.data.objects.remove(item, do_unlink=True)

mesh.name = "BasaltBulwarkMesh"
mesh.data.name = "BasaltBulwarkMeshData"
armature.name = "BasaltBulwarkRig"

# Contract: matte stone, zero metalness. Rougher than the Swarm hide and rougher
# than the Shell stage-1 plates, because this surface is cracked cliff rock
# rather than smooth shell. No emissive: the runtime's default grade for this
# form clamps roughness and leaves the normal map at full strength, which is
# where the slab relief lives.
for material in mesh.data.materials:
    material.name = "BasaltBulwarkMaterial"
    material.diffuse_color = (1.0, 1.0, 1.0, 1.0)
    if material.use_nodes and material.node_tree:
        principled = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
        if principled:
            principled.inputs["Metallic"].default_value = 0.0
            principled.inputs["Roughness"].default_value = 0.78


def channelbags(action):
    if not action.layers:
        return []
    layer = action.layers[0]
    if not layer.strips:
        return []
    strip = layer.strips[0]
    return [strip.channelbag(slot) for slot in action.slots if strip.channelbag(slot) is not None]


def remove_scale_curves(action):
    """The runtime forbids non-unit bone scale and reports maximum deviation as 0.

    Meshy keys a constant uniform scale on Hips. Removing it is safe because it
    is constant and uniform, and the runtime normalises to the world height.
    """
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

    Subtracting each channel's mean keeps the cyclic weight bob while restoring
    the bind height. The runtime owns world translation; the clip owns foot
    plants. Left in, entering Walk snaps the body off its planted feet.
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


def remove_degenerate_uv_faces(mesh_data, threshold=0.00000001):
    uv_layer = mesh_data.uv_layers.active
    face_indices = []
    if uv_layer:
        for polygon in mesh_data.polygons:
            if polygon.loop_total != 3:
                continue
            uv_a, uv_b, uv_c = [uv_layer.data[index].uv for index in polygon.loop_indices]
            signed_area_twice = (uv_b.x - uv_a.x) * (uv_c.y - uv_a.y) - (uv_b.y - uv_a.y) * (uv_c.x - uv_a.x)
            if abs(signed_area_twice) < threshold:
                face_indices.append(polygon.index)
    cleanup_bm = bmesh.new()
    cleanup_bm.from_mesh(mesh_data)
    cleanup_bm.faces.ensure_lookup_table()
    if face_indices:
        bmesh.ops.delete(cleanup_bm, geom=[cleanup_bm.faces[index] for index in face_indices], context="FACES")
    bmesh.ops.dissolve_degenerate(cleanup_bm, dist=0.000001, edges=list(cleanup_bm.edges))
    bmesh.ops.recalc_face_normals(cleanup_bm, faces=list(cleanup_bm.faces))
    cleanup_bm.to_mesh(mesh_data)
    cleanup_bm.free()
    mesh_data.validate(clean_customdata=True)
    mesh_data.update()
    return len(face_indices)


def remove_invalid_tangent_faces(mesh_data, threshold=0.0000000001, max_passes=8):
    """Remove only triangles whose UV tangent basis cannot be normalized.

    glTF Validator rejects zero-length tangents, and a nearly collapsed UV island
    can survive the area test above yet still produce one.
    """
    removed_faces = 0
    for _pass_index in range(max_passes):
        mesh_data.calc_tangents()
        bad_polygon_indices = {
            polygon.index
            for polygon in mesh_data.polygons
            if any(
                mesh_data.loops[loop_index].tangent.length_squared <= threshold
                for loop_index in polygon.loop_indices
            )
        }
        mesh_data.free_tangents()
        if not bad_polygon_indices:
            break
        cleanup_bm = bmesh.new()
        cleanup_bm.from_mesh(mesh_data)
        cleanup_bm.faces.ensure_lookup_table()
        bmesh.ops.delete(
            cleanup_bm,
            geom=[cleanup_bm.faces[index] for index in sorted(bad_polygon_indices)],
            context="FACES",
        )
        bmesh.ops.recalc_face_normals(cleanup_bm, faces=list(cleanup_bm.faces))
        cleanup_bm.to_mesh(mesh_data)
        cleanup_bm.free()
        mesh_data.validate(clean_customdata=True)
        mesh_data.update()
        removed_faces += len(bad_polygon_indices)
    return removed_faces


source_triangles = sum(len(polygon.loop_indices) - 2 for polygon in mesh.data.polygons)
removed_uv_faces = remove_degenerate_uv_faces(mesh.data)
removed_tangent_faces = remove_invalid_tangent_faces(mesh.data)
runtime_triangles = sum(len(polygon.loop_indices) - 2 for polygon in mesh.data.polygons)

# One-kilopixel maps are the established runtime budget for this character class.
resized_images = 0
for image in bpy.data.images:
    if image.type == "IMAGE" and max(image.size) > 1024:
        image.scale(1024, 1024)
        image.pack()
        resized_images += 1

armature.animation_data_create()

LEG_BONES = {
    "frontleg", "frontleg0", "frontleg1", "frontleg2",
    "R_frontleg", "R_frontleg0", "R_frontleg1", "R_frontleg2",
    "backleg", "backleg0", "backleg1", "backleg2",
    "R_backleg", "R_backleg0", "R_backleg1", "R_backleg2",
}

imported = next(iter(bpy.data.actions))
imported.name = "Walk"
removed_scale_curves = remove_scale_curves(imported)
recentred_root_channels = neutralise_root_location(imported)
walk_end = int(imported.frame_range[1])

# glTF animation names come from NLA track names, not action names. The import
# leaves a track carrying Meshy's original name; clear it or that name ships as
# a tenth animation.
while armature.animation_data.nla_tracks:
    armature.animation_data.nla_tracks.remove(armature.animation_data.nla_tracks[0])
add_nla_track(imported, walk_end)

# Run amplifies the source gait less than the lighter forms do. A body this wide
# does not lengthen its stride when it hurries; it drives harder into the same
# one. Stage-1 Shell used 1.18; this is heavier still.
run_action = imported.copy()
run_action.name = "Run"
amplified_run_keys = amplify_quaternion_motion(run_action, LEG_BONES, 1.12)
add_nla_track(run_action, walk_end)

# Idle: almost nothing moves. Stage-1 Shell breathes at the chest; this body is
# heavier again, so the amplitude drops and the cycle lengthens.
make_action(
    "Idle",
    72,
    [
        (0, {}, {}),
        (20, {
            "chest": (math.radians(1.2), 0, 0),
            "head": (math.radians(-0.9), 0, 0),
            "tail1": (0, math.radians(1.0), 0),
            "tail2": (0, math.radians(1.3), 0),
        }, {"Hips": (0, 0, -0.00006)}),
        (46, {
            "chest": (math.radians(-0.9), 0, 0),
            "head": (math.radians(1.1), 0, 0),
            "tail1": (0, math.radians(-0.9), 0),
            "tail2": (0, math.radians(-1.2), 0),
        }, {"Hips": (0, 0, 0.00005)}),
        (72, {}, {}),
    ],
)

# Turn: the widest body in the game pivots slowly and leans into it.
make_action(
    "Turn",
    30,
    [
        (0, {}, {}),
        (11, {
            "Hips": (0, math.radians(-5), math.radians(2)),
            "chest": (0, math.radians(-4), math.radians(2)),
            "head": (0, math.radians(-6), 0),
            "frontleg0": (math.radians(-4), 0, 0),
            "R_frontleg0": (math.radians(3), 0, 0),
            "tail1": (0, math.radians(4), 0),
            "tail2": (0, math.radians(6), 0),
        }, {"Hips": (0, 0, -0.00010)}),
        (21, {
            "Hips": (0, math.radians(3), 0),
            "chest": (0, math.radians(2), 0),
            "head": (0, math.radians(4), 0),
            "tail1": (0, math.radians(-2), 0),
        }, {}),
        (30, {}, {}),
    ],
)

# Bite is the chain's fast opener and stays the cheapest step.
#
# Re-authored after review: the first pass moved Hips, chest and head together,
# which is the same "front end pitches down" gesture Slam makes. At 13.3% screen
# height a 16-degree version and a 20-degree version of one gesture are the same
# animation, and the owner read them as identical. The two steps are now
# separated by *shape* rather than by degrees: Bite is local and the body barely
# moves, so the head carries the whole read - and it swings further than before
# (42 degrees peak to peak) precisely because nothing else is competing with it.
#
# Length is 14 frames at 24 fps = 0.58s, matching biteDurationSeconds exactly, so
# the clip is no longer cut off two thirds through.
make_action(
    "Bite",
    14,
    [
        (0, {}, {}),
        (4, {
            "chest": (math.radians(3), 0, 0),
            "head": (math.radians(15), 0, 0),
        }, {}),
        # Contact frame, at 7/24 = 0.29s = biteContactSeconds.
        (7, {
            "chest": (math.radians(-5), 0, 0),
            "head": (math.radians(-27), 0, 0),
        }, {"Hips": (0, 0, -0.00010)}),
        (10, {"head": (math.radians(-8), 0, 0)}, {}),
        (14, {}, {}),
    ],
)

# Slam is the signature, and after review it is where the whole difference
# between the two steps has to live.
#
# The owner's direction: let the body rise up first, then pitch forward and down.
# That is right, and it is what the stage-1 contract already asked for - "visible
# anticipation, a hard contact frame and a slow recovery" - which the first pass
# under-delivered at 14 degrees of lean.
#
# It now rears onto the hind legs through 30 degrees of Hips pitch, HOLDS there
# for four frames so the tell is readable, then drives 52 degrees the other way
# into the ground. Peak-to-peak on the chest is 60 degrees against the first
# pass's 38. The lift is carried mostly by rotation rather than by translating
# Hips upward, so the pivot stays over the planted hind feet instead of the whole
# animal floating off the terrain.
#
# 29 frames at 24 fps = 1.20s, matching pounceDurationSeconds, with contact on
# frame 18 = 0.75s = pounceContactSeconds.
_rear = {
    "Hips": (math.radians(-30), 0, 0),
    "chest": (math.radians(28), 0, 0),
    "head": (math.radians(15), 0, 0),
    "frontleg": (math.radians(-34), 0, 0),
    "frontleg0": (math.radians(-38), 0, 0),
    "R_frontleg": (math.radians(-34), 0, 0),
    "R_frontleg0": (math.radians(-38), 0, 0),
    "backleg0": (math.radians(18), 0, 0),
    "R_backleg0": (math.radians(18), 0, 0),
    "tail1": (0, math.radians(-6), 0),
    "tail2": (0, math.radians(-8), 0),
}
make_action(
    "Slam",
    29,
    [
        (0, {}, {}),
        (9, _rear, {"Hips": (0, 0, 0.00110)}),
        # Hold. Four frames of a heavy animal balanced where it cannot stay.
        (13, _rear, {"Hips": (0, 0, 0.00120)}),
        (18, {
            "Hips": (math.radians(22), 0, 0),
            "chest": (math.radians(-32), 0, 0),
            "head": (math.radians(-24), 0, 0),
            "frontleg": (math.radians(26), 0, 0),
            "frontleg0": (math.radians(30), 0, 0),
            "R_frontleg": (math.radians(26), 0, 0),
            "R_frontleg0": (math.radians(30), 0, 0),
            "backleg0": (math.radians(-12), 0, 0),
            "R_backleg0": (math.radians(-12), 0, 0),
            "tail1": (0, math.radians(10), 0),
            "tail2": (0, math.radians(13), 0),
            "tail3": (0, math.radians(14), 0),
        }, {"Hips": (0, 0, -0.00135)}),
        (23, {
            "Hips": (math.radians(7), 0, 0),
            "chest": (math.radians(-10), 0, 0),
            "head": (math.radians(-8), 0, 0),
        }, {"Hips": (0, 0, -0.00040)}),
        (29, {}, {}),
    ],
)

# TailSwipe is the step stage 2 actually changes. The source carries a fused
# stone club at the tip, so this is no longer the light sweep it was at stage 1:
# it is a mace on a short lever. That changes the motion in a specific way -
# a club does not whip. Stage 1 escalated the per-segment yaw down the tail
# (tail1 13 -> tail3 18) to read as a lash. Here the tail stays comparatively
# straight and the power comes from the hips rotating the whole lever, so the
# segment angles are nearly flat and Hips yaw is much larger.
brace = {
    "frontleg0": (math.radians(-6), 0, math.radians(4)),
    "R_frontleg0": (math.radians(-6), 0, math.radians(-4)),
    "backleg0": (math.radians(7), 0, math.radians(5)),
    "R_backleg0": (math.radians(7), 0, math.radians(-5)),
}
# Retimed to 32 frames at 24 fps = 1.35s, matching tailSwipeDurationSeconds, with
# contact on frame 20 = 0.83s. The shape is unchanged - the owner accepted this
# one - only its length now fits the window it is played inside.
make_action(
    "TailSwipe",
    32,
    [
        (0, {}, {}),
        # Long coil. The club has to be seen going back before it comes round.
        (10, {**brace,
            "Hips": (math.radians(-4), math.radians(-24), 0),
            "chest": (math.radians(4), math.radians(13), 0),
            "head": (0, math.radians(9), 0),
            "tail": (0, math.radians(-12), 0),
            "tailstart": (0, math.radians(-13), 0),
            "tail1": (0, math.radians(-14), 0),
            "tail2": (0, math.radians(-15), 0),
            "tail3": (0, math.radians(-15), 0),
        }, {"Hips": (0, 0, -0.00036)}),
        # Contact. Hips carry the swing; the tail is a rigid lever, not a lash.
        (20, {**brace,
            "Hips": (math.radians(-2), math.radians(34), 0),
            "chest": (math.radians(-3), math.radians(-18), 0),
            "head": (0, math.radians(-12), 0),
            "tail": (0, math.radians(16), 0),
            "tailstart": (0, math.radians(18), 0),
            "tail1": (0, math.radians(19), 0),
            "tail2": (0, math.radians(20), 0),
            "tail3": (0, math.radians(20), 0),
        }, {"Hips": (0, 0, -0.00020)}),
        # Overrun: the mass keeps going past the target before it can be stopped.
        (26, {
            "Hips": (math.radians(-1), math.radians(14), 0),
            "chest": (0, math.radians(-7), 0),
            "tail1": (0, math.radians(8), 0),
            "tail2": (0, math.radians(9), 0),
            "tail3": (0, math.radians(9), 0),
        }, {"Hips": (0, 0, -0.00010)}),
        (32, {}, {}),
    ],
)

make_action(
    "Hit",
    20,
    [
        (0, {}, {}),
        (5, {
            "Hips": (math.radians(5), 0, math.radians(3)),
            "chest": (math.radians(7), 0, math.radians(5)),
            "head": (math.radians(9), 0, math.radians(4)),
            "frontleg0": (math.radians(5), 0, 0),
            "R_frontleg0": (math.radians(3), 0, 0),
        }, {"Hips": (0, 0, -0.00026)}),
        (12, {
            "chest": (math.radians(-2), 0, math.radians(-2)),
            "head": (math.radians(-3), 0, 0),
        }, {}),
        (20, {}, {}),
    ],
)

# Death: this body does not flip. It is the heaviest thing in the game and it
# goes down onto its own mass - legs fold, the front drops first, the plates
# settle last. Stage 1 rolled to 17 degrees; this stops at 13, because a wider
# body has further to go before it would topple and stopping short reads as
# weight rather than as an incomplete animation.
make_action(
    "Death",
    52,
    [
        (0, {}, {}),
        (9, {
            "Hips": (math.radians(-6), 0, 0),
            "chest": (math.radians(9), 0, 0),
            "head": (math.radians(11), 0, 0),
        }, {"Hips": (0, 0, 0.00018)}),
        (26, {
            "Hips": (math.radians(6), 0, math.radians(9)),
            "chest": (math.radians(-7), 0, math.radians(12)),
            "head": (math.radians(-11), 0, math.radians(9)),
            "frontleg0": (math.radians(17), 0, 0),
            "R_frontleg0": (math.radians(15), 0, 0),
            "backleg0": (math.radians(13), 0, 0),
            "R_backleg0": (math.radians(15), 0, 0),
            "tail1": (0, math.radians(8), 0),
            "tail2": (0, math.radians(10), 0),
        }, {"Hips": (0, 0, -0.00098)}),
        (40, {
            "Hips": (math.radians(4), 0, math.radians(13)),
            "chest": (math.radians(-4), 0, math.radians(15)),
            "head": (math.radians(-6), 0, math.radians(12)),
            "frontleg0": (math.radians(19), 0, 0),
            "R_frontleg0": (math.radians(17), 0, 0),
            "backleg0": (math.radians(15), 0, 0),
            "R_backleg0": (math.radians(17), 0, 0),
            "tail1": (0, math.radians(10), 0),
            "tail2": (0, math.radians(12), 0),
        }, {"Hips": (0, 0, -0.00118)}),
        (52, {
            "Hips": (math.radians(4), 0, math.radians(13)),
            "chest": (math.radians(-4), 0, math.radians(15)),
            "head": (math.radians(-6), 0, math.radians(12)),
            "frontleg0": (math.radians(19), 0, 0),
            "R_frontleg0": (math.radians(17), 0, 0),
            "backleg0": (math.radians(15), 0, 0),
            "R_backleg0": (math.radians(17), 0, 0),
            "tail1": (0, math.radians(10), 0),
            "tail2": (0, math.radians(12), 0),
        }, {"Hips": (0, 0, -0.00118)}),
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

print("EA_BASALT_BULWARK_PROCESS=" + json.dumps({
    "source": str(source_path),
    "output": str(output_path),
    "blend": str(blend_path),
    "mesh": mesh.name,
    "removed_helper_meshes": removed_helper_meshes,
    "source_triangles": source_triangles,
    "runtime_triangles": runtime_triangles,
    "decimated": False,
    "removed_degenerate_uv_faces": removed_uv_faces,
    "removed_invalid_tangent_faces": removed_tangent_faces,
    "resized_images": resized_images,
    "bones": [bone.name for bone in armature.data.bones],
    "actions": sorted(action.name for action in bpy.data.actions),
    "removed_imported_scale_curves": removed_scale_curves,
    "recentred_root_location_channels": recentred_root_channels,
    "amplified_run_quaternion_keys": amplified_run_keys,
}, ensure_ascii=False))
