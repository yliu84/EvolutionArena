import sys
from pathlib import Path

import bpy
from mathutils import Vector


if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python render_glb_turntable.py -- model.glb output-directory")

arguments = sys.argv[sys.argv.index("--") + 1 :]
source_path = Path(arguments[0]).expanduser().resolve()
output_directory = Path(arguments[1]).expanduser().resolve()
output_directory.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))
mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]

world_corners = [obj.matrix_world @ Vector(corner) for obj in mesh_objects for corner in obj.bound_box]
minimum = Vector((min(corner[axis] for corner in world_corners) for axis in range(3)))
maximum = Vector((max(corner[axis] for corner in world_corners) for axis in range(3)))
center = (minimum + maximum) * 0.5
center.z = minimum.z + (maximum.z - minimum.z) * 0.48
largest_dimension = max(maximum - minimum)

bpy.ops.mesh.primitive_plane_add(size=12, location=(0, 0, minimum.z - 0.002))
ground = bpy.context.object
ground.name = "PreviewGround"
ground_material = bpy.data.materials.new("PreviewGroundMaterial")
ground_material.diffuse_color = (0.12, 0.14, 0.15, 1)
ground.data.materials.append(ground_material)

bpy.ops.object.light_add(type="AREA", location=(-3.2, -4.0, 5.2))
key = bpy.context.object
key.data.energy = 850
key.data.shape = "DISK"
key.data.size = 4.0

bpy.ops.object.light_add(type="AREA", location=(4.0, 1.5, 3.0))
fill = bpy.context.object
fill.data.energy = 520
fill.data.size = 3.5

bpy.ops.object.light_add(type="AREA", location=(0.0, 4.0, 4.6))
rim = bpy.context.object
rim.data.energy = 680
rim.data.size = 3.0

bpy.ops.object.camera_add()
camera = bpy.context.object
camera.data.type = "ORTHO"
camera.data.ortho_scale = largest_dimension * 1.34
bpy.context.scene.camera = camera

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 768
scene.render.resolution_y = 768
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.film_transparent = False
scene.render.image_settings.color_mode = "RGBA"
scene.world = bpy.data.worlds.new("PreviewWorld")
scene.world.color = (0.022, 0.028, 0.034)
scene.view_settings.look = "AgX - Medium High Contrast"


def aim_camera(position, target):
    camera.location = Vector(position)
    camera.rotation_euler = (Vector(target) - camera.location).to_track_quat("-Z", "Y").to_euler()


distance = largest_dimension * 2.8
views = {
    "front": (0, minimum.y - distance, center.z + largest_dimension * 0.06),
    "side": (minimum.x - distance, center.y, center.z + largest_dimension * 0.06),
    "rear": (0, maximum.y + distance, center.z + largest_dimension * 0.06),
    "gameplay": (distance * 0.72, minimum.y - distance * 0.78, center.z + distance * 0.72),
}

for name, position in views.items():
    aim_camera(position, center)
    scene.render.filepath = str(output_directory / f"{name}.png")
    bpy.ops.render.render(write_still=True)

print(f"EA_TURNTABLE_RENDER={output_directory}")
