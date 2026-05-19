(function () {
  const Game = (window.Game = window.Game || {});

  class Background {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.theme = "ocean";
      this.layers = [];
      this.stars = [];
      this.create(width, height);
    }

    create(width, height) {
      this.width = width;
      this.height = height;
      this.layers = [
        this.makeBase(width, height),
        this.makeIslands(width, height),
        this.makeClouds(width, height),
      ];
      this.stars = Array.from({ length: 80 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.4 + 0.3,
        s: Math.random() * 40 + 20,
      }));
    }

    setTheme(theme) {
      this.theme = theme || "ocean";
      this.create(this.width, this.height);
    }

    makeBase(width, height) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      const g = ctx.createLinearGradient(0, 0, 0, height);
      if (this.theme === "desert") {
        g.addColorStop(0, "#8b7a4d");
        g.addColorStop(1, "#d0a85e");
      } else if (this.theme === "mountain") {
        g.addColorStop(0, "#26364a");
        g.addColorStop(1, "#50667e");
      } else {
        g.addColorStop(0, "#0d4f77");
        g.addColorStop(1, "#08314f");
      }
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 0.22;
      for (let y = 0; y < height; y += 28) {
        ctx.fillStyle = y % 56 === 0 ? "#ffffff" : "#061729";
        ctx.fillRect(0, y, width, 2);
      }
      return { canvas, y: 0, speed: 38 };
    }

    makeIslands(width, height) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      for (let i = 0; i < 9; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const rx = 36 + Math.random() * 70;
        const ry = 24 + Math.random() * 48;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.random() * Math.PI);
        ctx.fillStyle = this.theme === "desert" ? "#685537" : this.theme === "mountain" ? "#263226" : "#2e6a45";
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.theme === "desert" ? "#b99054" : "#8aa15a";
        ctx.globalAlpha = 0.65;
        ctx.beginPath();
        ctx.ellipse(-rx * 0.1, -ry * 0.1, rx * 0.6, ry * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      return { canvas, y: 0, speed: 78 };
    }

    makeClouds(width, height) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      for (let i = 0; i < 18; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const r = 18 + Math.random() * 34;
        ctx.fillStyle = "rgba(255,255,255,0.22)";
        for (let j = 0; j < 4; j++) {
          ctx.beginPath();
          ctx.ellipse(x + j * r * 0.45, y + Math.sin(j) * 8, r * (0.8 + Math.random() * 0.5), r * 0.42, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      return { canvas, y: 0, speed: 126 };
    }

    update(dt) {
      for (const layer of this.layers) {
        layer.y = (layer.y + layer.speed * dt) % this.height;
      }
      for (const star of this.stars) {
        star.y += star.s * dt;
        if (star.y > this.height) {
          star.y = 0;
          star.x = Math.random() * this.width;
        }
      }
    }

    draw(ctx) {
      for (const layer of this.layers) {
        const y = layer.y;
        ctx.drawImage(layer.canvas, 0, y - this.height, this.width, this.height);
        ctx.drawImage(layer.canvas, 0, y, this.width, this.height);
      }
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      for (const star of this.stars) {
        ctx.globalAlpha = 0.16 + star.r * 0.18;
        ctx.fillRect(star.x, star.y, star.r, star.r);
      }
      ctx.globalAlpha = 1;
    }
  }

  Game.Background = Background;
})();
