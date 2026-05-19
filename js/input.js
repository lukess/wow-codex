(function () {
  const Game = (window.Game = window.Game || {});

  class Input {
    constructor(canvas) {
      this.canvas = canvas;
      this.keys = new Set();
      this.pressed = new Set();
      this.vector = { x: 0, y: 0 };
      this.fire = false;
      this.bomb = false;
      this.pause = false;
      this.start = false;
      this.mute = false;
      this.debug = false;
      this.stickPointer = null;
      this.stickBase = null;
      this.stickKnob = document.querySelector("#touch-stick span");
      this.bind();
    }

    bind() {
      window.addEventListener("keydown", (e) => {
        const code = e.code;
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(code)) e.preventDefault();
        if (!this.keys.has(code)) this.pressed.add(code);
        this.keys.add(code);
      });
      window.addEventListener("keyup", (e) => {
        this.keys.delete(e.code);
      });

      const fire = document.getElementById("touch-fire");
      const bomb = document.getElementById("touch-bomb");
      const stick = document.getElementById("touch-stick");
      const setFire = (value) => {
        this.fire = value;
      };
      fire.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        fire.setPointerCapture(e.pointerId);
        setFire(true);
      });
      fire.addEventListener("pointerup", () => setFire(false));
      fire.addEventListener("pointercancel", () => setFire(false));
      bomb.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        this.bomb = true;
      });
      stick.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        stick.setPointerCapture(e.pointerId);
        this.stickPointer = e.pointerId;
        this.stickBase = stick.getBoundingClientRect();
        this.updateStick(e.clientX, e.clientY);
      });
      stick.addEventListener("pointermove", (e) => {
        if (e.pointerId === this.stickPointer) this.updateStick(e.clientX, e.clientY);
      });
      const clearStick = () => {
        this.stickPointer = null;
        this.vector.x = 0;
        this.vector.y = 0;
        this.stickKnob.style.transform = "translate(-50%, -50%)";
      };
      stick.addEventListener("pointerup", clearStick);
      stick.addEventListener("pointercancel", clearStick);
    }

    updateStick(x, y) {
      const rect = this.stickBase;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const max = rect.width * 0.34;
      const dx = x - cx;
      const dy = y - cy;
      const len = Math.hypot(dx, dy) || 1;
      const clamped = Math.min(max, len);
      const nx = (dx / len) * clamped;
      const ny = (dy / len) * clamped;
      this.vector.x = nx / max;
      this.vector.y = ny / max;
      this.stickKnob.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
    }

    consume(code) {
      const has = this.pressed.has(code);
      this.pressed.delete(code);
      return has;
    }

    update() {
      const left = this.keys.has("ArrowLeft") || this.keys.has("KeyA");
      const right = this.keys.has("ArrowRight") || this.keys.has("KeyD");
      const up = this.keys.has("ArrowUp") || this.keys.has("KeyW");
      const down = this.keys.has("ArrowDown") || this.keys.has("KeyS");
      const keyX = (right ? 1 : 0) - (left ? 1 : 0);
      const keyY = (down ? 1 : 0) - (up ? 1 : 0);
      if (keyX || keyY || this.stickPointer === null) {
        this.vector.x = keyX;
        this.vector.y = keyY;
      }
      if (this.vector.x && this.vector.y) {
        const len = Math.hypot(this.vector.x, this.vector.y);
        this.vector.x /= len;
        this.vector.y /= len;
      }
      this.fire = this.fire || this.keys.has("Space") || this.keys.has("KeyJ");
      this.bomb = this.bomb || this.consume("KeyB") || this.consume("KeyK");
      this.pause = this.consume("Escape") || this.consume("KeyP");
      this.start = this.consume("Enter") || this.consume("NumpadEnter") || this.fire;
      this.mute = this.consume("KeyM");
      this.debug = this.consume("F3");
      this.pressed.clear();
    }

    endFrame() {
      this.bomb = false;
      this.pause = false;
      this.start = false;
      this.mute = false;
      this.debug = false;
      if (!this.keys.has("Space") && !this.keys.has("KeyJ") && this.stickPointer === null) this.fire = false;
    }
  }

  Game.Input = Input;
})();
