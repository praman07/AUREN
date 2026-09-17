import React, { useState } from 'react';
import {
  User,
  Building2,
  Mail,
  Shield,
  ShieldCheck,
  Sparkles,
  Code2,
  Bookmark,
  Layers,
  Save,
  Check,
  Key,
  Sliders,
  Sun,
  Moon,
  Laptop,
  Lock,
  CheckCircle2,
  XCircle,
  FileText,
  GitBranch,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { useNotifications } from '../../context/NotificationContext';

export interface ProfileViewProps {
  initialSubTab?: 'profile' | 'access' | 'settings' | 'workspace' | 'security';
}

export const ProfileView: React.FC<ProfileViewProps> = ({ initialSubTab = 'profile' }) => {
  const { user, updateUserPreferences } = useAuth();
  const { theme, setTheme } = useTheme();
  const { addNotification } = useNotifications();

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'access' | 'settings' | 'workspace' | 'security'>(
    initialSubTab
  );

  // Profile Information
  const [name, setName] = useState(user?.name || 'Praman Singh Bhogal');
  const [email, setEmail] = useState(user?.email || 'praman@example.com');
  const [department, setDepartment] = useState(user?.department || 'Core Architecture');

  // Context AUREN can use
  const [preferredLanguage, setPreferredLanguage] = useState(
    user?.personalContext?.preferredLanguage || 'TypeScript'
  );
  const [currentProject, setCurrentProject] = useState(
    user?.personalContext?.currentProject || 'AUREN Knowledge Platform'
  );
  const [interests, setInterests] = useState(
    user?.personalContext?.recentInterests?.join(', ') ||
      'RAG Architectures, System Design, Zero-Trust Access'
  );

  // Preferences
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

  const [isProfileSaved, setIsProfileSaved] = useState(false);
  const [isPrefsSaved, setIsPrefsSaved] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileSaved(true);
    addNotification({
      title: 'Profile Updated',
      message: 'Personal context and profile details saved successfully.',
      type: 'document_ready',
    });
    setTimeout(() => setIsProfileSaved(false), 2000);
  };

  const handleSavePreferences = async () => {
    await updateUserPreferences({
      defaultScope,
      defaultChatBehavior,
      notifyOnDocumentReady: notifyOnDoc,
      notifyOnConnectorSync: notifyOnSync,
    });
    setIsPrefsSaved(true);
    addNotification({
      title: 'Preferences Saved',
      message: 'Workspace and interface preferences updated.',
      type: 'document_ready',
    });
    setTimeout(() => setIsPrefsSaved(false), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 py-6 px-4 sm:px-6 lg:px-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200/70 dark:border-neutral-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            User Profile
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Manage your account credentials, AI synthesis context, workspace settings, and security preferences.
          </p>
        </div>

        {/* Sub-tab switcher */}
        <div className="inline-flex p-1 bg-neutral-200/60 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 rounded-xl self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setActiveSubTab('profile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeSubTab === 'profile'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Identity</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('access')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeSubTab === 'access'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>My Access</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeSubTab === 'settings'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Settings & Preferences</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('workspace')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeSubTab === 'workspace'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Workspace</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('security')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeSubTab === 'security'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Security</span>
          </button>
        </div>
      </div>

      {/* 1. Profile & Identity Subtab */}
      {activeSubTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Avatar & Workspace Tag */}
          <div className="flex flex-col gap-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 flex flex-col items-center text-center gap-3 shadow-2xs">
              <img
                src={
                  user?.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                }
                alt={name}
                className="w-20 h-20 rounded-full object-cover ring-2 ring-neutral-200 dark:ring-neutral-700"
                referrerPolicy="no-referrer"
              />
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                  {name}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">{email}</span>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <Badge variant="neutral" size="sm">
                  Department Head
                </Badge>
                <Badge variant="organization" size="sm">
                  GNA / AUREN
                </Badge>
              </div>
            </div>

            {/* Organization Membership Card */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 flex flex-col gap-2.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                <Building2 className="w-4 h-4 text-neutral-500" />
                <span>Workspace Membership</span>
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400">
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  GNA / AUREN Workspace
                </span>
                <div className="text-[11px] text-neutral-500 mt-0.5">
                  Department: {department}
                </div>
                <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                  Tenant: gna.internal
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Identity details & Context AUREN can use */}
          <div className="md:col-span-2 flex flex-col gap-5">
            {/* Identity Form */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 flex flex-col gap-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Personal Information
                </h2>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveProfile}
                  icon={isProfileSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                >
                  {isProfileSaved ? 'Saved' : 'Save Changes'}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <Input
                  label="Primary Department"
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Role & Clearance
                  </label>
                  <input
                    type="text"
                    value="Department Head (L6_Executive)"
                    disabled
                    className="w-full text-xs px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
                  />
                </div>
              </div>
            </div>

            {/* Context AUREN can use */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 flex flex-col gap-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                    Synthesis Context AUREN Can Use
                  </h2>
                </div>
                <span className="text-[11px] text-neutral-400">
                  Transparent & editable
                </span>
              </div>

              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                These preferences help AUREN calibrate code explanations, architectural suggestions, and citations according to your role without making ungrounded assumptions.
              </p>

              <div className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Preferred Programming Language</span>
                  </label>
                  <input
                    type="text"
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    placeholder="e.g. TypeScript"
                    className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl bg-neutral-50 dark:bg-[#1B1C20] border border-neutral-200/80 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Current Focus / Project</span>
                  </label>
                  <input
                    type="text"
                    value={currentProject}
                    onChange={(e) => setCurrentProject(e.target.value)}
                    placeholder="e.g. AUREN Knowledge Platform"
                    className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl bg-neutral-50 dark:bg-[#1B1C20] border border-neutral-200/80 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Recent Research Interests</span>
                  </label>
                  <input
                    type="text"
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    placeholder="e.g. RAG Architectures, System Design, Zero-Trust Access"
                    className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl bg-neutral-50 dark:bg-[#1B1C20] border border-neutral-200/80 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. My Access Subtab (Phase 11) */}
      {activeSubTab === 'access' && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          {/* Top Identity Header Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                      My Access & Clearance Profile
                    </h2>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                      Super Admin Clearance
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Real-time clearance credentials, accessible knowledge domains, and zero-trust permissions.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <span className="text-xs font-mono text-neutral-400">Persona:</span>
                <span className="text-xs font-semibold text-neutral-900 dark:text-white px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  {user?.name || 'Praman Singh Bhogal'}
                </span>
              </div>
            </div>

            {/* Clearance Attributes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-xs">
              <div className="p-3 rounded-xl bg-neutral-50/80 dark:bg-[#18191D] border border-neutral-200/60 dark:border-neutral-800/60">
                <span className="text-[10px] text-neutral-400 uppercase font-mono block mb-1">
                  Global Role
                </span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  Super Admin
                </span>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50/80 dark:bg-[#18191D] border border-neutral-200/60 dark:border-neutral-800/60">
                <span className="text-[10px] text-neutral-400 uppercase font-mono block mb-1">
                  Department
                </span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  Engineering / Platform
                </span>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50/80 dark:bg-[#18191D] border border-neutral-200/60 dark:border-neutral-800/60">
                <span className="text-[10px] text-neutral-400 uppercase font-mono block mb-1">
                  Clearance Level
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Tier 4 / Senior Staff
                </span>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50/80 dark:bg-[#18191D] border border-neutral-200/60 dark:border-neutral-800/60">
                <span className="text-[10px] text-neutral-400 uppercase font-mono block mb-1">
                  Cross-Dept Gate
                </span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  Unrestricted
                </span>
              </div>
            </div>
          </div>

          {/* Accessible Knowledge vs Restricted Knowledge */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Accessible Knowledge Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Accessible Knowledge & Domains
                </h3>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  Full Clearance
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {[
                  {
                    title: 'Organization-Wide Knowledge Vault',
                    desc: 'Full read & query authorization across all non-locked department documents.',
                    type: 'Library',
                  },
                  {
                    title: 'Full GitHub Enterprise Sync',
                    desc: 'Read & index authorization for repositories, commit trees, and PR discussions.',
                    type: 'Connector',
                  },
                  {
                    title: 'Core Architecture & Platform Specifications',
                    desc: 'Distributed consensus, vector databases, raft quorums, and API gateways.',
                    type: 'Domain',
                  },
                  {
                    title: 'Security, IAM & Zero-Trust Governance',
                    desc: 'Clearance matrices, access simulator, cryptographic audit ledger, and SOC2 runbooks.',
                    type: 'Domain',
                  },
                  {
                    title: 'Personal Private Vault',
                    desc: 'Private encryption keys isolated to Praman Singh Bhogal; excluded from org queries.',
                    type: 'Scope',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-neutral-50/70 dark:bg-[#18191D] border border-neutral-200/60 dark:border-neutral-800/60 flex items-start justify-between gap-3"
                  >
                    <div>
                      <span className="font-semibold text-neutral-900 dark:text-white block">
                        {item.title}
                      </span>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 shrink-0">
                      {item.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Restricted Knowledge & Zero-Trust Boundaries */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-neutral-400" />
                  Boundary Enforcements & Restrictions
                </h3>
                <span className="text-[11px] font-mono text-neutral-400">
                  Zero-Trust
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-neutral-50/70 dark:bg-[#18191D] border border-neutral-200/60 dark:border-neutral-800/60">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold mb-1">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Total Lockdown Documents</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Documents flagged under Total Lockdown by governance policy cannot be read or retrieved even by Super Admins until explicitly unlocked in the RBAC matrix.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50/70 dark:bg-[#18191D] border border-neutral-200/60 dark:border-neutral-800/60">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold mb-1">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Peer Personal Vaults</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Personal documents belonging to other team members (Elena, Marcus, Aria, Devon) are cryptographically isolated and never accessible by administrative roles.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50/70 dark:bg-[#18191D] border border-neutral-200/60 dark:border-neutral-800/60">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold mb-1">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Tamper-Evident Audit Logging</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    All administrative queries, clearance shifts, and policy adjustments initiated under this profile are cryptographically signed and appended to the immutable system ledger.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Settings & Preferences Subtab (Nested directly under UserProfile) */}
      {activeSubTab === 'settings' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xs flex flex-col gap-6 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Preferences & Workspace Defaults
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Customize your visual theme, synthesis depth, default scope, and alerts.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSavePreferences}
              icon={isPrefsSaved ? <Check className="w-3.5 h-3.5" /> : undefined}
            >
              {isPrefsSaved ? 'Saved' : 'Save Preferences'}
            </Button>
          </div>

          {/* Theme Selector */}
          <div className="flex flex-col gap-2.5">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
              Theme Appearance
            </span>
            <div className="grid grid-cols-3 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${
                  theme === 'light'
                    ? 'border-neutral-900 bg-neutral-100 dark:border-white dark:bg-neutral-800 font-semibold'
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
                    ? 'border-neutral-900 bg-neutral-100 dark:border-white dark:bg-neutral-800 font-semibold'
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
                    ? 'border-neutral-900 bg-neutral-100 dark:border-white dark:bg-neutral-800 font-semibold'
                    : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span>System</span>
              </button>
            </div>
          </div>

          {/* Default Knowledge Scope */}
          <div className="flex flex-col gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
              Default Query Scope
            </span>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-700 dark:text-neutral-300">
                <input
                  type="radio"
                  name="defaultScope"
                  checked={defaultScope === 'personal'}
                  onChange={() => setDefaultScope('personal')}
                  className="accent-neutral-900 dark:accent-white"
                />
                <span>Personal (Private Vault)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-neutral-700 dark:text-neutral-300">
                <input
                  type="radio"
                  name="defaultScope"
                  checked={defaultScope === 'organization'}
                  onChange={() => setDefaultScope('organization')}
                  className="accent-neutral-900 dark:accent-white"
                />
                <span>Organization (Shared Knowledge)</span>
              </label>
            </div>
          </div>

          {/* Default Chat Synthesis Depth */}
          <div className="flex flex-col gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800 max-w-md">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
              Default Chat Synthesis Depth
            </span>
            <select
              value={defaultChatBehavior}
              onChange={(e) => setDefaultChatBehavior(e.target.value as any)}
              className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#1A1B1E] border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 focus:outline-none"
            >
              <option value="concise">Concise & Direct (Executive highlights)</option>
              <option value="in_depth">In-Depth & Grounded (Standard AUREN research)</option>
              <option value="technical">Technical & Code-Centric (Architecture focus)</option>
            </select>
          </div>

          {/* Notification Alerts */}
          <div className="flex flex-col gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
              Notification Alerts
            </span>
            <label className="flex items-center gap-2 cursor-pointer text-neutral-700 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={notifyOnDoc}
                onChange={(e) => setNotifyOnDoc(e.target.checked)}
                className="accent-neutral-900 dark:accent-white rounded"
              />
              <span>Notify when document processing completes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-neutral-700 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={notifyOnSync}
                onChange={(e) => setNotifyOnSync(e.target.checked)}
                className="accent-neutral-900 dark:accent-white rounded"
              />
              <span>Notify when connector synchronization completes</span>
            </label>
          </div>
        </div>
      )}

      {/* 3. Workspace Subtab */}
      {activeSubTab === 'workspace' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xs flex flex-col gap-4 text-xs">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Organization Workspace
          </h2>
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#121316] border border-neutral-200/60 dark:border-neutral-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                {user?.organization.name || 'GNA / AUREN Workspace'}
              </span>
              <span className="font-mono text-neutral-400">{user?.organization.domain || 'gna.internal'}</span>
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Organization tenant isolation is active. Qdrant vector spaces and document repositories are strictly segmented per organization ID ({user?.organization.id || 'org_gna_01'}).
            </p>
          </div>
        </div>
      )}

      {/* 4. Security Subtab */}
      {activeSubTab === 'security' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xs flex flex-col gap-4 text-xs">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Security & Cryptographic Guarantees</span>
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
  );
};
