import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { triggerHaptic } from '../utils/haptics';

export function AuthModal() {
  const {
    isAuthModalOpen,
    authModalInitialTab,
    closeAuthModal,
    login,
    register,
    isLoading,
    authError,
    setAuthError,
  } = useAuth();

  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (isAuthModalOpen) {
      setTab(authModalInitialTab || 'login');
      setEmail('');
      setPassword('');
      setUsername('');
    }
  }, [isAuthModalOpen, authModalInitialTab]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthError('Please enter a valid email address');
      triggerHaptic('heavy');
      return;
    }
    if (!password || password.length < 3) {
      setAuthError('Password must be at least 3 characters');
      triggerHaptic('heavy');
      return;
    }

    if (tab === 'login') {
      await login(cleanEmail, password);
    } else {
      const cleanUsername = username.trim() || cleanEmail.split('@')[0];
      await register(cleanUsername, cleanEmail, password);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full sm:max-w-md bg-zinc-950 border border-white/15 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl safe-bottom animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar with close */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white text-black font-bold flex items-center justify-center text-sm shadow">
              H
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                {tab === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-xs text-white/45">HelloAgain Android Client</p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              closeAuthModal();
            }}
            className="p-2 rounded-full text-white/50 hover:text-white active:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 p-1 bg-zinc-900 border border-white/10 rounded-xl mb-4">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setTab('login');
              setAuthError(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === 'login'
                ? 'bg-white text-black shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setTab('register');
              setAuthError(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === 'register'
                ? 'bg-white text-black shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {authError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="flex-1">{authError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {tab === 'register' && (
            <div>
              <label className="block text-[11px] font-medium text-white/60 uppercase tracking-wider mb-1">
                Username (Optional)
              </label>
              <div className="flex items-center bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-white/30">
                <User className="w-4 h-4 text-white/40 mr-2.5 shrink-0" />
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-transparent text-sm text-white placeholder-white/30 focus:outline-none w-full"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-white/60 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="flex items-center bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-white/30">
              <Mail className="w-4 h-4 text-white/40 mr-2.5 shrink-0" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent text-sm text-white placeholder-white/30 focus:outline-none w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-white/60 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="flex items-center bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-white/30">
              <Lock className="w-4 h-4 text-white/40 mr-2.5 shrink-0" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent text-sm text-white placeholder-white/30 focus:outline-none w-full"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 bg-white text-black font-bold text-sm rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{tab === 'login' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthModal;
