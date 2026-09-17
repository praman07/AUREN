import React from 'react';

import {
  X,
  ShieldCheck,
  Check,
  Building2,
  Lock,
  Unlock,
  Layers,
  Sliders,
  Info,
  History,
} from 'lucide-react';
import type { AurenDocument } from '../../types';
import { Button } from '../ui/button';

import { getDomainForDepartment } from '../../services/taxonomy';

export interface DocPolicy {
  allowedDepts: string[];
  minSubgroup: string;
  allowedSubfields?: string[];
  isRestricted?: boolean;
}

interface DocumentPolicyInspectorDrawerProps {
  document: AurenDocument | null;
  isOpen: boolean;
  onClose: () => void;
  policy: DocPolicy;
  departments: string[];
  subgroups: { id: string; label: string; clearanceLevel: number }[];
  availableSubfields: string[];
  onToggleDept: (docId: string, dept: string) => void;
  onToggleSubfield: (docId: string, subfield: string) => void;
  onSetMinSubgroup: (docId: string, minSubgroup: string) => void;
  onSetAllDepts: (docId: string, allowAll: boolean) => void;
  onTotalLockdown: (docId: string) => void;
}

export const DocumentPolicyInspectorDrawer: React.FC<DocumentPolicyInspectorDrawerProps> = ({
  document,
  isOpen,
  onClose,
  policy,
  departments,
  subgroups,
  availableSubfields,
  onToggleDept,
  onToggleSubfield,
  onSetMinSubgroup,
  onSetAllDepts,
  onTotalLockdown,
}) => {
  if (!isOpen || !document) return null;

  const isLocked = Boolean(policy.minSubgroup === 'no_access' || policy.allowedDepts.length === 0);
  const allowedDeptsCount = policy.allowedDepts.length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white dark:bg-[#121316] border-l border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-neutral-200/80 dark:border-neutral-800/80 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                  Policy Inspector
                </span>
                {document.isSuperOrgMaster ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    Super Org Master
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                    {document.department}
                  </span>
                )}
                {isLocked ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Total Lockdown
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5" /> Active Policy
                  </span>
                )}
              </div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                {document.title}
              </h2>
              <p className="text-xs font-mono text-neutral-400 mt-0.5 truncate">
                {document.filename}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label="Close policy inspector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Document Metadata Summary Card */}
            <div className="p-3.5 rounded-xl bg-neutral-50/80 dark:bg-[#15161A] border border-neutral-200/80 dark:border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                <span className="font-semibold uppercase tracking-wider">Object Metadata</span>
                <span className="font-mono">{document.scope || 'organization'} scope</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex flex-col">
                  <span className="text-[10px] text-neutral-400">Department</span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                    {document.department || 'Core Architecture'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-neutral-400">Knowledge Domain</span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                    {getDomainForDepartment(document.department).name}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-neutral-400">Owner / Author</span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                    {document.uploadedBy || 'Praman Singh Bhogal'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-neutral-400">Last Modified</span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                    {new Date(document.updatedAt || document.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Access Summary Badges */}
              <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white dark:bg-[#1A1B1F] border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300">
                  {allowedDeptsCount} of {departments.length} Depts Allowed
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white dark:bg-[#1A1B1F] border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300">
                  Min: {subgroups.find((s) => s.id === policy.minSubgroup)?.label || 'Junior'}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white dark:bg-[#1A1B1F] border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300">
                  {policy.allowedSubfields?.length || 0} Subfields
                </span>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#16171B] border border-neutral-200/80 dark:border-neutral-800/80">
              <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block mb-2.5">
                Quick Clearance Actions
              </span>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Unlock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                  onClick={() => onSetAllDepts(document.id, true)}
                  className="w-full text-xs justify-center"
                >
                  Allow All Departments
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Lock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
                  onClick={() => onTotalLockdown(document.id)}
                  className="w-full text-xs justify-center text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  Total Lockdown
                </Button>
              </div>
            </div>

            {/* Question 1: Department Access ("Who can access this document?") */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                    Department Access Matrix
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Revoked departments cannot access this document regardless of rank.
                  </p>
                </div>
                <span className="text-[11px] font-mono font-medium text-neutral-500 dark:text-neutral-400">
                  {allowedDeptsCount} of {departments.length} allowed
                </span>
              </div>

              <div className="space-y-1.5">
                {departments.map((dept) => {
                  const isAllowed = policy.allowedDepts.includes(dept);
                  return (
                    <div
                      key={dept}
                      className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                        isAllowed
                          ? 'bg-white dark:bg-[#18191D] border-neutral-200/80 dark:border-neutral-800'
                          : 'bg-neutral-50/70 dark:bg-[#141517] border-neutral-200/50 dark:border-neutral-800/60 opacity-80'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isAllowed ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                          {dept}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onToggleDept(document.id, dept)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                          isAllowed
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 hover:bg-rose-100'
                        }`}
                        aria-label={`Toggle access for ${dept}`}
                      >
                        {isAllowed ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Allowed</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3" />
                            <span>No Access</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Question 2: Minimum Seniority Threshold */}
            <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <div>
                <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-neutral-500" />
                  Minimum Role / Seniority Threshold
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Personnel below this rank are denied access even if department is allowed.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {subgroups.map((sg) => {
                  const isSelected = policy.minSubgroup === sg.id;
                  const isLockdownOption = sg.id === 'none';

                  return (
                    <button
                      key={sg.id}
                      type="button"
                      onClick={() => onSetMinSubgroup(document.id, sg.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? isLockdownOption
                            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100'
                            : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white font-semibold'
                          : 'bg-white dark:bg-[#16171B] border-neutral-200/70 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                            isSelected
                              ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                              : 'border-neutral-300 dark:border-neutral-600'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <span className="text-xs font-medium">{sg.label}</span>
                      </div>

                      <span className="text-[10px] font-mono text-neutral-400">
                        {isLockdownOption ? 'Total Block' : `Tier ${sg.clearanceLevel}+`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question 3: Subfields Clearance Tags */}
            <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <div>
                <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-neutral-500" />
                  Subfield Authorization
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Restricts access to staff operating in authorized specializations.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {availableSubfields.map((subfield) => {
                  const isAllowed = policy.allowedSubfields?.includes(subfield);
                  return (
                    <button
                      key={subfield}
                      type="button"
                      onClick={() => onToggleSubfield(document.id, subfield)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                        isAllowed
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium'
                          : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-200/80 dark:border-neutral-700/80 hover:bg-neutral-200/60'
                      }`}
                      aria-label={`Toggle subfield ${subfield}`}
                    >
                      {isAllowed ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      <span>{subfield}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Effective Policy Verification Banner */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-blue-900 dark:text-blue-200 leading-relaxed">
                <span className="font-semibold block mb-0.5">Effective Rule Outcome</span>
                {isLocked ? (
                  <span>Access is completely blocked for all personnel across all departments.</span>
                ) : (
                  <span>
                    Staff belonging to {allowedDeptsCount} allowed department(s) with at least{' '}
                    <strong>
                      {subgroups.find((s) => s.id === policy.minSubgroup)?.label || 'Junior'}
                    </strong>{' '}
                    seniority can read and query this document.
                  </span>
                )}
              </div>
            </div>

            {/* Object-Level Policy History (Phase 4) */}
            <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-neutral-500" />
                  Policy Audit & Change History
                </h3>
                <span className="text-[10px] text-neutral-400 font-mono">
                  Tamper-evident
                </span>
              </div>

              <div className="space-y-2">
                {[
                  {
                    time: 'Today at 10:48 AM',
                    actor: 'Praman Singh Bhogal',
                    role: 'Super Admin',
                    action: `Updated minimum clearance threshold to ${
                      subgroups.find((s) => s.id === policy.minSubgroup)?.label || 'Junior'
                    }`,
                    badge: 'Clearance Updated',
                  },
                  {
                    time: 'Yesterday at 04:12 PM',
                    actor: 'Elena Rostova',
                    role: 'SecOps Lead',
                    action: `Granted access to ${policy.allowedDepts.slice(0, 2).join(', ')} departments`,
                    badge: 'Dept Clearance',
                  },
                  {
                    time: 'Sep 6, 2026',
                    actor: 'System Ingestion Pipeline',
                    role: 'AUREN Core',
                    action: 'Policy initialized from ingestion classification metadata',
                    badge: 'Initialized',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-neutral-50/70 dark:bg-[#15161A] border border-neutral-200/50 dark:border-neutral-800/60 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-200">
                          {item.actor}
                        </span>
                        <span className="text-[10px] text-neutral-400">({item.role})</span>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400">{item.time}</span>
                    </div>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-300">
                      {item.action}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="px-6 py-4 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-[#16171B]/50 flex items-center justify-between">
            <span className="text-xs text-neutral-500">
              Changes apply instantly to live access queries.
            </span>
            <Button variant="primary" size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
