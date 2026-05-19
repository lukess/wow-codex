(function () {
  const Game = (window.Game = window.Game || {});

  const CONFIG = {
    weapon: { label: "W", color: "#8fffb2" },
    bomb: { label: "B", color: "#ffe66b" },
    health: { label: "H", color: "#ff8c9a" },
    score: { label: "S", color: "#9ec5ff" },
    shield: { label: "O", color: "#caa8ff" },
  };

  class PowerUpManager {
    constructor(audio) {
      this.items = [];
      this.audio = audio;
    }

    reset() {
      this.items.length = 0;
    }

    drop(x, y, odds) {
      const roll = Math.random();
      const chance = odds == null ? 0.22 : odds;
      if (roll > chance) return;
      const typeRoll = Math.random();
      let type = "weapon";
      if (typeRoll > 0.42) type = "score";
      if (typeRoll > 0.68) type = "bomb";
      if (typeRoll > 0.86) type = "shield";
      if (typeRoll > 0.96) type = "health";
      this.items.push({
        active: true,
        type,
        x,
        y,
        w: 30,
        h: 30,
        r: 15,
        vx: (Math.random() - 0.5) * 60,
        vy: 82,
        age: 0,
        ttl: 8,
      });
    }

    update(dt, width, height, player, game) {
      for (const p of this.items) {
        if (!p.active) continue;
        p.age += dt;
        p.x += Math.sin(p.age * 3.2) * 28 * dt + p.vx * dt;
        p.y += p.vy * dt;
        if (p.age > p.ttl || p.y > height + 40) p.active = false;
        if (p.active && Game.Collision.aabb(player.bounds(), p)) {
          p.active = false;
          this.apply(p.type, player, game);
        }
      }
      this.items = this.items.filter((p) => p.active);
    }

    apply(type, player, game) {
      if (type === "weapon") game.weapons.upgrade();
      if (type === "bomb") player.bombs = Math.min(9, player.bombs + 1);
      if (type === "health") player.lives = Math.min(7, player.lives + 1);
      if (type === "score") game.addScore(1000);
      if (type === "shield") player.shield = Math.max(player.shield, 6);
      if (this.audio) this.audio.play("power");
    }

    draw(ctx) {
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "700 16px Trebuchet MS, sans-serif";
      for (const p of this.items) {
        const cfg = CONFIG[p.type];
        const blink = p.ttl - p.age < 2 && Math.floor(p.age * 12) % 2 === 0;
        if (blink) continue;
        ctx.fillStyle = cfg.color;
        ctx.shadowColor = cfg.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 15 + Math.sin(p.age * 8) * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#101522";
        ctx.fillText(cfg.label, p.x, p.y + 1);
      }
      ctx.restore();
    }
  }

  Game.PowerUpManager = PowerUpManager;
})();
