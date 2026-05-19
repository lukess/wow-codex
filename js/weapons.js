(function () {
  const Game = (window.Game = window.Game || {});

  class BulletPool {
    constructor(max, enemy) {
      this.enemy = !!enemy;
      this.pool = Array.from({ length: max || 260 }, () => ({ active: false }));
    }

    spawn(x, y, vx, vy, damage, opts) {
      const b = this.pool.find((item) => !item.active);
      if (!b) return null;
      opts = opts || {};
      b.active = true;
      b.x = x;
      b.y = y;
      b.vx = vx;
      b.vy = vy;
      b.w = opts.w || (this.enemy ? 9 : 7);
      b.h = opts.h || (this.enemy ? 14 : 18);
      b.r = opts.r || Math.max(b.w, b.h) / 2;
      b.damage = damage || 1;
      b.color = opts.color || (this.enemy ? "#ffb347" : "#9df8ff");
      b.life = opts.life || 3;
      b.homing = opts.homing || false;
      b.turn = opts.turn || 0;
      b.trail = opts.trail || false;
      return b;
    }

    update(dt, width, height, targetList) {
      for (const b of this.pool) {
        if (!b.active) continue;
        b.life -= dt;
        if (b.homing && targetList && targetList.length) {
          let target = null;
          let best = Infinity;
          for (const t of targetList) {
            if (!t.active) continue;
            const d = (t.x - b.x) * (t.x - b.x) + (t.y - b.y) * (t.y - b.y);
            if (d < best) {
              best = d;
              target = t;
            }
          }
          if (target) {
            const speed = Math.hypot(b.vx, b.vy) || 1;
            const desired = Math.atan2(target.y - b.y, target.x - b.x);
            const current = Math.atan2(b.vy, b.vx);
            let diff = desired - current;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            const next = current + Math.max(-b.turn * dt, Math.min(b.turn * dt, diff));
            b.vx = Math.cos(next) * speed;
            b.vy = Math.sin(next) * speed;
          }
        }
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.life <= 0 || b.x < -60 || b.x > width + 60 || b.y < -120 || b.y > height + 120) b.active = false;
      }
    }

    draw(ctx) {
      for (const b of this.pool) {
        if (!b.active) continue;
        ctx.save();
        ctx.translate(b.x, b.y);
        const angle = Math.atan2(b.vy, b.vx) + Math.PI / 2;
        ctx.rotate(angle);
        if (b.trail) {
          const g = ctx.createLinearGradient(0, b.h, 0, -b.h);
          g.addColorStop(0, "rgba(255,255,255,0)");
          g.addColorStop(1, b.color);
          ctx.fillStyle = g;
          ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h * 1.8);
        } else {
          ctx.fillStyle = b.color;
          ctx.shadowColor = b.color;
          ctx.shadowBlur = 8;
          Game.Sprites.roundRect(ctx, -b.w / 2, -b.h / 2, b.w, b.h, Math.min(5, b.w / 2));
          ctx.fill();
        }
        ctx.restore();
      }
    }

    activeItems() {
      return this.pool.filter((b) => b.active);
    }
  }

  class WeaponSystem {
    constructor(audio) {
      this.level = 1;
      this.cooldown = 0;
      this.pool = new BulletPool(360, false);
      this.enemyPool = new BulletPool(420, true);
      this.audio = audio;
    }

    reset() {
      this.level = 1;
      this.cooldown = 0;
      for (const b of this.pool.pool) b.active = false;
      for (const b of this.enemyPool.pool) b.active = false;
    }

    upgrade() {
      this.level = Math.min(6, this.level + 1);
    }

    downgrade() {
      this.level = Math.max(1, this.level - 1);
    }

    shoot(player, targetList) {
      if (this.cooldown > 0 || !player.alive) return;
      const level = this.level;
      const interval = Math.max(0.085, 0.17 - level * 0.012);
      this.cooldown = interval;
      const speed = -620;
      const y = player.y - 28;
      const shots = [];
      if (level === 1) shots.push([0, speed, 0]);
      if (level === 2) shots.push([-12, speed, 0], [12, speed, 0]);
      if (level === 3) shots.push([0, speed, 0], [-15, speed, -90], [15, speed, 90]);
      if (level === 4) shots.push([-12, speed, 0], [12, speed, 0], [-8, 480, -70], [8, 480, 70]);
      if (level >= 5) shots.push([0, speed, 0], [-16, speed, -130], [16, speed, 130], [-26, speed * 0.94, -230], [26, speed * 0.94, 230]);
      if (level >= 6) shots.push([-6, speed * 1.06, -35], [6, speed * 1.06, 35]);
      for (const [ox, vy, vx] of shots) {
        this.pool.spawn(player.x + ox, y, vx, vy, 1, { color: level >= 4 ? "#fff07a" : "#a9f8ff", trail: true });
      }
      if (level >= 5 && Math.random() < (level === 6 ? 0.28 : 0.16)) {
        this.pool.spawn(player.x, player.y - 12, 0, -350, 2, { w: 12, h: 24, color: "#ffdf78", homing: true, turn: 5.5, life: 20, trail: true });
      }
      if (this.audio) this.audio.play("shoot");
    }

    enemyShot(x, y, angle, speed, color) {
      this.enemyPool.spawn(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 1, {
        w: 10,
        h: 10,
        color: color || "#ff9b42",
        life: 4,
      });
    }

    update(dt, width, height, enemies) {
      this.cooldown = Math.max(0, this.cooldown - dt);
      this.pool.update(dt, width, height, enemies);
      this.enemyPool.update(dt, width, height);
    }

    draw(ctx) {
      this.pool.draw(ctx);
      this.enemyPool.draw(ctx);
    }
  }

  Game.BulletPool = BulletPool;
  Game.WeaponSystem = WeaponSystem;
})();
