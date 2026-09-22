import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Bot, User, Copy, Check, ShieldAlert, LogIn, UserPlus } from 'lucide-react';

export function ChatFeed({ messages, onSelectPrompt, isAuthenticated, onRequireAuth }) {
  const containerRef = useRef(null);
  const [copiedId, setCopiedId] = React.useState(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const isJson = (str) => {
    try {
      const obj = JSON.parse(str);
      return typeof obj === 'object' && obj !== null;
    } catch {
      return false;
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5 scroll-smooth bg-black"
    >
      {/* If unauthenticated and no messages, show prominent Sign In Hero */}
      {!isAuthenticated && messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-lg mx-auto my-auto text-white/70">
          <div className="w-14 h-14 rounded-2xl bg-black border border-white/20 flex items-center justify-center text-white mb-4 shadow-[0_0_30px_rgba(255,255,255,0.08)]">
            <ShieldAlert className="w-7 h-7 stroke-[1.8]" />
          </div>
          <h2 className="text-[26px] font-semibold text-white tracking-[-0.28px] leading-tight mb-2">
            Authentication Required
          </h2>
          <p className="text-[15px] text-white/60 leading-[1.47] tracking-[-0.374px] max-w-md mb-6">
            The FastAPI WebSocket endpoint enforces OAuth2 JWT authentication. Please sign in or create an account in <code className="text-white font-mono text-xs">userTable</code> to start streaming.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onRequireAuth?.('login')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-white/90 text-black text-[13px] font-semibold transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In (POST /login)</span>
            </button>
            <button
              onClick={() => onRequireAuth?.('register')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 text-[13px] font-medium transition-all active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register</span>
            </button>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-lg mx-auto my-auto text-white/70">
          <div className="w-14 h-14 rounded-2xl bg-black border border-white/20 flex items-center justify-center text-white mb-4">
            <MessageSquare className="w-7 h-7 stroke-[1.8]" />
          </div>
          <h2 className="text-[26px] font-semibold text-white tracking-[-0.28px] leading-tight mb-2">
            ConnectX Stream
          </h2>
          <p className="text-[16px] text-white/60 leading-[1.47] tracking-[-0.374px] max-w-md mb-8">
            Minimalist duplex messaging. Transmit payloads with instantaneous WebSocket feedback.
          </p>

          <div className="flex flex-wrap gap-2.5 justify-center">
            <button
              onClick={() => onSelectPrompt('Hello from ConnectX client!')}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-black hover:bg-white hover:text-black border border-white/20 text-[13px] text-white transition-all active:scale-95 cursor-pointer font-medium"
            >
              <span>Hello Server</span>
            </button>
            <button
              onClick={() => onSelectPrompt(JSON.stringify({ action: 'ping', timestamp: Date.now() }, null, 2))}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-black hover:bg-white hover:text-black border border-white/20 text-[13px] text-white transition-all active:scale-95 cursor-pointer font-medium"
            >
              <span>JSON Ping</span>
            </button>
            <button
              onClick={() => onSelectPrompt(JSON.stringify({ schema: 'userTable', fields: ['id', 'username', 'email'] }, null, 2))}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-black hover:bg-white hover:text-black border border-white/20 text-[13px] text-white transition-all active:scale-95 cursor-pointer font-medium"
            >
              <span>Inspect userTable</span>
            </button>
          </div>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isSent = msg.type === 'sent';
            const jsonFormatted = isJson(msg.content);
            const timeString = new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.16 }}
                className={`flex items-start gap-3 group max-w-2xl ${
                  isSent ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar Tile */}
                <div
                  className={`w-7 h-7 rounded-[8px] shrink-0 flex items-center justify-center text-xs font-medium border ${
                    isSent
                      ? 'bg-white text-black border-white'
                      : 'bg-black border-white/20 text-white'
                  }`}
                >
                  {isSent ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Message Body */}
                <div className={`flex flex-col gap-1 ${isSent ? 'items-end' : 'items-start'}`}>
                  {/* Meta */}
                  <div className="flex items-center gap-2 px-1 text-[12px] text-white/50 tracking-[-0.12px]">
                    <span className="font-semibold text-white/80">{msg.sender}</span>
                    <span>•</span>
                    <span>{timeString}</span>
                  </div>

                  {/* Bubble */}
                  <div
                    className={`relative px-4 py-2.5 rounded-[18px] text-[15px] leading-[1.47] tracking-[-0.374px] transition-all ${
                      isSent
                        ? 'bg-white text-black rounded-tr-[4px] font-normal'
                        : 'bg-black text-white border border-white/20 rounded-tl-[4px]'
                    }`}
                  >
                    {msg.isServerEcho && (
                      <div className="mb-1.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
                          SERVER ECHO
                        </span>
                      </div>
                    )}

                    {jsonFormatted ? (
                      <pre className="font-mono text-xs overflow-x-auto p-2.5 rounded-[11px] bg-black border border-white/20 my-1 text-white">
                        <code>{JSON.stringify(JSON.parse(msg.content), null, 2)}</code>
                      </pre>
                    ) : (
                      <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                    )}

                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      title="Copy payload"
                      className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-full transition-all active:scale-90 ${
                        isSent
                          ? 'bg-black/10 hover:bg-black/20 text-black'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
    </div>
  );
}
