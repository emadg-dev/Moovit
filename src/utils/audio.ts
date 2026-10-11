/**
 * Synthesizes a soothing, gentle pastel chime using Web Audio API.
 * No external audio files or network requests required.
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Plays a cheerful, relaxing two-tone wellness chime (pastel tone: E5 -> A5)
   */
  public playChime() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Note 1: Gentle warm fundamental (659.25 Hz - E5)
      this.playTone(659.25, now, 0.4, 0.12);

      // Note 2: Harmonic resolving tone (880 Hz - A5)
      this.playTone(880, now + 0.18, 0.6, 0.15);

      // Note 3: High sparkle tint (1318.5 Hz - E6)
      this.playTone(1318.5, now + 0.36, 0.7, 0.08);
    } catch (e) {
      console.warn('Audio playback not allowed or failed:', e);
    }
  }

  /**
   * Plays a celebratory little fan-fare chime when marking a break done
   */
  public playCelebrationChime() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Sequence: C5 -> E5 -> G5 -> C6
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        this.playTone(freq, now + i * 0.1, 0.4, 0.1);
      });
    } catch (e) {
      console.warn('Audio celebration playback failed:', e);
    }
  }

  private playTone(freq: number, startTime: number, duration: number, gainLevel: number) {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    // Smooth envelope attack and decay to prevent any click
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(gainLevel, startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }
}

export const soundManager = new AudioSynthesizer();
