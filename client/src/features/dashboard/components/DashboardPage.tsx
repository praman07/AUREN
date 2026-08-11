import React from 'react';
import { Search, Sparkles, Upload } from 'lucide-react';
import { useUploadStore } from '../../documents/store/useUploadStore';

import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { setIsOpen } = useUploadStore();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 pb-6 overflow-y-auto pr-2">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome to AUREN</h1>
        <p className="text-sm text-muted-foreground mt-1">Enterprise Knowledge & Intelligence</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Quick Actions */}
        <button onClick={() => setIsOpen(true)} className="flex flex-col items-start p-4 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors text-left">
          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center mb-3">
            <Upload size={16} className="text-primary" />
          </div>
          <h3 className="font-medium text-sm text-foreground">Upload Document</h3>
          <p className="text-xs text-muted-foreground mt-1">Add to organizational knowledge</p>
        </button>

        <button onClick={() => navigate('/search')} className="flex flex-col items-start p-4 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors text-left">
          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center mb-3">
            <Search size={16} className="text-primary" />
          </div>
          <h3 className="font-medium text-sm text-foreground">Semantic Search</h3>
          <p className="text-xs text-muted-foreground mt-1">Find facts across the organization</p>
        </button>

        <button className="flex flex-col items-start p-4 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors text-left">
          <div className="w-8 h-8 rounded bg-ai/10 flex items-center justify-center mb-3">
            <Sparkles size={16} className="text-ai" />
          </div>
          <h3 className="font-medium text-sm text-foreground">New Conversation</h3>
          <p className="text-xs text-muted-foreground mt-1">Chat securely with AUREN AI</p>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Recent Documents</h2>
          <div className="border border-border rounded-lg bg-card p-6 text-center text-sm text-muted-foreground">
            No recent documents found.
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Recent Conversations</h2>
          <div className="border border-border rounded-lg bg-card p-6 text-center text-sm text-muted-foreground">
            No recent conversations found.
          </div>
        </div>
      </div>
    </div>
  );
};
