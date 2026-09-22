import React, { useState, useRef, useEffect } from 'react';
import { LogOut, ShieldCheck, Key, ChevronDown, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function UserMenu() {
  const { user, token, isAuthenticated, logout, openAuthModal, verifyMe } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState(null); // { success: boolean, msg: string }
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleVerify = async () => {
    setIsVerifying(true);
    setVerifyStatus(null);
    try {
      const res = await verifyMe();
      setVerifyStatus({
        success: true,
        msg: `GET /me Verified: "${typeof res === 'string' ? res : JSON.stringify(res)}"`,
      });
    } catch (err) {
      setVerifyStatus({
        success: false,
        msg: `Verification failed: ${err.message}`,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => openAuthModal('login')}
          className="px-3 py-1 rounded-[8px] text-[11px] font-medium border border-white/20 bg-black text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
        >
          Sign In
        </button>
        <button
          onClick={() => openAuthModal('register')}
          className="px-3 py-1 rounded-[8px] text-[11px] font-semibold bg-white text-black hover:bg-white/90 active:scale-95 transition-all cursor-pointer shadow-sm"
        >
          Register
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-white/20 bg-black hover:border-white/40 active:scale-95 transition-all cursor-pointer text-white"
      >
        <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center font-bold text-[10px]">
          {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
        </div>
        <span className="text-[11.5px] font-medium max-w-[100px] truncate">
          {user?.username || 'User'}
        </span>
        <ChevronDown className="w-3 h-3 text-white/50" />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-black border border-white/20 rounded-[18px] shadow-2xl p-4 z-50 text-white space-y-3">
          {/* User Header */}
          <div className="flex items-start justify-between pb-3 border-b border-white/10">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[13px]">{user?.username}</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-medium border border-emerald-500/30">
                  ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-white/50 truncate max-w-[180px]">{user?.email}</p>
            </div>
            <div className="px-2 py-0.5 rounded bg-white/10 text-white text-[10px] font-mono">
              ID: {user?.id}
            </div>
          </div>

          {/* Token Details */}
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between text-white/60">
              <span className="flex items-center gap-1">
                <Key className="w-3 h-3 text-white/40" />
                <span>JWT Token</span>
              </span>
              <span className="font-mono text-white/80">HS256 Verified</span>
            </div>
            {token && (
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 font-mono text-[9.5px] text-white/70 break-all line-clamp-2">
                {token}
              </div>
            )}
          </div>

          {/* Status Feedback */}
          {verifyStatus && (
            <div
              className={`p-2 rounded-lg text-[10.5px] flex items-center gap-1.5 ${
                verifyStatus.success
                  ? 'bg-emerald-950/50 border border-emerald-500/30 text-emerald-300'
                  : 'bg-red-950/50 border border-red-500/30 text-red-300'
              }`}
            >
              {verifyStatus.success ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
              )}
              <span className="break-all">{verifyStatus.msg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-1 flex flex-col gap-1.5">
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 text-[11px] font-medium text-white transition-all cursor-pointer active:scale-98"
            >
              {isVerifying ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              )}
              <span>Verify Auth (GET /me)</span>
            </button>

            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-[11px] font-medium text-red-400 transition-all cursor-pointer active:scale-98"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
