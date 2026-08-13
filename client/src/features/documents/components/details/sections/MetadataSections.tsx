import React from 'react';
import type { Document } from '../../../api/documentQueries';
import { DetailRow, SectionHeader } from '../ui/DetailRow';
import { Info, Shield, BrainCircuit } from 'lucide-react';
import { ClassificationBadge, AIStatusBadge } from '../../ui/DocumentStatusBadges';

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

  const handleSave = async () => {
    setErrorMsg(null);
    setSavedSuccess(false);
    try {
      await updatePermissions.mutateAsync({
        id: doc.id,
        payload: {
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
      <SectionHeader title="Security & Access Control" icon={<Shield size={14} className="text-muted-foreground" />} />

      <div className="grid grid-cols-2 gap-4">
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
  const status = (doc.jobs?.[0]?.status === 'COMPLETED' ? 'Ready' : 'Processing') as any;
  
  return (
    <div>
      <SectionHeader title="AI Knowledge Base" icon={<BrainCircuit size={14} className="text-muted-foreground" />} />
      <div className="grid grid-cols-2 gap-x-4">
        <DetailRow label="Latest Job Status" value={<AIStatusBadge status={status} />} />
        {doc.jobs && doc.jobs[0]?.error && (
          <div className="col-span-2 mt-2">
            <span className="text-xs text-red-600">Error: {doc.jobs[0].error}</span>
          </div>
        )}
      </div>
    </div>
  );
};
