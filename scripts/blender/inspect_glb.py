import json
import sys
from pathlib import Path

import bpy
import bmesh


def arguments_after_separator():
    if "--" not in sys.argv:
        raise SystemExit("Usage: blender --background --python inspect_glb.py -- model.glb")
    return sys.argv[sys.argv.index("--") + 1 :]


def connected_face_components(mesh):
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.faces.ensure_lookup_table()
    remaining = set(range(len(bm.faces)))
    component_sizes = []

    while remaining:
        seed = remaining.pop()
        stack = [seed]
        face_count = 0

        while stack:
            face_index = stack.pop()
            face = bm.faces[face_index]
            face_count += 1
            for edge in face.edges:
                for linked_face in edge.link_faces:
                    linked_index = linked_face.index
                    if linked_index in remaining:
                        remaining.remove(linked_index)
                        stack.append(linked_index)

        component_sizes.append(face_count)

    bm.free()
    return sorted(component_sizes, reverse=True)


source_path = Path(arguments_after_separator()[0]).expanduser().resolve()
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))

mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
report = {
    "source": str(source_path),
    "objects": [],
    "materials": sorted({material.name for obj in mesh_objects for material in obj.data.materials if material}),
    "images": [
        {
            "name": image.name,
            "width": image.size[0],
            "height": image.size[1],
            "packed": image.packed_file is not None,
        }
        for image in bpy.data.images
        if image.type == "IMAGE"
    ],
}

for obj in mesh_objects:
    mesh = obj.data
    mesh.calc_loop_triangles()
    components = connected_face_components(mesh)
    report["objects"].append(
        {
            "name": obj.name,
            "vertices": len(mesh.vertices),
            "edges": len(mesh.edges),
            "polygons": len(mesh.polygons),
            "triangles": len(mesh.loop_triangles),
            "components": len(components),
            "largest_components_by_faces": components[:12],
            "dimensions": [round(value, 6) for value in obj.dimensions],
            "location": [round(value, 6) for value in obj.location],
            "material_slots": [material.name if material else None for material in mesh.materials],
        }
    )

print("EA_GLTF_INSPECTION=" + json.dumps(report, ensure_ascii=False, separators=(",", ":")))
