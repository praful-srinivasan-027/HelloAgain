import React, { useState } from 'react';
import { 
  Activity,
  Radio, 
  RotateCcw, 
  Play, 
  Square, 
  Volume2, 
  VolumeX, 
  PanelRightClose, 
  PanelRightOpen, 
  Zap, 
  Link2
} from 'lucide-react';
import { UserMenu } from './UserMenu';

export function AppleNavbar({
  url,
  onUpdateUrl,
  status,
  latency,
  onConnect,
  onDisconnect,
  onPing,
  onClear,
  soundEnabled,
  onToggleSound,
  isSidebarOpen,
  onToggleSidebar,
}) {
  const [inputUrl, setInputUrl] = useState(url);
  const isOnline = status === 'connected';
  const isConnecting = status === 'connecting';

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (inputUrl.trim() && inputUrl !== url) {
      onUpdateUrl(inputUrl.trim());
    } else if (!isOnline) {
      onConnect();
    }
  };

  return (
    <div className="flex flex-col shrink-0 z-30 select-none">
      {/* ----------------------------------------------------------------------
          TIER 1: GLOBAL NAV (44px, Pure Black #000000)
         ---------------------------------------------------------------------- */}
      <nav className="h-[44px] bg-black border-b border-white/10 flex items-center justify-between px-6 text-[12px] tracking-[-0.12px] text-white font-normal">
        {/* Left: ConnectX Minimalist Brand */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-white font-medium hover:text-white transition-colors cursor-pointer">
            <div className="w-5 h-5 rounded bg-white text-black flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span className="font-semibold text-white tracking-[-0.2px] text-[13px]">ConnectX</span>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-5 text-white/70 font-normal">
            <span className="text-white transition-colors cursor-pointer">Overview</span>
            <span className="hover:text-white transition-colors cursor-pointer">WebSocket</span>
            <span className="hover:text-white transition-colors cursor-pointer">Schema</span>
            <span className="hover:text-white transition-colors cursor-pointer">Telemetry</span>
          </div>
        </div>

        {/* Right: Utility & Status Cluster */}
        <div className="flex items-center gap-2.5">
          {/* Latency Pill */}
          {isOnline && latency !== null && (
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black text-[11px] font-mono text-white border border-white/20">
              <Zap className="w-2.5 h-2.5 text-white" />
              <span>{latency}ms</span>
            </div>
          )}

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute Audio Chimes' : 'Enable Audio Chimes'}
            className={`p-1.5 rounded-[8px] border transition-all active:scale-95 cursor-pointer ${
              soundEnabled
                ? 'bg-black border-white/20 text-white hover:bg-white/10'
                : 'bg-black border-white/10 text-white/40'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* User / Auth Menu */}
          <UserMenu />

          {/* Inspector Drawer Toggle */}
          <button
            onClick={onToggleSidebar}
            title={isSidebarOpen ? 'Hide Inspector' : 'Show Inspector'}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-[8px] text-[11px] font-medium border transition-all active:scale-95 cursor-pointer ${
              isSidebarOpen
                ? 'bg-white text-black border-white font-semibold'
                : 'bg-black border-white/20 text-white hover:bg-white/10'
            }`}
          >
            {isSidebarOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Inspector</span>
          </button>
        </div>
      </nav>

      {/* ----------------------------------------------------------------------
          TIER 2: SUB-NAV (52px, Pure Black)
         ---------------------------------------------------------------------- */}
      <div className="h-[52px] bg-black border-b border-white/10 flex items-center justify-between px-6">
        {/* Left: ConnectX Title & Live Status */}
        <div className="flex items-center gap-3">
          <h2 className="text-[18px] sm:text-[20px] font-semibold text-white tracking-[-0.231px] leading-none">
            ConnectX
          </h2>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-black border border-white/20 text-[11px] font-medium">
            <span className="relative flex h-2 w-2">
              {isOnline && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-40"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isOnline
                    ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                    : isConnecting
                    ? 'bg-white/50 animate-pulse'
                    : 'bg-white/20'
                }`}
              ></span>
            </span>
            <span className="text-white font-normal">
              {isOnline ? 'Online' : isConnecting ? 'Connecting' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Center: Search-Input style URL Capsule */}
        <form 
          onSubmit={handleUrlSubmit}
          className="hidden md:flex items-center gap-2 bg-black border border-white/20 px-3.5 py-1 rounded-full max-w-sm w-full mx-4 focus-within:border-white transition-all"
        >
          <Link2 className="w-3.5 h-3.5 text-white/50 shrink-0" />
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="ws://127.0.0.1:8000/ws"
            className="w-full bg-transparent text-[11.5px] font-mono text-white outline-none placeholder:text-white/30"
            spellCheck={false}
          />
          {inputUrl !== url && (
            <button
              type="submit"
              className="text-[10px] uppercase font-semibold text-white hover:text-white/70 transition-colors cursor-pointer"
            >
              Apply
            </button>
          )}
        </form>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Ping Button */}
          <button
            onClick={onPing}
            disabled={!isOnline}
            title="Send raw ping frame"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/20 hover:border-white disabled:opacity-30 text-white bg-black text-[12px] font-normal active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <Radio className="w-3 h-3 text-white" />
            <span>Ping</span>
          </button>

          {/* Clear Button */}
          <button
            onClick={onClear}
            title="Clear Chat Feed"
            className="p-1.5 rounded-full border border-white/20 hover:border-white text-white bg-black text-[11px] active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Primary Connect/Disconnect Button */}
          {isOnline ? (
            <button
              onClick={onDisconnect}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black hover:bg-white/10 text-white border border-white/30 text-[12px] font-normal active:scale-95 transition-all cursor-pointer"
            >
              <Square className="w-3 h-3" />
              <span>Disconnect</span>
            </button>
          ) : (
            <button
              onClick={onConnect}
              disabled={isConnecting}
              className="flex items-center gap-1.5 px-5 py-1.5 rounded-full bg-white hover:bg-white/90 disabled:opacity-40 text-black font-semibold text-[12px] active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{isConnecting ? 'Connecting...' : 'Connect'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
