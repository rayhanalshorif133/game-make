import os
import json
from PIL import Image

OUT_DIR = "assets"
os.makedirs(OUT_DIR, exist_ok=True)

# Standard bounding box for humanoid characters centered around bottom-center
# Original resolution is 2048x2048. Characters are typically between x: 650..1400, y: 950..1800
HUMAN_CROP = (650, 950, 1400, 1800)  # (750 x 850)
HUMAN_SIZE = (128, 145)

BAT_CROP = (500, 850, 1500, 1750)    # (1000 x 900)
BAT_SIZE = (140, 126)

def create_strip(images_paths, crop_box, target_size, out_path):
    w, h = target_size
    n = len(images_paths)
    strip = Image.new('RGBA', (w * n, h), (0, 0, 0, 0))
    for i, path in enumerate(images_paths):
        if not os.path.exists(path):
            print(f"Warning: {path} not found!")
            continue
        im = Image.open(path)
        c = im.crop(crop_box)
        resized = c.resize((w, h), Image.Resampling.LANCZOS)
        strip.paste(resized, (i * w, 0))
    strip.save(out_path, optimize=True)
    print(f"Saved {out_path} ({w*n}x{h}, {n} frames, {os.path.getsize(out_path)} bytes)")

manifest = {
    "frameSizes": {},
    "frameCounts": {}
}

# 1. Player Char 1 (idle, walk, hit, death)
char_dir = "images/Full body animated characters/Char 1/with hands"
actions = {
    "player_idle": ([f"{char_dir}/idle_{i}.png" for i in range(6)], HUMAN_CROP, HUMAN_SIZE),
    "player_walk": ([f"{char_dir}/walk_{i}.png" for i in range(8)], HUMAN_CROP, HUMAN_SIZE),
    "player_hit":  ([f"{char_dir}/hit_{i}.png" for i in range(3)], HUMAN_CROP, HUMAN_SIZE),
    "player_death":([f"{char_dir}/death_{i}.png" for i in range(10)], HUMAN_CROP, HUMAN_SIZE),
}

# 2. Enemy 1 (Purple Minion)
e1_dir = "images/Full body animated characters/Enemies/Enemy 1"
actions["enemy1_walk"]  = ([f"{e1_dir}/walk_{i}.png" for i in range(8)], HUMAN_CROP, HUMAN_SIZE)
actions["enemy1_hit"]   = ([f"{e1_dir}/hit_{i}.png" for i in range(3)], HUMAN_CROP, HUMAN_SIZE)
actions["enemy1_death"] = ([f"{e1_dir}/death_{i}.png" for i in range(10)], HUMAN_CROP, HUMAN_SIZE)

# 3. Enemy 2 (Green Orc)
e2_dir = "images/Full body animated characters/Enemies/Enemy 2"
actions["enemy2_walk"]  = ([f"{e2_dir}/walk_{i}.png" for i in range(8)], HUMAN_CROP, HUMAN_SIZE)
actions["enemy2_hit"]   = ([f"{e2_dir}/hit_{i}.png" for i in range(3)], HUMAN_CROP, HUMAN_SIZE)
actions["enemy2_death"] = ([f"{e2_dir}/death_{i}.png" for i in range(10)], HUMAN_CROP, HUMAN_SIZE)

# 4. Enemy 3 (Flying Bat)
e3_dir = "images/Full body animated characters/Enemies/Enemy 3"
actions["enemy3_fly"]   = ([f"{e3_dir}/fly_{i}.png" for i in range(6)], BAT_CROP, BAT_SIZE)

# 5. Enemy 4 (Red Brute)
e4_dir = "images/Full body animated characters/Enemies/Enemy 4"
actions["enemy4_walk"]  = ([f"{e4_dir}/walk_{i}.png" for i in range(8)], HUMAN_CROP, HUMAN_SIZE)
actions["enemy4_hit"]   = ([f"{e4_dir}/hit_{i}.png" for i in range(3)], HUMAN_CROP, HUMAN_SIZE)
actions["enemy4_death"] = ([f"{e4_dir}/death_{i}.png" for i in range(10)], HUMAN_CROP, HUMAN_SIZE)

for key, (paths, crop, size) in actions.items():
    out_file = f"{OUT_DIR}/{key}.png"
    create_strip(paths, crop, size, out_file)
    manifest["frameSizes"][key] = {"width": size[0], "height": size[1]}
    manifest["frameCounts"][key] = len(paths)

# 6. Process Weapons
# Weapon 1: weaponR2 (Pistol)
# Weapon 2: weaponR1 (Rifle)
# Weapon 3: weaponR3 (Shotgun)
weapons = [
    ("weapon_pistol", "images/weaponR2.png", 64),
    ("weapon_rifle", "images/weaponR1.png", 90),
    ("weapon_shotgun", "images/weaponR3.png", 90),
]

for key, src, max_dim in weapons:
    im = Image.open(src)
    bbox = im.getbbox()
    c = im.crop(bbox)
    scale = max_dim / max(c.width, c.height)
    nw, nh = max(1, int(c.width * scale)), max(1, int(c.height * scale))
    resized = c.resize((nw, nh), Image.Resampling.LANCZOS)
    out_file = f"{OUT_DIR}/{key}.png"
    resized.save(out_file, optimize=True)
    manifest["frameSizes"][key] = {"width": nw, "height": nh}
    manifest["frameCounts"][key] = 1
    print(f"Saved {out_file} ({nw}x{nh})")

# 7. UI / FX Assets
# Defense Ring
ring_src = "images/spr_full_ui-sheet11.webp"
if os.path.exists(ring_src):
    rim = Image.open(ring_src)
    rbbox = rim.getbbox()
    rcrop = rim.crop(rbbox).resize((512, 512), Image.Resampling.LANCZOS)
    rcrop.save(f"{OUT_DIR}/defense_ring.png", optimize=True)
    print("Saved defense_ring.png (512x512)")

# Crosshair
ch_src = "images/spr_full_ui-sheet15.webp"
if os.path.exists(ch_src):
    chim = Image.open(ch_src)
    chcrop = chim.crop(chim.getbbox()).resize((48, 48), Image.Resampling.LANCZOS)
    chcrop.save(f"{OUT_DIR}/crosshair.png", optimize=True)
    print("Saved crosshair.png (48x48)")

# Muzzle Flash / Bullet Energy
fx_src = "images/spr_full_ui-sheet1.webp"
if os.path.exists(fx_src):
    fxim = Image.open(fx_src)
    fxcrop = fxim.crop(fxim.getbbox())
    ratio = 96.0 / fxcrop.width
    fxresized = fxcrop.resize((96, max(1, int(fxcrop.height * ratio))), Image.Resampling.LANCZOS)
    fxresized.save(f"{OUT_DIR}/muzzle_flash.png", optimize=True)
    print(f"Saved muzzle_flash.png ({fxresized.size})")

# Smoke Explosion Cloud
smoke_src = "images/spr_full_ui-sheet13.webp"
if os.path.exists(smoke_src):
    sim = Image.open(smoke_src)
    scrop = sim.crop(sim.getbbox())
    sratio = 96.0 / max(scrop.width, scrop.height)
    sresized = scrop.resize((int(scrop.width * sratio), int(scrop.height * sratio)), Image.Resampling.LANCZOS)
    sresized.save(f"{OUT_DIR}/smoke.png", optimize=True)
    print(f"Saved smoke.png ({sresized.size})")

# Shadow under characters
shadow = Image.new('RGBA', (100, 40), (0, 0, 0, 0))
from PIL import ImageDraw
draw = ImageDraw.Draw(shadow)
draw.ellipse((5, 5, 95, 35), fill=(0, 0, 0, 90))
shadow.save(f"{OUT_DIR}/shadow.png", optimize=True)
print("Saved shadow.png")

with open(f"{OUT_DIR}/manifest.json", "w") as f:
    json.dump(manifest, f, indent=2)
print("Saved manifest.json successfully!")

