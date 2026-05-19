(function () {
  const Game = (window.Game = window.Game || {});

  function makeCanvas(width, height, draw) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    draw(ctx, width, height);
    return canvas;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawPlane(ctx, w, h, palette, enemy) {
    ctx.save();
    ctx.translate(w / 2, h / 2);
    if (enemy) ctx.rotate(Math.PI);
    const body = ctx.createLinearGradient(0, -h * 0.42, 0, h * 0.4);
    body.addColorStop(0, palette.light);
    body.addColorStop(0.48, palette.mid);
    body.addColorStop(1, palette.dark);
    ctx.fillStyle = body;
    ctx.strokeStyle = palette.stroke;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, -h * 0.46);
    ctx.bezierCurveTo(w * 0.14, -h * 0.32, w * 0.15, h * 0.12, w * 0.07, h * 0.42);
    ctx.lineTo(-w * 0.07, h * 0.42);
    ctx.bezierCurveTo(-w * 0.15, h * 0.12, -w * 0.14, -h * 0.32, 0, -h * 0.46);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = palette.wing;
    ctx.beginPath();
    ctx.moveTo(-w * 0.08, -h * 0.04);
    ctx.lineTo(-w * 0.46, h * 0.17);
    ctx.lineTo(-w * 0.24, h * 0.31);
    ctx.lineTo(-w * 0.04, h * 0.16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.08, -h * 0.04);
    ctx.lineTo(w * 0.46, h * 0.17);
    ctx.lineTo(w * 0.24, h * 0.31);
    ctx.lineTo(w * 0.04, h * 0.16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = palette.tail;
    ctx.fillRect(-w * 0.22, h * 0.29, w * 0.16, h * 0.16);
    ctx.fillRect(w * 0.06, h * 0.29, w * 0.16, h * 0.16);
    ctx.fillStyle = palette.glass;
    roundRect(ctx, -w * 0.07, -h * 0.24, w * 0.14, h * 0.23, 6);
    ctx.fill();
    ctx.restore();
  }

  function drawTank(ctx, w, h) {
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.fillStyle = "#344b35";
    roundRect(ctx, -w * 0.28, -h * 0.32, w * 0.56, h * 0.64, 7);
    ctx.fill();
    ctx.strokeStyle = "#172117";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#5d7e4c";
    roundRect(ctx, -w * 0.18, -h * 0.18, w * 0.36, h * 0.34, 8);
    ctx.fill();
    ctx.fillStyle = "#1d2a1d";
    ctx.fillRect(-w * 0.04, -h * 0.54, w * 0.08, h * 0.42);
    ctx.restore();
  }

  function drawBoss(ctx, w, h, colors) {
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.fillStyle = colors.shadow;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.ellipse(0, h * 0.08, w * 0.42, h * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = colors.wing;
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-w * 0.08, -h * 0.16);
    ctx.lineTo(-w * 0.48, h * 0.06);
    ctx.lineTo(-w * 0.38, h * 0.23);
    ctx.lineTo(-w * 0.06, h * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.08, -h * 0.16);
    ctx.lineTo(w * 0.48, h * 0.06);
    ctx.lineTo(w * 0.38, h * 0.23);
    ctx.lineTo(w * 0.06, h * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = colors.body;
    roundRect(ctx, -w * 0.14, -h * 0.46, w * 0.28, h * 0.82, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = colors.glass;
    roundRect(ctx, -w * 0.08, -h * 0.28, w * 0.16, h * 0.18, 10);
    ctx.fill();
    ctx.fillStyle = colors.turret;
    for (const x of [-0.26, 0.26]) {
      ctx.beginPath();
      ctx.arc(w * x, -h * 0.02, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(w * x - 4, -h * 0.14, 8, h * 0.15);
    }
    ctx.restore();
  }

  const playerPalette = {
    light: "#e8f4ff",
    mid: "#6db7da",
    dark: "#244a79",
    wing: "#3c7fa6",
    tail: "#e04338",
    glass: "#17263f",
    stroke: "#0c1524",
  };

  const enemyPalettes = {
    scout: { light: "#ffd7a6", mid: "#c1583e", dark: "#64242d", wing: "#9d3335", tail: "#d99b47", glass: "#1f1824", stroke: "#130c10" },
    zigzag: { light: "#f7ffa9", mid: "#a8b749", dark: "#566029", wing: "#82923a", tail: "#d95f3d", glass: "#222812", stroke: "#101207" },
    dive: { light: "#ffd0dc", mid: "#c03d79", dark: "#5c1d4b", wing: "#8d2c63", tail: "#eaa64e", glass: "#25152b", stroke: "#130912" },
    fighter: { light: "#e6d4ff", mid: "#7d65c8", dark: "#332b65", wing: "#5a499e", tail: "#e04d4d", glass: "#111733", stroke: "#090817" },
  };

  Game.Sprites = {
    makeCanvas,
    roundRect,
    create() {
      return {
        player: makeCanvas(64, 72, (ctx, w, h) => drawPlane(ctx, w, h, playerPalette, false)),
        scout: makeCanvas(46, 52, (ctx, w, h) => drawPlane(ctx, w, h, enemyPalettes.scout, true)),
        zigzag: makeCanvas(50, 54, (ctx, w, h) => drawPlane(ctx, w, h, enemyPalettes.zigzag, true)),
        dive: makeCanvas(54, 58, (ctx, w, h) => drawPlane(ctx, w, h, enemyPalettes.dive, true)),
        fighter: makeCanvas(60, 66, (ctx, w, h) => drawPlane(ctx, w, h, enemyPalettes.fighter, true)),
        tank: makeCanvas(58, 62, drawTank),
        bossBomber: makeCanvas(190, 150, (ctx, w, h) => drawBoss(ctx, w, h, { body: "#5f6875", wing: "#36465c", glass: "#182238", turret: "#222a34", stroke: "#10151d", shadow: "#000" })),
        bossTwin: makeCanvas(210, 155, (ctx, w, h) => drawBoss(ctx, w, h, { body: "#6b534d", wing: "#493833", glass: "#1c202c", turret: "#251e1d", stroke: "#16100f", shadow: "#000" })),
        bossFortress: makeCanvas(230, 165, (ctx, w, h) => drawBoss(ctx, w, h, { body: "#596f5c", wing: "#344f3a", glass: "#162b26", turret: "#1e3024", stroke: "#111c14", shadow: "#000" })),
        bossCarrier: makeCanvas(250, 120, (ctx, w, h) => {
          ctx.fillStyle = "#394a52";
          ctx.strokeStyle = "#11191d";
          ctx.lineWidth = 4;
          roundRect(ctx, 18, 20, w - 36, h - 40, 16);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#536a73";
          ctx.fillRect(42, 42, w - 84, 16);
          ctx.fillRect(42, 66, w - 84, 12);
          ctx.fillStyle = "#202b31";
          roundRect(ctx, w * 0.64, 32, 46, 46, 8);
          ctx.fill();
        }),
        bossAce: makeCanvas(170, 190, (ctx, w, h) => drawBoss(ctx, w, h, { body: "#705a9b", wing: "#3e376f", glass: "#0f1831", turret: "#1c1730", stroke: "#0d0a17", shadow: "#000" })),
      };
    },
  };
})();
