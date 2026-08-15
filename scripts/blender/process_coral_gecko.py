import json
import sys
from pathlib import Path

import bpy
import bmesh
from mathutils import Vector


if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python process_coral_gecko.py -- source.glb project-root")

arguments = sys.argv[sys.argv.index("--") + 1 :]
source_path = Path(arguments[0]).expanduser().resolve()
project_root = Path(arguments[1]).expanduser().resolve()
derived_directory = project_root / "docs/concepts/evolution-v2/coral-gecko/derived"
derived_directory.mkdir(parents=True, exist_ok=True)

clean_high_path = derived_directory / "coral-gecko-clean-high-v1.glb"
runtime_path = derived_directory / "coral-gecko-meshy5-lod0-v1.glb"
target_runtime_triangles = 55_000

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))
obj = next(item for item in bpy.context.scene.objects if item.type == "MESH")
obj.name = "CoralGecko"
obj.data.name = "CoralGeckoMesh"

bm = bmesh.new()
bm.from_mesh(obj.data)
bm.faces.ensure_lookup_table()
remaining = set(range(len(bm.faces)))
faces_to_delete = []
removed_components = []

while remaining:
    seed = remaining.pop()
    stack = [seed]
    component_faces = []
    component_vertices = set()

    while stack:
        face_index = stack.pop()
        face = bm.faces[face_index]
        component_faces.append(face)
        component_vertices.update(face.verts)
        for edge in face.edges:
            for linked_face in edge.link_faces:
                linked_index = linked_face.index
                if linked_index in remaining:
                    remaining.remove(linked_index)
                    stack.append(linked_index)

    coordinates = [vertex.co for vertex in component_vertices]
    minimum = Vector((min(co[axis] for co in coordinates) for axis in range(3)))
    maximum = Vector((max(co[axis] for co in coordinates) for axis in range(3)))
    dimensions = maximum - minimum
    is_tiny_debris = len(component_faces) <= 10
    is_floating_artifact = minimum.x > 0.34 and maximum.y < -0.70 and minimum.z > -0.22

    if is_tiny_debris or is_floating_artifact:
        faces_to_delete.extend(component_faces)
        removed_components.append(
            {
                "seed_face": seed,
                "faces": len(component_faces),
                "reason": "floating-artifact" if is_floating_artifact else "tiny-debris",
                "minimum": [round(value, 6) for value in minimum],
                "maximum": [round(value, 6) for value in maximum],
            }
        )

removed_face_count = len(faces_to_delete)
bmesh.ops.delete(bm, geom=faces_to_delete, context="FACES")
bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
bm.to_mesh(obj.data)
bm.free()
obj.data.update()

minimum_z = min(vertex.co.z for vertex in obj.data.vertices)
for vertex in obj.data.vertices:
    vertex.co.z -= minimum_z

for polygon in obj.data.polygons:
    polygon.use_smooth = True

bpy.context.view_layer.objects.active = obj
obj.select_set(True)


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


clean_triangles = triangle_count(obj.data)
export_glb(clean_high_path)

decimate = obj.modifiers.new(name="RuntimeDecimate", type="DECIMATE")
decimate.decimate_type = "COLLAPSE"
decimate.ratio = min(1.0, target_runtime_triangles / clean_triangles)
decimate.use_collapse_triangulate = True
bpy.ops.object.modifier_apply(modifier=decimate.name)

uv_layer = obj.data.uv_layers.active
degenerate_uv_face_indices = []
if uv_layer:
    for polygon in obj.data.polygons:
        if polygon.loop_total != 3:
            continue
        uv_a, uv_b, uv_c = [uv_layer.data[index].uv for index in polygon.loop_indices]
        signed_area_twice = (uv_b.x - uv_a.x) * (uv_c.y - uv_a.y) - (uv_b.y - uv_a.y) * (uv_c.x - uv_a.x)
        if abs(signed_area_twice) < 0.000000000001:
            degenerate_uv_face_indices.append(polygon.index)

runtime_bm = bmesh.new()
runtime_bm.from_mesh(obj.data)
runtime_bm.faces.ensure_lookup_table()
if degenerate_uv_face_indices:
    bmesh.ops.delete(
        runtime_bm,
        geom=[runtime_bm.faces[index] for index in degenerate_uv_face_indices],
        context="FACES",
    )
bmesh.ops.dissolve_degenerate(runtime_bm, dist=0.000001, edges=list(runtime_bm.edges))
bmesh.ops.recalc_face_normals(runtime_bm, faces=list(runtime_bm.faces))
runtime_bm.to_mesh(obj.data)
runtime_bm.free()
obj.data.validate(clean_customdata=True)
obj.data.update()

for polygon in obj.data.polygons:
    polygon.use_smooth = True

for image in bpy.data.images:
    if image.type == "IMAGE" and max(image.size) > 1024:
        image.scale(1024, 1024)
        image.pack()

runtime_triangles = triangle_count(obj.data)
export_glb(runtime_path)

print(
    "EA_CORAL_GECKO_PROCESS="
    + json.dumps(
        {
            "source": str(source_path),
            "removed_components": removed_components,
            "removed_faces": removed_face_count,
            "clean_triangles": clean_triangles,
            "runtime_triangles": runtime_triangles,
            "removed_degenerate_uv_faces": len(degenerate_uv_face_indices),
            "clean_high": str(clean_high_path),
            "runtime": str(runtime_path),
            "runtime_dimensions": [round(value, 6) for value in obj.dimensions],
            "texture_sizes": {
                image.name: [image.size[0], image.size[1]]
                for image in bpy.data.images
                if image.type == "IMAGE"
            },
        },
        ensure_ascii=False,
        separators=(",", ":"),
    )
)
