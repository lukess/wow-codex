(function () {
  const Game = (window.Game = window.Game || {});

  class Player {
    constructor(width, height, sprite, particles, audio) {
      this.sprite = sprite;
      this.particles = particles;
      this.audio = audio;
      this.reset(width, height);
    }

    reset(width, height) {
      this.x = width / 2;
      this.y = height - 90;
      this.w = 42;
      this.h = 48;
      this.r = 18;
      this.speed = 310;
      this.lives = 3;
      this.bombs = 2;
      this.invincible = 2;
      this.shield = 0;
      this.tilt = 0;
      this.alive = true;
      this.respawnTimer = 0;
    }

    bounds() {
      return { x: this.x, y: this.y, w: this.w, h: this.h, r: this.r };
    }

    hit(game) {
      if (!this.alive || this.invincible > 0 || this.shield > 0) return false;
      this.lives -= 1;
      game.weapons.downgrade();
      this.alive = false;
      this.respawnTimer = 1.4;
      this.particles.burst(this.x, this.y, 46, "#ff7144", 320);
      this.audio.play("death");
      game.shake = Math.max(game.shake, 18);
      if (this.lives <= 0) game.gameOver();
      return true;
    }

    useBomb(game) {
      if (this.bombs <= 0 || !this.alive) return;
      this.bombs -= 1;
      game.flash = 0.28;
      game.shake = Math.max(game.shake, 24);
      this.audio.play("bomb");
      for (const bullet of game.weapons.enemyPool.pool) bullet.active = false;
      for (const enemy of game.enemies.items) {
        if (!enemy.active) continue;
        enemy.takeDamage(6, game);
      }
      if (game.boss && game.boss.active) game.boss.takeDamage(20, game);
      this.particles.burst(this.x, this.y, 120, "#fff1a8", 520);
    }

    update(dt, input, width, height, game) {
      if (!this.alive) {
        this.respawnTimer -= dt;
        if (this.respawnTimer <= 0 && this.lives > 0) {
          this.alive = true;
          this.x = width / 2;
          this.y = height - 90;
          this.invincible = 2.2;
        }
        return;
      }
      this.invincible = Math.max(0, this.invincible - dt);
      this.shield = Math.max(0, this.shield - dt);
      this.x += input.vector.x * this.speed * dt;
      this.y += input.vector.y * this.speed * dt;
      this.x = Math.max(26, Math.min(width - 26, this.x));
      this.y = Math.max(58, Math.min(height - 32, this.y));
      this.tilt += (input.vector.x - this.tilt) * Math.min(1, dt * 9);
      if (input.fire) game.weapons.shoot(this, game.targetList());
      if (input.bomb) this.useBomb(game);
      if (Math.abs(input.vector.x) > 0.15) {
        this.particles.spawn(this.x - this.tilt * 8, this.y + 28, {
          color: "rgba(205,216,220,0.45)",
          size: 4,
          speed: 20,
          life: 0.28,
          vy: 120,
        });
      }
    }

    draw(ctx) {
      if (!this.alive) return;
      if (this.invincible > 0 && Math.floor(this.invincible * 12) % 2 === 0) return;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.tilt * 0.22);
      ctx.drawImage(this.sprite, -32, -36, 64, 72);
      if (this.shield > 0) {
        ctx.strokeStyle = `rgba(180, 235, 255, ${0.42 + Math.sin(this.shield * 10) * 0.16})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 31, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  Game.Player = Player;
})();
