import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  FileText,
  UserPlus,
  ArrowRightLeft,
  Trash2,
  Check,
  X,
  Search,
  Filter,
  Lock,
  Unlock,
  Building,
  Layers,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Plus,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  DepartmentMember,
  DepartmentSubgroup,
  AurenDocument,
  RbacAuditLogItem,
} from '../../types';
import { Button } from '../ui/Button';
import { AddMemberModal } from './AddMemberModal';
import { ShiftMemberModal } from './ShiftMemberModal';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import {
  DEFAULT_DEPARTMENTS,
  INTERN_DOMAINS,
  getStoredSubfields,
  saveStoredSubfields,
  getStoredMembers,
  saveStoredMembers,
} from '../../services/rbacData';
import { DocumentPolicyInspectorDrawer } from './DocumentPolicyInspectorDrawer';

const ALL_SUBGROUPS: { id: DepartmentSubgroup; label: string }[] = [
  { id: 'senior', label: 'Senior Staff' },
  { id: 'mid_senior', label: 'Mid / Senior' },
  { id: 'junior', label: 'Junior Staff' },
  { id: 'intern', label: 'Intern' },
  { id: 'trainee', label: 'Trainee' },
  { id: 'no_access', label: 'No Access (Revoked)' },
];

interface DocPolicy {
  allowedDepts: string[];
  allowedSubfields: string[];
  minSubgroup: DepartmentSubgroup;
  isRestricted: boolean;
}

export const RbacView: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // Active view tab
  const [activeTab, setActiveTab] = useState<'docs' | 'matrix' | 'roster' | 'simulator'>('docs');

  // Members state
  const [members, setMembers] = useState<DepartmentMember[]>(() => getStoredMembers());

  // Subfields state
  const [subfields, setSubfields] = useState<string[]>(() => getStoredSubfields());
  const [newSubfieldInput, setNewSubfieldInput] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [shiftingMember, setShiftingMember] = useState<DepartmentMember | null>(null);

  // Documents and Real-Time Clearance Policies
  const [documents, setDocuments] = useState<AurenDocument[]>([]);
  const [docPolicies, setDocPolicies] = useState<Record<string, DocPolicy>>({});
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);

  // Filters
  const [searchDocQuery, setSearchDocQuery] = useState('');
  const [docDeptFilter, setDocDeptFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'lockdown'>('all');
  const [selectedDocForPolicy, setSelectedDocForPolicy] = useState<AurenDocument | null>(null);
  const [searchMemberQuery, setSearchMemberQuery] = useState('');

  // Simulator state
  const [simDept, setSimDept] = useState<string>('Core Architecture');
  const [simSubgroup, setSimSubgroup] = useState<DepartmentSubgroup>('junior');
  const [selectedSimDocId, setSelectedSimDocId] = useState<string>('');

  // Feedback banner
  const [feedback, setFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  // Load documents
  const loadDocs = async () => {
    setIsLoadingDocs(true);
    try {
      const docs = (await api.getDocuments()) || [];
      setDocuments(docs);

      const initialPolicies: Record<string, DocPolicy> = {};
      docs.forEach((d) => {
        initialPolicies[d.id] = {
          allowedDepts:
            d.accessPolicy?.allowedDepartments && d.accessPolicy.allowedDepartments.length > 0
              ? [...d.accessPolicy.allowedDepartments]
              : [d.department || 'Core Architecture'],
          allowedSubfields: d.accessPolicy?.allowedSubfields
            ? [...d.accessPolicy.allowedSubfields]
            : ['General Architecture'],
          minSubgroup: (d.accessPolicy?.minSubgroupLevel as DepartmentSubgroup) || 'junior',
          isRestricted: d.accessPolicy?.isRestricted || false,
        };
      });
      setDocPolicies(initialPolicies);
    } catch (err) {
      console.error('Error fetching documents for RBAC:', err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  // Update member in storage
  const updateMembersList = (updated: DepartmentMember[]) => {
    setMembers(updated);
    saveStoredMembers(updated);
  };

  // Toggle Department access on a document (Tick ✅ vs Cross ❌)
  const handleToggleDocDept = (docId: string, dept: string) => {
    setDocPolicies((prev) => {
      const current = prev[docId] || {
        allowedDepts: ['Core Architecture'],
        allowedSubfields: [],
        minSubgroup: 'junior',
        isRestricted: false,
      };

      const isCurrentlyAllowed = (current.allowedDepts || []).includes(dept);
      const updatedDepts = isCurrentlyAllowed
        ? (current.allowedDepts || []).filter((d) => d !== dept)
        : [...(current.allowedDepts || []), dept];

      const doc = (documents || []).find((d) => d.id === docId);
      const statusText = !isCurrentlyAllowed ? 'Granted ✅' : 'Revoked to No Access ❌';

      showFeedback(
        `Department "${dept}" ${statusText} for document "${doc?.title || docId}".`
      );

      return {
        ...prev,
        [docId]: {
          ...current,
          allowedDepts: updatedDepts,
        },
      };
    });
  };

  // Toggle Subfield access on a document (Tick ✅ vs Cross ❌)
  const handleToggleDocSubfield = (docId: string, subfield: string) => {
    setDocPolicies((prev) => {
      const current = prev[docId] || {
        allowedDepts: ['Core Architecture'],
        allowedSubfields: [],
        minSubgroup: 'junior',
        isRestricted: false,
      };

      const isCurrentlyAllowed = (current.allowedSubfields || []).includes(subfield);
      const updatedSubfields = isCurrentlyAllowed
        ? (current.allowedSubfields || []).filter((s) => s !== subfield)
        : [...(current.allowedSubfields || []), subfield];

      return {
        ...prev,
        [docId]: {
          ...current,
          allowedSubfields: updatedSubfields,
        },
      };
    });
  };

  // Set All Departments to No Access or Allow All
  const handleSetAllDeptsAccess = (docId: string, allow: boolean) => {
    setDocPolicies((prev) => {
      const current = prev[docId] || {
        allowedDepts: [],
        allowedSubfields: [],
        minSubgroup: 'junior',
        isRestricted: false,
      };

      const doc = documents.find((d) => d.id === docId);
      showFeedback(
        allow
          ? `✅ All departments granted access to "${doc?.title || docId}".`
          : `❌ All departments set to NO ACCESS for "${doc?.title || docId}".`
      );

      return {
        ...prev,
        [docId]: {
          ...current,
          allowedDepts: allow ? [...DEFAULT_DEPARTMENTS] : [],
        },
      };
    });
  };

  // Set Subgroup threshold on a document
  const handleSetDocMinSubgroup = (docId: string, subgroup: DepartmentSubgroup) => {
    setDocPolicies((prev) => {
      const current = prev[docId] || {
        allowedDepts: ['Core Architecture'],
        allowedSubfields: [],
        minSubgroup: 'junior',
        isRestricted: false,
      };

      const doc = documents.find((d) => d.id === docId);
      const label = ALL_SUBGROUPS.find((s) => s.id === subgroup)?.label || subgroup;
      showFeedback(`Minimum clearance for "${doc?.title || docId}" updated to ${label}.`);

      return {
        ...prev,
        [docId]: {
          ...current,
          minSubgroup: subgroup,
        },
      };
    });
  };

  // Complete lockdown: Set everything on this document to NO ACCESS
  const handleTotalLockdownDoc = (docId: string) => {
    setDocPolicies((prev) => {
      const current = prev[docId] || {
        allowedDepts: [],
        allowedSubfields: [],
        minSubgroup: 'no_access',
        isRestricted: true,
      };

      const doc = documents.find((d) => d.id === docId);
      showFeedback(`🔒 TOTAL LOCKDOWN: All access revoked on "${doc?.title || docId}".`);

      return {
        ...prev,
        [docId]: {
          ...current,
          allowedDepts: [],
          allowedSubfields: [],
          minSubgroup: 'no_access',
          isRestricted: true,
        },
      };
    });
  };

  // Member management: Set member subgroup (including No Access)
  const handleSetMemberSubgroup = (memberId: string, newSubgroup: DepartmentSubgroup) => {
    const updated = members.map((m) => {
      if (m.id === memberId) {
        return {
          ...m,
          subgroup: newSubgroup,
          status: (newSubgroup === 'no_access' ? 'inactive' : 'active') as 'active' | 'inactive',
        };
      }
      return m;
    });
    updateMembersList(updated);

    const m = members.find((x) => x.id === memberId);
    showFeedback(
      newSubgroup === 'no_access'
        ? `❌ Clearance revoked for ${m?.name}. Set to NO ACCESS.`
        : `✅ Clearance for ${m?.name} updated to ${ALL_SUBGROUPS.find((s) => s.id === newSubgroup)?.label}.`
    );
  };

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return (documents || []).filter((doc) => {
      const matchSearch =
        doc.title.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
        doc.filename.toLowerCase().includes(searchDocQuery.toLowerCase());
      const matchDept = docDeptFilter === 'all' || doc.department === docDeptFilter;
      const policy = docPolicies[doc.id];
      const isLocked = policy ? policy.minSubgroup === 'no_access' || policy.allowedDepts.length === 0 : false;
      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'lockdown'
          ? isLocked
          : !isLocked;
      return matchSearch && matchDept && matchStatus;
    });
  }, [documents, searchDocQuery, docDeptFilter, statusFilter, docPolicies]);

  // Filtered members
  const filteredMembers = useMemo(() => {
    return (members || []).filter((m) =>
      m.name.toLowerCase().includes(searchMemberQuery.toLowerCase()) ||
      m.department.toLowerCase().includes(searchMemberQuery.toLowerCase()) ||
      m.title.toLowerCase().includes(searchMemberQuery.toLowerCase())
    );
  }, [members, searchMemberQuery]);

  // Evaluator function for Simulator
  const evaluateDocAccess = (doc: AurenDocument): { allowed: boolean; reason: string } => {
    const policy = docPolicies[doc.id];
    if (!policy) return { allowed: true, reason: 'Inherited Default Clearance' };

    // If doc min subgroup is no_access -> totally blocked
    if (policy.minSubgroup === 'no_access') {
      return { allowed: false, reason: 'Document is under Total Lockdown (No Access permitted)' };
    }

    // Check user subgroup
    if (simSubgroup === 'no_access') {
      return { allowed: false, reason: 'Role clearance is set to No Access' };
    }

    // Check department match
    const deptAllowed = policy.allowedDepts.includes(simDept) || policy.allowedDepts.length === 0;
    if (!deptAllowed) {
      return { allowed: false, reason: `Department "${simDept}" is set to No Access` };
    }

    // Check subgroup hierarchy
    const rank: Record<DepartmentSubgroup, number> = {
      senior: 4,
      mid_senior: 3,
      junior: 2,
      intern: 1,
      trainee: 0,
      no_access: -1,
    };

    if (rank[simSubgroup] < rank[policy.minSubgroup]) {
      return {
        allowed: false,
        reason: `Requires minimum ${ALL_SUBGROUPS.find((s) => s.id === policy.minSubgroup)?.label}`,
      };
    }

    return { allowed: true, reason: 'Cleared: Department and Seniority Threshold satisfied' };
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFAFA] dark:bg-[#0E0F12] text-neutral-900 dark:text-neutral-100 overflow-y-auto">
      {/* Top Header */}
      <div className="px-6 pt-6 pb-4 border-b border-neutral-200/80 dark:border-neutral-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Clearance & Access Governance (RBAC)
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Configure granular document permissions with clear visual ticks (✅ Allowed) and crosses (❌ No Access). Any field can be locked to No Access.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingDocs ? 'animate-spin' : ''}`} />}
              onClick={loadDocs}
            >
              Refresh Policies
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<UserPlus className="w-3.5 h-3.5" />}
              onClick={() => setIsAddModalOpen(true)}
            >
              Add Member
            </Button>
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {feedback && (
          <div className="mt-4 p-3 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-medium flex items-center gap-2 animate-fadeIn shadow-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 mt-6 border-b border-neutral-200/80 dark:border-neutral-800/80 pb-px">
          <button
            type="button"
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer ${
              activeTab === 'docs'
                ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white bg-white/60 dark:bg-neutral-800/30'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Document Permissions ({documents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer ${
              activeTab === 'matrix'
                ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white bg-white/60 dark:bg-neutral-800/30'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Department Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer ${
              activeTab === 'roster'
                ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white bg-white/60 dark:bg-neutral-800/30'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Personnel & Roles ({members.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer ${
              activeTab === 'simulator'
                ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white bg-white/60 dark:bg-neutral-800/30'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Live Access Simulator</span>
          </button>
        </div>
      </div>

      {/* Content View 1: Document Permissions */}
      {activeTab === 'docs' && (
        <div className="p-6 space-y-5">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80">
              <span className="text-[11px] font-medium text-neutral-400 block mb-1">
                Total Documents
              </span>
              <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                {documents.length}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80">
              <span className="text-[11px] font-medium text-neutral-400 block mb-1">
                Active Clearance
              </span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {
                  (documents || []).filter((d) => {
                    const p = docPolicies[d.id];
                    return p ? p.minSubgroup !== 'no_access' && (p.allowedDepts || []).length > 0 : true;
                  }).length
                }
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80">
              <span className="text-[11px] font-medium text-neutral-400 block mb-1">
                Total Lockdown
              </span>
              <span className="text-xl font-bold text-rose-600 dark:text-rose-400">
                {
                  (documents || []).filter((d) => {
                    const p = docPolicies[d.id];
                    return p ? p.minSubgroup === 'no_access' || (p.allowedDepts || []).length === 0 : false;
                  }).length
                }
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80">
              <span className="text-[11px] font-medium text-neutral-400 block mb-1">
                Super Org Masters
              </span>
              <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {
                  (documents || []).filter(
                    (d) => d.scope === 'enterprise' || d.knowledgeTier === 'enterprise' || d.isSuperOrgMaster
                  ).length
                }
              </span>
            </div>
          </div>

          {/* Controls Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#141518] p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search document title or filename..."
                value={searchDocQuery}
                onChange={(e) => setSearchDocQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-neutral-50 dark:bg-[#1A1B1F] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-neutral-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status Filter Pills */}
              <div className="flex items-center rounded-lg bg-neutral-100 dark:bg-[#1A1B1F] p-0.5 border border-neutral-200/80 dark:border-neutral-800 text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  All ({documents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('active')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    statusFilter === 'active'
                      ? 'bg-white dark:bg-neutral-800 text-emerald-700 dark:text-emerald-400 font-semibold shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('lockdown')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    statusFilter === 'lockdown'
                      ? 'bg-white dark:bg-neutral-800 text-rose-700 dark:text-rose-400 font-semibold shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  Lockdown
                </button>
              </div>

              {/* Department Select */}
              <select
                value={docDeptFilter}
                onChange={(e) => setDocDeptFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-xs bg-neutral-50 dark:bg-[#1A1B1F] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="all">All Departments</option>
                {DEFAULT_DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Document Permissions Table */}
          <div className="bg-white dark:bg-[#141518] rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/70 dark:bg-[#18191D]">
                    <th className="py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">
                      Document
                    </th>
                    <th className="py-3 px-3 font-semibold text-neutral-700 dark:text-neutral-300">
                      Scope / Origin
                    </th>
                    <th className="py-3 px-3 font-semibold text-neutral-700 dark:text-neutral-300">
                      Minimum Clearance
                    </th>
                    <th className="py-3 px-3 font-semibold text-neutral-700 dark:text-neutral-300">
                      Department Access
                    </th>
                    <th className="py-3 px-3 font-semibold text-neutral-700 dark:text-neutral-300">
                      Status
                    </th>
                    <th className="py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/70">
                  {filteredDocs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-neutral-400">
                        No documents match the active search and filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredDocs.map((doc) => {
                      const policy = docPolicies[doc.id] || {
                        allowedDepts: [doc.department || 'Core Architecture'],
                        allowedSubfields: [],
                        minSubgroup: 'junior',
                        isRestricted: false,
                      };

                      const isTotalLockdown =
                        policy.minSubgroup === 'no_access' || policy.allowedDepts.length === 0;
                      const allowedCount = policy.allowedDepts.length;

                      return (
                        <tr
                          key={doc.id}
                          onClick={() => setSelectedDocForPolicy(doc)}
                          className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer group"
                        >
                          {/* Document Title & File */}
                          <td className="py-3 px-4 max-w-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                  isTotalLockdown
                                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                                }`}
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-neutral-900 dark:text-white block truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {doc.title}
                                </span>
                                <span className="text-[10px] text-neutral-400 font-mono block truncate">
                                  {doc.filename}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Scope / Origin */}
                          <td className="py-3 px-3">
                            {doc.scope === 'enterprise' ||
                            doc.knowledgeTier === 'enterprise' ||
                            doc.isSuperOrgMaster ? (
                              <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                Super Org Master
                              </span>
                            ) : (
                              <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                                {doc.department}
                              </span>
                            )}
                          </td>

                          {/* Min Seniority */}
                          <td className="py-3 px-3">
                            <span
                              className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ${
                                isTotalLockdown
                                  ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900/60'
                                  : 'bg-neutral-100 text-neutral-800 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700'
                              }`}
                            >
                              {isTotalLockdown
                                ? 'No Access'
                                : ALL_SUBGROUPS.find((s) => s.id === policy.minSubgroup)?.label ||
                                  'Junior Staff'}
                            </span>
                          </td>

                          {/* Department Clearance */}
                          <td className="py-3 px-3">
                            {isTotalLockdown ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                                <X className="w-3 h-3" />
                                0 of {DEFAULT_DEPARTMENTS.length} Depts
                              </span>
                            ) : allowedCount === DEFAULT_DEPARTMENTS.length ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <Check className="w-3 h-3" />
                                All {DEFAULT_DEPARTMENTS.length} Depts Allowed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
                                {allowedCount} of {DEFAULT_DEPARTMENTS.length} Depts Allowed
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3">
                            {isTotalLockdown ? (
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                Lockdown
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Active Policy
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div
                              className="inline-flex items-center gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => setSelectedDocForPolicy(doc)}
                                className="text-xs"
                              >
                                Configure
                              </Button>

                              {isTotalLockdown ? (
                                <button
                                  type="button"
                                  onClick={() => handleSetAllDeptsAccess(doc.id, true)}
                                  className="p-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors cursor-pointer"
                                  title="Unlock: Allow all departments"
                                >
                                  <Unlock className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleTotalLockdownDoc(doc.id)}
                                  className="p-1 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                                  title="Lockdown: Revoke all access"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Content View 2: Department Access Matrix */}
      {activeTab === 'matrix' && (
        <div className="p-6 space-y-4">
          <div className="bg-white dark:bg-[#141518] p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-500" />
              Cross-Department Clearance Matrix
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Click any cell to toggle clearance between <span className="font-semibold text-emerald-600 dark:text-emerald-400">✅ Allowed</span> and <span className="font-semibold text-rose-600 dark:text-rose-400">❌ No Access</span>.
            </p>
          </div>

          <div className="bg-white dark:bg-[#141518] rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#18191D]">
                  <th className="p-3 font-semibold text-neutral-700 dark:text-neutral-300 w-64">
                    Document
                  </th>
                  <th className="p-3 font-semibold text-neutral-700 dark:text-neutral-300 w-32">
                    Min Seniority
                  </th>
                  {DEFAULT_DEPARTMENTS.map((dept) => (
                    <th key={dept} className="p-3 font-semibold text-neutral-700 dark:text-neutral-300 text-center">
                      {dept}
                    </th>
                  ))}
                  <th className="p-3 font-semibold text-neutral-700 dark:text-neutral-300 text-center">
                    Quick Lockdown
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/70">
                {documents.map((doc) => {
                  const policy = docPolicies[doc.id] || {
                    allowedDepts: [doc.department || 'Core Architecture'],
                    allowedSubfields: [],
                    minSubgroup: 'junior',
                    isRestricted: false,
                  };

                  return (
                    <tr key={doc.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors">
                      <td className="p-3">
                        <span className="font-semibold text-neutral-900 dark:text-white block truncate max-w-xs">
                          {doc.title}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono truncate block">
                          {doc.department}
                        </span>
                      </td>

                      <td className="p-3">
                        <span
                          className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            policy.minSubgroup === 'no_access'
                              ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                              : 'bg-neutral-100 text-neutral-800 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700'
                          }`}
                        >
                          {policy.minSubgroup === 'no_access' ? '❌ No Access' : ALL_SUBGROUPS.find((s) => s.id === policy.minSubgroup)?.label}
                        </span>
                      </td>

                      {DEFAULT_DEPARTMENTS.map((dept) => {
                        const isAllowed = policy.allowedDepts.includes(dept);
                        return (
                          <td key={dept} className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleDocDept(doc.id, dept)}
                              className={`inline-flex items-center justify-center gap-1 w-24 py-1 rounded-lg font-semibold text-[11px] border transition-all cursor-pointer ${
                                isAllowed
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                              }`}
                            >
                              {isAllowed ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                                  <span>Allowed</span>
                                </>
                              ) : (
                                <>
                                  <X className="w-3 h-3 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
                                  <span>No Access</span>
                                </>
                              )}
                            </button>
                          </td>
                        );
                      })}

                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleTotalLockdownDoc(doc.id)}
                          className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 dark:text-rose-400 hover:underline cursor-pointer"
                        >
                          Lockdown
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Content View 3: Personnel & Roles */}
      {activeTab === 'roster' && (
        <div className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#141518] p-3 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search team member by name or role..."
                value={searchMemberQuery}
                onChange={(e) => setSearchMemberQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-neutral-50 dark:bg-[#1A1B1F] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white outline-none"
              />
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={<UserPlus className="w-3.5 h-3.5" />}
              onClick={() => setIsAddModalOpen(true)}
            >
              Add Member
            </Button>
          </div>

          <div className="bg-white dark:bg-[#141518] rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 overflow-hidden shadow-2xs">
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredMembers.map((member) => {
                const isRevoked = member.subgroup === 'no_access';

                return (
                  <div
                    key={member.id}
                    className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                      isRevoked ? 'bg-rose-50/30 dark:bg-rose-950/20' : 'hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-neutral-200 dark:ring-neutral-700"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                            {member.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-medium">
                            {member.department}
                          </span>
                          {isRevoked && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-rose-600 text-white px-1.5 py-0.2 rounded">
                              <X className="w-2.5 h-2.5" />
                              Revoked
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-neutral-400 block mt-0.5">
                          {member.title} • {member.email}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-center">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-neutral-400">Clearance:</span>
                        <select
                          value={member.subgroup}
                          onChange={(e: any) => handleSetMemberSubgroup(member.id, e.target.value)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border outline-none cursor-pointer ${
                            isRevoked
                              ? 'bg-rose-600 text-white border-rose-700'
                              : 'bg-neutral-50 dark:bg-[#1A1B1F] text-neutral-900 dark:text-white border-neutral-200 dark:border-neutral-800'
                          }`}
                        >
                          {ALL_SUBGROUPS.map((sg) => (
                            <option key={sg.id} value={sg.id} className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
                              {sg.id === 'no_access' ? '❌ No Access (Revoked)' : `✅ ${sg.label}`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => setShiftingMember(member)}
                      >
                        <ArrowRightLeft className="w-3 h-3 mr-1" />
                        Shift Dept
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Content View 4: Live Access Simulator */}
      {activeTab === 'simulator' && (
        <div className="p-6 space-y-5">
          {/* Top Config: Test Access Inputs */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xs space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Live Access Simulator & Decision Engine
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Simulate clearance evaluations across personnel ranks, departmental policies, and object lockdowns.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  1. Testing Department
                </label>
                <select
                  value={simDept}
                  onChange={(e) => setSimDept(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-neutral-50 dark:bg-[#1A1B1F] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white outline-none cursor-pointer"
                >
                  {DEFAULT_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  2. Testing Clearance Level
                </label>
                <select
                  value={simSubgroup}
                  onChange={(e: any) => setSimSubgroup(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-neutral-50 dark:bg-[#1A1B1F] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white outline-none cursor-pointer"
                >
                  {ALL_SUBGROUPS.map((sg) => (
                    <option key={sg.id} value={sg.id}>
                      {sg.id === 'no_access' ? '❌ No Access (Zero Clearance)' : sg.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  3. Target Test Document
                </label>
                <select
                  value={selectedSimDocId || (documents[0]?.id ?? '')}
                  onChange={(e) => setSelectedSimDocId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-neutral-50 dark:bg-[#1A1B1F] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white outline-none cursor-pointer"
                >
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Phase 10: DECISION TRACE & FINAL DECISION */}
          {(() => {
            const activeTestDoc =
              documents.find((d) => d.id === (selectedSimDocId || documents[0]?.id)) ||
              documents[0];
            if (!activeTestDoc) return null;

            const policy = docPolicies[activeTestDoc.id] || {
              allowedDepts: [activeTestDoc.department || 'Core Architecture'],
              allowedSubfields: [],
              minSubgroup: 'junior',
              isRestricted: false,
            };

            const rank: Record<DepartmentSubgroup, number> = {
              senior: 4,
              mid_senior: 3,
              junior: 2,
              intern: 1,
              trainee: 0,
              no_access: -1,
            };

            const orgCheck = true;
            const policyCheck = policy.minSubgroup !== 'no_access';
            const deptCheck = policy.allowedDepts.includes(simDept) || policy.allowedDepts.length === 0;
            const clearanceCheck =
              simSubgroup !== 'no_access' && rank[simSubgroup] >= rank[policy.minSubgroup];
            const finalAllowed = orgCheck && policyCheck && deptCheck && clearanceCheck;

            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Decision Trace Card */}
                <div className="md:col-span-2 p-5 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
                      Evaluation Decision Trace
                    </span>
                    <span className="text-[11px] font-mono text-neutral-400">
                      Target: {activeTestDoc.title}
                    </span>
                  </div>

                  <div className="space-y-2 pt-1">
                    {/* Check 1: Organization */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50/80 dark:bg-[#18191D] border border-neutral-200/50 dark:border-neutral-800/60 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                          1. Organization Boundary
                        </span>
                        <span className="text-[11px] text-neutral-400">
                          (Enterprise partition verified)
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Pass
                      </span>
                    </div>

                    {/* Check 2: Policy Lockdown */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50/80 dark:bg-[#18191D] border border-neutral-200/50 dark:border-neutral-800/60 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                          2. Document Policy State
                        </span>
                        <span className="text-[11px] text-neutral-400">
                          {policyCheck ? 'Active Policy (Unlocked)' : 'Total Lockdown enforced'}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          policyCheck
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {policyCheck ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Pass
                          </>
                        ) : (
                          <>
                            <X className="w-3.5 h-3.5 stroke-[2.5]" /> Locked
                          </>
                        )}
                      </span>
                    </div>

                    {/* Check 3: Department */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50/80 dark:bg-[#18191D] border border-neutral-200/50 dark:border-neutral-800/60 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                          3. Department Clearance
                        </span>
                        <span className="text-[11px] text-neutral-400">
                          Testing: "{simDept}"
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          deptCheck
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {deptCheck ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Allowed
                          </>
                        ) : (
                          <>
                            <X className="w-3.5 h-3.5 stroke-[2.5]" /> No Access
                          </>
                        )}
                      </span>
                    </div>

                    {/* Check 4: Seniority Clearance */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50/80 dark:bg-[#18191D] border border-neutral-200/50 dark:border-neutral-800/60 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                          4. Clearance Threshold
                        </span>
                        <span className="text-[11px] text-neutral-400">
                          Required: {ALL_SUBGROUPS.find((s) => s.id === policy.minSubgroup)?.label || 'Junior'} • Current: {ALL_SUBGROUPS.find((s) => s.id === simSubgroup)?.label || simSubgroup}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          clearanceCheck
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {clearanceCheck ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Satisfied
                          </>
                        ) : (
                          <>
                            <X className="w-3.5 h-3.5 stroke-[2.5]" /> Insufficient
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Final Decision Card */}
                <div
                  className={`p-5 rounded-2xl border flex flex-col justify-between ${
                    finalAllowed
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                      : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                  }`}
                >
                  <div>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        finalAllowed
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                      }`}
                    >
                      FINAL DECISION
                    </span>
                    <h4
                      className={`text-base font-bold mt-2 flex items-center gap-1.5 ${
                        finalAllowed
                          ? 'text-emerald-800 dark:text-emerald-300'
                          : 'text-rose-800 dark:text-rose-300'
                      }`}
                    >
                      {finalAllowed ? (
                        <>
                          <CheckCircle2 className="w-5 h-5" /> ACCESS GRANTED
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5" /> ACCESS DENIED
                        </>
                      )}
                    </h4>
                    <p
                      className={`text-xs mt-1.5 leading-relaxed ${
                        finalAllowed
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-rose-700 dark:text-rose-400'
                      }`}
                    >
                      {finalAllowed
                        ? `Testing profile has cleared all gates for "${activeTestDoc.title}". The user can search, retrieve, and ask AUREN questions grounded in this document.`
                        : !policyCheck
                        ? 'Access is completely blocked because this document is under Total Lockdown.'
                        : !deptCheck
                        ? `Access is denied because department "${simDept}" does not have clearance for this document.`
                        : `Access is denied because clearance rank "${ALL_SUBGROUPS.find((s) => s.id === simSubgroup)?.label}" is below the required rank.`}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-neutral-200/40 dark:border-neutral-800/40 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                    <span>AUREN Gatekeeper</span>
                    <span className="font-mono">Live Evaluation</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Results: Allowed vs Denied */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Allowed Docs Column */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  Access Granted (✅ Allowed)
                </span>
                <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {(documents || []).filter((d) => evaluateDocAccess(d).allowed).length} Docs
                </span>
              </div>

              <div className="space-y-2">
                {(documents || [])
                  .filter((d) => evaluateDocAccess(d).allowed)
                  .map((doc) => {
                    const evalResult = evaluateDocAccess(doc);
                    return (
                      <div
                        key={doc.id}
                        className="p-3.5 rounded-xl bg-white dark:bg-[#141518] border border-emerald-200 dark:border-emerald-900/60 shadow-2xs flex items-start justify-between gap-3"
                      >
                        <div>
                          <h4 className="text-xs font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            {doc.title}
                          </h4>
                          <span className="text-[10px] text-neutral-400 font-mono block mt-0.5">
                            {doc.filename} • {doc.department}
                          </span>
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block">
                            {evalResult.reason}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 shrink-0">
                          Accessible
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Blocked Docs Column */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <XCircle className="w-4 h-4" />
                  Access Denied (❌ No Access)
                </span>
                <span className="text-xs font-mono font-bold text-rose-700 dark:text-rose-400">
                  {(documents || []).filter((d) => !evaluateDocAccess(d).allowed).length} Docs
                </span>
              </div>

              <div className="space-y-2">
                {(documents || [])
                  .filter((d) => !evaluateDocAccess(d).allowed)
                  .map((doc) => {
                    const evalResult = evaluateDocAccess(doc);
                    return (
                      <div
                        key={doc.id}
                        className="p-3.5 rounded-xl bg-white dark:bg-[#141518] border border-rose-200 dark:border-rose-900/60 shadow-2xs flex items-start justify-between gap-3"
                      >
                        <div>
                          <h4 className="text-xs font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                            <X className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            {doc.title}
                          </h4>
                          <span className="text-[10px] text-neutral-400 font-mono block mt-0.5">
                            {doc.filename} • {doc.department}
                          </span>
                          <span className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 block">
                            {evalResult.reason}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800 shrink-0">
                          Blocked
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <AddMemberModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddMember={(newMember) => {
            updateMembersList([...members, newMember]);
            setIsAddModalOpen(false);
            showFeedback(`✅ ${newMember.name} added to ${newMember.department}.`);
          }}
          subfields={subfields}
        />
      )}

      {/* Shift Member Modal */}
      {shiftingMember && (
        <ShiftMemberModal
          member={shiftingMember}
          isOpen={Boolean(shiftingMember)}
          onClose={() => setShiftingMember(null)}
          onSaveShift={(memberId, newDepts, newSubgroup, newClearance, newTitle, newDomain) => {
            const updated = members.map((m) => {
              if (m.id === memberId) {
                return {
                  ...m,
                  department: newDepts[0] || m.department,
                  departments: newDepts,
                  subgroup: newSubgroup,
                  clearanceLevel: newClearance,
                  title: newTitle || m.title,
                  domain: newDomain || m.domain,
                };
              }
              return m;
            });
            updateMembersList(updated);
            setShiftingMember(null);
            showFeedback(`✅ Clearance updated for ${shiftingMember.name}.`);
          }}
        />
      )}

      {/* Document Policy Inspector Drawer */}
      {selectedDocForPolicy && (
        <DocumentPolicyInspectorDrawer
          document={selectedDocForPolicy}
          isOpen={Boolean(selectedDocForPolicy)}
          onClose={() => setSelectedDocForPolicy(null)}
          policy={
            docPolicies[selectedDocForPolicy.id] || {
              allowedDepts: [selectedDocForPolicy.department || 'Core Architecture'],
              allowedSubfields: [],
              minSubgroup: 'junior',
              isRestricted: false,
            }
          }
          departments={DEFAULT_DEPARTMENTS}
          subgroups={ALL_SUBGROUPS}
          availableSubfields={subfields}
          onToggleDept={handleToggleDocDept}
          onToggleSubfield={handleToggleDocSubfield}
          onSetMinSubgroup={handleSetDocMinSubgroup}
          onSetAllDepts={handleSetAllDeptsAccess}
          onTotalLockdown={handleTotalLockdownDoc}
        />
      )}
    </div>
  );
};
