// src/components/AudioControlPill.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@tanstack/react-store';
import {
  appStore,
  toggleSound,
  setTrack,
  setAutoDJ,
  setVolume,
} from '../store/appStore';
import {
  TRACK_CATALOG,
  getTrackById,
} from '../audio/trackCatalog';
import type { TrackCategory } from '../audio/trackCatalog';
import {
  Play,
  Pause,
  Sparkles,
  ChevronDown,
  Volume2,
  VolumeX,
  Volume1,
  Check,
  Disc3,
  Waves,
  CloudRain,
  Radio,
} from 'lucide-react';

export const AudioControlPill: React.FC = () => {
  const state = useStore(appStore, (s) => s);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentTrack =
    getTrackById(state.currentTrackId) || TRACK_CATALOG[0];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
        setVolumeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSound();
  };

  const handleToggleAutoDJ = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAutoDJ(!state.autoDJ);
  };

  const handleSelectTrack = (trackId: string) => {
    setTrack(trackId);
    setDropdownOpen(false);
  };

  const getCategoryIcon = (category: TrackCategory) => {
    switch (category) {
      case 'focus':
        return <Disc3 className="w-3 h-3 text-amberGlow" />;
      case 'transition':
        return <CloudRain className="w-3 h-3 text-sky-400" />;
      case 'sleep':
        return <Waves className="w-3 h-3 text-twilight" />;
      default:
        return <Radio className="w-3 h-3 text-slate-400" />;
    }
  };

  const getCategoryBadgeClass = (category: TrackCategory) => {
    switch (category) {
      case 'focus':
        return 'bg-amberGlow/10 text-amberGlow border-amberGlow/30';
      case 'transition':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'sleep':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    }
  };

  return (
    <div ref={dropdownRef} className="relative inline-flex items-center">
      {/* Main Interactive Control Pill */}
      <div className="flex items-center gap-1.5 p-1 pl-1.5 pr-2 rounded-full border border-white/10 bg-surfaceLight/90 backdrop-blur-md shadow-lg font-mono text-xs text-slate-300 transition-all hover:border-white/20">
        
        {/* Play / Pause Toggle Button */}
        <button
          type="button"
          onClick={handleTogglePlay}
          title={state.soundEnabled ? 'Pause soundscape' : 'Play soundscape'}
          aria-label={state.soundEnabled ? 'Pause soundscape' : 'Play soundscape'}
          className={`flex items-center justify-center w-7 h-7 rounded-full cursor-pointer transition-all ${
            state.soundEnabled
              ? 'bg-terminalGreen/20 text-terminalGreen border border-terminalGreen/40 shadow-[0_0_12px_rgba(16,185,129,0.3)] hover:bg-terminalGreen/30'
              : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white hover:bg-white/10'
          }`}
        >
          {state.soundEnabled ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </button>

        {/* Track Selector Dropdown Trigger */}
        <button
          type="button"
          onClick={() => {
            setDropdownOpen(!dropdownOpen);
            setVolumeOpen(false);
          }}
          title="Select soundscape track"
          className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/5 cursor-pointer transition-colors max-w-[170px]"
        >
          <span className="flex-shrink-0">
            {getCategoryIcon(currentTrack.category)}
          </span>
          <span className="truncate text-slate-200 font-medium">
            {currentTrack.name}
          </span>
          <ChevronDown
            className={`w-3 h-3 text-slate-400 transition-transform ${
              dropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Vertical Divider */}
        <div className="w-[1px] h-4 bg-white/10" />

        {/* 'Auto' AI-DJ Badge */}
        <button
          type="button"
          onClick={handleToggleAutoDJ}
          title={
            state.autoDJ
              ? 'AI-DJ Active: Automatically evolves soundscape as bedtime nears'
              : 'AI-DJ Inactive: Click to enable bedtime-synced transitions'
          }
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider transition-all cursor-pointer border ${
            state.autoDJ
              ? 'bg-amberGlow/15 border-amberGlow/40 text-amberGlow shadow-[0_0_10px_rgba(245,158,11,0.25)]'
              : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20'
          }`}
        >
          <Sparkles className={`w-2.5 h-2.5 ${state.autoDJ ? 'animate-pulse' : ''}`} />
          <span>AUTO</span>
          {state.autoDJ && (
            <span className="w-1.5 h-1.5 rounded-full bg-amberGlow animate-ping" />
          )}
        </button>

        {/* Volume Level Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setVolumeOpen(!volumeOpen)}
            title={`Volume: ${Math.round(state.volume * 100)}%`}
            className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {state.volume === 0 ? (
              <VolumeX className="w-3.5 h-3.5" />
            ) : state.volume < 0.5 ? (
              <Volume1 className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Volume Slider Flyout */}
          {volumeOpen && (
            <div className="absolute right-0 bottom-full mb-2 p-2 rounded-lg border border-white/10 bg-surface/95 backdrop-blur-xl shadow-2xl flex items-center gap-2 z-50">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={state.volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 accent-amberGlow cursor-pointer h-1.5 bg-white/20 rounded-lg"
              />
              <span className="text-[10px] text-slate-400 font-mono w-6 text-right">
                {Math.round(state.volume * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Track Selector Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-white/10 bg-surface/95 backdrop-blur-2xl shadow-2xl p-2.5 z-50 text-xs font-mono">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 px-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-amberGlow" /> Soundscape Matrix
            </span>
            <span className="text-[10px] text-slate-500">
              {state.autoDJ ? 'AI-DJ sync on' : 'Manual mode'}
            </span>
          </div>

          <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
            {TRACK_CATALOG.map((track) => {
              const isSelected = track.id === currentTrack.id;
              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => handleSelectTrack(track.id)}
                  className={`w-full text-left p-2 rounded-lg transition-all cursor-pointer flex items-start justify-between gap-2 border ${
                    isSelected
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'border-transparent hover:bg-white/5 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{track.name}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded border uppercase font-mono tracking-wider ${getCategoryBadgeClass(
                          track.category
                        )}`}
                      >
                        {track.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-sans">
                      {track.description}
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-terminalGreen flex-shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* AI-DJ Helper note */}
          <div className="mt-2 pt-2 border-t border-white/10 px-1 text-[10px] text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amberGlow flex-shrink-0" />
            <span>
              {state.autoDJ
                ? 'AI-DJ will auto-crossfade soundscapes as bedtime approaches.'
                : 'Turn on AUTO to let AI-DJ manage soundscapes by bedtime proximity.'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
