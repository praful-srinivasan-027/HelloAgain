import { useState, useEffect, useRef, useCallback } from 'react';
import { playConnectChime } from '../utils/sound';

export function useWebSocket(
  initialUrl = 'ws://localhost:8000/ws',
  onIncomingMessage = null,
  soundEnabled = true
) {
  const [url, setUrl] = useState(() => {
    const saved = localStorage.getItem('ps_ws_url');
    if (saved && (saved.includes('localhost:8000') || saved.includes('127.0.0.1:8000'))) {
      return initialUrl;
    }
    return saved || initialUrl;
  });
  const [status, setStatus] = useState('disconnected'); // 'connected' | 'connecting' | 'disconnected'
  
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;
  const isExplicitDisconnectRef = useRef(false);

  const onIncomingMessageRef = useRef(onIncomingMessage);

  useEffect(() => {
    onIncomingMessageRef.current = onIncomingMessage;
  }, [onIncomingMessage]);

  const disconnect = useCallback(() => {
    isExplicitDisconnectRef.current = true;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setStatus('disconnected');
  }, []);

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

    try {
      const ws = new WebSocket(targetUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        reconnectAttemptsRef.current = 0;
        playConnectChime(soundEnabled);
      };

      ws.onmessage = (event) => {
        const rawData = event.data;
        if (rawData === 'SERVER: Recieved ping') return;

        let cleanContent = null;
        let incomingReceiver = null;
        let incomingSender = null;

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

        if (!cleanContent || !incomingReceiver || !incomingSender) {
          console.warn('Ignoring malformed WebSocket message:', rawData);
          return;
        }

        onIncomingMessageRef.current?.({
          cleanContent,
          incomingReceiver,
          incomingSender
        });
      };

      ws.onclose = (event) => {
        setStatus('disconnected');
        if (!isExplicitDisconnectRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 10000);
          reconnectTimerRef.current = setTimeout(() => connect(targetUrl), delay);
        }
      };

      ws.onerror = () => {
        // Handle silently to avoid spamming console
      };
      
      return true;
    } catch (err) {
      setStatus('disconnected');
      return false;
    }
  }, [url, soundEnabled]);

  const sendWsMessage = useCallback((content, receiverId, senderEmailInput) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return false;
    }

    const senderEmail = (senderEmailInput || '').trim().toLowerCase();
    const targetEmail = (receiverId || '').trim().toLowerCase();

    if (!senderEmail || !senderEmail.includes('@') || !targetEmail || !targetEmail.includes('@')) {
      return false;
    }

    const payload = {
      reciever_email_address: targetEmail,
      sender_email_address: senderEmail,
      content: typeof content === 'string' ? content : JSON.stringify(content),
      sent_at: new Date().toISOString(),
    };

    socketRef.current.send(JSON.stringify(payload));
    return true;
  }, []);

  useEffect(() => {
    connect(url);
  }, [url, connect]);

  return {
    url,
    status,
    connect,
    disconnect,
    sendWsMessage,
  };
}
