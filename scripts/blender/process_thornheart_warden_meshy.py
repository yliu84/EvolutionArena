"""Turn the Meshy quadruped Walking export into the Gloamwood boss runtime GLB.

The Thornheart Warden is the first *modelled* boss in the Gloamwood. Until now
it was about thirty primitives whose entire attack animation was one line -
`body.position.x = strike * 0.65` - shared identically by all three patterns.
Root Slam, Thorn Charge and Spore Ring moved the body the same way and were told
apart only by their ground decals. Authoring three clips that read apart is the
main reason this model exists, not the mesh.

Same 27-bone Meshy quadruped template as every player form, so the rig mapping,
axis conventions and pose vocabulary carry over from
`process_lantern_lynx_meshy.py`. Three things differ and are worth stating:

1. **Bone axis signs were measured, not eyeballed.** The first pass read them off
   rendered poses and got `chest` and `head` backwards, so the rear-up in Slam
   came out as a belly-flop. Reading a sign off a render is unreliable on a
   creature this squat - a raised front and a dropped rear look alike from a
   three-quarter camera. The signs below come from evaluating the depsgraph and
   printing the world Z of `headend`, `frontleg2` and `backleg2` per pose, which
   is unambiguous. They are recorded in the table further down.

2. **The clips are boss patterns, not a player chain.** Each is authored so its
   contact lands at `telegraph / (telegraph + attack)` of the clip, because
   `gloamwoodBossClipRate` stretches the clip onto exactly that window.

3. **The glow is violet, not cyan**, so the emissive mask is built from violet
   excess. Measured through Blender's own pixel buffer, the separation is much
   cleaner than any earlier form's: violet excess is p90=0.059 and p95=0.537, so
   the seams and eyes sit in a band the teal hide never reaches.

Two source conditions are repaired here.

* `Hips` carries a constant uniform 0.841 scale key. The runtime forbids
  non-unit bone scale and reports maximum deviation, which must be 0.

* **The neck craters during Walk**, reported by the owner from play twice.
  The first attempt damped `head` and `headend` rotation, because that is what
  fixed the same-sounding fault on the Swarm stage-2 form. It did nothing, and
  the reason is worth recording: on the Swarm form the sink really is driven by
  head rotation - putting the rotation back brings the sink back - whereas here
  the crater is **fully open at Walk frame 0 with head rotation at exactly
  zero**. Same symptom, different cause; the cure did not transfer.

  What the crater does track is which clip is playing. With no animation the
  neck is smooth, and every clip authored in this script is smooth, at every
  frame. Only Meshy's own Walk export craters. So the Walk is authored here too
  rather than imported, and the source clip is discarded.

  Ruled out along the way, each by rendering rather than by argument: damping
  `head`, `headend`, `chest` or `Hips` (no change at any factor down to zero);
  clearing the leg and Hips weight bleed off the neck vertices (worse - it
  opens a larger hole); smoothing vertex weights, globally or only around the
  saddle (tears the mesh); rebinding with automatic or envelope weights
  (destroys the model); and non-normalised or multi-set skin weights (the
  export has a single influence set summing to exactly 1.0 everywhere).

No decimation: the export arrives at 18,818 triangles, already inside budget.
The guard stays so a heavier re-export is collapsed rather than shipped.

Usage:
  blender --background --python scripts/blender/process_thornheart_warden_meshy.py \
      -- source.glb public/assets/quality-3d/models/thornheart-warden-runtime-v1.glb
"""

import json
import math
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Euler, Quaternion


if "--" not in sys.argv:
    raise SystemExit(
        "Usage: blender --background --python process_thornheart_warden_meshy.py -- source.glb output.glb"
    )

arguments = sys.argv[sys.argv.index("--") + 1 :]
source_path = Path(arguments[0]).expanduser().resolve()
output_path = Path(arguments[1]).expanduser().resolve()
blend_path = output_path.with_suffix(".blend")
output_path.parent.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))
armature = next(item for item in bpy.context.scene.objects if item.type == "ARMATURE")
mesh = max((item for item in bpy.context.scene.objects if item.type == "MESH"), key=lambda item: len(item.data.vertices))

# Clear every custom-shape reference before deleting helpers, or the glTF
# exporter follows the dependency and restores them. This export happens to ship
# no Icosphere, unlike every earlier one, but the guard costs nothing.
for pose_bone in armature.pose.bones:
    pose_bone.custom_shape = None
for item in list(bpy.context.scene.objects):
    if item.type == "MESH" and item != mesh:
        bpy.data.objects.remove(item, do_unlink=True)

mesh.name = "ThornheartWardenMesh"
mesh.data.name = "ThornheartWardenMeshData"
armature.name = "ThornheartWardenRig"

# Contract: carved heartwood, zero metalness. Tighter than the Swarm form's hide
# because the plates are meant to read as polished wood catching a highlight,
# but well short of the plastic gloss Meshy's 2x specular would give it.
for material in mesh.data.materials:
    material.name = "ThornheartWardenMaterial"
    material.diffuse_color = (1.0, 1.0, 1.0, 1.0)
    if material.use_nodes and material.node_tree:
        principled = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
        if principled:
            principled.inputs["Metallic"].default_value = 0.0
            principled.inputs["Roughness"].default_value = 0.52


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


def neutralise_root_location(action, bone_name="Hips"):
    """Remove the constant root displacement Meshy bakes into its clips.

    The exported Walking action parks Hips away from the bind position and only
    oscillates around it. The authored clips key the rest position instead, so
    entering Walk would snap the body and leave the torso pulled off the planted
    feet. Subtracting each channel's mean keeps the cyclic weight bob while
    restoring the bind height, which is also the project's existing division of
    labour: the runtime owns world translation, the clip owns foot plants.
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

    Blender's glTF exporter writes tangents per split loop. A nearly collapsed
    UV island can survive the area test above yet still yield a zero tangent,
    which glTF Validator correctly rejects.
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


TARGET_RUNTIME_TRIANGLES = 19_000
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


def build_violet_emissive_mask(source_image, low=0.20, high=0.50):
    """Restrict self-illumination to the seams, the eyes and the chest heart.

    Meshy exports `emissiveFactor [1,1,1]` with the base colour as the emissive
    texture, so every pixel of the body emits its own albedo at full strength.
    The hide is a deep blue-green that is supposed to sit in shadow and take
    lighting; lit that way the violet stops being the brightest thing on the
    creature, which is the one feature the design is built around.

    The mask is the texture's own violet excess - how far red and blue run ahead
    of green - ramped rather than thresholded so the seams keep a soft edge
    instead of an aliased cut-out.

    This body separates far more cleanly than any earlier form. Measured through
    Blender's own pixel buffer: violet excess is p50=-0.039, p75=0.000,
    p90=0.059, p95=0.537, p99=0.676. There is a gap between p90 and p95 with
    almost nothing in it, so any ramp inside it isolates the glow. 0.20-0.50
    lights 8.2% of the texture at all and 6.9% weighted, against the 15% budget
    and the Swarm form's 8.5% / 4.8%.

    Two coverage numbers, and they are not the same thing: the fraction of
    pixels carrying *any* glow, and the weighted sum. A pixel at weight 0.02
    contributes almost nothing, so the weighted figure is what the budget means
    and the pixel count is what this function returns.

    Measure through Blender rather than offline: reading the same texture with
    an outside decoder and converting sRGB to linear by hand gave medians five
    times off on an earlier form, and thresholds picked from those numbers lit
    the entire body twice over.
    """
    width, height = source_image.size
    buffer = [0.0] * (width * height * 4)
    source_image.pixels.foreach_get(buffer)
    emissive = bpy.data.images.new("ThornheartWardenEmissive", width, height, alpha=True)
    span = max(high - low, 1e-6)
    lit_pixels = 0
    weighted = 0.0
    for index in range(0, len(buffer), 4):
        red, green, blue = buffer[index], buffer[index + 1], buffer[index + 2]
        violet_excess = (red + blue) * 0.5 - green
        weight = min(1.0, max(0.0, (violet_excess - low) / span))
        if weight > 0.01:
            lit_pixels += 1
        weighted += weight
        buffer[index] = red * weight
        buffer[index + 1] = green * weight
        buffer[index + 2] = blue * weight
        buffer[index + 3] = 1.0
    emissive.pixels.foreach_set(buffer)
    emissive.pack()
    total = width * height
    return emissive, lit_pixels / total, weighted / total


emissive_image = None
emissive_coverage = 0.0
emissive_weighted = 0.0
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
    emissive_image, emissive_coverage, emissive_weighted = build_violet_emissive_mask(base_link.from_node.image)
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

imported = armature.animation_data.action
removed_scale_curves = remove_scale_curves(imported)
recentred_root_channels = neutralise_root_location(imported)
source_walk_name = imported.name

# The imported Walk is discarded: it is the only clip that craters the neck, and
# nothing about it could be repaired (see the module docstring). Its duration is
# kept so the authored replacement runs at the same cadence.
source_walk_frames = int(imported.frame_range[1])
while armature.animation_data.nla_tracks:
    armature.animation_data.nla_tracks.remove(armature.animation_data.nla_tracks[0])
armature.animation_data.action = None
bpy.data.actions.remove(imported)

# ---------------------------------------------------------------------------
# Bone axis signs on this rig, and how they were obtained.
#
# Two earlier attempts got these wrong in two different ways. The first read
# them off rendered poses, which is unreliable on a creature this squat - a
# raised front and a dropped rear look alike. The second measured them
# numerically but on the *raw Meshy source*, whose armature carries a 0.01 scale
# and a +90 X rotation; bone world positions there are in a different space and
# the conclusions did not survive the export.
#
# These come from posing one bone at a time in the same rig state this script
# authors in, and reporting the change as a fraction of `span` - the rest
# distance from `headend` down to `frontleg2`. The reference headZ, 0.004827,
# matches the exported clip's frame 0, which is how the space is confirmed.
#
#   chest      -X raises the front (head +54% at -30 deg), +X drops it
#   head       +X raises the head, but only +4.7% - a trim, not a lever
#   Hips       -X raises the whole front (head +112%, front foot +104% at -30);
#              +X drives it down. This is the big lever in every clip here.
#   frontleg0  -X lifts the foreleg (+40%), +X plants it
#   frontleg1  -X lifts the front foot (+18%)
#   backleg0 / backleg1 barely move the hind foot in either direction - the leg
#              is near vertical - so they are used only for shape, never lift.
#
# The forelegs hang off `chest`, not off `Hips`, so anything that pitches the
# chest carries the front feet with it. That is correct for a rear-up and it is
# why head and front foot always move together in the trace.
#
# Hips location Z is INVERTED: positive lowers the body, negative raises it, and
# one local unit is about one body height. The values first written here were
# 0.0012, three orders of magnitude too small, and did nothing at all.
# ---------------------------------------------------------------------------

D = math.radians

# ---------------------------------------------------------------------------
# Walk, authored here rather than imported.
#
# A diagonal gait at the source clip's own 24-frame cadence, so nothing
# downstream changes. Each leg runs plant -> stance -> push -> swing, and the
# two diagonal pairs are half a cycle apart. Amplitudes are small: this is a
# squat armoured mass, and a high leg lift on a body this heavy reads as a
# trot rather than a patrol.
#
# The body carries a two-per-cycle weight bob and a little yaw sway, which is
# what sells the mass. The head and chest counter it slightly; both stay tiny
# because they are what the crater was blamed on for two rounds, and there is
# no reason to spend amplitude there.
# ---------------------------------------------------------------------------

WALK_FRAMES = 24
FRONT_SWING, FRONT_KNEE = 15, 18
BACK_SWING, BACK_KNEE = 13, 16

def leg_pose(phase, swing, knee, hind):
    """One leg's pose at a quarter-cycle phase, 0 = planted forward."""
    if phase == 0:
        return (-swing, knee * 0.22 * (1 if hind else -1))
    if phase == 1:
        return (0.0, 0.0)
    if phase == 2:
        return (swing * 0.93, knee * 0.33 * (1 if hind else -1))
    return (-swing * 0.3, -knee)


def walk_pose(frame_index):
    """Full-body pose at one of the five keys of the cycle."""
    phase = frame_index % 4
    other = (frame_index + 2) % 4
    rotations = {}
    for prefix, swing, knee, hind, ph in (
        ("frontleg", FRONT_SWING, FRONT_KNEE, False, phase),
        ("R_frontleg", FRONT_SWING, FRONT_KNEE, False, other),
        ("backleg", BACK_SWING, BACK_KNEE, True, other),
        ("R_backleg", BACK_SWING, BACK_KNEE, True, phase),
    ):
        hip, kneebend = leg_pose(ph, swing, knee, hind)
        rotations[prefix + "0"] = (D(hip), 0, 0)
        rotations[prefix + "1"] = (D(kneebend), 0, 0)
    sway = (0, D(2.6), 0) if phase in (0, 1) else (0, D(-2.6), 0)
    rotations["Hips"] = sway
    rotations["chest"] = (D(1.4 if phase in (1, 3) else -1.4), D(-1.6) if phase in (0, 1) else D(1.6), 0)
    rotations["head"] = (D(2.2 if phase in (0, 2) else -2.2), 0, 0)
    rotations["tail1"] = (0, D(4.5) if phase in (0, 1) else D(-4.5), 0)
    rotations["tail2"] = (0, D(6.0) if phase in (0, 1) else D(-6.0), 0)
    # Positive lowers the body. Two dips per cycle, at the two stance phases.
    lift = 0.05 if phase in (1, 3) else -0.03
    return rotations, {"Hips": (0, 0, lift)}


walk_keys = []
for index in range(5):
    rotations, locations = walk_pose(index)
    walk_keys.append((index * (WALK_FRAMES // 4), rotations, locations))
make_action("Walk", WALK_FRAMES, walk_keys)

# A carved thing that woke up, so Idle is nearly still: a slow breath through
# the chest and a small head settle. Anything livelier would make it read as an
# animal waiting rather than a guardian holding a gate.
make_action(
    "Idle",
    56,
    [
        (0, {}, {}),
        (16, {
            "chest": (D(2.4), 0, 0),
            "head": (D(1.8), D(2.4), 0),
            "tail1": (0, D(2.2), 0),
            "tail2": (0, D(3.0), 0),
        }, {"Hips": (0, 0, -0.02)}),
        (36, {
            "chest": (D(-2.0), 0, 0),
            "head": (D(-1.4), D(-3.0), 0),
            "tail1": (0, D(-2.0), 0),
            "tail2": (0, D(-2.8), 0),
        }, {"Hips": (0, 0, 0.02)}),
        (56, {}, {}),
    ],
)

# ---------------------------------------------------------------------------
# The three patterns. Each is a different *axis of motion*, which is the whole
# point: the primitives moved the body along X for all three and the player had
# only the ground decal to read.
#
#   Root Slam    vertical   - rear up, crash down            (radius 4.3 circle)
#   Thorn Charge horizontal - coil low, drive the horns      (6.4 x 1.64 line)
#   Spore Ring   radial     - tuck inward, flare outward     (2.15-5.15 ring)
#
# Contact frames are placed at telegraph / (telegraph + attack), because
# `gloamwoodBossClipRate` stretches each clip onto exactly that window:
#   Root Slam    1.02 + 0.24 = 1.26s, contact at 81% -> frame 24 of 30
#   Thorn Charge 0.90 + 0.58 = 1.48s, contact at 61% -> frame 22 of 36
#   Spore Ring   1.14 + 0.28 = 1.42s, contact at 80% -> frame 27 of 34
# At 24 fps each clip is authored at very close to its own window, so the rate
# lands near 1.0 and the motion is not visibly stretched.
# ---------------------------------------------------------------------------

make_action(
    "Slam",
    30,
    [
        (0, {}, {}),
        # Load: sink onto the haunches before the lift. Head about -18% of span.
        (8, {
            "Hips": (D(5), 0, 0),
            "chest": (D(3), 0, 0),
            "head": (D(-4), 0, 0),
        }, {"Hips": (0, 0, 0.06)}),
        # Rear up: head and forefeet about +77% of span, hind feet planted.
        (18, {
            "Hips": (D(-16), 0, 0),
            "chest": (D(-8), 0, 0),
            "head": (D(16), 0, 0),
            "headend": (D(8), 0, 0),
            "frontleg0": (D(-8), 0, 0),
            "R_frontleg0": (D(-8), 0, 0),
            "frontleg1": (D(-6), 0, 0),
            "R_frontleg1": (D(-6), 0, 0),
            "tail1": (0, 0, D(-9)),
        }, {"Hips": (0, 0, 0.0)}),
        # Contact: everything drives down through the forelimbs, head about -53%.
        (24, {
            "Hips": (D(14), 0, 0),
            "chest": (D(8), 0, 0),
            "head": (D(-14), 0, 0),
            "headend": (D(-6), 0, 0),
            "frontleg0": (D(12), 0, 0),
            "R_frontleg0": (D(12), 0, 0),
            "frontleg1": (D(8), 0, 0),
            "R_frontleg1": (D(8), 0, 0),
        }, {"Hips": (0, 0, 0.10)}),
        # Bounce off the ground, then settle.
        (27, {
            "Hips": (D(4), 0, 0),
            "chest": (D(2), 0, 0),
            "head": (D(-5), 0, 0),
        }, {"Hips": (0, 0, 0.04)}),
        (30, {}, {}),
    ],
)

make_action(
    "Charge",
    36,
    [
        (0, {}, {}),
        # Coil: the crown drops toward the lane it is about to run. Head -31%.
        (11, {
            "Hips": (D(8), 0, 0),
            "chest": (D(6), 0, 0),
            "head": (D(-10), 0, 0),
            "headend": (D(-5), 0, 0),
            "backleg0": (D(-14), 0, 0),
            "R_backleg0": (D(-14), 0, 0),
            "frontleg0": (D(7), 0, 0),
            "R_frontleg0": (D(7), 0, 0),
        }, {"Hips": (0, 0, 0.10)}),
        # Deepest coil, held a beat so the tell is legible. Head -48%.
        (17, {
            "Hips": (D(12), 0, 0),
            "chest": (D(9), 0, 0),
            "head": (D(-16), 0, 0),
            "headend": (D(-8), 0, 0),
            "backleg0": (D(-19), 0, 0),
            "R_backleg0": (D(-19), 0, 0),
            "frontleg0": (D(10), 0, 0),
            "R_frontleg0": (D(10), 0, 0),
        }, {"Hips": (0, 0, 0.15)}),
        # Drive: the body extends out of the coil and the crown leads, but the
        # head stays low - this is a battering run, not a rear-up. Head +20%,
        # which is a 68-point swing off the coil and the fastest change in any
        # of the three clips.
        #
        # No forward root translation: the runtime moves the boss down the lane
        # itself, and a clip that also travelled would double the motion.
        (22, {
            "Hips": (D(-4), 0, 0),
            "chest": (D(-2), 0, 0),
            "head": (D(10), 0, 0),
            "headend": (D(5), 0, 0),
            "frontleg0": (D(-16), 0, 0),
            "R_frontleg0": (D(-16), 0, 0),
            "frontleg1": (D(-9), 0, 0),
            "R_frontleg1": (D(-9), 0, 0),
            "backleg0": (D(22), 0, 0),
            "R_backleg0": (D(22), 0, 0),
        }, {"Hips": (0, 0, -0.06)}),
        (29, {
            "Hips": (D(2), 0, 0),
            "frontleg0": (D(8), 0, 0),
            "R_frontleg0": (D(8), 0, 0),
            "backleg0": (D(5), 0, 0),
            "R_backleg0": (D(5), 0, 0),
        }, {"Hips": (0, 0, 0.03)}),
        (36, {}, {}),
    ],
)

make_action(
    "RingBurst",
    34,
    [
        (0, {}, {}),
        # Tuck: the animal pulls inward and down and the limbs draw under it -
        # the opposite shape to both other patterns, so the wind-up alone
        # already tells them apart.
        (13, {
            "Hips": (D(7), 0, 0),
            "chest": (D(7), 0, 0),
            "head": (D(-12), 0, 0),
            "headend": (D(-6), 0, 0),
            "frontleg0": (D(4), 0, D(-14)),
            "R_frontleg0": (D(4), 0, D(14)),
            "backleg0": (D(5), 0, D(-12)),
            "R_backleg0": (D(5), 0, D(12)),
            "tail1": (D(-10), 0, 0),
            "tail2": (D(-12), 0, 0),
        }, {"Hips": (0, 0, 0.12)}),
        # Deepest tuck in the whole set: head about -42% of span.
        (21, {
            "Hips": (D(10), 0, 0),
            "chest": (D(10), 0, 0),
            "head": (D(-18), 0, 0),
            "headend": (D(-9), 0, 0),
            "frontleg0": (D(6), 0, D(-19)),
            "R_frontleg0": (D(6), 0, D(19)),
            "backleg0": (D(8), 0, D(-16)),
            "R_backleg0": (D(8), 0, D(16)),
            "tail1": (D(-13), 0, 0),
            "tail2": (D(-16), 0, 0),
        }, {"Hips": (0, 0, 0.18)}),
        # Burst: the highest opening in the set, about +81%, with all four limbs
        # splayed away from the body so the shape opens in every direction at
        # once - which is what the ring decal on the ground is doing.
        (27, {
            "Hips": (D(-16), 0, 0),
            "chest": (D(-10), 0, 0),
            "head": (D(22), 0, 0),
            "headend": (D(11), 0, 0),
            "frontleg0": (D(-12), 0, D(22)),
            "R_frontleg0": (D(-12), 0, D(-22)),
            "backleg0": (D(-6), 0, D(19)),
            "R_backleg0": (D(-6), 0, D(-19)),
            "tail1": (D(14), 0, 0),
            "tail2": (D(17), 0, 0),
        }, {"Hips": (0, 0, -0.10)}),
        (31, {
            "Hips": (D(-4), 0, 0),
            "chest": (D(-3), 0, 0),
            "head": (D(7), 0, 0),
        }, {"Hips": (0, 0, -0.03)}),
        (34, {}, {}),
    ],
)

# Declared in the boss config for parity with the valley bosses. The Gloamwood
# boss state machine has no hit reaction today, so nothing selects this clip -
# it exists so wiring one later does not need a re-export.
make_action(
    "Hit",
    18,
    [
        (0, {}, {}),
        (5, {
            "Hips": (D(6), 0, D(5)),
            "chest": (D(6), 0, D(7)),
            "head": (D(-9), 0, D(9)),
            "headend": (D(-5), 0, 0),
        }, {"Hips": (0, 0, 0.07)}),
        (11, {
            "Hips": (D(-3), 0, 0),
            "chest": (D(-2), 0, D(-3)),
            "head": (D(4), 0, D(-4)),
        }, {"Hips": (0, 0, -0.02)}),
        (18, {}, {}),
    ],
)

# A statue going back to being a statue: one last rear, then the knees fold, the
# mass settles, and the head is the last thing to go down. It ends about a
# third of body height below the load-time floor, next to the valley's own final
# boss, whose Death ends at 31%.
make_action(
    "Death",
    62,
    [
        (0, {}, {}),
        (10, {
            "Hips": (D(-9), 0, 0),
            "chest": (D(-5), 0, 0),
            "head": (D(12), 0, 0),
            "frontleg0": (D(-10), 0, 0),
            "R_frontleg0": (D(-10), 0, 0),
        }, {"Hips": (0, 0, -0.05)}),
        (28, {
            "Hips": (D(13), 0, D(6)),
            "chest": (D(10), 0, D(8)),
            "head": (D(-14), 0, D(10)),
            "headend": (D(-7), 0, 0),
            "frontleg0": (D(16), 0, 0),
            "R_frontleg0": (D(16), 0, 0),
            "frontleg1": (D(14), 0, 0),
            "R_frontleg1": (D(14), 0, 0),
        }, {"Hips": (0, 0, 0.18)}),
        (46, {
            "Hips": (D(18), 0, D(11)),
            "chest": (D(14), 0, D(13)),
            "head": (D(-20), 0, D(14)),
            "headend": (D(-10), 0, 0),
            "frontleg0": (D(24), 0, 0),
            "R_frontleg0": (D(24), 0, 0),
            "frontleg1": (D(21), 0, 0),
            "R_frontleg1": (D(21), 0, 0),
            "tail1": (D(-10), 0, 0),
            "tail2": (D(-12), 0, 0),
        }, {"Hips": (0, 0, 0.17)}),
        (62, {
            "Hips": (D(19), 0, D(12)),
            "chest": (D(15), 0, D(14)),
            "head": (D(-23), 0, D(15)),
            "headend": (D(-11), 0, 0),
            "frontleg0": (D(26), 0, 0),
            "R_frontleg0": (D(26), 0, 0),
            "frontleg1": (D(23), 0, 0),
            "R_frontleg1": (D(23), 0, 0),
            "tail1": (D(-11), 0, 0),
            "tail2": (D(-13), 0, 0),
        }, {"Hips": (0, 0, 0.20)}),
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

print("EA_THORNHEART_WARDEN_PROCESS=" + json.dumps({
    "source": str(source_path),
    "output": str(output_path),
    "blend": str(blend_path),
    "mesh": mesh.name,
    "source_triangles": source_triangles,
    "runtime_triangles": runtime_triangles,
    "removed_degenerate_uv_faces": removed_uv_faces,
    "removed_invalid_tangent_faces": removed_tangent_faces,
    "emissive_mask_coverage": round(emissive_coverage, 5),
    "emissive_mask_weighted": round(emissive_weighted, 5),
    "bones": [bone.name for bone in armature.data.bones],
    "actions": sorted(action.name for action in bpy.data.actions),
    "removed_imported_scale_curves": removed_scale_curves,
    "recentred_root_location_channels": recentred_root_channels,
    "discarded_source_walk": source_walk_name,
    "source_walk_frames": source_walk_frames,
}, ensure_ascii=False))
