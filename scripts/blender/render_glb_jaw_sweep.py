import math
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python render_glb_jaw_sweep.py -- model.glb output-directory")

arguments = sys.argv[sys.argv.index("--") + 1 :]
source_path = Path(arguments[0]).expanduser().resolve()
output_directory = Path(arguments[1]).expanduser().resolve()
output_directory.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))
armature = next(item for item in bpy.context.scene.objects if item.type == "ARMATURE")
meshes = [item for item in bpy.context.scene.objects if item.type == "MESH" and len(item.data.vertices) > 1_000]
corners = [item.matrix_world @ Vector(corner) for item in meshes for corner in item.bound_box]
minimum = Vector((min(corner[axis] for corner in corners) for axis in range(3)))
maximum = Vector((max(corner[axis] for corner in corners) for axis in range(3)))
center = (minimum + maximum) * 0.5
largest = max(maximum - minimum)

bpy.ops.mesh.primitive_plane_add(size=12, location=(0, 0, minimum.z - 0.002))
ground = bpy.context.object
ground_material = bpy.data.materials.new("JawSweepGround")
ground_material.diffuse_color = (0.09, 0.105, 0.115, 1)
ground.data.materials.append(ground_material)

for relative_location, energy, relative_size in [((-3.5, -4.2, 5.4), 900, 4.0), ((4.2, 0.8, 3.2), 560, 3.5), ((0, 4.0, 4.8), 720, 3.0)]:
    location = tuple(center[index] + relative_location[index] * largest for index in range(3))
    bpy.ops.object.light_add(type="AREA", location=location)
    bpy.context.object.data.energy = energy * largest * largest
    bpy.context.object.data.size = relative_size * largest

bpy.ops.object.camera_add()
camera = bpy.context.object
camera.data.type = "ORTHO"
camera.data.ortho_scale = largest * 1.22
camera.data.clip_start = max(largest * 0.01, 0.00001)
camera.data.clip_end = max(largest * 20, 1.0)
camera.location = (largest * 2.0, minimum.y - largest * 2.2, center.z + largest * 1.55)
camera.rotation_euler = (center - camera.location).to_track_quat("-Z", "Y").to_euler()

scene = bpy.context.scene
scene.camera = camera
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 768
scene.render.resolution_y = 768
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.world = bpy.data.worlds.new("JawSweepWorld")
scene.world.color = (0.018, 0.024, 0.03)
scene.view_settings.look = "AgX - Medium High Contrast"

for track in armature.animation_data.nla_tracks:
    track.mute = True
armature.animation_data.action = None
scene.frame_set(0)
for pose_bone in armature.pose.bones:
    pose_bone.rotation_mode = "QUATERNION"
    pose_bone.rotation_quaternion = (1, 0, 0, 0)
    pose_bone.location = (0, 0, 0)
    pose_bone.scale = (1, 1, 1)

jaw = armature.pose.bones["Jaw"]
tests = [
    ("world-x-pos", "X", 45),
    ("world-x-neg", "X", -45),
    ("world-y-pos", "Y", 45),
    ("world-y-neg", "Y", -45),
    ("world-z-pos", "Z", 45),
    ("world-z-neg", "Z", -45),
]
base_matrix = jaw.matrix.copy()
pivot = jaw.head.copy()
for name, axis, degrees in tests:
    jaw.matrix = (
        Matrix.Translation(pivot)
        @ Matrix.Rotation(math.radians(degrees), 4, axis)
        @ Matrix.Translation(-pivot)
        @ base_matrix
    )
    bpy.context.view_layer.update()
    scene.render.filepath = str(output_directory / f"jaw-{name}.png")
    bpy.ops.render.render(write_still=True)

print(f"EA_JAW_SWEEP_RENDER={output_directory}")
