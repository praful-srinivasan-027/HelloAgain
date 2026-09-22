import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, LogIn, UserPlus, Copy, Check } from 'lucide-react';

export function ChatFeed({
  messages,
  isAuthenticated,
  onRequireAuth,
  activeRecipient,
}) {
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

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scroll-smooth bg-[#000000]"
    >
      {!isAuthenticated ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto my-auto text-white/70">
          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-[26px] font-semibold text-white tracking-[-0.4px] leading-tight mb-2">
            Welcome to HelloAgain
          </h2>
          <p className="text-[14.5px] text-white/60 leading-relaxed max-w-sm mb-6">
            Sign in to search for users by email and start messaging in real time.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onRequireAuth?.('login')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white hover:bg-white/90 text-black text-[13.5px] font-semibold transition-all cursor-pointer shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => onRequireAuth?.('register')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-[13.5px] font-medium transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </button>
          </div>
        </div>
      ) : !activeRecipient ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto my-auto text-white/60">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-medium text-white mb-1">No Chat Selected</h3>
          <p className="text-xs text-white/50 max-w-xs">
            Enter a user's email address in the search bar to start a conversation.
          </p>
        </div>
      ) : messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto my-auto text-white/60">
          <h3 className="text-lg font-medium text-white mb-1">
            Chatting with <span className="font-mono text-white">{activeRecipient.id}</span>
          </h3>
          <p className="text-xs text-white/50">
            No messages yet. Type your message below to send.
          </p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isSent = msg.type === 'sent';
            const timeString = new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={`flex items-end gap-2.5 group max-w-xl ${
                  isSent ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div className={`flex flex-col gap-1 ${isSent ? 'items-end' : 'items-start'}`}>
                  {!isSent && (
                    <span className="text-[11px] text-white/40 font-mono px-1">
                      {msg.sender}
                    </span>
                  )}

                  <div
                    className={`relative px-4 py-2.5 rounded-xl text-[14px] leading-relaxed transition-all shadow-sm ${
                      isSent
                        ? 'bg-white text-black font-normal'
                        : 'glass-panel text-white'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>

                    <div
                      className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] ${
                        isSent ? 'text-black/50' : 'text-white/40'
                      }`}
                    >
                      <span>{timeString}</span>
                    </div>

                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      title="Copy text"
                      className={`absolute -top-2 ${
                        isSent ? '-left-2' : '-right-2'
                      } opacity-0 group-hover:opacity-100 p-1.5 rounded-full bg-black border border-white/20 text-white transition-all cursor-pointer shadow-lg`}
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
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
