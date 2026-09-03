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
