"""Move the Coral Gecko's skeleton onto the body it is supposed to drive.

The player's starting creature walks with two legs. The other two never move,
and the reason is not the clips and not the sculpt:

  Below y=0.10 the mesh has exactly four feet, at z 0.55 (front) and z 0.09
  (rear), spaced 0.41 apart and centred on x=-0.145.

  The skeleton puts its feet at z 0.295 and z -0.225, spaced 0.67 apart and
  centred on x=0.

So the rig is built for a longer, wider animal than the one it is bound to. Its
hind legs land a third of a unit behind the real ones - inside the tail - and
its left legs land outside the body altogether, which is why LegBL, ShinBL,
FootBL and LegFL owned no vertices in every version of this asset.

An earlier attempt found the x half of that (the mesh is symmetric about -0.140,
not about zero), moved the mesh, and rebound. It still failed, and this is why:
mirror symmetry is blind along z, so the 0.28 the skeleton is out front-to-back
was never in the measurement. Six weighting schemes were then tried on a mesh
that was still a third of a unit out of place.

It cannot be fixed by moving the mesh either. The sculpt's stance is *narrower*
than the rig's - half-separation 0.205 against 0.334 - so no single translation
puts all four feet on all four bones. The bones have to come to the body.

What that buys, and it is the reason to do it this way round: bone names and
hierarchy are untouched, so all eight authored clips survive. A walk cycle is
rotations on named bones; it does not care where those bones used to be.

Everything is measured from the mesh. A number like 0.145 written into this file
is the same mistake as the rig it is repairing.

Usage:
  blender --background --python scripts/blender/refit_coral_gecko_rig.py \
      -- in.glb out.glb
"""

import json
import sys
from pathlib import Path

import bpy
from mathutils import Vector

if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python refit_coral_gecko_rig.py -- in.glb out.glb")

arguments = sys.argv[sys.argv.index("--") + 1:]
source_path = Path(arguments[0]).expanduser().resolve()
output_path = Path(arguments[1]).expanduser().resolve()
output_path.parent.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))

armature = next(item for item in bpy.context.scene.objects if item.type == "ARMATURE")
mesh = max((item for item in bpy.context.scene.objects if item.type == "MESH"),
           key=lambda item: len(item.data.vertices))

# Measured in the armature's own space, so a bone position and a vertex position
# are the same kind of number. The glTF importer converts Y-up to Z-up and this
# asset carries a rotation on its root, so anything measured in world space and
# anything measured in the file disagree about which end is the head - two
# conclusions were drawn from that mistake the last time this was attempted.
to_rig = armature.matrix_world.inverted()
points = [to_rig @ (mesh.matrix_world @ vertex.co) for vertex in mesh.data.vertices]

low = min(point.z for point in points)
high = max(point.z for point in points)
height = high - low

# Which way the animal faces, asked of the rig rather than assumed. The rig is
# in the wrong place but it is not back to front, and the alternative - reading
# a sign out of the file - is the Y-up/Z-up trap this asset has already been
# lost in twice.
rest = armature.data.bones
forward = 1.0 if rest["Head"].head_local.y > rest["Tail_3"].head_local.y else -1.0
print(f"mesh height {height:.3f}  ground {low:.3f}  forward {forward:+.0f}Y")


def split(values, key):
    """Two clusters along one axis, by the widest gap in the sorted order.

    A median split would cut a pair of feet in half whenever the stance is not
    even; the widest gap is where the animal's own separation actually is.
    """
    ordered = sorted(values, key=key)
    gaps = [(key(ordered[i + 1]) - key(ordered[i]), i) for i in range(len(ordered) - 1)]
    # Ignore the outer fifth at each end: the largest gap in a long thin cluster
    # is often between the body and one stray vertex on a claw.
    margin = len(ordered) // 5
    _, cut = max(gaps[margin:len(gaps) - margin] or gaps)
    return ordered[:cut + 1], ordered[cut + 1:]


# Feet only. High enough to catch a whole foot, low enough that no part of the
# belly or the tail reaches it - checked by the four clusters coming out even.
foot_band = [point for point in points if point.z < low + height * 0.12]
first, second = split(foot_band, lambda point: point.y * forward)
legs = {}
for pair, name in ((first, "B"), (second, "F")):
    right, left = split(pair, lambda point: point.x)
    legs[f"{name}R"] = right
    legs[f"{name}L"] = left

body_points = [point for point in points if point.z > low + height * 0.12]
spine_x = sum(point.x for point in body_points) / len(body_points)


def leg_chain(cluster, hip_z):
    """Hip, knee and foot for one leg, from the cloud of vertices under it."""
    foot = Vector((
        sum(point.x for point in cluster) / len(cluster),
        sum(point.y for point in cluster) / len(cluster),
        low + height * 0.03,
    ))
    # The hip sits under the body rather than over the foot. A splayed lizard
    # plants its feet outside its shoulders, and a hip placed above the foot
    # puts the whole chain outside the torso where it binds to nothing.
    hip = Vector((spine_x + (foot.x - spine_x) * 0.38, hip_z, low + height * 0.46))
    knee = Vector((
        spine_x + (foot.x - spine_x) * 0.92,
        (hip.y + foot.y) / 2,
        low + height * 0.21,
    ))
    return hip, knee, foot


placements = {}
for key, cluster in legs.items():
    # The joint sits a little inboard of the foot along the body, because the
    # foot is planted ahead of the shoulder it hangs from in this pose.
    ys = [point.y for point in cluster]
    foot_y = sum(ys) / len(ys)
    hip_y = foot_y - forward * (0.06 if key.startswith("B") else 0.02) * height
    hip, knee, foot = leg_chain(cluster, hip_y)
    placements[key] = (hip, knee, foot)
    print(f"leg {key}: foot ({foot.x:.3f}, {foot.y:.3f}) hip ({hip.x:.3f}, {hip.y:.3f})")

# The spine, as the centre of the body at a series of stations along it. A
# lizard's back is a curve and four bones spaced by eye along a straight line
# leave the tail bones outside the tail.
spine_band = sorted(body_points, key=lambda point: point.y * forward)


def section_centre(fraction, width=0.06):
    span = spine_band[-1].y - spine_band[0].y
    target = spine_band[0].y + span * fraction
    slice_points = [point for point in spine_band if abs(point.y - target) < span * width]
    if not slice_points:
        slice_points = spine_band
    return Vector((
        sum(point.x for point in slice_points) / len(slice_points),
        target,
        sum(point.z for point in slice_points) / len(slice_points),
    ))


spine_stations = {name: section_centre(fraction) for name, fraction in (
    ("Tail_3", 0.02), ("Tail_2", 0.10), ("Tail_1", 0.19), ("Tail_0", 0.30),
    ("Body", 0.40), ("Neck", 0.66), ("Head", 0.80), ("Jaw", 0.90),
)}

bpy.context.view_layer.objects.active = armature
bpy.ops.object.mode_set(mode="EDIT")
edit_bones = armature.data.edit_bones


def place(name, head, tail):
    bone = edit_bones[name]
    bone.head = head
    bone.tail = tail


for key, (hip, knee, foot) in placements.items():
    place(f"Leg{key}", hip, knee)
    place(f"Shin{key}", knee, foot)
    # Toes point along the body's forward axis, which is +Y here.
    place(f"Foot{key}", foot, foot + Vector((0, forward * height * 0.09, 0)))

order = ["Tail_3", "Tail_2", "Tail_1", "Tail_0", "Body", "Neck", "Head", "Jaw"]
for index, name in enumerate(order):
    head = spine_stations[name]
    tail = spine_stations[order[index + 1]] if index + 1 < len(order) else head + Vector((0, forward * height * 0.12, 0))
    place(name, head, tail)
edit_bones["Root"].head = Vector((spine_stations["Body"].x, spine_stations["Body"].y, low))
edit_bones["Root"].tail = Vector((spine_stations["Body"].x, spine_stations["Body"].y, low + height * 0.1))

bpy.ops.object.mode_set(mode="OBJECT")

# Rebind, by hand.
#
# Blender's heat weighting cannot solve this mesh at all - it returns FINISHED,
# writes "failed to find solution for one or more bones" to the info log, and
# leaves every one of the 25,416 vertices unweighted. That is not a symptom of
# the bones being wrong; it is what heat diffusion does on a sculpt with
# interpenetrating shells, and this one has a spined crest sitting inside the
# back and toes inside the feet.
#
# So the weight is written here: distance from the vertex to the bone's segment,
# raised to a high power so a limb claims its own geometry and not its
# neighbour's, keeping the four strongest. With the bones now actually inside
# the limbs this is enough; the previous attempt's proximity schemes failed
# because they were measuring to bones standing in empty air.
mesh.vertex_groups.clear()
if mesh.parent is not None:
    world = mesh.matrix_world.copy()
    mesh.parent = None
    mesh.matrix_world = world
for modifier in list(mesh.modifiers):
    if modifier.type == "ARMATURE":
        mesh.modifiers.remove(modifier)

segments = []
for bone in armature.data.bones:
    if bone.name == "Root":
        continue
    segments.append((bone.name, Vector(bone.head_local), Vector(bone.tail_local)))


def distance_to_segment(point, head, tail):
    axis = tail - head
    length_squared = axis.length_squared
    if length_squared < 1e-12:
        return (point - head).length
    along = max(0.0, min(1.0, (point - head).dot(axis) / length_squared))
    return (point - (head + axis * along)).length


# High enough that a leg outranks the belly a few centimetres away, low enough
# that the skin between two bones still blends rather than snapping.
FALLOFF = 5.0
INFLUENCES = 4

groups = {name: mesh.vertex_groups.new(name=name) for name, _, _ in segments}
to_mesh = mesh.matrix_world.inverted() @ armature.matrix_world
for index, vertex in enumerate(mesh.data.vertices):
    point = to_rig @ (mesh.matrix_world @ vertex.co)
    ranked = sorted(
        ((distance_to_segment(point, head, tail), name) for name, head, tail in segments),
        key=lambda entry: entry[0],
    )[:INFLUENCES]
    nearest = max(ranked[0][0], 1e-5)
    raw = [(name, (nearest / max(distance, 1e-5)) ** FALLOFF) for distance, name in ranked]
    total = sum(weight for _, weight in raw)
    for name, weight in raw:
        share = weight / total
        if share > 0.002:
            groups[name].add([index], share, "REPLACE")

modifier = mesh.modifiers.new(name="Armature", type="ARMATURE")
modifier.object = armature
mesh.parent = armature
mesh.matrix_parent_inverse = armature.matrix_world.inverted()

weighted = sum(1 for vertex in mesh.data.vertices if vertex.groups)
print(f"weighted vertices {weighted} of {len(mesh.data.vertices)}")
if weighted < len(mesh.data.vertices) * 0.99:
    raise SystemExit(f"Only {weighted} of {len(mesh.data.vertices)} vertices were weighted")

owned = {name: 0 for name, _, _ in segments}
index_to_name = {group.index: group.name for group in mesh.vertex_groups}
for vertex in mesh.data.vertices:
    for entry in vertex.groups:
        if entry.weight > 0.001:
            owned[index_to_name[entry.group]] += 1
for name in sorted(owned):
    print(f"  {name:10s} {owned[name]:6d}")

# The acceptance test, run here rather than trusted to a later look at it. Every
# leg bone carries real geometry, and the two sides are within a quarter of each
# other - which is the whole complaint this script exists to answer.
limbs = [name for name in owned if name.startswith(("Leg", "Shin", "Foot"))]
thin = [name for name in limbs if owned[name] < 300]
if thin:
    raise SystemExit(f"Leg bones with too little geometry: {', '.join(sorted(thin))}")
for prefix in ("Leg", "Shin", "Foot"):
    for pair in ("F", "B"):
        left = owned[f"{prefix}{pair}L"]
        right = owned[f"{prefix}{pair}R"]
        if min(left, right) < max(left, right) * 0.75:
            raise SystemExit(f"{prefix}{pair} is lopsided: L={left} R={right}")

bpy.ops.object.select_all(action="DESELECT")
bpy.ops.export_scene.gltf(
    filepath=str(output_path),
    export_format="GLB",
    export_animations=True,
    export_skins=True,
    export_apply=False,
)
print(f"wrote {output_path}")
