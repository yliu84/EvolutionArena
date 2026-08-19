"""Cleanups every Meshy export needs after collapse decimation.

Extracted from the Spore Stalker run, which is where both of these were first
diagnosed. That script keeps its own copies: it produced an accepted, shipped
model and re-running it is not part of any current task, so it is left alone
rather than refactored on the way past.

Both problems are created by decimation rather than by Meshy: collapsing an
already-UV-mapped mesh leaves triangles whose UV island has no area, and those
export a zero-length tangent that the glTF validator rejects outright.
"""

import bmesh
import bpy


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
