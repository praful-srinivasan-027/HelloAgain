import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export function MobileMessageInput({
  onSendMessage,
  isConnected,
  isAuthenticated,
  onRequireAuth,
  activeRecipient,
}) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    const trimmed = text.trim();
    if (!trimmed || !activeRecipient) return;

    triggerHaptic('medium');
    onSendMessage(trimmed, activeRecipient.email || activeRecipient.id);
    setText('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <footer className="glass-panel safe-bottom shrink-0 border-t border-white/10 p-2.5 z-20">
      <form onSubmit={handleSend} className="flex items-end gap-2 max-w-4xl mx-auto">
        <div className="flex-1 min-h-[44px] max-h-[120px] bg-zinc-900/90 border border-white/15 rounded-2xl px-3.5 py-2.5 focus-within:border-white/40 transition-colors flex items-center">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={
              !isAuthenticated
                ? 'Sign in to send messages...'
                : !activeRecipient
                ? 'Select a conversation first'
                : `Message ${activeRecipient.username || activeRecipient.email}...`
            }
            disabled={!isAuthenticated || !activeRecipient}
            className="w-full bg-transparent text-[14px] text-white placeholder-white/35 focus:outline-none resize-none leading-relaxed overflow-y-auto"
          />
        </div>

        <button
          type="submit"
          disabled={!text.trim() || !isConnected || !activeRecipient}
          className="w-11 h-11 rounded-2xl bg-white text-black disabled:bg-zinc-800 disabled:text-white/20 font-bold flex items-center justify-center shrink-0 active:scale-95 transition-all shadow-md cursor-pointer"
          aria-label="Send message"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </form>
    </footer>
  );
}

export default MobileMessageInput;
