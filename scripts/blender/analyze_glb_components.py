import json
import sys
from pathlib import Path

import bpy
import bmesh
from mathutils import Vector


if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python analyze_glb_components.py -- model.glb")

source_path = Path(sys.argv[sys.argv.index("--") + 1]).expanduser().resolve()
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))

obj = next(item for item in bpy.context.scene.objects if item.type == "MESH")
bm = bmesh.new()
bm.from_mesh(obj.data)
bm.faces.ensure_lookup_table()
bm.verts.ensure_lookup_table()
remaining = set(range(len(bm.faces)))
components = []

while remaining:
    seed = remaining.pop()
    stack = [seed]
    faces = []
    vertex_indices = set()

    while stack:
        face_index = stack.pop()
        face = bm.faces[face_index]
        faces.append(face_index)
        vertex_indices.update(vertex.index for vertex in face.verts)
        for edge in face.edges:
            for linked_face in edge.link_faces:
                linked_index = linked_face.index
                if linked_index in remaining:
                    remaining.remove(linked_index)
                    stack.append(linked_index)

    coordinates = [bm.verts[index].co for index in vertex_indices]
    minimum = Vector((min(co[axis] for co in coordinates) for axis in range(3)))
    maximum = Vector((max(co[axis] for co in coordinates) for axis in range(3)))
    center = (minimum + maximum) * 0.5
    dimensions = maximum - minimum
    components.append(
        {
            "seed_face": seed,
            "faces": len(faces),
            "vertices": len(vertex_indices),
            "center": [round(value, 6) for value in center],
            "dimensions": [round(value, 6) for value in dimensions],
            "minimum": [round(value, 6) for value in minimum],
            "maximum": [round(value, 6) for value in maximum],
            "center_distance": round(center.length, 6),
        }
    )

bm.free()
components.sort(key=lambda component: component["center_distance"], reverse=True)
print(
    "EA_COMPONENT_ANALYSIS="
    + json.dumps(
        {"count": len(components), "farthest_components": components[:60]},
        separators=(",", ":"),
    )
)
