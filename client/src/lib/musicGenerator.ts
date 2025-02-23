import { useEffect, useRef } from 'react';

export type MusicPattern = {
  name: string;
  pattern: number[];
  bpm: number;
};

export class MusicGenerator {
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private currentPattern: MusicPattern | null = null;

  constructor() {
    this.audioContext = new AudioContext();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
  }

  public setVolume(volume: number) {
    if (this.gainNode) {
      // Convert 0-100 to 0-1
      this.gainNode.gain.value = volume / 100;
    }
  }

  public async playPattern(pattern: MusicPattern) {
    if (!this.audioContext) return;

    this.currentPattern = pattern;
    this.isPlaying = true;

    const beatLength = 60 / pattern.bpm;
    let time = this.audioContext.currentTime;

    // Create notes for the pattern
    pattern.pattern.forEach((note, index) => {
      if (note === 0) return;

      const oscillator = this.audioContext!.createOscillator();
      const noteGain = this.audioContext!.createGain();

      oscillator.connect(noteGain);
      noteGain.connect(this.gainNode!);

      // Use different frequencies for variety
      oscillator.frequency.value = 220 + (index * 55); // A3 + increments

      // Schedule note timing
      const startTime = time + (index * beatLength);
      const duration = beatLength * 0.8; // Slightly shorter than beat length for separation

      noteGain.gain.setValueAtTime(0, startTime);
      noteGain.gain.linearRampToValueAtTime(0.5, startTime + 0.01);
      noteGain.gain.linearRampToValueAtTime(0, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
  }

  public stop() {
    this.isPlaying = false;
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator.disconnect();
      this.oscillator = null;
    }
  }

  public isCurrentlyPlaying() {
    return this.isPlaying;
  }

  public getCurrentPattern() {
    return this.currentPattern;
  }
}

// React hook for using the music generator
export function useMusicGenerator() {
  const generatorRef = useRef<MusicGenerator | null>(null);

  useEffect(() => {
    generatorRef.current = new MusicGenerator();
    return () => {
      if (generatorRef.current) {
        generatorRef.current.stop();
      }
    };
  }, []);

  return generatorRef.current;
}
