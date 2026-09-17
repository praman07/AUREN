import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuthStore } from '../../core/auth/store/useAuthStore';
import { api } from '../../services/api';
import type { AurenDocument } from '../../types';
import type { GovernedAgent } from '../../types/agents';
import { INITIAL_GOVERNED_AGENTS } from '../../services/governedAgentsData';

// Clean Handcrafted Inline SVG Icons
const IconSearch: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const IconArrowRight: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const IconBookOpen: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 2-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const IconShieldCheck: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const IconDatabase: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
  </svg>
);

const IconBot: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v2" />
    <path d="M9 13v2" />
  </svg>
);

const IconNetwork: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="16" y="16" width="6" height="6" rx="1" />
    <rect x="2" y="16" width="6" height="6" rx="1" />
    <rect x="9" y="2" width="6" height="6" rx="1" />
    <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
    <path d="M12 12V8" />
  </svg>
);

const IconChevronRight: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const IconFileText: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10 9H8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </svg>
);

const IconActivity: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const IconSparkles: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
  </svg>
);

// Handcrafted platform icons
const HandcraftedPlatformIcon: React.FC<{ platform: string; className?: string }> = ({ platform, className = 'w-4 h-4' }) => {
  if (platform === 'github') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    );
  }
  if (platform === 'google_drive') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    );
  }
  if (platform === 'slack') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
};

export const DashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { user: authContextUser } = useAuth();
  const authStoreUser = useAuthStore((state) => state.user);

  const user = authContextUser || {
    name: `${authStoreUser?.firstName || ''} ${authStoreUser?.lastName || ''}`.trim() || 'Elena Rostova',
    email: authStoreUser?.email || 'elena.rostova@auren.ai',
    role: authStoreUser?.isSuperAdmin ? 'super_admin' : 'dept_head',
    department: authStoreUser?.departments?.[0] || 'Core Architecture',
  };

  const [documents, setDocuments] = useState<AurenDocument[]>([]);
  const [agents] = useState<GovernedAgent[]>(INITIAL_GOVERNED_AGENTS);
  const [quickQuery, setQuickQuery] = useState('');
  const [_isLoadingDocs, setIsLoadingDocs] = useState(true);

  useEffect(() => {
    let mounted = true;
    api
      .getDocuments()
      .then((docs) => {
        if (mounted) {
          setDocuments(docs || []);
          setIsLoadingDocs(false);
        }
      })
      .catch(() => {
        if (mounted) setIsLoadingDocs(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleAskAurenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickQuery.trim()) {
      navigate('/chat', { state: { initialQuery: quickQuery.trim() } });
    } else {
      navigate('/chat');
    }
  };

  const handleQuickPromptClick = (promptText: string) => {
    navigate('/chat', { state: { initialQuery: promptText } });
  };

  const recentDocs = documents.slice(0, 4);

  const sampleConnectors = [
    { name: 'GitHub Enterprise', type: 'github', status: 'active', syncedAgo: '3m ago', items: '48 repos' },
    { name: 'Google Workspace', type: 'google_drive', status: 'active', syncedAgo: '12m ago', items: '142 files' },
    { name: 'Slack Architecture', type: 'slack', status: 'active', syncedAgo: '1m ago', items: '24 channels' },
    { name: 'Jira Core Workspace', type: 'jira', status: 'active', syncedAgo: '1h ago', items: '312 tickets' },
  ];

  const recentActivities = [
    {
      id: 'act_1',
      title: 'Enterprise Architecture Spec Synchronized',
      category: 'RAG Ingestion',
      time: '4 mins ago',
      icon: <IconBookOpen className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />,
    },
    {
      id: 'act_2',
      title: 'Architecture Reviewer Agent Sweep',
      category: 'Governed Agent',
      time: '18 mins ago',
      icon: <IconBot className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />,
    },
    {
      id: 'act_3',
      title: 'RBAC Policy Shift: Senior Staff Clearance',
      category: 'Clearance',
      time: '1 hour ago',
      icon: <IconShieldCheck className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />,
    },
    {
      id: 'act_4',
      title: 'GitHub Enterprise Sync Completed',
      category: 'Connector',
      time: '2 hours ago',
      icon: <IconDatabase className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />,
    },
  ];

  return (
    <div className="w-full flex flex-col gap-6 max-w-7xl mx-auto font-sans antialiased text-neutral-900 dark:text-neutral-100">
      {/* 1. HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Workspace Overview
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Welcome back, <span className="font-semibold text-neutral-800 dark:text-neutral-200">{user.name}</span> • {user.department}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 text-xs font-medium text-neutral-700 dark:text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>System Operational</span>
          </div>

          <div className="px-3 py-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 text-xs font-medium text-neutral-700 dark:text-neutral-300">
            Clearance: <span className="font-mono text-neutral-900 dark:text-neutral-100">{user.role === 'super_admin' ? 'Level 4' : 'Level 3'}</span>
          </div>
        </div>
      </div>

      {/* 2. COMMAND SEARCH BAR */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-xs">
        <form onSubmit={handleAskAurenSubmit} className="flex flex-col gap-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Query Enterprise Knowledge & AI Workforce
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <IconSearch className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 shrink-0" />
              <input
                type="text"
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                placeholder="Ask AUREN anything across synchronized knowledge nodes, documents, or agents..."
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-neutral-900 dark:focus:border-neutral-100 focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 text-xs font-medium px-4 py-2.5 rounded-lg shrink-0 transition-colors cursor-pointer"
            >
              <span>Ask AUREN</span>
              <IconArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-neutral-500">
            <span className="text-[11px] font-mono text-neutral-400 shrink-0">Suggestions:</span>
            {[
              'Summarize Q3 Architecture Spec',
              'Audit RBAC Clearance Policies',
              'Check Connector Health',
              'Synthesize Incident Report',
            ].map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleQuickPromptClick(prompt)}
                className="px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[11px] border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* 3. METRIC STRIP (4 CLEAN CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div
          onClick={() => navigate('/documents')}
          className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              <span>Knowledge Items</span>
              <IconBookOpen className="w-4 h-4 text-neutral-400 shrink-0" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mt-2">
              {documents.length > 0 ? documents.length : 148}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 truncate">
              Synchronized & indexed specs
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs font-medium text-neutral-700 dark:text-neutral-300">
            <span>Knowledge Vault</span>
            <IconChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
          </div>
        </div>

        {/* Metric 2 */}
        <div
          onClick={() => navigate('/agents')}
          className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              <span>Governed AI Agents</span>
              <IconBot className="w-4 h-4 text-neutral-400 shrink-0" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mt-2">
              {agents.length} Active
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 truncate">
              Constitutional & RBAC bounded
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs font-medium text-neutral-700 dark:text-neutral-300">
            <span>Manage Workforce</span>
            <IconChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
          </div>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => navigate('/connectors')}
          className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              <span>Data Connectors</span>
              <IconDatabase className="w-4 h-4 text-neutral-400 shrink-0" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mt-2">
              4 Connected
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 truncate">
              GitHub, Drive, Slack, Jira
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs font-medium text-neutral-700 dark:text-neutral-300">
            <span>Configure Connectors</span>
            <IconChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
          </div>
        </div>

        {/* Metric 4 */}
        <div
          onClick={() => navigate('/departments')}
          className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              <span>Clearance & Policy</span>
              <IconShieldCheck className="w-4 h-4 text-neutral-400 shrink-0" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mt-2">
              100% Compliant
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 truncate">
              Zero-Trust RBAC active
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs font-medium text-neutral-700 dark:text-neutral-300">
            <span>Security Matrix</span>
            <IconChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
          </div>
        </div>
      </div>

      {/* 4. MAIN CONTENT AREA (2 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Data & Agents (2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6 min-w-0">
          {/* Section: Recent Knowledge Artifacts */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <IconFileText className="w-4 h-4 text-neutral-600 dark:text-neutral-400 shrink-0" />
                  Recent Knowledge Artifacts
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Synchronized documents and repositories across your clearance scope.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/documents')}
                className="text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 transition-colors cursor-pointer shrink-0"
              >
                View All ({documents.length})
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {recentDocs.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg">
                  Loading documents...
                </div>
              ) : (
                recentDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => navigate('/documents')}
                    className="p-3.5 rounded-lg border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60 transition-colors flex items-center justify-between gap-4 cursor-pointer min-w-0"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center shrink-0 font-mono text-[11px] font-bold uppercase">
                        {doc.type}
                      </div>

                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-xs text-neutral-900 dark:text-neutral-100 truncate">
                            {doc.title}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 uppercase tracking-wider shrink-0">
                            {doc.scope}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                          {doc.intelligence?.executiveSummary || doc.filename}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-neutral-400 font-mono hidden sm:inline">
                        {doc.fileSize || '1.2 MB'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/chat', { state: { initialQuery: `Explain document: ${doc.title}` } });
                        }}
                        className="px-2.5 py-1 rounded text-xs font-medium bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                      >
                        Query
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section: Governed AI Workforce */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <IconBot className="w-4 h-4 text-neutral-600 dark:text-neutral-400 shrink-0" />
                  Active Governed Agent Workforce
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Autonomous background agents bounded by constitutional rules and clearance.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/agents')}
                className="text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 transition-colors cursor-pointer shrink-0"
              >
                View Trace
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {agents.slice(0, 2).map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => navigate('/agents')}
                  className="p-4 rounded-lg border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer flex flex-col justify-between gap-3 min-w-0"
                >
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 truncate">
                        {agent.name}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 uppercase shrink-0">
                        {agent.status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-mono truncate">
                      {agent.role}
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 mt-2 leading-relaxed">
                      {agent.purpose}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                    <span>Clearance: {agent.minClearance}</span>
                    <span className="text-neutral-700 dark:text-neutral-300 font-medium">Inspect →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Quick Actions & Operations (1 col) */}
        <div className="flex flex-col gap-6 min-w-0">
          {/* Quick Actions Panel */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
              Quick Actions
            </h3>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => navigate('/chat')}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 text-xs font-medium transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <IconSparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>New AI Chat Query</span>
                </div>
                <IconArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/documents')}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-medium border border-neutral-200/80 dark:border-neutral-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <IconBookOpen className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span>Knowledge Vault</span>
                </div>
                <IconChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/connectors')}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-medium border border-neutral-200/80 dark:border-neutral-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <IconDatabase className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span>Data Connectors</span>
                </div>
                <IconChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/memory')}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-medium border border-neutral-200/80 dark:border-neutral-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <IconNetwork className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span>Organizational Memory Graph</span>
                </div>
                <IconChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              </button>
            </div>
          </div>

          {/* Connectors Status */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                <IconDatabase className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                Data Connectors
              </h3>
              <button
                type="button"
                onClick={() => navigate('/connectors')}
                className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 hover:underline cursor-pointer shrink-0"
              >
                Manage
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {sampleConnectors.map((c) => (
                <div
                  key={c.name}
                  onClick={() => navigate('/connectors')}
                  className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/60 dark:border-neutral-800 flex items-center justify-between text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer min-w-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <HandcraftedPlatformIcon platform={c.type} className="w-4 h-4 shrink-0 text-neutral-600 dark:text-neutral-400" />
                    <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                      {c.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-neutral-400 font-mono">{c.items}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-Time Activity Feed */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                <IconActivity className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                System Activity Feed
              </h3>
              <span className="text-[10px] text-neutral-400 font-mono shrink-0">LIVE</span>
            </div>

            <div className="flex flex-col gap-3">
              {recentActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs min-w-0">
                  <div className="p-1 rounded bg-neutral-100 dark:bg-neutral-800 shrink-0 mt-0.5">
                    {act.icon}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                      {act.title}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-0.5">
                      <span className="font-mono">{act.category}</span>
                      <span>•</span>
                      <span>{act.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
