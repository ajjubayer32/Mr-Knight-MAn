// Procedural Web Audio sound, ambient city sound & music engine for Mymensingh Rickshaw Rush

class SoundEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled = true;
  private ambientEnabled = true;
  private musicEnabled = true;
  private vibrationEnabled = true;

  private lastPedalTick = 0;
  private ambienceGain: GainNode | null = null;
  private ambienceSource: AudioBufferSourceNode | null = null;
  private rollingGain: GainNode | null = null;
  private rollingOsc: OscillatorNode | null = null;
  private ambienceActive = false;
  private ambientEventTimer: number | null = null;

  private musicTimer: number | null = null;
  private musicActive = false;
  private musicStep = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    if (!enabled) {
      this.stopAmbientNodes();
    } else if (this.ambienceActive && this.ambientEnabled) {
      this.setAmbience(true);
    }
  }

  public setAmbientEnabled(enabled: boolean): void {
    this.ambientEnabled = enabled;
    if (!enabled) {
      this.stopAmbientNodes();
    } else if (this.ambienceActive && this.soundEnabled) {
      this.setAmbience(true);
    }
  }

  public setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopMusicLoop();
    } else if (this.musicActive) {
      this.startMusicLoop();
    }
  }

  public setVibrationEnabled(enabled: boolean): void {
    this.vibrationEnabled = enabled;
  }

  public vibrate(pattern: number | number[]): void {
    if (!this.vibrationEnabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      // ignore unsupported browsers
    }
  }

  public unlock(): void {
    this.ensureContext();
  }

  public setMusicActive(active: boolean): void {
    this.musicActive = active;
    if (active && this.musicEnabled) {
      this.startMusicLoop();
    } else {
      this.stopMusicLoop();
    }
  }

  private startMusicLoop(): void {
    if (this.musicTimer !== null || !this.musicEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const melody = [293.66, 329.63, 369.99, 440.0, 493.88, 440.0, 369.99, 329.63];
    const bass = [146.83, 146.83, 164.81, 196.0, 220.0, 196.0, 164.81, 146.83];

    const playNote = () => {
      if (!this.musicEnabled || !this.musicActive) return;
      const c = this.ensureContext();
      if (!c) return;
      const t = c.currentTime;
      const idx = this.musicStep % melody.length;
      this.musicStep++;

      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(melody[idx], t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(0.026, t + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.48);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.5);

      if (idx % 2 === 0) {
        const bOsc = c.createOscillator();
        const bGain = c.createGain();
        bOsc.type = 'sine';
        bOsc.frequency.setValueAtTime(bass[idx], t);
        bGain.gain.setValueAtTime(0.001, t);
        bGain.gain.exponentialRampToValueAtTime(0.018, t + 0.04);
        bGain.gain.exponentialRampToValueAtTime(0.0005, t + 0.72);
        bOsc.connect(bGain);
        bGain.connect(c.destination);
        bOsc.start(t);
        bOsc.stop(t + 0.75);
      }
    };

    playNote();
    this.musicTimer = window.setInterval(playNote, 480);
  }

  private stopMusicLoop(): void {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private stopAmbientNodes(): void {
    if (this.ambienceGain && this.ctx) {
      try {
        this.ambienceGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.2);
      } catch {
        // ignore
      }
    }
    if (this.rollingGain && this.ctx) {
      try {
        this.rollingGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.15);
      } catch {
        // ignore
      }
    }
    if (this.ambientEventTimer !== null) {
      window.clearTimeout(this.ambientEventTimer);
      this.ambientEventTimer = null;
    }
  }

  public setAmbience(active: boolean): void {
    this.ambienceActive = active;

    if (!active || !this.soundEnabled || !this.ambientEnabled) {
      this.stopAmbientNodes();
      return;
    }

    const ctx = this.ensureContext();
    if (!ctx) return;

    if (!this.ambienceSource) {
      const dur = 4.0;
      const len = Math.floor(ctx.sampleRate * dur);
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const ch = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.025 * white) / 1.025;
        ch[i] = last * 1.9;
      }

      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 320;
      filter.Q.value = 0.55;

      const gain = ctx.createGain();
      gain.gain.value = 0.0001;

      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();

      this.ambienceSource = src;
      this.ambienceGain = gain;
    }

    if (!this.rollingOsc) {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = 56;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 180;
      const gain = ctx.createGain();
      gain.gain.value = 0.0001;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      this.rollingOsc = osc;
      this.rollingGain = gain;
    }

    if (this.ambienceGain) {
      this.ambienceGain.gain.setTargetAtTime(0.024, ctx.currentTime, 0.4);
    }

    if (this.ambientEventTimer === null) {
      this.scheduleNextAmbientCue();
    }
  }

  private scheduleNextAmbientCue(): void {
    if (!this.ambienceActive || !this.soundEnabled || !this.ambientEnabled) return;
    const delayMs = 2400 + Math.random() * 2600;
    this.ambientEventTimer = window.setTimeout(() => {
      this.ambientEventTimer = null;
      this.playSoftCityCue();
      this.scheduleNextAmbientCue();
    }, delayMs);
  }

  private playSoftCityCue(): void {
    if (!this.ambienceActive || !this.soundEnabled || !this.ambientEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const roll = Math.random();

    if (roll < 0.35) {
      // Distant soft bicycle / rickshaw bell
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1950 + Math.random() * 300, t);
      gain.gain.setValueAtTime(0.0005, t);
      gain.gain.exponentialRampToValueAtTime(0.015, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0003, t + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.27);
    } else if (roll < 0.7) {
      // Soft passing distant vehicle / breeze whoosh
      const len = Math.floor(ctx.sampleRate * 0.55);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        const env = Math.sin((i / len) * Math.PI);
        ch[i] = (Math.random() * 2 - 1) * env * 0.4;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.setValueAtTime(240, t);
      filt.frequency.exponentialRampToValueAtTime(480, t + 0.26);
      filt.frequency.exponentialRampToValueAtTime(190, t + 0.55);
      const gain = ctx.createGain();
      gain.gain.value = 0.018;
      src.connect(filt);
      filt.connect(gain);
      gain.connect(ctx.destination);
      src.start(t);
    } else {
      // Faint distant CNG/traffic horn pulse
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340 + Math.random() * 80, t);
      gain.gain.setValueAtTime(0.0004, t);
      gain.gain.exponentialRampToValueAtTime(0.011, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0003, t + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.16);
    }
  }

  public updateRollingAmbience(speedMs: number): void {
    if (!this.rollingGain || !this.rollingOsc || !this.ctx) return;
    if (!this.ambienceActive || !this.soundEnabled || !this.ambientEnabled || speedMs < 0.3) {
      this.rollingGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.12);
      return;
    }
    const ratio = Math.min(speedMs / 15, 1);
    this.rollingOsc.frequency.setTargetAtTime(48 + ratio * 52, this.ctx.currentTime, 0.1);
    this.rollingGain.gain.setTargetAtTime(0.006 + ratio * 0.014, this.ctx.currentTime, 0.1);
  }

  public playUiClick(): void {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(640, t);
    osc.frequency.exponentialRampToValueAtTime(920, t + 0.045);
    gain.gain.setValueAtTime(0.055, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  public playSwipe(): void {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(340, t);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.09);
    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.11);
  }

  public playBell(): void {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.vibrate(25);

    const now = ctx.currentTime;
    const strike = (start: number, baseFreq: number) => {
      const partials = [1, 2.02, 2.98];
      partials.forEach((mult, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(baseFreq * mult, start);
        const amp = idx === 0 ? 0.15 : idx === 1 ? 0.075 : 0.035;
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(amp, start + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0005, start + 0.36);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.38);
      });
    };

    strike(now, 2180);
    strike(now + 0.12, 2320);
  }

  public tickPedal(speedRatio: number): void {
    if (!this.soundEnabled || speedRatio <= 0.03) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = performance.now();
    const interval = 310 - speedRatio * 165;
    if (now - this.lastPedalTick < interval) return;
    this.lastPedalTick = now;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(155 + speedRatio * 65, t);
    osc.frequency.exponentialRampToValueAtTime(75, t + 0.035);
    gain.gain.setValueAtTime(0.018, t);
    gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.045);
  }

  public playCoin(combo = 1): void {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const pitchBoost = Math.min(combo - 1, 6) * 55;

    const freqs = [1046.5 + pitchBoost, 1567.98 + pitchBoost, 2093 + pitchBoost];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i === 2 ? 'triangle' : 'sine';
      const start = t + i * 0.042;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(i === 2 ? 0.065 : 0.12, start + 0.009);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.24);
    });
  }

  public playPassengerPickup(): void {
    this.vibrate([30, 40, 30]);
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const notes = [440, 554.37, 659.25];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const start = t + i * 0.065;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.11, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.27);
    });
  }

  public playPassengerDropoff(): void {
    this.vibrate([40, 30, 60]);
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i === 3 ? 'triangle' : 'sine';
      const start = t + i * 0.06;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  }

  public playTeaBoost(): void {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const start = t + i * 0.045;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.09, start);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.22);
    });
  }

  public playNearMiss(): void {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 0.18);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(420, t);
    filter.frequency.exponentialRampToValueAtTime(1400, t + 0.09);
    filter.frequency.exponentialRampToValueAtTime(320, t + 0.18);
    filter.Q.value = 2.2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.11, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t);
  }

  public playHorn(type: 'bus' | 'cng' | 'car' | 'moto'): void {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'bus') {
      osc.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc.frequency.setValueAtTime(175, t);
      osc2.frequency.setValueAtTime(220, t);
    } else if (type === 'cng') {
      osc.type = 'square';
      osc2.type = 'triangle';
      osc.frequency.setValueAtTime(435, t);
      osc2.frequency.setValueAtTime(444, t);
    } else if (type === 'moto') {
      osc.type = 'square';
      osc2.type = 'sine';
      osc.frequency.setValueAtTime(510, t);
      osc2.frequency.setValueAtTime(518, t);
    } else {
      osc.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc.frequency.setValueAtTime(375, t);
      osc2.frequency.setValueAtTime(472, t);
    }

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1100;

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(0.042, t + 0.02);
    gain.gain.setValueAtTime(0.038, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc2.start(t);
    osc.stop(t + 0.26);
    osc2.stop(t + 0.26);
  }

  public playCrash(): void {
    this.vibrate([90, 40, 120]);
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(145, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.26);
    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);

    const len = Math.floor(ctx.sampleRate * 0.22);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.35));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.16, t);
    noise.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(t);
  }
}

export const soundEngine = new SoundEngine();
