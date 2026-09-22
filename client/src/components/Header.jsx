import React from 'react';
import { Activity, Volume2, VolumeX, PanelRightClose, PanelRightOpen, Zap } from 'lucide-react';

export function Header({
  status,
  latency,
  soundEnabled,
  onToggleSound,
  isSidebarOpen,
  onToggleSidebar,
}) {
  const isOnline = status === 'connected';
  const isConnecting = status === 'connecting';

  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-white/[0.08] bg-black/80 backdrop-blur-2xl z-20 shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center shadow-sm">
          <Activity className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold tracking-tight text-white">PulseStream</h1>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/90 border border-white/15 font-medium">
              v1.0
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 font-normal">Realtime WebSocket & Schema Client</p>
        </div>
      </div>

      {/* Controls & Badges */}
      <div className="flex items-center gap-2.5">
        {/* Latency badge */}
        {isOnline && latency !== null && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-white/10 text-xs text-zinc-300 font-mono">
            <Zap className="w-3 h-3 text-white" />
            <span>{latency}ms</span>
          </div>
        )}

        {/* Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-white/10 text-xs font-medium">
          <span className="relative flex h-2 w-2">
            {isOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-40"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isOnline
                  ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                  : isConnecting
                  ? 'bg-zinc-400 animate-pulse'
                  : 'bg-zinc-600'
              }`}
            ></span>
          </span>
          <span className="capitalize text-zinc-200">
            {isOnline ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
          </span>
        </div>

        {/* Sound Toggle */}
        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
          className={`p-2 rounded-lg border transition-all cursor-pointer ${
            soundEnabled
              ? 'bg-zinc-900 border-white/10 text-zinc-300 hover:text-white hover:bg-zinc-800'
              : 'bg-zinc-900 border-white/10 text-zinc-600 hover:text-zinc-400'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Sidebar Toggle */}
        <button
          onClick={onToggleSidebar}
          title={isSidebarOpen ? 'Hide Inspector' : 'Show Inspector'}
          className={`p-2 rounded-lg border transition-all cursor-pointer ${
            isSidebarOpen
              ? 'bg-white text-black border-white shadow-sm'
              : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          {isSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
