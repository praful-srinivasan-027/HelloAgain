import React, { useEffect, useRef, useLayoutEffect } from 'react';
import { MessageCircle, Lock, ShieldCheck, Loader2 } from 'lucide-react';

export function MobileChatView({
  messages = [],
  activeRecipient,
  isAuthenticated,
  onRequireAuth,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}) {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const prevMessagesLengthRef = useRef(0);
  const isNearBottomRef = useRef(true);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 120;

    if (scrollTop < 120 && hasMore && !isLoadingMore && typeof onLoadMore === 'function') {
      prevScrollHeightRef.current = scrollHeight;
      onLoadMore();
    }
  };

  const handleWheel = (e) => {
    if (!containerRef.current) return;
    if (e.deltaY < 0 && containerRef.current.scrollTop < 120 && hasMore && !isLoadingMore && typeof onLoadMore === 'function') {
      prevScrollHeightRef.current = containerRef.current.scrollHeight;
      onLoadMore();
    }
  };

  const handleTouchMove = () => {
    if (!containerRef.current) return;
    if (containerRef.current.scrollTop < 120 && hasMore && !isLoadingMore && typeof onLoadMore === 'function') {
      prevScrollHeightRef.current = containerRef.current.scrollHeight;
      onLoadMore();
    }
  };

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const isNewBatchOlder = messages.length > prevMessagesLengthRef.current && !isNearBottomRef.current;

    if (isNewBatchOlder && prevScrollHeightRef.current > 0) {
      const heightDifference = container.scrollHeight - prevScrollHeightRef.current;
      container.scrollTop += heightDifference;
    } else if (isNearBottomRef.current || prevMessagesLengthRef.current === 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    prevScrollHeightRef.current = container.scrollHeight;
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  const formatTime = (ts) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#000000] relative overflow-hidden">
      {/* Messages Scroll Area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onWheel={handleWheel}
        onTouchMove={handleTouchMove}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5"
      >
        {/* Top Loading Indicator for Infinite Scroll */}
        {hasMore && (
          <div className="flex justify-center py-1.5">
            <button
              onClick={() => {
                if (containerRef.current) {
                  prevScrollHeightRef.current = containerRef.current.scrollHeight;
                }
                onLoadMore?.();
              }}
              disabled={isLoadingMore}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-white/10 text-[11px] text-white/60 hover:text-white/90 active:bg-zinc-800 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white/70" />
                  <span>Loading earlier messages...</span>
                </>
              ) : (
                <span>↑ Scroll or tap to load earlier messages</span>
              )}
            </button>
          </div>
        )}

        {/* Security / Encryption Badge */}
        <div className="flex items-center justify-center my-1">
          <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-zinc-900/80 border border-white/10 text-[10px] text-white/50">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Connected via WebSocket · Online Server</span>
          </div>
        </div>

        {messages.length > 0 ? (
          messages.map((msg, index) => {
            const isSent = msg.type === 'sent';
            return (
              <div
                key={msg.id || index}
                className={`flex flex-col ${isSent ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-[13.5px] leading-relaxed break-words shadow-sm ${
                    isSent
                      ? 'bg-zinc-100 text-black font-normal rounded-br-sm'
                      : 'bg-zinc-900 border border-white/10 text-zinc-100 rounded-bl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                <span className="text-[10px] text-white/35 mt-1 px-1">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-white/40">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
              <MessageCircle className="w-6 h-6 text-white/30" />
            </div>
            <p className="text-sm font-semibold text-white/70 mb-1">
              Start a conversation with {activeRecipient?.username || activeRecipient?.email}
            </p>
            <p className="text-xs text-white/40 max-w-[260px]">
              Type a message below to send via the online Render server in real-time.
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Auth Banner if guest */}
      {!isAuthenticated && (
        <div className="p-2.5 bg-zinc-900/90 border-t border-white/10 flex items-center justify-between text-xs text-white/70 shrink-0">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Sign in to send and receive real-time messages</span>
          </div>
          <button
            onClick={() => onRequireAuth?.('login')}
            className="px-3 py-1 bg-white text-black font-semibold rounded-lg shrink-0 active:scale-95 transition-all text-xs"
          >
            Sign In
          </button>
        </div>
      )}
    </div>
  );
}

export default MobileChatView;
