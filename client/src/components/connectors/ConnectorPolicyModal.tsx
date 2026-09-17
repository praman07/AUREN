import React, { useState } from 'react';
import { Shield, Check } from 'lucide-react';
import type { Connector, ConnectorPolicy, UserRole } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/button';

interface ConnectorPolicyModalProps {
  connector: Connector | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, policy: ConnectorPolicy) => Promise<void>;
}

export const ConnectorPolicyModal: React.FC<ConnectorPolicyModalProps> = ({
  connector,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!connector) return null;

  const [allowedRoles, setAllowedRoles] = useState<UserRole[]>(connector.policy.allowedRoles || []);
  const [allowedDepartments, setAllowedDepartments] = useState<string[]>(
    connector.policy.allowedDepartments || []
  );
  const [allowAllOrg, setAllowAllOrg] = useState(connector.policy.allowAllOrg || false);
  const [isSaving, setIsSaving] = useState(false);

  const rolesList: { id: UserRole; label: string }[] = [
    { id: 'member', label: 'Member' },
    { id: 'engineer', label: 'Engineer' },
    { id: 'lead', label: 'Technical Lead' },
    { id: 'admin', label: 'Administrator' },
  ];

  const departmentList = ['Core Architecture', 'Platform Engineering', 'Product', 'Security', 'Compliance'];

  const toggleRole = (role: UserRole) => {
    setAllowedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const toggleDepartment = (dep: string) => {
    setAllowedDepartments((prev) =>
      prev.includes(dep) ? prev.filter((d) => d !== dep) : [...prev, dep]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(connector.id, {
        allowedUsers: connector.policy.allowedUsers || [],
        allowedRoles,
        allowedDepartments,
        allowAllOrg,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save policy:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span>Access Policy: {connector.name}</span>
        </div>
      }
      description="Configure ConnectorPolicy rules to control which roles and departments can retrieve resources from this connector."
      maxWidth="md"
    >
      <div className="flex flex-col gap-5 text-xs">
        {/* Scope Notice */}
        <div className="p-3 rounded-lg bg-neutral-50 dark:bg-[#151619] border border-neutral-200/60 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">Connector Scope</span>
            <span className="capitalize font-mono text-[11px]">{connector.scope}</span>
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
            Enforced at the Qdrant retrieval and context generation boundary.
          </p>
        </div>

        {/* Global Org Access Checkbox */}
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allowAllOrg}
            onChange={(e) => setAllowAllOrg(e.target.checked)}
            className="mt-0.5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400 cursor-pointer"
          />
          <div>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              Allow all organization members
            </span>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Any authenticated employee in the domain can query synchronized resources.
            </p>
          </div>
        </label>

        {/* Role Enforcement */}
        <div className="flex flex-col gap-2">
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
            Authorized Roles
          </span>
          <div className="grid grid-cols-2 gap-2">
            {rolesList.map((r) => {
              const checked = allowedRoles.includes(r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleRole(r.id)}
                  className={`p-2 rounded-lg border text-left flex items-center justify-between transition-colors cursor-pointer ${
                    checked
                      ? 'bg-neutral-100 dark:bg-neutral-800/80 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                  }`}
                >
                  <span>{r.label}</span>
                  {checked && <Check className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Department Whitelist */}
        <div className="flex flex-col gap-2">
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
            Authorized Departments
          </span>
          <div className="flex flex-wrap gap-1.5">
            {departmentList.map((dep) => {
              const checked = allowedDepartments.includes(dep);
              return (
                <button
                  key={dep}
                  type="button"
                  onClick={() => toggleDepartment(dep)}
                  className={`px-2.5 py-1 rounded-md text-xs border transition-colors cursor-pointer ${
                    checked
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                      : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  {dep}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="button"
            isLoading={isSaving}
            onClick={handleSave}
          >
            Apply Policy
          </Button>
        </div>
      </div>
    </Modal>
  );
};
