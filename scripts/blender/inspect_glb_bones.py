import json
import sys
from pathlib import Path

import bpy


if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python inspect_glb_bones.py -- model.glb")

source_path = Path(sys.argv[sys.argv.index("--") + 1]).expanduser().resolve()
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))
armature = next(item for item in bpy.context.scene.objects if item.type == "ARMATURE")

rows = []
for bone in armature.data.bones:
    matrix = bone.matrix_local.to_3x3()
    rows.append({
        "name": bone.name,
        "parent": bone.parent.name if bone.parent else None,
        "head": [round(value, 6) for value in bone.head_local],
        "tail": [round(value, 6) for value in bone.tail_local],
        "local_axes": {
            "x": [round(value, 5) for value in matrix.col[0]],
            "y": [round(value, 5) for value in matrix.col[1]],
            "z": [round(value, 5) for value in matrix.col[2]],
        },
    })

print("EA_GLB_BONES=" + json.dumps(rows, ensure_ascii=False))
