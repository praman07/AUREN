import React from 'react';
import { Database, FolderSync, Network, ShieldCheck, HardDrive, Share2, UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MemoryConsolePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 pb-6 overflow-y-auto pr-2">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Database className="w-6 h-6 text-primary" />
          Memory Console
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage organizational knowledge graph and active connectors.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 border border-border rounded-lg bg-card flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Total Vectors</p>
            <p className="text-2xl font-bold text-foreground mt-1">12,405</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Network className="w-5 h-5 text-primary" />
          </div>
        </div>
        
        <div className="p-4 border border-border rounded-lg bg-card flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Indexed Docs</p>
            <p className="text-2xl font-bold text-foreground mt-1">1,248</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-green-500" />
          </div>
        </div>

        <div className="p-4 border border-border rounded-lg bg-card flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Active Syncs</p>
            <p className="text-2xl font-bold text-foreground mt-1">3</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
            <FolderSync className="w-5 h-5 text-blue-500" />
          </div>
        </div>
        
        <div className="p-4 border border-border rounded-lg bg-card flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Storage Used</p>
            <p className="text-2xl font-bold text-foreground mt-1">14.2 GB</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
            <HardDrive className="w-5 h-5 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="mb-6 flex justify-between items-end">
        <h2 className="text-lg font-semibold text-foreground">Data Connectors</h2>
        <button onClick={() => {}} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded font-medium hover:bg-primary/90 transition-colors">
          + Add Connector
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Connector Card 1 */}
        <div className="border border-border rounded-lg bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-md flex items-center justify-center">
                <UploadCloud className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Local File Uploads</h3>
                <p className="text-xs text-muted-foreground">Direct manual uploads</p>
              </div>
            </div>
            <div className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] uppercase font-bold tracking-wider rounded">
              Active
            </div>
          </div>
          <div className="text-xs text-muted-foreground mb-4">
            Standard ingestion pipeline for manually uploaded PDFs, DOCX, and TXT files.
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Last synced: Just now</span>
            <button onClick={() => navigate('/documents')} className="text-primary hover:underline">View files &rarr;</button>
          </div>
        </div>

        {/* Connector Card 2 */}
        <div className="border border-border rounded-lg bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#f6f6f6] dark:bg-white rounded-md flex items-center justify-center">
                <Share2 className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Notion Workspace</h3>
                <p className="text-xs text-muted-foreground">Connected via OAuth</p>
              </div>
            </div>
            <div className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] uppercase font-bold tracking-wider rounded">
              Active
            </div>
          </div>
          <div className="text-xs text-muted-foreground mb-4">
            Automatically syncing pages from "Engineering" and "Product" teams.
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Last synced: 2 hours ago</span>
            <button className="text-primary hover:underline">Configure &rarr;</button>
          </div>
        </div>
      </div>
    </div>
  );
};
