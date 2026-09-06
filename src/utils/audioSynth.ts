// Web Audio API based harmonic drone & singing bowl synthesizer

class SoundscapeEngine {
  private ctx: AudioContext | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private gainNode: GainNode | null = null;
  public isPlaying = false;

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a soothing harmonic drone (Raga Yaman / Tibetan singing bowl overtone)
  playDrone(type: 'flute' | 'bowl' | 'tanpura' = 'flute') {
    this.stop();
    this.initContext();
    if (!this.ctx) return;

    this.isPlaying = true;
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(0.01, this.ctx.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 2.5);
    this.gainNode.connect(this.ctx.destination);

    // Frequencies for soothing Raga Yaman / D base (D3 = ~146.83Hz, A3 = ~220Hz, F#3 = ~185Hz)
    let freqs = [146.83, 220.0, 293.66, 369.99];
    if (type === 'bowl') {
      freqs = [216.0, 432.0, 648.0]; // 432 Hz healing bowl harmonic
    } else if (type === 'tanpura') {
      freqs = [110.0, 164.81, 220.0, 329.63];
    }

    freqs.forEach((f, idx) => {
      if (!this.ctx || !this.gainNode) return;
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      
      osc.type = type === 'flute' ? 'sine' : (idx === 0 ? 'sine' : 'triangle');
      osc.frequency.setValueAtTime(f, this.ctx.currentTime);

      // Subtle vibrato/detune for organic warmth
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = 0.2 + idx * 0.1;
      lfoGain.gain.value = 1.2;
      lfo.connect(osc.frequency);
      lfo.start();

      oscGain.gain.value = 1 / (idx + 1.2);
      osc.connect(oscGain);
      oscGain.connect(this.gainNode);

      osc.start();
      this.activeOscillators.push(osc);
    });
  }

  stop() {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 1.0);
      setTimeout(() => {
        this.activeOscillators.forEach(osc => {
          try { osc.stop(); } catch {}
        });
        this.activeOscillators = [];
        this.isPlaying = false;
      }, 1100);
    } else {
      this.isPlaying = false;
    }
  }

  // Play a soft bell chime
  playChime() {
    this.initContext();
    if (!this.ctx) return;

    const chimeGain = this.ctx.createGain();
    chimeGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 2.0);
    chimeGain.connect(this.ctx.destination);

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, this.ctx.currentTime); // 528Hz love/solfeggio frequency
    osc.connect(chimeGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 2.0);
  }

  // Play a cute, wholesome mascot chirp (soft two-tone ascending chime)
  playCuteChirp(cheerful = true) {
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const f1 = cheerful ? 587.33 : 523.25; // D5 or C5
    const f2 = cheerful ? 880.00 : 659.25; // A5 or E5

    // Tone 1
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(f1, now);
    gain1.gain.setValueAtTime(0.09, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.18);

    // Tone 2 (higher, sweet cute lift)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(f2, now + 0.1);
    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.setValueAtTime(0.08, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.38);
  }

  // Wholesome soft purr / grounding heartbeat pulse
  playCutePurr() {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.4);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }
}

export const soundEngine = new SoundscapeEngine();

// Gentle speech synthesis for language previews
export function speakDialectSample(langCode: string, sampleText: string) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(sampleText);
    utterance.rate = 0.85; // Unhurried, soothing pace
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    if (langCode === 'hi') utterance.lang = 'hi-IN';
    else if (langCode === 'bn') utterance.lang = 'bn-IN';
    else if (langCode === 'ta') utterance.lang = 'ta-IN';
    else if (langCode === 'te') utterance.lang = 'te-IN';
    else if (langCode === 'mr') utterance.lang = 'mr-IN';
    else utterance.lang = 'en-IN';

    window.speechSynthesis.speak(utterance);
  } else {
    soundEngine.playChime();
  }
}
