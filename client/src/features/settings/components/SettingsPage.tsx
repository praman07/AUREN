import React, { useState } from 'react';
import { ConnectorsList } from './ConnectorsList';
import { RBACPolicyManager } from './RBACPolicyManager';
import { Settings, Link, ShieldCheck, Building } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'connectors' | 'rbac' | 'workspace'>('connectors');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6 text-muted-foreground" />
          Settings & Administration
        </h2>
        <p className="text-muted-foreground mt-1">
          Manage integrations, security policies, and workspace preferences.
        </p>
      </div>

      <div className="flex space-x-1 border-b border-border">
        <button
          onClick={() => setActiveTab('connectors')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'connectors'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          <Link className="w-4 h-4" />
          Data Connectors
        </button>
        <button
          onClick={() => setActiveTab('rbac')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'rbac'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Security & RBAC
        </button>
        <button
          onClick={() => setActiveTab('workspace')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'workspace'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          <Building className="w-4 h-4" />
          Workspace
        </button>
      </div>

      <div className="pt-4">
        {activeTab === 'connectors' && <ConnectorsList />}
        {activeTab === 'rbac' && <RBACPolicyManager />}
        {activeTab === 'workspace' && (
          <div className="p-8 text-center border border-dashed border-border rounded-lg bg-card">
            <h3 className="text-lg font-medium text-foreground mb-2">Workspace Settings</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Configure organizational details, industry templates, and default AI model preferences here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
