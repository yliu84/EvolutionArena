"""Render a rig with no animation, then at chosen frames of one clip.

This is the test that should be run the moment anyone reports a body deforming
badly - a sunken neck, a collapsed shoulder, a crease that appears in motion -
and it must be run *before* a fix is attempted.

It answers one question: is the fault in the motion, or in the skin?

  - If the no-animation render is clean and the clip's frames are deformed
    progressively, the amplitude of the motion is the driver. Damping the bones
    that carry it is the right fix. This is what the Swarm stage-2 form had:
    put its head rotation back and the sunken neck comes back with it.

  - If the clip's *first* frame is already deformed, amplitude is not the
    driver, because frame 0 is where damping has the least effect of anywhere
    in the clip. This is what the Gloamwood boss had, and two rounds of damping
    were spent on it before anyone rendered this comparison.

The Gloamwood boss also showed the useful follow-up: run it per clip. Its
authored clips were clean at every frame and only the imported Meshy Walk
craterered, which turned an unfixable rig problem into a clip that simply had to
be authored rather than imported.

Usage:
  blender --background --python scripts/blender/inspect_clip_deformation.py \
      -- model.glb output-directory Walk head 0,6,12
"""
import math, sys
from pathlib import Path
import bpy
from mathutils import Vector

args = sys.argv[sys.argv.index("--") + 1:]
SOURCE, OUT, CLIP, BONE = args[0], Path(args[1]), args[2], args[3]
FRAMES = [int(x) for x in args[4].split(",")]
OUT.mkdir(parents=True, exist_ok=True)

for mode in ["rest"] + ["f%d" % f for f in FRAMES]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=SOURCE)
    bpy.context.view_layer.update()
    arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
    mesh = max((o for o in bpy.context.scene.objects if o.type == 'MESH'), key=lambda o: len(o.data.vertices))
    for t in arm.animation_data.nla_tracks:
        t.mute = True
    if mode == "rest":
        arm.animation_data_clear()
        for b in arm.pose.bones:
            b.rotation_mode = "QUATERNION"; b.rotation_quaternion = (1,0,0,0); b.location=(0,0,0); b.scale=(1,1,1)
    else:
        act = bpy.data.actions.get(CLIP)
        arm.animation_data.action = act
        if getattr(act, "slots", None):
            arm.animation_data.action_slot = act.slots[0]
    bpy.context.view_layer.update()

    c = [mesh.matrix_world @ Vector(v) for v in mesh.bound_box]
    lo = Vector(tuple(min(x[a] for x in c) for a in range(3))); hi = Vector(tuple(max(x[a] for x in c) for a in range(3)))
    s = 2.55/(hi.z-lo.z)
    for r in [o for o in bpy.context.scene.objects if o.parent is None]:
        r.scale = (r.scale.x*s, r.scale.y*s, r.scale.z*s)
    bpy.context.view_layer.update()
    c = [mesh.matrix_world @ Vector(v) for v in mesh.bound_box]
    lo = Vector(tuple(min(x[a] for x in c) for a in range(3))); hi = Vector(tuple(max(x[a] for x in c) for a in range(3)))
    ctr = (lo+hi)*0.5; size = hi-lo
    bpy.ops.mesh.primitive_plane_add(size=60, location=(ctr.x, ctr.y, lo.z-0.002))
    g = bpy.context.object; m = bpy.data.materials.new("G"); m.diffuse_color=(0.11,0.14,0.11,1); g.data.materials.append(m)
    for loc, e, sz in [((-6,-9,11),5000,9), ((8,-3,8),2600,7), ((0,9,10),3000,7)]:
        bpy.ops.object.light_add(type='AREA', location=loc); L=bpy.context.object; L.data.energy=e; L.data.size=sz
        L.rotation_euler = (Vector(ctr)-Vector(loc)).normalized().to_track_quat('-Z','Y').to_euler()
    sc = bpy.context.scene
    sc.render.engine='BLENDER_EEVEE'; sc.render.resolution_x, sc.render.resolution_y = 1000, 880
    sc.world = bpy.data.worlds.new("W"); sc.world.use_nodes=True
    sc.world.node_tree.nodes["Background"].inputs[0].default_value = (0.07,0.08,0.09,1)
    bpy.ops.object.camera_add(); cam = bpy.context.object; sc.camera = cam
    dgz = bpy.context.evaluated_depsgraph_get(); aev = arm.evaluated_get(dgz)
    joint = aev.matrix_world @ aev.pose.bones[BONE].head
    target = Vector((ctr.x, ctr.y, (ctr.z + joint.z)*0.5))
    R = max(size)*1.6; az, pitch = math.radians(50), math.radians(38)
    cam.location = (target.x + R*math.cos(pitch)*math.sin(az), target.y - R*math.cos(pitch)*math.cos(az), target.z + R*math.sin(pitch))
    cam.rotation_euler = (Vector(target)-cam.location).normalized().to_track_quat('-Z','Y').to_euler()
    if mode != "rest":
        sc.frame_set(int(mode[1:]))
    bpy.context.view_layer.update()
    sc.render.filepath = str(OUT / mode)
    bpy.ops.render.render(write_still=True)
    print("EA_SHOT", mode)
print("EA_DONE")
