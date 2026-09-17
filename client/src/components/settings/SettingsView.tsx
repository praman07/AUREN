import React, { useState } from 'react';
import {
  User,
  Building2,
  Sliders,
  Shield,
  Moon,
  Sun,
  Laptop,
  Check,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/button';

type SettingsTab = 'profile' | 'preferences' | 'workspace' | 'security';

export const SettingsView: React.FC = () => {
  const { user, updateUserPreferences } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isSaved, setIsSaved] = useState(false);

  // Preference state
  const [defaultScope, setDefaultScope] = useState<'personal' | 'organization'>(
    user?.preferences.defaultScope || 'organization'
  );
  const [defaultChatBehavior, setDefaultChatBehavior] = useState<'concise' | 'in_depth' | 'technical'>(
    user?.preferences.defaultChatBehavior || 'in_depth'
  );
  const [notifyOnDoc, setNotifyOnDoc] = useState(
    user?.preferences.notifyOnDocumentReady ?? true
  );
  const [notifyOnSync, setNotifyOnSync] = useState(
    user?.preferences.notifyOnConnectorSync ?? true
  );

  const handleSavePreferences = async () => {
    await updateUserPreferences({
      defaultScope,
      defaultChatBehavior,
      notifyOnDocumentReady: notifyOnDoc,
      notifyOnConnectorSync: notifyOnSync,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'preferences', label: 'Preferences', icon: <Sliders className="w-4 h-4" /> },
    { id: 'workspace', label: 'Workspace', icon: <Building2 className="w-4 h-4" /> },
    { id: 'security', label: 'Security & Access', icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          Manage your account profile, workspace identity, theme, and security preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Sub-Navigation */}
        <div className="md:col-span-3 flex flex-col gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                activeTab === tab.id
                  ? 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right Settings Pane */}
        <div className="md:col-span-9 p-6 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/70 dark:border-neutral-800/80 shadow-2xs flex flex-col gap-6">
          {/* 1. Profile Tab */}
          {activeTab === 'profile' && (
            <div className="flex flex-col gap-6">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Personal Profile
              </h2>

              <div className="flex items-center gap-4">
                <img
                  src={
                    user?.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={user?.name || 'User'}
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-neutral-200 dark:ring-neutral-700"
                  referrerPolicy="no-referrer"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {user?.name || 'Alex Vance'}
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">
                    {user?.email || 'alex.vance@auren.internal'}
                  </span>
                  <span className="text-xs text-neutral-500 mt-1 capitalize font-medium">
                    Role: {user?.role} • {user?.department}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                <div className="flex flex-col gap-1">
                  <span className="text-neutral-400">User Identity ID</span>
                  <span className="font-mono text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 p-2 rounded-md">
                    {user?.id}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-neutral-400">Department</span>
                  <span className="text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 p-2 rounded-md font-medium">
                    {user?.department}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 2. Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="flex flex-col gap-6 text-xs">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Interface & Research Preferences
              </h2>

              {/* Theme Selector */}
              <div className="flex flex-col gap-2">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  Theme Appearance
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${
                      theme === 'light'
                        ? 'border-neutral-900 bg-neutral-100 dark:border-white dark:bg-neutral-800'
                        : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>Light</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${
                      theme === 'dark'
                        ? 'border-neutral-900 bg-neutral-100 dark:border-white dark:bg-neutral-800'
                        : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span>Dark</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${
                      theme === 'system'
                        ? 'border-neutral-900 bg-neutral-100 dark:border-white dark:bg-neutral-800'
                        : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                    }`}
                  >
                    <Laptop className="w-4 h-4" />
                    <span>System</span>
                  </button>
                </div>
              </div>

              {/* Default Knowledge Scope */}
              <div className="flex flex-col gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  Default Query Scope
                </span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="defaultScope"
                      checked={defaultScope === 'personal'}
                      onChange={() => setDefaultScope('personal')}
                    />
                    <span>Personal (Private Vault)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="defaultScope"
                      checked={defaultScope === 'organization'}
                      onChange={() => setDefaultScope('organization')}
                    />
                    <span>Organization (Shared Knowledge)</span>
                  </label>
                </div>
              </div>

              {/* Default Chat Behavior */}
              <div className="flex flex-col gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  Default Chat Synthesis Depth
                </span>
                <select
                  value={defaultChatBehavior}
                  onChange={(e) => setDefaultChatBehavior(e.target.value as any)}
                  className="p-2 rounded-lg bg-neutral-50 dark:bg-[#1A1B1E] border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200"
                >
                  <option value="concise">Concise & Direct (Executive highlights)</option>
                  <option value="in_depth">In-Depth & Grounded (Standard AUREN research)</option>
                  <option value="technical">Technical & Code-centric (Architecture focus)</option>
                </select>
              </div>

              {/* Notifications */}
              <div className="flex flex-col gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  Notification Alerts
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyOnDoc}
                    onChange={(e) => setNotifyOnDoc(e.target.checked)}
                  />
                  <span>Notify when document processing completes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyOnSync}
                    onChange={(e) => setNotifyOnSync(e.target.checked)}
                  />
                  <span>Notify when connector synchronization completes</span>
                </label>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSavePreferences}
                  icon={isSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : undefined}
                >
                  {isSaved ? 'Preferences Saved' : 'Save Preferences'}
                </Button>
              </div>
            </div>
          )}

          {/* 3. Workspace Tab */}
          {activeTab === 'workspace' && (
            <div className="flex flex-col gap-4 text-xs">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Organization Workspace
              </h2>
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#121316] border border-neutral-200/60 dark:border-neutral-800 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                    {user?.organization.name}
                  </span>
                  <span className="font-mono text-neutral-400">{user?.organization.domain}</span>
                </div>
                <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Organization tenant isolation is active. Qdrant vector spaces and document repositories are strictly segmented per organization ID ({user?.organization.id}).
                </p>
              </div>
            </div>
          )}

          {/* 4. Security Tab */}
          {activeTab === 'security' && (
            <div className="flex flex-col gap-4 text-xs">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>Security & Authorization Guarantees</span>
              </h2>

              <div className="flex flex-col gap-3">
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#121316] border border-neutral-200/60 dark:border-neutral-800">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
                    Personal vs. Organization Cryptographic Boundary
                  </span>
                  <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Personal documents are encrypted with your owner-derived keys. Organization documents are governed by DocumentAccessPolicy and Role-Based Access Control (RBAC). No personal embeddings are queried during organization-wide requests.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#121316] border border-neutral-200/60 dark:border-neutral-800">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
                    Connector Token Isolation
                  </span>
                  <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    OAuth access tokens for GitHub and corporate drives are encrypted at rest in PostgreSQL and never exposed to the client interface.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
