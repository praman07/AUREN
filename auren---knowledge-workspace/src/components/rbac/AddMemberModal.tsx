import React, { useState } from 'react';
import { X, UserPlus, Shield, Check, Building, Layers, Sparkles } from 'lucide-react';
import { DepartmentMember, DepartmentSubgroup } from '../../types';
import { Button } from '../ui/Button';
import { INTERN_DOMAINS, getStoredSubfields } from '../../services/rbacData';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMember: (member: Omit<DepartmentMember, 'id' | 'joinedAt'>) => void;
  departments: string[];
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onAddMember,
  departments,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  // Multi-department support
  const [selectedDepts, setSelectedDepts] = useState<string[]>([departments[0] || 'Core Architecture']);
  const [subgroup, setSubgroup] = useState<DepartmentSubgroup>('junior');
  // Specific domain for interns / trainees
  const [domain, setDomain] = useState<string>(INTERN_DOMAINS[0]);
  const [customDomain, setCustomDomain] = useState('');
  // Assigned subfields
  const availableSubfields = getStoredSubfields();
  const [selectedSubfields, setSelectedSubfields] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [clearanceLevel, setClearanceLevel] = useState<DepartmentMember['clearanceLevel']>('L3_Junior');

  if (!isOpen) return null;

  const handleToggleDept = (dept: string) => {
    setSelectedDepts((prev) => {
      if (prev.includes(dept)) {
        if (prev.length === 1) return prev; // At least one department
        return prev.filter((d) => d !== dept);
      }
      return [...prev, dept];
    });
  };

  const handleToggleSubfield = (sub: string) => {
    setSelectedSubfields((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || selectedDepts.length === 0) return;

    let clearance = clearanceLevel;
    if (subgroup === 'senior') clearance = 'L5_Principal';
    else if (subgroup === 'mid_senior') clearance = 'L4_Senior';
    else if (subgroup === 'junior') clearance = 'L3_Junior';
    else if (subgroup === 'intern') clearance = 'L2_Intern';
    else if (subgroup === 'trainee') clearance = 'L1_Trainee';

    const activeDomain = customDomain.trim() || domain;

    onAddMember({
      name: name.trim(),
      email: email.trim(),
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      department: selectedDepts[0],
      departments: selectedDepts,
      subgroup,
      domain: (subgroup === 'intern' || subgroup === 'trainee') ? activeDomain : undefined,
      subfields: selectedSubfields,
      title: title.trim() || `${subgroup.replace('_', ' ').toUpperCase()} Engineer`,
      status: 'active',
      clearanceLevel: clearance,
      assignedProjects: ['auren-core', 'knowledge-pipeline'],
    });

    // Reset
    setName('');
    setEmail('');
    setTitle('');
    setSelectedDepts([departments[0] || 'Core Architecture']);
    setSelectedSubfields([]);
    setCustomDomain('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                Add Member to Organization
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Support multi-department assignment, intern domain gating, and subfield tags.
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
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-xs overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Sarah Chen"
                className="px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#1A1B1F] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Company Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., sarah.chen@corp.internal"
                className="px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#1A1B1F] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
            </div>
          </div>

          {/* Multi-Department Assignment (Requirement 4) */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-neutral-50 dark:bg-[#16171B] border border-neutral-200/80 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-neutral-400" />
                <span>Assigned Departments (Multi-Department Supported)</span>
              </label>
              <span className="text-[10px] text-neutral-400">
                Member can belong to two or more departments
              </span>
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
                Subgroup Tier
              </label>
              <select
                value={subgroup}
                onChange={(e) => setSubgroup(e.target.value as DepartmentSubgroup)}
                className="px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#1A1B1F] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="senior">Senior Staff / Principal</option>
                <option value="mid_senior">Mid / Senior Engineer</option>
                <option value="junior">Junior Engineer</option>
                <option value="intern">Intern</option>
                <option value="trainee">Trainee</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Role Title (Optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Systems Architect"
                className="px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#1A1B1F] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
            </div>
          </div>

          {/* Intern Domain Specialization (Requirement 2) */}
          {(subgroup === 'intern' || subgroup === 'trainee') && (
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Intern / Trainee Specific Domain</span>
                </label>
                <span className="text-[10px] text-amber-700/80 dark:text-amber-400">
                  Used in clearance matrix filters
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                <select
                  value={domain}
                  onChange={(e) => {
                    setDomain(e.target.value);
                    setCustomDomain('');
                  }}
                  className="px-3 py-2 rounded-lg bg-white dark:bg-[#1A1B1F] border border-amber-300/80 dark:border-amber-800 text-neutral-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  {INTERN_DOMAINS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="Or enter custom domain..."
                  className="px-3 py-2 rounded-lg bg-white dark:bg-[#1A1B1F] border border-amber-300/80 dark:border-amber-800 text-neutral-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Subfield Tags (Requirement 3) */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-neutral-50 dark:bg-[#16171B] border border-neutral-200/80 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-neutral-400" />
                <span>Specialization Subfields</span>
              </label>
              <span className="text-[10px] text-neutral-400">Tag member with active subfields</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {availableSubfields.map((sub) => {
                const isSelected = selectedSubfields.includes(sub);
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => handleToggleSubfield(sub)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                        : 'bg-white dark:bg-[#1A1B1F] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <Button variant="ghost" size="sm" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Add Member
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
