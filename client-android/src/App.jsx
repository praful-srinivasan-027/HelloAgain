import React, { useState, useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useWebSocket } from './hooks/useWebSocket';
import { useChat } from './hooks/useChat';
import { MobileHeader } from './components/MobileHeader';
import { MobileConversationsList } from './components/MobileConversationsList';
import { MobileChatView } from './components/MobileChatView';
import { MobileMessageInput } from './components/MobileMessageInput';
import { AuthModal } from './components/AuthModal';
import { ServerConfigModal } from './components/ServerConfigModal';
import { AndroidDownloadModal } from './components/AndroidDownloadModal';
import { triggerHaptic } from './utils/haptics';

function HelloAgainAndroidApp() {
  const { user, contacts, isAuthenticated, token, openAuthModal, refreshUserInfo, serverUrl } = useAuth();
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  // Chat State Management
  const {
    activeRecipient,
    setActiveRecipient,
    conversations,
    addConversation,
    activeMessages,
    unreadMap,
    soundEnabled,
    setSoundEnabled,
    handleIncomingMessage,
    appendOptimisticMessage,
    clearMessages,
    loadMoreMessages,
    hasMore,
    isLoadingMore,
  } = useChat(user, contacts, refreshUserInfo);

  // WebSocket Connection Management (pointing to online Render server by default)
  const { status, sendWsMessage } = useWebSocket({
    token,
    isAuthenticated,
    onIncomingMessage: handleIncomingMessage,
    soundEnabled,
    serverUrl,
  });

  const isConnected = status === 'connected';

  // Configure Android Native Status Bar & Back Button
  useEffect(() => {
    // Status Bar
    try {
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setBackgroundColor({ color: '#000000' });
    } catch {}

    // Hardware Back Button listener on Android
    let backListener = null;
    try {
      CapApp.addListener('backButton', ({ canGoBack }) => {
        if (activeRecipient) {
          triggerHaptic('light');
          setActiveRecipient(null);
        } else if (canGoBack) {
          window.history.back();
        } else {
          CapApp.exitApp();
        }
      }).then((handle) => {
        backListener = handle;
      });
    } catch {}

    return () => {
      if (backListener && typeof backListener.remove === 'function') {
        backListener.remove();
      }
    };
  }, [activeRecipient, setActiveRecipient]);

  const handleSend = (text, receiverId) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    const senderEmail = user?.email;
    if (!senderEmail || !receiverId) return;

    if (sendWsMessage(text, receiverId, senderEmail)) {
      appendOptimisticMessage(text, receiverId, senderEmail);
    }
  };

  return (
    <div className="relative flex flex-col h-full w-full bg-[#000000] text-[#f4f4f5] overflow-hidden font-sans">
      <div className="ambient-glow" />

      {/* Top Android App Header */}
      <MobileHeader
        activeRecipient={activeRecipient}
        onBack={() => setActiveRecipient(null)}
        isConnected={isConnected}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
      />

      {/* Main Content: Dual-pane on desktop/tablet, single-screen on mobile */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Left Pane / Screen 1: Conversations List */}
        <div
          className={`w-full md:w-80 lg:w-96 md:border-r border-white/10 flex flex-col min-h-0 bg-black ${
            activeRecipient ? 'hidden md:flex' : 'flex'
          }`}
        >
          <MobileConversationsList
            conversations={conversations}
            activeRecipient={activeRecipient}
            onSelectRecipient={setActiveRecipient}
            onAddConversation={addConversation}
            unreadMap={unreadMap}
            onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
          />
        </div>

        {/* Right Pane / Screen 2: Active Chat Feed + Input */}
        <div
          className={`flex-1 flex flex-col min-h-0 bg-[#000000] ${
            activeRecipient ? 'flex' : 'hidden md:flex'
          }`}
        >
          {activeRecipient ? (
            <>
              <MobileChatView
                messages={activeMessages}
                activeRecipient={activeRecipient}
                isAuthenticated={isAuthenticated}
                onRequireAuth={(tab) => openAuthModal(tab || 'login')}
                onLoadMore={loadMoreMessages}
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
              />
              <MobileMessageInput
                onSendMessage={handleSend}
                isConnected={isConnected}
                isAuthenticated={isAuthenticated}
                onRequireAuth={() => openAuthModal('login')}
                activeRecipient={activeRecipient}
              />
            </>
          ) : (
            <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center text-white/40">
              <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-2xl font-bold text-white shadow-inner">
                H
              </div>
              <h2 className="text-lg font-bold text-white mb-1">HelloAgain Messenger</h2>
              <p className="text-sm text-white/50 max-w-sm mb-4">
                Select a conversation on the left or tap "+ Chat" to start messaging in real-time.
              </p>
              <button
                onClick={() => setIsDownloadModalOpen(true)}
                className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold active:scale-95 transition-all"
              >
                Download Android APK
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AuthModal />
      <ServerConfigModal />
      <AndroidDownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <HelloAgainAndroidApp />
    </AuthProvider>
  );
}

export default App;
