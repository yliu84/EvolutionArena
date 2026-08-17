import sys
from pathlib import Path

import bpy
from mathutils import Vector


if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python render_glb_attack_poses.py -- model.glb output-directory")

arguments = sys.argv[sys.argv.index("--") + 1 :]
source_path = Path(arguments[0]).expanduser().resolve()
output_directory = Path(arguments[1]).expanduser().resolve()
output_directory.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))
armature = next(item for item in bpy.context.scene.objects if item.type == "ARMATURE")
# Meshy exports a low-vertex rig helper sphere alongside the character. It is
# not game geometry and would make the centimeter-authored creature disappear
# in a full-scene framing calculation.
meshes = [
    item for item in bpy.context.scene.objects
    if item.type == "MESH" and len(item.data.vertices) > 1_000
]
corners = [item.matrix_world @ Vector(corner) for item in meshes for corner in item.bound_box]
minimum = Vector((min(corner[axis] for corner in corners) for axis in range(3)))
maximum = Vector((max(corner[axis] for corner in corners) for axis in range(3)))
center = (minimum + maximum) * 0.5
largest = max(maximum - minimum)

bpy.ops.mesh.primitive_plane_add(size=12, location=(0, 0, minimum.z - 0.002))
ground = bpy.context.object
ground_material = bpy.data.materials.new("AttackPreviewGround")
ground_material.diffuse_color = (0.09, 0.105, 0.115, 1)
ground.data.materials.append(ground_material)

for relative_location, energy, relative_size in [((-3.5, -4.2, 5.4), 900, 4.0), ((4.2, 0.8, 3.2), 560, 3.5), ((0, 4.0, 4.8), 720, 3.0)]:
    location = tuple(center[index] + relative_location[index] * largest for index in range(3))
    bpy.ops.object.light_add(type="AREA", location=location)
    # Area-light power must follow the square of the centimeter-authored scene
    # scale; keeping meter-scale wattage here blows the texture out to white.
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
scene.world = bpy.data.worlds.new("AttackPreviewWorld")
scene.world.color = (0.018, 0.024, 0.03)
scene.view_settings.look = "AgX - Medium High Contrast"

pose_frames = [
    ("Claw", 8, "claw-contact"),
    ("Bite", 6, "bite-gape"),
    ("Bite", 10, "bite-contact"),
    ("Bite", 14, "bite-tear"),
    ("TailSwipe", 15, "tailswipe-contact"),
]
for action_name, frame, output_name in pose_frames:
    for track in armature.animation_data.nla_tracks:
        track.mute = True
    for pose_bone in armature.pose.bones:
        pose_bone.rotation_mode = "QUATERNION"
        pose_bone.rotation_quaternion = (1, 0, 0, 0)
        pose_bone.location = (0, 0, 0)
        pose_bone.scale = (1, 1, 1)
    armature.animation_data.action = bpy.data.actions[action_name]
    scene.frame_set(frame)
    scene.render.filepath = str(output_directory / f"{output_name}.png")
    bpy.ops.render.render(write_still=True)

print(f"EA_ATTACK_POSE_RENDER={output_directory}")
