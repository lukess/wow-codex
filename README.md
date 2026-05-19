# 1946 Arcade

A classic vertical-scrolling arcade shooter built with vanilla JavaScript and HTML5 Canvas. Fly through procedural skies, fight enemy waves, collect power-ups, survive boss battles, and chase a high score.

This project started from an implementation plan created by my son and me, then co-created into a playable browser game.

## Play

Open `index.html` in a browser, or serve the folder locally:

```sh
python3 -m http.server 4173
```

Then visit:

```text
http://127.0.0.1:4173/
```

## Controls

- Move: Arrow keys or WASD
- Fire: Space or J
- Bomb: B or K
- Pause: P or Escape
- Mute: M
- Start: Enter or Fire

Touch controls are available on mobile and tablet screens.

## Features

- Procedural player, enemy, boss, background, and effect artwork
- Procedural Web Audio music and sound effects
- Multiple enemy behaviors including scouts, zigzags, dive attackers, turrets, tanks, and fighters
- Weapon upgrades from single-shot to spread fire and homing missiles
- Power-ups for weapons, bombs, health, score, and shields
- Boss fights with multi-phase attack patterns
- Particle explosions, smoke, screen shake, warning flashes, and stage clear transitions
- High score saved in `localStorage`
- No build tools, frameworks, or external assets required

## Project Structure

```text
1946/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── audio.js
│   ├── background.js
│   ├── boss.js
│   ├── collision.js
│   ├── enemies.js
│   ├── hud.js
│   ├── input.js
│   ├── levels.js
│   ├── main.js
│   ├── particles.js
│   ├── player.js
│   ├── powerups.js
│   ├── sprites.js
│   └── weapons.js
└── plan.md
```

## Development

The game is intentionally simple to run and inspect:

- No package manager
- No bundler
- No generated build output
- Each game system lives in its own JavaScript file

For quick syntax checks:

```sh
node --check js/main.js
```

Repeat for any file you edit.

## Credits

Game concept and implementation plan: my son and me.  
Implementation: co-created with Codex.
