(function () {
  const Game = (window.Game = window.Game || {});

  class ParticleSystem {
    constructor(max) {
      this.pool = Array.from({ length: max || 700 }, () => ({ active: false }));
    }

    spawn(x, y, opts) {
      const p = this.pool.find((item) => !item.active);
      if (!p) return;
      const angle = opts.angle == null ? Math.random() * Math.PI * 2 : opts.angle;
      const speed = opts.speed == null ? Math.random() * 150 + 40 : opts.speed;
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed + (opts.vx || 0);
      p.vy = Math.sin(angle) * speed + (opts.vy || 0);
      p.life = opts.life || 0.6;
      p.maxLife = p.life;
      p.size = opts.size || 4;
      p.grow = opts.grow || 0;
      p.color = opts.color || "#ffb14a";
      p.gravity = opts.gravity || 0;
    }

    burst(x, y, count, color, power) {
      for (let i = 0; i < count; i++) {
        this.spawn(x, y, {
          color: i % 3 === 0 ? "#fff1ad" : color || "#ff6b2d",
          size: Math.random() * 5 + 2,
          speed: Math.random() * (power || 210) + 35,
          life: Math.random() * 0.55 + 0.28,
          gravity: 50,
        });
      }
    }

    smoke(x, y, count) {
      for (let i = 0; i < count; i++) {
        this.spawn(x, y, {
          color: "rgba(70,75,82,0.7)",
          size: Math.random() * 8 + 5,
          speed: Math.random() * 35,
          life: Math.random() * 0.8 + 0.6,
          grow: 14,
          vy: 35,
        });
      }
    }

    update(dt, width, height) {
      for (const p of this.pool) {
        if (!p.active) continue;
        p.life -= dt;
        if (p.life <= 0) {
          p.active = false;
          continue;
        }
        p.vy += p.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.size += p.grow * dt;
        if (p.x < -80 || p.x > width + 80 || p.y < -100 || p.y > height + 120) p.active = false;
      }
    }

    draw(ctx) {
      for (const p of this.pool) {
        if (!p.active) continue;
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  Game.ParticleSystem = ParticleSystem;
})();
