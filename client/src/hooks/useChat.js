import { useState, useCallback, useEffect, useRef } from 'react';
import { fetchMessageHistory } from '../services/api';
import { playSendChime, playReceiveChime } from '../utils/sound';

export function useChat(user, userConversations) {
  const [activeRecipient, setActiveRecipient] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [unreadMap, setUnreadMap] = useState({});
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Sync initial conversations from AuthContext
  useEffect(() => {
    if (userConversations && Array.isArray(userConversations)) {
      setConversations((prev) => {
        const next = [...prev];
        let changed = false;
        userConversations.forEach((item) => {
          if (item && item[0]) {
            const email = String(item[0]).trim().toLowerCase();
            if (email.includes('@') && !next.some(c => c.id === email)) {
              next.push({ id: email, email });
              changed = true;
            }
          }
        });
        return changed ? next : prev;
      });
    }
  }, [userConversations]);

  // Load local storage conversations
  useEffect(() => {
    if (!user || !user.email) {
      setConversations([]);
      setMessages([]);
      setActiveRecipient(null);
      return;
    }
    try {
      const saved = localStorage.getItem(`ps_conversations_${user.email}`);
      if (saved) setConversations(JSON.parse(saved));
    } catch {}
  }, [user]);

  // Save conversations to local storage
  useEffect(() => {
    if (user?.email && conversations.length > 0) {
      try {
        localStorage.setItem(`ps_conversations_${user.email}`, JSON.stringify(conversations));
      } catch {}
    }
  }, [conversations, user]);

  const addConversation = useCallback((email) => {
    if (!email) return;
    const cleanEmail = email.trim().toLowerCase();
    if (user?.email && cleanEmail === user.email.trim().toLowerCase()) return;

    setConversations((prev) => {
      if (prev.some((c) => c.id === cleanEmail)) return prev;
      return [...prev, { id: cleanEmail, email: cleanEmail }];
    });
  }, [user]);

  const loadHistory = useCallback(async (recipientEmail) => {
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
            content,
            receiverId: recipientEmail,
            timestamp: sentAt ? new Date(sentAt) : new Date(),
          };
        });
        
        historyList.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        setMessages((prev) => {
          const otherMessages = prev.filter(
            (m) => (m.receiverId || '').toLowerCase() !== recipientEmail.toLowerCase()
          );
          return [...otherMessages, ...historyList];
        });
      }
    } catch (err) {
      console.warn('Failed to load message history for', recipientEmail, err);
    }
  }, [user]);

  useEffect(() => {
    if (activeRecipient?.email) {
      loadHistory(activeRecipient.email);
      setUnreadMap((prev) => {
        if (!prev[activeRecipient.email]) return prev;
        const next = { ...prev };
        delete next[activeRecipient.email];
        return next;
      });
    }
  }, [activeRecipient, loadHistory]);

  const handleIncomingMessage = useCallback((parsedMessage) => {
    const { cleanContent, incomingReceiver, incomingSender } = parsedMessage;
    const currentUserEmail = (user?.email || '').trim().toLowerCase();
    
    let conversationId = null;
    if (incomingSender.toLowerCase() === currentUserEmail) {
      conversationId = incomingReceiver.toLowerCase();
    } else {
      conversationId = incomingSender.toLowerCase();
    }

    const newMessage = {
      id: Math.random().toString(36).substring(2, 9),
      type: incomingSender.toLowerCase() === currentUserEmail ? 'sent' : 'received',
      sender: incomingSender,
      content: cleanContent,
      receiverId: conversationId,
      timestamp: new Date(),
    };

    setMessages((prev) => {
      const isDuplicate = prev.some(
        (m) => m.content === newMessage.content &&
               m.type === newMessage.type &&
               Math.abs(m.timestamp.getTime() - newMessage.timestamp.getTime()) < 3000
      );
      if (isDuplicate) return prev;
      return [...prev, newMessage];
    });

    addConversation(conversationId);

    if (activeRecipient?.id !== conversationId) {
      setUnreadMap((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] || 0) + 1,
      }));
    }

    if (newMessage.type === 'received') {
      playReceiveChime(soundEnabled);
    }
  }, [user, activeRecipient, addConversation, soundEnabled]);

  const appendOptimisticMessage = useCallback((content, receiverId, senderEmail) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        type: 'sent',
        sender: senderEmail,
        content,
        receiverId,
        timestamp: new Date(),
      },
    ]);
    playSendChime(soundEnabled);
  }, [soundEnabled]);

  const activeMessages = messages.filter((m) => {
    if (!activeRecipient?.id) return false;
    return (m.receiverId || '').toLowerCase() === activeRecipient.id.toLowerCase();
  });

  return {
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
    clearMessages: () => setMessages([]),
  };
}
