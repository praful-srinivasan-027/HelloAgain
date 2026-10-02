import { useState, useCallback, useEffect, useRef } from 'react';
import { fetchMessageHistory } from '../services/api';
import { playSendChime, playReceiveChime } from '../utils/sound';

export function useChat(user, contacts = [], refreshUserInfo = null) {
  const [activeRecipient, setActiveRecipient] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [unreadMap, setUnreadMap] = useState({});
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Sync conversations whenever backend contacts update
  useEffect(() => {
    if (!user || !user.email) {
      setConversations([]);
      setMessages([]);
      setActiveRecipient(null);
      setUnreadMap({});
      return;
    }

    setConversations((prev) => {
      const map = new Map();

      // Keep existing manual conversations
      prev.forEach((conv) => {
        if (conv?.email) {
          map.set(conv.email.toLowerCase(), { ...conv });
        }
      });

      // Overlay with verified backend contacts (which include username)
      (contacts || []).forEach((c) => {
        if (!c?.email) return;
        const key = c.email.toLowerCase();
        const existing = map.get(key);
        map.set(key, {
          id: key,
          email: key,
          username: c.username || existing?.username || null,
        });
      });

      return Array.from(map.values());
    });
  }, [user, contacts]);

  // Keep activeRecipient's username in sync if backend contacts resolve it
  useEffect(() => {
    if (!activeRecipient?.email) return;
    const match = (contacts || []).find(
      (c) => c.email.toLowerCase() === activeRecipient.email.toLowerCase()
    );
    if (match && match.username && match.username !== activeRecipient.username) {
      setActiveRecipient((prev) => (prev ? { ...prev, username: match.username } : prev));
    }
  }, [contacts, activeRecipient?.email, activeRecipient?.username]);

  const addConversation = useCallback(
    (email, username = null) => {
      if (!email) return;
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail.includes('@')) return;
      if (user?.email && cleanEmail === user.email.trim().toLowerCase()) return;

      setConversations((prev) => {
        const existingIdx = prev.findIndex((c) => c.id === cleanEmail);
        if (existingIdx >= 0) {
          if (username && prev[existingIdx].username !== username) {
            const next = [...prev];
            next[existingIdx] = { ...next[existingIdx], username };
            return next;
          }
          return prev;
        }
        return [...prev, { id: cleanEmail, email: cleanEmail, username: username || null }];
      });
    },
    [user?.email]
  );

  const loadHistory = useCallback(
    async (recipientEmail) => {
      if (!recipientEmail) return;
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
        console.warn('[useChat] Failed to load message history for', recipientEmail, err);
      }
    },
    [user?.id, user?.email]
  );

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

  const handleIncomingMessage = useCallback(
    (parsedMessage) => {
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
          (m) =>
            m.content === newMessage.content &&
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

      // Re-fetch /userinfo to pull newly created conversations & their real usernames
      if (typeof refreshUserInfo === 'function') {
        setTimeout(refreshUserInfo, 400);
      }
    },
    [user, activeRecipient, addConversation, soundEnabled, refreshUserInfo]
  );

  const appendOptimisticMessage = useCallback(
    (content, receiverId, senderEmail) => {
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

      // Re-fetch /userinfo after sending to load the newly registered DB conversation
      if (typeof refreshUserInfo === 'function') {
        setTimeout(refreshUserInfo, 500);
      }
    },
    [soundEnabled, refreshUserInfo]
  );

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

export default useChat;
