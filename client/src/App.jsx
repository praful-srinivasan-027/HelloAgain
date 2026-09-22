import React, { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useWebSocket } from './hooks/useWebSocket';
import { ConversationsSidebar } from './components/ConversationsSidebar';
import { ChatHeader } from './components/ChatHeader';
import { ChatFeed } from './components/ChatFeed';
import { MessageComposer } from './components/MessageComposer';
import { AuthModal } from './components/AuthModal';

function HelloAgainApp() {
  const { user, isAuthenticated, openAuthModal } = useAuth();

  const [activeRecipient, setActiveRecipient] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleAddConversation = useCallback((email) => {
    if (!email) return;
    const cleanEmail = email.trim().toLowerCase();
    setConversations((prev) => {
      if (prev.some((c) => c.id === cleanEmail)) return prev;
      return [...prev, { id: cleanEmail, email: cleanEmail }];
    });
  }, []);

  const handleIncomingMessage = useCallback((conversationId) => {
    if (!conversationId) return;
    handleAddConversation(conversationId);
  }, [handleAddConversation]);

  const {
    status,
    messages,
    unreadMap,
    soundEnabled,
    setSoundEnabled,
    sendMessage,
    clearMessages,
  } = useWebSocket(
    `ws://${window.location.host}/ws`,
    activeRecipient?.id || null,
    user,
    handleIncomingMessage
  );

  const isConnected = status === 'connected';

  // Filter messages strictly for current active recipient
  const conversationMessages = messages.filter((m) => {
    if (!activeRecipient) return false;
    return m.receiverId === activeRecipient.id;
  });

  const handleSend = (text, receiverId) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    const senderEmail = user?.email;
    if (!senderEmail || !receiverId) {
      console.warn('Aborting message send: missing sender or receiver email.', { senderEmail, receiverId });
      return;
    }
    sendMessage(text, receiverId, senderEmail);
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
          onAddConversation={handleAddConversation}
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
          messages={conversationMessages}
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
