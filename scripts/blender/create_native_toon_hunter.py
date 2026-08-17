import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python create_native_toon_hunter.py -- output.glb")

output_path = Path(sys.argv[sys.argv.index("--") + 1]).expanduser().resolve()
output_path.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)


def material(name, color, roughness=0.82):
    result = bpy.data.materials.new(name)
    result.diffuse_color = (*color, 1.0)
    result.metallic = 0.0
    result.roughness = roughness
    result.use_nodes = True
    principled = next(node for node in result.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
    principled.inputs["Base Color"].default_value = (*color, 1.0)
    principled.inputs["Metallic"].default_value = 0.0
    principled.inputs["Roughness"].default_value = roughness
    return result


RED = material("ToonCrimson", (0.68, 0.075, 0.065))
LIGHT_RED = material("ToonCoral", (0.94, 0.23, 0.16))
DARK_RED = material("ToonBurgundy", (0.25, 0.025, 0.04))
CREAM = material("ToonCream", (0.91, 0.72, 0.39))
TEAL = material("ToonTeal", (0.10, 0.35, 0.32))
AMBER = material("ToonAmberEye", (1.0, 0.48, 0.045), 0.48)
BLACK = material("ToonPupil", (0.025, 0.012, 0.01), 0.7)

parts = []


def finish(obj, name, mat, smooth=False):
    obj.name = name
    obj.data.name = f"{name}Geometry"
    obj.data.materials.append(mat)
    for polygon in obj.data.polygons:
        polygon.use_smooth = smooth
    parts.append(obj)
    return obj


def ico(name, location, scale, mat, subdivisions=2, smooth=True):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivisions, radius=1, location=location)
    obj = bpy.context.object
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, mat, smooth)


def box(name, location, scale, mat, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel > 0:
        modifier = obj.modifiers.new(name="ChunkyBevel", type="BEVEL")
        modifier.width = bevel
        modifier.segments = 3
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    return finish(obj, name, mat, bevel > 0)


def tapered_between(name, start, end, radius_start, radius_end, mat, vertices=12, smooth=True):
    start_vector = Vector(start)
    end_vector = Vector(end)
    direction = end_vector - start_vector
    midpoint = (start_vector + end_vector) * 0.5
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=radius_start,
        radius2=radius_end,
        depth=direction.length,
        location=midpoint,
    )
    obj = bpy.context.object
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(direction.normalized())
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, mat, smooth)


def tapered_chain(name, points, radii, mat, tip_mat, vertices=16):
    mesh_vertices = []
    mesh_faces = []
    for center, radius in zip(points, radii):
        for index in range(vertices):
            angle = math.tau * index / vertices
            mesh_vertices.append((
                center[0] + math.cos(angle) * radius,
                center[1],
                center[2] + math.sin(angle) * radius * 0.82,
            ))
    for ring in range(len(points) - 1):
        for index in range(vertices):
            next_index = (index + 1) % vertices
            mesh_faces.append((
                ring * vertices + index,
                ring * vertices + next_index,
                (ring + 1) * vertices + next_index,
                (ring + 1) * vertices + index,
            ))
    mesh_faces.append(tuple(reversed(range(vertices))))
    final_ring = (len(points) - 1) * vertices
    mesh_faces.append(tuple(final_ring + index for index in range(vertices)))

    data = bpy.data.meshes.new(f"{name}Geometry")
    data.from_pydata(mesh_vertices, [], mesh_faces)
    data.materials.append(mat)
    data.materials.append(tip_mat)
    data.update()
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    for polygon in data.polygons:
        polygon.use_smooth = True
        if polygon.center.y > points[-3][1]:
            polygon.material_index = 1
    parts.append(obj)
    return obj


def spike(name, location, size, mat, rotation=(0, 0, 0), vertices=5):
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=size * 0.34,
        radius2=0,
        depth=size,
        location=location,
        rotation=rotation,
    )
    return finish(bpy.context.object, name, mat)


# Three overlapping masses create the chunky toy-like torso without thin skin
# sheets. Their intersections are intentionally hidden inside the silhouette.
body = ico("BodyMass", (0, 0.02, 0.55), (0.48, 0.62, 0.41), RED, 3)
ico("ChestMass", (0, -0.28, 0.59), (0.54, 0.39, 0.47), LIGHT_RED, 3)
ico("HipMass", (0, 0.34, 0.53), (0.48, 0.42, 0.40), RED, 2)
ico("BellyPlate", (0, -0.12, 0.33), (0.39, 0.45, 0.19), CREAM, 2)

ico("NeckMass", (0, -0.54, 0.67), (0.31, 0.35, 0.32), RED, 2)
ico("HeadMass", (0, -0.79, 0.72), (0.31, 0.37, 0.27), LIGHT_RED, 2)
box("Snout", (0, -1.04, 0.68), (0.25, 0.27, 0.14), LIGHT_RED, 0.055)
box("Jaw", (0, -1.00, 0.545), (0.235, 0.24, 0.075), CREAM, 0.035)
ico("Throat", (0, -0.59, 0.47), (0.27, 0.29, 0.25), CREAM, 2)

# Large graphic eyes remain readable at gameplay distance.
for side in (-1, 1):
    ico(f"Eye{'L' if side > 0 else 'R'}", (side * 0.292, -0.91, 0.77), (0.058, 0.078, 0.068), AMBER, 2)
    ico(f"Pupil{'L' if side > 0 else 'R'}", (side * 0.337, -0.925, 0.772), (0.025, 0.043, 0.039), BLACK, 2)

# Four thick limbs: two rigid low-poly segments plus an oversized foot. The
# geometry overlaps at every joint so animation never reveals gaps.
leg_layout = {
    "FL": (0.36, -0.31),
    "FR": (-0.36, -0.31),
    "BL": (0.38, 0.31),
    "BR": (-0.38, 0.31),
}
for suffix, (x, y) in leg_layout.items():
    side = 1 if x > 0 else -1
    hip = (x, y, 0.51)
    knee = (x + side * 0.10, y + 0.015, 0.25)
    ankle = (x + side * 0.12, y - 0.015, 0.085)
    tapered_between(f"UpperLeg{suffix}", hip, knee, 0.155, 0.125, RED, 14)
    tapered_between(f"LowerLeg{suffix}", knee, ankle, 0.13, 0.105, LIGHT_RED, 14)
    foot = box(f"Foot{suffix}Mass", (ankle[0], y - 0.115, 0.075), (0.145, 0.19, 0.085), DARK_RED, 0.035)
    foot.rotation_euler.z = math.radians(side * 3)
    for toe_index in range(3):
        toe_x = ankle[0] + side * (toe_index - 1) * 0.052
        tapered_between(
            f"Claw{suffix}{toe_index}",
            (toe_x, y - 0.205, 0.077),
            (toe_x, y - 0.31, 0.058),
            0.035,
            0.006,
            CREAM,
            5,
        )

# One continuous rounded tail removes the old visible four-piece seams while
# still following the accepted four tail-bone chain after skinning.
tail_points = [
    (0, 0.42, 0.54),
    (0, 0.72, 0.47),
    (0, 1.00, 0.38),
    (0, 1.25, 0.29),
    (0, 1.47, 0.21),
]
tail_radii = [0.29, 0.245, 0.19, 0.135, 0.045]
tapered_chain("TailMass", tail_points, tail_radii, RED, DARK_RED, 18)

# Fewer, larger crown plates replace the old thicket of realistic spikes.
head_spikes = [
    (0, -0.91, 1.03, 0.38),
    (0.16, -0.77, 0.97, 0.34),
    (-0.16, -0.77, 0.97, 0.34),
    (0.19, -0.59, 0.91, 0.29),
    (-0.19, -0.59, 0.91, 0.29),
    (0, -0.48, 0.96, 0.31),
]
for index, (x, y, z, size) in enumerate(head_spikes):
    spike(f"CrownPlate{index}", (x, y, z), size, CREAM if index in (1, 2) else LIGHT_RED, (math.radians(-10), 0, 0), 5)

for index, (y, size) in enumerate([(-0.22, 0.25), (0.02, 0.23), (0.27, 0.21), (0.50, 0.18), (0.72, 0.15)]):
    spike(f"BackPlate{index}", (0, y, 0.93 - index * 0.055), size, LIGHT_RED if index % 2 == 0 else CREAM, (math.radians(8), 0, 0), 5)

# Restrained teal side plates give route identity without texture noise.
for side in (-1, 1):
    for index, y in enumerate((-0.28, 0.0, 0.28)):
        plate = ico(f"SidePlate{side}_{index}", (side * 0.455, y, 0.57), (0.055, 0.11, 0.12), TEAL, 1, False)
        plate.rotation_euler.y = math.radians(side * 16)

bpy.ops.object.select_all(action="DESELECT")
for part in parts:
    part.select_set(True)
bpy.context.view_layer.objects.active = body
bpy.ops.object.join()
mesh = bpy.context.object
mesh.name = "ScarletHunterNativeToonMesh"
mesh.data.name = "ScarletHunterNativeToonGeometry"
mesh["ea_style"] = "native-low-poly-toon-v2"
mesh["ea_body_plan"] = "chunky-coral-hunter"
mesh.data.update()

bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(
    filepath=str(output_path),
    export_format="GLB",
    use_selection=True,
    export_yup=True,
    export_materials="EXPORT",
    export_animations=False,
)

mesh.data.calc_loop_triangles()
print(json.dumps({
    "output": str(output_path),
    "triangles": len(mesh.data.loop_triangles),
    "materials": [material.name for material in mesh.data.materials],
    "style": "native-low-poly-toon-v2",
}, ensure_ascii=False))
