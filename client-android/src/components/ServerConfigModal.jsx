import React, { useState } from 'react';
import { X, Server, CheckCircle2, AlertTriangle, RefreshCw, Globe, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { checkServerHealth, PRODUCTION_ONLINE_URL } from '../services/api';
import { triggerHaptic } from '../utils/haptics';

export function ServerConfigModal() {
  const { isServerModalOpen, closeServerModal, serverUrl, updateServerUrl, resetServer } = useAuth();
  const [inputUrl, setInputUrl] = useState(serverUrl);
  const [pingStatus, setPingStatus] = useState(null); // { checking, online, ping, error }

  if (!isServerModalOpen) return null;

  const handleTestPing = async () => {
    triggerHaptic('light');
    setPingStatus({ checking: true });
    const res = await checkServerHealth(inputUrl);
    setPingStatus({ checking: false, ...res });
    if (res.online) triggerHaptic('success');
    else triggerHaptic('heavy');
  };

  const handleSave = () => {
    triggerHaptic('medium');
    updateServerUrl(inputUrl);
    closeServerModal();
  };

  const handleResetToProduction = () => {
    triggerHaptic('light');
    setInputUrl(PRODUCTION_ONLINE_URL);
    resetServer();
    setPingStatus(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full sm:max-w-md bg-zinc-950 border border-white/15 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl safe-bottom animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Server Settings</h2>
              <p className="text-xs text-white/45">Online & Local API Backend</p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              closeServerModal();
            }}
            className="p-2 rounded-full text-white/50 hover:text-white active:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status pill */}
        <div className="p-3 bg-zinc-900 border border-white/10 rounded-2xl mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="truncate">
              <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                Active Backend
              </p>
              <p className="text-xs text-emerald-400 font-mono truncate">{serverUrl}</p>
            </div>
          </div>
          <button
            onClick={handleTestPing}
            disabled={pingStatus?.checking}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/15 text-white text-[11px] font-semibold rounded-lg shrink-0 flex items-center gap-1 active:scale-95 transition-all"
          >
            <RefreshCw
              className={`w-3 h-3 ${pingStatus?.checking ? 'animate-spin' : ''}`}
            />
            <span>Ping</span>
          </button>
        </div>

        {/* Ping Result Alert */}
        {pingStatus && !pingStatus.checking && (
          <div
            className={`p-3 rounded-xl border mb-4 flex items-center gap-2.5 text-xs ${
              pingStatus.online
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            {pingStatus.online ? (
              <>
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <p>Server is reachable! Response latency: {pingStatus.ping}ms</p>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <p>Could not connect: {pingStatus.error || 'Request timed out'}</p>
              </>
            )}
          </div>
        )}

        {/* URL Input Form */}
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-white/60 uppercase tracking-wider mb-1">
              Backend Server URL
            </label>
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-white/30"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleResetToProduction}
              className="flex-1 py-2.5 px-3 bg-zinc-900 border border-white/10 text-white/80 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Use Online Render</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-2.5 px-3 bg-white text-black rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md"
            >
              Save & Reconnect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServerConfigModal;
