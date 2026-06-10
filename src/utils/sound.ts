// Simple retro synthesizer using the Web Audio API
class RetroSoundPlayer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    // Resume context if suspended (browser security autoplays lock)
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  setMute(muted: boolean) {
    this.isMuted = muted;
  }

  getMuted() {
    return this.isMuted;
  }

  // Play physical slash sound (A fast high pitch sweep down with noise)
  playSlash() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Core cut/impact synth
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);

    // Dynamic metallic friction (Noise)
    const bufferSize = ctx.sampleRate * 0.12; // 120ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(1000, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(150, now + 0.12);
    noiseFilter.Q.setValueAtTime(5, now);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    noise.start(now);
    noise.stop(now + 0.12);
  }

  // Play magical impact sound (Rising arpeggio of chimes + resonant noise)
  playMagic() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [330, 440, 554, 659, 880]; // A major arpeggio
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + idx * 0.05 + 0.2);
      
      gain.gain.setValueAtTime(0.0, now + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.25);
    });

    // Spell burst energy
    const oscBurst = ctx.createOscillator();
    const gainBurst = ctx.createGain();
    oscBurst.type = "triangle";
    oscBurst.frequency.setValueAtTime(100, now + 0.15);
    oscBurst.frequency.exponentialRampToValueAtTime(800, now + 0.35);
    
    gainBurst.gain.setValueAtTime(0, now + 0.15);
    gainBurst.gain.linearRampToValueAtTime(0.15, now + 0.2);
    gainBurst.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    oscBurst.connect(gainBurst);
    gainBurst.connect(ctx.destination);
    oscBurst.start(now + 0.15);
    oscBurst.stop(now + 0.4);
  }

  // Play defense shield activation
  playDefense() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Low sweeping protection hum
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.3);
    
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    
    const filter = ctx.createBiquadFilter();
    filter.type = "peaking";
    filter.frequency.value = 240;
    filter.Q.value = 10;
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Play healing magic chime (Sweet scale upward + high-pass sparkle)
  playHeal() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major scale upwards
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      
      gain.gain.setValueAtTime(0, now + idx * 0.04);
      gain.gain.linearRampToValueAtTime(0.1, now + idx * 0.04 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.18);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.2);
    });
  }

  // Play Player taking damage
  playPlayerDamage() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Deep heavy hit
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(50, now + 0.25);
    
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Play Enemy taking damage
  playEnemyDamage() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Slap/Punch sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "triangle";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.18);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  // Play sound when button is hovered
  playTick() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, now);
    
    gain.gain.setValueAtTime(0.02, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Play victory chime (Upbeat fanfare!)
  playVictory() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const fanfare = [
      { freq: 523.25, duration: 0.1 },             // C5
      { freq: 659.25, duration: 0.1 },             // E5
      { freq: 783.99, duration: 0.1 },             // G5
      { freq: 1046.50, duration: 0.15 },           // C6 (short pause)
      { freq: 880.00, duration: 0.1 },             // A5
      { freq: 1046.50, duration: 0.3 }             // C6 (hold)
    ];

    let accum = 0;
    fanfare.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(n.freq, now + accum);
      
      gain.gain.setValueAtTime(0, now + accum);
      gain.gain.linearRampToValueAtTime(0.12, now + accum + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + accum + n.duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + accum);
      osc.stop(now + accum + n.duration);
      accum += n.duration * 1.1; // small spacing
    });
  }

  // Play defeat theme (descending sad chime)
  playDefeat() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const sadNotes = [392.00, 349.23, 311.13, 261.63]; // G4 -> F4 -> Eb4 -> C4
    
    sadNotes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, now + idx * 0.2);
      osc.frequency.linearRampToValueAtTime(freq - 15, now + idx * 0.2 + 0.25);
      
      gain.gain.setValueAtTime(0, now + idx * 0.2);
      gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.2 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.2 + 0.25);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.2);
      osc.stop(now + idx * 0.2 + 0.3);
    });
  }

  // Play Level-up fanfare
  playLevelUp() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // 1. Sparkly fast scale run (crescendo of ascending frequencies)
    const runNotes = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50, 1318.51, 1567.98, 2093.00];
    runNotes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      
      gain.gain.setValueAtTime(0, now + idx * 0.04);
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.04 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.15);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.18);
    });

    // 2. Triumphant body chords (C Major triad played with rich harmonized waves)
    const chordDelay = 0.42;
    const triadFreqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    triadFreqs.forEach((freq) => {
      // Triangle body wave for warmth
      const oscTr = ctx.createOscillator();
      const gainTr = ctx.createGain();
      oscTr.type = "triangle";
      oscTr.frequency.setValueAtTime(freq, now + chordDelay);
      
      gainTr.gain.setValueAtTime(0, now + chordDelay);
      gainTr.gain.linearRampToValueAtTime(0.18, now + chordDelay + 0.05);
      gainTr.gain.exponentialRampToValueAtTime(0.001, now + chordDelay + 1.2);
      
      oscTr.connect(gainTr);
      gainTr.connect(ctx.destination);
      oscTr.start(now + chordDelay);
      oscTr.stop(now + chordDelay + 1.3);

      // Low sub layer for powerful acoustic presence (an octave below)
      const oscSub = ctx.createOscillator();
      const gainSub = ctx.createGain();
      oscSub.type = "sine";
      oscSub.frequency.setValueAtTime(freq / 2, now + chordDelay);
      
      gainSub.gain.setValueAtTime(0, now + chordDelay);
      gainSub.gain.linearRampToValueAtTime(0.10, now + chordDelay + 0.05);
      gainSub.gain.exponentialRampToValueAtTime(0.001, now + chordDelay + 1.2);
      
      oscSub.connect(gainSub);
      gainSub.connect(ctx.destination);
      oscSub.start(now + chordDelay);
      oscSub.stop(now + chordDelay + 1.3);
    });

    // 3. High pitch sparkle chimes raining down at the end of the chord strike
    const rainDelay = 0.75;
    const chimes = [2093.00, 2637.02, 3135.96, 4186.01]; // High C7, E7, G7, C8
    chimes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + rainDelay + idx * 0.06);
      
      gain.gain.setValueAtTime(0, now + rainDelay + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.06, now + rainDelay + idx * 0.06 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, now + rainDelay + idx * 0.06 + 0.25);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + rainDelay + idx * 0.06);
      osc.stop(now + rainDelay + idx * 0.06 + 0.3);
    });
  }
}

export const sounds = new RetroSoundPlayer();
export default sounds;
