// src/audio/brownNoiseEngine.ts

class BrownNoiseEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private isRunning: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Generates a seamless 5-second brown noise buffer in memory
  private createBrownNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error("AudioContext not initialized");

    const bufferSize = this.ctx.sampleRate * 5; // 5-second loop
    const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const output = buffer.getChannelData(channel);
      let lastOut = 0.0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Leaky integration to simulate brownian motion
        lastOut = (lastOut + 0.02 * white) / 1.02;
        // Scale down to prevent digital clipping
        output[i] = lastOut * 3.5;
      }
    }
    return buffer;
  }

  public start(targetVolume: number = 0.4) {
    this.initContext();
    if (!this.ctx || this.isRunning) return;

    // 1. Create Buffer Source
    const buffer = this.createBrownNoiseBuffer();
    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = buffer;
    this.noiseNode.loop = true;

    // 2. Low-Pass Filter (softens the high frequencies to make it warm)
    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.setValueAtTime(450, this.ctx.currentTime); // 450Hz cutoff

    // 3. Gain Node for volume control and smooth fades
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(0.001, this.ctx.currentTime);
    // Smooth ramp-up over 2 seconds
    this.gainNode.gain.exponentialRampToValueAtTime(Math.max(targetVolume, 0.001), this.ctx.currentTime + 2);

    // Graph connection: Source -> Filter -> Gain -> Destination
    this.noiseNode.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    this.noiseNode.start();
    this.isRunning = true;
  }

  public setVolume(volume: number, rampDurationSeconds: number = 0.2) {
    if (!this.gainNode || !this.ctx) return;
    const clampedVol = Math.max(0.0001, Math.min(volume, 1.0));
    this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
    this.gainNode.gain.exponentialRampToValueAtTime(clampedVol, this.ctx.currentTime + rampDurationSeconds);
  }

  // Gracefully fades volume out to zero over a set number of seconds
  public fadeOutAndStop(fadeDurationSeconds: number = 3) {
    if (!this.gainNode || !this.ctx || !this.isRunning) return;

    this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, this.ctx.currentTime);
    this.gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + fadeDurationSeconds);

    setTimeout(() => {
      this.stop();
    }, fadeDurationSeconds * 1000);
  }

  public stop() {
    if (this.noiseNode) {
      try {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
      } catch {
        // Source node already stopped
      }
      this.noiseNode = null;
    }
    this.isRunning = false;
  }

  public getStatus(): boolean {
    return this.isRunning;
  }
}

export const brownNoise = new BrownNoiseEngine();