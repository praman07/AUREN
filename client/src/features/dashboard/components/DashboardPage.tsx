import React from 'react';
import { Sparkles, Upload, FileText, MessageSquare, ShieldCheck, Zap } from 'lucide-react';
import { useUploadStore } from '../../documents/store/useUploadStore';
import { useAuthStore } from '../../../core/auth/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';

export const DashboardPage: React.FC = () => {
  const { setIsOpen } = useUploadStore();
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-200 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full">
              {user?.industry || 'Corporate'} Workspace Active
            </span>
            <span className="text-xs text-slate-400 font-mono">• Zero-Trust Protected</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Welcome back, {user?.firstName || 'User'}
          </h1>
          <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
            AUREN Intelligence Suite — Centralized search, multi-tenant document permission controls, and zero-trust grounded AI retrieval.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <Button 
            onClick={() => setIsOpen(true)}
            className="bg-white text-slate-900 hover:bg-slate-100 rounded-xl px-5 py-2.5 font-semibold text-sm shadow-sm"
          >
            <Upload size={16} className="text-blue-600 mr-1.5" />
            Upload Document
          </Button>
          <Button 
            onClick={() => navigate('/chat')}
            variant="outline"
            className="border-slate-700 bg-slate-800/80 text-white hover:bg-slate-800 rounded-xl px-5 py-2.5 font-semibold text-sm"
          >
            <Sparkles size={16} className="text-blue-400 mr-1.5" />
            Ask AUREN
          </Button>
        </div>
      </div>

      {/* Customer Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => setIsOpen(true)} 
          className="bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-md rounded-2xl p-6 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Upload size={22} className="text-blue-600" />
            </div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              Add Knowledge
              <Zap size={15} className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">Upload PDF, TXT, or DOCX documents directly to your workspace.</p>
          </div>
          <span className="text-xs font-semibold text-blue-600 mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">Upload file &rarr;</span>
        </div>

        <div 
          onClick={() => navigate('/documents')} 
          className="bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-md rounded-2xl p-6 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <FileText size={22} className="text-emerald-600" />
            </div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              Knowledge Base
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">Browse workspace documents and configure access policies.</p>
          </div>
          <span className="text-xs font-semibold text-emerald-600 mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">View files &rarr;</span>
        </div>

        <div 
          onClick={() => navigate('/chat')}
          className="bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-md rounded-2xl p-6 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Sparkles size={22} className="text-purple-600" />
            </div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              AI Assistant
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">Ask questions grounded strictly in organization files.</p>
          </div>
          <span className="text-xs font-semibold text-purple-600 mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">Start assistant &rarr;</span>
        </div>
      </div>

      {/* Workspace Overview Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Knowledge & Files */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <FileText size={18} className="text-blue-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Workspace Documents</h2>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/documents')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Manage Knowledge &rarr;
              </Button>
            </div>
            
            <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/60 text-center my-4">
              <ShieldCheck size={36} className="text-blue-600 mb-3" />
              <p className="text-sm font-bold text-slate-800">Protected Corporate Knowledge</p>
              <p className="text-xs text-slate-500 mt-1.5 max-w-xs leading-relaxed">
                Every document is strictly isolated and permission-filtered based on user roles and department clearance.
              </p>
            </div>
          </div>
        </div>

        {/* Security & Access Overview */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <MessageSquare size={18} className="text-purple-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Security & System Status</h2>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Protected
              </span>
            </div>
            
            <div className="space-y-3.5 my-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <span className="font-medium text-slate-700">Tenant Workspace Isolation</span>
                <span className="font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Active</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <span className="font-medium text-slate-700">Role-Based Access Controls</span>
                <span className="font-mono text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Enforced</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <span className="font-medium text-slate-700">AI Knowledge Grounding</span>
                <span className="font-mono text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

