import React, { useState, useCallback, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useWebSocket } from './hooks/useWebSocket';
import { ConversationsSidebar } from './components/ConversationsSidebar';
import { ChatHeader } from './components/ChatHeader';
import { ChatFeed } from './components/ChatFeed';
import { MessageComposer } from './components/MessageComposer';
import { AuthModal } from './components/AuthModal';
import { fetchMessageHistory } from './services/api';

function HelloAgainApp() {
  const { user, userConversations, isAuthenticated, openAuthModal } = useAuth();

  const [activeRecipient, setActiveRecipient] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleAddConversation = useCallback((email) => {
    if (!email) return;
    const cleanEmail = email.trim().toLowerCase();
    const userEmailKey = user?.email ? user.email.trim().toLowerCase() : null;

    if (userEmailKey && cleanEmail === userEmailKey) {
      console.warn('Prevented adding self-conversation to sidebar:', cleanEmail);
      return;
    }

    setConversations((prev) => {
      if (prev.some((c) => c.id === cleanEmail)) return prev;
      const updated = [...prev, { id: cleanEmail, email: cleanEmail }];
      if (userEmailKey) {
        try {
          localStorage.setItem(`ps_conversations_${userEmailKey}`, JSON.stringify(updated));
        } catch {
          // LocalStorage fallback
        }
      }
      return updated;
    });
  }, [user?.email]);

  const handleIncomingMessage = useCallback((conversationId) => {
    if (!conversationId) return;
    handleAddConversation(conversationId);
  }, [handleAddConversation]);

  const backendWsUrl = import.meta.env.VITE_BACKEND_URL
    ? import.meta.env.VITE_BACKEND_URL.replace(/^http/, 'ws').replace(/\/+$/, '') + '/ws'
    : `ws://${window.location.host}/ws`;

  const {
    status,
    messages,
    unreadMap,
    soundEnabled,
    setSoundEnabled,
    sendMessage,
    loadHistoryMessages,
    clearMessages,
  } = useWebSocket(
    backendWsUrl,
    activeRecipient?.id || null,
    user,
    handleIncomingMessage
  );

  // Clear state and messages when user logs out or switches accounts
  useEffect(() => {
    // Remove old un-scoped localStorage key if present
    localStorage.removeItem('ps_conversations');
    setActiveRecipient(null);
    clearMessages();

    if (!user || !user.email) {
      setConversations([]);
      return;
    }

    const userEmailKey = user.email.trim().toLowerCase();
    try {
      const saved = localStorage.getItem(`ps_conversations_${userEmailKey}`);
      if (saved) {
        setConversations(JSON.parse(saved));
      } else {
        setConversations([]);
      }
    } catch {
      setConversations([]);
    }
  }, [user?.email, clearMessages]);

  // Sync conversations from /userinfo all conversation list
  useEffect(() => {
    if (userConversations && Array.isArray(userConversations)) {
      userConversations.forEach((item) => {
        if (item && item[0]) {
          const peerId = String(item[0]).trim().toLowerCase();
          if (peerId.includes('@')) {
            handleAddConversation(peerId);
          }
        }
      });
    }
  }, [userConversations, handleAddConversation]);

  const isConnected = status === 'connected';

  // Fetch persistent message history whenever activeRecipient changes
  const loadHistory = useCallback(async (recipient) => {
    if (!recipient || !recipient.email) return;
    const recipientEmail = recipient.email.trim().toLowerCase();
    try {
      const data = await fetchMessageHistory(recipientEmail);
      if (data && Array.isArray(data.Messages)) {
        const historyList = data.Messages.map((msgItem, idx) => {
          const [senderId, content, sentAt] = msgItem;
          const isSent = String(senderId) === String(user?.id);
          return {
            id: `hist_${idx}_${sentAt || Date.now()}`,
            type: isSent ? 'sent' : 'received',
            sender: isSent ? user?.email : recipientEmail,
            content: content,
            receiverId: recipientEmail,
            timestamp: sentAt ? new Date(sentAt) : new Date(),
          };
        });
        loadHistoryMessages(historyList, recipientEmail);
      }
    } catch (err) {
      console.warn('Failed to load message history for', recipientEmail, err);
    }
  }, [user, loadHistoryMessages]);

  useEffect(() => {
    if (activeRecipient) {
      loadHistory(activeRecipient);
    }
  }, [activeRecipient, loadHistory]);

  // Filter messages strictly for current active recipient
  const conversationMessages = messages.filter((m) => {
    if (!activeRecipient || !activeRecipient.id) return false;
    return (m.receiverId || '').toLowerCase() === activeRecipient.id.toLowerCase();
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
