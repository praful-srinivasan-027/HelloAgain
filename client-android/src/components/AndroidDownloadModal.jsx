import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Terminal, GitBranch, ExternalLink, CheckCircle2, QrCode } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export function AndroidDownloadModal({ isOpen, onClose }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallPwa = async () => {
    triggerHaptic('medium');
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        'To install directly on Android:\n1. Open this URL in Chrome on your Android phone\n2. Tap the 3-dot menu ⋮\n3. Tap "Install App" or "Add to Home screen"'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full sm:max-w-lg bg-zinc-950 border border-white/15 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl safe-bottom max-h-[85vh] overflow-y-auto animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Download Android App
              </h2>
              <p className="text-xs text-white/45">HelloAgain Messenger for Android</p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-2 rounded-full text-white/50 hover:text-white active:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options Stack */}
        <div className="space-y-3">
          {/* 1. Direct WebAPK / 1-Tap Phone Install */}
          <div className="p-3.5 bg-zinc-900 border border-emerald-500/30 rounded-2xl">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  Instant Mobile Install
                </span>
                <h3 className="text-sm font-bold text-white mt-1">
                  Install on Android Device
                </h3>
                <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
                  Downloads and installs the app directly onto your Android home screen as a standalone native app.
                </p>
              </div>
            </div>

            <button
              onClick={handleInstallPwa}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>{isInstalled ? 'App Already Installed' : 'Install App Now'}</span>
            </button>
          </div>

          {/* 2. Native APK Build */}
          <div className="p-3.5 bg-zinc-900 border border-white/10 rounded-2xl">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                  Native Android APK (Gradle)
                </span>
                <h3 className="text-sm font-bold text-white mt-1">
                  Local APK Build Script
                </h3>
                <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
                  Compile the standalone <code className="text-white font-mono text-[11px]">app-debug.apk</code> using Gradle or Android Studio.
                </p>
              </div>
            </div>

            <div className="bg-black/60 border border-white/10 rounded-xl p-2.5 font-mono text-[11px] text-zinc-300 flex items-center justify-between mb-2">
              <span>cd client-android && bash build-apk.sh</span>
            </div>

            <p className="text-[11px] text-white/40">
              The built APK is saved to <span className="font-mono text-zinc-300">client-android/dist-apk/</span>.
            </p>
          </div>

          {/* 3. GitHub Actions Automated APK Download */}
          <div className="p-3.5 bg-zinc-900 border border-white/10 rounded-2xl">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                  Cloud CI/CD Download
                </span>
                <h3 className="text-sm font-bold text-white mt-1">
                  Automated GitHub APK Builds
                </h3>
                <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
                  Push your repository to GitHub; GitHub Actions automatically builds and uploads the downloadable APK in the Artifacts tab.
                </p>
              </div>
              <GitBranch className="w-5 h-5 text-white/40 shrink-0" />
            </div>

            <a
              href="https://github.com/praful-srinivasan-027/HelloAgain/actions"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <span>View GitHub Actions APK Artifacts</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* 4. Android Studio 1-Click Launch */}
          <div className="p-3.5 bg-zinc-900 border border-white/10 rounded-2xl">
            <div className="flex items-center gap-2 mb-1.5">
              <Terminal className="w-4 h-4 text-white/50" />
              <h4 className="text-xs font-bold text-white">Open in Android Studio</h4>
            </div>
            <div className="bg-black/60 border border-white/10 rounded-xl p-2.5 font-mono text-[11px] text-zinc-300">
              npm run cap:open
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AndroidDownloadModal;
