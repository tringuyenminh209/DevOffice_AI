// Audio System for DevOffice AI

export class AudioSystem {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      this.audioContext = new AudioContext();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.3; // Default volume
    }
  }

  // Approval Ping - Tiếng chuông thanh mảnh
  public playApprovalPing() {
    if (!this.audioContext || !this.masterGain || !this.isEnabled) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      1200,
      this.audioContext.currentTime + 0.1
    );

    gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.2
    );

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  // Success Chord - Hợp âm đi lên (C-E-G)
  public playSuccessChord() {
    if (!this.audioContext || !this.masterGain || !this.isEnabled) return;

    const frequencies = [261.63, 329.63, 392.00]; // C4, E4, G4
    const duration = 0.4;

    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain!);

      oscillator.frequency.setValueAtTime(freq, this.audioContext!.currentTime);
      oscillator.type = 'sine';

      const delay = index * 0.1;
      gainNode.gain.setValueAtTime(0, this.audioContext!.currentTime + delay);
      gainNode.gain.linearRampToValueAtTime(
        0.2,
        this.audioContext!.currentTime + delay + 0.05
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext!.currentTime + delay + duration
      );

      oscillator.start(this.audioContext!.currentTime + delay);
      oscillator.stop(this.audioContext!.currentTime + delay + duration);
    });
  }

  // Error Buzz - Tiếng buzz trầm nhẹ
  public playErrorBuzz() {
    if (!this.audioContext || !this.masterGain || !this.isEnabled) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);
    oscillator.type = 'sawtooth';

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.15
    );

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.15);
  }

  // Footsteps - Tiếng bước chân pixel nhỏ
  public playFootstep() {
    if (!this.audioContext || !this.masterGain || !this.isEnabled) return;

    const noise = this.audioContext.createBufferSource();
    const noiseBuffer = this.audioContext.createBuffer(
      1,
      this.audioContext.sampleRate * 0.05,
      this.audioContext.sampleRate
    );

    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    noise.buffer = noiseBuffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.05
    );

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    noise.start(this.audioContext.currentTime);
    noise.stop(this.audioContext.currentTime + 0.05);
  }

  // Audio Ducking - Làm mờ nhạc nền khi voice summary
  public startDucking() {
    if (!this.masterGain) return;

    this.masterGain.gain.linearRampToValueAtTime(
      0.1,
      this.audioContext!.currentTime + 0.3
    );
  }

  public stopDucking() {
    if (!this.masterGain) return;

    this.masterGain.gain.linearRampToValueAtTime(
      0.3,
      this.audioContext!.currentTime + 0.5
    );
  }

  // Controls
  public setVolume(volume: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public isAudioEnabled() {
    return this.isEnabled;
  }
}

export const audioManager = new AudioSystem();
