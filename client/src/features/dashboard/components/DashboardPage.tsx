import React from 'react';
import { Search, Sparkles, Upload, FileText, MessageSquare, ShieldCheck, Zap } from 'lucide-react';
import { useUploadStore } from '../../documents/store/useUploadStore';
import { useAuthStore } from '../../../core/auth/store/useAuthStore';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { setIsOpen } = useUploadStore();
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 pb-8 overflow-y-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full uppercase tracking-wider">
              {user?.industry || 'Corporate'} Workspace
            </span>
            <span className="text-xs text-slate-400">• Secure Access Active</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Welcome back, {user?.firstName || 'User'}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            AUREN Enterprise Knowledge Assistant — Search documents, manage organization knowledge, and query your team AI assistant.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <Upload size={15} />
            <span>Upload Document</span>
          </button>
          <button 
            onClick={() => navigate('/chat')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold rounded-lg border border-slate-700 transition-all"
          >
            <Sparkles size={15} className="text-blue-400" />
            <span>Ask AUREN</span>
          </button>
        </div>
      </div>

      {/* Customer Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button 
          onClick={() => setIsOpen(true)} 
          className="group flex flex-col items-start p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 hover:border-blue-500/50 hover:shadow-md transition-all text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Upload size={18} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Add Knowledge
            <Zap size={13} className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h3>
          <p className="text-xs text-slate-500 mt-1">Upload PDF, TXT, or DOCX documents to your workspace</p>
        </button>

        <button 
          onClick={() => navigate('/documents')} 
          className="group flex flex-col items-start p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 hover:border-emerald-500/50 hover:shadow-md transition-all text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <FileText size={18} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Knowledge Base
          </h3>
          <p className="text-xs text-slate-500 mt-1">Browse workspace documents and configure document access policies</p>
        </button>

        <button 
          onClick={() => navigate('/chat')}
          className="group flex flex-col items-start p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 hover:border-purple-500/50 hover:shadow-md transition-all text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/50 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Sparkles size={18} className="text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            AI Assistant
          </h3>
          <p className="text-xs text-slate-500 mt-1">Ask questions and receive instant answers grounded in your organization files</p>
        </button>
      </div>

      {/* Workspace Overview Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Knowledge & Files */}
        <div className="flex flex-col border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-blue-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Workspace Documents</h2>
            </div>
            <button 
              onClick={() => navigate('/documents')}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Manage Knowledge
            </button>
          </div>
          
          <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-950/50 text-center">
            <ShieldCheck size={28} className="text-slate-400 mb-2" />
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Protected Organization Knowledge</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
              Every document is strictly isolated and permission-filtered based on user roles and department access.
            </p>
          </div>
        </div>

        {/* Security & Access Overview */}
        <div className="flex flex-col border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-purple-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Security & Organization Status</h2>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              Protected
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">Tenant Workspace Isolation</span>
              <span className="font-mono text-emerald-600 font-semibold">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">Role-Based Access Controls</span>
              <span className="font-mono text-blue-600 font-semibold">Enforced</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">AI Knowledge Grounding</span>
              <span className="font-mono text-purple-600 font-semibold">Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
