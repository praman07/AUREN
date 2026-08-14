import React from 'react';
import { Sparkles, Upload, FileText, MessageSquare, ShieldCheck, Zap } from 'lucide-react';
import { useUploadStore } from '../../documents/store/useUploadStore';
import { useAuthStore } from '../../../core/auth/store/useAuthStore';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { setIsOpen } = useUploadStore();
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-200 pb-8 overflow-y-auto custom-scrollbar">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 text-white p-7 rounded-2xl shadow-xl border border-slate-800/90 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full">
              {user?.industry || 'Corporate'} Template Active
            </span>
            <span className="text-xs text-slate-400 font-mono">• Zero-Trust Protected</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Welcome back, {user?.firstName || 'User'}
          </h1>
          <p className="text-xs text-slate-300 mt-2 max-w-xl leading-relaxed">
            AUREN Corporate Knowledge Engine — Centralized search, multi-tenant document permission controls, and zero-trust grounded AI retrieval.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <button 
            onClick={() => setIsOpen(true)}
            className="btn-primary shadow-lg shadow-blue-500/20"
          >
            <Upload size={16} />
            <span>Upload Document</span>
          </button>
          <button 
            onClick={() => navigate('/chat')}
            className="btn-secondary"
          >
            <Sparkles size={16} className="text-blue-400" />
            <span>Ask AUREN</span>
          </button>
        </div>
      </div>

      {/* Customer Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <button 
          onClick={() => setIsOpen(true)} 
          className="corporate-card-interactive group flex flex-col items-start text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <Upload size={20} className="text-blue-400" />
          </div>
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            Add Knowledge
            <Zap size={14} className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Upload PDF, TXT, or DOCX documents to your workspace</p>
        </button>

        <button 
          onClick={() => navigate('/documents')} 
          className="corporate-card-interactive group flex flex-col items-start text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <FileText size={20} className="text-emerald-400" />
          </div>
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            Knowledge Base
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Browse workspace documents and configure access policies</p>
        </button>

        <button 
          onClick={() => navigate('/chat')}
          className="corporate-card-interactive group flex flex-col items-start text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <Sparkles size={20} className="text-purple-400" />
          </div>
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            AI Assistant
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Ask questions grounded strictly in organization files</p>
        </button>
      </div>

      {/* Workspace Overview Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Knowledge & Files */}
        <div className="corporate-card flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <FileText size={18} className="text-blue-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Workspace Documents</h2>
            </div>
            <button 
              onClick={() => navigate('/documents')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              Manage Knowledge &rarr;
            </button>
          </div>
          
          <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-800 rounded-xl bg-slate-950/60 text-center my-auto">
            <ShieldCheck size={32} className="text-blue-400/80 mb-3" />
            <p className="text-xs font-bold text-slate-200">Protected Corporate Knowledge</p>
            <p className="text-[11px] text-slate-400 mt-1.5 max-w-xs leading-relaxed">
              Every document is strictly isolated and permission-filtered based on user roles and department clearance.
            </p>
          </div>
        </div>

        {/* Security & Access Overview */}
        <div className="corporate-card flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <MessageSquare size={18} className="text-purple-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Security & Corporate Status</h2>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Protected
            </span>
          </div>
          
          <div className="space-y-3 my-auto">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              <span className="font-semibold text-slate-300">Tenant Workspace Isolation</span>
              <span className="font-mono text-emerald-400 font-bold">Active</span>
            </div>
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              <span className="font-semibold text-slate-300">Role-Based Access Controls</span>
              <span className="font-mono text-blue-400 font-bold">Enforced</span>
            </div>
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              <span className="font-semibold text-slate-300">AI Knowledge Grounding</span>
              <span className="font-mono text-purple-400 font-bold">Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
