/**
 * Procedural Web Audio Sound Synthesis Engine for TCG Turbo
 * Generates authentic retro-modern audio without external audio files.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  public isMuted: boolean = false;
  public volume: number = 0.4;
  private isUnlocked: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupUnlockListeners();
    }
  }

  private setupUnlockListeners() {
    const unlock = () => {
      this.unlock();
      ['click', 'pointerdown', 'keydown', 'touchstart'].forEach(evt => {
        window.removeEventListener(evt, unlock);
      });
    };
    ['click', 'pointerdown', 'keydown', 'touchstart'].forEach(evt => {
      window.addEventListener(evt, unlock, { once: true, passive: true });
    });
  }

  public unlock() {
    this.isUnlocked = true;
    this.init();
    this.resume();
  }

  private init() {
    if (this.ctx || !this.isUnlocked || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch {
      // AudioContext unavailable or blocked
    }
  }

  private resume() {
    if (this.ctx && this.ctx.state === 'suspended' && this.isUnlocked) {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleMute(): boolean {
    this.unlock();
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    return !this.isMuted;
  }

  public setVolume(newVol: number) {
    this.volume = Math.max(0, Math.min(1, newVol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  // Soft hover tick
  public playHover() {
    this.init();
    this.resume();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(720, now + 0.04);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }

  // Card draw swoosh
  public playCardDraw() {
    this.init();
    this.resume();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch {}
  }

  // Summon creature impact & chime
  public playSummon() {
    this.init();
    this.resume();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;

      // Sub bass impact
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(140, now);
      subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.28);
      subGain.gain.setValueAtTime(0.3, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      subOsc.connect(subGain);
      subGain.connect(this.masterGain);
      subOsc.start(now);
      subOsc.stop(now + 0.3);

      // Shimmer chime
      const shimmer = this.ctx.createOscillator();
      const shimGain = this.ctx.createGain();
      shimmer.type = 'sine';
      shimmer.frequency.setValueAtTime(523.25, now + 0.05); // C5
      shimmer.frequency.exponentialRampToValueAtTime(1046.5, now + 0.35); // C6
      shimGain.gain.setValueAtTime(0.15, now + 0.05);
      shimGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      shimmer.connect(shimGain);
      shimGain.connect(this.masterGain);
      shimmer.start(now + 0.05);
      shimmer.stop(now + 0.4);
    } catch {}
  }

  // Ascension evolution triumphant chord
  public playAscend() {
    this.init();
    this.resume();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const notes = [261.63, 329.63, 392.0, 523.25, 659.25]; // C, E, G, C, E
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + idx * 0.06;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, startTime + 0.4);

        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(startTime);
        osc.stop(startTime + 0.5);
      });
    } catch {}
  }

  // Attack clash & slash
  public playAttack() {
    this.init();
    this.resume();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.15);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      noise.start(now);
    } catch {}
  }

  // Spell cast
  public playSpell() {
    this.init();
    this.resume();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.25);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }

  // Trap trigger
  public playTrap() {
    this.init();
    this.resume();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.setValueAtTime(600, now + 0.08);
      osc.frequency.setValueAtTime(1200, now + 0.16);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  // Turn chime
  public playTurnChime() {
    this.init();
    this.resume();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const freqs = [440, 554.37, 659.25]; // A major
      freqs.forEach((f, i) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.08);
        gain.gain.setValueAtTime(0.12, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.4);
      });
    } catch {}
  }

  // Victory fanfare
  public playVictory() {
    this.init();
    this.resume();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const melody = [
        { f: 523.25, d: 0.15 },
        { f: 659.25, d: 0.15 },
        { f: 783.99, d: 0.15 },
        { f: 1046.5, d: 0.45 }
      ];

      let t = this.ctx.currentTime;
      melody.forEach(note => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, t);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + note.d);
        t += note.d * 0.8;
      });
    } catch {}
  }

  // Buff / Heal / Rewind celestial chime
  public playBuff() {
    this.init();
    this.resume();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const freqs = [329.63, 440, 554.37, 659.25]; // E4, A4, C#5, E5
      freqs.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + idx * 0.05;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.25, startTime + 0.25);

        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    } catch {}
  }
}

export const soundEngine = new SoundEngine();
