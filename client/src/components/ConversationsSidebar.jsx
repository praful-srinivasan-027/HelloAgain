import React, { useState } from 'react';
import { Search, LogOut, ChevronDown, Sparkles, MessageSquarePlus, Volume2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function ConversationsSidebar({
  activeRecipient,
  onSelectRecipient,
  conversations = [],
  onAddConversation,
  unreadMap = {},
  soundEnabled,
  onToggleSound,
  isConnected,
}) {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const cleanQuery = searchQuery.trim().toLowerCase();

  const handleSelectEmail = (emailToSelect) => {
    const email = emailToSelect.trim().toLowerCase();
    if (!email || !email.includes('@')) return;

    const existing = conversations.find((c) => c.id === email);
    const resolvedUsername = existing?.username || null;

    onAddConversation(email, resolvedUsername);
    onSelectRecipient({ id: email, email, username: resolvedUsername });
    setSearchQuery('');
  };

  const filteredConversations = conversations.filter((c) => {
    if (!cleanQuery) return true;
    const emailMatch = c.email ? c.email.toLowerCase().includes(cleanQuery) : false;
    const usernameMatch = c.username ? c.username.toLowerCase().includes(cleanQuery) : false;
    return emailMatch || usernameMatch;
  });

  return (
    <aside className="w-80 sm:w-88 h-full glass-panel border-r border-white/10 flex flex-col shrink-0 select-none z-20">
      {/* App Header */}
      <div className="p-4 pb-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-[17px] font-semibold text-white tracking-[-0.3px] leading-tight">
              HelloAgain
            </h1>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'
                }`}
              />
              <span className="text-white/60 font-medium">
                {isConnected ? 'Realtime Connected' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Email Search Bar */}
      <div className="p-3">
        <label className="block text-[11px] font-medium text-white/50 mb-1.5">
          Search User by Email
        </label>
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-white/40 pointer-events-none" />
          <input
            type="email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && cleanQuery) {
                handleSelectEmail(cleanQuery);
              }
            }}
            placeholder="user@example.com..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-[13px] text-white placeholder:text-white/30 focus:border-white/30 focus:bg-white/[0.08] outline-none transition-all font-mono"
          />
        </div>
      </div>

      {/* Search Result & Recent Active Conversations */}
      <div className="flex-1 overflow-y-auto px-2 space-y-2">
        {/* Dynamic Search Result Match for starting new conversation */}
        {cleanQuery && cleanQuery.includes('@') && !conversations.some((c) => c.id === cleanQuery) && (
          <div className="p-1">
            <div className="px-2 py-1 text-[10.5px] font-semibold text-white/40 uppercase tracking-wider mb-1">
              Start New Chat
            </div>
            <button
              onClick={() => handleSelectEmail(cleanQuery)}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left bg-white/10 hover:bg-white/15 border border-white/20 text-white transition-all cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <MessageSquarePlus className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-white truncate font-mono">
                  {cleanQuery}
                </div>
                <div className="text-[11px] text-emerald-300/80 truncate">
                  Start conversation
                </div>
              </div>
            </button>
          </div>
        )}

        {/* List of active conversations */}
        <div className="px-2 py-1 text-[10.5px] font-semibold text-white/40 uppercase tracking-wider">
          Conversations ({conversations.length})
        </div>

        {conversations.length === 0 && !cleanQuery ? (
          <div className="p-4 text-center text-xs text-white/40 leading-relaxed">
            No active conversations yet.<br />
            Search for a user by email above to start.
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = activeRecipient?.id === conv.id;
            const displayName = conv.username || conv.email || conv.id;
            const initial = displayName.charAt(0).toUpperCase();
            const unreadCount = unreadMap[conv.id] || 0;

            return (
              <button
                key={conv.id}
                onClick={() => onSelectRecipient(conv)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-white/10 border border-white/20 text-white shadow-sm'
                    : 'hover:bg-white/5 border border-transparent text-white/70 hover:text-white'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                  {initial}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-white truncate">
                      {displayName}
                    </span>
                    {unreadCount > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {conv.username && (
                    <div className="text-[10.5px] text-white/40 truncate font-mono">
                      {conv.email}
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-white/10 bg-transparent">
        {isAuthenticated ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu((prev) => !prev)}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {(user?.username || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="text-left min-w-0">
                  {user?.username && (
                    <div className="text-[12.5px] font-semibold text-white truncate">
                      {user.username}
                    </div>
                  )}
                  <div
                    className={`text-white truncate font-mono ${
                      user?.username ? 'text-[10.5px] text-white/50' : 'text-[12.5px] font-semibold'
                    }`}
                  >
                    {user?.email}
                  </div>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-white/40" />
            </button>

            {showUserMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-full bg-[#16161a] border border-white/20 rounded-2xl p-2 shadow-2xl space-y-1 z-50">
                <div className="px-3 py-1.5 border-b border-white/10">
                  {user?.username && (
                    <div className="text-xs font-semibold text-white truncate">{user.username}</div>
                  )}
                  <div className="text-[10.5px] font-mono text-white/50 truncate">
                    {user?.email}
                  </div>
                </div>
                <button
                  onClick={onToggleSound}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{soundEnabled ? 'Mute Chimes' : 'Enable Chimes'}</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => openAuthModal('login')}
              className="w-full py-2 bg-white hover:bg-white/90 text-black text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm"
            >
              Sign In to Chat
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

export default ConversationsSidebar;
