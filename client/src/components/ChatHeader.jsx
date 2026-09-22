import React from 'react';
import { Volume2, VolumeX, Trash2, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function ChatHeader({
  recipient,
  isConnected,
  soundEnabled,
  onToggleSound,
  onClearMessages,
  onToggleSidebar,
}) {
  const { isAuthenticated, openAuthModal } = useAuth();

  return (
    <header className="h-16 border-b border-white/10 glass-panel px-4 sm:px-6 flex items-center justify-between z-10 select-none">
      {/* Left: Mobile Menu + Active Recipient Info */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          {recipient ? (
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-semibold text-white tracking-[-0.2px] leading-tight font-mono">
                  {recipient.id}
                </h2>
              </div>
              <div className="flex items-center gap-1.5 text-[11.5px] text-white/50">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-emerald-400' : 'bg-white/20'
                  }`}
                />
                <span>{isConnected ? 'Realtime Connected' : 'Disconnected'}</span>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-[15px] font-semibold text-white/70 leading-tight">
                HelloAgain Messenger
              </h2>
              <div className="flex items-center gap-1.5 text-[11.5px] text-white/40">
                <span>Search user email to start</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute Chimes' : 'Enable Chimes'}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 transition-all cursor-pointer active:scale-95"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {recipient && (
          <button
            onClick={onClearMessages}
            title="Clear Current Chat Messages"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 transition-all cursor-pointer active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {!isAuthenticated && (
          <button
            onClick={() => openAuthModal('login')}
            className="ml-2 px-3.5 py-1.5 bg-white text-black hover:bg-white/90 text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer active:scale-95"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
