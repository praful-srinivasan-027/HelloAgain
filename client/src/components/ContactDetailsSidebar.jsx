import React from 'react';
import { X, Users, Shield, Send, CheckCircle2, Copy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function ContactDetailsSidebar({ recipient, isOpen, onClose }) {
  const { user } = useAuth();

  if (!isOpen) return null;

  return (
    <aside className="w-80 border-l border-white/10 glass-panel flex flex-col shrink-0 select-none z-20">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/60">
          Chat Details
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Profile Overview */}
      <div className="p-6 flex flex-col items-center text-center border-b border-white/10 space-y-3">
        <div
          className={`w-20 h-20 rounded-2xl ${
            recipient.avatarColor || 'bg-white/10'
          } border border-white/20 flex items-center justify-center text-white font-bold text-2xl shadow-xl`}
        >
          {recipient.isGroup ? <Users className="w-10 h-10" /> : recipient.name.charAt(0).toUpperCase()}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">{recipient.name}</h2>
          <p className="text-xs text-white/50 mt-0.5">{recipient.subtitle}</p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/80">
          <span className="font-mono font-semibold text-white/50">Receiver Target:</span>
          <span className="font-mono text-white">{recipient.id}</span>
        </div>
      </div>

      {/* Info List */}
      <div className="p-4 space-y-4 text-xs">
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Shield className="w-4 h-4 text-white" />
            <span>Encrypted Messaging Protocol</span>
          </div>
          <p className="text-white/60 leading-relaxed text-[11.5px]">
            Messages to this conversation are packaged and dispatched through the HelloAgain FastAPI WebSocket server with matching receiver_id email.
          </p>
        </div>

        {/* Payload Format preview */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
          <div className="text-[11px] font-semibold text-white/50 uppercase">
            Active Schema
          </div>
          <div className="font-mono text-[10.5px] text-white/70 bg-black/60 p-2.5 rounded-xl border border-white/10 break-all space-y-1">
            <div><span className="text-white/40">reciever_email_address:</span> "{recipient.id}"</div>
            <div><span className="text-white/40">sender_email_address:</span> "{user?.email || ''}"</div>
            <div><span className="text-white/40">content:</span> "Message text"</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
