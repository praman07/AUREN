import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  BookOpen,
  Plus,
  Layers,
  Settings,
  Sun,
  Moon,
  Building2,
  User,
  ArrowRight,
  Crown,
  Sparkles,
  Cpu,
  Network,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { NavigationTab, SearchResult, AurenDocument, Connector } from '../../types';

export type NavView = NavigationTab;

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: NavigationTab) => void;
  onNewChat?: () => void;
  onSelectDocument?: (doc: AurenDocument) => void;
  documents?: AurenDocument[];
  connectors?: Connector[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onNewChat,
  onSelectDocument,
  documents = [],
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user, activeScope, setActiveScope } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const isSuperAdmin = Boolean(user?.role === 'super_admin' || user?.isSuperAdmin);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Handle live search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.search(query);
        setResults(res.results || []);
      } catch (err) {
        console.error('Command palette search error:', err);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const defaultCommands = [
    {
      id: 'new_chat',
      label: 'Start new chat',
      icon: <Plus className="w-4 h-4 text-neutral-400" />,
      action: () => {
        if (onNewChat) onNewChat();
        else onNavigate('chat');
        onClose();
      },
    },
    {
      id: 'view_library',
      label: 'Go to Library',
      icon: <BookOpen className="w-4 h-4 text-neutral-400" />,
      action: () => {
        onNavigate('library');
        onClose();
      },
    },
    {
      id: 'view_connectors',
      label: 'View Connected Sources & GitHub',
      icon: <Layers className="w-4 h-4 text-neutral-400" />,
      action: () => {
        onNavigate('connectors');
        onClose();
      },
    },
    {
      id: 'agent_arch_reviewer',
      label: 'Run Architecture Reviewer Agent',
      icon: <Cpu className="w-4 h-4 text-purple-500" />,
      action: () => {
        onNavigate('architecture-reviewer');
        onClose();
      },
    },
    {
      id: 'agent_knowledge_curator',
      label: 'Run Knowledge Curator Agent',
      icon: <Sparkles className="w-4 h-4 text-emerald-500" />,
      action: () => {
        onNavigate('knowledge-curator');
        onClose();
      },
    },
    {
      id: 'agent_org_memory',
      label: 'Explore Organizational Memory Graph',
      icon: <Network className="w-4 h-4 text-blue-500" />,
      action: () => {
        onNavigate('organizational-memory');
        onClose();
      },
    },
    {
      id: 'toggle_scope',
      label: `Switch Scope to ${activeScope === 'personal' ? 'Organization' : 'Personal'}`,
      icon: activeScope === 'personal' ? <Building2 className="w-4 h-4 text-neutral-400" /> : <User className="w-4 h-4 text-neutral-400" />,
      action: () => {
        setActiveScope(activeScope === 'personal' ? 'organization' : 'personal');
        onClose();
      },
    },
    {
      id: 'toggle_theme',
      label: `Switch to ${isDark ? 'Light' : 'Dark'} Mode`,
      icon: isDark ? <Sun className="w-4 h-4 text-neutral-400" /> : <Moon className="w-4 h-4 text-neutral-400" />,
      action: () => {
        toggleTheme();
        onClose();
      },
    },
    {
      id: 'settings',
      label: 'Open Settings & Preferences',
      icon: <Settings className="w-4 h-4 text-neutral-400" />,
      action: () => {
        onNavigate('settings');
        onClose();
      },
    },
    ...(isSuperAdmin
      ? [
          {
            id: 'super_admin',
            label: 'Super Admin Governance Panel',
            icon: <Crown className="w-4 h-4 text-amber-500" />,
            action: () => {
              onNavigate('super-admin');
              onClose();
            },
          },
        ]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800/80">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, document name, or search term..."
            className="w-full bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none"
          />
          <kbd className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded border border-neutral-200/60 dark:border-neutral-700 font-mono shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results & Actions Area */}
        <div className="p-2 flex flex-col gap-2 max-h-80 overflow-y-auto">
          {/* Live Search Results */}
          {results.length > 0 && (
            <div className="flex flex-col gap-0.5">
              <div className="px-2.5 py-1 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                Matching Documents & Entities
              </div>
              {results.map((r) => (
                <div
                  key={r.id}
                  onClick={() => {
                    if (r.documentId && onSelectDocument) {
                      const doc = documents.find((d) => d.id === r.documentId);
                      if (doc) onSelectDocument(doc);
                    } else {
                      onNavigate('search');
                    }
                    onClose();
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800/80 cursor-pointer text-neutral-800 dark:text-neutral-200 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <BookOpen className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="font-medium truncate">{r.title}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono shrink-0 ml-2">
                    {r.sourceName}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Quick Commands */}
          <div>
            <div className="px-2.5 py-1 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              Actions & Navigation
            </div>
            {defaultCommands.map((cmd) => (
              <div
                key={cmd.id}
                onClick={cmd.action}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800/80 cursor-pointer text-neutral-800 dark:text-neutral-200 group"
              >
                <div className="flex items-center gap-2.5">
                  {cmd.icon}
                  <span>{cmd.label}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-neutral-50 dark:bg-[#111215] border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between text-[11px] text-neutral-400">
          <span>AUREN Universal Switcher</span>
          <span>Active Scope: {activeScope}</span>
        </div>
      </div>
    </div>
  );
};
