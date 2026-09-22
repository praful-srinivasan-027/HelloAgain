import React, { useState } from 'react';
import { Link2, Radio, RotateCcw, Play, Square } from 'lucide-react';

export function EndpointBar({
  url,
  onUpdateUrl,
  status,
  onConnect,
  onDisconnect,
  onPing,
  onClear,
}) {
  const [inputUrl, setInputUrl] = useState(url);
  const isOnline = status === 'connected';
  const isConnecting = status === 'connecting';

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (inputUrl !== url) {
        onUpdateUrl(inputUrl);
      } else if (!isOnline) {
        onConnect();
      }
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 border-b border-white/[0.06] bg-black/40 text-xs">
      {/* Endpoint URL Input */}
      <div className="flex items-center gap-2 bg-zinc-900/90 border border-white/10 px-3 py-1.5 rounded-lg flex-1 min-w-[260px] max-w-lg focus-within:border-white/40 transition-colors">
        <Link2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ws://127.0.0.1:8000/ws"
          className="w-full bg-transparent text-zinc-100 font-mono text-[11.5px] outline-none placeholder:text-zinc-600"
          spellCheck={false}
        />
        {inputUrl !== url && (
          <button
            onClick={() => onUpdateUrl(inputUrl)}
            className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white text-black font-semibold hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            Apply
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {isOnline ? (
          <button
            onClick={onDisconnect}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/15 hover:text-white transition-all font-medium cursor-pointer"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Disconnect</span>
          </button>
        ) : (
          <button
            onClick={onConnect}
            disabled={isConnecting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 disabled:opacity-50 text-black font-semibold transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isConnecting ? 'Connecting...' : 'Connect'}</span>
          </button>
        )}

        <button
          onClick={onPing}
          disabled={!isOnline}
          title="Send a raw ping frame to test latency"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 hover:text-white border border-white/10 transition-all font-medium cursor-pointer"
        >
          <Radio className="w-3.5 h-3.5 text-zinc-300" />
          <span>Ping</span>
        </button>

        <button
          onClick={onClear}
          title="Clear active message history"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-white/10 transition-all font-medium cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Clear</span>
        </button>
      </div>
    </div>
  );
}
