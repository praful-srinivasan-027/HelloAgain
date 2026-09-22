import React, { useState } from 'react';
import {
  Database,
  UserCheck,
  Terminal,
  ArrowDownLeft,
  ArrowUpRight,
  Info,
  Trash2,
  Key,
  ShieldAlert,
  ShieldCheck,
  LogIn,
  UserPlus,
  LogOut,
  Copy,
  Check,
  Loader2,
  Server,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function InspectorSidebar({
  isOpen,
  telemetry,
  onClearTelemetry,
  username,
  onUpdateUsername,
}) {
  const {
    user,
    token,
    isAuthenticated,
    openAuthModal,
    logout,
    verifyMe,
    apiBaseUrl,
    updateApiBaseUrl,
  } = useAuth();

  const [activeTab, setActiveTab] = useState('schema');
  const [tempUsername, setTempUsername] = useState(username);
  const [copiedToken, setCopiedToken] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [customApiUrl, setCustomApiUrl] = useState(apiBaseUrl);

  if (!isOpen) return null;

  const handleSaveIdentity = (e) => {
    e.preventDefault();
    if (tempUsername.trim()) {
      onUpdateUsername(tempUsername.trim());
    }
  };

  const handleCopyToken = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleTestMeEndpoint = async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await verifyMe();
      setVerifyResult({
        success: true,
        data: res,
      });
    } catch (err) {
      setVerifyResult({
        success: false,
        error: err.message,
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleSaveApiUrl = (e) => {
    e.preventDefault();
    if (customApiUrl.trim()) {
      updateApiBaseUrl(customApiUrl.trim());
    }
  };

  return (
    <aside className="w-80 sm:w-96 border-l border-white/10 bg-black flex flex-col shrink-0 overflow-hidden z-20">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-[12px] font-semibold uppercase tracking-wider text-white/70">
          Inspector & Schema
        </h2>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/80">
          FastAPI v1.0
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 px-3 pt-2 gap-1 bg-black">
        <button
          onClick={() => setActiveTab('schema')}
          className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-t-[8px] transition-colors cursor-pointer active:scale-95 ${
            activeTab === 'schema'
              ? 'bg-black text-white border-t-2 border-white'
              : 'text-white/40 hover:text-white'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-white" />
          <span>Schema</span>
        </button>

        <button
          onClick={() => setActiveTab('identity')}
          className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-t-[8px] transition-colors cursor-pointer active:scale-95 ${
            activeTab === 'identity'
              ? 'bg-black text-white border-t-2 border-white'
              : 'text-white/40 hover:text-white'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-white" />
          <span>Identity {isAuthenticated && '●'}</span>
        </button>

        <button
          onClick={() => setActiveTab('telemetry')}
          className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-t-[8px] transition-colors cursor-pointer active:scale-95 ${
            activeTab === 'telemetry'
              ? 'bg-black text-white border-t-2 border-white'
              : 'text-white/40 hover:text-white'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-white" />
          <span>Telemetry ({telemetry.length})</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: SCHEMA */}
        {activeTab === 'schema' && (
          <div className="space-y-4 text-[13px]">
            {/* Backend API Endpoints */}
            <div className="p-4 rounded-[18px] bg-black border border-white/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white tracking-[-0.2px]">Auth REST Endpoints</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white text-black font-mono text-[10px] font-semibold">
                  FastAPI
                </span>
              </div>

              <div className="space-y-2.5 font-mono text-[11px]">
                {/* POST /register */}
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400">POST /register</span>
                    <span className="text-[10px] text-white/50">RegisterRequest</span>
                  </div>
                  <p className="text-[10.5px] font-sans text-white/60">
                    Body: <code className="text-white font-mono">{'{ userName, email, password }'}</code>
                  </p>
                  <p className="text-[10.5px] font-sans text-white/60">
                    Returns: JWT Token string (or 503 if exists)
                  </p>
                </div>

                {/* POST /login */}
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-400">POST /login</span>
                    <span className="text-[10px] text-white/50">loginRequest</span>
                  </div>
                  <p className="text-[10.5px] font-sans text-white/60">
                    Body: <code className="text-white font-mono">{'{ email, password }'}</code>
                  </p>
                  <p className="text-[10.5px] font-sans text-white/60">
                    Returns: JWT Token string (or 401 on failure)
                  </p>
                </div>

                {/* GET /me */}
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400">GET /me</span>
                    <span className="text-[10px] text-white/50">OAuth2 Bearer</span>
                  </div>
                  <p className="text-[10.5px] font-sans text-white/60">
                    Header: <code className="text-white font-mono">Authorization: Bearer &lt;token&gt;</code>
                  </p>
                  <p className="text-[10.5px] font-sans text-white/60">
                    Returns: <code className="text-white font-mono">"hi"</code>
                  </p>
                </div>
              </div>
            </div>

            {/* User Model Card */}
            <div className="p-4 rounded-[18px] bg-black border border-white/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white tracking-[-0.2px]">Database Model</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white text-black font-mono text-[10px] font-semibold">
                  userTable
                </span>
              </div>

              <div className="space-y-2 font-mono text-[11.5px]">
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-white/60">id</span>
                  <span className="text-white font-semibold">Mapped[int] (PK)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-white/60">username</span>
                  <span className="text-white">String(30)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-white/60">email</span>
                  <span className="text-white">String(100) (Unique)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-white/60">password</span>
                  <span className="text-white">String(255) [pwdlib]</span>
                </div>
              </div>
            </div>

            {/* WebSocket Endpoint Spec */}
            <div className="p-4 rounded-[18px] bg-black border border-white/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white tracking-[-0.2px]">WebSocket Stream</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white text-black font-mono text-[10px] font-semibold">
                  /ws
                </span>
              </div>

              <div className="space-y-2 text-white text-[12px]">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Protocol</span>
                  <span className="font-mono text-white text-[11.5px]">ws:// / wss://</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Behavior</span>
                  <span className="text-white">Echo with SERVER prefix</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Heartbeat</span>
                  <span className="font-mono text-white text-[11.5px]">"ping" to latency</span>
                </div>
              </div>
            </div>

            {/* Server Configuration */}
            <form onSubmit={handleSaveApiUrl} className="p-4 rounded-[18px] bg-black border border-white/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white tracking-[-0.2px]">Backend Base URL</span>
                <Server className="w-3.5 h-3.5 text-white/50" />
              </div>
              <input
                type="text"
                value={customApiUrl}
                onChange={(e) => setCustomApiUrl(e.target.value)}
                placeholder="http://localhost:8000"
                className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/20 text-white font-mono text-[11px] focus:border-white outline-none"
              />
              <button
                type="submit"
                className="w-full py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11.5px] font-medium transition-all active:scale-95 cursor-pointer"
              >
                Update Base URL
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: IDENTITY & AUTH */}
        {activeTab === 'identity' && (
          <div className="space-y-4 text-[13px]">
            {isAuthenticated ? (
              /* Authenticated User Details */
              <div className="space-y-4">
                <div className="p-4 rounded-[18px] bg-black border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs">
                        {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{user?.username}</div>
                        <div className="text-[11px] text-white/50 truncate">{user?.email}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
                      AUTHENTICATED
                    </span>
                  </div>

                  <div className="pt-2 border-t border-white/10 space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-white/50">Database ID (sub):</span>
                      <span className="text-white font-bold">{user?.id}</span>
                    </div>
                    {user?.exp && (
                      <div className="flex justify-between">
                        <span className="text-white/50">Expires At:</span>
                        <span className="text-white">
                          {new Date(user.exp * 1000).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* JWT Token Card */}
                <div className="p-4 rounded-[18px] bg-black border border-white/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-white font-medium text-[12px]">
                      <Key className="w-3.5 h-3.5 text-white/60" />
                      <span>Active JWT Access Token</span>
                    </div>
                    <button
                      onClick={handleCopyToken}
                      className="p-1 rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all cursor-pointer"
                      title="Copy JWT Token"
                    >
                      {copiedToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 font-mono text-[10px] text-white/70 break-all max-h-20 overflow-y-auto">
                    {token}
                  </div>
                </div>

                {/* Live GET /me Endpoint Tester */}
                <div className="p-4 rounded-[18px] bg-black border border-white/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-[12px]">Backend Session Verification</span>
                    <button
                      onClick={handleTestMeEndpoint}
                      disabled={verifying}
                      className="px-2.5 py-1 rounded-full bg-white hover:bg-white/90 disabled:opacity-50 text-black text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      {verifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                      <span>Call GET /me</span>
                    </button>
                  </div>

                  {verifyResult && (
                    <div
                      className={`p-2.5 rounded-xl text-[11px] font-mono ${
                        verifyResult.success
                          ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                          : 'bg-red-950/40 border border-red-500/30 text-red-300'
                      }`}
                    >
                      {verifyResult.success ? (
                        <div>
                          <div className="font-bold text-emerald-400">HTTP 200 OK</div>
                          <div>Response: {JSON.stringify(verifyResult.data)}</div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-bold text-red-400">HTTP Error</div>
                          <div>{verifyResult.error}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="w-full py-2.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-semibold text-[12px] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out Active Session</span>
                </button>
              </div>
            ) : (
              /* Unauthenticated Prompt */
              <div className="space-y-4">
                <div className="p-4 rounded-[18px] bg-black border border-white/20 space-y-3 text-center">
                  <div className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-[14px]">Guest Session</h3>
                    <p className="text-[12px] text-white/60 mt-1">
                      Sign in or create an account to authenticate against the FastAPI user database.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => openAuthModal('login')}
                      className="py-2 rounded-xl bg-white text-black font-semibold text-[12px] flex items-center justify-center gap-1.5 hover:bg-white/90 transition-all cursor-pointer active:scale-95 shadow-sm"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Sign In</span>
                    </button>
                    <button
                      onClick={() => openAuthModal('register')}
                      className="py-2 rounded-xl bg-white/10 text-white font-medium text-[12px] flex items-center justify-center gap-1.5 hover:bg-white/20 border border-white/20 transition-all cursor-pointer active:scale-95"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Register</span>
                    </button>
                  </div>
                </div>

                {/* Guest Custom Username */}
                <form onSubmit={handleSaveIdentity} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-white/80 font-medium text-[12px]">Temporary Display Name</label>
                    <input
                      type="text"
                      value={tempUsername}
                      onChange={(e) => setTempUsername(e.target.value)}
                      maxLength={30}
                      placeholder="e.g. Srinivasan027"
                      className="w-full px-3.5 py-2 rounded-full bg-black border border-white/20 text-white text-[13px] focus:border-white outline-none"
                    />
                    <span className="text-[10px] text-white/50">Used as message sender in guest mode</span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium shadow-sm transition-all active:scale-95 cursor-pointer text-[12.5px]"
                  >
                    Save Display Name
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TELEMETRY */}
        {activeTab === 'telemetry' && (
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-1">
              <span className="text-[12px] text-white/70">Live Frame Stream</span>
              <button
                onClick={onClearTelemetry}
                className="flex items-center gap-1 text-[11px] text-white/60 hover:text-white transition-colors cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Frames</span>
              </button>
            </div>

            {telemetry.length === 0 ? (
              <div className="py-8 text-center text-white/40 text-xs">
                No frames captured yet.
              </div>
            ) : (
              <div className="space-y-2 font-mono text-[11px]">
                {telemetry.map((t) => {
                  const time = new Date(t.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    fractionalSecondDigits: 3,
                  });

                  const isOut = t.type === 'out';
                  const isIn = t.type === 'in';

                  return (
                    <div
                      key={t.id}
                      className="p-2.5 rounded-[11px] bg-black border border-white/20 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] text-white/50">
                        <span
                          className={`font-semibold flex items-center gap-1 uppercase ${
                            isOut
                              ? 'text-white'
                              : isIn
                              ? 'text-white/80'
                              : 'text-white/50'
                          }`}
                        >
                          {isOut ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : isIn ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : (
                            <Info className="w-3 h-3" />
                          )}
                          {t.type}
                        </span>
                        <span>{time}</span>
                      </div>
                      <div className="text-white break-all font-mono text-[11px]">
                        {t.payload}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
