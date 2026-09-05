import React from 'react';
import type { Document } from '../../../api/documentQueries';
import { useUpdateDocumentPermissions, useReprocessDocument } from '../../../api/documentQueries';
import { DetailRow, SectionHeader } from '../ui/DetailRow';
import { Info, Shield, BrainCircuit, RefreshCw } from 'lucide-react';
import { AIStatusBadge } from '../../ui/DocumentStatusBadges';

export const OverviewSection: React.FC<{ doc: Document }> = ({ doc }) => {
  const ext = doc.title.split('.').pop()?.toUpperCase() || 'FILE';
  const ownerStr = doc.owner ? `${doc.owner.firstName} ${doc.owner.lastName}` : 'Unknown';
  const bytes = doc.sizeBytes || 0;
  const mb = (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  const v = doc.versions && doc.versions.length > 0 ? doc.versions[0].version : 1;

  return (
    <div>
      <SectionHeader title="Overview" icon={<Info size={14} className="text-muted-foreground" />} />
      <div className="grid grid-cols-2 gap-x-4">
        <DetailRow label="File Type" value={ext} />
        <DetailRow label="Size" value={mb} />
        <DetailRow label="Latest Version" value={<span className="font-mono">v{v}</span>} />
        <DetailRow label="Owner" value={ownerStr} />
        <DetailRow label="Created" value={new Date(doc.createdAt).toLocaleString()} />
      </div>
    </div>
  );
};

export const SecuritySection: React.FC<{ doc: Document }> = ({ doc }) => {
  const updatePermissions = useUpdateDocumentPermissions();
  const [scope, setScope] = React.useState<string>(doc.scope || (doc.visibility === 'PRIVATE' ? 'PERSONAL' : 'ORGANIZATION'));
  const [visibility, setVisibility] = React.useState<string>(doc.visibility || 'PUBLIC');
  const [classification, setClassification] = React.useState<string>(doc.classification || 'PUBLIC');
  const [allowedRoles, setAllowedRoles] = React.useState<string>((doc.allowedRoles || []).join(', '));
  const [deniedRoles, setDeniedRoles] = React.useState<string>((doc.deniedRoles || []).join(', '));
  const [allowedDepartments, setAllowedDepartments] = React.useState<string>((doc.allowedDepartments || []).join(', '));
  const [deniedDepartments, setDeniedDepartments] = React.useState<string>((doc.deniedDepartments || []).join(', '));
  const [allowedUsers, setAllowedUsers] = React.useState<string>((doc.allowedUsers || []).join(', '));
  const [deniedUsers, setDeniedUsers] = React.useState<string>((doc.deniedUsers || []).join(', '));
  const [savedSuccess, setSavedSuccess] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    setScope(doc.scope || (doc.visibility === 'PRIVATE' ? 'PERSONAL' : 'ORGANIZATION'));
    setVisibility(doc.visibility || 'PUBLIC');
    setClassification(doc.classification || 'PUBLIC');
    setAllowedRoles((doc.allowedRoles || []).join(', '));
    setDeniedRoles((doc.deniedRoles || []).join(', '));
    setAllowedDepartments((doc.allowedDepartments || []).join(', '));
    setDeniedDepartments((doc.deniedDepartments || []).join(', '));
    setAllowedUsers((doc.allowedUsers || []).join(', '));
    setDeniedUsers((doc.deniedUsers || []).join(', '));
  }, [doc]);

  const parseList = (str: string) => str.split(',').map(s => s.trim()).filter(Boolean);

  const handleScopeChange = (newScope: string) => {
    setScope(newScope);
    if (newScope === 'PERSONAL' && visibility !== 'PRIVATE') {
      setVisibility('PRIVATE');
    } else if (newScope === 'ORGANIZATION' && visibility === 'PRIVATE') {
      setVisibility('PUBLIC');
    }
  };

  const handleSave = async () => {
    setErrorMsg(null);
    setSavedSuccess(false);
    try {
      await updatePermissions.mutateAsync({
        id: doc.id,
        payload: {
          scope,
          visibility,
          classification,
          allowedRoles: parseList(allowedRoles),
          deniedRoles: parseList(deniedRoles),
          allowedDepartments: parseList(allowedDepartments),
          deniedDepartments: parseList(deniedDepartments),
          allowedUsers: parseList(allowedUsers),
          deniedUsers: parseList(deniedUsers),
        }
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update permissions');
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="Security & Scope Control" icon={<Shield size={14} className="text-muted-foreground" />} />

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">Knowledge Scope</label>
          <select
            value={scope}
            onChange={(e) => handleScopeChange(e.target.value)}
            className="w-full bg-background border border-input rounded-md px-2 py-1.5 text-xs font-medium focus:ring-1 focus:ring-ring text-emerald-700 bg-emerald-50/30"
          >
            <option value="ORGANIZATION">ORGANIZATION (Enterprise)</option>
            <option value="PERSONAL">PERSONAL (Vault / Owner)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">Visibility</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="w-full bg-background border border-input rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-ring"
          >
            <option value="PUBLIC">PUBLIC (All Members)</option>
            <option value="DEPARTMENT">DEPARTMENT (Department Only)</option>
            <option value="RESTRICTED">RESTRICTED (Explicit RBAC/ABAC)</option>
            <option value="PRIVATE">PRIVATE (Owner Only)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">Classification</label>
          <select
            value={classification}
            onChange={(e) => setClassification(e.target.value)}
            className="w-full bg-background border border-input rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-ring"
          >
            <option value="PUBLIC">PUBLIC</option>
            <option value="INTERNAL">INTERNAL</option>
            <option value="CONFIDENTIAL">CONFIDENTIAL</option>
            <option value="RESTRICTED">RESTRICTED</option>
            <option value="TOP_SECRET">TOP_SECRET</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <div>
          <label className="text-xs font-medium text-emerald-600 block mb-1">Allowed Roles (comma-separated)</label>
          <input
            type="text"
            value={allowedRoles}
            onChange={(e) => setAllowedRoles(e.target.value)}
            placeholder="e.g. ADMIN, MANAGER"
            className="w-full bg-background border border-input rounded-md px-2.5 py-1 text-xs"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-rose-600 block mb-1">Denied Roles (Explicit Deny Wins)</label>
          <input
            type="text"
            value={deniedRoles}
            onChange={(e) => setDeniedRoles(e.target.value)}
            placeholder="e.g. INTERN, CONTRACTOR"
            className="w-full bg-background border border-input rounded-md px-2.5 py-1 text-xs"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-emerald-600 block mb-1">Allowed Departments</label>
          <input
            type="text"
            value={allowedDepartments}
            onChange={(e) => setAllowedDepartments(e.target.value)}
            placeholder="e.g. ENGINEERING, LEGAL"
            className="w-full bg-background border border-input rounded-md px-2.5 py-1 text-xs"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-rose-600 block mb-1">Denied Departments</label>
          <input
            type="text"
            value={deniedDepartments}
            onChange={(e) => setDeniedDepartments(e.target.value)}
            placeholder="e.g. EXTERNAL"
            className="w-full bg-background border border-input rounded-md px-2.5 py-1 text-xs"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-emerald-600 block mb-1">Allowed User IDs</label>
          <input
            type="text"
            value={allowedUsers}
            onChange={(e) => setAllowedUsers(e.target.value)}
            placeholder="e.g. usr_123, usr_456"
            className="w-full bg-background border border-input rounded-md px-2.5 py-1 text-xs"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-rose-600 block mb-1">Denied User IDs</label>
          <input
            type="text"
            value={deniedUsers}
            onChange={(e) => setDeniedUsers(e.target.value)}
            placeholder="e.g. usr_789"
            className="w-full bg-background border border-input rounded-md px-2.5 py-1 text-xs"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        {errorMsg && <span className="text-xs text-rose-500 font-medium">{errorMsg}</span>}
        {savedSuccess && <span className="text-xs text-emerald-600 font-medium">Permissions saved & synced with Qdrant!</span>}
        {!errorMsg && !savedSuccess && <span />}

        <button
          type="button"
          onClick={handleSave}
          disabled={updatePermissions.isPending}
          className="px-3 py-1.5 bg-primary text-primary-foreground font-medium rounded-md text-xs hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {updatePermissions.isPending ? 'Saving...' : 'Save Permissions'}
        </button>
      </div>
    </div>
  );
};

export const AISection: React.FC<{ doc: Document }> = ({ doc }) => {
  const latestJob = doc.jobs && doc.jobs.length > 0 ? doc.jobs[0] : null;
  const rawStatus = latestJob?.status || 'READY';
  const status = (rawStatus === 'COMPLETED' || rawStatus === 'READY' ? 'Ready' : rawStatus === 'FAILED' || rawStatus === 'PARTIALLY_FAILED' ? 'Failed' : 'Processing') as any;
  const isRetryable = rawStatus === 'FAILED' || rawStatus === 'PARTIALLY_FAILED' || rawStatus === 'ERROR';
  const reprocessMutation = useReprocessDocument();

  const handleRetry = () => {
    if (reprocessMutation.isPending || !doc.id) return;
    reprocessMutation.mutate(doc.id);
  };

  return (
    <div>
      <SectionHeader title="AI Knowledge Base" icon={<BrainCircuit size={14} className="text-muted-foreground" />} />
      <div className="grid grid-cols-2 gap-x-4">
        <DetailRow label="Latest Job Status" value={<AIStatusBadge status={status} />} />
        {latestJob?.error && (
          <div className="col-span-2 mt-2">
            <span className="text-xs text-red-600 block">Error: {latestJob.error}</span>
          </div>
        )}
        {isRetryable && (
          <div className="col-span-2 mt-3">
            <button
              type="button"
              onClick={handleRetry}
              disabled={reprocessMutation.isPending}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-md text-xs font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={reprocessMutation.isPending ? 'animate-spin' : ''} />
              {reprocessMutation.isPending ? 'Retrying Ingestion...' : 'Retry Processing'}
            </button>
            {reprocessMutation.isError && (
              <span className="text-[11px] text-red-500 font-medium mt-1 block">
                Failed to trigger retry: {(reprocessMutation.error as any)?.message || 'Server error'}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
