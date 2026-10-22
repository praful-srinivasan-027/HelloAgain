import React, { useEffect, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, LogIn, UserPlus, Copy, Check, Loader2 } from 'lucide-react';

export function ChatFeed({
  messages = [],
  isAuthenticated,
  onRequireAuth,
  activeRecipient,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}) {
  const containerRef = useRef(null);
  const [copiedId, setCopiedId] = React.useState(null);
  const prevScrollHeightRef = useRef(0);
  const prevMessagesLengthRef = useRef(0);
  const isNearBottomRef = useRef(true);

  // Monitor scroll position
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 120;

    // Trigger loading older messages when near top
    if (scrollTop < 50 && hasMore && !isLoadingMore && typeof onLoadMore === 'function') {
      prevScrollHeightRef.current = scrollHeight;
      onLoadMore();
    }
  };

  // Preserve scroll position when older messages are prepended to the top
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const isNewBatchOlder = messages.length > prevMessagesLengthRef.current && !isNearBottomRef.current;

    if (isNewBatchOlder && prevScrollHeightRef.current > 0) {
      const heightDifference = container.scrollHeight - prevScrollHeightRef.current;
      container.scrollTop += heightDifference;
    } else if (isNearBottomRef.current || prevMessagesLengthRef.current === 0) {
      container.scrollTop = container.scrollHeight;
    }

    prevScrollHeightRef.current = container.scrollHeight;
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#000000]"
    >
      {/* Top Loading Indicator for Infinite Scroll */}
      {hasMore && (
        <div className="flex justify-center py-2">
          {isLoadingMore ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/50">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white/70" />
              <span>Loading earlier messages...</span>
            </div>
          ) : (
            <button
              onClick={() => {
                if (containerRef.current) {
                  prevScrollHeightRef.current = containerRef.current.scrollHeight;
                }
                onLoadMore?.();
              }}
              className="text-[11px] text-white/40 hover:text-white/70 px-3 py-1 rounded-full hover:bg-white/5 transition-all cursor-pointer"
            >
              Scroll up or click to load earlier messages
            </button>
          )}
        </div>
      )}
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
            Chatting with{' '}
            <span className="font-semibold text-white">
              {activeRecipient.username || activeRecipient.email || activeRecipient.id}
            </span>
          </h3>
          <div className="text-xs text-white/50">
            {activeRecipient.username && (
              <span className="font-mono text-white/30 block mb-1">{activeRecipient.email}</span>
            )}
            <span>No messages yet. Type your message below to send.</span>
          </div>
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
                    <span className="text-[11px] text-white/50 font-medium px-1">
                      {activeRecipient?.username || activeRecipient?.email || msg.sender}
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

export default ChatFeed;
