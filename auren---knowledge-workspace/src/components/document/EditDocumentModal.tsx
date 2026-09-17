import React, { useState, useEffect } from 'react';
import {
  FileText,
  Building,
  Layers,
  ShieldCheck,
  UserPlus,
  X,
  Lock,
  Unlock,
  ExternalLink,
  AlertCircle,
  Check,
  Edit3,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  AurenDocument,
  DepartmentSubgroup,
  AllowedSpecificMember,
  DocumentType,
} from '../../types';
import {
  DEFAULT_DEPARTMENTS,
  getStoredSubfields,
  getStoredMembers,
  INTERN_DOMAINS,
} from '../../services/rbacData';
import { api } from '../../services/api';

interface EditDocumentModalProps {
  document: AurenDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onDocumentUpdated: (updatedDoc: AurenDocument) => void;
  onNavigateToRbac?: (docId: string) => void;
}

export const EditDocumentModal: React.FC<EditDocumentModalProps> = ({
  document,
  isOpen,
  onClose,
  onDocumentUpdated,
  onNavigateToRbac,
}) => {
  if (!document) return null;

  const [title, setTitle] = useState('');
  const [scope, setScope] = useState<'personal' | 'organization'>('organization');
  const [docType, setDocType] = useState<DocumentType>('markdown');
  const [rawContent, setRawContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Clearance settings
  const [isRestrictedDoc, setIsRestrictedDoc] = useState<boolean>(false);
  const [targetDepartment, setTargetDepartment] = useState<string>(DEFAULT_DEPARTMENTS[0]);
  const [availableSubfields, setAvailableSubfields] = useState<string[]>([]);
  const [targetSubfield, setTargetSubfield] = useState<string>('Platform Core');
  const [targetSublevel, setTargetSublevel] = useState<DepartmentSubgroup>('trainee');
  const [targetDomain, setTargetDomain] = useState<string>('all');

  // Cross-department member exceptions
  const [allMembers, setAllMembers] = useState(getStoredMembers());
  const [selectedSpecificMembers, setSelectedSpecificMembers] = useState<AllowedSpecificMember[]>([]);
  const [memberPickerSelect, setMemberPickerSelect] = useState<string>('');

  useEffect(() => {
    if (document && isOpen) {
      setTitle(document.title);
      setScope(document.scope);
      setDocType(document.type);
      setRawContent(document.rawContent || '');
      setError('');
      setSavedSuccess(false);

      const subfields = getStoredSubfields();
      setAvailableSubfields(subfields);
      setAllMembers(getStoredMembers());

      // Populate policy from existing document accessPolicy
      if (document.accessPolicy) {
        const p = document.accessPolicy;
        setIsRestrictedDoc(Boolean(p.isRestricted && p.scope !== 'personal'));

        if (p.allowedDepartments && p.allowedDepartments.length > 0) {
          setTargetDepartment(p.allowedDepartments[0]);
        } else {
          setTargetDepartment('none'); // No access to any department
        }

        if (p.allowedSubfields && p.allowedSubfields.length > 0) {
          setTargetSubfield(p.allowedSubfields[0]);
        } else {
          setTargetSubfield('none'); // No subfield access
        }

        if (p.minSubgroupLevel) {
          setTargetSublevel(p.minSubgroupLevel);
        } else {
          setTargetSublevel('trainee');
        }

        if (p.allowedDomains && p.allowedDomains.length > 0) {
          setTargetDomain(p.allowedDomains[0]);
        } else {
          setTargetDomain('all');
        }

        if (p.allowedSpecificMembers && Array.isArray(p.allowedSpecificMembers)) {
          setSelectedSpecificMembers(p.allowedSpecificMembers);
        } else {
          setSelectedSpecificMembers([]);
        }
      } else {
        setIsRestrictedDoc(false);
        setTargetDepartment(DEFAULT_DEPARTMENTS[0]);
        setTargetSubfield(subfields[0] || 'Platform Core');
        setTargetSublevel('trainee');
        setTargetDomain('all');
        setSelectedSpecificMembers([]);
      }
    }
  }, [document, isOpen]);

  const handleAddSpecificMember = (memberId: string) => {
    if (!memberId) return;
    const found = allMembers.find((m) => m.id === memberId);
    if (!found) return;

    if (!selectedSpecificMembers.some((m) => m.id === found.id)) {
      setSelectedSpecificMembers((prev) => [
        ...prev,
        {
          id: found.id,
          name: found.name,
          department: found.department,
          email: found.email,
          avatarUrl: found.avatarUrl,
        },
      ]);
    }
    setMemberPickerSelect('');
  };

  const handleRemoveSpecificMember = (memberId: string) => {
    setSelectedSpecificMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  const isAccessBlocked = isRestrictedDoc || targetDepartment === 'none' || targetSublevel === 'no_access';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Document title cannot be empty.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const allowedDepts = (targetDepartment === 'none' || isRestrictedDoc) ? [] : [targetDepartment];
      const allowedSubs = (targetSubfield === 'none' || isRestrictedDoc) ? [] : (targetSubfield ? [targetSubfield] : []);
      const allowedDoms = isRestrictedDoc ? [] : (targetDomain === 'all' ? [] : [targetDomain]);

      const updated = await api.updateDocument(document.id, {
        title: title.trim(),
        content: rawContent,
        scope,
        type: docType,
        accessPolicy: {
          allowedDepartments: allowedDepts,
          allowedSubfields: allowedSubs,
          minSubgroupLevel: isRestrictedDoc ? 'no_access' : targetSublevel,
          allowedDomains: allowedDoms,
          allowedSpecificMembers: isRestrictedDoc ? [] : selectedSpecificMembers,
          isRestricted: isRestrictedDoc || scope === 'personal',
        },
      });

      setSavedSuccess(true);
      onDocumentUpdated(updated);
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: any) {
      setError(err.message || 'Failed to update document clearance.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Document & Clearance Policy"
      description="Modify document metadata, text content, departmental clearance, and unique cross-department member exceptions."
      maxWidth="2xl"
    >
      <form onSubmit={handleSave} className="flex flex-col gap-4 max-h-[82vh] overflow-y-auto pr-1">
        {/* Scope Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Document Knowledge Scope
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setScope('personal')}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                scope === 'personal'
                  ? 'border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-800/80 ring-1 ring-neutral-900 dark:ring-white'
                  : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-[#1A1B1E]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Personal Vault</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-normal">
                Encrypted in personal namespace. Isolated from organization clearance matrix.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setScope('organization')}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                scope === 'organization'
                  ? 'border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-800/80 ring-1 ring-neutral-900 dark:ring-white'
                  : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-[#1A1B1E]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Organization Space</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-normal">
                Governed by department clearance, subcategories, and individual exceptions.
              </span>
            </button>
          </div>
        </div>

        {/* Title and Type Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              label="Document Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed Consensus Specification v2"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
              Document Type
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocumentType)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1B1E] text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
            >
              <option value="markdown">Markdown (.md)</option>
              <option value="spec">Spec (Architecture)</option>
              <option value="pdf">PDF Report</option>
              <option value="code">Source Code</option>
            </select>
          </div>
        </div>

        {/* Editable Raw Content / Summary Notes */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
              Document Text Content & Reference Notes
            </label>
            <span className="text-[10px] text-neutral-400 font-mono">
              {rawContent.length} characters
            </span>
          </div>
          <textarea
            value={rawContent}
            onChange={(e) => setRawContent(e.target.value)}
            rows={4}
            placeholder="Edit text content, architectural specs, or reference notes for this document..."
            className="w-full p-2.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1B1E] text-neutral-900 dark:text-white outline-none focus:border-neutral-400 font-mono resize-y"
          />
        </div>

        {/* Department Subcategories & Sublevel Clearance (When Organization scope) */}
        {scope === 'organization' && (
          <div className={`p-4 rounded-xl border flex flex-col gap-4 transition-colors ${
            isAccessBlocked
              ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/60'
              : 'bg-neutral-50 dark:bg-[#15161A] border-neutral-200/80 dark:border-neutral-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-900 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Department Clearance & Access Gateway</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (isAccessBlocked) {
                      setIsRestrictedDoc(false);
                      setTargetDepartment(DEFAULT_DEPARTMENTS[0]);
                      setTargetSublevel('trainee');
                    } else {
                      setIsRestrictedDoc(true);
                      setTargetDepartment('none');
                      setTargetSublevel('no_access');
                    }
                  }}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                    isAccessBlocked
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300'
                  }`}
                >
                  {isAccessBlocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  <span>{isAccessBlocked ? '✕ Status: No Access (Locked)' : '✓ Status: Access Cleared'}</span>
                </button>
              </div>
            </div>

            {/* Visual alert if No Access is selected on any field */}
            {isAccessBlocked && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-red-100/80 dark:bg-red-950/60 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-900 text-xs font-medium animate-fadeIn">
                <X className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 stroke-[2.5]" />
                <span>
                  <strong>✕ No Access Active:</strong> Access is blocked for this document. Department or seniority level has been set to restrict access.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Target Department */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Building className="w-3 h-3 text-neutral-400" />
                    <span>Target Department</span>
                  </span>
                  {targetDepartment === 'none' ? (
                    <span className="text-[10px] text-red-600 dark:text-red-400 font-bold">✕ No Access</span>
                  ) : (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">✓ Allowed</span>
                  )}
                </label>
                <select
                  value={targetDepartment}
                  onChange={(e) => setTargetDepartment(e.target.value)}
                  className={`w-full px-2.5 py-1.5 text-xs rounded-lg border bg-white dark:bg-[#1A1B1E] text-neutral-900 dark:text-white outline-none focus:border-neutral-400 ${
                    targetDepartment === 'none' ? 'border-red-400 dark:border-red-800 font-semibold text-red-600 dark:text-red-400' : 'border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  <option value="none">✕ No Access (Block All Departments)</option>
                  {DEFAULT_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      ✓ {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subcategory / Subfield */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-neutral-400" />
                    <span>Subcategory / Subfield</span>
                  </span>
                  {targetSubfield === 'none' ? (
                    <span className="text-[10px] text-red-600 dark:text-red-400 font-bold">✕ No Access</span>
                  ) : (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">✓ Allowed</span>
                  )}
                </label>
                <select
                  value={targetSubfield}
                  onChange={(e) => setTargetSubfield(e.target.value)}
                  className={`w-full px-2.5 py-1.5 text-xs rounded-lg border bg-white dark:bg-[#1A1B1E] text-neutral-900 dark:text-white outline-none focus:border-neutral-400 ${
                    targetSubfield === 'none' ? 'border-red-400 dark:border-red-800 font-semibold text-red-600 dark:text-red-400' : 'border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  <option value="none">✕ No Access (Block All Subfields)</option>
                  {availableSubfields.map((sub) => (
                    <option key={sub} value={sub}>
                      ✓ {sub}
                    </option>
                  ))}
                </select>
              </div>

              {/* Required Sublevel */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-neutral-400" />
                    <span>Required Sublevel</span>
                  </span>
                  {targetSublevel === 'no_access' ? (
                    <span className="text-[10px] text-red-600 dark:text-red-400 font-bold">✕ No Access</span>
                  ) : (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">✓ Allowed</span>
                  )}
                </label>
                <select
                  value={targetSublevel}
                  onChange={(e) => setTargetSublevel(e.target.value as DepartmentSubgroup)}
                  className={`w-full px-2.5 py-1.5 text-xs rounded-lg border bg-white dark:bg-[#1A1B1E] text-neutral-900 dark:text-white outline-none focus:border-neutral-400 ${
                    targetSublevel === 'no_access' ? 'border-red-400 dark:border-red-800 font-semibold text-red-600 dark:text-red-400' : 'border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  <option value="no_access">✕ No Access (Completely Locked / Admin Only)</option>
                  <option value="trainee">✓ Trainee+ (All department staff)</option>
                  <option value="intern">✓ Intern+ (Interns, Juniors, Seniors)</option>
                  <option value="junior">✓ Junior Engineer+ (Junior & Senior)</option>
                  <option value="mid_senior">✓ Mid / Senior+ (Mid & Principal)</option>
                  <option value="senior">✓ Senior Staff / Principal Only</option>
                </select>
              </div>
            </div>

            {/* Intern Domain Specialization Gating */}
            <div className="flex flex-col gap-1 pt-2 border-t border-neutral-200/60 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                  <span>Intern Domain Specialization Gating</span>
                  {targetDomain === 'blocked' ? (
                    <span className="text-[10px] text-red-600 dark:text-red-400 font-bold">✕ Interns Blocked</span>
                  ) : (
                    <span className="text-[10px] text-neutral-400">Filtering domain</span>
                  )}
                </label>
                <span className="text-[10px] text-neutral-400">Control intern clearance</span>
              </div>
              <select
                value={targetDomain}
                onChange={(e) => setTargetDomain(e.target.value)}
                className={`w-full px-2.5 py-1.5 text-xs rounded-lg border bg-white dark:bg-[#1A1B1E] text-neutral-900 dark:text-white outline-none focus:border-neutral-400 ${
                  targetDomain === 'blocked' ? 'border-red-400 dark:border-red-800 font-semibold text-red-600 dark:text-red-400' : 'border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <option value="all">✓ Any Domain (All Department Interns)</option>
                <option value="blocked">✕ No Access (Blocked for All Interns)</option>
                {INTERN_DOMAINS.map((domain) => (
                  <option key={domain} value={domain}>
                    ✓ Require Domain: {domain}
                  </option>
                ))}
              </select>
            </div>

            {/* Grant Unique Individual Member Access (Cross-Department) */}
            <div className="flex flex-col gap-2 pt-2 border-t border-neutral-200/60 dark:border-neutral-800">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Grant Unique Individual Member Access (Cross-Department)</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-200/70 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold">
                    {selectedSpecificMembers.length} queued
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Allow specific individuals from other departments or subcategories to access this document.
                </p>
              </div>

              {/* Member Picker Select Dropdown */}
              <div className="flex items-center gap-2">
                <select
                  value={memberPickerSelect}
                  onChange={(e) => {
                    const id = e.target.value;
                    if (id) handleAddSpecificMember(id);
                  }}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1B1E] text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
                >
                  <option value="">+ Choose a member across any department to authorize...</option>
                  {allMembers
                    .filter((m) => !selectedSpecificMembers.some((sm) => sm.id === m.id))
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} — {m.department} ({m.subgroup}) [ID: #{m.id}]
                      </option>
                    ))}
                </select>
              </div>

              {/* Queued Member Capsule Shapes */}
              {selectedSpecificMembers.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2 mt-1 p-2.5 rounded-xl bg-white dark:bg-[#111215] border border-neutral-200/70 dark:border-neutral-800/80 min-h-[44px]">
                  {selectedSpecificMembers.map((member) => (
                    <div
                      key={member.id}
                      className="inline-flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-[#1E2026] text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 shadow-2xs group animate-in fade-in duration-150"
                    >
                      {/* Avatar / Initial circle */}
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={member.name}
                          className="w-4 h-4 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[9px] font-bold shrink-0">
                          {member.name.charAt(0)}
                        </span>
                      )}

                      {/* Name & Department info */}
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
                        {member.name}
                      </span>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
                        • {member.department}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400 px-1 py-0.2 bg-neutral-200/60 dark:bg-neutral-800 rounded">
                        #{member.id.replace('usr_', '')}
                      </span>

                      {/* Cross / Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecificMember(member.id)}
                        className="w-4 h-4 rounded-full flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer shrink-0 ml-0.5"
                        title={`Remove ${member.name} from document access queue`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-neutral-400 italic px-2 py-1.5 rounded-lg bg-white/60 dark:bg-[#111215]/60 border border-neutral-200/50 dark:border-neutral-800/50">
                  No individual cross-department exceptions queued. Only {targetDepartment} members with {targetSublevel}+ clearance will access.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Optional Redirect to RBAC View */}
        {onNavigateToRbac && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-100/70 dark:bg-[#16171B] border border-neutral-200/70 dark:border-neutral-800 text-xs">
            <span className="text-neutral-600 dark:text-neutral-400">
              Need to configure full organization-wide clearance matrix or audit permissions?
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToRbac(document.id);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
            >
              <span>Open in Zero-Trust RBAC Matrix</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {savedSuccess && (
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
            <Check className="w-4 h-4 shrink-0" />
            <span>Document clearance and metadata updated successfully!</span>
          </div>
        )}

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            type="submit"
            isLoading={isSaving}
            disabled={!title.trim()}
          >
            Save Clearance & Metadata
          </Button>
        </div>
      </form>
    </Modal>
  );
};
