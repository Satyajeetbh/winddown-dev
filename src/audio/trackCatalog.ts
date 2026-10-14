// src/audio/trackCatalog.ts

export type TrackCategory = 'focus' | 'transition' | 'sleep';

export interface AmbientTrack {
  id: string;
  name: string;
  category: TrackCategory;
  url: string;
  description: string;
}

/**
 * Curated catalog of reliable, open-source streaming soundscapes.
 * Uses high-availability HTTPS CDNs with CORS enabled for instant streaming.
 */
export const TRACK_CATALOG: AmbientTrack[] = [
  // Focus (> 35m)
  {
    id: 'focus-lofi',
    name: 'Focus Lo-Fi Beats',
    category: 'focus',
    url: 'https://cdn.freecodecamp.org/curriculum/js-music-player/scratching-the-surface.mp3',
    description: 'Chilled ambient downtempo beats and lo-fi groove for deep code focus.',
  },
  {
    id: 'chillhop-flow',
    name: 'Chillhop Flow',
    category: 'focus',
    url: 'https://cdn.freecodecamp.org/curriculum/js-music-player/cruising-for-a-musing.mp3',
    description: 'Laid-back lo-fi instrumental rhythms for wrapping up open tasks and PRs.',
  },

  // Transition (15m – 35m)
  {
    id: 'window-rain',
    name: 'Window Rain',
    category: 'transition',
    url: 'https://www.gstatic.com/voice_delight/sounds/long/rain.mp3',
    description: 'Continuous gentle rain falling against the window pane to decelerate mental load.',
  },
  {
    id: 'distant-storm',
    name: 'Distant Storm',
    category: 'transition',
    url: 'https://www.gstatic.com/voice_delight/sounds/long/thunder.mp3',
    description: 'Soothing rolling thunder and rain showers easing the nervous system.',
  },

  // Sleep (< 15m)
  {
    id: 'deep-space-drone',
    name: 'Deep Space Drone',
    category: 'sleep',
    url: 'https://www.gstatic.com/voice_delight/sounds/long/ocean.mp3',
    description: 'Sub-bass atmospheric drone and deep harmonic waves for delta wave sleep induction.',
  },
  {
    id: 'brown-space-drone',
    name: 'Brown Space Drone',
    category: 'sleep',
    url: 'https://www.gstatic.com/voice_delight/sounds/long/pink_noise.mp3',
    description: 'Warm low-frequency acoustic drone masking environmental high-frequency noise.',
  },
  {
    id: 'night-forest',
    name: 'Night Forest & Brook',
    category: 'sleep',
    url: 'https://www.gstatic.com/voice_delight/sounds/long/forest.mp3',
    description: 'Gentle night breeze and forest textures guiding mind into restful state.',
  },
];

/**
 * Intelligent decision function:
 * > 35m: Focus Lo-Fi
 * 15m – 35m: Window Rain / Storm
 * < 15m: Deep Space / Brown Noise Drone
 */
export function selectSmartTrack(minutesRemaining: number): AmbientTrack {
  if (minutesRemaining > 35) {
    return TRACK_CATALOG.find((t) => t.id === 'focus-lofi') ?? TRACK_CATALOG[0];
  } else if (minutesRemaining >= 15) {
    return TRACK_CATALOG.find((t) => t.id === 'window-rain') ?? TRACK_CATALOG[2];
  } else {
    return TRACK_CATALOG.find((t) => t.id === 'deep-space-drone') ?? TRACK_CATALOG[4];
  }
}

/**
 * Finds a track by its identifier.
 */
export function getTrackById(id: string): AmbientTrack | undefined {
  return TRACK_CATALOG.find((track) => track.id === id);
}

/**
 * Calculates remaining minutes until bedtime with accurate midnight rollover handling.
 */
export function calculateMinutesToBedtime(bedtime: string, now: Date = new Date()): number {
  const [targetH, targetM] = bedtime.split(':').map(Number);
  
  // Date anchors
  const targetToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), targetH, targetM, 0, 0);
  const targetTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, targetH, targetM, 0, 0);
  const targetYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, targetH, targetM, 0, 0);

  const diffToday = (targetToday.getTime() - now.getTime()) / 60000;
  const diffTomorrow = (targetTomorrow.getTime() - now.getTime()) / 60000;
  const diffYesterday = (targetYesterday.getTime() - now.getTime()) / 60000;

  // If yesterday's bedtime occurred within the last 4 hours (240 minutes),
  // the developer has stayed up past midnight and is currently overdue.
  if (diffYesterday >= -240) {
    return diffYesterday;
  }

  // If today's bedtime was within the last 4 hours, it's recently overdue today.
  if (diffToday < 0 && diffToday >= -240) {
    return diffToday;
  }

  // If today's bedtime is in the future, target is today's bedtime.
  if (diffToday >= 0) {
    return diffToday;
  }

  // Otherwise, today's bedtime was earlier in the day (> 4 hours ago),
  // so the upcoming bedtime is tomorrow (e.g. at 23:30 targeting 00:30 tomorrow morning).
  return diffTomorrow;
}
