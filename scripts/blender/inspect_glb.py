import json
import sys
from pathlib import Path

import bpy


if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python inspect_glb.py -- model.glb")

source_path = Path(sys.argv[sys.argv.index("--") + 1]).expanduser().resolve()
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))

meshes = [item for item in bpy.context.scene.objects if item.type == "MESH"]
for item in meshes:
    item.data.calc_loop_triangles()

armatures = [item for item in bpy.context.scene.objects if item.type == "ARMATURE"]
actions = [
    {
        "name": action.name,
        "frame_range": [round(value, 3) for value in action.frame_range],
    }
    for action in sorted(bpy.data.actions, key=lambda item: item.name)
]
images = []
for image in bpy.data.images:
    images.append({
        "name": image.name,
        "width": image.size[0],
        "height": image.size[1],
        "packed": image.packed_file is not None,
    })

print("EA_GLB_INSPECT=" + json.dumps({
    "source": str(source_path),
    "objects": len(bpy.context.scene.objects),
    "mesh_objects": len(meshes),
    "mesh_details": [
        {
            "name": item.name,
            "vertices": len(item.data.vertices),
            "triangles": len(item.data.loop_triangles),
            "dimensions": [round(value, 6) for value in item.dimensions],
            "location": [round(value, 6) for value in item.location],
            "local_bounds": [
                [round(min(vertex.co[axis] for vertex in item.data.vertices), 6) for axis in range(3)],
                [round(max(vertex.co[axis] for vertex in item.data.vertices), 6) for axis in range(3)],
            ],
            "vertex_groups": {
                group.name: {
                    "vertices": sum(
                        1 for vertex in item.data.vertices
                        if any(membership.group == group.index and membership.weight > 0.0001 for membership in vertex.groups)
                    ),
                    "max_weight": round(max((
                        membership.weight
                        for vertex in item.data.vertices
                        for membership in vertex.groups
                        if membership.group == group.index
                    ), default=0.0), 5),
                    "local_bounds": [
                        [
                            round(min((
                                vertex.co[axis]
                                for vertex in item.data.vertices
                                if any(membership.group == group.index and membership.weight > 0.0001 for membership in vertex.groups)
                            ), default=0.0), 5)
                            for axis in range(3)
                        ],
                        [
                            round(max((
                                vertex.co[axis]
                                for vertex in item.data.vertices
                                if any(membership.group == group.index and membership.weight > 0.0001 for membership in vertex.groups)
                            ), default=0.0), 5)
                            for axis in range(3)
                        ],
                    ],
                }
                for group in item.vertex_groups
            },
        }
        for item in meshes
    ],
    "vertices": sum(len(item.data.vertices) for item in meshes),
    "triangles": sum(len(item.data.loop_triangles) for item in meshes),
    "materials": sorted({material.name for item in meshes for material in item.data.materials if material}),
    "images": images,
    "armatures": [
        {
            "name": item.name,
            "bones": len(item.data.bones),
            "bone_names": [bone.name for bone in item.data.bones],
            "bone_details": [
                {
                    "name": bone.name,
                    "parent": bone.parent.name if bone.parent else None,
                    "head": [round(value, 6) for value in bone.head_local],
                    "tail": [round(value, 6) for value in bone.tail_local],
                }
                for bone in item.data.bones
            ],
        }
        for item in armatures
    ],
    "actions": actions,
    "shape_keys": sorted({key.name for item in meshes if item.data.shape_keys for key in item.data.shape_keys.key_blocks}),
}, ensure_ascii=False))
