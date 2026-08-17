import colorsys
import json
import sys
from pathlib import Path

import bpy


if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python create_lowpoly_toon_hunter.py -- source.glb output.glb")

arguments = sys.argv[sys.argv.index("--") + 1 :]
source_path = Path(arguments[0]).expanduser().resolve()
output_path = Path(arguments[1]).expanduser().resolve()
target_triangles = int(arguments[2]) if len(arguments) > 2 else 8000
output_path.parent.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))

armature = next(item for item in bpy.context.scene.objects if item.type == "ARMATURE")
mesh = max(
    (item for item in bpy.context.scene.objects if item.type == "MESH"),
    key=lambda item: sum(max(1, len(polygon.vertices) - 2) for polygon in item.data.polygons),
)

armature.name = "ScarletHunterToonRig"
armature.data.name = "ScarletHunterToonSkeleton"
armature["ea_form_id"] = "scarlet-hunter"
armature["ea_style"] = "low-poly-toon-v1"
armature["ea_source_asset"] = source_path.name
mesh.name = "ScarletHunterToonMesh"
mesh_world = mesh.matrix_world.copy()
mesh.parent = None
mesh.matrix_world = mesh_world

# The accepted GLB may include tiny helper meshes. The toon candidate keeps the
# same single skinned creature mesh and immutable armature/animation contract.
for item in list(bpy.context.scene.objects):
    if item.type == "MESH" and item != mesh:
        bpy.data.objects.remove(item, do_unlink=True)

before_triangles = sum(max(1, len(polygon.vertices) - 2) for polygon in mesh.data.polygons)
bpy.ops.object.select_all(action="DESELECT")
mesh.select_set(True)
bpy.context.view_layer.objects.active = mesh
if before_triangles > target_triangles:
    decimate = mesh.modifiers.new(name="ToonSilhouetteDecimate", type="DECIMATE")
    decimate.decimate_type = "COLLAPSE"
    decimate.ratio = max(0.05, min(1.0, target_triangles / before_triangles))
    decimate.use_collapse_triangulate = True
    while mesh.modifiers.find(decimate.name) > 0:
        bpy.ops.object.modifier_move_up(modifier=decimate.name)
    bpy.ops.object.modifier_apply(modifier=decimate.name)

# Flat polygon planes are the style. Do not reintroduce photoreal smoothing or
# normal-map microdetail at runtime.
for polygon in mesh.data.polygons:
    polygon.use_smooth = False
mesh.data.set_sharp_from_angle(angle=0.72)
mesh.data.update()


def toon_color(red, green, blue):
    hue, saturation, value = colorsys.rgb_to_hsv(red, green, blue)
    # Preserve the amber eye as one bright graphic focal point.
    if 0.055 <= hue <= 0.16 and saturation >= 0.48 and value >= 0.22:
        return (0.96, 0.50 if value > 0.48 else 0.32, 0.07)
    # Cream horn, claw and belly planes use two warm values.
    if saturation < 0.34 and value >= 0.34:
        return (0.93, 0.78, 0.48) if value >= 0.62 else (0.66, 0.56, 0.35)
    # Very dark creases become warm burgundy rather than crushed black.
    if value < 0.16:
        return (0.18, 0.045, 0.055)
    # Red body uses three deliberately separated hand-painted bands.
    if hue >= 0.90 or hue <= 0.09 or red > green * 1.25:
        if value >= 0.57:
            return (0.90, 0.24, 0.17)
        if value >= 0.31:
            return (0.64, 0.105, 0.09)
        return (0.37, 0.055, 0.07)
    # Residual cool source colors become a restrained teal rim/accent.
    if 0.32 <= hue <= 0.62 and saturation >= 0.18:
        return (0.20, 0.48, 0.43) if value >= 0.42 else (0.10, 0.27, 0.25)
    level = 0.22 if value < 0.35 else 0.46 if value < 0.62 else 0.72
    return (level * 0.92, level * 0.72, level * 0.55)


processed_images = set()
for material in mesh.data.materials:
    if not material:
        continue
    material.name = "ScarletHunterToonPaint"
    material.diffuse_color = (0.64, 0.105, 0.09, 1.0)
    material.metallic = 0.0
    material.roughness = 0.82
    material["ea_style"] = "low-poly-toon-v1"
    if not material.use_nodes:
        continue
    nodes = material.node_tree.nodes
    principled = next((node for node in nodes if node.type == "BSDF_PRINCIPLED"), None)
    if principled:
        principled.inputs["Metallic"].default_value = 0.0
        principled.inputs["Roughness"].default_value = 0.82
        for input_name in ("Normal", "Coat Normal"):
            socket = principled.inputs.get(input_name)
            if socket:
                for link in list(socket.links):
                    material.node_tree.links.remove(link)
    for node in nodes:
        if node.type != "TEX_IMAGE" or not node.image:
            continue
        node.interpolation = "Closest"
        image = node.image
        if image.name in processed_images or image.channels < 3:
            continue
        processed_images.add(image.name)
        pixels = list(image.pixels)
        for index in range(0, len(pixels), image.channels):
            red, green, blue = pixels[index : index + 3]
            pixels[index : index + 3] = toon_color(red, green, blue)
        image.pixels[:] = pixels
        image.name = "ScarletHunterToonPalette"
        image.pack()

after_triangles = sum(max(1, len(polygon.vertices) - 2) for polygon in mesh.data.polygons)
armature["ea_triangle_budget"] = after_triangles
armature["ea_palette"] = "crimson-cream-teal-amber"

# Preserve every accepted named clip and all 21 deform bones. Exporting the
# derived candidate never overwrites the 32k master source.
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(
    filepath=str(output_path),
    export_format="GLB",
    use_selection=True,
    export_apply=False,
    export_animations=True,
    export_frame_range=True,
    export_force_sampling=True,
    export_skins=True,
    export_all_influences=True,
    export_morph=False,
    export_materials="EXPORT",
    export_image_format="AUTO",
    export_yup=True,
)

print(json.dumps({
    "source": str(source_path),
    "output": str(output_path),
    "triangles_before": before_triangles,
    "triangles_after": after_triangles,
    "bones": len(armature.data.bones),
    "actions": sorted(action.name for action in bpy.data.actions),
    "style": "low-poly-toon-v1",
}, ensure_ascii=False))
