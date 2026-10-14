// src/store/appStore.ts
import { Store } from '@tanstack/store';
import { streamEngine } from '../audio/streamEngine';
import { TRACK_CATALOG, getTrackById } from '../audio/trackCatalog';

export type AppPhase = 'idle' | 'running' | 'decelerating' | 'stashing' | 'cleared';

export interface AppState {
  bedtime: string;           // "00:30"
  phase: AppPhase;
  soundEnabled: boolean;     // whether audio is actively playing
  volume: number;            // 0.0 - 1.0
  currentTrackId: string;    // id from TRACK_CATALOG
  autoDJ: boolean;           // whether AI-DJ auto-transitions are enabled
  minutesToBedtime: number;  // dynamically updated countdown in minutes
  unresolvedBugs: string;
  tomorrowFirstTask: string;
}

const savedBedtime = localStorage.getItem('wd_bedtime') || '00:30';

export const appStore = new Store<AppState>({
  bedtime: savedBedtime,
  phase: 'idle',
  soundEnabled: false,
  volume: 0.35,
  currentTrackId: TRACK_CATALOG[0]?.id || 'focus-lofi',
  autoDJ: true,
  minutesToBedtime: 60,
  unresolvedBugs: '',
  tomorrowFirstTask: '',
});

// Synchronize streamEngine state into appStore
streamEngine.subscribe((engineState) => {
  appStore.setState((prev) => {
    const nextTrackId = engineState.currentTrack?.id || prev.currentTrackId;
    if (
      prev.soundEnabled === engineState.isPlaying &&
      prev.currentTrackId === nextTrackId &&
      prev.volume === engineState.volume &&
      prev.autoDJ === engineState.autoDJ
    ) {
      return prev;
    }
    return {
      ...prev,
      soundEnabled: engineState.isPlaying,
      currentTrackId: nextTrackId,
      volume: engineState.volume,
      autoDJ: engineState.autoDJ,
    };
  });
});

// Helper actions
export const setBedtime = (time: string) => {
  localStorage.setItem('wd_bedtime', time);
  appStore.setState((state) => ({ ...state, bedtime: time }));
};

export const setPhase = (phase: AppPhase) => {
  appStore.setState((state) => ({ ...state, phase }));
};

export const toggleSound = (enabled?: boolean) => {
  const currentState = appStore.state.soundEnabled;
  const shouldPlay = enabled !== undefined ? enabled : !currentState;
  if (shouldPlay) {
    const track = getTrackById(appStore.state.currentTrackId) || TRACK_CATALOG[0];
    streamEngine.playTrack(track);
  } else {
    streamEngine.stop();
  }
};

export const setTrack = (trackId: string) => {
  const track = getTrackById(trackId);
  if (!track) return;
  appStore.setState((state) => ({ ...state, currentTrackId: trackId }));
  if (streamEngine.isPlaying()) {
    streamEngine.playTrack(track);
  } else {
    // Stage track in stream engine
    streamEngine.playTrack(track);
    // If not playing, playTrack will start it
  }
};

export const selectTrackWithoutAutoplay = (trackId: string) => {
  const track = getTrackById(trackId);
  if (!track) return;
  appStore.setState((state) => ({ ...state, currentTrackId: trackId }));
  if (streamEngine.isPlaying()) {
    streamEngine.playTrack(track);
  }
};

export const setAutoDJ = (enabled: boolean) => {
  streamEngine.setAutoDJ(enabled);
  appStore.setState((state) => ({ ...state, autoDJ: enabled }));
  if (enabled) {
    // Immediately evaluate transition for current countdown
    streamEngine.evaluateSmartTransition(appStore.state.minutesToBedtime);
  }
};

export const setVolume = (volume: number) => {
  streamEngine.setVolume(volume);
  appStore.setState((state) => ({ ...state, volume }));
};

export const setMinutesToBedtime = (minutes: number) => {
  appStore.setState((state) => ({ ...state, minutesToBedtime: minutes }));
};

export const updateStash = (bugs: string, task: string) => {
  appStore.setState((state) => ({
    ...state,
    unresolvedBugs: bugs,
    tomorrowFirstTask: task,
  }));
};
