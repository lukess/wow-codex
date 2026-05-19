(function () {
  const Game = (window.Game = window.Game || {});

  const BOSSES = [
    { id: "heavy_bomber", name: "Heavy Bomber", sprite: "bossBomber", hp: 150 },
    { id: "twin_engine", name: "Twin Engine", sprite: "bossTwin", hp: 190 },
    { id: "flying_fortress", name: "Flying Fortress", sprite: "bossFortress", hp: 230 },
    { id: "carrier_ship", name: "Carrier Ship", sprite: "bossCarrier", hp: 260 },
    { id: "super_ace", name: "Super Ace", sprite: "bossAce", hp: 220 },
    { id: "ocean_carrier", name: "Ocean Carrier", sprite: "bossCarrier", hp: 320 },
  ];

  class Boss {
    constructor(level, sprites, scale) {
      const cfg = BOSSES[(level - 1) % BOSSES.length];
      this.cfg = cfg;
      this.active = true;
      this.name = cfg.name;
      this.sprite = sprites[cfg.sprite];
      this.x = 0;
      this.y = -140;
      this.w = cfg.sprite === "bossCarrier" ? 210 : 170;
      this.h = cfg.sprite === "bossCarrier" ? 104 : 135;
      this.r = Math.max(this.w, this.h) * 0.38;
      this.hp = Math.ceil(cfg.hp * scale.hp);
      this.maxHp = this.hp;
      this.age = 0;
      this.fireTimer = 0.8;
      this.patternTimer = 0;
      this.flash = 0;
      this.entered = false;
      this.phase = 1;
    }

    takeDamage(amount, game) {
      if (!this.active) return;
      this.hp -= amount;
      this.flash = 0.08;
      game.particles.spawn(this.x, this.y, { color: "#fff6b0", size: 4, speed: 90, life: 0.18 });
      if (this.hp <= 0) this.defeat(game);
      else game.audio.play("hit");
    }

    defeat(game) {
      this.active = false;
      game.addScore(10000 + game.stage * 2000);
      game.particles.burst(this.x, this.y, 130, "#ff7438", 420);
      game.audio.play("explode");
      game.shake = 28;
      game.clearStage();
    }

    update(dt, game) {
      this.age += dt;
      this.flash = Math.max(0, this.flash - dt);
      if (!this.entered) {
        this.x = game.width / 2;
        this.y += 58 * dt;
        if (this.y >= 118) {
          this.y = 118;
          this.entered = true;
        }
        return;
      }
      this.phase = this.hp < this.maxHp * 0.33 ? 3 : this.hp < this.maxHp * 0.66 ? 2 : 1;
      const player = game.player;
      if (this.cfg.id === "super_ace") {
        this.x += (player.x - this.x) * Math.min(1, dt * 1.3);
      } else {
        this.x = game.width / 2 + Math.sin(this.age * (0.7 + this.phase * 0.2)) * Math.min(170, game.width * 0.26);
      }
      this.fireTimer -= dt;
      if (this.fireTimer <= 0) {
        this.attack(game);
      }
      if (this.phase === 3 && Math.random() < dt * 4) game.particles.smoke(this.x + (Math.random() - 0.5) * this.w, this.y + Math.random() * this.h * 0.4, 1);
    }

    attack(game) {
      const player = game.player;
      const base = Math.atan2(player.y - this.y, player.x - this.x);
      if (this.phase === 1) {
        this.fireTimer = 0.7;
        for (const off of [-0.18, 0, 0.18]) game.weapons.enemyShot(this.x, this.y + this.h * 0.28, base + off, 250, "#ffcb6e");
      } else if (this.phase === 2) {
        this.fireTimer = 0.48;
        for (let i = 0; i < 9; i++) {
          const angle = Math.PI * 0.25 + (i / 8) * Math.PI * 0.5 + Math.sin(this.age * 2) * 0.18;
          game.weapons.enemyShot(this.x, this.y + 30, angle, 210, "#ff765f");
        }
      } else {
        this.fireTimer = 0.36;
        for (let i = 0; i < 12; i++) {
          const angle = (Math.PI * 2 * i) / 12 + this.age * 0.8;
          if (Math.sin(angle) > -0.15) game.weapons.enemyShot(this.x, this.y, angle, 190, "#d7a1ff");
        }
        if (Math.random() < 0.34) {
          const type = Math.random() < 0.5 ? "scout" : "zigzag";
          game.enemies.spawn(type, this.x + (Math.random() - 0.5) * this.w, this.y + 20, game.levelScale());
        }
      }
    }

    draw(ctx) {
      if (!this.active) return;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.drawImage(this.sprite, -this.w / 2, -this.h / 2, this.w, this.h);
      if (this.flash > 0) {
        ctx.globalCompositeOperation = "source-atop";
        ctx.fillStyle = "rgba(255,255,255,0.72)";
        ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
      }
      ctx.restore();
    }

    bounds() {
      return { x: this.x, y: this.y, w: this.w, h: this.h, r: this.r, active: this.active };
    }
  }

  Game.Boss = Boss;
})();
