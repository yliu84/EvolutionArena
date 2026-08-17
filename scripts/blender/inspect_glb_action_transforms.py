import json
import sys
from pathlib import Path

import bpy


if "--" not in sys.argv:
    raise SystemExit("Usage: blender --background --python inspect_glb_action_transforms.py -- model.glb")

source_path = Path(sys.argv[sys.argv.index("--") + 1]).expanduser().resolve()
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))

armature = next(item for item in bpy.context.scene.objects if item.type == "ARMATURE")
scene = bpy.context.scene
samples = {}

for track in armature.animation_data.nla_tracks:
    track.mute = True

for action in bpy.data.actions:
    armature.animation_data.action = action
    start, end = (int(round(value)) for value in action.frame_range)
    action_samples = []
    for frame in sorted({start, (start + end) // 2, end}):
        scene.frame_set(frame)
        changed_scales = {}
        for bone in armature.pose.bones:
            scale = tuple(round(value, 5) for value in bone.scale)
            if any(abs(value - 1.0) > 0.01 for value in scale):
                changed_scales[bone.name] = scale
        action_samples.append({"frame": frame, "changed_scales": changed_scales})
    samples[action.name] = action_samples

print("EA_GLB_ACTION_TRANSFORMS=" + json.dumps(samples, ensure_ascii=False))
