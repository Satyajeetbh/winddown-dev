// src/audio/streamEngine.ts
import { Howl, Howler } from 'howler';
import type { AmbientTrack } from './trackCatalog';
import { selectSmartTrack } from './trackCatalog';

// Fix Howler for HTML5 audio streaming:
// Set _canPlayEvent to 'canplay' instead of 'canplaythrough' so that streaming audio
// and long files do not block waiting for the entire buffer.
if (typeof window !== 'undefined') {
  try {
    (Howler as unknown as { _canPlayEvent: string })._canPlayEvent = 'canplay';
    Howler.autoUnlock = true;
  } catch {
    // Ignore in non-browser environments
  }
}

export interface StreamEngineState {
  isPlaying: boolean;
  currentTrack: AmbientTrack | null;
  volume: number;
  autoDJ: boolean;
  isLoading: boolean;
  error: string | null;
}

type Listener = (state: StreamEngineState) => void;

export class StreamEngine {
  private activeHowl: Howl | null = null;
  private currentTrack: AmbientTrack | null = null;
  private targetVolume: number = 0.4;
  private playing: boolean = false;
  private autoDJ: boolean = true;
  private loading: boolean = false;
  private lastError: string | null = null;
  private listeners: Set<Listener> = new Set();

  constructor() {
    // Prime default smart track
    const initialTrack = selectSmartTrack(45);
    this.currentTrack = initialTrack;
  }

  /**
   * Returns current snapshot of stream engine state.
   */
  public getState(): StreamEngineState {
    return {
      isPlaying: this.playing,
      currentTrack: this.currentTrack,
      volume: this.targetVolume,
      autoDJ: this.autoDJ,
      isLoading: this.loading,
      error: this.lastError,
    };
  }

  /**
   * Subscribe to playback and track state changes.
   */
  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const snapshot = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (err) {
        console.error('[StreamEngine] Listener notification error:', err);
      }
    });
  }

  /**
   * Ensures Web Audio / HTML5 audio context is unlocked.
   */
  private unlockAudioContext() {
    try {
      if (Howler.ctx && Howler.ctx.state === 'suspended') {
        Howler.ctx.resume();
      }
    } catch {
      // Ignore context resume errors
    }
  }

  /**
   * Plays the designated AmbientTrack with smooth crossfading.
   * If a track is already playing, it fades out the old track while fading in the new one.
   * html5: true ensures instant streaming without waiting for complete file download.
   */
  public playTrack(track: AmbientTrack, fadeDurationMs: number = 2000): void {
    this.unlockAudioContext();

    // If the track is already active and playing, no need to recreate
    if (this.currentTrack?.id === track.id && this.playing && this.activeHowl) {
      return;
    }

    const prevHowl = this.activeHowl;
    const isCrossfading = !!(prevHowl && this.playing);

    this.currentTrack = track;
    this.loading = true;
    this.lastError = null;
    this.notify();

    // 1. Smoothly fade out previous Howl if crossfading
    if (prevHowl) {
      try {
        const currentVol = (prevHowl.volume() as number) || this.targetVolume;
        prevHowl.fade(currentVol, 0, fadeDurationMs);
        setTimeout(() => {
          try {
            prevHowl.stop();
            prevHowl.unload();
          } catch {
            // Ignore unload errors during rapid track swaps
          }
        }, fadeDurationMs + 150);
      } catch (e) {
        console.warn('[StreamEngine] Error fading previous track:', e);
      }
    }

    // 2. Instantiate new Howl stream with HTML5 audio
    // If crossfading, start at 0 and fade up; if starting fresh, start directly at targetVolume
    // to avoid silence if fade callbacks are throttled by the browser.
    const initialVol = isCrossfading ? 0 : this.targetVolume;

    const nextHowl = new Howl({
      src: [track.url],
      html5: true, // Instant online streaming
      format: ['mp3'],
      volume: initialVol,
      loop: true,
      onload: () => {
        this.loading = false;
        this.notify();
      },
      onloaderror: (_id, err) => {
        console.warn(`[StreamEngine] Error loading stream for ${track.name}:`, err);
        this.loading = false;
        this.lastError = `Failed to load "${track.name}" stream`;
        this.notify();
      },
      onplayerror: (_id, err) => {
        console.warn(`[StreamEngine] Playback blocked by browser for ${track.name}:`, err);
        this.loading = false;
        this.lastError = 'Browser autoplay blocked. Click play to listen.';
        // Auto-resume on next user interaction unlock
        nextHowl.once('unlock', () => {
          nextHowl.play();
        });
        this.notify();
      },
    });

    try {
      nextHowl.play();
      if (isCrossfading) {
        nextHowl.fade(0, this.targetVolume, fadeDurationMs);
      } else {
        nextHowl.volume(this.targetVolume);
      }
      this.activeHowl = nextHowl;
      this.playing = true;
      this.notify();
    } catch (err) {
      console.error('[StreamEngine] Failed to initiate audio playback:', err);
      this.playing = false;
      this.loading = false;
      this.lastError = 'Audio playback could not start.';
      this.notify();
    }
  }

  /**
   * Stops playback with a smooth fade-out.
   */
  public stop(fadeDurationMs: number = 1500): void {
    if (!this.activeHowl) {
      this.playing = false;
      this.notify();
      return;
    }

    const howlToStop = this.activeHowl;
    this.playing = false;
    this.activeHowl = null;
    this.loading = false;
    this.notify();

    try {
      const currentVol = (howlToStop.volume() as number) || this.targetVolume;
      howlToStop.fade(currentVol, 0, fadeDurationMs);
      setTimeout(() => {
        try {
          howlToStop.stop();
          howlToStop.unload();
        } catch {
          // Ignore cleanup errors
        }
      }, fadeDurationMs + 150);
    } catch {
      howlToStop.stop();
    }
  }

  /**
   * Toggles playback between play and stop.
   */
  public togglePlay(): void {
    if (this.playing) {
      this.stop();
    } else {
      const trackToPlay = this.currentTrack || selectSmartTrack(45);
      this.playTrack(trackToPlay);
    }
  }

  /**
   * Sets master soundscape volume (0.0 – 1.0).
   */
  public setVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this.targetVolume = clamped;

    if (this.activeHowl && this.playing) {
      try {
        this.activeHowl.volume(clamped);
      } catch (err) {
        console.warn('[StreamEngine] Error setting volume:', err);
      }
    }
    this.notify();
  }

  /**
   * Enables or disables automatic AI-DJ soundscape adjustments based on bedtime countdown.
   */
  public setAutoDJ(enabled: boolean): void {
    this.autoDJ = enabled;
    this.notify();
  }

  /**
   * Evaluates bedtime countdown and crossfades to smart track if Auto AI-DJ is enabled.
   * Called on every tick of the countdown timer.
   */
  public evaluateSmartTransition(minutesToBedtime: number): {
    transitioned: boolean;
    track: AmbientTrack;
  } {
    const recommendedTrack = selectSmartTrack(minutesToBedtime);

    // If Auto AI-DJ is off, we do not auto-switch tracks
    if (!this.autoDJ) {
      return {
        transitioned: false,
        track: this.currentTrack || recommendedTrack,
      };
    }

    // Check if the current track already matches the recommendation
    if (this.currentTrack?.id === recommendedTrack.id) {
      return {
        transitioned: false,
        track: recommendedTrack,
      };
    }

    // A transition is required!
    if (this.playing) {
      console.log(
        `[StreamEngine AI-DJ] Auto-transitioning to ${recommendedTrack.name} (${recommendedTrack.category}) with ${minutesToBedtime.toFixed(1)}m remaining`
      );
      this.playTrack(recommendedTrack, 3000); // 3-second gentle crossfade
    } else {
      // Stage the recommended track so pressing play uses the optimal soundscape
      this.currentTrack = recommendedTrack;
      this.notify();
    }

    return {
      transitioned: true,
      track: recommendedTrack,
    };
  }

  public getCurrentTrack(): AmbientTrack | null {
    return this.currentTrack;
  }

  public isPlaying(): boolean {
    return this.playing;
  }

  public isAutoDJ(): boolean {
    return this.autoDJ;
  }

  public getVolume(): number {
    return this.targetVolume;
  }
}

// Global stream engine singleton instance
export const streamEngine = new StreamEngine();
