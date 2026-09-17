import React, { useState } from 'react';
import { X, Users, Shield, Check, Info } from 'lucide-react';
import { Connector, ConnectorPolicy } from '../../types';

interface ManageAccessModalProps {
  connector: Connector | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (connectorId: string, policy: Partial<ConnectorPolicy>) => void;
}

export const ManageAccessModal: React.FC<ManageAccessModalProps> = ({
  connector,
  isOpen,
  onClose,
  onSave,
}) => {
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(['Engineering']);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['Engineering Leads', 'Engineering Members']);
  
  // Permissions toggles: Search, Use in Chat, View Sources, Manage Connection
  const [permissions, setPermissions] = useState({
    search: true,
    useInChat: true,
    viewSources: true,
    manageConnection: false,
  });

  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !connector) return null;

  const togglePermission = (key: keyof typeof permissions) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      if (onSave) {
        onSave(connector.id, {
          allowedDepartments: selectedDepartments,
        });
      }
      setIsSaving(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div
        id="manage-access-modal"
        className="w-full max-w-lg bg-white dark:bg-[#121316] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white tracking-tight">
              Manage connection access
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Control which teams and roles can query knowledge from {connector.name}.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6 max-h-[70vh] overflow-y-auto">
          {/* Who can use this connection */}
          <div>
            <label className="text-xs font-semibold text-neutral-900 dark:text-neutral-200 block mb-2">
              Who can use this connection?
            </label>
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/70 dark:border-neutral-800/80 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-900 dark:text-white">
                  Engineering Department
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-800/40">
                  Authorized
                </span>
              </div>

              <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800 flex flex-col gap-1.5">
                <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                  People:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300">
                    Engineering Leads
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300">
                    Engineering Members
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Permissions Matrix */}
          <div>
            <label className="text-xs font-semibold text-neutral-900 dark:text-neutral-200 block mb-2">
              Permissions
            </label>
            <div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-200/70 dark:border-neutral-800/80 rounded-xl overflow-hidden">
              {/* 1. Search */}
              <div
                onClick={() => togglePermission('search')}
                className="p-3.5 flex items-center justify-between hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer"
              >
                <div>
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white">
                    Search
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Search documents and code across this connection
                  </p>
                </div>
                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                    permissions.search ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white dark:bg-neutral-900 shadow-xs transform transition-transform duration-200 ease-in-out ${
                      permissions.search ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {/* 2. Use in Chat */}
              <div
                onClick={() => togglePermission('useInChat')}
                className="p-3.5 flex items-center justify-between hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer"
              >
                <div>
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white">
                    Use in Chat
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Ground AI answers and citations with this source
                  </p>
                </div>
                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                    permissions.useInChat ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white dark:bg-neutral-900 shadow-xs transform transition-transform duration-200 ease-in-out ${
                      permissions.useInChat ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {/* 3. View Sources */}
              <div
                onClick={() => togglePermission('viewSources')}
                className="p-3.5 flex items-center justify-between hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer"
              >
                <div>
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white">
                    View Sources
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Inspect full document content and commit history
                  </p>
                </div>
                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                    permissions.viewSources ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white dark:bg-neutral-900 shadow-xs transform transition-transform duration-200 ease-in-out ${
                      permissions.viewSources ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {/* 4. Manage Connection */}
              <div
                onClick={() => togglePermission('manageConnection')}
                className="p-3.5 flex items-center justify-between hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer"
              >
                <div>
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white">
                    Manage Connection
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Update credentials, repositories, and sync frequency
                  </p>
                </div>
                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                    permissions.manageConnection ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white dark:bg-neutral-900 shadow-xs transform transition-transform duration-200 ease-in-out ${
                      permissions.manageConnection ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/40 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-black text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-900 transition-colors shadow-xs cursor-pointer"
          >
            {isSaving ? 'Saving...' : 'Save access changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
