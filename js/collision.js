(function () {
  const Game = (window.Game = window.Game || {});

  function aabb(a, b) {
    return a.x - a.w / 2 < b.x + b.w / 2 &&
      a.x + a.w / 2 > b.x - b.w / 2 &&
      a.y - a.h / 2 < b.y + b.h / 2 &&
      a.y + a.h / 2 > b.y - b.h / 2;
  }

  function circle(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const r = a.r + b.r;
    return dx * dx + dy * dy <= r * r;
  }

  class SpatialGrid {
    constructor(cellSize) {
      this.cellSize = cellSize || 96;
      this.cells = new Map();
    }

    clear() {
      this.cells.clear();
    }

    key(x, y) {
      return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
    }

    insert(obj) {
      const minX = Math.floor((obj.x - obj.w / 2) / this.cellSize);
      const maxX = Math.floor((obj.x + obj.w / 2) / this.cellSize);
      const minY = Math.floor((obj.y - obj.h / 2) / this.cellSize);
      const maxY = Math.floor((obj.y + obj.h / 2) / this.cellSize);
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const key = `${x},${y}`;
          if (!this.cells.has(key)) this.cells.set(key, []);
          this.cells.get(key).push(obj);
        }
      }
    }

    query(obj) {
      const found = new Set();
      const minX = Math.floor((obj.x - obj.w / 2) / this.cellSize);
      const maxX = Math.floor((obj.x + obj.w / 2) / this.cellSize);
      const minY = Math.floor((obj.y - obj.h / 2) / this.cellSize);
      const maxY = Math.floor((obj.y + obj.h / 2) / this.cellSize);
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const cell = this.cells.get(`${x},${y}`);
          if (cell) cell.forEach((item) => found.add(item));
        }
      }
      return found;
    }
  }

  Game.Collision = { aabb, circle, SpatialGrid };
})();
