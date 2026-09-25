import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useWebSocket } from './hooks/useWebSocket';
import { useChat } from './hooks/useChat';
import { ConversationsSidebar } from './components/ConversationsSidebar';
import { ChatHeader } from './components/ChatHeader';
import { ChatFeed } from './components/ChatFeed';
import { MessageComposer } from './components/MessageComposer';
import { AuthModal } from './components/AuthModal';

function HelloAgainApp() {
  const { user, userConversations, isAuthenticated, openAuthModal } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Core Chat State Management
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
  } = useChat(user, userConversations);

  // WebSocket Connection Management
  const backendWsUrl = import.meta.env.VITE_BACKEND_URL
    ? import.meta.env.VITE_BACKEND_URL.replace(/^http/, 'ws').replace(/\/+$/, '') + '/ws'
    : `ws://${window.location.host}/ws`;

  const { status, sendWsMessage } = useWebSocket(
    backendWsUrl,
    handleIncomingMessage,
    soundEnabled
  );

  const isConnected = status === 'connected';

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

  const handleSelectRecipient = (recipient) => {
    setActiveRecipient(recipient);
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="relative flex h-screen w-full bg-[#000000] text-[#f4f4f5] antialiased overflow-hidden font-sans">
      <div className="ambient-glow" />

      {/* 1. Email Search & Conversations Sidebar */}
      <div
        className={`${
          isMobileSidebarOpen ? 'fixed inset-0 z-40 flex' : 'hidden md:flex'
        }`}
      >
        <ConversationsSidebar
          activeRecipient={activeRecipient}
          onSelectRecipient={handleSelectRecipient}
          conversations={conversations}
          onAddConversation={addConversation}
          unreadMap={unreadMap}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((prev) => !prev)}
          isConnected={isConnected}
        />
        {isMobileSidebarOpen && (
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="flex-1 bg-black/60 backdrop-blur-sm md:hidden"
          />
        )}
      </div>

      {/* 2. Main Chat Feed & Controls */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#000000] relative">
        <ChatHeader
          recipient={activeRecipient}
          isConnected={isConnected}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((prev) => !prev)}
          onClearMessages={clearMessages}
          onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        <ChatFeed
          messages={activeMessages}
          isAuthenticated={isAuthenticated}
          onRequireAuth={(tab) => openAuthModal(tab || 'login')}
          activeRecipient={activeRecipient}
        />

        <MessageComposer
          onSendMessage={handleSend}
          isConnected={isConnected}
          isAuthenticated={isAuthenticated}
          onRequireAuth={() => openAuthModal('login')}
          activeRecipient={activeRecipient}
        />
      </main>

      {/* 3. Auth Modal */}
      <AuthModal />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <HelloAgainApp />
    </AuthProvider>
  );
}

export default App;
