import React from 'react';
import { Shield } from 'lucide-react';

export const AuthSplitLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex bg-white font-sans">
      {/* Left Panel - Auth Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:w-[480px] xl:w-[560px] mx-auto lg:mx-0 border-r border-border bg-white">
        <div className="w-full max-w-sm mx-auto">
          {children}
        </div>
      </div>

      {/* Right Panel - System Status / Enterprise Branding */}
      <div className="hidden lg:flex flex-1 flex-col bg-slate-950 text-slate-300 p-12 justify-between">
        <div>
          <div className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <Shield size={18} className="text-primary-foreground" />
            </div>
            <span className="font-semibold text-white tracking-wide">EKOS Security</span>
          </div>

          <h2 className="text-3xl font-light text-white tracking-tight leading-tight max-w-lg mb-6">
            Enterprise Knowledge Operating System
          </h2>
          
          <p className="text-slate-400 max-w-md leading-relaxed text-sm">
            Access to this system is restricted to authorized personnel. 
            All activity is monitored and logged in accordance with corporate security policies.
          </p>
        </div>

        <div className="space-y-6">
          <div className="border-l-2 border-primary pl-4">
            <h3 className="text-white text-sm font-medium mb-1">System Status: Optimal</h3>
            <p className="text-xs text-slate-500">All identity and indexing services are fully operational.</p>
          </div>
          
          <div className="flex gap-4 text-xs text-slate-500">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Help Center</a>
          </div>
        </div>
      </div>
    </div>
  );
};
