// src/components/TerminalDashboard.tsx
import { useState, useEffect } from 'react';
import { useStore } from '@tanstack/react-store';
import {
  appStore,
  setPhase,
  toggleSound,
  setBedtime,
  setAutoDJ,
  setTrack,
  setVolume,
  setMinutesToBedtime,
  updateStash,
} from '../store/appStore';
import { streamEngine } from '../audio/streamEngine';
import {
  calculateMinutesToBedtime,
  selectSmartTrack,
  getTrackById,
  TRACK_CATALOG,
} from '../audio/trackCatalog';
import { AudioControlPill } from './AudioControlPill';
import { NervousSystemProtocols } from './NervousSystemProtocols';
import {
  Terminal,
  Moon,
  ShieldCheck,
  Clock,
  Sparkles,
  Disc3,
  CloudRain,
  Waves,
  ArrowRight,
  X,
} from 'lucide-react';

export const TerminalDashboard = () => {
  const state = useStore(appStore, (s) => s);
  const [commandInput, setCommandInput] = useState('');
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  const [countdownString, setCountdownString] = useState('--:--:--');
  const [isOverdue, setIsOverdue] = useState(false);
  const [editingBedtime, setEditingBedtime] = useState(false);
  const [bedtimeInput, setBedtimeInput] = useState(state.bedtime);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'Welcome to WindDown.dev [Neo-Terminal Companion]',
    'Audio engine ready. AI-DJ auto-transitions enabled.',
  ]);

  const addLog = (msg: string) => {
    setTerminalLogs((prev) => [...prev.slice(-4), msg]);
  };

  // Subscribe to StreamEngine error notifications
  useEffect(() => {
    const unsub = streamEngine.subscribe((engineState) => {
      if (engineState.error) {
        addLog(`[Audio Warning] ${engineState.error}`);
      }
    });
    return unsub;
  }, []);

  // Master Clock & Smart Audio Transition Runner
  useEffect(() => {
    const updateTick = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );

      // 1. Calculate minutes to bedtime handling midnight rollover
      const minutesRemaining = calculateMinutesToBedtime(state.bedtime, now);
      setMinutesToBedtime(minutesRemaining);

      // 2. Pass accurate minutes to the AI-DJ smart transition engine
      streamEngine.evaluateSmartTransition(minutesRemaining);

      // 3. Format countdown clock
      const totalSeconds = Math.round(minutesRemaining * 60);
      const overdue = totalSeconds <= 0;
      setIsOverdue(overdue);

      const absSeconds = Math.abs(totalSeconds);
      const h = Math.floor(absSeconds / 3600);
      const m = Math.floor((absSeconds % 3600) / 60);
      const s = absSeconds % 60;

      const formatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      setCountdownString(formatted);
    };

    updateTick();
    const timer = setInterval(updateTick, 1000);
    return () => clearInterval(timer);
  }, [state.bedtime]);

  const currentSmartTrack = selectSmartTrack(state.minutesToBedtime);
  const currentActiveTrack = getTrackById(state.currentTrackId) || currentSmartTrack;

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = commandInput.trim();
    const cmd = raw.toLowerCase();
    setCommandInput('');

    if (!cmd) return;

    if (cmd === ':stash') {
      setPhase('stashing');
      addLog('Context stashing panel engaged.');
    } else if (cmd === ':mute' || cmd === ':stop') {
      toggleSound(false);
      addLog('Audio stream stopped.');
    } else if (cmd === ':sound' || cmd === ':play') {
      toggleSound(true);
      addLog(`Streaming "${currentActiveTrack.name}" (${Math.round(state.volume * 100)}% vol).`);
    } else if (cmd === ':autodj') {
      const next = !state.autoDJ;
      setAutoDJ(next);
      addLog(`AI-DJ auto-transition ${next ? 'enabled' : 'disabled'}.`);
    } else if (cmd.startsWith(':bedtime ')) {
      const newTime = cmd.split(' ')[1];
      if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(newTime)) {
        setBedtime(newTime);
        setBedtimeInput(newTime);
        addLog(`Target bedtime updated to ${newTime}.`);
      } else {
        addLog('Format error: use :bedtime HH:MM (e.g. :bedtime 00:30)');
      }
    } else if (cmd.startsWith(':track ')) {
      const query = cmd.replace(':track ', '').trim();
      const found = TRACK_CATALOG.find(
        (t) => t.id === query || t.name.toLowerCase().includes(query)
      );
      if (found) {
        setTrack(found.id);
        addLog(`Switched track to: ${found.name}`);
      } else {
        addLog(`Track "${query}" not found. Type :tracks for catalog.`);
      }
    } else if (cmd === ':tracks') {
      addLog(`Tracks: ${TRACK_CATALOG.map((t) => t.id).join(', ')}`);
    } else if (cmd.startsWith(':vol ')) {
      const val = parseInt(cmd.split(' ')[1], 10);
      if (!isNaN(val) && val >= 0 && val <= 100) {
        setVolume(val / 100);
        addLog(`Volume set to ${val}%.`);
      } else {
        addLog('Format error: use :vol 0-100');
      }
    } else if (cmd === ':help') {
      addLog('Commands: :sound, :mute, :autodj, :bedtime HH:MM, :track <id>, :vol <0-100>, :stash');
    } else {
      addLog(`Unknown command: ${raw}. Type :help for commands.`);
    }
  };

  const handleBedtimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(bedtimeInput)) {
      setBedtime(bedtimeInput);
      setEditingBedtime(false);
      addLog(`Bedtime updated to ${bedtimeInput}`);
    }
  };

  return (
    <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-surface/90 backdrop-blur-2xl shadow-2xl p-6 text-sm relative selection:bg-amberGlow/20">
      
      {/* Top Chrome Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4 mb-6">
        {/* Terminal Window Dots & Path */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/70 border border-red-500/40" />
          <div className="w-3 h-3 rounded-full bg-amber-500/70 border border-amber-500/40" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/70 border border-emerald-500/40" />
          <span className="ml-2 text-xs text-slate-400 font-mono flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-amberGlow" /> ~/winddown.dev
          </span>
        </div>

        {/* Target Bedtime & Interactive Audio Pill */}
        <div className="flex items-center gap-3">
          {/* Target Bedtime Indicator */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
            <Moon className="w-3.5 h-3.5 text-twilight" />
            {editingBedtime ? (
              <form onSubmit={handleBedtimeSubmit} className="flex items-center gap-1">
                <input
                  type="text"
                  value={bedtimeInput}
                  onChange={(e) => setBedtimeInput(e.target.value)}
                  placeholder="00:30"
                  className="w-12 bg-transparent text-white border-b border-amberGlow outline-none text-xs font-mono text-center"
                  autoFocus
                />
                <button
                  type="submit"
                  className="text-[10px] text-amberGlow hover:underline cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingBedtime(false)}
                  className="text-[10px] text-slate-500 hover:text-white cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setEditingBedtime(true)}
                title="Click to edit bedtime target"
                className="hover:text-amberGlow transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Target: {state.bedtime}</span>
              </button>
            )}
          </div>

          {/* Interactive Audio Control Pill */}
          <AudioControlPill />
        </div>
      </div>

      {/* Hero Section: Real-Time Clock & Accurate Countdown Timer */}
      <div className="text-center py-6">
        {/* Wall Clock */}
        <div className="text-5xl md:text-6xl font-light tracking-widest text-slate-100 font-mono drop-shadow-md">
          {currentTime}
        </div>

        {/* Dynamic Countdown Pill */}
        <div className="mt-4 flex flex-col items-center justify-center gap-2">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono tracking-wider ${
              isOverdue
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : state.minutesToBedtime <= 15
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                : state.minutesToBedtime <= 35
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                : 'bg-amberGlow/10 border-amberGlow/30 text-amberGlow'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>
              {isOverdue ? 'OVERDUE BY' : 'T-MINUS'}: {countdownString}
            </span>
            <span className="text-[10px] text-slate-400">
              ({state.minutesToBedtime.toFixed(1)}m remaining)
            </span>
          </div>

          {/* Active Soundscape Stage Recommendation */}
          <div className="text-xs uppercase tracking-widest text-slate-400 font-mono flex items-center justify-center gap-2 mt-1">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                state.soundEnabled
                  ? 'bg-terminalGreen animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                  : 'bg-slate-500'
              }`}
            />
            <span>
              Stage:{' '}
              <strong className="text-slate-200">
                {state.minutesToBedtime > 35
                  ? 'Focus Wrap-Up (>35m)'
                  : state.minutesToBedtime >= 15
                  ? 'Sensory Deceleration (15m–35m)'
                  : 'Sleep Induction (<15m)'}
              </strong>
            </span>
          </div>
        </div>

        {/* Smart Audio AI-DJ Transition Ribbon */}
        <div className="mt-5 mx-auto max-w-md p-2.5 rounded-xl border border-white/5 bg-surfaceLight/50 backdrop-blur-md text-xs font-mono flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-2 text-left">
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-amberGlow">
              {currentActiveTrack.category === 'focus' ? (
                <Disc3 className="w-4 h-4" />
              ) : currentActiveTrack.category === 'transition' ? (
                <CloudRain className="w-4 h-4" />
              ) : (
                <Waves className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="text-slate-200 font-medium flex items-center gap-1.5">
                <span>{currentActiveTrack.name}</span>
                {state.autoDJ && (
                  <span className="text-[9px] text-amberGlow border border-amberGlow/30 px-1 rounded flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" /> AI-DJ
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 line-clamp-1">
                {currentActiveTrack.description}
              </p>
            </div>
          </div>

          <div className="text-right text-[10px] text-slate-500 pl-2 border-l border-white/5">
            <div>Crossfade: 2s</div>
            <div>Mode: HTML5 stream</div>
          </div>
        </div>
      </div>

      {/* Nervous System Defrag Protocols */}
      <NervousSystemProtocols />

      {/* Terminal Logs & Activity Feed */}
      <div className="mt-4 border-t border-white/5 pt-3">
        <div className="text-[11px] font-mono text-slate-500 space-y-1">
          {terminalLogs.map((log, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-slate-600">›</span>
              <span className="text-slate-400">{log}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Terminal Command Input Line */}
      <form onSubmit={handleCommand} className="mt-4 border-t border-white/5 pt-4 flex items-center gap-2">
        <span className="text-amberGlow font-mono font-bold">~ $</span>
        <input
          type="text"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          placeholder="Type :play, :mute, :autodj, :bedtime 00:30, or :stash..."
          className="flex-1 bg-transparent border-none outline-none text-slate-200 font-mono placeholder:text-slate-600 text-sm"
        />
        <button
          type="button"
          onClick={() => setPhase('stashing')}
          className="text-xs bg-surfaceLight hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-slate-300 font-mono cursor-pointer flex items-center gap-1.5 transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amberGlow" /> Stash Context
        </button>
      </form>

      {/* Context Stash Modal / Drawer if phase is 'stashing' */}
      {state.phase === 'stashing' && (
        <div className="absolute inset-0 bg-surface/95 backdrop-blur-xl rounded-2xl p-6 flex flex-col justify-between z-50 border border-white/15 shadow-2xl">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2 font-mono text-slate-200 font-semibold">
                <ShieldCheck className="w-4 h-4 text-amberGlow" />
                <span>Developer Mental Context Stash</span>
              </div>
              <button
                type="button"
                onClick={() => setPhase('running')}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 font-mono mb-4">
              Offload working memory before sleep. Any unfinished bug or tomorrow's first step will be saved here safely.
            </p>

            <div className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-300 mb-1">
                  Unresolved Bugs & Open Thoughts:
                </label>
                <textarea
                  rows={3}
                  value={state.unresolvedBugs}
                  onChange={(e) => updateStash(e.target.value, state.tomorrowFirstTask)}
                  placeholder="e.g. Cache invalidation on websocket disconnect still pending..."
                  className="w-full bg-void/80 border border-white/10 rounded-lg p-2.5 text-slate-200 outline-none focus:border-amberGlow/50 resize-none font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">
                  Tomorrow's First Concrete Task:
                </label>
                <input
                  type="text"
                  value={state.tomorrowFirstTask}
                  onChange={(e) => updateStash(state.unresolvedBugs, e.target.value)}
                  placeholder="e.g. Run integration test on auth endpoint"
                  className="w-full bg-void/80 border border-white/10 rounded-lg p-2.5 text-slate-200 outline-none focus:border-amberGlow/50 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10 font-mono text-xs">
            <span className="text-slate-500">Auto-saved to local memory</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setPhase('cleared');
                  addLog('Mental context safely stashed. Mind cleared for shutdown.');
                }}
                className="bg-amberGlow text-void font-bold px-4 py-1.5 rounded-lg hover:bg-amber-400 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Commit & Clear Mind</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
