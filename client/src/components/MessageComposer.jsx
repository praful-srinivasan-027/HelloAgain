import React, { useState, useRef, useEffect } from 'react';
import { Send, Lock } from 'lucide-react';

export function MessageComposer({
  onSendMessage,
  isConnected,
  isAuthenticated,
  onRequireAuth,
  activeRecipient,
}) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  // Auto-grow textarea
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
    if (!trimmed || !isConnected || !activeRecipient) return;

    onSendMessage(trimmed, activeRecipient.id);
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
      <div className="p-4 bg-black border-t border-white/10 shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between p-3 px-5 bg-white/5 border border-white/20 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-white">Join the conversation</div>
              <div className="text-[11.5px] text-white/50">
                Sign in to send direct messages.
              </div>
            </div>
          </div>
          <button
            onClick={onRequireAuth}
            className="px-4 py-2 rounded-xl bg-white hover:bg-white/90 text-black font-semibold text-xs transition-all cursor-pointer shadow-md"
          >
            Sign In / Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 bg-black border-t border-white/10 shrink-0 select-none">
      <div className="max-w-3xl mx-auto flex flex-col gap-2">
        <div className="flex items-end gap-2 p-2 bg-black border border-white/20 focus-within:border-white rounded-2xl transition-all shadow-inner">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              !activeRecipient
                ? 'Select a user to message...'
                : isConnected
                ? `Message ${activeRecipient.id}...`
                : 'Connecting to server...'
            }
            disabled={!isConnected || !activeRecipient}
            className="flex-1 bg-transparent px-3 py-1.5 text-[14px] text-white placeholder:text-white/35 outline-none resize-none max-h-32 min-h-[28px] font-sans leading-relaxed disabled:opacity-40 font-mono"
            spellCheck={false}
          />

          <button
            onClick={handleSend}
            disabled={!isConnected || !activeRecipient || !text.trim()}
            title="Send Message"
            className="p-2.5 rounded-xl bg-white hover:opacity-95 disabled:opacity-30 text-black transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed shadow-md"
          >
            <Send className="w-4 h-4 text-black" />
          </button>
        </div>

        {activeRecipient && (
          <div className="flex items-center justify-between text-[11px] text-white/40 px-2 font-mono">
            <span>
              Sending to: <span className="text-white/80">{activeRecipient.id}</span>
            </span>
            <span>Press Enter to send</span>
          </div>
        )}
      </div>
    </div>
  );
}
