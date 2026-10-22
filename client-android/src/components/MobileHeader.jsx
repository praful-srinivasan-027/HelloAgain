import React from 'react';
import { Volume2, VolumeX, Server, User, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { triggerHaptic } from '../utils/haptics';

export function MobileHeader({
  activeRecipient,
  onBack,
  isConnected,
  soundEnabled,
  onToggleSound,
}) {
  const { user, isAuthenticated, openAuthModal, logout, openServerModal, serverUrl } = useAuth();

  const handleToggleSound = () => {
    triggerHaptic('light');
    onToggleSound();
  };

  const isOnlineBackend = serverUrl.includes('onrender.com');

  return (
    <header className="glass-panel safe-top flex flex-col z-20 shrink-0">
      <div className="h-14 px-3 flex items-center justify-between">
        {/* Left: Back button or App Monogram */}
        <div className="flex items-center gap-2.5 min-w-0">
          {activeRecipient ? (
            <button
              onClick={() => {
                triggerHaptic('light');
                onBack();
              }}
              className="p-2 -ml-1 rounded-full text-white/80 active:bg-white/10 active:scale-95 transition-all"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/15 flex items-center justify-center font-bold text-sm tracking-wider text-white shadow-inner">
              H
            </div>
          )}

          <div className="flex flex-col min-w-0">
            {activeRecipient ? (
              <>
                <h1 className="text-[14.5px] font-semibold text-white truncate leading-tight">
                  {activeRecipient.username || activeRecipient.email}
                </h1>
                <div className="flex items-center gap-1.5 text-[11px] text-white/50">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
                    }`}
                  />
                  <span className="truncate">{activeRecipient.email}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-[15px] font-bold tracking-tight text-white leading-tight">
                    HelloAgain
                  </h1>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    ANDROID
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10.5px] text-white/45">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isConnected ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  <span>{isConnected ? 'Online Server Connected' : 'Connecting to Server...'}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Server Config Modal Trigger */}
          <button
            onClick={openServerModal}
            title={isOnlineBackend ? 'Connected to Render Online' : 'Custom Server'}
            className="p-2 rounded-xl text-white/60 hover:text-white active:bg-white/10 active:scale-95 transition-all relative"
          >
            <Server className="w-4 h-4" />
            <span
              className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
                isOnlineBackend ? 'bg-emerald-400' : 'bg-cyan-400'
              }`}
            />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            title={soundEnabled ? 'Mute' : 'Enable Sound'}
            className="p-2 rounded-xl text-white/60 hover:text-white active:bg-white/10 active:scale-95 transition-all"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* User Auth Profile / Login */}
          {isAuthenticated ? (
            <button
              onClick={() => {
                if (window.confirm(`Signed in as ${user?.email || 'User'}. Log out?`)) {
                  logout();
                }
              }}
              title="Tap to Log Out"
              className="p-1.5 rounded-xl bg-white/5 active:bg-white/15 border border-white/10 flex items-center gap-1 text-white/80 active:scale-95 transition-all"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center justify-center">
                {(user?.username || user?.email || 'U')[0].toUpperCase()}
              </div>
              <LogOut className="w-3.5 h-3.5 text-white/40" />
            </button>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="px-2.5 py-1 bg-white text-black text-[11.5px] font-semibold rounded-lg active:scale-95 transition-all flex items-center gap-1 shadow-sm"
            >
              <User className="w-3 h-3" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default MobileHeader;
