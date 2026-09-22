import { useState, useEffect, useRef, useCallback } from 'react';
import { playSendChime, playReceiveChime, playConnectChime } from '../utils/sound';

export function useWebSocket(initialUrl = 'ws://127.0.0.1:8000/ws', token = null) {
  const [url, setUrl] = useState(() => localStorage.getItem('ps_ws_url') || initialUrl);
  const [status, setStatus] = useState('disconnected'); // 'connected' | 'connecting' | 'disconnected'
  const [messages, setMessages] = useState([]);
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
    if (!token) {
      addTelemetry('sys', 'WebSocket connection aborted: Authentication token required. Please sign in.');
      setStatus('disconnected');
      return false;
    }

    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return true;
    }

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    isExplicitDisconnectRef.current = false;
    setStatus('connecting');
    addTelemetry('sys', `Connecting to ${targetUrl} with JWT Auth...`);

    try {
      // Build authorized WebSocket URL
      let wsUrl = targetUrl;
      if (token) {
        const separator = wsUrl.includes('?') ? '&' : '?';
        // Avoid duplicate token parameter
        if (!wsUrl.includes('token=')) {
          wsUrl = `${wsUrl}${separator}token=${encodeURIComponent(token)}`;
        }
      }

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        reconnectAttemptsRef.current = 0;
        addTelemetry('sys', 'WebSocket connection established (Authenticated session)');
        playConnectChime(soundEnabled);

        // Start ping heartbeat every 30s
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            pingTimestampRef.current = performance.now();
            ws.send('ping');
            addTelemetry('out', 'ping');
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        const rawData = event.data;
        addTelemetry('in', rawData);

        // Ping reply handler
        if (rawData === 'SERVER: Recieved ping') {
          if (pingTimestampRef.current) {
            const calculatedLatency = Math.round(performance.now() - pingTimestampRef.current);
            setLatency(calculatedLatency);
          }
          return;
        }

        // Standard message parse
        let content = rawData;
        let isServerEcho = false;

        if (typeof rawData === 'string' && rawData.startsWith('SERVER: Recieved ')) {
          content = rawData.replace('SERVER: Recieved ', '');
          isServerEcho = true;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            type: 'received',
            sender: isServerEcho ? 'FastAPI Server' : 'Remote Peer',
            isServerEcho,
            content,
            timestamp: new Date(),
          },
        ]);

        playReceiveChime(soundEnabled);
      };

      ws.onclose = (event) => {
        setStatus('disconnected');
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        addTelemetry('sys', `Connection closed (code: ${event.code})`);

        if (!isExplicitDisconnectRef.current && reconnectAttemptsRef.current < maxReconnectAttempts && token) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 10000);
          addTelemetry('sys', `Reconnecting in ${(delay / 1000).toFixed(1)}s (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimerRef.current = setTimeout(() => {
            connect(targetUrl);
          }, delay);
        }
      };

      ws.onerror = () => {
        addTelemetry('sys', 'WebSocket encountered an error during connection');
      };
      return true;
    } catch (err) {
      setStatus('disconnected');
      addTelemetry('sys', `Connection error: ${err.message}`);
      return false;
    }
  }, [url, token, addTelemetry, soundEnabled]);

  const sendMessage = useCallback((content, sender = 'You') => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      addTelemetry('sys', 'Failed to send: WebSocket is not open');
      return false;
    }

    socketRef.current.send(content);
    addTelemetry('out', content);

    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        type: 'sent',
        sender,
        content,
        timestamp: new Date(),
      },
    ]);

    playSendChime(soundEnabled);
    return true;
  }, [addTelemetry, soundEnabled]);

  const sendPing = useCallback(() => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return false;
    }
    pingTimestampRef.current = performance.now();
    socketRef.current.send('ping');
    addTelemetry('out', 'ping');
    return true;
  }, [addTelemetry]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const clearTelemetry = useCallback(() => {
    setTelemetry([]);
  }, []);

  // Handle Token Lifecycle
  useEffect(() => {
    if (token) {
      connect(url);
    } else {
      disconnect();
    }
  }, [token, url, connect, disconnect]);

  const updateUrl = useCallback((newUrl) => {
    setUrl(newUrl);
    localStorage.setItem('ps_ws_url', newUrl);
    disconnect();
    setTimeout(() => {
      if (token) {
        connect(newUrl);
      }
    }, 100);
  }, [token, connect, disconnect]);

  return {
    url,
    updateUrl,
    status,
    messages,
    telemetry,
    latency,
    soundEnabled,
    setSoundEnabled,
    connect,
    disconnect,
    sendMessage,
    sendPing,
    clearMessages,
    clearTelemetry,
  };
}
