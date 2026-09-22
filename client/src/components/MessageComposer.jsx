import React, { useState, useRef, useEffect } from 'react';
import { Send, Lock } from 'lucide-react';

export function MessageComposer({
  onSendMessage,
  isConnected,
  isAuthenticated,
  onRequireAuth,
  prefillValue,
  onClearPrefill,
}) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  // Sync prefill from parent presets
  useEffect(() => {
    if (prefillValue) {
      setText(prefillValue);
      onClearPrefill();
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [prefillValue, onClearPrefill]);

  // Handle auto-grow
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSend = () => {
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }
    const trimmed = text.trim();
    if (!trimmed || !isConnected) return;

    onSendMessage(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 sm:px-8 bg-black border-t border-white/10 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between p-3.5 px-5 bg-white/5 border border-white/20 rounded-[20px]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-white">Authentication Required</div>
              <div className="text-[11.5px] text-white/50">
                You must be logged in to transmit messages over the WebSocket channel.
              </div>
            </div>
          </div>
          <button
            onClick={onRequireAuth}
            className="px-4 py-2 rounded-full bg-white hover:bg-white/90 text-black font-semibold text-[12px] transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            Sign In / Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:px-8 bg-black border-t border-white/10 shrink-0">
      <div className="max-w-4xl mx-auto flex flex-col gap-2.5">
        {/* Input Box */}
        <div className="flex items-end gap-2 p-2 bg-black border border-white/20 focus-within:border-white rounded-[24px] transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isConnected
                ? 'Type a message or JSON payload (Enter to send, Shift+Enter for newline)...'
                : 'Connect to WebSocket to start transmitting...'
            }
            disabled={!isConnected}
            className="flex-1 bg-transparent px-4 py-1.5 text-[15px] sm:text-[16px] text-white placeholder:text-white/40 outline-none resize-none max-h-32 min-h-[28px] font-sans leading-[1.47] tracking-[-0.374px] disabled:opacity-40"
            spellCheck={false}
          />

          <button
            onClick={handleSend}
            disabled={!isConnected || !text.trim()}
            title="Send (Enter)"
            className="p-2.5 rounded-full bg-white hover:bg-white/90 disabled:opacity-20 disabled:hover:bg-white text-black transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed active:scale-95 shadow-sm font-semibold"
          >
            <Send className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* Footer Meta */}
        <div className="flex items-center justify-between text-[12px] text-white/50 tracking-[-0.12px] px-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded-[5px] bg-black text-white font-mono text-[10px] border border-white/20">
                Enter
              </kbd>{' '}
              to transmit
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded-[5px] bg-black text-white font-mono text-[10px] border border-white/20">
                Shift+Enter
              </kbd>{' '}
              for newline
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-white/50">
            <span>{text.length} chars</span>
          </div>
        </div>
      </div>
    </div>
  );
}
