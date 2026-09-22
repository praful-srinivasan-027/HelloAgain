import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Mail, User, ArrowRight, AlertCircle, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  
  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form State
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [validationError, setValidationError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (isAuthModalOpen) {
      setActiveTab(authModalInitialTab || 'login');
      setValidationError(null);
      setSuccessMessage(null);
    }
  }, [isAuthModalOpen, authModalInitialTab]);

  if (!isAuthModalOpen) return null;

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setValidationError(null);
    setAuthError(null);
    setSuccessMessage(null);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessMessage(null);

    if (!loginEmail.trim()) {
      setValidationError('Please enter your email address');
      return;
    }
    if (!loginPassword) {
      setValidationError('Please enter your password');
      return;
    }

    const res = await login(loginEmail.trim(), loginPassword);
    if (res.success) {
      setSuccessMessage('Logged in successfully!');
      setTimeout(() => {
        closeAuthModal();
      }, 500);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessMessage(null);

    if (!regUsername.trim()) {
      setValidationError('Please enter a username (max 30 chars)');
      return;
    }
    if (regUsername.length > 30) {
      setValidationError('Username cannot exceed 30 characters');
      return;
    }
    if (!regEmail.trim()) {
      setValidationError('Please enter a valid email address');
      return;
    }
    if (regEmail.length > 100) {
      setValidationError('Email cannot exceed 100 characters');
      return;
    }
    if (!regPassword) {
      setValidationError('Please enter a password');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    const res = await register(regUsername.trim(), regEmail.trim(), regPassword);
    if (res.success) {
      setSuccessMessage('Account registered and authenticated!');
      setTimeout(() => {
        closeAuthModal();
      }, 600);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        {/* Backdrop click dismiss */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={closeAuthModal}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md glass-card rounded-2xl shadow-2xl p-6 sm:p-8 z-10 text-white overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Subtle Ambient Radial Top Light */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-white/5 blur-3xl pointer-events-none rounded-full" />

          {/* Close Button */}
          <button
            onClick={closeAuthModal}
            className="absolute top-5 right-5 p-1.5 rounded-full border border-white/10 hover:border-white/30 text-white/50 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-[22px] font-semibold tracking-tight text-white">
              {activeTab === 'login' ? 'Welcome back to HelloAgain' : 'Join HelloAgain'}
            </h2>
            <p className="text-[13px] text-white/60 mt-1 max-w-xs">
              {activeTab === 'login'
                ? 'Sign in to access your direct chats and realtime community.'
                : 'Create your account to start messaging instantly.'}
            </p>
          </div>

          {/* Segmented Tab Switcher */}
          <div className="flex p-1 bg-white/5 border border-white/10 rounded-full mb-6 relative">
            <button
              type="button"
              onClick={() => handleTabSwitch('login')}
              className={`flex-1 py-2 text-[13px] font-medium rounded-full transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('register')}
              className={`flex-1 py-2 text-[13px] font-medium rounded-full transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Alert Messages */}
          {(validationError || authError) && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{validationError || authError}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </motion.div>
          )}

          {/* LOGIN TAB */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-white/70">Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 absolute left-3.5 text-white/40" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="email@example.com"
                    autoComplete="email"
                    required
                    className="w-full bg-white/5 border border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-white placeholder:text-white/30 focus:border-white focus:bg-black outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-white/70">Password</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 absolute left-3.5 text-white/40" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full bg-white/5 border border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-white placeholder:text-white/30 focus:border-white focus:bg-black outline-none transition-all"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-xl bg-white hover:bg-white/90 disabled:opacity-50 text-black font-semibold text-[13.5px] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Helper link */}
              <div className="pt-2 flex items-center justify-end text-[11.5px] text-white/50">
                <button
                  type="button"
                  onClick={() => handleTabSwitch('register')}
                  className="hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
                >
                  Need an account?
                </button>
              </div>
            </form>
          )}

          {/* REGISTER TAB */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="text-[12px] font-medium text-white/70">Username</label>
                </div>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 absolute left-3.5 text-white/40" />
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Username"
                    maxLength={30}
                    required
                    className="w-full bg-white/5 border border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-white placeholder:text-white/30 focus:border-white focus:bg-black outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="text-[12px] font-medium text-white/70">Email Address</label>
                </div>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 absolute left-3.5 text-white/40" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="user@example.com"
                    maxLength={100}
                    required
                    className="w-full bg-white/5 border border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-white placeholder:text-white/30 focus:border-white focus:bg-black outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-white/70">Password</label>
                  <div className="relative flex items-center">
                    <Lock className="w-3.5 h-3.5 absolute left-3 text-white/40" />
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-white/5 border border-white/20 rounded-xl pl-9 pr-3 py-2 text-[12.5px] text-white placeholder:text-white/30 focus:border-white focus:bg-black outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-white/70">Confirm</label>
                  <div className="relative flex items-center">
                    <Lock className="w-3.5 h-3.5 absolute left-3 text-white/40" />
                    <input
                      type="password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-white/5 border border-white/20 rounded-xl pl-9 pr-3 py-2 text-[12.5px] text-white placeholder:text-white/30 focus:border-white focus:bg-black outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-xl bg-white hover:bg-white/90 disabled:opacity-50 text-black font-semibold text-[13.5px] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Register & Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Helper link */}
              <div className="pt-2 flex items-center justify-end text-[11.5px] text-white/50">
                <button
                  type="button"
                  onClick={() => handleTabSwitch('login')}
                  className="hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
                >
                  Already registered?
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
