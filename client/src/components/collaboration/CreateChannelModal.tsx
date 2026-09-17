import React, { useState } from 'react';
import { X, Hash, Plus, Lock } from 'lucide-react';
import { useCollaboration } from '../../context/CollaborationContext';
import { DEFAULT_DEPARTMENTS } from '../../services/rbacData';
import { Button } from '../ui/button';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDepartment?: string;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
  isOpen,
  onClose,
  defaultDepartment,
}) => {
  const { createChannel } = useCollaboration();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'organization' | 'department'>('department');
  const [department, setDepartment] = useState(defaultDepartment || DEFAULT_DEPARTMENTS[0]);
  const [isRestricted, setIsRestricted] = useState(false);
  const [minClearance, setMinClearance] = useState<'junior' | 'senior' | 'lead'>('senior');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createChannel({
      name,
      description,
      category,
      department: category === 'department' ? department : undefined,
      type: isRestricted ? 'restricted' : category === 'department' ? 'department' : 'general',
      minClearance: isRestricted ? (minClearance as any) : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#15171C] border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
              <Hash className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Create New Channel
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              Channel Name
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-neutral-400 text-xs">#</span>
              <input
                type="text"
                required
                placeholder="e.g. streaming-pipeline"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                className="w-full pl-7 pr-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-neutral-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              Description
            </label>
            <input
              type="text"
              placeholder="What is this channel focused on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Channel Scope
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white outline-none"
              >
                <option value="department">Department</option>
                <option value="organization">Organization-wide</option>
              </select>
            </div>

            {category === 'department' && (
              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white outline-none"
                >
                  {DEFAULT_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Clearance Restriction Toggle */}
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="isRestricted" className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <Lock className="w-3.5 h-3.5 text-neutral-500" />
                <span>Enforce RBAC Clearance Gate</span>
              </label>
              <input
                type="checkbox"
                id="isRestricted"
                checked={isRestricted}
                onChange={(e) => setIsRestricted(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
              />
            </div>

            {isRestricted && (
              <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800">
                <label className="text-[11px] font-medium text-neutral-500 block mb-1">
                  Minimum Required Clearance
                </label>
                <select
                  value={minClearance}
                  onChange={(e) => setMinClearance(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs outline-none font-mono"
                >
                  <option value="senior">Senior (L4+)</option>
                  <option value="lead">Lead / Principal (L5+)</option>
                  <option value="junior">Junior (L3+)</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Create Channel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
