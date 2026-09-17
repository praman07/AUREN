import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, AlertCircle, Building, Check, Sparkles } from 'lucide-react';
import type { DepartmentMember, DepartmentSubgroup } from '../../types';
import { Button } from '../ui/button';

import { INTERN_DOMAINS } from '../../services/rbacData';

interface ShiftMemberModalProps {
  member: DepartmentMember | null;
  isOpen: boolean;
  onClose: () => void;
  onShiftMember: (
    memberId: string,
    targetDepartment: string,
    targetSubgroup: DepartmentSubgroup,
    reason: string,
    targetDepartments?: string[],
    targetDomain?: string
  ) => void;
  departments: string[];
}

export const ShiftMemberModal: React.FC<ShiftMemberModalProps> = ({
  member,
  isOpen,
  onClose,
  onShiftMember,
  departments,
}) => {
  if (!isOpen || !member) return null;

  const [selectedDepts, setSelectedDepts] = useState<string[]>(
    member.departments && member.departments.length > 0 ? member.departments : [member.department]
  );
  const [targetSubgroup, setTargetSubgroup] = useState<DepartmentSubgroup>(member.subgroup);
  const [domain, setDomain] = useState<string>(member.domain || INTERN_DOMAINS[0]);
  const [reason, setReason] = useState('Reorganization & Cross-Team Clearance');

  useEffect(() => {
    if (member) {
      setSelectedDepts(
        member.departments && member.departments.length > 0 ? member.departments : [member.department]
      );
      setTargetSubgroup(member.subgroup);
      setDomain(member.domain || INTERN_DOMAINS[0]);
    }
  }, [member]);

  const handleToggleDept = (dept: string) => {
    setSelectedDepts((prev) => {
      if (prev.includes(dept)) {
        if (prev.length === 1) return prev;
        return prev.filter((d) => d !== dept);
      }
      return [...prev, dept];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onShiftMember(
      member.id,
      selectedDepts[0],
      targetSubgroup,
      reason,
      selectedDepts,
      targetSubgroup === 'intern' || targetSubgroup === 'trainee' ? domain : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                Shift / Reassign Member
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Department Head transfer action for {member.name}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-xs">
          {/* Current Status Overview */}
          <div className="p-3.5 bg-neutral-50 dark:bg-[#18191D] rounded-xl border border-neutral-200/60 dark:border-neutral-800 flex items-center gap-3">
            <img
              src={member.avatarUrl}
              alt={member.name}
              className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-neutral-900 dark:text-white text-xs">
                {member.name}
              </span>
              <span className="text-[11px] text-neutral-400">
                Current: <span className="font-medium text-neutral-700 dark:text-neutral-300">{(member.departments || [member.department]).join(', ')}</span> •{' '}
                <span className="capitalize font-mono">{member.subgroup.replace('_', ' ')}</span>
              </span>
            </div>
          </div>

          {/* Multi-Department Selection */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-neutral-50 dark:bg-[#16171B] border border-neutral-200/80 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-neutral-400" />
                <span>Assigned Departments (Multi-Department)</span>
              </label>
              <span className="text-[10px] text-neutral-400">Toggle departments</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              {departments.map((dept) => {
                const isSelected = selectedDepts.includes(dept);
                return (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => handleToggleDept(dept)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-2xs'
                        : 'bg-white dark:bg-[#1A1B1F] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{dept}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subgroup Tier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Target Subgroup Tier
              </label>
              <select
                value={targetSubgroup}
                onChange={(e) => setTargetSubgroup(e.target.value as DepartmentSubgroup)}
                className="px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#1A1B1F] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="senior">Senior Staff / Principal</option>
                <option value="mid_senior">Mid / Senior Engineer</option>
                <option value="junior">Junior Engineer</option>
                <option value="intern">Intern</option>
                <option value="trainee">Trainee</option>
              </select>
            </div>

            {/* Intern Domain */}
            {(targetSubgroup === 'intern' || targetSubgroup === 'trainee') && (
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Domain Specialization</span>
                </label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#1A1B1F] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  {INTERN_DOMAINS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-neutral-700 dark:text-neutral-300">
              Shift Justification / Reason
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Promotion following architectural review"
              className="px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#1A1B1F] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400"
            />
          </div>

          {/* Impact feedback */}
          <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
            <span>
              Shifting will immediately recalculate real-time document permissions in AUREN.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <Button variant="ghost" size="sm" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Confirm Shift
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
