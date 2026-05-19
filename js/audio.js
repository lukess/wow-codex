(function () {
  const Game = (window.Game = window.Game || {});

  class AudioManager {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.musicGain = null;
      this.sfxGain = null;
      this.muted = localStorage.getItem("1946-muted") === "1";
      this.musicTimer = 0;
      this.noteIndex = 0;
      this.stage = 1;
      this.enabled = false;
    }

    init() {
      if (this.ctx) return;
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.12;
      this.sfxGain.gain.value = 0.22;
      this.master.gain.value = this.muted ? 0 : 1;
      this.musicGain.connect(this.master);
      this.sfxGain.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.enabled = true;
    }

    resume() {
      this.init();
      if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    }

    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem("1946-muted", this.muted ? "1" : "0");
      if (this.master) this.master.gain.value = this.muted ? 0 : 1;
    }

    beep(freq, duration, type, gain, target) {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const amp = this.ctx.createGain();
      osc.type = type || "square";
      osc.frequency.value = freq;
      amp.gain.setValueAtTime(0, now);
      amp.gain.linearRampToValueAtTime(gain || 0.1, now + 0.01);
      amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(amp);
      amp.connect(target || this.sfxGain);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    }

    noise(duration, gain, lowpass) {
      if (!this.ctx || this.muted) return;
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * duration, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      const amp = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = lowpass || 1400;
      amp.gain.setValueAtTime(gain || 0.18, this.ctx.currentTime);
      amp.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      src.buffer = buffer;
      src.connect(filter);
      filter.connect(amp);
      amp.connect(this.sfxGain);
      src.start();
    }

    play(name) {
      this.resume();
      if (!this.ctx || this.muted) return;
      if (name === "shoot") this.beep(720, 0.045, "square", 0.045);
      if (name === "hit") this.beep(180, 0.06, "triangle", 0.09);
      if (name === "explode") {
        this.noise(0.5, 0.22, 900);
        this.beep(90, 0.42, "sawtooth", 0.1);
      }
      if (name === "power") {
        [440, 660, 880].forEach((f, i) => setTimeout(() => this.beep(f, 0.08, "sine", 0.08), i * 45));
      }
      if (name === "death") {
        this.noise(0.8, 0.32, 700);
        this.beep(130, 0.65, "sawtooth", 0.13);
      }
      if (name === "bomb") {
        this.noise(1.0, 0.4, 500);
        this.beep(55, 0.9, "sawtooth", 0.24);
      }
      if (name === "warning") {
        this.beep(290, 0.16, "square", 0.15);
        setTimeout(() => this.beep(290, 0.16, "square", 0.15), 260);
      }
      if (name === "clear") [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.beep(f, 0.18, "triangle", 0.1), i * 120));
    }

    setStage(stage) {
      this.stage = stage;
      this.noteIndex = 0;
    }

    update(dt, state) {
      if (!this.ctx || this.muted || state !== "PLAYING") return;
      this.musicTimer -= dt;
      if (this.musicTimer > 0) return;
      const scales = [
        [220, 277, 330, 392, 440, 392, 330, 277],
        [196, 247, 294, 349, 392, 349, 294, 247],
        [233, 294, 349, 415, 466, 415, 349, 294],
      ];
      const scale = scales[(this.stage - 1) % scales.length];
      const note = scale[this.noteIndex % scale.length];
      this.beep(note, 0.11, "triangle", 0.035, this.musicGain);
      if (this.noteIndex % 4 === 0) this.beep(note / 2, 0.18, "sine", 0.05, this.musicGain);
      this.noteIndex += 1;
      this.musicTimer = 0.18;
    }
  }

  Game.AudioManager = AudioManager;
})();
