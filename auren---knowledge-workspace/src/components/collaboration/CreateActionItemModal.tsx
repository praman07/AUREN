import React, { useState, useEffect } from 'react';
import { X, ListTodo, User, Flag } from 'lucide-react';
import { useCollaboration } from '../../context/CollaborationContext';
import { DEFAULT_DEPARTMENTS } from '../../services/rbacData';
import { Button } from '../ui/Button';

interface CreateActionItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTitle?: string;
  initialAssignedTo?: string;
  initialDepartment?: string;
  initialDueDate?: string;
  initialPriority?: 'High' | 'Medium' | 'Low';
  initialMeetingId?: string;
  initialMeetingTitle?: string;
}

export const CreateActionItemModal: React.FC<CreateActionItemModalProps> = ({
  isOpen,
  onClose,
  initialTitle = '',
  initialAssignedTo = 'Marcus Vance',
  initialDepartment = 'Platform Engineering',
  initialDueDate = 'Friday, 5:00 PM',
  initialPriority = 'Medium',
  initialMeetingId,
  initialMeetingTitle,
}) => {
  const { createActionItem } = useCollaboration();

  const [title, setTitle] = useState(initialTitle);
  const [assignedTo, setAssignedTo] = useState(initialAssignedTo);
  const [department, setDepartment] = useState(initialDepartment);
  const [dueDate, setDueDate] = useState(initialDueDate);
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>(initialPriority);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setAssignedTo(initialAssignedTo);
      setDepartment(initialDepartment);
      setDueDate(initialDueDate);
      setPriority(initialPriority);
    }
  }, [isOpen, initialTitle, initialAssignedTo, initialDepartment, initialDueDate, initialPriority]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createActionItem({
      title,
      assignedTo,
      assignedToDepartment: department,
      dueDate,
      priority,
      meetingId: initialMeetingId,
      meetingTitle: initialMeetingTitle,
    });

    onClose();
  };

  const personnel = [
    { name: 'Marcus Vance', dept: 'Platform Engineering' },
    { name: 'Elena Vance', dept: 'Executive Security & Governance' },
    { name: 'Praman Singh Bhogal', dept: 'Core Architecture' },
    { name: 'Chloe Zhang', dept: 'Platform Engineering' },
    { name: 'Aarav Patel', dept: 'Security & Compliance' },
    { name: 'Maya Lin', dept: 'Product & Design' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#15171C] border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ListTodo className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Create Action Item
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
              Task Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Deploy session cache patch to staging"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-neutral-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Assignee
              </label>
              <select
                value={assignedTo}
                onChange={(e) => {
                  const person = personnel.find((p) => p.name === e.target.value);
                  setAssignedTo(e.target.value);
                  if (person) setDepartment(person.dept);
                }}
                className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white outline-none"
              >
                {personnel.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Due Date / Target
              </label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="e.g. Tomorrow 3:00 PM"
                className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              Priority
            </label>
            <div className="flex gap-2">
              {(['High', 'Medium', 'Low'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors ${
                    priority === p
                      ? p === 'High'
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold'
                        : p === 'Medium'
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-semibold'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<ListTodo className="w-3.5 h-3.5" />}
            >
              Create Action Item
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
