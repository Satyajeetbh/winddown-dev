import { TerminalDashboard } from './components/TerminalDashboard';

export default function App() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 bg-void relative selection:bg-amberGlow/30 selection:text-white">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amberGlow/5 rounded-full blur-[140px] pointer-events-none" />
      <TerminalDashboard />
    </main>
  );
}
