import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileText,
  AlertCircle,
  Building,
  Layers,
  ShieldCheck,
  UserPlus,
  X,
  ArrowRight,
  ArrowLeft,
  Lock,
  Unlock,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/button';
import { Input } from '../ui/Input';
import { useAuth } from '../../context/AuthContext';
import type {
  DepartmentSubgroup,
  AllowedSpecificMember,
} from '../../types';

import {
  DEFAULT_DEPARTMENTS,
  getStoredSubfields,
  getStoredMembers,
  INTERN_DOMAINS,
} from '../../services/rbacData';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const { activeScope, user: _user } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [scope, setScope] = useState<'personal' | 'organization'>(
    activeScope === 'personal' ? 'personal' : 'organization'
  );
  const [fileContent, setFileContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Department Subcategories & Sublevels
  const [isRestrictedDoc, setIsRestrictedDoc] = useState<boolean>(false);
  const [targetDepartment, setTargetDepartment] = useState<string>(
    DEFAULT_DEPARTMENTS[0]
  );
  const [availableSubfields, setAvailableSubfields] = useState<string[]>([]);
  const [targetSubfield, setTargetSubfield] = useState<string>('Platform Core');
  const [targetSublevel, setTargetSublevel] = useState<DepartmentSubgroup>('trainee');
  const [targetDomain, setTargetDomain] = useState<string>('all');

  // Unique Individual Member Access Queue (Cross-Department)
  const [allMembers, setAllMembers] = useState(getStoredMembers());
  const [selectedSpecificMembers, setSelectedSpecificMembers] = useState<AllowedSpecificMember[]>([]);
  const [memberPickerSelect, setMemberPickerSelect] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError('');
      const subfields = getStoredSubfields();
      setAvailableSubfields(subfields);
      if (subfields.length > 0 && !targetSubfield) {
        setTargetSubfield(subfields[0]);
      }
      setAllMembers(getStoredMembers());
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setFileContent((event.target?.result as string) || '');
      };
      reader.readAsText(selected);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setFileContent((event.target?.result as string) || '');
      };
      reader.readAsText(selected);
    }
  };

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

  const handleProceedToStep2 = () => {
    if (!title.trim()) {
      setError('Please provide a document title before configuring department clearance.');
      return;
    }
    setError('');
    setStep(2);
  };

  const isAccessBlocked = isRestrictedDoc || targetDepartment === 'none' || targetSublevel === 'no_access';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a document title.');
      return;
    }

    // If organization scope and currently on step 1, advance to step 2 first
    if (scope === 'organization' && step === 1) {
      handleProceedToStep2();
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const filename = file?.name || `${title.toLowerCase().replace(/\s+/g, '-')}.md`;
      const allowedDepts = (targetDepartment === 'none' || isRestrictedDoc) ? [] : [targetDepartment];
      const allowedSubs = (targetSubfield === 'none' || isRestrictedDoc) ? [] : (targetSubfield ? [targetSubfield] : []);
      const allowedDoms = isRestrictedDoc ? [] : (targetDomain === 'all' ? [] : [targetDomain]);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          filename,
          content: fileContent || `Content for ${title}. Ingested into AUREN knowledge platform.`,
          scope,
          accessPolicy: {
            allowedDepartments: allowedDepts,
            allowedSubfields: allowedSubs,
            minSubgroupLevel: isRestrictedDoc ? 'no_access' : targetSublevel,
            allowedDomains: allowedDoms,
            allowedSpecificMembers: isRestrictedDoc ? [] : selectedSpecificMembers,
            isRestricted: isRestrictedDoc || scope === 'personal',
          },
        }),
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      onUploadSuccess();
      onClose();
      setFile(null);
      setTitle('');
      setFileContent('');
      setSelectedSpecificMembers([]);
      setStep(1);
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        step === 1
          ? 'Upload Knowledge Document'
          : 'Department Clearance & Sublevel Gateway'
      }
      description={
        step === 1
          ? "Ingest specifications, architecture blueprints, or research into AUREN's intelligence pipeline."
          : 'Define department clearance, subcategory filters, seniority gates, and cross-department member access.'
      }
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[82vh] overflow-y-auto pr-1">
        {/* Step Indicator (when in organization scope) */}
        {scope === 'organization' && (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-neutral-100/80 dark:bg-[#15161A] border border-neutral-200/60 dark:border-neutral-800/80 text-xs">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
                step === 1
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
              }`}
            >
              <span className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${step === 1 ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'}`}>
                1
              </span>
              <span>Document & File</span>
            </button>

            <button
              type="button"
              onClick={handleProceedToStep2}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
                step === 2
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
              }`}
            >
              <span className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${step === 2 ? 'bg-purple-600 text-white' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'}`}>
                2
              </span>
              <span>Department Clearance & Access</span>
            </button>
          </div>
        )}

        {/* ===================== STEP 1: FILE & METADATA ===================== */}
        {step === 1 && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            {/* Scope Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Target Knowledge Scope
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
                    Encrypted in your private namespace. Hidden from cross-organization queries.
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
                    Governed by department clearance, subcategory filters, and individual permissions.
                  </span>
                </button>
              </div>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl p-5 text-center flex flex-col items-center justify-center gap-2 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors cursor-pointer bg-neutral-50/50 dark:bg-[#111215]/50"
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept=".md,.txt,.pdf,.ts,.js,.json,.csv"
                className="hidden"
              />
              <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500">
                <Upload className="w-4 h-4" />
              </div>
              {file ? (
                <div className="flex flex-col items-center">
                  <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                    {file.name}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono mt-0.5">
                    {(file.size / 1024).toFixed(1)} KB • Text buffer ready
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                    Click to browse or drag file here
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    Supports PDF, Markdown, TypeScript, Architecture Specs (up to 25MB)
                  </span>
                </div>
              )}
            </div>

            {/* Document Title */}
            <div className="flex flex-col gap-1">
              <Input
                label="Document Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Distributed Consensus Specification v2"
                required
              />
            </div>

            {/* In Organization Space: Next Button after document title */}
            {scope === 'organization' && (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-purple-50/80 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center text-purple-700 dark:text-purple-300 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      Department Clearance & Sublevels Required
                    </span>
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Proceed to configure target department, subfield, sublevels, and individual member exceptions.
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleProceedToStep2}
                  className="shrink-0 cursor-pointer"
                >
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ===================== STEP 2: CLEARANCE & MEMBER EXCEPTIONS ===================== */}
        {step === 2 && scope === 'organization' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            {/* Document Info Pill */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-100 dark:bg-[#16171B] border border-neutral-200/70 dark:border-neutral-800 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span className="font-semibold text-neutral-900 dark:text-white truncate">
                  {title || 'Untitled Document'}
                </span>
                {file && (
                  <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                    ({file.name})
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-medium cursor-pointer shrink-0 ml-2"
              >
                Edit Title / File
              </button>
            </div>

            {/* Department Subcategories & Sublevel Clearance Box */}
            <div className={`p-4 rounded-xl border flex flex-col gap-4 transition-colors ${
              isAccessBlocked
                ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/60'
                : 'bg-neutral-50 dark:bg-[#15161A] border-neutral-200/80 dark:border-neutral-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-900 dark:text-white">
                  <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Department Clearance & Sublevel Gateway</span>
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

              {/* Visual alert if No Access is active */}
              {isAccessBlocked && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-red-100/80 dark:bg-red-950/60 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-900 text-xs font-medium animate-fadeIn">
                  <X className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 stroke-[2.5]" />
                  <span>
                    <strong>✕ No Access Active:</strong> Access is restricted for this document. Department or seniority level has been set to block access.
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
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <div>
            {step === 2 && scope === 'organization' && (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setStep(1)}
                className="cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                <span>Back</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>

            {scope === 'organization' && step === 1 ? (
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={handleProceedToStep2}
                disabled={!title.trim()}
              >
                <span>Next: Clearance Settings</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={isUploading}
                disabled={!title.trim()}
              >
                {scope === 'personal'
                  ? 'Start Ingestion into Personal Vault'
                  : 'Start Ingestion & Enforce Clearance'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};
