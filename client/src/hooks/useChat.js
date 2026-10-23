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

  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isFetchingRef = useRef(false);
  const historyPoolRef = useRef({});
  const displayedCountRef = useRef({});
  const serverHasMoreRef = useRef({});
  const serverRequestedLimitRef = useRef({});

  const parseMessageList = useCallback(
    (rawList, recipientEmail) => {
      if (!Array.isArray(rawList)) return [];
      return rawList.map((msgItem, idx) => {
        let senderId, content, sentAt, dbId = null;
        if (Array.isArray(msgItem)) {
          if (msgItem.length >= 4) {
            // Check if index 3 is dbId or index 0 is dbId
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
        const contentStr = typeof content === 'string' ? content : JSON.stringify(content || '');
        const timeKey = !isNaN(parsedTime.getTime()) ? parsedTime.getTime() : String(sentAt);
        // Deterministic uniqueId so messages deduplicate cleanly across different page limits
        const uniqueId = dbId != null
          ? `db_${dbId}`
          : `msg_${senderId}_${timeKey}_${contentStr.slice(0, 32)}`;

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
    async (recipientEmail, initialLimit = 50) => {
      if (!recipientEmail || isFetchingRef.current) return;
      const cleanEmail = recipientEmail.trim().toLowerCase();
      const PAGE_CHUNK = 20;

      isFetchingRef.current = true;
      serverHasMoreRef.current[cleanEmail] = true;
      serverRequestedLimitRef.current[cleanEmail] = initialLimit;

      try {
        const data = await fetchMessageHistory(cleanEmail, null, initialLimit);
        if (data && Array.isArray(data.Messages)) {
          const parsedBatch = parseMessageList(data.Messages, cleanEmail);
          // Sort ascending (oldest first, newest last)
          parsedBatch.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

          if (parsedBatch.length < initialLimit) {
            serverHasMoreRef.current[cleanEmail] = false;
          }

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
            const hasMoreMessages = serverHasMoreRef.current[cleanEmail] !== false && parsedBatch.length > 0;
            setHasMore(hasMoreMessages);
          }
        } else {
          serverHasMoreRef.current[cleanEmail] = false;
          setHasMore(false);
        }
      } catch (err) {
        console.warn('[useChat] Failed to load message history for', cleanEmail, err);
      } finally {
        setIsLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [parseMessageList]
  );

  const loadMoreMessages = useCallback(async () => {
    if (!activeRecipient?.email || isLoadingMore || !hasMore || isFetchingRef.current) return;
    const cleanEmail = activeRecipient.email.trim().toLowerCase();
    const PAGE_CHUNK = 20;
    const pool = historyPoolRef.current[cleanEmail] || [];
    const currentShown = displayedCountRef.current[cleanEmail] || PAGE_CHUNK;

    // 1. If we have more messages already cached in local history pool, reveal the next chunk
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

      const poolHasMore = nextShown < pool.length;
      const serverHasMore = serverHasMoreRef.current[cleanEmail] !== false;
      setHasMore(poolHasMore || serverHasMore);
      setIsLoadingMore(false);
      return;
    }

    // 2. Local pool is completely displayed. Check if server might have older messages
    if (serverHasMoreRef.current[cleanEmail] === false) {
      setHasMore(false);
      return;
    }

    // 3. Fetch older messages from server
    isFetchingRef.current = true;
    setIsLoadingMore(true);

    try {
      const oldestMsg = pool[0];
      const beforeId = oldestMsg?.dbId != null ? oldestMsg.dbId : null;

      let data;
      if (beforeId != null) {
        // Backend returned explicit dbId: paginate with before_id
        data = await fetchMessageHistory(cleanEmail, beforeId, 50);
      } else {
        // Backend returns 3-tuple without dbId: paginate by requesting larger limit
        const prevLimit = serverRequestedLimitRef.current[cleanEmail] || Math.max(50, pool.length);
        const nextLimit = prevLimit + 50;
        serverRequestedLimitRef.current[cleanEmail] = nextLimit;
        data = await fetchMessageHistory(cleanEmail, null, nextLimit);
      }

      if (data && Array.isArray(data.Messages)) {
        const parsedBatch = parseMessageList(data.Messages, cleanEmail);
        parsedBatch.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        const existingPoolIds = new Set(pool.map((m) => m.id));
        const freshItems = parsedBatch.filter((m) => !existingPoolIds.has(m.id));

        if (freshItems.length === 0) {
          serverHasMoreRef.current[cleanEmail] = false;
          setHasMore(false);
        } else {
          if (beforeId != null) {
            if (freshItems.length < 50) {
              serverHasMoreRef.current[cleanEmail] = false;
            }
          } else {
            const currentReqLimit = serverRequestedLimitRef.current[cleanEmail] || 50;
            if (parsedBatch.length < currentReqLimit) {
              serverHasMoreRef.current[cleanEmail] = false;
            }
          }

          const updatedPool = [...freshItems, ...pool];
          updatedPool.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          historyPoolRef.current[cleanEmail] = updatedPool;

          const nextShown = Math.min(currentShown + PAGE_CHUNK, updatedPool.length);
          displayedCountRef.current[cleanEmail] = nextShown;

          const sliceToShow = updatedPool.slice(Math.max(0, updatedPool.length - nextShown));
          setMessages((prev) => {
            const otherMessages = prev.filter(
              (m) => (m.receiverId || '').toLowerCase() !== cleanEmail
            );
            return [...otherMessages, ...sliceToShow];
          });

          const poolHasMore = nextShown < updatedPool.length;
          const serverHasMore = serverHasMoreRef.current[cleanEmail] !== false;
          setHasMore(poolHasMore || serverHasMore);
        }
      } else {
        serverHasMoreRef.current[cleanEmail] = false;
        setHasMore(false);
      }
    } catch (err) {
      console.warn('[useChat] Failed to load older messages for', cleanEmail, err);
    } finally {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [activeRecipient?.email, isLoadingMore, hasMore, parseMessageList]);

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
    loadMoreMessages,
    hasMore,
    isLoadingMore,
  };
}

export default useChat;
