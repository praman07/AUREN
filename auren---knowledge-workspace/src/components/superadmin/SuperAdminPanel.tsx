import React, { useState, useEffect } from 'react';
import {
  Crown,
  Building,
  Send,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Users,
  Bell,
  Shield,
  Eye,
  RefreshCw,
  Lock,
  Unlock,
  Radio,
  Check,
  X,
  ArrowRight,
  ExternalLink,
  Download,
  Filter,
  Clock,
  Bot,
  Sliders,
  Cpu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { DepartmentInfo, SuperAdminActionItem, AurenDocument } from '../../types';
import { GovernedAgent, AgentActivityItem } from '../../types/agents';
import { INITIAL_GOVERNED_AGENTS, INITIAL_AGENT_ACTIVITIES } from '../../services/governedAgentsData';
import { AgentPermissionEditor } from '../agents/AgentPermissionEditor';
import { Button } from '../ui/Button';

export const SuperAdminPanel: React.FC = () => {
  const { user, personas, switchPersona } = useAuth();
  const { addNotification } = useNotifications();

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'departments' | 'enterprise_kb' | 'broadcast' | 'audit_log' | 'ai_governance' | 'ai_activity'
  >('departments');

  // AI Agent Governance State
  const [governedAgents, setGovernedAgents] = useState<GovernedAgent[]>(INITIAL_GOVERNED_AGENTS);
  const [selectedAgentForEdit, setSelectedAgentForEdit] = useState<GovernedAgent | null>(null);
  const [aiActivities, setAiActivities] = useState<AgentActivityItem[]>(INITIAL_AGENT_ACTIVITIES);

  // AI Activity Filter State
  const [aiActivityAgentFilter, setAiActivityAgentFilter] = useState('all');
  const [aiActivityDeptFilter, setAiActivityDeptFilter] = useState('all');
  const [aiActivityStatusFilter, setAiActivityStatusFilter] = useState('all');
  const [aiActivitySearchQuery, setAiActivitySearchQuery] = useState('');

  // State
  const [departments, setDepartments] = useState<DepartmentInfo[]>([]);
  const [enterpriseDocs, setEnterpriseDocs] = useState<AurenDocument[]>([]);
  const [auditLogs, setAuditLogs] = useState<SuperAdminActionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchDeptQuery, setSearchDeptQuery] = useState('');

  // Audit Log Search & Filter State (Phase 12)
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditTypeFilter, setAuditTypeFilter] = useState<string>('all');

  // Department Action Modal / Drawer State
  const [selectedDeptForAction, setSelectedDeptForAction] = useState<DepartmentInfo | null>(null);
  const [actionTitle, setActionTitle] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionType, setActionType] = useState<'update_policy' | 'reassign_head' | 'adjust_quota' | 'broadcast_directive'>('update_policy');
  const [newStatus, setNewStatus] = useState<'active' | 'maintenance' | 'audit_lock'>('active');
  const [newSubfieldsInput, setNewSubfieldsInput] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Enterprise Doc Publication Modal State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocFilename, setNewDocFilename] = useState('');
  const [newDocSummary, setNewDocSummary] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [notifyHeadsOnPublish, setNotifyHeadsOnPublish] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  // Broadcast Modal State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [selectedDeptIdsForBroadcast, setSelectedDeptIdsForBroadcast] = useState<string[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Success Feedback Banner
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Load Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [deptsData, allDocs, logsData] = await Promise.all([
        api.getDepartments(),
        api.getDocuments('enterprise'),
        api.getSuperAdminAuditLog(),
      ]);

      setDepartments(deptsData || []);
      setEnterpriseDocs((allDocs || []).filter((d) => d.scope === 'enterprise' || d.knowledgeTier === 'enterprise' || d.isEnterpriseSuperOrg));
      setAuditLogs(logsData || []);
    } catch (err) {
      console.error('Error loading Super Admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  // Export Audit Ledger (Phase 12)
  const handleExportAuditLedger = () => {
    const exportData = JSON.stringify(auditLogs, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auren-audit-ledger-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerFeedback('Audit ledger exported as JSON document successfully.');
  };

  // Execute Department Action (notifies the department head)
  const handleExecuteDeptAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptForAction) return;

    setIsSubmittingAction(true);
    try {
      const subfieldsArray = newSubfieldsInput
        ? newSubfieldsInput.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined;

      const res = await api.executeDepartmentAction(selectedDeptForAction.id, {
        actionType,
        title: actionTitle || `Super Admin Policy Update on ${selectedDeptForAction.name}`,
        message: actionMessage || `Governance standards recalibrated by ${user?.name || 'Super Admin'}`,
        newStatus,
        newSubfields: subfieldsArray,
      });

      triggerFeedback(
        `✅ Action executed successfully! Head of ${selectedDeptForAction.name} (${selectedDeptForAction.head.name}) has been notified.`
      );

      // Local notification for current user
      addNotification({
        type: 'super_admin_action',
        title: `Action Dispatched to ${selectedDeptForAction.name}`,
        description: `Notified ${selectedDeptForAction.head.name} regarding policy updates.`,
      });

      setSelectedDeptForAction(null);
      setActionTitle('');
      setActionMessage('');
      setNewSubfieldsInput('');
      loadData();
    } catch (err) {
      console.error('Error executing department action:', err);
      alert('Failed to execute department action.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Publish Enterprise Document
  const handlePublishEnterpriseDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;

    setIsPublishing(true);
    try {
      await api.publishEnterpriseDoc({
        title: newDocTitle.trim(),
        filename: newDocFilename.trim() || undefined,
        summary: newDocSummary.trim() || undefined,
        content: newDocContent.trim() || undefined,
        notifyDepartmentHeads: notifyHeadsOnPublish,
      });

      triggerFeedback(
        `🏛️ Enterprise Document published to Super-Organizational Knowledge Base! All ${departments.length} Department Heads were notified.`
      );

      addNotification({
        type: 'super_admin_action',
        title: 'Enterprise Document Published',
        description: `Broadcasted "${newDocTitle}" to all Department Heads.`,
      });

      setIsPublishModalOpen(false);
      setNewDocTitle('');
      setNewDocFilename('');
      setNewDocSummary('');
      setNewDocContent('');
      loadData();
    } catch (err) {
      console.error('Error publishing enterprise doc:', err);
      alert('Failed to publish enterprise document.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Broadcast Directive to Department Heads
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    setIsBroadcasting(true);
    try {
      const res = await api.broadcastSuperAdminDirective({
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        targetDepartmentIds: selectedDeptIdsForBroadcast.length > 0 ? selectedDeptIdsForBroadcast : undefined,
      });

      triggerFeedback(
        `📢 Super Admin Directive broadcasted! Dispatched alerts to ${res.notifiedCount} Department Heads.`
      );

      addNotification({
        type: 'super_admin_action',
        title: `Directive Broadcasted: ${broadcastTitle}`,
        description: `Delivered to ${res.notifiedHeads?.join(', ') || 'all department heads'}.`,
      });

      setBroadcastTitle('');
      setBroadcastMessage('');
      setSelectedDeptIdsForBroadcast([]);
      setActiveTab('audit_log');
      loadData();
    } catch (err) {
      console.error('Error sending broadcast:', err);
      alert('Failed to send broadcast.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Filtered departments
  const filteredDepartments = departments.filter((d) =>
    d.name.toLowerCase().includes(searchDeptQuery.toLowerCase()) ||
    d.head.name.toLowerCase().includes(searchDeptQuery.toLowerCase()) ||
    d.subfields.some((s) => s.toLowerCase().includes(searchDeptQuery.toLowerCase()))
  );

  const isCurrentSuperAdmin = user?.role === 'super_admin' || user?.isSuperAdmin;

  if (!isCurrentSuperAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#FAFAFA] dark:bg-[#0E0F12] text-center min-h-[60vh]">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 ring-1 ring-rose-200 dark:ring-rose-800">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-base font-bold text-neutral-900 dark:text-white">
          Restricted Area: Super Admin Access Only
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mt-1.5 leading-relaxed">
          The Super Admin Governance Panel is strictly reserved for Super Administrators (Elena Vance). Other organizational personnel, Department Heads, and team members cannot access or view this panel.
        </p>
        <div className="mt-5 flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              window.location.hash = '#library';
            }}
          >
            Return to Library
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => switchPersona('user_elena')}
            icon={<Crown className="w-3.5 h-3.5 text-amber-300" />}
          >
            Switch to Elena Vance (Super Admin)
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFAFA] dark:bg-[#0E0F12] text-neutral-900 dark:text-neutral-100 overflow-y-auto">
      {/* Top Banner / Role Switcher Callout */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-500/20 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Crown className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                Super Organizational Governance Tier
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Super Admin Sovereign Override
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Department Heads govern local department docs. Super Admin governs all departments & the Super-Organizational Knowledge Base.
            </p>
          </div>
        </div>

        {/* Quick Role Switcher for Testing Live Interaction */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Current Role:</span>
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#16171B] p-1 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs">
            {personas.map((p) => {
              const isSelected = user?.id === p.id;
              if (p.role !== 'super_admin' && p.role !== 'dept_head') return null;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => switchPersona(p.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-white shadow-xs font-semibold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <img
                    src={p.avatarUrl}
                    alt={p.name}
                    className="w-4 h-4 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span>
                    {p.role === 'super_admin' ? 'Elena (Super Admin)' : `${p.firstName} (Dept Head)`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2.5">
              <Crown className="w-5 h-5 text-amber-500" />
              Super Admin Executive Panel
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl">
              Centralized oversight across all departments, automated alerts to Department Heads upon administrative actions, and management of the Super-Organizational Knowledge Base.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
              onClick={loadData}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsPublishModalOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white border-amber-700 font-medium"
            >
              Publish Enterprise Doc
            </Button>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedbackMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 border-b border-neutral-200/80 dark:border-neutral-800/80 pb-px">
          <button
            type="button"
            onClick={() => setActiveTab('departments')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer ${
              activeTab === 'departments'
                ? 'border-amber-500 text-neutral-900 dark:text-white bg-white/50 dark:bg-neutral-800/30'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <Building className="w-3.5 h-3.5 text-amber-500" />
            <span>All Departments ({departments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('enterprise_kb')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer ${
              activeTab === 'enterprise_kb'
                ? 'border-amber-500 text-neutral-900 dark:text-white bg-white/50 dark:bg-neutral-800/30'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-500" />
            <span>Super-Organizational KB ({enterpriseDocs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('broadcast')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer ${
              activeTab === 'broadcast'
                ? 'border-amber-500 text-neutral-900 dark:text-white bg-white/50 dark:bg-neutral-800/30'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-amber-500" />
            <span>Broadcast Directives</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit_log')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer ${
              activeTab === 'audit_log'
                ? 'border-amber-500 text-neutral-900 dark:text-white bg-white/50 dark:bg-neutral-800/30'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <span>Super Admin Audit Log ({auditLogs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai_governance')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer ${
              activeTab === 'ai_governance'
                ? 'border-purple-600 text-neutral-900 dark:text-white bg-white/50 dark:bg-neutral-800/30'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-purple-600" />
            <span>AI Agent Governance ({governedAgents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai_activity')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer ${
              activeTab === 'ai_activity'
                ? 'border-purple-600 text-neutral-900 dark:text-white bg-white/50 dark:bg-neutral-800/30'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-purple-600" />
            <span>AI Activity ({aiActivities.length})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Departments Management */}
      {activeTab === 'departments' && (
        <div className="p-6 pt-2 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search departments, heads, subfields..."
                value={searchDeptQuery}
                onChange={(e) => setSearchDeptQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-white dark:bg-[#16171B] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Showing <span className="font-semibold text-neutral-900 dark:text-neutral-200">{filteredDepartments.length}</span> departments
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDepartments.map((dept) => (
              <div
                key={dept.id}
                className="bg-white dark:bg-[#141518] rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 p-4 shadow-2xs hover:border-amber-500/40 transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-neutral-500" />
                        {dept.name}
                      </h3>
                      <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
                        {dept.id}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        dept.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                          : dept.status === 'maintenance'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                          : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                      }`}
                    >
                      {dept.status === 'active' ? '● Active' : dept.status === 'maintenance' ? '▲ In Review' : '✕ Audit Lock'}
                    </span>
                  </div>

                  {/* Department Head Card */}
                  <div className="mt-3.5 p-2.5 rounded-lg bg-neutral-50 dark:bg-[#1A1B1F] border border-neutral-100 dark:border-neutral-800/70 flex items-center gap-2.5">
                    <img
                      src={dept.head.avatarUrl}
                      alt={dept.head.name}
                      className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-neutral-200 dark:ring-neutral-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                          {dept.head.name}
                        </span>
                        <span className="text-[9px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 px-1 py-0.2 rounded shrink-0">
                          Dept Head
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400 truncate block">
                        {dept.head.email}
                      </span>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div className="p-2 rounded bg-neutral-50 dark:bg-[#1A1B1F] border border-neutral-100 dark:border-neutral-800">
                      <span className="text-[10px] text-neutral-400 block">Members</span>
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 font-mono">
                        {dept.memberCount}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-neutral-50 dark:bg-[#1A1B1F] border border-neutral-100 dark:border-neutral-800">
                      <span className="text-[10px] text-neutral-400 block">Documents</span>
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 font-mono">
                        {dept.documentCount}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-neutral-50 dark:bg-[#1A1B1F] border border-neutral-100 dark:border-neutral-800">
                      <span className="text-[10px] text-neutral-400 block">Storage</span>
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 font-mono">
                        {dept.storageUsed}
                      </span>
                    </div>
                  </div>

                  {/* Clearance Distribution (Phase 12) */}
                  <div className="mt-3 p-2 rounded bg-neutral-50 dark:bg-[#1A1B1F] border border-neutral-100 dark:border-neutral-800">
                    <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">
                      Clearance Distribution
                    </span>
                    <div className="grid grid-cols-3 gap-1 text-[11px] text-center">
                      <div className="bg-white dark:bg-[#141518] p-1 rounded border border-neutral-200/50 dark:border-neutral-800/50">
                        <span className="text-[9px] text-neutral-400 block">Senior</span>
                        <span className="font-bold text-neutral-800 dark:text-neutral-200">{Math.max(1, Math.floor(dept.memberCount * 0.25))}</span>
                      </div>
                      <div className="bg-white dark:bg-[#141518] p-1 rounded border border-neutral-200/50 dark:border-neutral-800/50">
                        <span className="text-[9px] text-neutral-400 block">Mid</span>
                        <span className="font-bold text-neutral-800 dark:text-neutral-200">{Math.max(1, Math.floor(dept.memberCount * 0.45))}</span>
                      </div>
                      <div className="bg-white dark:bg-[#141518] p-1 rounded border border-neutral-200/50 dark:border-neutral-800/50">
                        <span className="text-[9px] text-neutral-400 block">Junior</span>
                        <span className="font-bold text-neutral-800 dark:text-neutral-200">{Math.max(1, Math.floor(dept.memberCount * 0.3))}</span>
                      </div>
                    </div>
                  </div>

                  {/* Subfields List */}
                  <div className="mt-3">
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                      Governance Subfields ({dept.subfields.length})
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                      {dept.subfields.map((sub, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-mono truncate"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Last Action Notification Info */}
                  {dept.lastAdminAction && (
                    <div className="mt-3 p-2 rounded bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 text-[11px] text-amber-800 dark:text-amber-300">
                      <span className="font-semibold block text-[10px] uppercase text-amber-600 dark:text-amber-400">
                        Last Super Admin Action (Notified Head):
                      </span>
                      <p className="mt-0.5 truncate">{dept.lastAdminAction}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs flex-1"
                    onClick={() => {
                      setSelectedDeptForAction(dept);
                      setActionTitle(`Super Admin Clearance Audit: ${dept.name}`);
                      setActionMessage(`Standardized access clearance policies for ${dept.name}`);
                      setNewSubfieldsInput(dept.subfields.join(', '));
                      setNewStatus(dept.status);
                    }}
                  >
                    Manage & Notify Head
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Super-Organizational Knowledge Base */}
      {activeTab === 'enterprise_kb' && (
        <div className="p-6 pt-2 space-y-4">
          <div className="p-4 rounded-xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500" />
                Super-Organizational Knowledge Vault
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                These documents represent organization-wide sovereign directives. They are created and maintained solely by the Super Admin and apply universally across all departments.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsPublishModalOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white border-amber-700 shrink-0"
            >
              Publish Enterprise Doc
            </Button>
          </div>

          <div className="space-y-3">
            {enterpriseDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 hover:border-amber-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                        {doc.title}
                      </h4>
                      <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                        Super Org Tier
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl line-clamp-2">
                      {doc.intelligence?.executiveSummary || 'Organization-wide sovereign knowledge document.'}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-neutral-400 font-mono">
                      <span>File: {doc.filename}</span>
                      <span>•</span>
                      <span>Governed By: {doc.accessPolicy?.ownerName || 'Elena Vance (Super Admin)'}</span>
                      <span>•</span>
                      <span>Size: {doc.fileSize}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    All Depts Bound
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Broadcast Directives */}
      {activeTab === 'broadcast' && (
        <div className="p-6 pt-2 max-w-3xl space-y-4">
          <div className="p-5 rounded-xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xs">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-amber-500" />
              Broadcast Super Admin Directive
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Dispatch an authoritative notification and policy directive directly to Department Heads. Every recipient receives an urgent notification in their inbox.
            </p>

            <form onSubmit={handleSendBroadcast} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Directive Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mandatory SOC2 Compliance Audit for Q3"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-neutral-50 dark:bg-[#16171B] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Directive Instructions & Mandate
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the operational mandate, boundary requirements, or action required by Department Heads..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-neutral-50 dark:bg-[#16171B] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Target Departments (Leave empty to broadcast to ALL Department Heads)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {departments.map((dept) => {
                    const isSelected = selectedDeptIdsForBroadcast.includes(dept.id);
                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedDeptIdsForBroadcast(selectedDeptIdsForBroadcast.filter((id) => id !== dept.id));
                          } else {
                            setSelectedDeptIdsForBroadcast([...selectedDeptIdsForBroadcast, dept.id]);
                          }
                        }}
                        className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-200 font-semibold'
                            : 'bg-neutral-50 dark:bg-[#16171B] border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                            isSelected ? 'bg-amber-500 text-white' : 'border border-neutral-300 dark:border-neutral-700'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <span className="truncate">{dept.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isBroadcasting}
                  icon={<Send className="w-3.5 h-3.5" />}
                  className="bg-amber-600 hover:bg-amber-700 text-white border-amber-700 font-medium"
                >
                  {isBroadcasting ? 'Broadcasting...' : 'Broadcast Directive & Notify Heads'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Log */}
      {activeTab === 'audit_log' && (() => {
        const filteredAuditLogs = auditLogs.filter((log) => {
          const matchesSearch =
            auditSearchQuery === '' ||
            log.title.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
            log.description.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
            log.targetDepartment?.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
            log.executedBy?.toLowerCase().includes(auditSearchQuery.toLowerCase());

          const matchesType =
            auditTypeFilter === 'all' || log.actionType === auditTypeFilter;

          return matchesSearch && matchesType;
        });

        return (
          <div className="p-6 pt-2 space-y-4">
            <div className="p-4 rounded-xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-500" />
                  Executive Super Admin Audit Trail
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Cryptographically verified history of all actions performed by Super Admin and the notifications dispatched to Department Heads.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                icon={<Download className="w-3.5 h-3.5" />}
                onClick={handleExportAuditLedger}
                className="text-xs shrink-0 cursor-pointer"
              >
                Export Audit Ledger (JSON)
              </Button>
            </div>

            {/* Filter Bar (Phase 12) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#141518] p-3 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xs">
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Filter audit entries by action, actor, or target..."
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-neutral-50 dark:bg-[#1A1B1F] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <select
                  value={auditTypeFilter}
                  onChange={(e) => setAuditTypeFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg text-xs bg-neutral-50 dark:bg-[#1A1B1F] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="all">All Action Types</option>
                  <option value="update_policy">Policy Updates</option>
                  <option value="reassign_head">Head Reassignments</option>
                  <option value="adjust_quota">Quota Adjustments</option>
                  <option value="broadcast_directive">Directives</option>
                </select>
                <span className="text-xs font-mono text-neutral-400 ml-1">
                  {filteredAuditLogs.length} entries
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#141518] rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 overflow-hidden shadow-2xs">
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredAuditLogs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-400">
                    No audit records match the current filter criteria.
                  </div>
                ) : (
                  filteredAuditLogs.map((log) => (
                    <div key={log.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Crown className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                              {log.title}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                              {log.actionType}
                            </span>
                            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800/60">
                              ✓ Dispatched & Sealed
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                            {log.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-neutral-400">
                            <span className="font-semibold text-neutral-600 dark:text-neutral-300">
                              Actor: {log.executedBy}
                            </span>
                            <span>•</span>
                            <span>Target: {log.targetDepartment}</span>
                            <span>•</span>
                            <span>
                              Notified: {log.notifiedHeads?.join(', ') || 'Department Heads'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center shrink-0 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-[11px] font-mono text-neutral-400">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[9px] font-mono text-neutral-500">
                            {new Date(log.timestamp).toISOString().slice(0, 10)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tab 5: AI Agent Governance (Requirement 9) */}
      {activeTab === 'ai_governance' && (
        <div className="p-6 pt-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50 dark:bg-[#141518] p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-2">
                <Bot className="w-4 h-4" />
                AI Agent Governance & Tool Authorization Matrix
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Manage the constitutional RBAC boundaries, allowed tools, and approval requirements for all 5 enterprise agents.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Zero-Trust Kernel Active</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141518] shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50/80 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Agent</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Clearance</th>
                  <th className="py-3.5 px-4">Tools</th>
                  <th className="py-3.5 px-4">Core Actions</th>
                  <th className="py-3.5 px-4">Approvals</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {governedAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-850/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-neutral-900 dark:text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-700 dark:text-purple-300 font-bold">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold">{agent.name}</div>
                          <div className="text-[10px] text-neutral-400 font-normal">{agent.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        AVAILABLE
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-700 dark:text-neutral-300 font-medium">
                      {agent.departmentScope}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {agent.minClearance} Tier
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        {(agent.tools || []).filter((t) => t.status === 'allowed').length} Allowed
                      </span>{' '}
                      • {(agent.restrictedTools || []).length} Restricted
                    </td>
                    <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-300 max-w-xs truncate" title={agent.purpose}>
                      {agent.purpose}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                        {(agent.approvalActions || []).length} Gate{(agent.approvalActions || []).length > 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setSelectedAgentForEdit(agent)}
                        icon={<Sliders className="w-3 h-3 text-purple-600" />}
                        className="text-xs"
                      >
                        Configure Permissions
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: AI Activity Ledger (Requirement 9 & 14) */}
      {activeTab === 'ai_activity' && (
        <div className="p-6 pt-2 space-y-4">
          {/* Activity Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-neutral-50 dark:bg-[#141518] p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                Cross-Organization AI Activity Ledger
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Comprehensive, filterable ledger of every autonomous and assisted action performed across all departments.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative w-44">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search actions..."
                  value={aiActivitySearchQuery}
                  onChange={(e) => setAiActivitySearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#181A20] border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 outline-none"
                />
              </div>

              {/* Agent Filter */}
              <select
                value={aiActivityAgentFilter}
                onChange={(e) => setAiActivityAgentFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#181A20] border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white outline-none"
              >
                <option value="all">All Agents</option>
                <option value="Meeting Agent">Meeting Agent</option>
                <option value="Architecture Reviewer">Architecture Reviewer</option>
                <option value="Knowledge Curator">Knowledge Curator</option>
                <option value="Security Analyst">Security Analyst</option>
                <option value="Incident Assistant">Incident Assistant</option>
              </select>

              {/* Department Filter */}
              <select
                value={aiActivityDeptFilter}
                onChange={(e) => setAiActivityDeptFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#181A20] border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white outline-none"
              >
                <option value="all">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Organization">Organization</option>
                <option value="Security & Compliance">Security & Compliance</option>
                <option value="Operations">Operations</option>
              </select>

              {/* Status Filter */}
              <select
                value={aiActivityStatusFilter}
                onChange={(e) => setAiActivityStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#181A20] border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="approved">Approved</option>
                <option value="needs_review">Needs Review</option>
                <option value="pending_approval">Pending Approval</option>
              </select>
            </div>
          </div>

          {/* Activity Table */}
          <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141518] shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50/80 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Agent</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Action Performed</th>
                  <th className="py-3 px-4">Target Artifact</th>
                  <th className="py-3 px-4">Outcome Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {aiActivities
                  .filter((act) => {
                    if (aiActivityAgentFilter !== 'all' && act.agentName !== aiActivityAgentFilter) return false;
                    if (aiActivityDeptFilter !== 'all' && act.department !== aiActivityDeptFilter) return false;
                    if (aiActivityStatusFilter !== 'all' && act.status !== aiActivityStatusFilter) return false;
                    if (
                      aiActivitySearchQuery &&
                      !act.action.toLowerCase().includes(aiActivitySearchQuery.toLowerCase()) &&
                      !act.target.toLowerCase().includes(aiActivitySearchQuery.toLowerCase())
                    ) {
                      return false;
                    }
                    return true;
                  })
                  .map((act) => (
                    <tr key={act.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-850/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                        {act.timestamp}
                      </td>
                      <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Bot className="w-3.5 h-3.5 text-purple-600" />
                          <span>{act.agentName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-neutral-600 dark:text-neutral-300 whitespace-nowrap">
                        {act.department}
                      </td>
                      <td className="py-3 px-4 text-neutral-800 dark:text-neutral-200 font-medium">
                        {act.action}
                      </td>
                      <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400 font-mono text-[11px]">
                        {act.target}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                            act.status === 'completed' || act.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : act.status === 'needs_review'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                          }`}
                        >
                          {act.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Agent Permission Editor in Super Admin */}
      {selectedAgentForEdit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141518] rounded-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto animate-fadeIn space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Configure Agent Governance: {selectedAgentForEdit.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAgentForEdit(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-1 text-xs font-semibold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <AgentPermissionEditor
              agent={selectedAgentForEdit}
              onUpdateAgent={(updated) => {
                setGovernedAgents((prev) =>
                  prev.map((a) => (a.id === updated.id ? updated : a))
                );
                setSelectedAgentForEdit(null);
                setFeedbackMessage(`Permissions updated for ${updated.name}.`);
                setTimeout(() => setFeedbackMessage(null), 3500);
              }}
              onClose={() => setSelectedAgentForEdit(null)}
            />
          </div>
        </div>
      )}

      {/* Modal: Department Action & Notification */}
      {selectedDeptForAction && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141518] rounded-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-lg shadow-2xl p-6 animate-fadeIn">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Building className="w-4 h-4 text-amber-500" />
                  Super Admin Override: {selectedDeptForAction.name}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Action will take effect immediately and notify Head{' '}
                  <span className="font-semibold text-neutral-900 dark:text-neutral-200">
                    {selectedDeptForAction.head.name}
                  </span>
                  .
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDeptForAction(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteDeptAction} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Action Directive Title
                </label>
                <input
                  type="text"
                  required
                  value={actionTitle}
                  onChange={(e) => setActionTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-neutral-50 dark:bg-[#16171B] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Message / Rationale (Sent to Department Head)
                </label>
                <textarea
                  required
                  rows={3}
                  value={actionMessage}
                  onChange={(e) => setActionMessage(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-neutral-50 dark:bg-[#16171B] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Department Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e: any) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg text-xs bg-neutral-50 dark:bg-[#16171B] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white outline-none"
                  >
                    <option value="active">Active (Operational)</option>
                    <option value="maintenance">Maintenance / In Review</option>
                    <option value="audit_lock">Audit Lock (Frozen)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Action Type
                  </label>
                  <select
                    value={actionType}
                    onChange={(e: any) => setActionType(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg text-xs bg-neutral-50 dark:bg-[#16171B] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white outline-none"
                  >
                    <option value="update_policy">Update Clearance Policy</option>
                    <option value="adjust_quota">Adjust Storage Quota</option>
                    <option value="broadcast_directive">Direct Directive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Subfields Governance (Comma-separated)
                </label>
                <input
                  type="text"
                  value={newSubfieldsInput}
                  onChange={(e) => setNewSubfieldsInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-neutral-50 dark:bg-[#16171B] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>

              <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Immediate Automated Notification will be sent to{' '}
                  <strong className="font-semibold">{selectedDeptForAction.head.name}</strong>.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDeptForAction(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmittingAction}
                  className="bg-amber-600 hover:bg-amber-700 text-white border-amber-700 font-medium"
                >
                  {isSubmittingAction ? 'Executing...' : 'Apply Override & Notify Head'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Publish Enterprise Document */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141518] rounded-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-lg shadow-2xl p-6 animate-fadeIn">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" />
                  Publish to Super-Organizational Knowledge Base
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Publish a master enterprise charter or security standard.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePublishEnterpriseDoc} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise Cryptographic Governance Standard 2026"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-neutral-50 dark:bg-[#16171B] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Filename
                </label>
                <input
                  type="text"
                  placeholder="e.g. enterprise-crypto-standard-2026.md"
                  value={newDocFilename}
                  onChange={(e) => setNewDocFilename(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-neutral-50 dark:bg-[#16171B] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Executive Summary & Scope
                </label>
                <textarea
                  rows={2}
                  placeholder="Summarize the core mandates and organization-wide requirements..."
                  value={newDocSummary}
                  onChange={(e) => setNewDocSummary(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-neutral-50 dark:bg-[#16171B] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Full Document Body (Markdown)
                </label>
                <textarea
                  rows={4}
                  placeholder="# Section 1: Sovereign Cryptographic Standards..."
                  value={newDocContent}
                  onChange={(e) => setNewDocContent(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-neutral-50 dark:bg-[#16171B] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-50 dark:bg-[#16171B] border border-neutral-200 dark:border-neutral-800">
                <input
                  type="checkbox"
                  id="notifyHeads"
                  checked={notifyHeadsOnPublish}
                  onChange={(e) => setNotifyHeadsOnPublish(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="notifyHeads" className="text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  Notify all Department Heads automatically upon publication
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPublishModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isPublishing}
                  className="bg-amber-600 hover:bg-amber-700 text-white border-amber-700 font-medium"
                >
                  {isPublishing ? 'Publishing...' : 'Publish to Enterprise KB'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
