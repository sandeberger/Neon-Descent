"""
NEON DESCENT — Procedural Asset Generator
Generates all sprite sheets, backgrounds, UI, and VFX templates
with neon-cyberpunk pixel art style.
"""

import os
import math
import random
from PIL import Image, ImageDraw, ImageFilter

# ── Paths ────────────────────────────────────────────
BASE = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets')
TILES   = os.path.join(BASE, 'tiles')
BG      = os.path.join(BASE, 'backgrounds')
PLAYER  = os.path.join(BASE, 'player')
ENEMIES = os.path.join(BASE, 'enemies')
PROJ    = os.path.join(BASE, 'projectiles')
PICKUPS = os.path.join(BASE, 'pickups')
UI      = os.path.join(BASE, 'ui')
VFX     = os.path.join(BASE, 'vfx')

# ── Color Helpers ────────────────────────────────────
def hex_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def rgba(h, a=255):
    return hex_rgb(h) + (a,)

def dim(color, factor=0.5):
    return tuple(max(0, int(c * factor)) for c in color[:3]) + ((color[3],) if len(color) > 3 else ())

def bright(color, factor=1.5):
    return tuple(min(255, int(c * factor)) for c in color[:3]) + ((color[3],) if len(color) > 3 else ())

def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(min(len(c1), len(c2))))

# ── Drawing Helpers ──────────────────────────────────
def draw_glow(img, cx, cy, radius, color, intensity=0.6):
    """Draw a soft glow circle on an RGBA image."""
    for r in range(radius, 0, -1):
        alpha = int(255 * intensity * (r / radius) ** 0.5 * (1 - r / radius))
        if alpha <= 0:
            continue
        c = color[:3] + (alpha,)
        draw = ImageDraw.Draw(img)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=None, outline=c)

def draw_glow_rect(img, x, y, w, h, color, glow_size=3):
    """Draw a filled rectangle with neon glow."""
    overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    # Glow layers
    for i in range(glow_size, 0, -1):
        alpha = int(80 * (1 - i / glow_size))
        gc = color[:3] + (alpha,)
        d.rectangle([x - i, y - i, x + w + i - 1, y + h + i - 1], fill=gc)
    # Core
    d.rectangle([x, y, x + w - 1, y + h - 1], fill=color[:3] + (255,))
    img.paste(Image.alpha_composite(Image.new('RGBA', img.size, (0, 0, 0, 0)), overlay), (0, 0), overlay)

def draw_neon_line(draw, x1, y1, x2, y2, color, glow_alpha=60):
    """Draw a glowing neon line."""
    gc = color[:3] + (glow_alpha,)
    draw.line([x1, y1, x2, y2], fill=gc, width=3)
    draw.line([x1, y1, x2, y2], fill=color[:3] + (200,), width=1)

def noise_fill(draw, x, y, w, h, base_color, variation=15):
    """Fill area with noisy color variation."""
    r, g, b = base_color[:3]
    for py in range(y, y + h):
        for px in range(x, x + w):
            v = random.randint(-variation, variation)
            c = (max(0, min(255, r + v)), max(0, min(255, g + v)), max(0, min(255, b + v)), 255)
            draw.point((px, py), fill=c)

def draw_cracks(draw, x, y, w, h, color, count=3):
    """Draw random crack lines in a region."""
    for _ in range(count):
        sx = random.randint(x, x + w - 1)
        sy = random.randint(y, y + h - 1)
        for _ in range(random.randint(3, 8)):
            nx = sx + random.randint(-3, 3)
            ny = sy + random.randint(-3, 3)
            nx = max(x, min(x + w - 1, nx))
            ny = max(y, min(y + h - 1, ny))
            draw.line([sx, sy, nx, ny], fill=color, width=1)
            sx, sy = nx, ny

def draw_circle_filled(draw, cx, cy, r, fill_color):
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fill_color)

def draw_diamond(draw, cx, cy, r, fill_color):
    draw.polygon([(cx, cy - r), (cx + r, cy), (cx, cy + r), (cx - r, cy)], fill=fill_color)

# ── Biome Data ───────────────────────────────────────
BIOMES = {
    'surface_fracture': {
        'bg': '#0a0a1a', 'bgline1': '#111122', 'bgline2': '#0d0d22',
        'tile': '#1a2a3a', 'accent': '#2a3a4a', 'platform': '#334455',
        'hazard': '#ff2244', 'bounce': '#44ff88', 'breakable': '#887744',
        'glow': '#44ddff',
    },
    'neon_gut': {
        'bg': '#10061a', 'bgline1': '#1a0a22', 'bgline2': '#150820',
        'tile': '#2a1a32', 'accent': '#3a2242', 'platform': '#553366',
        'hazard': '#ff44aa', 'bounce': '#ff88ff', 'breakable': '#886688',
        'glow': '#ff44aa',
    },
    'data_crypt': {
        'bg': '#060e14', 'bgline1': '#0a1a12', 'bgline2': '#081610',
        'tile': '#122a1a', 'accent': '#1a3a2a', 'platform': '#225533',
        'hazard': '#cc44ff', 'bounce': '#44ffaa', 'breakable': '#668844',
        'glow': '#44ffaa',
    },
    'hollow_market': {
        'bg': '#0c0a14', 'bgline1': '#181428', 'bgline2': '#141020',
        'tile': '#1e1830', 'accent': '#2a2240', 'platform': '#443366',
        'hazard': '#ff8844', 'bounce': '#ffcc88', 'breakable': '#776655',
        'glow': '#ffcc88',
    },
    'molten_grid': {
        'bg': '#140e04', 'bgline1': '#1c1408', 'bgline2': '#181006',
        'tile': '#2a2010', 'accent': '#3a2c18', 'platform': '#554422',
        'hazard': '#ff6622', 'bounce': '#ffcc44', 'breakable': '#998844',
        'glow': '#ff6622',
    },
    'void_core': {
        'bg': '#140808', 'bgline1': '#1a0a0a', 'bgline2': '#160c06',
        'tile': '#2a1412', 'accent': '#3a1a18', 'platform': '#553322',
        'hazard': '#ff4422', 'bounce': '#ffaa44', 'breakable': '#886644',
        'glow': '#ff4422',
    },
}

BIOME_NAMES = list(BIOMES.keys())

# ── ENEMY DATA ───────────────────────────────────────
ENEMY_DATA = {
    'hopper':          {'body': '#ff4466', 'glow': '#ff2244', 'hb': (24,24), 'sp': (28,28)},
    'splitter':        {'body': '#44ff88', 'glow': '#22dd66', 'hb': (26,26), 'sp': (30,30)},
    'splitter_fragment':{'body': '#33cc66', 'glow': '#22aa44', 'hb': (14,14), 'sp': (18,18)},
    'leech':           {'body': '#88ff44', 'glow': '#44cc22', 'hb': (18,18), 'sp': (22,22)},
    'swarm_drone':     {'body': '#33aa66', 'glow': '#228844', 'hb': (12,12), 'sp': (16,16)},
    'turret_bloom':    {'body': '#cc44ff', 'glow': '#aa22dd', 'hb': (28,28), 'sp': (32,32)},
    'parasite_cloud':  {'body': '#cc44ff', 'glow': '#aa22dd', 'hb': (14,14), 'sp': (18,18)},
    'rail_sentinel':   {'body': '#ff8844', 'glow': '#dd6622', 'hb': (26,26), 'sp': (30,30)},
    'bomber':          {'body': '#ff6622', 'glow': '#cc4400', 'hb': (20,20), 'sp': (24,24)},
    'shield_bug':      {'body': '#ffaa22', 'glow': '#dd8800', 'hb': (24,20), 'sp': (28,24)},
    'mirror':          {'body': '#aaccff', 'glow': '#6688cc', 'hb': (24,24), 'sp': (28,28)},
    'ambusher':        {'body': '#884466', 'glow': '#662244', 'hb': (22,22), 'sp': (26,26)},
    'core_carrier':    {'body': '#ff4488', 'glow': '#dd2266', 'hb': (36,36), 'sp': (40,40)},
    'sentinel_miniboss':{'body': '#ff2266', 'glow': '#cc0044', 'hb': (40,40), 'sp': (48,48)},
    'data_guardian':   {'body': '#44ffcc', 'glow': '#22ddaa', 'hb': (44,44), 'sp': (52,52)},
    'bloom_heart':     {'body': '#ff44cc', 'glow': '#cc22aa', 'hb': (56,56), 'sp': (64,64)},
    'acid_wyrm':       {'body': '#88ff44', 'glow': '#44cc22', 'hb': (44,44), 'sp': (52,52)},
    'acid_wyrm_seg':   {'body': '#88ff44', 'glow': '#44cc22', 'hb': (20,20), 'sp': (24,24)},
    'drill_mother':    {'body': '#ff8844', 'glow': '#dd6622', 'hb': (60,60), 'sp': (68,68)},
    'swarm_mother':    {'body': '#44cc88', 'glow': '#228866', 'hb': (32,32), 'sp': (36,36)},
}

# Frame counts per enemy: {name: [(state_name, frame_count), ...]}
ENEMY_FRAMES = {
    'hopper':          [('idle',3),('attack',2),('hit',1),('death',3)],
    'splitter':        [('idle',3),('hit',1),('death',4)],
    'splitter_fragment':[('idle',2),('death',2)],
    'leech':           [('idle',3),('chase',2),('hit',1),('death',3)],
    'swarm_drone':     [('idle',2),('death',2)],
    'turret_bloom':    [('idle',4),('charge',3),('fire',2),('hit',1),('death',4)],
    'parasite_cloud':  [('idle',3),('death',2)],
    'rail_sentinel':   [('idle',3),('move',2),('fire',2),('hit',1),('death',4)],
    'bomber':          [('idle',3),('throw',3),('hit',1),('death',4)],
    'shield_bug':      [('idle',3),('advance',2),('shield_hit',1),('exposed',2),('death',3)],
    'mirror':          [('idle',3),('reflect',2),('hit',1),('death',3)],
    'ambusher':        [('hidden',2),('reveal',2),('attack',2),('hit',1),('death',3)],
    'core_carrier':    [('idle',4),('hit',2),('low_hp',3),('death',5)],
    'sentinel_miniboss':[('idle',4),('attack_a',4),('attack_b',3),('enrage',2),('death',6)],
    'data_guardian':   [('idle',4),('teleport',3),('laser_charge',3),('laser_fire',2),('phase2',1),('death',5)],
    'bloom_heart':     [('idle',4),('tentacle',4),('spore',3),('vulnerable',3),('death',8)],
    'acid_wyrm':       [('idle',4),('attack',3),('burrow',4),('death',5)],
    'acid_wyrm_seg':   [('idle',2)],
    'drill_mother':    [('idle',4),('drill',3),('charge',3),('spawn',3),('death',8)],
    'swarm_mother':    [('idle',4),('spawn',4),('hit',1),('death',4)],
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TILE GENERATORS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def gen_solid_tile(draw, x, y, biome, variant):
    """Draw one 30x30 solid tile variant."""
    b = BIOMES[biome]
    base = hex_rgb(b['tile'])
    accent = hex_rgb(b['accent'])
    noise_fill(draw, x, y, 30, 30, base, 8)
    random.seed(hash((biome, 'solid', variant)))
    # Accent lines / nitar / patterns per biome
    if biome == 'surface_fracture':
        # Industrial panels with rivets and cyan cracks
        draw.line([x+0, y+14, x+29, y+14], fill=dim(accent), width=1)
        draw.line([x+14, y+0, x+14, y+29], fill=dim(accent), width=1)
        for rx, ry in [(5,5),(24,5),(5,24),(24,24)]:
            draw.point((x+rx, y+ry), fill=bright(accent, 1.3))
        draw_cracks(draw, x, y, 30, 30, rgba(b['glow'], 100), 2)
    elif biome == 'neon_gut':
        # Organic veins
        sx = x + random.randint(0, 10)
        for i in range(5):
            nx = sx + random.randint(-4, 4)
            ny = y + i * 6
            draw.line([sx, ny, nx, ny + 6], fill=rgba(b['hazard'], 120), width=1)
            sx = nx
        # Pulsing dots
        for _ in range(3):
            px, py = x + random.randint(2, 27), y + random.randint(2, 27)
            draw.point((px, py), fill=rgba(b['glow'], 180))
    elif biome == 'data_crypt':
        # Circuit board pattern
        for i in range(0, 30, 6):
            draw.line([x + i, y, x + i, y + 29], fill=accent + (60,), width=1)
            draw.line([x, y + i, x + 29, y + i], fill=accent + (60,), width=1)
        # Glowing nodes
        for _ in range(4):
            nx = x + random.randint(2, 27)
            ny = y + random.randint(2, 27)
            draw.point((nx, ny), fill=rgba(b['glow'], 200))
            draw.point((nx+1, ny), fill=rgba(b['glow'], 100))
    elif biome == 'hollow_market':
        # Weathered stone with gold symbols
        draw_cracks(draw, x, y, 30, 30, dim(accent, 0.7), 2)
        sx, sy = x + random.randint(8, 22), y + random.randint(8, 22)
        draw.rectangle([sx-2, sy-2, sx+2, sy+2], outline=rgba('#ffcc44', 60))
    elif biome == 'molten_grid':
        # Glowing lava cracks
        draw_cracks(draw, x, y, 30, 30, rgba(b['hazard'], 160), 3)
        # Hot spots
        for _ in range(2):
            px, py = x + random.randint(3, 26), y + random.randint(3, 26)
            draw.point((px, py), fill=rgba('#ffaa22', 200))
    elif biome == 'void_core':
        # Red pulsing veins, "wrong" geometry
        for _ in range(2):
            sx, sy = x + random.randint(0, 29), y + random.randint(0, 29)
            for _ in range(4):
                nx = sx + random.randint(-5, 5)
                ny = sy + random.randint(-5, 5)
                draw.line([sx, sy, nx, ny], fill=rgba(b['hazard'], 140), width=1)
                sx, sy = nx, ny
        # Inverted glow points
        for _ in range(2):
            px, py = x + random.randint(3, 26), y + random.randint(3, 26)
            draw.point((px, py), fill=(255, 255, 255, 180))
            draw.point((px+1, py), fill=rgba(b['hazard'], 100))

def gen_solid_tiles():
    """Generate solid tile sheets for all biomes."""
    for biome in BIOME_NAMES:
        img = Image.new('RGBA', (120, 30), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        for v in range(4):
            gen_solid_tile(draw, v * 30, 0, biome, v)
        img.save(os.path.join(TILES, f'solid_{biome}.png'))
    print("  solid tiles: 6 sheets")

def gen_platform_tile(draw, x, y, biome, frame):
    """Draw one platform frame."""
    b = BIOMES[biome]
    base = hex_rgb(b['platform'])
    glow = hex_rgb(b['glow']) if 'glow' in b else bright(base)
    # Main bar (thinner, top-heavy)
    noise_fill(draw, x, y + 10, 30, 12, base, 6)
    # Top LED strip
    glow_intensity = 200 if frame == 0 else min(255, 200 + frame * 40)
    for px in range(x, x + 30):
        draw.point((px, y + 9), fill=glow[:3] + (glow_intensity,))
        draw.point((px, y + 8), fill=glow[:3] + (glow_intensity // 3,))
    # Landing pulse on frames 1-3
    if frame > 0:
        expansion = frame * 2
        alpha = max(40, 160 - frame * 40)
        for px in range(x, x + 30):
            for dy in range(expansion):
                if y + 8 - dy >= y:
                    draw.point((px, y + 8 - dy), fill=glow[:3] + (alpha // (dy + 1),))

def gen_platform_tiles():
    for biome in BIOME_NAMES:
        img = Image.new('RGBA', (120, 30), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        for f in range(4):
            gen_platform_tile(draw, f * 30, 0, biome, f)
        img.save(os.path.join(TILES, f'platform_{biome}.png'))
    print("  platform tiles: 6 sheets")

def gen_hazard_tile(draw, x, y, biome, frame):
    b = BIOMES[biome]
    haz = hex_rgb(b['hazard'])
    phase = frame / 4.0
    alpha_mod = int(180 + 75 * math.sin(phase * math.pi * 2))
    # Base hazard fill
    noise_fill(draw, x, y, 30, 30, dim(haz, 0.3), 5)
    # Animated glow center
    cx, cy = x + 15, y + 15
    r = 8 + int(3 * math.sin(phase * math.pi * 2))
    for ir in range(r, 0, -1):
        a = int(alpha_mod * (ir / r))
        draw.ellipse([cx-ir, cy-ir, cx+ir, cy+ir], fill=haz[:3] + (a,))
    # Border warning marks
    for i in range(0, 30, 6):
        c = haz[:3] + (120,)
        draw.line([x + i, y, x + i + 2, y], fill=c)
        draw.line([x + i, y + 29, x + i + 2, y + 29], fill=c)

def gen_hazard_tiles():
    for biome in BIOME_NAMES:
        img = Image.new('RGBA', (120, 30), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        for f in range(4):
            gen_hazard_tile(draw, f * 30, 0, biome, f)
        img.save(os.path.join(TILES, f'hazard_{biome}.png'))
    print("  hazard tiles: 6 sheets")

def gen_breakable_tiles():
    for biome in BIOME_NAMES:
        b = BIOMES[biome]
        brk = hex_rgb(b['breakable'])
        img = Image.new('RGBA', (210, 30), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        # Frame 0: idle (intact with cracks)
        noise_fill(draw, 0, 0, 30, 30, brk, 10)
        draw_cracks(draw, 0, 0, 30, 30, bright(brk, 1.5) + (200,), 3)
        # Frames 1-2: cracking
        for f in range(1, 3):
            ox = f * 30
            noise_fill(draw, ox, 0, 30, 30, brk, 10)
            draw_cracks(draw, ox, 0, 30, 30, bright(brk, 1.8) + (220,), 3 + f * 2)
            # Stress glow
            for _ in range(f * 2):
                px, py = ox + random.randint(5, 24), random.randint(5, 24)
                draw.point((px, py), fill=(255, 255, 200, 150))
        # Frames 3-6: breaking (fragments scatter, fade to transparent)
        for f in range(3, 7):
            ox = f * 30
            progress = (f - 3) / 3.0
            alpha = int(255 * (1 - progress))
            if alpha <= 0:
                continue
            # Scattered fragments
            frags = max(1, int(8 * (1 - progress)))
            for _ in range(frags):
                fx = ox + random.randint(0, 29)
                fy = random.randint(0, 29)
                fs = random.randint(2, 5 - int(progress * 3))
                draw.rectangle([fx, fy, fx + fs, fy + fs], fill=brk[:3] + (alpha,))
        img.save(os.path.join(TILES, f'breakable_{biome}.png'))
    print("  breakable tiles: 6 sheets")

def gen_bounce_tiles():
    for biome in BIOME_NAMES:
        b = BIOMES[biome]
        bnc = hex_rgb(b['bounce'])
        img = Image.new('RGBA', (180, 30), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        for f in range(6):
            ox = f * 30
            is_triggered = f >= 2
            # Base convex shape
            base_y = 18 if not is_triggered else 18 + min(4, (f - 2))
            squeeze = 2 if (is_triggered and f < 4) else 0
            draw.rectangle([ox + 2, base_y - squeeze, ox + 27, 28], fill=dim(bnc, 0.5))
            # Top convex arc
            for px in range(30):
                arc_h = int(4 * math.sin(px / 29 * math.pi))
                py = base_y - arc_h - squeeze
                if 0 <= py < 30:
                    draw.point((ox + px, py), fill=bnc[:3] + (220,))
            # Energy lines
            pulse = 1.0 if f % 2 == 0 else 0.6
            if is_triggered and f == 3:
                pulse = 2.0
            ea = int(180 * pulse)
            draw.line([ox + 8, base_y + 2, ox + 22, base_y + 2], fill=bnc[:3] + (min(255, ea),))
            # Chevron arrow
            ca = int(200 * pulse)
            draw.line([ox + 15, base_y - 6, ox + 11, base_y - 2], fill=(255, 255, 255, min(255, ca)))
            draw.line([ox + 15, base_y - 6, ox + 19, base_y - 2], fill=(255, 255, 255, min(255, ca)))
            # Glow burst on trigger frame 3
            if is_triggered and f == 3:
                for r in range(8, 0, -1):
                    a = int(120 * (1 - r / 8))
                    draw.ellipse([ox + 15 - r, base_y - 4 - r, ox + 15 + r, base_y - 4 + r],
                                 fill=bnc[:3] + (a,))
        img.save(os.path.join(TILES, f'bounce_{biome}.png'))
    print("  bounce tiles: 6 sheets")

def gen_acid_pool():
    img = Image.new('RGBA', (120, 30), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    acid1 = hex_rgb('#88ff22')
    acid2 = hex_rgb('#44cc00')
    for f in range(4):
        ox = f * 30
        random.seed(42 + f)
        # Base acid fill
        for py in range(30):
            for px in range(30):
                t = py / 29
                c = lerp_color(acid1, acid2, t)
                v = random.randint(-10, 10)
                draw.point((ox + px, py), fill=(max(0,min(255,c[0]+v)), max(0,min(255,c[1]+v)), max(0,min(255,c[2]+v)), 200))
        # Bubbles
        for _ in range(3 + f):
            bx = ox + random.randint(4, 25)
            by = random.randint(4, 20) - f * 2
            br = random.randint(1, 3)
            if 0 < by < 28:
                draw.ellipse([bx - br, by - br, bx + br, by + br], fill=bright(acid1) + (160,))
                draw.point((bx, by - br), fill=(255, 255, 255, 200))
    img.save(os.path.join(TILES, 'acid_pool.png'))
    print("  acid_pool: 1 sheet")

def gen_laser():
    # Emitter: 60x30 (2 frames)
    img = Image.new('RGBA', (60, 30), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for f in range(2):
        ox = f * 30
        # Metal housing
        draw.rectangle([ox + 4, 4, ox + 25, 25], fill=(60, 60, 70, 255))
        draw.rectangle([ox + 6, 6, ox + 23, 23], fill=(40, 40, 50, 255))
        # Red lens
        lens_a = 255 if f == 0 else 140
        draw.ellipse([ox + 10, 10, ox + 19, 19], fill=(255, 34, 68, lens_a))
        draw.ellipse([ox + 12, 12, ox + 17, 17], fill=(255, 100, 120, lens_a))
        # Warning indicator
        warn_a = 200 if f == 1 else 80
        draw.point((ox + 24, 6), fill=(255, 255, 0, warn_a))
    img.save(os.path.join(TILES, 'laser_emitter.png'))

    # Beam: 120x8 (4 frames: 3 active + 1 off)
    img = Image.new('RGBA', (120, 8), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for f in range(4):
        ox = f * 30
        if f < 3:  # Active beam
            width = 2 + f
            center = 4
            # Glow
            for dy in range(-3, 4):
                a = max(0, 60 - abs(dy) * 20)
                draw.line([ox, center + dy, ox + 29, center + dy], fill=(255, 100, 150, a))
            # Core
            for dy in range(-width // 2, width // 2 + 1):
                a = 255 - abs(dy) * 40
                draw.line([ox, center + dy, ox + 29, center + dy], fill=(255, 34, 68, max(100, a)))
            draw.line([ox, center, ox + 29, center], fill=(255, 200, 220, 255))
        else:  # Off - faint preview
            draw.line([ox, 4, ox + 29, 4], fill=(255, 100, 150, 40))
    img.save(os.path.join(TILES, 'laser_beam.png'))
    print("  laser: 2 sheets")

def gen_darkness():
    img = Image.new('RGBA', (90, 30), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for f in range(3):
        ox = f * 30
        random.seed(100 + f)
        # Base dark fill
        for py in range(30):
            for px in range(30):
                a = random.randint(100, 180)
                v = random.randint(0, 20)
                draw.point((ox + px, py), fill=(10 + v, 5, 20 + v, a))
        # Drifting particles
        for _ in range(5):
            px = ox + random.randint(0, 29)
            py = random.randint(0, 29)
            draw.point((px, py), fill=(80, 40, 120, random.randint(60, 140)))
    img.save(os.path.join(TILES, 'darkness_fog.png'))
    print("  darkness: 1 sheet")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# BACKGROUND GENERATORS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def gen_background(biome, layer, filename):
    """Generate a 360x640 parallax background layer."""
    b = BIOMES[biome]
    bg = hex_rgb(b['bg'])
    line1 = hex_rgb(b['bgline1'])
    line2 = hex_rgb(b['bgline2'])
    glow_c = hex_rgb(b['glow'])
    img = Image.new('RGBA', (360, 640), bg + (255,))
    draw = ImageDraw.Draw(img)
    random.seed(hash((biome, layer)))

    if layer == 'far':
        # Vertical gradient: slightly lighter at top
        for y in range(640):
            t = y / 640
            c = lerp_color(bright(bg, 1.15), bg, t)
            draw.line([0, y, 359, y], fill=c + (255,))
        # Distant horizontal lines
        for i in range(20):
            y = random.randint(0, 639)
            lc = line1 if i % 2 == 0 else line2
            draw.line([0, y, 359, y], fill=lc + (40 + random.randint(0, 30),))
        # Distant glow points
        for _ in range(15):
            x, y = random.randint(0, 359), random.randint(0, 639)
            r = random.randint(2, 6)
            for ir in range(r, 0, -1):
                a = int(40 * (1 - ir / r))
                draw.ellipse([x-ir, y-ir, x+ir, y+ir], fill=glow_c + (a,))

    elif layer == 'mid':
        # Structural elements (silhouettes)
        for _ in range(8):
            x = random.randint(0, 340)
            y = random.randint(0, 600)
            w = random.randint(10, 60)
            h = random.randint(40, 200)
            c = lerp_color(bg, hex_rgb(b['accent']), 0.3)
            draw.rectangle([x, y, x + w, y + h], fill=c + (80,))
        # Horizontal beams/pipes
        for _ in range(12):
            y = random.randint(0, 639)
            draw.line([0, y, 359, y], fill=hex_rgb(b['accent']) + (50,), width=random.randint(1, 3))
        # Accent glow nodes
        for _ in range(10):
            x, y = random.randint(0, 359), random.randint(0, 639)
            for ir in range(4, 0, -1):
                a = int(60 * (1 - ir / 4))
                draw.ellipse([x-ir, y-ir, x+ir, y+ir], fill=glow_c + (a,))
            draw.point((x, y), fill=glow_c + (200,))

    elif layer == 'near':
        # Foreground particles and debris (semi-transparent)
        for _ in range(40):
            x = random.randint(0, 359)
            y = random.randint(0, 639)
            size = random.randint(1, 3)
            a = random.randint(30, 100)
            draw.rectangle([x, y, x + size, y + size], fill=glow_c + (a,))
        # Vertical streaks (light leaks)
        for _ in range(5):
            x = random.randint(0, 359)
            y1 = random.randint(0, 400)
            y2 = y1 + random.randint(50, 200)
            a = random.randint(15, 40)
            draw.line([x, y1, x, y2], fill=glow_c + (a,), width=2)

    img.save(os.path.join(BG, filename))

def gen_backgrounds():
    for biome in BIOME_NAMES:
        short = biome.replace('_', '')
        # Some biome names are long, use abbreviations
        name_map = {
            'surface_fracture': 'surface',
            'neon_gut': 'neongut',
            'data_crypt': 'datacrypt',
            'hollow_market': 'hollowmarket',
            'molten_grid': 'moltengrid',
            'void_core': 'voidcore',
        }
        n = name_map.get(biome, biome)
        for layer in ['far', 'mid', 'near']:
            gen_background(biome, layer, f'bg_{n}_{layer}.png')
    print("  backgrounds: 18 images")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PLAYER SPRITE GENERATOR
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PLAYER_BODY = hex_rgb('#44ddff')
PLAYER_GLOW = hex_rgb('#22aaff')
PLAYER_DARK = hex_rgb('#1a6688')

def draw_player_base(draw, ox, oy, pose='idle', frame=0):
    """Draw player character at offset (ox, oy) on 24x32 frame."""
    body = PLAYER_BODY
    glow = PLAYER_GLOW
    dark = PLAYER_DARK

    # Glow halo
    cx, cy = ox + 12, oy + 14
    for r in range(10, 0, -1):
        a = int(30 * (1 - r / 10))
        draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=glow + (a,))

    if pose == 'idle':
        bob = int(2 * math.sin(frame * math.pi / 2))
        # Hood
        draw.rectangle([ox+8, oy+2+bob, ox+15, oy+8+bob], fill=dark)
        # Visor
        draw.line([ox+9, oy+5+bob, ox+14, oy+5+bob], fill=body, width=1)
        draw.point((ox+14, oy+5+bob), fill=(255,255,255,255))
        # Body
        draw.rectangle([ox+9, oy+9+bob, ox+14, oy+20+bob], fill=dark)
        draw.line([ox+10, oy+10+bob, ox+13, oy+10+bob], fill=body)
        # Arms
        draw.line([ox+8, oy+11+bob, ox+6, oy+16+bob], fill=dark, width=1)
        draw.line([ox+15, oy+11+bob, ox+17, oy+16+bob], fill=dark, width=1)
        # Legs
        draw.line([ox+10, oy+21+bob, ox+9, oy+26+bob], fill=dark, width=1)
        draw.line([ox+13, oy+21+bob, ox+14, oy+26+bob], fill=dark, width=1)
        # Neon boots
        draw.point((ox+9, oy+27+bob), fill=body)
        draw.point((ox+14, oy+27+bob), fill=body)

    elif pose == 'falling':
        spread = min(2, frame)
        # Hood (fluttering up)
        draw.rectangle([ox+8, oy+1, ox+15, oy+7], fill=dark)
        draw.rectangle([ox+7, oy+0, ox+16, oy+3], fill=dark)  # Hood flare
        # Visor
        draw.line([ox+9, oy+4, ox+14, oy+4], fill=body, width=1)
        # Body
        draw.rectangle([ox+9, oy+8, ox+14, oy+19], fill=dark)
        # Arms spread
        draw.line([ox+8, oy+10, ox+4-spread, oy+14], fill=dark, width=1)
        draw.line([ox+15, oy+10, ox+19+spread, oy+14], fill=dark, width=1)
        # Legs spread
        draw.line([ox+10, oy+20, ox+7, oy+27], fill=dark, width=1)
        draw.line([ox+13, oy+20, ox+16, oy+27], fill=dark, width=1)
        # Trail under feet
        draw.point((ox+9, oy+28), fill=body + (120,))
        draw.point((ox+14, oy+28), fill=body + (120,))

    elif pose == 'stomp_start':
        squeeze = frame * 2
        # Compressed body
        draw.rectangle([ox+7, oy+4+squeeze, ox+16, oy+10+squeeze], fill=dark)
        draw.line([ox+9, oy+6+squeeze, ox+14, oy+6+squeeze], fill=body)
        draw.rectangle([ox+8, oy+11+squeeze, ox+15, oy+18], fill=dark)
        # Arms up
        draw.line([ox+7, oy+11+squeeze, ox+5, oy+6+squeeze], fill=dark)
        draw.line([ox+16, oy+11+squeeze, ox+18, oy+6+squeeze], fill=dark)
        # Energy at feet
        for px in range(ox+7, ox+17):
            a = 100 + frame * 60
            draw.point((px, oy+19), fill=body + (min(255, a),))

    elif pose == 'stomping':
        # Missile pose - compressed downward
        draw.rectangle([ox+9, oy+4, ox+14, oy+10], fill=dark)
        draw.line([ox+10, oy+6, ox+13, oy+6], fill=body)
        draw.rectangle([ox+8, oy+11, ox+15, oy+22], fill=dark)
        # Arms tucked
        draw.line([ox+8, oy+12, ox+7, oy+15], fill=dark)
        draw.line([ox+15, oy+12, ox+16, oy+15], fill=dark)
        # Energy trail above
        for dy in range(8):
            a = max(0, 160 - dy * 20)
            spread = dy // 3
            draw.line([ox+10-spread, oy+3-dy, ox+13+spread, oy+3-dy], fill=body + (a,))

    elif pose == 'bouncing':
        stretch = max(0, 2 - frame)
        # Expanding upward
        draw.rectangle([ox+8, oy+6-stretch, ox+15, oy+10-stretch], fill=dark)
        draw.line([ox+9, oy+8-stretch, ox+14, oy+8-stretch], fill=body)
        draw.rectangle([ox+9, oy+11-stretch, ox+14, oy+20], fill=dark)
        # Arms out (joy pose on frame 2)
        arm_angle = frame * 3
        draw.line([ox+8, oy+12, ox+4-arm_angle, oy+8], fill=dark)
        draw.line([ox+15, oy+12, ox+19+arm_angle, oy+8], fill=dark)
        # Legs
        draw.line([ox+10, oy+21, ox+8, oy+27], fill=dark)
        draw.line([ox+13, oy+21, ox+15, oy+27], fill=dark)

    elif pose == 'dashing':
        # Horizontal stretch
        stretch = 3 if frame < 2 else 0
        # Afterimage on early frames
        if frame < 2:
            draw.rectangle([ox+2, oy+8, ox+8, oy+20], fill=body + (60,))
        draw.rectangle([ox+6+stretch, oy+6, ox+18+stretch, oy+12], fill=dark)
        draw.line([ox+8+stretch, oy+8, ox+16+stretch, oy+8], fill=body)
        draw.rectangle([ox+8+stretch, oy+13, ox+16+stretch, oy+22], fill=dark)

    elif pose == 'wallslide':
        # One hand on wall (left side)
        draw.rectangle([ox+4, oy+4, ox+12, oy+10], fill=dark)
        draw.line([ox+5, oy+6, ox+10, oy+6], fill=body)
        draw.rectangle([ox+6, oy+11, ox+14, oy+22], fill=dark)
        # Hand touching wall
        draw.point((ox+2, oy+10), fill=dark)
        draw.point((ox+3, oy+11), fill=dark)
        # Foot on wall
        draw.point((ox+3, oy+22), fill=body)
        # Spark
        spark_frame = frame % 3
        if spark_frame < 2:
            draw.point((ox+2, oy+12+spark_frame*3), fill=(255, 200, 100, 200))

    elif pose == 'dead':
        progress = frame / 4.0
        if frame == 0:
            # Hit reaction
            draw.rectangle([ox+7, oy+6, ox+16, oy+22], fill=(255, 255, 255, 200))
        elif frame < 3:
            # Fragmenting
            frags = 6 - frame
            for _ in range(frags):
                fx = ox + random.randint(4, 19)
                fy = oy + random.randint(4, 27)
                draw.rectangle([fx, fy, fx+2, fy+2], fill=body + (200,))
        elif frame < 5:
            # Fading fragments
            alpha = max(0, 255 - (frame - 2) * 100)
            for _ in range(3):
                fx = ox + random.randint(2, 21)
                fy = oy + random.randint(2, 29)
                draw.point((fx, fy), fill=body + (alpha,))

    elif pose == 'invuln':
        # White semi-transparent overlay with shield effect
        draw.ellipse([ox+4, oy+2, ox+19, oy+28], fill=(255, 255, 255, 60))
        draw.ellipse([ox+4, oy+2, ox+19, oy+28], outline=(255, 255, 255, 120))

    elif pose.startswith('fire_'):
        direction = pose.split('_')[1]
        # Base standing pose
        draw_player_base(draw, ox, oy, 'idle', 0)
        # Muzzle flash in direction
        flash = body + (200,)
        if direction == 'up':
            draw.point((ox+12, oy+2), fill=flash)
            draw.point((ox+12, oy+1), fill=(255,255,255,255))
        elif direction == 'down':
            draw.point((ox+12, oy+28), fill=flash)
            draw.point((ox+12, oy+29), fill=(255,255,255,255))
        elif direction == 'left':
            draw.point((ox+3, oy+14), fill=flash)
            draw.point((ox+2, oy+14), fill=(255,255,255,255))
        elif direction == 'right':
            draw.point((ox+20, oy+14), fill=flash)
            draw.point((ox+21, oy+14), fill=(255,255,255,255))

def gen_player_sprites():
    states = [
        ('idle', 4), ('fall', 3), ('stomp_start', 2), ('stomp', 2),
        ('bounce', 3), ('dash', 3), ('wallslide', 3), ('death', 5),
    ]
    pose_map = {
        'idle': 'idle', 'fall': 'falling', 'stomp_start': 'stomp_start',
        'stomp': 'stomping', 'bounce': 'bouncing', 'dash': 'dashing',
        'wallslide': 'wallslide', 'death': 'dead',
    }
    for name, frames in states:
        img = Image.new('RGBA', (24 * frames, 32), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        for f in range(frames):
            random.seed(hash((name, f)))
            draw_player_base(draw, f * 24, 0, pose_map[name], f)
        img.save(os.path.join(PLAYER, f'player_{name}.png'))

    # Invulnerable overlay
    img = Image.new('RGBA', (24, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw_player_base(draw, 0, 0, 'invuln', 0)
    img.save(os.path.join(PLAYER, 'player_invuln_flash.png'))

    # Firing directional (2 frames x 4 directions)
    for direction in ['up', 'down', 'left', 'right']:
        img = Image.new('RGBA', (48, 32), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        for f in range(2):
            random.seed(hash((direction, f)))
            draw_player_base(draw, f * 24, 0, f'fire_{direction}', f)
        img.save(os.path.join(PLAYER, f'player_fire_{direction}.png'))

    print("  player: 13 sheets")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ENEMY SPRITE GENERATOR
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def draw_enemy_frame(draw, ox, oy, enemy_id, state, frame, sw, sh):
    """Draw a single enemy frame. ox,oy = top-left of sprite area. sw,sh = sprite size."""
    d = ENEMY_DATA[enemy_id]
    body = hex_rgb(d['body'])
    glow = hex_rgb(d['glow'])
    cx, cy = ox + sw // 2, oy + sh // 2
    hw, hh = d['hb']
    is_death = 'death' in state
    is_hit = state == 'hit' or state == 'shield_hit'

    # Glow halo (larger for bosses)
    glow_r = max(sw, sh) // 2 + 2
    for r in range(glow_r, 0, -1):
        a = int(40 * (1 - r / glow_r))
        if is_death:
            a = int(a * max(0, 1 - frame * 0.3))
        draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=glow + (a,))

    if is_hit:
        # White flash
        draw.rectangle([ox+2, oy+2, ox+sw-3, oy+sh-3], fill=(255, 255, 255, 200))
        return

    if is_death:
        # Fragment explosion
        alpha = max(0, 255 - frame * 60)
        frags = max(1, 6 - frame)
        spread = frame * 3
        for _ in range(frags):
            fx = cx + random.randint(-spread, spread)
            fy = cy + random.randint(-spread, spread)
            fs = random.randint(1, 3)
            if ox <= fx < ox + sw and oy <= fy < oy + sh:
                draw.rectangle([fx, fy, fx+fs, fy+fs], fill=body + (alpha,))
        # Flash on first death frame
        if frame == 0:
            draw.ellipse([cx-4, cy-4, cx+4, cy+4], fill=(255, 255, 255, 180))
        return

    # ── Specific enemy shapes ──
    if enemy_id == 'hopper':
        # Round body with legs
        r = hw // 2 - 1
        bob = int(2 * math.sin(frame * 1.5)) if state == 'idle' else (-3 if frame == 0 else 4)
        draw.ellipse([cx-r, cy-r+bob-2, cx+r, cy+r+bob-2], fill=body)
        # Eyes
        draw.point((cx-3, cy-3+bob-2), fill=(255,255,255))
        draw.point((cx+3, cy-3+bob-2), fill=(255,255,255))
        # Legs
        ly = cy + r + bob - 2
        draw.line([cx-3, ly, cx-5, ly+4], fill=body, width=1)
        draw.line([cx+3, ly, cx+5, ly+4], fill=body, width=1)

    elif enemy_id == 'splitter':
        # Amorphous blob
        phase = frame * 0.7
        for angle in range(0, 360, 30):
            rad = math.radians(angle)
            wobble = 1 + 0.2 * math.sin(angle * 0.1 + phase)
            r = (hw // 2 - 1) * wobble
            ex = int(cx + r * math.cos(rad))
            ey = int(cy + r * math.sin(rad))
            draw.line([cx, cy, ex, ey], fill=body, width=2)
        draw.ellipse([cx-5, cy-5, cx+5, cy+5], fill=body)
        # Internal bubbles
        for _ in range(3):
            bx = cx + random.randint(-4, 4)
            by = cy + random.randint(-4, 4)
            draw.point((bx, by), fill=bright(body, 1.4))

    elif enemy_id == 'splitter_fragment':
        r = hw // 2 - 1
        draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=body)
        # Trembling offset
        tx = random.randint(-1, 1)
        draw.point((cx+tx, cy-1), fill=bright(body, 1.5))

    elif enemy_id == 'leech':
        # Insect with wings
        draw.ellipse([cx-4, cy-3, cx+4, cy+3], fill=body)
        # Wings (blur)
        wing_spread = 3 + (frame % 2)
        draw.line([cx-2, cy-1, cx-2-wing_spread, cy-wing_spread], fill=body+(120,))
        draw.line([cx+2, cy-1, cx+2+wing_spread, cy-wing_spread], fill=body+(120,))
        # Proboscis
        draw.line([cx, cy+3, cx, cy+6], fill=bright(body))
        # Eyes
        draw.point((cx-2, cy-1), fill=(255,255,255))
        draw.point((cx+2, cy-1), fill=(255,255,255))

    elif enemy_id == 'swarm_drone':
        # Tiny drone
        draw.rectangle([cx-3, cy-2, cx+3, cy+2], fill=body)
        # Rotor
        angle = frame * 45
        for da in [0, 90, 180, 270]:
            rad = math.radians(angle + da)
            ex = int(cx + 5 * math.cos(rad))
            ey = int(cy + 5 * math.sin(rad))
            draw.point((ex, ey), fill=body+(160,))

    elif enemy_id == 'turret_bloom':
        # Flower turret
        petal_open = 1.0 if state in ('charge', 'fire') else 0.6 + 0.2 * math.sin(frame * 0.8)
        num_petals = 6
        for i in range(num_petals):
            angle = (360 / num_petals) * i + frame * 5
            rad = math.radians(angle)
            pr = int(10 * petal_open)
            px = int(cx + pr * math.cos(rad))
            py = int(cy + pr * math.sin(rad))
            draw.ellipse([px-3, py-3, px+3, py+3], fill=body+(180,))
        # Core
        cr = 4 if state != 'fire' else 5
        core_bright = bright(body, 1.5) if state == 'charge' else body
        draw.ellipse([cx-cr, cy-cr, cx+cr, cy+cr], fill=core_bright)
        draw.ellipse([cx-2, cy-2, cx+2, cy+2], fill=(255,255,255,200))

    elif enemy_id == 'parasite_cloud':
        # Amorphous cloud
        for _ in range(8):
            px = cx + random.randint(-5, 5)
            py = cy + random.randint(-5, 5)
            r = random.randint(2, 4)
            a = random.randint(80, 160)
            draw.ellipse([px-r, py-r, px+r, py+r], fill=body+(a,))

    elif enemy_id == 'rail_sentinel':
        # Mechanical sphere on rail
        draw.ellipse([cx-8, cy-8, cx+8, cy+8], fill=body)
        # Sensor ring
        ring_angle = frame * 30
        for i in range(8):
            a = ring_angle + i * 45
            rad = math.radians(a)
            rx = int(cx + 10 * math.cos(rad))
            ry = int(cy + 10 * math.sin(rad))
            draw.point((rx, ry), fill=bright(body))
        # Eye
        draw.ellipse([cx-2, cy-2, cx+2, cy+2], fill=(255, 160, 60, 255))
        draw.point((cx, cy), fill=(255, 255, 255))
        # Rail line
        draw.line([ox, cy+12, ox+sw, cy+12], fill=glow+(100,), width=1)

    elif enemy_id == 'bomber':
        # Round body with fuse
        r = hw // 2 - 2
        draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=body)
        # Fuse
        draw.line([cx+2, cy-r, cx+4, cy-r-4], fill=(200, 200, 200))
        # Fuse spark (blink)
        if frame % 2 == 0:
            draw.point((cx+4, cy-r-5), fill=(255, 255, 100, 255))
        # Eyes
        draw.point((cx-2, cy-2), fill=(255,255,255))
        draw.point((cx+2, cy-2), fill=(255,255,255))

    elif enemy_id == 'shield_bug':
        # Small body behind large shield
        if state != 'exposed':
            # Shield
            draw.rectangle([cx-10, cy-8, cx-4, cy+8], fill=body+(160,))
            draw.rectangle([cx-10, cy-8, cx-4, cy+8], outline=bright(body)+(200,))
            # Body behind
            draw.ellipse([cx, cy-4, cx+8, cy+4], fill=dim(body, 0.7))
        else:
            # Exposed - trembling body
            tx = random.randint(-1, 1)
            draw.ellipse([cx-5+tx, cy-5, cx+5+tx, cy+5], fill=dim(body, 0.7))
        # Legs
        draw.line([cx+2, cy+5, cx, cy+9], fill=body, width=1)
        draw.line([cx+6, cy+5, cx+8, cy+9], fill=body, width=1)

    elif enemy_id == 'mirror':
        # Reflective sphere
        r = hw // 2 - 1
        # Base circle with gradient
        for ir in range(r, 0, -1):
            t = ir / r
            c = lerp_color((255, 255, 255), body, t)
            a = int(200 + 55 * t)
            draw.ellipse([cx-ir, cy-ir, cx+ir, cy+ir], fill=c+(a,))
        # Reflection highlight
        draw.ellipse([cx-4, cy-6, cx-1, cy-3], fill=(255,255,255,150))
        if state == 'reflect':
            # Flash
            draw.ellipse([cx-r-2, cy-r-2, cx+r+2, cy+r+2], fill=body+(100,))

    elif enemy_id == 'ambusher':
        alpha = 40 if state == 'hidden' else 255
        # Crouching figure with glowing eyes
        draw.rectangle([cx-6, cy-4, cx+6, cy+6], fill=body+(alpha,))
        # Claws
        if state == 'attack':
            draw.line([cx-6, cy, cx-10, cy-3], fill=bright(body)+(alpha,), width=1)
            draw.line([cx+6, cy, cx+10, cy-3], fill=bright(body)+(alpha,), width=1)
        # Eyes
        eye_a = min(255, alpha + 100)
        draw.point((cx-3, cy-2), fill=(255, 200, 200, eye_a))
        draw.point((cx+3, cy-2), fill=(255, 200, 200, eye_a))

    elif enemy_id == 'core_carrier':
        # Large armored body with glowing core
        # Armor plates
        draw.rectangle([cx-14, cy-14, cx+14, cy+14], fill=dim(body, 0.5))
        draw.rectangle([cx-12, cy-12, cx+12, cy+12], fill=dim(body, 0.6))
        # Energy lines
        for i in range(-10, 11, 5):
            draw.line([cx+i, cy-14, cx+i, cy+14], fill=glow+(60,))
        # Core
        if state == 'low_hp':
            core_r = 5 + frame % 2
            draw.ellipse([cx-core_r, cy-core_r, cx+core_r, cy+core_r], fill=bright(body)+(220,))
        else:
            draw.ellipse([cx-4, cy-4, cx+4, cy+4], fill=body+(220,))
        draw.ellipse([cx-2, cy-2, cx+2, cy+2], fill=(255,255,255,200))
        # Legs
        for lx in [-10, -4, 4, 10]:
            draw.line([cx+lx, cy+14, cx+lx, cy+17], fill=dim(body, 0.4))

    elif enemy_id == 'sentinel_miniboss':
        # Upgraded rail sentinel - larger with dual eyes
        draw.ellipse([cx-16, cy-16, cx+16, cy+16], fill=body)
        draw.ellipse([cx-14, cy-14, cx+14, cy+14], fill=dim(body, 0.8))
        # Dual eyes
        draw.ellipse([cx-7, cy-3, cx-3, cy+1], fill=(255, 100, 100))
        draw.ellipse([cx+3, cy-3, cx+7, cy+1], fill=(255, 100, 100))
        draw.point((cx-5, cy-1), fill=(255,255,255))
        draw.point((cx+5, cy-1), fill=(255,255,255))
        # Electric arcs
        for _ in range(3):
            ax = cx + random.randint(-18, 18)
            ay = cy + random.randint(-18, 18)
            draw.point((ax, ay), fill=bright(body)+(200,))
        # Weapon mounts
        draw.rectangle([cx-20, cy-2, cx-16, cy+2], fill=dim(body, 0.5))
        draw.rectangle([cx+16, cy-2, cx+20, cy+2], fill=dim(body, 0.5))

    elif enemy_id == 'data_guardian':
        # Holographic octahedron
        r = hw // 2 - 4
        # Octahedron shape
        points = [(cx, cy-r), (cx+r, cy), (cx, cy+r), (cx-r, cy)]
        draw.polygon(points, fill=body+(100,), outline=body+(200,))
        # Internal data streams
        for i in range(3):
            y = cy - r + i * r
            draw.line([cx-r//2, y, cx+r//2, y], fill=glow+(80,))
        # Rotating symbols
        for i in range(4):
            angle = frame * 20 + i * 90
            rad = math.radians(angle)
            sx = int(cx + (r+4) * math.cos(rad))
            sy = int(cy + (r+4) * math.sin(rad))
            draw.point((sx, sy), fill=bright(body)+(180,))

    elif enemy_id == 'bloom_heart':
        # Large pulsating heart
        pulse = 1 + 0.1 * math.sin(frame * math.pi / 2)
        r = int(22 * pulse)
        # Outer membrane
        draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=dim(body, 0.4)+(200,))
        draw.ellipse([cx-r+3, cy-r+3, cx+r-3, cy+r-3], fill=body+(160,))
        # Veins
        for angle in range(0, 360, 45):
            rad = math.radians(angle)
            ex = int(cx + r * 1.1 * math.cos(rad))
            ey = int(cy + r * 1.1 * math.sin(rad))
            draw.line([cx, cy, ex, ey], fill=glow+(80,), width=1)
        # Core
        draw.ellipse([cx-6, cy-6, cx+6, cy+6], fill=bright(body)+(200,))
        draw.ellipse([cx-3, cy-3, cx+3, cy+3], fill=(255,255,255,180))
        # Tentacles
        for i in range(4):
            angle = i * 90 + 45
            rad = math.radians(angle)
            for seg in range(3):
                sx = int(cx + (r + seg * 4) * math.cos(rad))
                sy = int(cy + (r + seg * 4) * math.sin(rad))
                draw.point((sx, sy), fill=body+(140,))

    elif enemy_id == 'acid_wyrm':
        # Serpent head with open jaws
        draw.ellipse([cx-10, cy-10, cx+10, cy+10], fill=body)
        # Jaws
        jaw_open = 4 if state == 'attack' else 2
        draw.polygon([(cx-8, cy-jaw_open), (cx, cy-10), (cx+8, cy-jaw_open)], fill=dim(body, 0.7))
        draw.polygon([(cx-8, cy+jaw_open), (cx, cy+10), (cx+8, cy+jaw_open)], fill=dim(body, 0.7))
        # Acid drip
        draw.line([cx-3, cy+10, cx-4, cy+14], fill=(136, 255, 34, 180))
        draw.line([cx+3, cy+10, cx+4, cy+14], fill=(136, 255, 34, 180))
        # Eyes
        draw.point((cx-4, cy-3), fill=(255, 255, 100))
        draw.point((cx+4, cy-3), fill=(255, 255, 100))

    elif enemy_id == 'acid_wyrm_seg':
        # Body segment
        r = hw // 2 - 1
        draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=body)
        draw.ellipse([cx-r+2, cy-r+2, cx+r-2, cy+r-2], fill=dim(body, 0.8))

    elif enemy_id == 'drill_mother':
        # Massive mechanical with drill face
        # Treads
        draw.rectangle([ox+4, oy+50, ox+20, oy+64], fill=dim(body, 0.4))
        draw.rectangle([ox+48, oy+50, ox+64, oy+64], fill=dim(body, 0.4))
        # Main body
        draw.rectangle([ox+10, oy+10, ox+58, oy+52], fill=dim(body, 0.6))
        draw.rectangle([ox+12, oy+12, ox+56, oy+50], fill=dim(body, 0.5))
        # Drill (rotating)
        drill_angle = frame * 30
        dcx, dcy = cx, oy + 16
        for i in range(6):
            a = drill_angle + i * 60
            rad = math.radians(a)
            ex = int(dcx + 12 * math.cos(rad))
            ey = int(dcy + 12 * math.sin(rad))
            draw.line([dcx, dcy, ex, ey], fill=body, width=2)
        draw.ellipse([dcx-4, dcy-4, dcx+4, dcy+4], fill=bright(body))
        # Reactor core
        draw.ellipse([cx-4, cy+8, cx+4, cy+16], fill=(255, 150, 50, 200))

    elif enemy_id == 'swarm_mother':
        # Organic body with hive pods
        draw.ellipse([cx-12, cy-12, cx+12, cy+12], fill=body+(200,))
        draw.ellipse([cx-10, cy-10, cx+10, cy+10], fill=dim(body, 0.7)+(200,))
        # Hive pods
        for angle in [45, 135, 225, 315]:
            rad = math.radians(angle)
            px = int(cx + 9 * math.cos(rad))
            py = int(cy + 9 * math.sin(rad))
            pod_open = state == 'spawn' and frame > 0
            c = bright(body) if pod_open else dim(body, 0.6)
            draw.ellipse([px-3, py-3, px+3, py+3], fill=c)
            if pod_open:
                draw.point((px, py), fill=(255, 255, 255, 200))
        # Semi-transparent belly
        draw.ellipse([cx-6, cy-4, cx+6, cy+6], fill=body+(80,))

def gen_enemy_sprites():
    for enemy_id, states in ENEMY_FRAMES.items():
        d = ENEMY_DATA[enemy_id]
        sw, sh = d['sp']
        total_frames = sum(f for _, f in states)
        img = Image.new('RGBA', (sw * total_frames, sh), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        frame_offset = 0
        for state_name, frame_count in states:
            for f in range(frame_count):
                random.seed(hash((enemy_id, state_name, f)))
                ox = (frame_offset + f) * sw
                draw_enemy_frame(draw, ox, 0, enemy_id, state_name, f, sw, sh)
            frame_offset += frame_count
        img.save(os.path.join(ENEMIES, f'{enemy_id}.png'))
    print(f"  enemies: {len(ENEMY_FRAMES)} sheets")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PROJECTILE GENERATOR
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def gen_projectiles():
    projs = {
        'proj_pulse':    {'size': (6,3),  'color': '#ffff44', 'shape': 'oval'},
        'proj_scatter':  {'size': (4,4),  'color': '#ff6644', 'shape': 'circle'},
        'proj_beam':     {'size': (20,3), 'color': '#ff2244', 'shape': 'beam'},
        'proj_ricochet': {'size': (5,5),  'color': '#44ffaa', 'shape': 'diamond'},
        'proj_chain':    {'size': (5,5),  'color': '#44ddff', 'shape': 'circle'},
        'proj_acid':     {'size': (5,5),  'color': '#88ff22', 'shape': 'drop'},
        'chain_arc':     {'size': (80,4), 'color': '#44ddff', 'shape': 'arc'},
        'drone':         {'size': (8,8),  'color': '#ffcc44', 'shape': 'drone'},
        'proj_enemy_default': {'size': (4,4), 'color': '#ff2244', 'shape': 'circle'},
        'proj_turret':   {'size': (5,5),  'color': '#cc44ff', 'shape': 'circle'},
        'proj_bomb':     {'size': (8,8),  'color': '#ff6622', 'shape': 'bomb'},
        'proj_acid_spit':{'size': (6,6),  'color': '#88ff22', 'shape': 'drop'},
        'proj_laser_beam':{'size': (4,30),'color': '#ff2244', 'shape': 'vbeam'},
    }
    for name, p in projs.items():
        w, h = p['size']
        img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        c = hex_rgb(p['color'])
        cx, cy = w // 2, h // 2
        if p['shape'] == 'oval':
            draw.ellipse([0, 0, w-1, h-1], fill=c)
            draw.line([w//2, 0, w//2, h-1], fill=(255,255,255,180))
        elif p['shape'] == 'circle':
            r = min(w, h) // 2
            draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=c)
            draw.point((cx, cy), fill=(255,255,255,220))
        elif p['shape'] == 'beam':
            draw.rectangle([0, 0, w-1, h-1], fill=c+(200,))
            draw.line([0, h//2, w-1, h//2], fill=(255,255,255,255))
        elif p['shape'] == 'vbeam':
            draw.rectangle([0, 0, w-1, h-1], fill=c+(200,))
            draw.line([w//2, 0, w//2, h-1], fill=(255,255,255,255))
        elif p['shape'] == 'diamond':
            draw_diamond(draw, cx, cy, min(w,h)//2, c)
            draw.point((cx, cy), fill=(255,255,255))
        elif p['shape'] == 'drop':
            draw.polygon([(cx, 0), (w-1, h*2//3), (cx, h-1), (0, h*2//3)], fill=c+(200,))
        elif p['shape'] == 'arc':
            for x in range(w):
                intensity = int(255 * (0.5 + 0.5 * math.sin(x * 0.3)))
                draw.line([x, 1, x, 2], fill=c+(intensity,))
                draw.point((x, 0), fill=c+(intensity//3,))
                draw.point((x, 3), fill=c+(intensity//3,))
        elif p['shape'] == 'drone':
            draw.rectangle([1, 2, 6, 5], fill=c)
            draw.line([0, 0, 3, 2], fill=c+(160,))
            draw.line([7, 0, 4, 2], fill=c+(160,))
            draw.point((2, 3), fill=(255,255,255))
        elif p['shape'] == 'bomb':
            r = 3
            draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=c)
            draw.line([cx, cy-r, cx+1, cy-r-2], fill=(200,200,200))
            draw.point((cx+1, cy-r-3), fill=(255, 50, 50, 200))
        img.save(os.path.join(PROJ, f'{name}.png'))
    print(f"  projectiles: {len(projs)} images")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PICKUP GENERATOR
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def gen_pickups():
    # Health: 12x12 x 4 frames
    img = Image.new('RGBA', (48, 12), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for f in range(4):
        ox = f * 12
        bob = int(1.5 * math.sin(f * math.pi / 2))
        c = hex_rgb('#ff4466')
        # Heart shape
        draw.ellipse([ox+2, 2+bob, ox+5, 5+bob], fill=c)
        draw.ellipse([ox+5, 2+bob, ox+8, 5+bob], fill=c)
        draw.polygon([(ox+2, 4+bob), (ox+5, 9+bob), (ox+8, 4+bob)], fill=c)
        # Glow
        pulse = 0.7 + 0.3 * math.sin(f * math.pi / 2)
        a = int(60 * pulse)
        draw.ellipse([ox, 0, ox+11, 11], fill=c+(a,))
    img.save(os.path.join(PICKUPS, 'pickup_health.png'))

    # Shard: 10x10 x 3 frames
    img = Image.new('RGBA', (30, 10), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for f in range(3):
        ox = f * 10
        c = hex_rgb('#ffcc44')
        # Rotating crystal (diamond shape, rotated per frame)
        squeeze = abs(f - 1) * 2
        draw_diamond(draw, ox+5, 5, 4-squeeze, c)
        draw.point((ox+5, 3), fill=(255,255,255,200))
        # Sparkle
        draw.point((ox+2+f*2, 1), fill=(255,255,255,180))
    img.save(os.path.join(PICKUPS, 'pickup_shard.png'))

    # EMP: 14x14 x 3 frames
    img = Image.new('RGBA', (42, 14), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for f in range(3):
        ox = f * 14
        c = hex_rgb('#44ddff')
        cx, cy = ox + 7, 7
        # Orb
        for r in range(6, 0, -1):
            a = int(200 * (1 - r/6))
            draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=c+(a,))
        draw.ellipse([cx-2, cy-2, cx+2, cy+2], fill=(255,255,255,220))
        # Lightning bolts
        for _ in range(2 + f):
            angle = random.randint(0, 360)
            rad = math.radians(angle)
            ex = int(cx + 6 * math.cos(rad))
            ey = int(cy + 6 * math.sin(rad))
            draw.line([cx, cy, ex, ey], fill=c+(160,))
    img.save(os.path.join(PICKUPS, 'pickup_emp.png'))

    # Weapon pickup: 16x16 x 4 frames
    img = Image.new('RGBA', (64, 16), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for f in range(4):
        ox = f * 16
        cx, cy = ox + 8, 8
        bob = int(1.5 * math.sin(f * math.pi / 2))
        # Gold frame
        draw.rectangle([ox+1, 1+bob, ox+14, 14+bob], outline=hex_rgb('#ffcc44')+(200,))
        # Weapon silhouette
        draw.rectangle([ox+4, 6+bob, ox+12, 9+bob], fill=(200, 200, 200, 180))
    img.save(os.path.join(PICKUPS, 'pickup_weapon.png'))

    # Upgrade card frame: 48x64
    img = Image.new('RGBA', (48, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 0, 47, 63], fill=(15, 15, 25, 240))
    draw.rectangle([0, 0, 47, 63], outline=hex_rgb('#44ddff')+(200,))
    draw.rectangle([2, 2, 45, 61], outline=hex_rgb('#44ddff')+(80,))
    # Icon placeholder
    draw.rectangle([12, 8, 36, 32], fill=(30, 30, 50, 200))
    draw.rectangle([12, 8, 36, 32], outline=hex_rgb('#44ddff')+(100,))
    # Text area
    for y in range(40, 56, 4):
        draw.line([8, y, 40, y], fill=(100, 100, 120, 80))
    img.save(os.path.join(PICKUPS, 'upgrade_card_frame.png'))

    print("  pickups: 5 images")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# UI GENERATOR
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def gen_ui():
    cyan = hex_rgb('#44ddff')

    # Hearts: full, empty, half (16x16 each)
    for htype in ['full', 'empty', 'half']:
        img = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        c = cyan if htype != 'empty' else dim(cyan, 0.3)
        # Heart shape
        draw.ellipse([1, 2, 7, 8], fill=c)
        draw.ellipse([7, 2, 13, 8], fill=c)
        draw.polygon([(1, 6), (7, 14), (13, 6)], fill=c)
        if htype == 'half':
            # Mask right half
            draw.rectangle([8, 0, 15, 15], fill=(0, 0, 0, 0))
            # Redraw right as empty
            ec = dim(cyan, 0.3)
            draw.ellipse([7, 2, 13, 8], outline=ec)
            draw.line([13, 6, 7, 14], fill=ec)
        if htype == 'empty':
            img2 = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
            d2 = ImageDraw.Draw(img2)
            d2.ellipse([1, 2, 7, 8], outline=c)
            d2.ellipse([7, 2, 13, 8], outline=c)
            d2.line([1, 6, 7, 14], fill=c)
            d2.line([13, 6, 7, 14], fill=c)
            img = img2
        img.save(os.path.join(UI, f'ui_heart_{htype}.png'))

    # Combo bar: 100x12
    img = Image.new('RGBA', (100, 12), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 0, 99, 11], fill=(20, 20, 30, 200))
    draw.rectangle([0, 0, 99, 11], outline=cyan+(150,))
    # Tier markers
    for x in [20, 40, 60, 80]:
        draw.line([x, 0, x, 11], fill=cyan+(80,))
    # Gradient fill (showing combo state)
    colors = [hex_rgb('#ffff44'), hex_rgb('#ff8844'), hex_rgb('#ff2244'), hex_rgb('#ff44aa'), (255,255,255)]
    for x in range(98):
        t = x / 98
        idx = min(int(t * 4), 3)
        lt = (t * 4) - idx
        c = lerp_color(colors[idx], colors[idx+1], lt)
        draw.line([x+1, 2, x+1, 9], fill=c+(180,))
    img.save(os.path.join(UI, 'ui_combo_bar.png'))

    # Combo tier badges: 24x24 x 5 (0-4)
    for tier in range(5):
        img = Image.new('RGBA', (24, 24), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        colors_t = [hex_rgb('#ffff44'), hex_rgb('#ff8844'), hex_rgb('#ff2244'), hex_rgb('#ff44aa'), (255,255,255)]
        c = colors_t[tier]
        # Background circle
        for r in range(11, 0, -1):
            a = int(100 * (1 - r/11))
            draw.ellipse([12-r, 12-r, 12+r, 12+r], fill=c+(a,))
        draw.ellipse([6, 6, 18, 18], fill=(20, 20, 30, 220))
        draw.ellipse([6, 6, 18, 18], outline=c+(200,))
        # Number (simple pixel digit)
        # Draw tier number centered
        num = str(tier)
        # Simple 3x5 pixel font
        digits = {
            '0': [(0,0),(1,0),(2,0),(0,1),(2,1),(0,2),(2,2),(0,3),(2,3),(0,4),(1,4),(2,4)],
            '1': [(1,0),(1,1),(1,2),(1,3),(1,4)],
            '2': [(0,0),(1,0),(2,0),(2,1),(0,2),(1,2),(2,2),(0,3),(0,4),(1,4),(2,4)],
            '3': [(0,0),(1,0),(2,0),(2,1),(0,2),(1,2),(2,2),(2,3),(0,4),(1,4),(2,4)],
            '4': [(0,0),(2,0),(0,1),(2,1),(0,2),(1,2),(2,2),(2,3),(2,4)],
        }
        if num in digits:
            for dx, dy in digits[num]:
                draw.point((10+dx, 9+dy), fill=c+(255,))
        img.save(os.path.join(UI, f'ui_combo_tier_{tier}.png'))

    # Score digits: 100x14 (10 digits, 10px wide each)
    img = Image.new('RGBA', (100, 14), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    digits_5x7 = {
        '0': [(1,0),(2,0),(3,0),(0,1),(4,1),(0,2),(4,2),(0,3),(4,3),(0,4),(4,4),(0,5),(4,5),(1,6),(2,6),(3,6)],
        '1': [(2,0),(1,1),(2,1),(2,2),(2,3),(2,4),(2,5),(1,6),(2,6),(3,6)],
        '2': [(1,0),(2,0),(3,0),(0,1),(4,1),(4,2),(3,3),(2,4),(1,5),(0,6),(1,6),(2,6),(3,6),(4,6)],
        '3': [(1,0),(2,0),(3,0),(4,1),(2,2),(3,2),(4,3),(4,4),(0,5),(4,5),(1,6),(2,6),(3,6)],
        '4': [(0,0),(4,0),(0,1),(4,1),(0,2),(4,2),(1,3),(2,3),(3,3),(4,3),(4,4),(4,5),(4,6)],
        '5': [(0,0),(1,0),(2,0),(3,0),(4,0),(0,1),(0,2),(1,2),(2,2),(3,2),(4,3),(4,4),(0,5),(4,5),(1,6),(2,6),(3,6)],
        '6': [(1,0),(2,0),(3,0),(0,1),(0,2),(1,2),(2,2),(3,2),(0,3),(4,3),(0,4),(4,4),(0,5),(4,5),(1,6),(2,6),(3,6)],
        '7': [(0,0),(1,0),(2,0),(3,0),(4,0),(4,1),(3,2),(2,3),(2,4),(2,5),(2,6)],
        '8': [(1,0),(2,0),(3,0),(0,1),(4,1),(0,2),(4,2),(1,3),(2,3),(3,3),(0,4),(4,4),(0,5),(4,5),(1,6),(2,6),(3,6)],
        '9': [(1,0),(2,0),(3,0),(0,1),(4,1),(0,2),(4,2),(1,3),(2,3),(3,3),(4,3),(4,4),(4,5),(1,6),(2,6),(3,6)],
    }
    for i in range(10):
        ox = i * 10
        digit = str(i)
        if digit in digits_5x7:
            for dx, dy in digits_5x7[digit]:
                draw.point((ox + 2 + dx, 3 + dy), fill=cyan+(255,))
                # Glow
                draw.point((ox + 2 + dx, 2 + dy), fill=cyan+(30,))
                draw.point((ox + 2 + dx, 4 + dy), fill=cyan+(30,))
    img.save(os.path.join(UI, 'ui_digits_0-9.png'))

    # Depth meter: 40x200
    img = Image.new('RGBA', (40, 200), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 0, 39, 199], fill=(10, 10, 20, 180))
    draw.rectangle([0, 0, 39, 199], outline=cyan+(100,))
    # Biome color bands
    biome_colors = ['#1a2a3a', '#2a1a32', '#122a1a', '#1e1830', '#2a2010', '#2a1412']
    band_h = 200 // 6
    for i, bc in enumerate(biome_colors):
        y = i * band_h
        draw.rectangle([2, y+1, 37, y+band_h-1], fill=hex_rgb(bc)+(160,))
    img.save(os.path.join(UI, 'ui_depth_bar.png'))

    # Weapon heat bar: 60x8
    img = Image.new('RGBA', (60, 8), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 0, 59, 7], fill=(20, 20, 30, 200))
    draw.rectangle([0, 0, 59, 7], outline=(100, 100, 120, 150))
    for x in range(58):
        t = x / 58
        if t < 0.5:
            c = lerp_color(hex_rgb('#2244ff'), hex_rgb('#ffff44'), t * 2)
        else:
            c = lerp_color(hex_rgb('#ffff44'), hex_rgb('#ff2244'), (t - 0.5) * 2)
        draw.line([x+1, 1, x+1, 6], fill=c+(200,))
    img.save(os.path.join(UI, 'ui_heat_bar.png'))

    # Dash charges: full + empty (12x12)
    for state in ['full', 'empty']:
        img = Image.new('RGBA', (12, 12), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        c = cyan if state == 'full' else dim(cyan, 0.3)
        # Wing/bolt shape
        draw.polygon([(6, 0), (10, 5), (6, 4), (2, 5)], fill=c)
        draw.polygon([(6, 11), (10, 6), (6, 7), (2, 6)], fill=c)
        if state == 'full':
            draw.point((6, 5), fill=(255,255,255,200))
        img.save(os.path.join(UI, f'ui_dash_{state}.png'))

    # EMP charges: ready + empty (16x16)
    for state in ['ready', 'empty']:
        img = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        c = cyan if state == 'ready' else dim(cyan, 0.3)
        draw.ellipse([1, 1, 14, 14], outline=c)
        # Lightning bolt
        draw.polygon([(8, 2), (5, 8), (8, 7), (7, 13), (10, 7), (7, 8)], fill=c)
        if state == 'ready':
            # Glow
            for r in range(7, 0, -1):
                a = int(30 * (1 - r/7))
                draw.ellipse([8-r, 8-r, 8+r, 8+r], fill=c+(a,))
        img.save(os.path.join(UI, f'ui_emp_{state}.png'))

    # Logo: 200x80
    img = Image.new('RGBA', (200, 80), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # "NEON DESCENT" as pixel blocks
    text = "NEON DESCENT"
    char_w, char_h = 12, 16
    start_x = (200 - len(text) * char_w) // 2
    for i, ch in enumerate(text):
        if ch == ' ':
            continue
        x = start_x + i * char_w
        y = 30
        # Each letter as a glowing block
        draw.rectangle([x+1, y+1, x+char_w-2, y+char_h-2], fill=cyan+(200,))
        draw.rectangle([x, y, x+char_w-1, y+char_h-1], outline=bright(cyan)+(255,))
        # Glow
        for r in range(4, 0, -1):
            a = int(40 * (1 - r/4))
            draw.rectangle([x-r, y-r, x+char_w-1+r, y+char_h-1+r], outline=cyan+(a,))
    img.save(os.path.join(UI, 'ui_logo.png'))

    # Menu background: 360x640
    img = Image.new('RGBA', (360, 640), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Dark gradient with abyss at bottom
    for y in range(640):
        t = y / 640
        r = int(10 * (1 - t * 0.5))
        g = int(10 * (1 - t * 0.7))
        b = int(26 * (1 - t * 0.3))
        draw.line([0, y, 359, y], fill=(r, g, b, 255))
    # Neon signs and structures
    random.seed(42)
    for _ in range(20):
        x = random.randint(20, 340)
        y = random.randint(50, 500)
        w = random.randint(20, 80)
        h = random.randint(40, 150)
        c = random.choice([cyan, hex_rgb('#ff44aa'), hex_rgb('#44ff88'), hex_rgb('#ffcc44')])
        draw.rectangle([x, y, x+w, y+h], outline=c+(40,))
        # Neon accent
        draw.line([x, y, x+w, y], fill=c+(100,))
    # Fog
    for y in range(400, 640):
        a = int(80 * ((y - 400) / 240))
        draw.line([0, y, 359, y], fill=(10, 5, 20, a))
    img.save(os.path.join(UI, 'ui_menu_bg.png'))

    # Button: 120x40 (3 states: normal, hover, pressed)
    for si, state in enumerate(['normal', 'hover', 'pressed']):
        img = Image.new('RGBA', (120, 40), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        if state == 'pressed':
            draw.rectangle([0, 0, 119, 39], fill=cyan+(40,))
        else:
            draw.rectangle([0, 0, 119, 39], fill=(15, 15, 25, 220))
        glow_a = 100 if state == 'normal' else 200 if state == 'hover' else 255
        draw.rectangle([0, 0, 119, 39], outline=cyan+(glow_a,))
        if state == 'hover':
            draw.rectangle([1, 1, 118, 38], outline=cyan+(60,))
        img.save(os.path.join(UI, f'ui_button_{state}.png'))

    # Death overlay: 360x640
    img = Image.new('RGBA', (360, 640), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 0, 359, 639], fill=(10, 0, 0, 160))
    # Red edge glow
    red = hex_rgb('#ff2244')
    for i in range(10):
        a = int(80 * (1 - i / 10))
        draw.rectangle([i, i, 359-i, 639-i], outline=red+(a,))
    # Scanlines
    for y in range(0, 640, 4):
        draw.line([0, y, 359, y], fill=(0, 0, 0, 30))
    img.save(os.path.join(UI, 'ui_death_overlay.png'))

    # Shop frame: 320x400
    img = Image.new('RGBA', (320, 400), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 0, 319, 399], fill=(10, 10, 20, 230))
    draw.rectangle([0, 0, 319, 399], outline=cyan+(180,))
    draw.rectangle([2, 2, 317, 397], outline=cyan+(60,))
    # 3 card slots
    for i in range(3):
        x = 20 + i * 100
        draw.rectangle([x, 40, x+80, 340], fill=(20, 20, 35, 200))
        draw.rectangle([x, 40, x+80, 340], outline=cyan+(100,))
    # Title area
    draw.line([10, 25, 310, 25], fill=cyan+(120,))
    img.save(os.path.join(UI, 'ui_shop_frame.png'))

    print("  UI: 22 images")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# VFX GENERATOR
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def gen_vfx():
    cyan = hex_rgb('#44ddff')

    # Stomp shockwave: 64x16, 4 frames
    img = Image.new('RGBA', (256, 16), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for f in range(4):
        ox = f * 64
        cx, cy = ox + 32, 8
        r = 8 + f * 8
        a = max(0, 255 - f * 60)
        for ir in range(r, max(0, r-4), -1):
            ia = int(a * (1 - (r - ir) / 4))
            draw.ellipse([cx-ir, cy-3, cx+ir, cy+3], outline=cyan+(ia,))
        # Center bright line
        draw.line([cx-r+2, cy, cx+r-2, cy], fill=(255,255,255, a))
    img.save(os.path.join(VFX, 'vfx_stomp_wave.png'))

    # Dash trail: 32x8, 3 frames
    img = Image.new('RGBA', (96, 8), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for f in range(3):
        ox = f * 32
        a = max(0, 255 - f * 80)
        length = 30 - f * 8
        for y in range(8):
            ya = int(a * (1 - abs(y - 4) / 4))
            draw.line([ox, y, ox + length, y], fill=cyan+(max(0, ya),))
        draw.line([ox, 4, ox+length, 4], fill=(255,255,255,a))
    img.save(os.path.join(VFX, 'vfx_dash_trail.png'))

    # Enemy explosion small: 24x24, 4 frames
    img = Image.new('RGBA', (96, 24), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for f in range(4):
        ox = f * 24
        cx, cy = ox + 12, 12
        r = 4 + f * 4
        a = max(0, 255 - f * 60)
        # Burst circle
        for ir in range(r, 0, -1):
            ia = int(a * (ir / r))
            draw.ellipse([cx-ir, cy-ir, cx+ir, cy+ir], fill=(255, 200, 100, ia))
        # White center on first frame
        if f == 0:
            draw.ellipse([cx-3, cy-3, cx+3, cy+3], fill=(255, 255, 255, 255))
        # Fragments
        random.seed(f + 200)
        for _ in range(4 - f):
            fx = cx + random.randint(-r, r)
            fy = cy + random.randint(-r, r)
            draw.point((fx, fy), fill=(255, 200, 100, a))
    img.save(os.path.join(VFX, 'vfx_explosion_small.png'))

    # Boss explosion: 64x64, 6 frames
    img = Image.new('RGBA', (384, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for f in range(6):
        ox = f * 64
        cx, cy = ox + 32, 32
        r = 8 + f * 8
        a = max(0, 255 - f * 40)
        # Multi-ring explosion
        for ring in range(3):
            rr = r - ring * 6
            if rr > 0:
                ra = int(a * (1 - ring * 0.3))
                colors = [(255,100,100), (255,200,100), (255,255,200)]
                draw.ellipse([cx-rr, cy-rr, cx+rr, cy+rr], fill=colors[ring]+(max(0,ra),))
        # White flash center
        if f < 2:
            fr = 10 - f * 3
            draw.ellipse([cx-fr, cy-fr, cx+fr, cy+fr], fill=(255,255,255, 255 - f*80))
        # Debris
        random.seed(f + 300)
        for _ in range(8):
            spread = r + 5
            fx = cx + random.randint(-spread, spread)
            fy = cy + random.randint(-spread, spread)
            draw.rectangle([fx, fy, fx+2, fy+2], fill=(255, 200, 100, max(0, a-40)))
    img.save(os.path.join(VFX, 'vfx_explosion_boss.png'))

    # Heal sparkle: 16x16, 3 frames
    img = Image.new('RGBA', (48, 16), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    green = hex_rgb('#44ff88')
    for f in range(3):
        ox = f * 16
        random.seed(f + 400)
        for _ in range(4):
            x = ox + random.randint(2, 13)
            y = 14 - f * 4 + random.randint(-2, 2)
            if 0 <= y < 16:
                draw.point((x, y), fill=green+(200,))
                draw.point((x, y-1), fill=(255,255,255,150))
    img.save(os.path.join(VFX, 'vfx_heal_sparkle.png'))

    # Combo fire: 32x640, 3 frames (edge effect)
    img = Image.new('RGBA', (96, 640), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    fire_colors = [hex_rgb('#ff4422'), hex_rgb('#ff8844'), hex_rgb('#ffcc44')]
    for f in range(3):
        ox = f * 32
        random.seed(f + 500)
        for y in range(640):
            width = random.randint(3, 15 + int(5 * math.sin(y * 0.05 + f)))
            for x in range(min(width, 32)):
                t = x / max(1, width)
                ci = min(2, int(t * 3))
                a = int(180 * (1 - t))
                draw.point((ox + x, y), fill=fire_colors[ci]+(a,))
    img.save(os.path.join(VFX, 'vfx_combo_fire.png'))

    # Wall slide sparks: 8x16, 2 frames
    img = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    spark = hex_rgb('#ffaa44')
    for f in range(2):
        ox = f * 8
        random.seed(f + 600)
        for _ in range(5):
            x = ox + random.randint(0, 7)
            y = random.randint(0, 15)
            draw.point((x, y), fill=spark+(200,))
            if x + 1 < ox + 8:
                draw.point((x+1, y), fill=spark+(100,))
    img.save(os.path.join(VFX, 'vfx_wallspark.png'))

    # Bounce burst: 20x20, 3 frames
    img = Image.new('RGBA', (60, 20), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    green = hex_rgb('#44ff88')
    for f in range(3):
        ox = f * 20
        cx, cy = ox + 10, 10
        r = 4 + f * 3
        a = max(0, 255 - f * 70)
        draw.ellipse([cx-r, cy-r, cx+r, cy+r], outline=green+(a,))
        draw.ellipse([cx-r+1, cy-r+1, cx+r-1, cy+r-1], outline=green+(a//2,))
    img.save(os.path.join(VFX, 'vfx_bounce.png'))

    # Near miss: 12x12, 2 frames
    img = Image.new('RGBA', (24, 12), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for f in range(2):
        ox = f * 12
        a = 255 - f * 100
        draw.line([ox+2, 0, ox+10, 11], fill=(255,255,255, a), width=1)
        draw.line([ox+3, 0, ox+11, 11], fill=cyan+(a//2,), width=1)
    img.save(os.path.join(VFX, 'vfx_nearmiss.png'))

    # Biome transition: 360x640, 6 frames
    img = Image.new('RGBA', (2160, 640), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for f in range(6):
        ox = f * 360
        sweep_y = int(f * 640 / 6)
        # Scanline sweep
        for y in range(sweep_y, min(sweep_y + 120, 640)):
            progress = (y - sweep_y) / 120
            a = int(200 * (1 - progress))
            draw.line([ox, y, ox+359, y], fill=cyan+(a,))
        # Scan line
        if sweep_y < 640:
            draw.line([ox, sweep_y, ox+359, sweep_y], fill=(255,255,255,220))
    img.save(os.path.join(VFX, 'vfx_biom_transition.png'))

    # Pickup attract: 8x8, 2 frames
    img = Image.new('RGBA', (16, 8), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for f in range(2):
        ox = f * 8
        size = 3 - f
        a = 255 - f * 80
        draw.ellipse([ox+4-size, 4-size, ox+4+size, 4+size], fill=(255,255,255, a))
    img.save(os.path.join(VFX, 'vfx_attract.png'))

    # Muzzle flash: 48x16, 3 frames
    img = Image.new('RGBA', (48, 16), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for f in range(3):
        ox = f * 16
        cx, cy = ox + 8, 8
        r = 6 - f * 2
        a = 255 - f * 70
        draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=(255,255,200, a))
        if f == 0:
            draw.ellipse([cx-2, cy-2, cx+2, cy+2], fill=(255,255,255,255))
    img.save(os.path.join(VFX, 'vfx_muzzle.png'))

    # Impact spark: 36x12, 3 frames
    img = Image.new('RGBA', (36, 12), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for f in range(3):
        ox = f * 12
        cx, cy = ox + 6, 6
        random.seed(f + 700)
        a = 255 - f * 70
        for _ in range(4 - f):
            angle = random.uniform(0, 2 * math.pi)
            length = random.randint(2, 5)
            ex = int(cx + length * math.cos(angle))
            ey = int(cy + length * math.sin(angle))
            draw.line([cx, cy, ex, ey], fill=(255, 220, 150, a))
        draw.point((cx, cy), fill=(255, 255, 255, a))
    img.save(os.path.join(VFX, 'vfx_impact.png'))

    # Enemy hit flash: 32x32
    img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rectangle([2, 2, 29, 29], fill=(255, 255, 255, 120))
    img.save(os.path.join(VFX, 'vfx_enemy_hit.png'))

    print("  VFX: 14 images")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MAIN
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def main():
    print("NEON DESCENT — Asset Generator")
    print("=" * 40)

    print("\n[1/8] Generating tiles...")
    gen_solid_tiles()
    gen_platform_tiles()
    gen_hazard_tiles()
    gen_breakable_tiles()
    gen_bounce_tiles()
    gen_acid_pool()
    gen_laser()
    gen_darkness()

    print("\n[2/8] Generating backgrounds...")
    gen_backgrounds()

    print("\n[3/8] Generating player sprites...")
    gen_player_sprites()

    print("\n[4/8] Generating enemy sprites...")
    gen_enemy_sprites()

    print("\n[5/8] Generating projectiles...")
    gen_projectiles()

    print("\n[6/8] Generating pickups...")
    gen_pickups()

    print("\n[7/8] Generating UI...")
    gen_ui()

    print("\n[8/8] Generating VFX...")
    gen_vfx()

    # Count total files
    total = 0
    for root, dirs, files in os.walk(BASE):
        total += len([f for f in files if f.endswith('.png')])

    print(f"\n{'=' * 40}")
    print(f"DONE! Generated {total} PNG files in public/assets/")
    print(f"  tiles/        — tile sprite sheets")
    print(f"  backgrounds/  — parallax layers")
    print(f"  player/       — player animation sheets")
    print(f"  enemies/      — enemy sprite sheets")
    print(f"  projectiles/  — projectile sprites")
    print(f"  pickups/      — pickup animations")
    print(f"  ui/           — HUD, menus, buttons")
    print(f"  vfx/          — visual effects")

if __name__ == '__main__':
    main()
