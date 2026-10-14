// src/components/NervousSystemProtocols.tsx
import { useState, type ReactNode } from 'react';
import { Eye, Wind, Brain, Flame, CheckCircle2, ChevronRight } from 'lucide-react';

export interface Protocol {
  id: string;
  category: 'respiratory' | 'ocular' | 'cognitive' | 'thermal';
  label: string;
  icon: ReactNode;
  duration: string;
  summary: string;
  steps: string[];
  mechanism: string;
}

const PROTOCOLS: Protocol[] = [
  {
    id: 'physio-sigh',
    category: 'respiratory',
    label: 'Physiological Sigh',
    icon: <Wind className="w-4 h-4 text-sky-400" />,
    duration: '60 sec',
    summary: 'Rapidly shifts autonomic state from sympathetic (high-alert) to parasympathetic (rest).',
    steps: [
      'Take a deep inhale through your nose.',
      'At the top, take a second sharp sip of air to fully expand alveoli.',
      'Slowly and completely exhale through your mouth until lungs are empty.',
      'Repeat 3 to 5 times.'
    ],
    mechanism: 'Maximizes CO2 offload and stimulates vagal nerve brake on heart rate.'
  },
  {
    id: 'panoramic-gaze',
    category: 'ocular',
    label: 'Panoramic Horizon Reset',
    icon: <Eye className="w-4 h-4 text-amber-400" />,
    duration: '2 min',
    summary: 'Disengages the brainstem alertness network caused by narrow screen focus.',
    steps: [
      'Look away from your laptop toward the farthest corner or out a window.',
      'Relax your facial muscles and soften your focus.',
      'Expand your awareness to perceive the ceiling, floor, and side peripheries without moving your eyes.',
      'Breathe normally while maintaining wide visual field.'
    ],
    mechanism: 'Disinhibits frontal-eye fields and reduces norepinephrine release in the locus coeruleus.'
  },
  {
    id: 'mental-flush',
    category: 'cognitive',
    label: 'Zeigarnik Loop Flush',
    icon: <Brain className="w-4 h-4 text-purple-400" />,
    duration: '3 min',
    summary: 'Externalizes active bug states so working memory stops spinning in bed.',
    steps: [
      'Write down exactly what line or function broke.',
      'Write down the very first command or test you will run tomorrow morning.',
      'Close all active IDE and terminal tabs.',
      'Tell yourself: "Execution is committed to disk."'
    ],
    mechanism: 'Resolves task-completion tension by providing a deterministic resumption point.'
  },
  {
    id: 'somatic-release',
    category: 'thermal',
    label: 'Jaw & Somatic Decouple',
    icon: <Flame className="w-4 h-4 text-emerald-400" />,
    duration: '90 sec',
    summary: 'Releases unconscious muscular contraction accumulated during high-focus sessions.',
    steps: [
      'Separate your molars and let your lower jaw drop slack.',
      'Drop your tongue from the roof of your mouth.',
      'Inhale deep, and drop your shoulders down 2 inches on the exhale.',
      'Wash your hands or face with warm water to radiate core body heat.'
    ],
    mechanism: 'Triggers peripheral vasodilation and downregulates cranial nerve tension.'
  }
];

export const NervousSystemProtocols = () => {
  const [activeProtocolId, setActiveProtocolId] = useState<string>(PROTOCOLS[0].id);
  const activeProtocol = PROTOCOLS.find(p => p.id === activeProtocolId) || PROTOCOLS[0];

  return (
    <div className="mt-6 border border-white/10 bg-surfaceLight/40 rounded-xl p-4 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-twilight animate-pulse" />
          <span className="text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
            Nervous System Defrag Protocols
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-500">parasympathetic_shift.sh</span>
      </div>

      {/* Protocol Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
        {PROTOCOLS.map((p) => {
          const isSelected = p.id === activeProtocol.id;
          return (
            <button
              key={p.id}
              onClick={() => setActiveProtocolId(p.id)}
              className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all border cursor-pointer ${
                isSelected
                  ? 'bg-white/10 border-white/20 text-white shadow-sm'
                  : 'bg-surface/50 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-300'
              }`}
            >
              {p.icon}
              <div className="truncate">
                <div className="text-xs font-mono truncate">{p.label}</div>
                <div className="text-[10px] text-slate-500 font-mono">{p.duration}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Protocol Detail Terminal Box */}
      <div className="mt-4 bg-void/70 border border-white/5 rounded-lg p-4 font-mono text-xs text-slate-300">
        <div className="flex items-center justify-between text-amberGlow/90 mb-2">
          <span className="font-semibold flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5" />
            {activeProtocol.label}
          </span>
          <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-400">
            Est: {activeProtocol.duration}
          </span>
        </div>

        <p className="text-slate-400 text-xs mb-3 font-sans leading-relaxed">
          {activeProtocol.summary}
        </p>

        {/* Action Steps */}
        <div className="space-y-2 mb-4 bg-surface/50 p-3 rounded-md border border-white/5">
          <div className="text-[11px] text-slate-500 uppercase tracking-wide">Execution Steps:</div>
          {activeProtocol.steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-2 text-slate-200">
              <span className="text-amberGlow/70 font-bold">{idx + 1}.</span>
              <span>{step}</span>
            </div>
          ))}
        </div>

        {/* Mechanism Footer */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-2 border-t border-white/5">
          <CheckCircle2 className="w-3.5 h-3.5 text-terminalGreen shrink-0" />
          <span><strong className="text-slate-400">Biological Target:</strong> {activeProtocol.mechanism}</span>
        </div>
      </div>
    </div>
  );
};
