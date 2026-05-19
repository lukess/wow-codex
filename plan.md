# 1945 Arcade Game — Implementation Plan

## Overview
Build a classic **1945-style vertical-scrolling arcade shooter** in vanilla JavaScript + HTML5 Canvas, playable in-browser. No frameworks or build tools — just open `index.html` and play.

## Architecture
```
1946/
├── index.html          # Entry point, canvas setup
├── css/
│   └── style.css       # Fullscreen canvas styling
├── js/
│   ├── main.js         # Game loop, state machine (menu → play → gameover)
│   ├── input.js        # Keyboard + touch input handler
│   ├── background.js   # Parallax scrolling background (clouds, ocean, islands)
│   ├── player.js       # Player aircraft: movement, lives, invincibility
│   ├── weapons.js      # Weapon system: types, upgrades, bullet pool
│   ├── enemies.js      # Enemy types, formations, spawn patterns
│   ├── boss.js         # Boss logic: phases, health bar, attack patterns
│   ├── powerups.js     # Power-up drops: weapon upgrade, bomb, health, score
│   ├── particles.js    # Explosions, hit sparks, smoke trails
│   ├── hud.js          # Score, lives, bombs, boss HP bar, level indicator
│   ├── levels.js       # Level definitions: enemy waves, timing, boss trigger
│   ├── audio.js        # Music + SFX manager (Web Audio API)
│   ├── sprites.js      # Sprite sheet loader + animation helper
│   └── collision.js    # AABB + circle collision detection
└── assets/
    ├── sprites/        # All sprite sheets (generated or drawn via canvas)
    └── audio/          # Music + SFX files (generated via Web Audio / bundled)
```

## Approach
- **Pure vanilla JS** — no libraries, no bundler. Single `index.html` loads everything.
- **HTML5 Canvas 2D** for all rendering.
- **Procedural art** — draw sprites programmatically on offscreen canvases so the game works with zero external asset files.
- **Procedural audio** — generate music and SFX via Web Audio API oscillators + noise, so no audio files needed either.
- **Object pooling** for bullets, particles, enemies to avoid GC pressure.

---

## Todos

### 1. Project Scaffold (`scaffold`)
Set up `index.html`, `style.css`, canvas element, and module loading order. Wire up a basic 60fps game loop (`requestAnimationFrame`) with delta-time.

### 2. Input System (`input`)
Keyboard handler (arrow keys / WASD for movement, Space for shoot, B for bomb). Touch support for mobile (virtual joystick + fire button).

### 3. Scrolling Background (`background`)
Multi-layer parallax vertical scroll:
- Layer 0: Ocean/ground texture (slow)
- Layer 1: Islands / terrain patches (medium)
- Layer 2: Clouds (fast, semi-transparent)
All drawn procedurally on offscreen canvases with tiling.

### 4. Player Aircraft (`player`)
- Sprite: procedurally drawn fighter plane (top-down)
- Movement constrained to canvas bounds
- 3 lives, brief invincibility after death
- Screen-shake on hit
- Missle ability (homing, explods after 20s or hits enemy/boss)

### 5. Weapon System (`weapons`)
Bullet pool pattern. Weapon levels (collected via power-ups):
- **Level 1**: Single forward shot
- **Level 2**: Dual forward shot
- **Level 3**: Triple spread shot
- **Level 4**: Dual + rear shot
- **Level 5**: Full spread (5-way) + homing missile
- **Level 6**: Full spread minigun + homing missile
Each level increases fire rate slightly. Downgrade one level on death.

### 6. Enemy System (`enemies`)
Enemy types (all procedurally drawn):
| Type       | Behavior                        | HP  | Points |
|------------|---------------------------------|-----|--------|
| Scout      | Straight down, fast             | 1   | 100    |
| Zigzag     | Sine-wave path                  | 1   | 150    |
| Dive       | Swoops toward player            | 2   | 200    |
| Tank       | Slow, shoots back               | 4   | 300    |
| Formation  | V-shape group, synchronized     | 1ea | 500    |
| Turret     | Stationary, rotates + fires     | 3   | 250    |
| Fighter    | Fast, shoots back follows player + dodges attcks | 10 | 1000 |

Enemies drop power-ups on death (configurable probability per type).

### 7. Power-Up System (`powerups`)
- **Weapon Up** (W): Increase weapon level
- **Bomb** (B): +1 bomb stock
- **Health** (H): +1 life (rare)
- **Score** (S): Bonus points
- **Shield** (shield icon): Temporary invincibility
Power-ups float downward, slight horizontal drift, flash before expiring.

### 8. Collision Detection (`collision`)
- Bullet → Enemy: AABB
- Enemy bullet → Player: circle-circle
- Player → Power-up: AABB
- Player → Enemy (ram): circle-circle
Spatial partitioning via simple grid for performance.
- player → terrain

### 9. Particle & Effects System (`particles`)
Object-pooled particles for:
- Explosions (orange/red burst on enemy death)
- Small sparks (bullet hits)
- Smoke trails (damaged enemies, boss)
- Player death explosion (large, dramatic)
- Screen flash on bomb use or sink in ocean or crashland

### 10. Boss System (`boss`)
One boss per level. Bosses have:
- Large procedurally-drawn sprite
- Multi-phase HP bar (shown on HUD)
- Attack patterns that change per phase:
  - Phase 1: Aimed shots at player
  - Phase 2: Bullet spread patterns
  - Phase 3: Summon minions + rapid fire
- Warning text "WARNING!" before boss appears
- Unique explosion sequence on defeat

Boss designs per level:
| Level | Boss            | Signature Attack         |
|-------|-----------------|--------------------------|
| 1     | Heavy Bomber    | Carpet bomb pattern      |
| 2     | Twin Engine     | Dual rotating turrets    |
| 3     | Flying Fortress | Minion spawn + lasers    |
| 4     | Carrier Ship    | Wave of dive bombers     |
| 5     | Super Ace       | Mirror player movements  |
| 6     | aircraft carrier (ocean only) | mini gun rapid fire + wave of fighters + homing missing |

### 11. Level / Progression System (`levels`)
Each level is a timed script of enemy waves:
```
Level N = {
  waves: [
    { time: 0,  type: 'scout',  count: 5, formation: 'line' },
    { time: 3,  type: 'zigzag', count: 3, formation: 'v' },
    ...
    { time: 45, type: 'boss',   id: 'heavy_bomber' },
  ],
  background: 'ocean',  // or 'desert', 'mountain', etc.
  music: 'stage1',
}
```
- 5 levels total, looping with increased difficulty (enemy HP ×1.5, speed ×1.2 per loop)
- Transition screen between levels showing score + "STAGE CLEAR"
- Difficulty scaling: more enemies, faster bullets, shorter spawn intervals

### 12. HUD (`hud`)
- **Score**: top-left, with rolling counter animation
- **Lives**: top-left below score (plane icons)
- **Bombs**: bottom-left (bomb icons)
- **Boss HP**: top-center bar (appears during boss fights)
- **Level**: top-right "STAGE 1" indicator
- **FPS**: top-right corner (debug, toggleable)

### 13. Audio System (`audio`)
All procedurally generated via Web Audio API:
- **BGM**: Simple looping chiptune-style melodies per stage (pentatonic scale arpeggios, bass + lead)
- **SFX**:
  - Player shoot (short noise burst)
  - Enemy hit (thud)
  - Enemy explode (noise + decay)
  - Power-up collect (ascending arpeggio)
  - Player death (descending noise)
  - Boss warning alarm
  - Bomb detonation (deep rumble)
  - Level clear fanfare
- Volume controls, mute toggle (M key)

### 14. Game State & Menus (`main`)
State machine:
- **TITLE**: Animated title screen, "PRESS ENTER TO START", high score display
- **PLAYING**: Main game loop
- **PAUSED**: Overlay, resume with ESC/P
- **STAGE_CLEAR**: Score tally, transition
- **GAME_OVER**: Final score, "CONTINUE?" countdown, back to title
- High score saved to `localStorage`

### 15. Polish & Tuning (`polish`)
- Screen shake on explosions
- Flashing enemies when hit
- Player tilt animation on horizontal movement
- Star field / parallax clouds for depth
- Smooth camera (slight lag follow on player)
- Mobile-responsive canvas sizing
- Performance: maintain 60fps with 200+ entities

---

## Dependency Order
```
scaffold → input → background → player → weapons → enemies → collision
    → powerups → particles → boss → levels → hud → audio → menus → polish
```

## Non-Goals (keeping scope tight)
- No multiplayer / co-op
- No save/load mid-game (just high scores)
- No sprite sheet image files (everything procedural)
- No build tools or npm
