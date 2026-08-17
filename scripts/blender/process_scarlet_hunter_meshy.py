import json
import sys
from pathlib import Path

import bpy
import bmesh


if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python process_scarlet_hunter_meshy.py -- source.glb project-root")

arguments = sys.argv[sys.argv.index("--") + 1:]
source_path = Path(arguments[0]).expanduser().resolve()
project_root = Path(arguments[1]).expanduser().resolve()
derived_directory = project_root / "docs/concepts/evolution-v2/scarlet-hunter/derived/production-v2"
derived_directory.mkdir(parents=True, exist_ok=True)

clean_high_path = derived_directory / "scarlet-hunter-meshy-clean-high-v1.glb"
runtime_path = derived_directory / "scarlet-hunter-meshy-web-lod-v1.glb"
target_runtime_triangles = 36_000

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))
obj = next(item for item in bpy.context.scene.objects if item.type == "MESH")
obj.name = "ScarletHunterSource"
obj.data.name = "ScarletHunterSourceMesh"


def triangle_count(mesh):
    mesh.calc_loop_triangles()
    return len(mesh.loop_triangles)


def export_glb(path):
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_tangents=True,
        export_materials="EXPORT",
        export_animations=False,
    )


def remove_degenerate_uv_faces(mesh, threshold=0.00000001):
    uv_layer = mesh.uv_layers.active
    face_indices = []
    if uv_layer:
        for polygon in mesh.polygons:
            if polygon.loop_total != 3:
                continue
            uv_a, uv_b, uv_c = [uv_layer.data[index].uv for index in polygon.loop_indices]
            signed_area_twice = (uv_b.x - uv_a.x) * (uv_c.y - uv_a.y) - (uv_b.y - uv_a.y) * (uv_c.x - uv_a.x)
            if abs(signed_area_twice) < threshold:
                face_indices.append(polygon.index)
    cleanup_bm = bmesh.new()
    cleanup_bm.from_mesh(mesh)
    cleanup_bm.faces.ensure_lookup_table()
    if face_indices:
        bmesh.ops.delete(cleanup_bm, geom=[cleanup_bm.faces[index] for index in face_indices], context="FACES")
    bmesh.ops.dissolve_degenerate(cleanup_bm, dist=0.000001, edges=list(cleanup_bm.edges))
    bmesh.ops.recalc_face_normals(cleanup_bm, faces=list(cleanup_bm.faces))
    cleanup_bm.to_mesh(mesh)
    cleanup_bm.free()
    mesh.validate(clean_customdata=True)
    mesh.update()
    return len(face_indices)


def remove_invalid_tangent_faces(mesh, threshold=0.0000000001, max_passes=8):
    """Remove only triangles whose UV tangent basis cannot be normalized.

    Blender's glTF exporter writes tangents per split loop. A nearly collapsed
    UV island can survive the area test above yet still yield a zero tangent,
    which glTF Validator correctly rejects. Recalculate the real loop tangents
    and remove the owning triangles until every exported tangent is valid.
    """
    removed_faces = 0
    for _pass_index in range(max_passes):
        mesh.calc_tangents()
        bad_polygon_indices = {
            polygon.index
            for polygon in mesh.polygons
            if any(
                mesh.loops[loop_index].tangent.length_squared <= threshold
                for loop_index in polygon.loop_indices
            )
        }
        mesh.free_tangents()
        if not bad_polygon_indices:
            break

        cleanup_bm = bmesh.new()
        cleanup_bm.from_mesh(mesh)
        cleanup_bm.faces.ensure_lookup_table()
        bmesh.ops.delete(
            cleanup_bm,
            geom=[cleanup_bm.faces[index] for index in sorted(bad_polygon_indices)],
            context="FACES",
        )
        bmesh.ops.recalc_face_normals(cleanup_bm, faces=list(cleanup_bm.faces))
        cleanup_bm.to_mesh(mesh)
        cleanup_bm.free()
        mesh.validate(clean_customdata=True)
        mesh.update()
        removed_faces += len(bad_polygon_indices)
    return removed_faces


# Keep the full Meshy silhouette intact. Only normalize grounding, normals and
# export metadata before preserving a clean archival high-detail derivative.
minimum_z = min(vertex.co.z for vertex in obj.data.vertices)
for vertex in obj.data.vertices:
    vertex.co.z -= minimum_z
for polygon in obj.data.polygons:
    polygon.use_smooth = True
obj.data.validate(clean_customdata=True)
obj.data.update()
clean_high_degenerate_uv_faces = remove_degenerate_uv_faces(obj.data)
clean_high_invalid_tangent_faces = remove_invalid_tangent_faces(obj.data)

bpy.ops.object.select_all(action="DESELECT")
obj.select_set(True)
bpy.context.view_layer.objects.active = obj

clean_triangles = triangle_count(obj.data)
export_glb(clean_high_path)

# The runtime LOD matches the established player-character budget class while
# leaving enough density for the crown, claws, joints and curled tail contour.
decimate = obj.modifiers.new(name="WebRuntimeRetopology", type="DECIMATE")
decimate.decimate_type = "COLLAPSE"
decimate.ratio = min(1.0, target_runtime_triangles / clean_triangles)
decimate.use_collapse_triangulate = True
bpy.ops.object.modifier_apply(modifier=decimate.name)

runtime_degenerate_uv_faces = remove_degenerate_uv_faces(obj.data)
runtime_invalid_tangent_faces = remove_invalid_tangent_faces(obj.data)
for polygon in obj.data.polygons:
    polygon.use_smooth = True

# One-kilopixel maps are the first browser candidate. The 2K clean-high file is
# retained so a later quality/performance comparison never needs regeneration.
for image in bpy.data.images:
    if image.type == "IMAGE" and max(image.size) > 1024:
        image.scale(1024, 1024)
        image.pack()

runtime_triangles = triangle_count(obj.data)
export_glb(runtime_path)

print("EA_SCARLET_HUNTER_PROCESS=" + json.dumps({
    "source": str(source_path),
    "clean_high": str(clean_high_path),
    "runtime": str(runtime_path),
    "clean_triangles": clean_triangles,
    "runtime_triangles": runtime_triangles,
    "removed_clean_high_degenerate_uv_faces": clean_high_degenerate_uv_faces,
    "removed_clean_high_invalid_tangent_faces": clean_high_invalid_tangent_faces,
    "removed_runtime_degenerate_uv_faces": runtime_degenerate_uv_faces,
    "removed_runtime_invalid_tangent_faces": runtime_invalid_tangent_faces,
    "runtime_dimensions": [round(value, 6) for value in obj.dimensions],
    "texture_sizes": {
        image.name: [image.size[0], image.size[1]]
        for image in bpy.data.images
        if image.type == "IMAGE"
    },
}, ensure_ascii=False))
