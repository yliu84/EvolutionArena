import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python render_glb_turntable.py -- model.glb output-directory")

arguments = sys.argv[sys.argv.index("--") + 1:]
source_path = Path(arguments[0]).expanduser().resolve()
output_directory = Path(arguments[1]).expanduser().resolve()
output_directory.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))
meshes = [item for item in bpy.context.scene.objects if item.type == "MESH"]
corners = [item.matrix_world @ Vector(corner) for item in meshes for corner in item.bound_box]
minimum = Vector(tuple(min(corner[axis] for corner in corners) for axis in range(3)))
maximum = Vector(tuple(max(corner[axis] for corner in corners) for axis in range(3)))
center = (minimum + maximum) * 0.5
largest = max(maximum - minimum)

bpy.ops.mesh.primitive_plane_add(size=12, location=(center.x, center.y, minimum.z - 0.006))
ground = bpy.context.object
ground_material = bpy.data.materials.new("TurntableGround")
ground_material.diffuse_color = (0.055, 0.062, 0.07, 1)
ground.data.materials.append(ground_material)

for location, energy, size, color in [
    ((-3.5, -4.5, 5.8), 1050, 4.5, (1.0, 0.78, 0.64)),
    ((4.0, -0.4, 3.8), 650, 3.5, (0.55, 0.72, 1.0)),
    ((0, 4.4, 5.2), 800, 3.0, (1.0, 0.32, 0.20)),
]:
    bpy.ops.object.light_add(type="AREA", location=location)
    lamp = bpy.context.object
    lamp.data.energy = energy
    lamp.data.size = size
    lamp.data.color = color

bpy.ops.object.camera_add()
camera = bpy.context.object
camera.data.type = "ORTHO"
camera.data.ortho_scale = largest * 1.18

scene = bpy.context.scene
scene.camera = camera
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 960
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.world = bpy.data.worlds.new("TurntableWorld")
scene.world.color = (0.018, 0.021, 0.027)
scene.view_settings.look = "AgX - Medium High Contrast"

views = {
    "three-quarter": (largest * 1.55, minimum.y - largest * 2.0, center.z + largest * 0.92),
    "side": (largest * 2.3, center.y, center.z + largest * 0.30),
    "front": (center.x, minimum.y - largest * 2.35, center.z + largest * 0.25),
}
for name, location in views.items():
    camera.location = location
    camera.rotation_euler = (center - camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.render.filepath = str(output_directory / f"{name}.png")
    bpy.ops.render.render(write_still=True)

print(f"EA_TURNTABLE_RENDER={output_directory}")
