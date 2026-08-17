import json
import sys
from pathlib import Path

import bpy
import bmesh


if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python retopologize_scarlet_hunter_meshy.py -- source.glb output.glb")

arguments = sys.argv[sys.argv.index("--") + 1 :]
source_path = Path(arguments[0]).expanduser().resolve()
output_path = Path(arguments[1]).expanduser().resolve()
output_path.parent.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))
source = next(item for item in bpy.context.scene.objects if item.type == "MESH")
source.name = "ScarletHunterProjectionSource"

target = source.copy()
target.data = source.data.copy()
target.name = "ScarletHunterRetopology"
target.data.name = "ScarletHunterRetopologyMesh"
bpy.context.collection.objects.link(target)

bpy.ops.object.select_all(action="DESELECT")
target.select_set(True)
bpy.context.view_layer.objects.active = target

# 18K quads triangulate to roughly the established 36K runtime class. Preserve
# boundaries and sharp anatomy while replacing Meshy's animation-hostile micro
# triangles with continuous surface flow.
bpy.ops.object.quadriflow_remesh(
    mode="FACES",
    target_faces=18_000,
    use_mesh_symmetry=False,
    use_preserve_sharp=True,
    use_preserve_boundary=True,
    preserve_attributes=False,
    smooth_normals=True,
)

if not target.data.uv_layers:
    target.data.uv_layers.new(name="UVMap")

# Project the accepted source's per-loop UVs onto the new surface. This retains
# the generated color/material identity without baking approximation into it.
transfer = target.modifiers.new(name="ProjectAcceptedMeshyUV", type="DATA_TRANSFER")
transfer.object = source
transfer.use_loop_data = True
transfer.data_types_loops = {"UV"}
transfer.loop_mapping = "POLYINTERP_NEAREST"
bpy.ops.object.modifier_apply(modifier=transfer.name)


def remove_invalid_tangent_faces(mesh, threshold=0.0000000001):
    removed = 0
    for _pass_index in range(8):
        mesh.calc_tangents()
        bad = {
            polygon.index
            for polygon in mesh.polygons
            if any(mesh.loops[index].tangent.length_squared <= threshold for index in polygon.loop_indices)
        }
        mesh.free_tangents()
        if not bad:
            break
        cleanup = bmesh.new()
        cleanup.from_mesh(mesh)
        cleanup.faces.ensure_lookup_table()
        bmesh.ops.delete(cleanup, geom=[cleanup.faces[index] for index in sorted(bad)], context="FACES")
        bmesh.ops.recalc_face_normals(cleanup, faces=list(cleanup.faces))
        cleanup.to_mesh(mesh)
        cleanup.free()
        mesh.validate(clean_customdata=True)
        mesh.update()
        removed += len(bad)
    return removed


removed_invalid_tangent_faces = remove_invalid_tangent_faces(target.data)

for polygon in target.data.polygons:
    polygon.use_smooth = True
target.data.validate(clean_customdata=True)
target.data.update()

source.hide_render = True
source.hide_set(True)
bpy.ops.object.select_all(action="DESELECT")
target.select_set(True)
bpy.context.view_layer.objects.active = target

bpy.ops.export_scene.gltf(
    filepath=str(output_path),
    export_format="GLB",
    use_selection=True,
    export_yup=True,
    export_tangents=True,
    export_materials="EXPORT",
    export_animations=False,
)

target.data.calc_loop_triangles()
print("EA_SCARLET_HUNTER_RETOPOLOGY=" + json.dumps({
    "source": str(source_path),
    "output": str(output_path),
    "vertices": len(target.data.vertices),
    "polygons": len(target.data.polygons),
    "triangles": len(target.data.loop_triangles),
    "removed_invalid_tangent_faces": removed_invalid_tangent_faces,
    "dimensions": [round(value, 6) for value in target.dimensions],
}, ensure_ascii=False))
