import math
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python render_glb_bone_sweep.py -- model.glb output-directory bone-name")

arguments = sys.argv[sys.argv.index("--") + 1 :]
source_path = Path(arguments[0]).expanduser().resolve()
output_directory = Path(arguments[1]).expanduser().resolve()
bone_name = arguments[2]
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

bpy.ops.mesh.primitive_plane_add(size=largest * 8, location=(center.x, center.y, minimum.z - largest * 0.002))
ground = bpy.context.object
material = bpy.data.materials.new("BoneSweepGround")
material.diffuse_color = (0.08, 0.09, 0.10, 1)
ground.data.materials.append(material)

for offset, energy, size in [((-2.0, -2.4, 3.0), 900, 2.2), ((2.4, 0.5, 1.8), 560, 1.9), ((0, 2.2, 2.7), 720, 1.7)]:
    bpy.ops.object.light_add(type="AREA", location=center + Vector(offset) * largest)
    bpy.context.object.data.energy = energy * largest * largest
    bpy.context.object.data.size = size * largest

bpy.ops.object.camera_add()
camera = bpy.context.object
camera.data.type = "ORTHO"
camera.data.ortho_scale = largest * 1.25
camera.data.clip_start = largest * 0.001
camera.data.clip_end = largest * 100
camera.location = (largest * 2.0, minimum.y - largest * 2.2, center.z + largest * 1.55)
camera.rotation_euler = (center - camera.location).to_track_quat("-Z", "Y").to_euler()

scene = bpy.context.scene
scene.camera = camera
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 768
scene.render.resolution_y = 768
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.world = bpy.data.worlds.new("BoneSweepWorld")
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
bpy.context.view_layer.update()

bone = armature.pose.bones[bone_name]
base_matrix = bone.matrix.copy()
pivot = bone.head.copy()
local_euler_results = {}
for axis in ("X", "Y", "Z"):
    for degrees in (-24, 24):
        bone.matrix = (
            Matrix.Translation(pivot)
            @ Matrix.Rotation(math.radians(degrees), 4, axis)
            @ Matrix.Translation(-pivot)
            @ base_matrix
        )
        bpy.context.view_layer.update()
        local_euler_results[f"{axis}{degrees:+d}"] = tuple(
            round(math.degrees(value), 3) for value in bone.rotation_quaternion.to_euler("XYZ")
        )
        scene.render.filepath = str(output_directory / f"{bone_name}-{axis.lower()}-{degrees:+d}.png")
        bpy.ops.render.render(write_still=True)
        bone.matrix = base_matrix.copy()

print(f"EA_BONE_SWEEP_RENDER={output_directory}")
print(f"EA_BONE_SWEEP_LOCAL_EULERS={local_euler_results}")
