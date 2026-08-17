import json
import sys
from pathlib import Path

import bpy


if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python inspect_glb_action_curves.py -- model.glb")

source_path = Path(sys.argv[sys.argv.index("--") + 1]).expanduser().resolve()
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))

report = {}
for action in bpy.data.actions:
    curves = []
    for slot in action.slots:
        channelbag = action.layers[0].strips[0].channelbag(slot)
        if channelbag is None:
            continue
        for fcurve in channelbag.fcurves:
            values = [point.co.y for point in fcurve.keyframe_points]
            curves.append({
                "path": fcurve.data_path,
                "index": fcurve.array_index,
                "keys": len(values),
                "minimum": round(min(values), 6) if values else None,
                "maximum": round(max(values), 6) if values else None,
                "span": round(max(values) - min(values), 6) if values else None,
            })
    report[action.name] = {
        "frame_range": [round(value, 3) for value in action.frame_range],
        "curves": sorted(curves, key=lambda row: row["span"] or 0, reverse=True)[:24],
    }

print("EA_GLB_ACTION_CURVES=" + json.dumps(report, ensure_ascii=False))
