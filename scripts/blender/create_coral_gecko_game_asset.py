import json
import sys
from pathlib import Path

import bpy
import bmesh


if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python create_coral_gecko_game_asset.py -- source.glb output.glb")

arguments = sys.argv[sys.argv.index("--") + 1 :]
source_path = Path(arguments[0]).expanduser().resolve()
output_path = Path(arguments[1]).expanduser().resolve()
output_path.parent.mkdir(parents=True, exist_ok=True)
target_triangles = 32_000

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))
mesh = next(item for item in bpy.context.scene.objects if item.type == "MESH")
bpy.context.view_layer.objects.active = mesh
mesh.select_set(True)

mesh.data.calc_loop_triangles()
source_triangles = len(mesh.data.loop_triangles)
modifier = mesh.modifiers.new(name="WebGameLOD", type="DECIMATE")
modifier.decimate_type = "COLLAPSE"
modifier.ratio = min(1.0, target_triangles / max(1, source_triangles))
modifier.use_collapse_triangulate = True
bpy.ops.object.modifier_apply(modifier=modifier.name)

cleanup = bmesh.new()
cleanup.from_mesh(mesh.data)
bmesh.ops.dissolve_degenerate(cleanup, dist=0.000001, edges=list(cleanup.edges))
bmesh.ops.recalc_face_normals(cleanup, faces=list(cleanup.faces))
cleanup.to_mesh(mesh.data)
cleanup.free()
mesh.data.validate(clean_customdata=True)
mesh.data.update()

for polygon in mesh.data.polygons:
    polygon.use_smooth = True

for image in bpy.data.images:
    if image.type == "IMAGE" and max(image.size) > 1024:
        image.scale(1024, 1024)
    if image.type == "IMAGE":
        image.pack()

mesh.data.calc_loop_triangles()
runtime_triangles = len(mesh.data.loop_triangles)

bpy.ops.export_scene.gltf(
    filepath=str(output_path),
    export_format="GLB",
    use_selection=True,
    export_yup=True,
    export_tangents=True,
    export_materials="EXPORT",
    export_animations=False,
)

print(
    "EA_CORAL_GECKO_GAME_ASSET="
    + json.dumps(
        {
            "source": str(source_path),
            "output": str(output_path),
            "source_triangles": source_triangles,
            "runtime_triangles": runtime_triangles,
            "dimensions": [round(value, 6) for value in mesh.dimensions],
            "texture_sizes": {
                image.name: [image.size[0], image.size[1]]
                for image in bpy.data.images
                if image.type == "IMAGE"
            },
        },
        separators=(",", ":"),
    )
)
