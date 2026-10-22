import React, { useState } from 'react';
import { Search, Plus, MessageSquare, Download, Sparkles, UserPlus } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export function MobileConversationsList({
  conversations = [],
  activeRecipient,
  onSelectRecipient,
  onAddConversation,
  unreadMap = {},
  onOpenDownloadModal,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [newChatEmail, setNewChatEmail] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  const filteredConversations = conversations.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const email = (c.email || '').toLowerCase();
    const uname = (c.username || '').toLowerCase();
    return email.includes(term) || uname.includes(term);
  });

  const handleStartChat = (e) => {
    e?.preventDefault();
    const target = newChatEmail.trim().toLowerCase();
    if (!target || !target.includes('@')) return;

    triggerHaptic('medium');
    onAddConversation(target);
    onSelectRecipient({ id: target, email: target });
    setNewChatEmail('');
    setIsAddingNew(false);
  };

  const getAvatarGradient = (str) => {
    const colors = [
      'from-indigo-600 to-purple-600',
      'from-emerald-600 to-teal-700',
      'from-rose-600 to-pink-600',
      'from-amber-600 to-orange-600',
      'from-cyan-600 to-blue-600',
      'from-fuchsia-600 to-purple-700',
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-black overflow-hidden">
      {/* Search Bar & New Chat Button */}
      <div className="p-3 border-b border-white/10 flex flex-col gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative flex items-center">
            <Search className="w-4 h-4 text-white/40 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900/80 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              setIsAddingNew((prev) => !prev);
            }}
            title="Start new conversation"
            className="p-2.5 rounded-xl bg-white text-black font-semibold active:scale-95 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Drawer / Input Row */}
        {isAddingNew && (
          <form
            onSubmit={handleStartChat}
            className="flex items-center gap-2 p-2 bg-zinc-900 border border-white/15 rounded-xl animate-fadeIn"
          >
            <UserPlus className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />
            <input
              type="email"
              autoFocus
              placeholder="Recipient email address..."
              value={newChatEmail}
              onChange={(e) => setNewChatEmail(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newChatEmail.includes('@')}
              className="px-3 py-1 bg-emerald-500 disabled:opacity-30 text-black text-xs font-bold rounded-lg active:scale-95 transition-all"
            >
              Start
            </button>
          </form>
        )}
      </div>

      {/* Download Android APK Banner */}
      <div className="px-3 pt-2 shrink-0">
        <button
          onClick={() => {
            triggerHaptic('light');
            onOpenDownloadModal();
          }}
          className="w-full p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-zinc-900/60 to-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-left active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[12.5px] font-semibold text-emerald-300 leading-tight">
                Download Android App (APK)
              </p>
              <p className="text-[10px] text-white/50">
                Install directly on your phone or build native APK
              </p>
            </div>
          </div>
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
        </button>
      </div>

      {/* Conversations Scroll View */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conv) => {
            const isSelected = activeRecipient?.id === conv.id;
            const unread = unreadMap[conv.id] || 0;
            const displayName = conv.username || conv.email.split('@')[0];
            const initial = displayName[0].toUpperCase();
            const gradient = getAvatarGradient(conv.email);

            return (
              <button
                key={conv.id}
                onClick={() => {
                  triggerHaptic('light');
                  onSelectRecipient(conv);
                }}
                className={`w-full p-2.5 rounded-xl flex items-center gap-3 text-left transition-all ${
                  isSelected
                    ? 'bg-white/15 border border-white/20'
                    : 'hover:bg-white/5 active:bg-white/10'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white shadow-md text-base shrink-0`}
                >
                  {initial}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-medium text-white truncate leading-snug">
                      {displayName}
                    </h3>
                    {unread > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black font-bold text-[10px] shrink-0 animate-pulse">
                        {unread}
                      </span>
                    )}
                  </div>
                  <p className="text-[11.5px] text-white/45 truncate mt-0.5">{conv.email}</p>
                </div>
              </button>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-white/40">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 text-white/30" />
            </div>
            <p className="text-sm font-semibold text-white/60 mb-1">No chats found</p>
            <p className="text-xs text-white/40 max-w-[240px]">
              Tap the <span className="text-white">+</span> button above and enter a user's email to start messaging.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MobileConversationsList;
