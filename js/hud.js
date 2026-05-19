(function () {
  const Game = (window.Game = window.Game || {});

  class HUD {
    constructor() {
      this.displayScore = 0;
      this.showFps = false;
    }

    update(dt, score) {
      this.displayScore += (score - this.displayScore) * Math.min(1, dt * 8);
    }

    drawBar(ctx, x, y, w, h, pct, color) {
      ctx.fillStyle = "rgba(4, 8, 14, 0.58)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      ctx.fillStyle = color;
      ctx.fillRect(x + 3, y + 3, Math.max(0, (w - 6) * pct), h - 6);
    }

    draw(ctx, game) {
      ctx.save();
      ctx.font = "700 18px Trebuchet MS, sans-serif";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#f8fbff";
      ctx.shadowColor = "#00111f";
      ctx.shadowBlur = 4;
      ctx.fillText(`SCORE ${Math.round(this.displayScore).toString().padStart(7, "0")}`, 18, 14);
      ctx.fillText(`STAGE ${game.stage}`, game.width - 112, 14);
      ctx.font = "700 15px Trebuchet MS, sans-serif";
      ctx.fillText(`BOMBS ${game.player.bombs}`, 18, game.height - 34);
      ctx.fillText(`POWER ${game.weapons.level}`, 118, game.height - 34);
      for (let i = 0; i < Math.max(0, game.player.lives); i++) {
        ctx.drawImage(game.sprites.player, 18 + i * 24, 42, 20, 22);
      }
      if (game.boss && game.boss.active) {
        const bw = Math.min(360, game.width - 80);
        this.drawBar(ctx, (game.width - bw) / 2, 18, bw, 16, game.boss.hp / game.boss.maxHp, "#f04f45");
        ctx.font = "700 12px Trebuchet MS, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#fff";
        ctx.fillText(game.boss.name.toUpperCase(), game.width / 2, 38);
        ctx.textAlign = "left";
      }
      if (this.showFps) {
        ctx.fillStyle = "#b9e6ff";
        ctx.fillText(`FPS ${game.fps.toFixed(0)}`, game.width - 78, 40);
      }
      ctx.restore();
    }

    overlay(ctx, game) {
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (game.warningTimer > 0) {
        ctx.font = "900 48px Trebuchet MS, sans-serif";
        ctx.fillStyle = Math.floor(game.warningTimer * 8) % 2 ? "#ffdf5f" : "#ff4a3d";
        ctx.fillText("WARNING!", game.width / 2, game.height * 0.34);
      }
      if (game.state === "TITLE") {
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(0, 0, game.width, game.height);
        ctx.fillStyle = "#f8fbff";
        ctx.font = "900 68px Trebuchet MS, sans-serif";
        ctx.fillText("1946", game.width / 2, game.height * 0.34);
        ctx.font = "700 22px Trebuchet MS, sans-serif";
        ctx.fillText("PRESS ENTER OR FIRE", game.width / 2, game.height * 0.48);
        ctx.font = "600 15px Trebuchet MS, sans-serif";
        ctx.fillText("ARROWS/WASD MOVE   SPACE/J FIRE   B/K BOMB   P PAUSE   M MUTE", game.width / 2, game.height * 0.58);
        ctx.fillText(`HIGH SCORE ${game.highScore.toString().padStart(7, "0")}`, game.width / 2, game.height * 0.66);
      }
      if (game.state === "PAUSED") {
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(0, 0, game.width, game.height);
        ctx.fillStyle = "#fff";
        ctx.font = "900 44px Trebuchet MS, sans-serif";
        ctx.fillText("PAUSED", game.width / 2, game.height / 2);
      }
      if (game.state === "STAGE_CLEAR") {
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(0, 0, game.width, game.height);
        ctx.fillStyle = "#fff";
        ctx.font = "900 42px Trebuchet MS, sans-serif";
        ctx.fillText("STAGE CLEAR", game.width / 2, game.height * 0.45);
        ctx.font = "700 20px Trebuchet MS, sans-serif";
        ctx.fillText(`BONUS ${game.stageBonus}`, game.width / 2, game.height * 0.54);
      }
      if (game.state === "GAME_OVER") {
        ctx.fillStyle = "rgba(0,0,0,0.54)";
        ctx.fillRect(0, 0, game.width, game.height);
        ctx.fillStyle = "#fff";
        ctx.font = "900 48px Trebuchet MS, sans-serif";
        ctx.fillText("GAME OVER", game.width / 2, game.height * 0.42);
        ctx.font = "700 19px Trebuchet MS, sans-serif";
        ctx.fillText(`FINAL SCORE ${game.score.toString().padStart(7, "0")}`, game.width / 2, game.height * 0.52);
        ctx.fillText("PRESS ENTER TO RETURN", game.width / 2, game.height * 0.62);
      }
      ctx.restore();
    }
  }

  Game.HUD = HUD;
})();
