// Música (tema principal com loop sem o fade-out) + efeitos sonoros sintetizados na hora (zero arquivos de som).

// Faixas: a introdução toca uma vez; depois repete de loopStart a loopEnd.
// main = "Steel Laced Pursuit" (~140 BPM, compassos 15 a 87, antes do fade-out).
// deep = tema do Cyber Deep, composto por código (tools/compose.py).
const BAR140 = (60 / 140) * 4;
export const TRACKS = {
  main: { src: 'assets/music/steel_laced_pursuit.mp3', bpm: 140, loopStart: 15 * BAR140, loopEnd: 87 * BAR140 },
  deep: { src: 'assets/music/deep.mp3', bpm: 96, loopStart: 10, loopEnd: 90 },
};

export class AudioSys {
  constructor(src) {
    this.track = TRACKS.main;
    this.music = new Audio(src || this.track.src);
    this.fadeK = 1; this._fade = null;
    this.music.preload = 'auto';
    this.ctx = null;
    this.master = null;
    this.duck = 1;
    this.musicVolume = 0.5;
    try { this.muted = localStorage.getItem('neonpaws.muted') === '1'; } catch { this.muted = false; }
    this._applyVolume();
  }

  unlock() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.9;
        // passa-baixa no fim da cadeia: aberto (sem efeito) em terra, abafado debaixo d'água
        this.lpf = this.ctx.createBiquadFilter();
        this.lpf.type = 'lowpass'; this.lpf.frequency.value = 20000; this.lpf.Q.value = 0.7;
        this.master.connect(this.lpf);
        this.lpf.connect(this.ctx.destination);
        if (this.underwater) this.setUnderwater(true);
        const len = Math.floor(this.ctx.sampleRate * 0.5);
        this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      } catch { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  startMusic() {
    this.music.currentTime = 0;
    this._applyVolume();
    const p = this.music.play();
    if (p && p.catch) p.catch(() => {});
  }

  pauseMusic() { this.music.pause(); }
  resumeMusic() { if (this.music.currentTime > 0) { const p = this.music.play(); if (p && p.catch) p.catch(() => {}); } }

  update() {
    const m = this.music, T = this.track;
    if (!m.paused && m.currentTime >= T.loopEnd) m.currentTime -= T.loopEnd - T.loopStart;
    const f = this._fade;
    if (f) {                                       // troca de faixa: some, troca, volta
      const k = (performance.now() - f.t0) / 600;
      if (!f.swapped && k >= 1) {
        f.swapped = true;
        const wasPlaying = !m.paused;
        this.track = TRACKS[f.to]; m.src = this.track.src; m.currentTime = 0;
        if (wasPlaying) { const p = m.play(); if (p && p.catch) p.catch(() => {}); }
      }
      this.fadeK = f.swapped ? Math.min(1, k - 1) : Math.max(0, 1 - k);
      if (f.swapped && k >= 2) { this._fade = null; this.fadeK = 1; }
      this._applyVolume();
    }
  }

  // Música do setor (cada cenário pode ter a sua; sem faixa própria = tema principal)
  setTrack(id) {
    const T = TRACKS[id] || TRACKS.main;
    if ((this._fade && this._fade.to === id) || (!this._fade && T === this.track)) return;
    if (this.music.paused) { this.track = T; this.music.src = T.src; this._fade = null; this.fadeK = 1; this._applyVolume(); return; }
    this._fade = { to: TRACKS[id] ? id : 'main', t0: performance.now(), swapped: false };
  }

  setDuck(v) { this.duck = v; this._applyVolume(); }

  // Efeitos abafados debaixo d'água (WebAudio BiquadFilter: custo quase zero).
  // A música não passa pelo filtro: o setor submerso tem faixa própria, já com clima de água.
  setUnderwater(on) {
    this.underwater = on;
    const c = this.ctx;
    if (!c || !this.lpf) return;
    this.lpf.frequency.setTargetAtTime(on ? 850 : 20000, c.currentTime, 0.15);
  }

  toggleMute() {
    this.muted = !this.muted;
    try { localStorage.setItem('neonpaws.muted', this.muted ? '1' : '0'); } catch { /* sem armazenamento */ }
    this._applyVolume();
    return this.muted;
  }

  _applyVolume() { this.music.volume = this.muted ? 0 : this.musicVolume * this.duck * this.fadeK; }

  // 1 no tempo da batida, caindo até 0 antes da próxima (para pulsar neons no ritmo)
  pulse() {
    const m = this.music;
    if (m.paused) return 0;
    const ph = (m.currentTime * this.track.bpm) / 60;
    const f = ph - Math.floor(ph);
    return (1 - f) * (1 - f);
  }

  // ---------------- Efeitos sonoros ----------------

  _tone(type, f0, f1, dur, vol, delay = 0) {
    const c = this.ctx, t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  _noise(dur, vol, freq, delay = 0) {
    const c = this.ctx, t = c.currentTime + delay;
    const src = c.createBufferSource(); src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.8;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t); src.stop(t + dur + 0.02);
  }

  sfx(name, opt) {
    if (!this.ctx || this.muted) return;
    // o mesmo som não toca de novo em menos de 45 ms (muitas mortes juntas criariam dezenas de nós de áudio)
    const now = this.ctx.currentTime, last = (this._lastSfx || (this._lastSfx = {}))[name] || 0;
    if (now - last < 0.045) return;
    this._lastSfx[name] = now;
    switch (name) {
      case 'jump': this._tone('square', 380, 640, 0.09, 0.06); break;
      case 'airjump': this._tone('square', 560, 980, 0.1, 0.05); break;
      case 'land': this._noise(0.06, 0.05, 700); break;
      case 'dash': this._noise(0.14, 0.08, 2600); this._tone('sawtooth', 320, 120, 0.12, 0.03); break;
      case 'hit': this._tone('square', 240, 90, 0.05, 0.035); break;
      case 'kill': this._noise(0.08, 0.06, 3200); this._tone('triangle', 640, 200, 0.08, 0.04); break;
      case 'killbig': this._noise(0.22, 0.1, 1200); this._tone('sawtooth', 170, 50, 0.25, 0.06); break;
      case 'claw': this._tone('sawtooth', 1100, 300, 0.07, 0.03); break;
      case 'shuriken': this._tone('triangle', 1300, 1900, 0.06, 0.025); break;
      case 'throw': this._tone('triangle', 380, 700, 0.08, 0.025); break;
      case 'boom': this._noise(0.22, 0.08, 600); break;
      case 'alarm': [0, 0.32, 0.64].forEach((d) => this._tone('square', 880, 440, 0.24, 0.035, d)); break;
      case 'roar': this._noise(0.6, 0.12, 380); this._tone('sawtooth', 110, 45, 0.7, 0.07); this._tone('square', 160, 60, 0.5, 0.04, 0.05); break;
      case 'laser': this._tone('sawtooth', 1800, 600, 0.12, 0.03); break;
      case 'cannon': this._noise(0.12, 0.08, 500); this._tone('square', 180, 70, 0.14, 0.05); break;
      case 'biome': [330, 494, 659].forEach((f, i) => this._tone('triangle', f, f, 0.3, 0.04, i * 0.09)); break;
      case 'buy': [660, 880, 1320].forEach((f, i) => this._tone('square', f, f, 0.08, 0.05, i * 0.05)); break;
      case 'crate': this._noise(0.16, 0.09, 1400); this._tone('triangle', 300, 120, 0.12, 0.04); break;
      case 'pickup': { const k = (opt && opt.combo) || 0; this._tone('sine', 880 + k * 55, 1250 + k * 55, 0.06, 0.04); break; }
      case 'coin': this._tone('square', 1320, 1760, 0.07, 0.03); break;
      case 'heal': this._tone('sine', 520, 1040, 0.25, 0.06); break;
      case 'hurt': this._tone('sawtooth', 320, 80, 0.25, 0.08); this._noise(0.12, 0.06, 900); break;
      case 'death': this._tone('sawtooth', 400, 60, 0.6, 0.08); break;
      case 'levelup': [523, 659, 784, 1047].forEach((f, i) => this._tone('square', f, f * 1.01, 0.12, 0.05, i * 0.07)); break;
      case 'select': this._tone('square', 700, 1050, 0.07, 0.05); break;
      case 'revive': [392, 523, 659, 784, 1047].forEach((f, i) => this._tone('triangle', f, f, 0.16, 0.06, i * 0.06)); this._noise(0.4, 0.08, 1500, 0.1); break;
      case 'gameover': [523, 440, 349, 262].forEach((f, i) => this._tone('triangle', f, f * 0.98, 0.25, 0.06, i * 0.16)); break;
      default: break;
    }
  }
}
