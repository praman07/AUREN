import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { ConnectorsList } from './ConnectorsList';
import { RBACPolicyManager } from './RBACPolicyManager';
import { Settings, Link, ShieldCheck, Building } from 'lucide-react';
import { cn } from '../../../lib/utils';

export const SettingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const getInitialTab = (): 'connectors' | 'rbac' | 'workspace' => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'rbac' || tabParam === 'workspace' || tabParam === 'connectors') {
      return tabParam;
    }
    if (location.pathname.startsWith('/integrations')) {
      return 'connectors';
    }
    return 'connectors';
  };

  const [activeTab, setActiveTab] = useState<'connectors' | 'rbac' | 'workspace'>(getInitialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'rbac' || tabParam === 'workspace' || tabParam === 'connectors') {
      setActiveTab(tabParam);
    } else if (location.pathname.startsWith('/integrations')) {
      setActiveTab('connectors');
    }
  }, [searchParams, location.pathname]);

  const handleTabChange = (tab: 'connectors' | 'rbac' | 'workspace') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-slate-700" />
          Settings & Administration
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Manage integrations, security policies, and workspace preferences.
        </p>
      </div>

      <div className="flex space-x-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80 w-fit">
        <button
          onClick={() => handleTabChange('connectors')}
          className={cn(
            'px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2',
            activeTab === 'connectors'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <Link className="w-4 h-4 text-blue-600" />
          Data Connectors
        </button>
        <button
          onClick={() => handleTabChange('rbac')}
          className={cn(
            'px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2',
            activeTab === 'rbac'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Security & RBAC
        </button>
        <button
          onClick={() => handleTabChange('workspace')}
          className={cn(
            'px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2',
            activeTab === 'workspace'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <Building className="w-4 h-4 text-purple-600" />
          Workspace
        </button>
      </div>

      <div className="pt-2">
        {activeTab === 'connectors' && <ConnectorsList />}
        {activeTab === 'rbac' && <RBACPolicyManager />}
        {activeTab === 'workspace' && (
          <div className="p-10 text-center border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
            <Building className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 mb-1">Workspace Preferences</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Configure organizational details, industry templates, and default AI model preferences for all users.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

