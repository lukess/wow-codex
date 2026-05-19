(function () {
  const Game = (window.Game = window.Game || {});

  const TYPES = {
    scout: { hp: 1, points: 100, speed: 180, sprite: "scout", w: 34, h: 38, drop: 0.14 },
    zigzag: { hp: 1, points: 150, speed: 135, sprite: "zigzag", w: 38, h: 40, drop: 0.18 },
    dive: { hp: 2, points: 200, speed: 145, sprite: "dive", w: 40, h: 42, drop: 0.2 },
    tank: { hp: 4, points: 300, speed: 72, sprite: "tank", w: 44, h: 46, drop: 0.26 },
    turret: { hp: 3, points: 250, speed: 64, sprite: "tank", w: 38, h: 42, drop: 0.21 },
    fighter: { hp: 10, points: 1000, speed: 122, sprite: "fighter", w: 46, h: 50, drop: 0.65 },
  };

  class Enemy {
    constructor(type, x, y, levelScale, sprites) {
      const cfg = TYPES[type] || TYPES.scout;
      this.type = type;
      this.cfg = cfg;
      this.active = true;
      this.x = x;
      this.y = y;
      this.startX = x;
      this.startY = y;
      this.w = cfg.w;
      this.h = cfg.h;
      this.r = Math.max(cfg.w, cfg.h) * 0.42;
      this.hp = Math.ceil(cfg.hp * levelScale.hp);
      this.maxHp = this.hp;
      this.points = cfg.points;
      this.speed = cfg.speed * levelScale.speed;
      this.sprite = sprites[cfg.sprite];
      this.age = 0;
      this.fireTimer = 0.8 + Math.random() * 1.2;
      this.flash = 0;
      this.angle = Math.random() * Math.PI * 2;
    }

    takeDamage(amount, game) {
      if (!this.active) return;
      this.hp -= amount;
      this.flash = 0.08;
      game.particles.spawn(this.x, this.y, { color: "#fff6b0", size: 3, speed: 70, life: 0.16 });
      if (this.hp <= 0) {
        this.active = false;
        game.addScore(this.points);
        game.particles.burst(this.x, this.y, this.type === "fighter" ? 34 : 18, "#ff7538", this.type === "fighter" ? 290 : 190);
        game.powerups.drop(this.x, this.y, this.cfg.drop);
        game.audio.play("explode");
        game.shake = Math.max(game.shake, this.type === "fighter" ? 9 : 4);
      } else {
        game.audio.play("hit");
      }
    }

    update(dt, game) {
      this.age += dt;
      this.flash = Math.max(0, this.flash - dt);
      const player = game.player;
      if (this.type === "scout") {
        this.y += this.speed * dt;
      } else if (this.type === "zigzag") {
        this.y += this.speed * dt;
        this.x = this.startX + Math.sin(this.age * 4.2) * 76;
      } else if (this.type === "dive") {
        const dx = player.x - this.x;
        this.x += Math.sign(dx) * Math.min(Math.abs(dx), this.speed * 0.6 * dt);
        this.y += (this.speed + this.age * 40) * dt;
      } else if (this.type === "tank" || this.type === "turret") {
        this.y += this.speed * dt;
        this.fireTimer -= dt;
        if (this.fireTimer <= 0 && this.y > 20 && this.y < game.height - 80) {
          this.fireTimer = this.type === "turret" ? 1.15 : 1.55;
          const angle = Math.atan2(player.y - this.y, player.x - this.x);
          game.weapons.enemyShot(this.x, this.y + 16, angle, 220 + game.loop * 20);
        }
      } else if (this.type === "fighter") {
        const desired = player.x + Math.sin(this.age * 2.3) * 110;
        this.x += (desired - this.x) * Math.min(1, dt * 1.9);
        this.y += (this.y < 150 ? this.speed : 42) * dt;
        this.x += Math.sin(this.age * 5.5) * 70 * dt;
        this.fireTimer -= dt;
        if (this.fireTimer <= 0) {
          this.fireTimer = 0.55;
          const base = Math.atan2(player.y - this.y, player.x - this.x);
          game.weapons.enemyShot(this.x - 12, this.y + 20, base - 0.12, 255, "#ff6f7c");
          game.weapons.enemyShot(this.x + 12, this.y + 20, base + 0.12, 255, "#ff6f7c");
        }
      }
      if (this.maxHp > 3 && Math.random() < dt * 1.5) game.particles.smoke(this.x, this.y + this.h / 2, 1);
      if (this.y > game.height + 80 || this.x < -120 || this.x > game.width + 120) this.active = false;
    }

    draw(ctx) {
      if (!this.active) return;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.drawImage(this.sprite, -this.w / 2 - 6, -this.h / 2 - 7, this.w + 12, this.h + 14);
      if (this.flash > 0) {
        ctx.globalCompositeOperation = "source-atop";
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.fillRect(-this.w / 2 - 6, -this.h / 2 - 7, this.w + 12, this.h + 14);
      }
      ctx.restore();
    }
  }

  class EnemyManager {
    constructor(sprites) {
      this.sprites = sprites;
      this.items = [];
      this.grid = new Game.Collision.SpatialGrid(96);
    }

    reset() {
      this.items.length = 0;
      this.grid.clear();
    }

    spawn(type, x, y, levelScale) {
      this.items.push(new Enemy(type, x, y, levelScale, this.sprites));
    }

    spawnFormation(type, count, formation, game) {
      const spacing = 48;
      const center = game.width * (0.18 + Math.random() * 0.64);
      const y = -40;
      for (let i = 0; i < count; i++) {
        let x = center + (i - (count - 1) / 2) * spacing;
        let yy = y - i * 24;
        if (formation === "v") {
          const side = i % 2 === 0 ? -1 : 1;
          const rank = Math.ceil(i / 2);
          x = center + side * rank * spacing;
          yy = y - rank * 22;
        }
        if (formation === "column") {
          x = center;
          yy = y - i * 50;
        }
        this.spawn(type, x, yy, game.levelScale());
      }
    }

    update(dt, game) {
      this.grid.clear();
      for (const enemy of this.items) {
        if (!enemy.active) continue;
        enemy.update(dt, game);
        if (enemy.active) this.grid.insert(enemy);
      }
      this.items = this.items.filter((enemy) => enemy.active);
    }

    draw(ctx) {
      for (const enemy of this.items) enemy.draw(ctx);
    }

    activeItems() {
      return this.items.filter((enemy) => enemy.active);
    }
  }

  Game.EnemyManager = EnemyManager;
})();
