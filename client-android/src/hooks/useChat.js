import { useState, useCallback, useEffect } from 'react';
import { fetchMessageHistory } from '../services/api';
import { playSendChime, playReceiveChime } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';

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

      // Overlay with verified backend contacts
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

  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isFetchingRef = useRef(false);
  const historyPoolRef = useRef({});
  const displayedCountRef = useRef({});

  const parseMessageList = useCallback(
    (rawList, recipientEmail) => {
      if (!Array.isArray(rawList)) return [];
      return rawList.map((msgItem, idx) => {
        let senderId, content, sentAt, dbId = null;
        if (Array.isArray(msgItem)) {
          if (msgItem.length >= 4) {
            if (typeof msgItem[3] === 'number') {
              senderId = msgItem[0];
              content = msgItem[1];
              sentAt = msgItem[2];
              dbId = msgItem[3];
            } else if (typeof msgItem[0] === 'number' && typeof msgItem[1] === 'number') {
              dbId = msgItem[0];
              senderId = msgItem[1];
              content = msgItem[2];
              sentAt = msgItem[3];
            } else {
              senderId = msgItem[0];
              content = msgItem[1];
              sentAt = msgItem[2];
            }
          } else {
            senderId = msgItem[0];
            content = msgItem[1];
            sentAt = msgItem[2];
          }
        } else if (msgItem && typeof msgItem === 'object') {
          senderId = msgItem.sender_id || msgItem.sender;
          content = msgItem.message_content || msgItem.content;
          sentAt = msgItem.sent_at || msgItem.timestamp;
          dbId = msgItem.id ?? null;
        }

        const isSent = String(senderId) === String(user?.id);
        const parsedTime = sentAt ? new Date(sentAt) : new Date();
        const uniqueId = dbId != null
          ? `db_${dbId}`
          : `msg_${senderId}_${parsedTime.getTime()}_${idx}`;

        return {
          id: uniqueId,
          dbId: dbId ?? null,
          type: isSent ? 'sent' : 'received',
          sender: isSent ? user?.email : recipientEmail,
          content: content || '',
          receiverId: recipientEmail,
          timestamp: parsedTime,
        };
      });
    },
    [user?.id, user?.email]
  );

  const loadHistory = useCallback(
    async (recipientEmail, beforeId = null, isPaging = false) => {
      if (!recipientEmail || isFetchingRef.current) return;
      const cleanEmail = recipientEmail.trim().toLowerCase();
      const PAGE_CHUNK = 20;

      // Handle pagination when older messages already exist in client history pool
      if (isPaging) {
        const pool = historyPoolRef.current[cleanEmail] || [];
        const currentShown = displayedCountRef.current[cleanEmail] || PAGE_CHUNK;

        if (currentShown < pool.length) {
          setIsLoadingMore(true);
          const nextShown = Math.min(currentShown + PAGE_CHUNK, pool.length);
          displayedCountRef.current[cleanEmail] = nextShown;

          const sliceToShow = pool.slice(Math.max(0, pool.length - nextShown));
          setMessages((prev) => {
            const otherMessages = prev.filter(
              (m) => (m.receiverId || '').toLowerCase() !== cleanEmail
            );
            return [...otherMessages, ...sliceToShow];
          });

          setHasMore(nextShown < pool.length || (pool[0]?.dbId != null));
          setIsLoadingMore(false);
          return;
        }

        if (!beforeId) {
          setHasMore(false);
          return;
        }

        setIsLoadingMore(true);
      }

      isFetchingRef.current = true;
      try {
        const data = await fetchMessageHistory(cleanEmail, null, 50, beforeId);
        if (data && Array.isArray(data.Messages)) {
          const parsedBatch = parseMessageList(data.Messages, cleanEmail);
          parsedBatch.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

          if (isPaging) {
            const currentPool = historyPoolRef.current[cleanEmail] || [];
            const existingPoolIds = new Set(currentPool.map((m) => m.id));
            const freshItems = parsedBatch.filter((m) => !existingPoolIds.has(m.id));

            if (freshItems.length === 0) {
              setHasMore(false);
            } else {
              const updatedPool = [...freshItems, ...currentPool];
              updatedPool.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
              historyPoolRef.current[cleanEmail] = updatedPool;

              const currentShown = displayedCountRef.current[cleanEmail] || PAGE_CHUNK;
              const nextShown = currentShown + freshItems.length;
              displayedCountRef.current[cleanEmail] = nextShown;

              const sliceToShow = updatedPool.slice(Math.max(0, updatedPool.length - nextShown));
              setMessages((prev) => {
                const otherMessages = prev.filter(
                  (m) => (m.receiverId || '').toLowerCase() !== cleanEmail
                );
                return [...otherMessages, ...sliceToShow];
              });

              setHasMore(freshItems.length >= 50 && (freshItems[0]?.dbId != null));
            }
          } else {
            historyPoolRef.current[cleanEmail] = parsedBatch;

            if (parsedBatch.length > PAGE_CHUNK) {
              displayedCountRef.current[cleanEmail] = PAGE_CHUNK;
              const initialSlice = parsedBatch.slice(-PAGE_CHUNK);
              setMessages((prev) => {
                const otherMessages = prev.filter(
                  (m) => (m.receiverId || '').toLowerCase() !== cleanEmail
                );
                return [...otherMessages, ...initialSlice];
              });
              setHasMore(true);
            } else {
              displayedCountRef.current[cleanEmail] = parsedBatch.length;
              setMessages((prev) => {
                const otherMessages = prev.filter(
                  (m) => (m.receiverId || '').toLowerCase() !== cleanEmail
                );
                return [...otherMessages, ...parsedBatch];
              });
              setHasMore(parsedBatch.length === 50 && (parsedBatch[0]?.dbId != null));
            }
          }
        } else {
          setHasMore(false);
        }
      } catch (err) {
        console.warn('[useChat] Failed to load history:', err.message);
      } finally {
        setIsLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [parseMessageList]
  );

  const loadMoreMessages = useCallback(() => {
    if (!activeRecipient?.email || isLoadingMore || !hasMore || isFetchingRef.current) return;
    const cleanEmail = activeRecipient.email.trim().toLowerCase();
    const pool = historyPoolRef.current[cleanEmail] || [];
    const currentShown = displayedCountRef.current[cleanEmail] || 20;

    if (currentShown < pool.length) {
      loadHistory(cleanEmail, null, true);
      return;
    }

    const currentConvoMessages = messages.filter(
      (m) => (m.receiverId || '').toLowerCase() === cleanEmail
    );
    const oldestMsg = currentConvoMessages[0] || pool[0];
    const beforeId = oldestMsg?.dbId != null ? oldestMsg.dbId : null;

    if (beforeId != null) {
      loadHistory(cleanEmail, beforeId, true);
    } else {
      setHasMore(false);
    }
  }, [activeRecipient?.email, isLoadingMore, hasMore, messages, loadHistory]);

  useEffect(() => {
    if (activeRecipient?.email) {
      setHasMore(true);
      loadHistory(activeRecipient.email, null, false);
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
        if (historyPoolRef.current[conversationId]) {
          historyPoolRef.current[conversationId].push(newMessage);
          displayedCountRef.current[conversationId] = (displayedCountRef.current[conversationId] || 0) + 1;
        }
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
        triggerHaptic('medium');
      }

      if (typeof refreshUserInfo === 'function') {
        setTimeout(refreshUserInfo, 400);
      }
    },
    [user, activeRecipient, addConversation, soundEnabled, refreshUserInfo]
  );

  const appendOptimisticMessage = useCallback(
    (content, receiverId, senderEmail) => {
      const cleanConvoId = (receiverId || '').trim().toLowerCase();
      const newMsg = {
        id: Math.random().toString(36).substring(2, 9),
        type: 'sent',
        sender: senderEmail,
        content,
        receiverId: cleanConvoId,
        timestamp: new Date(),
      };

      if (historyPoolRef.current[cleanConvoId]) {
        historyPoolRef.current[cleanConvoId].push(newMsg);
        displayedCountRef.current[cleanConvoId] = (displayedCountRef.current[cleanConvoId] || 0) + 1;
      }

      setMessages((prev) => [...prev, newMsg]);
      playSendChime(soundEnabled);
      triggerHaptic('light');

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
    loadMoreMessages,
    hasMore,
    isLoadingMore,
  };
}

export default useChat;
