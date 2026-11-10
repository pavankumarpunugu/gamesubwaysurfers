/**
 * Web Audio API procedural sound synthesizer for Subway Surfers 3D.
 * Zero external audio files (prevents 404s and network latency).
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private musicPlaying: boolean = false;
  private musicTimer: number | null = null;
  private musicTempo: number = 124; // BPM
  private musicStep: number = 0;
  private consecutiveCoins: number = 0;
  private lastCoinTime: number = 0;

  constructor() {
    // AudioContext will be initialized on first user interaction
    const savedMute = localStorage.getItem('subway_muted');
    if (savedMute !== null) {
      this.isMuted = savedMute === 'true';
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('subway_muted', String(muted));
    if (muted && this.musicPlaying) {
      this.stopMusic();
    } else if (!muted && !this.musicPlaying) {
      this.startMusic();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playCoin() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = Date.now();
    if (now - this.lastCoinTime < 500) {
      this.consecutiveCoins = (this.consecutiveCoins + 1) % 12;
    } else {
      this.consecutiveCoins = 0;
    }
    this.lastCoinTime = now;

    // Pentatonic scale frequencies
    const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51, 1567.98, 1760.00];
    const baseFreq = pentatonic[this.consecutiveCoins % pentatonic.length];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  public playJump(sneakers: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (sneakers) {
      // High spring boing!
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(680, this.ctx.currentTime + 0.15);
      osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } else {
      // Athletic jump whoosh
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(420, this.ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    }
  }

  public playSlide() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Filtered white noise scrape
    const bufferSize = this.ctx.sampleRate * 0.22;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.2);
    filter.Q.value = 2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start();
  }

  public playLaneSwitch(direction: 'left' | 'right') {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const pan = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.13);

    if (pan) {
      pan.pan.setValueAtTime(direction === 'left' ? -0.6 : 0.6, this.ctx.currentTime);
      osc.connect(gain);
      gain.connect(pan);
      pan.connect(this.ctx.destination);
    } else {
      osc.connect(gain);
      gain.connect(this.ctx.destination);
    }

    osc.start();
    osc.stop(this.ctx.currentTime + 0.14);
  }

  public playHoverboardDeploy() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(720, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.32);
  }

  public playPowerUpCollect() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Upward fanfare
    const freqs = [392, 523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, this.ctx!.currentTime + i * 0.05);

      gain.gain.setValueAtTime(0.2, this.ctx!.currentTime + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + i * 0.05 + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(this.ctx!.currentTime + i * 0.05);
      osc.stop(this.ctx!.currentTime + i * 0.05 + 0.2);
    });
  }

  public playWhistle() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Inspector's dual-tone whistle
    [2400, 2600].forEach((f) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, this.ctx!.currentTime);
      osc.frequency.linearRampToValueAtTime(f * 1.05, this.ctx!.currentTime + 0.12);
      osc.frequency.linearRampToValueAtTime(f, this.ctx!.currentTime + 0.25);

      gain.gain.setValueAtTime(0.18, this.ctx!.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start();
      osc.stop(this.ctx!.currentTime + 0.3);
    });
  }

  public playDogBark() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.14);
  }

  public playCrash() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Heavy crash impact
    const bufferSize = this.ctx.sampleRate * 0.45;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.1));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.45);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();

    // Low sub rumble
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(110, this.ctx.currentTime);
    sub.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.4);
    subGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    subGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.42);

    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start();
    sub.stop(this.ctx.currentTime + 0.45);
  }

  public playBoardBreak() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Zap / shield explosion sound
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  /**
   * Procedural Subway Surfers style upbeat background groove:
   * Funky 16th-step bassline, punchy kick, snappy clap/snare, and lively rhythmic accents.
   */
  public startMusic() {
    if (this.isMuted || this.musicPlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    this.musicPlaying = true;
    this.musicStep = 0;
    const stepInterval = (60 / this.musicTempo) / 4; // 16th notes

    const bassNotes = [
      110, 0, 110, 130.81, 0, 110, 146.83, 0,
      110, 0, 164.81, 146.83, 130.81, 0, 98, 0,
      110, 0, 110, 130.81, 0, 110, 146.83, 0,
      164.81, 146.83, 130.81, 110, 98, 110, 130.81, 146.83
    ];

    const chords = [
      [220, 261.63, 329.63], // Am
      [174.61, 220, 261.63], // F
      [196, 246.94, 293.66], // G
      [164.81, 207.65, 246.94] // E
    ];

    const playStep = () => {
      if (!this.musicPlaying || !this.ctx) return;
      const t = this.ctx.currentTime;
      const step = this.musicStep % 32;

      // Kick on 0, 4, 8, 12, 16, 20, 24, 28
      if (step % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.frequency.setValueAtTime(130, t);
        kickOsc.frequency.exponentialRampToValueAtTime(35, t + 0.1);
        kickGain.gain.setValueAtTime(0.28, t);
        kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        kickOsc.connect(kickGain);
        kickGain.connect(this.ctx.destination);
        kickOsc.start(t);
        kickOsc.stop(t + 0.13);
      }

      // Snare on 4, 12, 20, 28
      if (step % 8 === 4) {
        const snareOsc = this.ctx.createOscillator();
        const snareGain = this.ctx.createGain();
        snareOsc.type = 'triangle';
        snareOsc.frequency.setValueAtTime(220, t);
        snareGain.gain.setValueAtTime(0.18, t);
        snareGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        snareOsc.connect(snareGain);
        snareGain.connect(this.ctx.destination);
        snareOsc.start(t);
        snareOsc.stop(t + 0.16);
      }

      // Hi-hat on 2, 6, 10, 14, 18, 22, 26, 30
      if (step % 2 === 0) {
        const hatOsc = this.ctx.createOscillator();
        const hatGain = this.ctx.createGain();
        hatOsc.type = 'highpass' as unknown as OscillatorType;
        hatOsc.type = 'square';
        hatOsc.frequency.setValueAtTime(8000, t);
        hatGain.gain.setValueAtTime(step % 4 === 2 ? 0.05 : 0.025, t);
        hatGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
        hatOsc.connect(hatGain);
        hatGain.connect(this.ctx.destination);
        hatOsc.start(t);
        hatOsc.stop(t + 0.05);
      }

      // Bassline
      const note = bassNotes[step];
      if (note > 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(note, t);

        const bassFilter = this.ctx.createBiquadFilter();
        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(650, t);
        bassFilter.frequency.exponentialRampToValueAtTime(200, t + 0.15);

        bassGain.gain.setValueAtTime(0.15, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.ctx.destination);

        bassOsc.start(t);
        bassOsc.stop(t + 0.18);
      }

      // Synth chord stab on step 2, 10, 18, 26
      if (step % 8 === 2) {
        const chordIdx = Math.floor(step / 8);
        const triad = chords[chordIdx % chords.length];
        triad.forEach((freq) => {
          const chordOsc = this.ctx!.createOscillator();
          const chordGain = this.ctx!.createGain();
          chordOsc.type = 'sine';
          chordOsc.frequency.setValueAtTime(freq, t);
          chordGain.gain.setValueAtTime(0.04, t);
          chordGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
          chordOsc.connect(chordGain);
          chordGain.connect(this.ctx!.destination);
          chordOsc.start(t);
          chordOsc.stop(t + 0.22);
        });
      }

      this.musicStep++;
    };

    this.musicTimer = window.setInterval(playStep, stepInterval * 1000);
  }

  public stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const soundManager = new SoundManager();
