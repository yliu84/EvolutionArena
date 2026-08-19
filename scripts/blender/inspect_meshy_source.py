"""Report what a Meshy export actually contains, and render it.

Written after doing this by hand three times and getting it wrong twice. Both
mistakes came from measuring the scene rather than the creature:

- The `Icosphere` viewport helper Meshy ships is two units across against a
  creature that can be a hundredth of that, so the bounding box of the scene is
  the bounding box of the helper. The Ford Fang came out 230 times too big.
- A skinned mesh's rest-pose bounds are not its world bounds. The armature
  carries a scale - usually 0.01 - so the evaluated mesh has to be measured,
  through the armature, or nothing lines up.

And one that only wasted time: at its authored size the creature can sit inside
the camera's near clip plane, so the render comes back empty with nothing wrong
but the scale. It is normalised before framing.

Usage:
  blender --background --python scripts/blender/inspect_meshy_source.py \
      -- source.glb output-directory
"""

import json
import math
import os
import sys

import bpy
from mathutils import Vector

if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python inspect_meshy_source.py -- source.glb outdir")

arguments = sys.argv[sys.argv.index("--") + 1:]
source_path = arguments[0]
output_directory = arguments[1] if len(arguments) > 1 else "."
os.makedirs(output_directory, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=source_path)

meshes = [item for item in bpy.data.objects if item.type == "MESH"]
creature = max(meshes, key=lambda item: len(item.data.vertices))
helpers = [item.name for item in meshes if item is not creature]
for item in meshes:
    if item is not creature:
        bpy.data.objects.remove(item, do_unlink=True)

armatures = [item for item in bpy.data.objects if item.type == "ARMATURE"]
armature = armatures[0] if armatures else None

depsgraph = bpy.context.evaluated_depsgraph_get()
evaluated = creature.evaluated_get(depsgraph)
evaluated_mesh = evaluated.to_mesh()
evaluated_mesh.calc_loop_triangles()
triangles = len(evaluated_mesh.loop_triangles)
low = Vector((1e18, 1e18, 1e18))
high = Vector((-1e18, -1e18, -1e18))
for vertex in evaluated_mesh.vertices:
    world = evaluated.matrix_world @ vertex.co
    for axis in range(3):
        low[axis] = min(low[axis], world[axis])
        high[axis] = max(high[axis], world[axis])
evaluated.to_mesh_clear()
size = high - low
centre = (high + low) / 2
vertical = min(range(3), key=lambda axis: size[axis]) if size.z > max(size.x, size.y) else 2
height = size[2]
horizontal = sorted([size[0], size[1]], reverse=True)

report = {
    "source": source_path,
    "triangles": triangles,
    "helperMeshesRemoved": helpers,
    "worldSize": [round(value, 4) for value in size],
    "lengthToHeight": round(horizontal[0] / max(1e-9, height), 2),
    "widthToHeight": round(horizontal[1] / max(1e-9, height), 2),
    "materials": [material.name for material in creature.data.materials],
    "images": [[image.name, list(image.size)] for image in bpy.data.images if image.type == "IMAGE"],
    "animations": [action.name for action in bpy.data.actions],
    "bones": len(armature.data.bones) if armature else 0,
    "boneNaming": "semantic" if armature and not all(
        bone.name.startswith("Bone_") for bone in armature.data.bones
    ) else "unnamed-autorig",
    "armatureScale": [round(value, 4) for value in armature.scale] if armature else None,
}
print("EA_MESHY_INSPECT=" + json.dumps(report, ensure_ascii=False))

if armature:
    factor = 2.0 / max(1e-9, height)
    armature.scale = tuple(value * factor for value in armature.scale)
    bpy.context.view_layer.update()
    size = size * factor
    centre = centre * factor

world = bpy.data.worlds.new("Review")
bpy.context.scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.06, 0.08, 0.07, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 1.5
for rotation, energy in [((55, 0, 40), 4.5), ((62, 0, -125), 1.8)]:
    light = bpy.data.lights.new("Key", "SUN")
    light.energy = energy
    holder = bpy.data.objects.new("Key", light)
    bpy.context.collection.objects.link(holder)
    holder.rotation_euler = tuple(math.radians(value) for value in rotation)

camera_data = bpy.data.cameras.new("Review")
camera_data.lens = 58
camera = bpy.data.objects.new("Review", camera_data)
bpy.context.collection.objects.link(camera)
bpy.context.scene.camera = camera
scene = bpy.context.scene
scene.render.resolution_x = 900
scene.render.resolution_y = 700
radius = max(size) * 1.75
for name, angle in [("three-quarter", 48), ("side", 90), ("front", 2)]:
    radians = math.radians(angle)
    camera.location = centre + Vector((math.sin(radians) * radius, -math.cos(radians) * radius, size.z * 0.5))
    camera.rotation_euler = (centre - camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.render.filepath = os.path.join(output_directory, f"inspect-{name}.png")
    bpy.ops.render.render(write_still=True)
