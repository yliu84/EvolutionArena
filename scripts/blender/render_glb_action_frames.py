import json
import sys
from pathlib import Path

import bpy
from mathutils import Vector


if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python render_glb_action_frames.py -- model.glb output-directory [action-name]")

arguments = sys.argv[sys.argv.index("--") + 1 :]
source_path = Path(arguments[0]).expanduser().resolve()
output_directory = Path(arguments[1]).expanduser().resolve()
requested_action = arguments[2] if len(arguments) > 2 else None
output_directory.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))
armature = next(item for item in bpy.context.scene.objects if item.type == "ARMATURE")
all_meshes = [item for item in bpy.context.scene.objects if item.type == "MESH"]
# Meshy animation exports include a two-metre Icosphere helper while the actual
# centimetre-authored character is roughly 0.02 Blender units. Frame only the
# highest-detail skinned character; otherwise it becomes a one-pixel dot.
meshes = [max(all_meshes, key=lambda item: len(item.data.vertices))]
action = bpy.data.actions.get(requested_action) if requested_action else next(iter(bpy.data.actions))
if action is None:
    raise SystemExit(f"Action not found: {requested_action}")

scene = bpy.context.scene
scene.frame_set(int(action.frame_range[0]))
corners = [item.matrix_world @ Vector(corner) for item in meshes for corner in item.bound_box]
minimum = Vector((min(corner[axis] for corner in corners) for axis in range(3)))
maximum = Vector((max(corner[axis] for corner in corners) for axis in range(3)))
center = (minimum + maximum) * 0.5
largest = max(maximum - minimum)

bpy.ops.mesh.primitive_plane_add(size=largest * 8, location=(center.x, center.y, minimum.z - largest * 0.002))
ground = bpy.context.object
ground_material = bpy.data.materials.new("ActionFrameGround")
ground_material.diffuse_color = (0.08, 0.09, 0.10, 1)
ground.data.materials.append(ground_material)

for offset, energy, size in [((-2.0, -2.4, 3.0), 900, 2.2), ((2.4, 0.5, 1.8), 560, 1.9), ((0, 2.2, 2.7), 720, 1.7)]:
    location = center + Vector(offset) * largest
    bpy.ops.object.light_add(type="AREA", location=location)
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

scene.camera = camera
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 768
scene.render.resolution_y = 768
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.world = bpy.data.worlds.new("ActionFrameWorld")
scene.world.color = (0.018, 0.024, 0.03)
scene.view_settings.look = "AgX - Medium High Contrast"

armature.animation_data_create()
if armature.animation_data:
    for track in armature.animation_data.nla_tracks:
        track.mute = True
    armature.animation_data.action = action

start, end = action.frame_range
frames = [round(start + (end - start) * fraction) for fraction in (0, 0.25, 0.5, 0.75, 1.0)]
for index, frame in enumerate(frames):
    scene.frame_set(frame)
    scene.render.filepath = str(output_directory / f"{index}-{frame}.png")
    bpy.ops.render.render(write_still=True)

print("EA_ACTION_FRAMES=" + json.dumps({
    "source": str(source_path),
    "action": action.name,
    "frame_range": [start, end],
    "frames": frames,
    "output": str(output_directory),
}, ensure_ascii=False))
