(function () {
  const Game = window.Game;

  class Arcade1946 {
    constructor() {
      this.canvas = document.getElementById("game");
      this.ctx = this.canvas.getContext("2d");
      this.width = 0;
      this.height = 0;
      this.dpr = 1;
      this.sprites = Game.Sprites.create();
      this.audio = new Game.AudioManager();
      this.input = new Game.Input(this.canvas);
      this.background = new Game.Background(800, 900);
      this.particles = new Game.ParticleSystem(850);
      this.weapons = new Game.WeaponSystem(this.audio);
      this.powerups = new Game.PowerUpManager(this.audio);
      this.enemies = new Game.EnemyManager(this.sprites);
      this.player = new Game.Player(800, 900, this.sprites.player, this.particles, this.audio);
      this.levels = new Game.LevelDirector();
      this.hud = new Game.HUD();
      this.state = "TITLE";
      this.score = 0;
      this.highScore = Number(localStorage.getItem("1946-high-score") || 0);
      this.stage = 1;
      this.loop = 0;
      this.boss = null;
      this.last = performance.now();
      this.accum = 0;
      this.fps = 60;
      this.fpsTimer = 0;
      this.frames = 0;
      this.shake = 0;
      this.flash = 0;
      this.warningTimer = 0;
      this.stageClearTimer = 0;
      this.stageBonus = 0;
      this.resize();
      window.addEventListener("resize", () => this.resize());
      this.levels.start(this.stage, this);
      requestAnimationFrame((time) => this.loopFrame(time));
    }

    resize() {
      this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      this.width = Math.floor(window.innerWidth);
      this.height = Math.floor(window.innerHeight);
      this.canvas.width = Math.floor(this.width * this.dpr);
      this.canvas.height = Math.floor(this.height * this.dpr);
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.background.create(this.width, this.height);
      if (this.player) {
        this.player.x = Math.max(26, Math.min(this.width - 26, this.player.x || this.width / 2));
        this.player.y = Math.max(58, Math.min(this.height - 32, this.player.y || this.height - 90));
      }
    }

    levelScale() {
      const loop = Math.floor((this.stage - 1) / 6);
      const stageMod = ((this.stage - 1) % 6) * 0.08;
      return {
        hp: 1 + loop * 0.5 + stageMod,
        speed: 1 + loop * 0.2 + stageMod * 0.65,
      };
    }

    targetList() {
      const list = this.enemies.activeItems();
      if (this.boss && this.boss.active) list.push(this.boss.bounds());
      return list;
    }

    addScore(points) {
      this.score += points;
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem("1946-high-score", String(this.highScore));
      }
    }

    newGame() {
      this.state = "PLAYING";
      this.score = 0;
      this.stage = 1;
      this.loop = 0;
      this.boss = null;
      this.stageBonus = 0;
      this.weapons.reset();
      this.enemies.reset();
      this.powerups.reset();
      this.player.reset(this.width, this.height);
      this.levels.start(this.stage, this);
      this.audio.resume();
    }

    spawnBoss() {
      if (this.boss && this.boss.active) return;
      this.boss = new Game.Boss(this.stage, this.sprites, this.levelScale());
    }

    clearStage() {
      if (this.state !== "PLAYING") return;
      this.state = "STAGE_CLEAR";
      this.stageClearTimer = 3.2;
      this.stageBonus = 3000 + this.player.lives * 800 + this.player.bombs * 500;
      this.addScore(this.stageBonus);
      this.audio.play("clear");
      for (const bullet of this.weapons.enemyPool.pool) bullet.active = false;
    }

    nextStage() {
      this.stage += 1;
      this.loop = Math.floor((this.stage - 1) / 6);
      this.boss = null;
      this.enemies.reset();
      this.powerups.reset();
      this.player.invincible = 2;
      this.player.x = this.width / 2;
      this.player.y = this.height - 90;
      this.levels.start(this.stage, this);
      this.state = "PLAYING";
    }

    gameOver() {
      this.state = "GAME_OVER";
      for (const bullet of this.weapons.enemyPool.pool) bullet.active = false;
    }

    handleStateInput() {
      if (this.input.mute) this.audio.toggleMute();
      if (this.input.debug) this.hud.showFps = !this.hud.showFps;
      if (this.state === "TITLE" && this.input.start) this.newGame();
      else if (this.state === "PLAYING" && this.input.pause) this.state = "PAUSED";
      else if (this.state === "PAUSED" && (this.input.pause || this.input.start)) this.state = "PLAYING";
      else if (this.state === "GAME_OVER" && this.input.start) {
        this.state = "TITLE";
        this.levels.start(this.stage, this);
      }
    }

    update(dt) {
      this.input.update();
      this.handleStateInput();
      this.background.update(dt);
      this.audio.update(dt, this.state);
      this.hud.update(dt, this.score);
      this.warningTimer = Math.max(0, this.warningTimer - dt);
      this.flash = Math.max(0, this.flash - dt);
      this.shake = Math.max(0, this.shake - 42 * dt);

      if (this.state === "TITLE") {
        this.particles.update(dt, this.width, this.height);
        this.input.endFrame();
        return;
      }
      if (this.state === "PAUSED" || this.state === "GAME_OVER") {
        this.input.endFrame();
        return;
      }
      if (this.state === "STAGE_CLEAR") {
        this.stageClearTimer -= dt;
        this.player.update(dt, { vector: { x: 0, y: -0.25 }, fire: false, bomb: false }, this.width, this.height, this);
        this.particles.update(dt, this.width, this.height);
        if (this.stageClearTimer <= 0) this.nextStage();
        this.input.endFrame();
        return;
      }

      this.levels.update(dt, this);
      this.player.update(dt, this.input, this.width, this.height, this);
      this.enemies.update(dt, this);
      if (this.boss && this.boss.active) this.boss.update(dt, this);
      this.weapons.update(dt, this.width, this.height, this.targetList());
      this.powerups.update(dt, this.width, this.height, this.player, this);
      this.resolveCollisions();
      this.particles.update(dt, this.width, this.height);
      this.input.endFrame();
    }

    resolveCollisions() {
      const playerBullets = this.weapons.pool.pool;
      for (const bullet of playerBullets) {
        if (!bullet.active) continue;
        const candidates = this.enemies.grid.query(bullet);
        for (const enemy of candidates) {
          if (!enemy.active || !bullet.active) continue;
          if (Game.Collision.aabb(bullet, enemy)) {
            bullet.active = false;
            enemy.takeDamage(bullet.damage, this);
          }
        }
        if (bullet.active && this.boss && this.boss.active && Game.Collision.aabb(bullet, this.boss.bounds())) {
          bullet.active = false;
          this.boss.takeDamage(bullet.damage, this);
        }
      }

      if (!this.player.alive) return;
      const p = this.player.bounds();
      for (const bullet of this.weapons.enemyPool.pool) {
        if (!bullet.active) continue;
        if (Game.Collision.circle(p, bullet)) {
          bullet.active = false;
          this.player.hit(this);
          break;
        }
      }
      for (const enemy of this.enemies.items) {
        if (!enemy.active) continue;
        if (Game.Collision.circle(p, enemy)) {
          enemy.takeDamage(999, this);
          this.player.hit(this);
          break;
        }
      }
      if (this.boss && this.boss.active && Game.Collision.circle(p, this.boss.bounds())) {
        this.player.hit(this);
      }
    }

    draw() {
      const ctx = this.ctx;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, this.width, this.height);
      ctx.save();
      if (this.shake > 0) {
        ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
      }
      this.background.draw(ctx);
      this.powerups.draw(ctx);
      this.enemies.draw(ctx);
      if (this.boss && this.boss.active) this.boss.draw(ctx);
      this.weapons.draw(ctx);
      this.player.draw(ctx);
      this.particles.draw(ctx);
      ctx.restore();
      this.hud.draw(ctx, this);
      this.hud.overlay(ctx, this);
      if (this.flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${Math.min(0.65, this.flash * 2.2)})`;
        ctx.fillRect(0, 0, this.width, this.height);
      }
    }

    loopFrame(time) {
      const rawDt = Math.min(0.05, (time - this.last) / 1000 || 0);
      this.last = time;
      this.update(rawDt);
      this.draw();
      this.frames += 1;
      this.fpsTimer += rawDt;
      if (this.fpsTimer >= 0.5) {
        this.fps = this.frames / this.fpsTimer;
        this.frames = 0;
        this.fpsTimer = 0;
      }
      requestAnimationFrame((next) => this.loopFrame(next));
    }
  }

  window.addEventListener("load", () => {
    window.arcade1946 = new Arcade1946();
  });
})();
