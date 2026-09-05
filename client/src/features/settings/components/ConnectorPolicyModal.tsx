import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  Check, 
  ShieldAlert,
  Users,
  Building2,
  UserCheck
} from 'lucide-react';
import { 
  useGetConnectorPolicies, 
  useSaveConnectorPolicy, 
  useDeleteConnectorPolicy,
  type ConnectorPolicy
} from '../api/connectorQueries';

interface ConnectorPolicyModalProps {
  connectorId: string;
  isOpen: boolean;
  onClose: () => void;
  selectedRepos: string[];
  onSuccessNotification?: (msg: string) => void;
}

export const ConnectorPolicyModal: React.FC<ConnectorPolicyModalProps> = ({
  connectorId,
  isOpen,
  onClose,
  selectedRepos,
  onSuccessNotification,
}) => {
  const { data: policies, isLoading, isError, error } = useGetConnectorPolicies(connectorId, isOpen);
  const savePolicyMutation = useSaveConnectorPolicy();
  const deletePolicyMutation = useDeleteConnectorPolicy();

  const [activeRepo, setActiveRepo] = useState<string>(selectedRepos[0] || '');
  
  // Rule State for Active Repository
  const [allowedRoles, setAllowedRoles] = useState<string[]>([]);
  const [allowedDepartments, setAllowedDepartments] = useState<string[]>([]);
  const [allowedUsers, setAllowedUsers] = useState<string[]>([]);
  const [deniedRoles, setDeniedRoles] = useState<string[]>([]);
  const [deniedDepartments, setDeniedDepartments] = useState<string[]>([]);
  const [deniedUsers, setDeniedUsers] = useState<string[]>([]);

  // Inputs for adding items
  const [roleInput, setRoleInput] = useState('');
  const [deptInput, setDeptInput] = useState('');
  const [userInput, setUserInput] = useState('');
  const [ruleType, setRuleType] = useState<'ALLOW' | 'DENY'>('ALLOW');

  const [localError, setLocalError] = useState<string | null>(null);

  // Sync active policy when repository changes or policies refetch
  useEffect(() => {
    if (selectedRepos.length > 0 && !activeRepo) {
      setActiveRepo(selectedRepos[0]);
    }
  }, [selectedRepos, activeRepo]);

  useEffect(() => {
    if (policies && activeRepo) {
      const active = policies.find(
        (p) => p.resourcePattern.toLowerCase() === activeRepo.toLowerCase()
      );
      if (active) {
        setAllowedRoles(active.allowedRoles || []);
        setAllowedDepartments(active.allowedDepartments || []);
        setAllowedUsers(active.allowedUsers || []);
        setDeniedRoles(active.deniedRoles || []);
        setDeniedDepartments(active.deniedDepartments || []);
        setDeniedUsers(active.deniedUsers || []);
      } else {
        // Reset to empty policy defaults
        setAllowedRoles([]);
        setAllowedDepartments([]);
        setAllowedUsers([]);
        setDeniedRoles([]);
        setDeniedDepartments([]);
        setDeniedUsers([]);
      }
    }
  }, [policies, activeRepo]);

  if (!isOpen) return null;

  const currentPolicy = policies?.find(
    (p) => p.resourcePattern.toLowerCase() === activeRepo.toLowerCase()
  );

  const handleAddGrant = (type: 'role' | 'dept' | 'user') => {
    setLocalError(null);
    if (type === 'role' && roleInput.trim()) {
      const val = roleInput.trim();
      if (ruleType === 'ALLOW') {
        if (!allowedRoles.includes(val)) setAllowedRoles([...allowedRoles, val]);
        setDeniedRoles(deniedRoles.filter((r) => r !== val));
      } else {
        if (!deniedRoles.includes(val)) setDeniedRoles([...deniedRoles, val]);
        setAllowedRoles(allowedRoles.filter((r) => r !== val));
      }
      setRoleInput('');
    } else if (type === 'dept' && deptInput.trim()) {
      const val = deptInput.trim();
      if (ruleType === 'ALLOW') {
        if (!allowedDepartments.includes(val)) setAllowedDepartments([...allowedDepartments, val]);
        setDeniedDepartments(deniedDepartments.filter((d) => d !== val));
      } else {
        if (!deniedDepartments.includes(val)) setDeniedDepartments([...deniedDepartments, val]);
        setAllowedDepartments(allowedDepartments.filter((d) => d !== val));
      }
      setDeptInput('');
    } else if (type === 'user' && userInput.trim()) {
      const val = userInput.trim();
      if (ruleType === 'ALLOW') {
        if (!allowedUsers.includes(val)) setAllowedUsers([...allowedUsers, val]);
        setDeniedUsers(deniedUsers.filter((u) => u !== val));
      } else {
        if (!deniedUsers.includes(val)) setDeniedUsers([...deniedUsers, val]);
        setAllowedUsers(allowedUsers.filter((u) => u !== val));
      }
      setUserInput('');
    }
  };

  const handleSave = async () => {
    if (!activeRepo) return;
    setLocalError(null);

    try {
      await savePolicyMutation.mutateAsync({
        connectorId,
        resourcePattern: activeRepo,
        allowedRoles,
        allowedDepartments,
        allowedUsers,
        deniedRoles,
        deniedDepartments,
        deniedUsers,
      });

      if (onSuccessNotification) {
        onSuccessNotification(`Access policy updated for repository "${activeRepo}". Effective immediately.`);
      }
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to save connector policy.');
    }
  };

  const handleDeletePolicy = async () => {
    if (!currentPolicy) return;
    setLocalError(null);

    try {
      await deletePolicyMutation.mutateAsync({
        connectorId,
        policyId: currentPolicy.id,
      });

      setAllowedRoles([]);
      setAllowedDepartments([]);
      setAllowedUsers([]);
      setDeniedRoles([]);
      setDeniedDepartments([]);
      setDeniedUsers([]);

      if (onSuccessNotification) {
        onSuccessNotification(`Access policy cleared for "${activeRepo}". Fallback defaults apply.`);
      }
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to delete connector policy.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950/60 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                Connector Access Control
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure role, department, and user grants or explicit denies per repository.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {localError && (
            <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{localError}</span>
            </div>
          )}

          {/* Repository Selector */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Repository
            </label>
            <select
              value={activeRepo}
              onChange={(e) => setActiveRepo(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {selectedRepos.map((repo) => (
                <option key={repo} value={repo}>
                  {repo}
                </option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-slate-500">Loading access policy for {activeRepo}...</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Add Rule Form */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Add Access Rule</span>
                  <div className="flex items-center gap-1.5 bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg">
                    <button
                      onClick={() => setRuleType('ALLOW')}
                      className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                        ruleType === 'ALLOW'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      ALLOW
                    </button>
                    <button
                      onClick={() => setRuleType('DENY')}
                      className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                        ruleType === 'DENY'
                          ? 'bg-red-600 text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      DENY
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Role Grant */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      By Role (e.g. Engineering)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="Role name"
                        value={roleInput}
                        onChange={(e) => setRoleInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddGrant('role')}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                      <button
                        onClick={() => handleAddGrant('role')}
                        className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Department Grant */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      By Department
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="Department name"
                        value={deptInput}
                        onChange={(e) => setDeptInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddGrant('dept')}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                      <button
                        onClick={() => handleAddGrant('dept')}
                        className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* User Grant */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Individual User Exception
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="User email or ID"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddGrant('user')}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                      <button
                        onClick={() => handleAddGrant('user')}
                        className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Effective Policy Display */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Effective Policy for <span className="font-mono text-blue-600 dark:text-blue-400">{activeRepo}</span>
                </h4>

                {/* Explicit Denies */}
                {(deniedRoles.length > 0 || deniedDepartments.length > 0 || deniedUsers.length > 0) && (
                  <div className="p-3.5 rounded-xl bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 space-y-2">
                    <div className="flex items-center gap-1.5 font-semibold text-red-800 dark:text-red-300 text-[11px] uppercase tracking-wide">
                      <ShieldAlert className="w-3.5 h-3.5" /> Explicit DENY Rules (Overriding ALLOWs)
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {deniedRoles.map((r) => (
                        <span key={`dr-${r}`} className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 px-2 py-0.5 rounded-md font-mono">
                          Role: {r}
                          <button onClick={() => setDeniedRoles(deniedRoles.filter(x => x !== r))} className="hover:text-red-950 dark:hover:text-white">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {deniedDepartments.map((d) => (
                        <span key={`dd-${d}`} className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 px-2 py-0.5 rounded-md font-mono">
                          Dept: {d}
                          <button onClick={() => setDeniedDepartments(deniedDepartments.filter(x => x !== d))} className="hover:text-red-950 dark:hover:text-white">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {deniedUsers.map((u) => (
                        <span key={`du-${u}`} className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 px-2 py-0.5 rounded-md font-mono">
                          User: {u}
                          <button onClick={() => setDeniedUsers(deniedUsers.filter(x => x !== u))} className="hover:text-red-950 dark:hover:text-white">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Explicit Allows */}
                <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300 text-[11px] uppercase tracking-wide">
                    <Check className="w-3.5 h-3.5" /> Explicit ALLOW Rules
                  </div>
                  {allowedRoles.length === 0 && allowedDepartments.length === 0 && allowedUsers.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 italic text-[11px]">
                      No explicit ALLOW rules defined. Default repository inheritance applies.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {allowedRoles.map((r) => (
                        <span key={`ar-${r}`} className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-md font-mono">
                          Role: {r}
                          <button onClick={() => setAllowedRoles(allowedRoles.filter(x => x !== r))} className="hover:text-emerald-950 dark:hover:text-white">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {allowedDepartments.map((d) => (
                        <span key={`ad-${d}`} className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-md font-mono">
                          Dept: {d}
                          <button onClick={() => setAllowedDepartments(allowedDepartments.filter(x => x !== d))} className="hover:text-emerald-950 dark:hover:text-white">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {allowedUsers.map((u) => (
                        <span key={`au-${u}`} className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-md font-mono">
                          User: {u}
                          <button onClick={() => setAllowedUsers(allowedUsers.filter(x => x !== u))} className="hover:text-emerald-950 dark:hover:text-white">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          {currentPolicy ? (
            <button
              onClick={handleDeletePolicy}
              disabled={deletePolicyMutation.isPending}
              className="px-3 py-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all flex items-center gap-1.5 font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Policy</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={savePolicyMutation.isPending || !activeRepo}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {savePolicyMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Access Policy</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
