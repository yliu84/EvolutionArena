import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Euler, Vector


if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python create_scarlet_hunter_production_blockout.py -- output.glb")

output_path = Path(sys.argv[sys.argv.index("--") + 1]).expanduser().resolve()
output_path.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)


def make_material(name, color, roughness=0.76):
    result = bpy.data.materials.new(name)
    result.diffuse_color = (*color, 1)
    result.metallic = 0
    result.roughness = roughness
    result.use_nodes = True
    shader = next(node for node in result.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Metallic"].default_value = 0
    shader.inputs["Roughness"].default_value = roughness
    return result


SCARLET = make_material("HunterScarlet", (0.52, 0.035, 0.028))
CORAL = make_material("HunterCoral", (0.82, 0.10, 0.065))
DARK = make_material("HunterBurgundy", (0.16, 0.012, 0.018))
CREAM = make_material("HunterCream", (0.72, 0.54, 0.31))
TEAL = make_material("HunterTeal", (0.035, 0.28, 0.29))
AMBER = make_material("HunterAmber", (1.0, 0.36, 0.018), 0.42)
BLACK = make_material("HunterPupil", (0.008, 0.004, 0.003), 0.65)

parts = []


def register(obj, name, material, smooth=False):
    obj.name = name
    obj.data.name = f"{name}Geometry"
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.use_smooth = smooth
    parts.append(obj)
    return obj


def loft(name, stations, segments, material, smooth=True):
    vertices = []
    faces = []
    for x, y, z, radius_x, radius_z in stations:
        for index in range(segments):
            angle = math.tau * index / segments
            # Flatten the sides slightly so the form reads as sculptural planes,
            # while top and belly keep a continuous curved silhouette.
            cosine = math.cos(angle)
            sine = math.sin(angle)
            shaped_x = math.copysign(abs(cosine) ** 0.86, cosine) * radius_x
            shaped_z = math.copysign(abs(sine) ** 0.92, sine) * radius_z
            vertices.append((x + shaped_x, y, z + shaped_z))
    for station in range(len(stations) - 1):
        for index in range(segments):
            next_index = (index + 1) % segments
            faces.append((
                station * segments + index,
                station * segments + next_index,
                (station + 1) * segments + next_index,
                (station + 1) * segments + index,
            ))
    faces.append(tuple(reversed(range(segments))))
    final_ring = (len(stations) - 1) * segments
    faces.append(tuple(final_ring + index for index in range(segments)))
    mesh_data = bpy.data.meshes.new(f"{name}Geometry")
    mesh_data.from_pydata(vertices, [], faces)
    mesh_data.update()
    obj = bpy.data.objects.new(name, mesh_data)
    bpy.context.collection.objects.link(obj)
    return register(obj, name, material, smooth)


def tapered_between(name, start, end, start_radius, end_radius, material, vertices=14, smooth=True):
    start_vector = Vector(start)
    end_vector = Vector(end)
    direction = end_vector - start_vector
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=start_radius,
        radius2=end_radius,
        depth=direction.length,
        location=(start_vector + end_vector) * 0.5,
    )
    obj = bpy.context.object
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(direction.normalized())
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return register(obj, name, material, smooth)


def beveled_box(name, location, scale, material, bevel=0.035, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    modifier = obj.modifiers.new("StructuralBevel", "BEVEL")
    modifier.width = bevel
    modifier.segments = 2
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    return register(obj, name, material, True)


def armor_mass(name, location, scale, material, rotation=(0, 0, 0), subdivisions=2, smooth=False):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivisions, radius=1, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return register(obj, name, material, smooth)


def blade(name, location, height, length, thickness, material, rotation=(0, 0, 0)):
    # Extruded swept-back armor blade. Local +Y points toward the tail.
    half = thickness * 0.5
    profile = [(-length * 0.22, 0), (0, height), (length, height * 0.16), (length * 0.62, 0)]
    vertices = []
    for x in (-half, half):
        for y, z in profile:
            vertices.append((x, y, z))
    faces = [
        (0, 1, 2, 3), (7, 6, 5, 4),
        (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0),
    ]
    data = bpy.data.meshes.new(f"{name}Geometry")
    data.from_pydata(vertices, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = Euler(rotation, "XYZ")
    return register(obj, name, material, False)


# A single connected torso loft defines shoulder, ribcage, waist, pelvis and
# tail root. This is the core correction over the rejected overlapping spheres.
body = loft("HunterBody", [
    (0, -0.46, 0.76, 0.28, 0.26),
    (0, -0.30, 0.73, 0.45, 0.36),
    (0, -0.05, 0.66, 0.41, 0.32),
    (0, 0.22, 0.62, 0.29, 0.21),
    (0, 0.45, 0.66, 0.40, 0.30),
    (0, 0.65, 0.59, 0.28, 0.22),
], 18, SCARLET, True)

loft("HunterNeck", [
    (0, -0.38, 0.76, 0.27, 0.25),
    (0, -0.56, 0.82, 0.25, 0.23),
    (0, -0.72, 0.84, 0.22, 0.19),
], 16, DARK, True)

# Wedge skull and an actually separate jaw establish the production profile.
loft("HunterSkull", [
    (0, -0.66, 0.84, 0.22, 0.19),
    (0, -0.84, 0.86, 0.27, 0.19),
    (0, -1.08, 0.80, 0.21, 0.13),
    (0, -1.30, 0.75, 0.10, 0.065),
], 12, CORAL, True)
loft("HunterJaw", [
    (0, -0.76, 0.68, 0.21, 0.065),
    (0, -1.04, 0.66, 0.19, 0.055),
    (0, -1.28, 0.68, 0.09, 0.035),
], 10, CREAM, True)
loft("HunterThroat", [
    (0, -0.70, 0.62, 0.17, 0.09),
    (0, -0.46, 0.51, 0.24, 0.14),
    (0, -0.22, 0.44, 0.28, 0.12),
], 14, CREAM, True)

# Continuous S-curve tail with a muscular root.
loft("HunterTail", [
    (0, 0.58, 0.61, 0.27, 0.21),
    (0.03, 0.83, 0.55, 0.23, 0.19),
    (-0.04, 1.08, 0.47, 0.19, 0.16),
    (-0.11, 1.31, 0.40, 0.14, 0.12),
    (-0.06, 1.53, 0.37, 0.10, 0.085),
    (0.07, 1.72, 0.43, 0.06, 0.05),
    (0.16, 1.86, 0.53, 0.022, 0.020),
], 16, DARK, True)

# Anatomically separated upper/lower limbs with visible joints and broad feet.
leg_specs = {
    "FL": (1, -0.28), "FR": (-1, -0.28),
    "BL": (1, 0.43), "BR": (-1, 0.43),
}
for suffix, (side, y) in leg_specs.items():
    is_front = suffix.startswith("F")
    hip = (side * (0.37 if is_front else 0.36), y, 0.70)
    elbow = (side * (0.50 if is_front else 0.47), y + (-0.05 if is_front else 0.07), 0.38)
    wrist = (side * 0.48, y + (-0.10 if is_front else 0.10), 0.12)
    tapered_between(f"Upper{suffix}", hip, elbow, 0.17, 0.13, SCARLET, 14, True)
    armor_mass(f"Joint{suffix}", elbow, (0.16, 0.13, 0.14), CORAL, subdivisions=1, smooth=False)
    tapered_between(f"Lower{suffix}", elbow, wrist, 0.125, 0.095, DARK, 14, True)
    foot_y = wrist[1] - (0.16 if is_front else 0.10)
    beveled_box(f"Foot{suffix}", (wrist[0], foot_y, 0.075), (0.15, 0.22, 0.075), DARK, 0.035)
    for claw_index in range(3):
        claw_x = wrist[0] + side * (claw_index - 1) * 0.052
        tapered_between(
            f"Claw{suffix}{claw_index}",
            (claw_x, foot_y - 0.15, 0.08),
            (claw_x, foot_y - 0.26, 0.052),
            0.032, 0.006, CREAM, 7, False,
        )

# Shoulder and pelvic armor follow the anatomical masses, with restrained teal
# insets rather than random surface gems.
for side in (-1, 1):
    armor_mass(f"ShoulderPlate{side}", (side * 0.43, -0.27, 0.77), (0.075, 0.22, 0.21), CORAL, (0, math.radians(side * 12), 0), 2, False)
    armor_mass(f"ShoulderInset{side}", (side * 0.495, -0.27, 0.79), (0.018, 0.10, 0.105), TEAL, (0, math.radians(side * 12), 0), 1, False)
    armor_mass(f"HipPlate{side}", (side * 0.39, 0.43, 0.70), (0.07, 0.19, 0.18), CORAL, (0, math.radians(side * -8), 0), 2, False)
    armor_mass(f"HipInset{side}", (side * 0.45, 0.43, 0.72), (0.016, 0.085, 0.085), TEAL, subdivisions=1, smooth=False)

# Swept crown and smaller dorsal rhythm from the accepted design board.
for index, (x, y, z, height, length) in enumerate([
    (0, -0.98, 0.95, 0.30, 0.28),
    (0.14, -0.82, 0.98, 0.27, 0.30),
    (-0.14, -0.82, 0.98, 0.27, 0.30),
    (0.12, -0.65, 0.98, 0.21, 0.27),
    (-0.12, -0.65, 0.98, 0.21, 0.27),
]):
    blade(f"CrownBlade{index}", (x, y, z), height, length, 0.075, DARK if index == 0 else CORAL)

for index, (y, z, height) in enumerate([(-0.38, 0.94, 0.19), (-0.12, 0.96, 0.17), (0.14, 0.91, 0.15), (0.39, 0.88, 0.13)]):
    blade(f"DorsalBlade{index}", (0, y, z), height, 0.20, 0.065, DARK)

for side in (-1, 1):
    armor_mass(f"Eye{side}", (side * 0.218, -1.00, 0.84), (0.031, 0.047, 0.035), AMBER, subdivisions=2, smooth=True)
    armor_mass(f"Pupil{side}", (side * 0.241, -1.012, 0.84), (0.010, 0.025, 0.020), BLACK, subdivisions=2, smooth=True)

# Join into one authored blockout mesh while retaining material groups.
bpy.ops.object.select_all(action="DESELECT")
for part in parts:
    part.select_set(True)
bpy.context.view_layer.objects.active = body
bpy.ops.object.join()
mesh = bpy.context.object
mesh.name = "ScarletHunterProductionBlockout"
mesh.data.name = "ScarletHunterProductionBlockoutGeometry"
mesh["ea_style"] = "scarlet-hunter-production-target-v2"
mesh["ea_status"] = "silhouette-blockout-not-runtime"
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
    "materials": [item.name for item in mesh.data.materials],
    "status": "silhouette-blockout-not-runtime",
}, ensure_ascii=False))
