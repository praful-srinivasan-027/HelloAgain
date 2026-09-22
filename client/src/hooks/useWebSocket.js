import { useState, useEffect, useRef, useCallback } from 'react';
import { playSendChime, playReceiveChime, playConnectChime } from '../utils/sound';

export function useWebSocket(
  initialUrl = 'ws://localhost:8000/ws',
  activeRecipientId = null,
  currentUser = null,
  onIncomingMessage = null
) {
  const [url, setUrl] = useState(() => {
    const saved = localStorage.getItem('ps_ws_url');
    // If there's a saved URL that differs from the default localhost, and it's not the old 8000 port, use it.
    // Otherwise always use the passed initialUrl.
    if (saved && !saved.includes('localhost:8000')) {
      return saved;
    }
    return initialUrl;
  });
  const [status, setStatus] = useState('disconnected'); // 'connected' | 'connecting' | 'disconnected'
  const [messages, setMessages] = useState([]);
  const [unreadMap, setUnreadMap] = useState({});
  const [telemetry, setTelemetry] = useState([]);
  const [latency, setLatency] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const pingTimestampRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;
  const isExplicitDisconnectRef = useRef(false);

  const activeRecipientIdRef = useRef(activeRecipientId);
  const currentUserRef = useRef(currentUser);
  const onIncomingMessageRef = useRef(onIncomingMessage);

  useEffect(() => {
    activeRecipientIdRef.current = activeRecipientId;
  }, [activeRecipientId]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    onIncomingMessageRef.current = onIncomingMessage;
  }, [onIncomingMessage]);

  // Clear unread indicator when active conversation changes
  useEffect(() => {
    if (activeRecipientId) {
      setUnreadMap((prev) => {
        if (!prev[activeRecipientId]) return prev;
        const next = { ...prev };
        delete next[activeRecipientId];
        return next;
      });
    }
  }, [activeRecipientId]);

  // Add telemetry frame
  const addTelemetry = useCallback((type, payload) => {
    const timestamp = new Date();
    const bytes = typeof payload === 'string' ? new Blob([payload]).size : 0;

    setTelemetry((prev) => [
      {
        id: Math.random().toString(36).substring(2, 9),
        type,
        payload,
        bytes,
        timestamp,
      },
      ...prev.slice(0, 49),
    ]);
  }, []);

  const disconnect = useCallback(() => {
    isExplicitDisconnectRef.current = true;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setStatus('disconnected');
    setLatency(null);
    addTelemetry('sys', 'Disconnected');
  }, [addTelemetry]);

  const connect = useCallback((targetUrl = url) => {

    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return true;
    }

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    isExplicitDisconnectRef.current = false;
    setStatus('connecting');
    addTelemetry('sys', `Connecting to ${targetUrl}...`);

    try {
      const ws = new WebSocket(targetUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        reconnectAttemptsRef.current = 0;
        addTelemetry('sys', 'Connected to HelloAgain');
        playConnectChime(soundEnabled);
      };

      ws.onmessage = (event) => {
        const rawData = event.data;
        addTelemetry('in', rawData);

        // Ping reply handler if any
        if (rawData === 'SERVER: Recieved ping') {
          if (pingTimestampRef.current) {
            const calculatedLatency = Math.round(performance.now() - pingTimestampRef.current);
            setLatency(calculatedLatency);
          }
          return;
        }

        let cleanContent = null;
        let incomingReceiver = null;
        let incomingSender = null;

        // 1. Parse incoming WebSocket JSON - Strict Source of Truth
        try {
          const parsed = JSON.parse(rawData);
          if (parsed && typeof parsed === 'object') {
            if (parsed.content !== undefined) cleanContent = String(parsed.content);
            if (parsed.reciever_email_address) incomingReceiver = String(parsed.reciever_email_address).trim();
            else if (parsed.receiver_id) incomingReceiver = String(parsed.receiver_id).trim();
            else if (parsed.email_address) incomingReceiver = String(parsed.email_address).trim();

            if (parsed.sender_email_address) incomingSender = String(parsed.sender_email_address).trim();
            else if (parsed.sender_email) incomingSender = String(parsed.sender_email).trim();
            else if (parsed.sender_id) incomingSender = String(parsed.sender_id).trim();
            else if (parsed.sender) incomingSender = String(parsed.sender).trim();
          }
        } catch {
          if (typeof rawData === 'string' && rawData.includes('content=')) {
            const contentMatch = rawData.match(/content=['"](.*?)['"]/);
            if (contentMatch && contentMatch[1]) cleanContent = contentMatch[1];
            const receiverMatch = rawData.match(/(?:reciever_email_address|receiver_id|email_address)=['"](.*?)['"]/);
            if (receiverMatch && receiverMatch[1]) incomingReceiver = receiverMatch[1];
            const senderMatch = rawData.match(/(?:sender_email_address|sender_id|sender_email)=['"](.*?)['"]/);
            if (senderMatch && senderMatch[1]) incomingSender = senderMatch[1];
          }
        }

        // STRICT RULE: If JSON is missing content, receiver email, or sender email, ignore safely
        if (!cleanContent || !incomingReceiver || !incomingSender) {
          console.warn('Ignoring malformed WebSocket message (missing content, receiver, or sender email):', rawData);
          addTelemetry('sys', 'Ignored malformed frame: missing content, sender or receiver email');
          return;
        }

        const currentUserEmail = (currentUserRef.current?.email || '').trim().toLowerCase();
        const currentActiveId = activeRecipientIdRef.current || null;

        // Determine conversation ID strictly from sender and receiver emails in THAT JSON
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

        setMessages((prev) => [...prev, newMessage]);

        // Register incoming conversation if callback provided
        if (conversationId) {
          onIncomingMessageRef.current?.(conversationId);
        }

        // Update unread map if message belongs to an inactive conversation
        if (currentActiveId && conversationId !== currentActiveId.toLowerCase()) {
          setUnreadMap((prev) => ({
            ...prev,
            [conversationId]: (prev[conversationId] || 0) + 1,
          }));
        }

        playReceiveChime(soundEnabled);
      };

      ws.onclose = (event) => {
        setStatus('disconnected');
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        addTelemetry('sys', `Connection closed (code: ${event.code})`);

        if (!isExplicitDisconnectRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 10000);

          reconnectTimerRef.current = setTimeout(() => {
            connect(targetUrl);
          }, delay);
        }
      };

      ws.onerror = () => {
        addTelemetry('sys', 'WebSocket encountered a connection issue');
      };
      return true;
    } catch (err) {
      setStatus('disconnected');
      addTelemetry('sys', `Connection error: ${err.message}`);
      return false;
    }
  }, [url, addTelemetry, soundEnabled]);

  /**
   * Send message complying strictly with backend Message schema:
   * { reciever_email_address, sender_email_address, content }
   */
  const sendMessage = useCallback((content, receiverId, senderEmailInput) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      addTelemetry('sys', 'Failed to send: WebSocket is not open');
      return false;
    }

    const senderEmail = (senderEmailInput || currentUserRef.current?.email || '').trim().toLowerCase();
    const targetEmail = (receiverId || '').trim().toLowerCase();

    // STRICT RULE: Reject any placeholders, "you", "me", or non-emails
    if (!senderEmail || !senderEmail.includes('@') || senderEmail === 'you' || senderEmail === 'me') {
      console.warn('Cannot send message: invalid or missing sender email address.', { senderEmail });
      addTelemetry('sys', 'Aborted send: Invalid sender email address');
      return false;
    }

    if (!targetEmail || !targetEmail.includes('@') || targetEmail === 'you' || targetEmail === 'me') {
      console.warn('Cannot send message: invalid or missing receiver email address.', { targetEmail });
      addTelemetry('sys', 'Aborted send: Invalid receiver email address');
      return false;
    }

    // Exact expected payload structure
    const payload = {
      reciever_email_address: targetEmail,
      sender_email_address: senderEmail,
      content: typeof content === 'string' ? content : JSON.stringify(content),
    };

    const jsonString = JSON.stringify(payload);
    socketRef.current.send(jsonString);
    addTelemetry('out', jsonString);

    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        type: 'sent',
        sender: senderEmail,
        content: payload.content,
        receiverId: targetEmail,
        timestamp: new Date(),
      },
    ]);

    playSendChime(soundEnabled);
    return true;
  }, [addTelemetry, soundEnabled]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const clearTelemetry = useCallback(() => {
    setTelemetry([]);
  }, []);

  // Connection lifecycle
  useEffect(() => {
    connect(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, connect]);

  const updateUrl = useCallback((newUrl) => {
    setUrl(newUrl);
    localStorage.setItem('ps_ws_url', newUrl);
    disconnect();
    setTimeout(() => {
      connect(newUrl);
    }, 100);
  }, [connect, disconnect]);

  return {
    url,
    updateUrl,
    status,
    messages,
    unreadMap,
    telemetry,
    latency,
    soundEnabled,
    setSoundEnabled,
    connect,
    disconnect,
    sendMessage,
    clearMessages,
    clearTelemetry,
  };
}
