(function () {
  const Game = (window.Game = window.Game || {});

  const themes = ["ocean", "desert", "mountain", "ocean", "mountain", "ocean"];

  function makeWaves(stage) {
    const advanced = stage >= 3;
    return [
      { time: 1.0, type: "scout", count: 5, formation: "line" },
      { time: 4.2, type: "zigzag", count: 4, formation: "v" },
      { time: 7.4, type: "dive", count: 4, formation: "line" },
      { time: 10.6, type: "tank", count: 3, formation: "line" },
      { time: 14.0, type: "scout", count: 7, formation: "column" },
      { time: 17.2, type: advanced ? "fighter" : "zigzag", count: advanced ? 2 : 5, formation: "v" },
      { time: 21.0, type: "turret", count: 4, formation: "line" },
      { time: 25.0, type: "dive", count: 6, formation: "v" },
      { time: 30.0, type: "fighter", count: stage >= 5 ? 3 : 1, formation: "line" },
      { time: 36.0, type: "boss" },
    ];
  }

  class LevelDirector {
    constructor() {
      this.stage = 1;
      this.time = 0;
      this.index = 0;
      this.waves = makeWaves(1);
      this.warningPlayed = false;
    }

    start(stage, game) {
      this.stage = stage;
      this.time = 0;
      this.index = 0;
      this.waves = makeWaves(stage);
      this.warningPlayed = false;
      game.background.setTheme(themes[(stage - 1) % themes.length]);
      game.audio.setStage(stage);
    }

    update(dt, game) {
      this.time += dt;
      const bossWave = this.waves.find((w) => w.type === "boss");
      if (bossWave && !this.warningPlayed && this.time > bossWave.time - 2.0) {
        this.warningPlayed = true;
        game.warningTimer = 2.0;
        game.audio.play("warning");
      }
      while (this.index < this.waves.length && this.time >= this.waves[this.index].time) {
        const wave = this.waves[this.index++];
        if (wave.type === "boss") {
          game.spawnBoss();
        } else {
          game.enemies.spawnFormation(wave.type, wave.count, wave.formation, game);
        }
      }
    }
  }

  Game.LevelDirector = LevelDirector;
})();
