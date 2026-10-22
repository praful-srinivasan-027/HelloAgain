import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { playConnectChime, playReceiveChime } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';
import { getWsBaseUrl } from '../services/api';

/**
 * Mobile-optimized WebSocket hook for Android client
 */
export function useWebSocket({
  token = null,
  isAuthenticated = false,
  onIncomingMessage = null,
  soundEnabled = true,
  serverUrl = null,
}) {
  const effectiveUrl = useMemo(() => {
    return getWsBaseUrl(token);
  }, [token, serverUrl]);

  const [status, setStatus] = useState('disconnected'); // 'connected' | 'connecting' | 'disconnected'
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 20;
  const isExplicitDisconnectRef = useRef(false);

  const onIncomingMessageRef = useRef(onIncomingMessage);
  useEffect(() => {
    onIncomingMessageRef.current = onIncomingMessage;
  }, [onIncomingMessage]);

  const clearPendingReconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    isExplicitDisconnectRef.current = true;
    clearPendingReconnect();
    if (socketRef.current) {
      try {
        socketRef.current.close(1000, 'Client closed');
      } catch {}
      socketRef.current = null;
    }
    setStatus('disconnected');
  }, [clearPendingReconnect]);

  const connect = useCallback((targetUrl = effectiveUrl) => {
    if (!targetUrl) return false;

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      return true;
    }

    clearPendingReconnect();
    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch {}
      socketRef.current = null;
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
        triggerHaptic('light');
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
          return;
        }

        playReceiveChime(soundEnabled);
        triggerHaptic('medium');

        onIncomingMessageRef.current?.({
          cleanContent,
          incomingReceiver,
          incomingSender,
        });
      };

      ws.onclose = (event) => {
        setStatus('disconnected');

        if (isExplicitDisconnectRef.current || !isAuthenticated) {
          return;
        }

        if (event.code === 1008) {
          console.warn('WebSocket unauthorized (1008)');
          return;
        }

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(1.4, reconnectAttemptsRef.current), 8000);
          reconnectTimerRef.current = setTimeout(() => {
            connect(targetUrl);
          }, delay);
        }
      };

      ws.onerror = (err) => {
        console.warn('WebSocket error:', err);
      };

      return true;
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setStatus('disconnected');
      return false;
    }
  }, [effectiveUrl, isAuthenticated, soundEnabled, clearPendingReconnect]);

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
    if (isAuthenticated && effectiveUrl) {
      reconnectAttemptsRef.current = 0;
      connect(effectiveUrl);
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, effectiveUrl, connect, disconnect]);

  return {
    url: effectiveUrl,
    status,
    connect,
    disconnect,
    sendWsMessage,
  };
}

export default useWebSocket;
