import React, { useState } from 'react';
import { useUserStore } from '../../store/useUserStore';
import { useUsers, useRoles, useReactivateUser, useAssignRole, useRemoveRole, useAssignDepartment } from '../../api/userQueries';
import { X, Shield, Building2, Lock, Plus, Trash2 } from 'lucide-react';

export const UserDetailsDrawer: React.FC = () => {
  const { selectedUserId, setSelectedUserId, setDeactivateAlertOpen } = useUserStore();
  const { data: users = [] } = useUsers();
  const { data: availableRoles = [] } = useRoles();
  const reactivateUserMutation = useReactivateUser();
  const assignRoleMutation = useAssignRole();
  const removeRoleMutation = useRemoveRole();
  const assignDeptMutation = useAssignDepartment();

  const [selectedRoleToAssign, setSelectedRoleToAssign] = useState<string>('');
  const [departmentInput, setDepartmentInput] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const user = users.find(u => u.id === selectedUserId);
  const isOpen = !!user;

  if (!isOpen || !user) return null;

  const handleToggleStatus = async () => {
    if (user.status === 'ACTIVE') {
      setDeactivateAlertOpen(true);
    } else if (user.status === 'SUSPENDED' || user.status === 'LOCKED') {
      try {
        await reactivateUserMutation.mutateAsync(user.id);
      } catch (error) {
        console.error('Failed to reactivate user', error);
      }
    }
  };

  const handleAssignRole = async () => {
    if (!selectedRoleToAssign) return;
    setStatusMsg(null);
    try {
      await assignRoleMutation.mutateAsync({ userId: user.id, roleId: selectedRoleToAssign });
      setSelectedRoleToAssign('');
      setStatusMsg('Role assigned successfully');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      setStatusMsg(err.message || 'Failed to assign role');
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    setStatusMsg(null);
    try {
      await removeRoleMutation.mutateAsync({ userId: user.id, roleId });
      setStatusMsg('Role removed successfully');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      setStatusMsg(err.message || 'Failed to remove role');
    }
  };

  const handleAssignDepartment = async () => {
    if (!departmentInput.trim()) return;
    setStatusMsg(null);
    try {
      await assignDeptMutation.mutateAsync({ userId: user.id, departmentId: departmentInput.trim() });
      setDepartmentInput('');
      setStatusMsg('Department assigned successfully');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      setStatusMsg(err.message || 'Failed to assign department');
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 z-40 animate-in fade-in duration-200"
        onClick={() => setSelectedUserId(null)}
      />
      <div className="fixed top-0 right-0 h-screen w-full max-w-md bg-white border-l border-border z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-primary">
                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                {user.firstName || user.lastName ? `${user.firstName} ${user.lastName}` : 'Pending User'}
              </h2>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={() => setSelectedUserId(null)}
            className="p-1.5 hover:bg-slate-200 rounded-md transition-colors text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {statusMsg && (
            <div className="p-2.5 rounded-md bg-blue-50 border border-blue-200 text-xs text-blue-800 font-medium">
              {statusMsg}
            </div>
          )}

          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Identity Context</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-border rounded-md bg-white">
                <div className="flex items-center gap-3">
                  <Building2 size={14} className="text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Department</span>
                    <span className="text-xs font-medium text-foreground">{user.department}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={departmentInput}
                  onChange={(e) => setDepartmentInput(e.target.value)}
                  placeholder="Department ID / Name"
                  className="flex-1 bg-background border border-input rounded-md px-2.5 py-1 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAssignDepartment}
                  disabled={assignDeptMutation.isPending || !departmentInput.trim()}
                  className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded-md text-xs font-medium hover:bg-secondary/80 disabled:opacity-50"
                >
                  Set Dept
                </button>
              </div>

              <div className="flex flex-col p-3 border border-border rounded-md bg-white gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Assigned Roles</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {user.userRoles && user.userRoles.length > 0 ? (
                    user.userRoles.map((role) => (
                      <span key={role.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                        {role.name}
                        <button type="button" onClick={() => handleRemoveRole(role.id)} className="hover:text-rose-600">
                          <Trash2 size={10} />
                        </button>
                      </span>
                    ))
                  ) : (
                    user.roles.map((r, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {r}
                      </span>
                    ))
                  )}
                </div>

                {availableRoles.length > 0 && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                    <select
                      value={selectedRoleToAssign}
                      onChange={(e) => setSelectedRoleToAssign(e.target.value)}
                      className="flex-1 bg-background border border-input rounded-md px-2 py-1 text-xs"
                    >
                      <option value="">Select role to assign...</option>
                      {availableRoles.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAssignRole}
                      disabled={assignRoleMutation.isPending || !selectedRoleToAssign}
                      className="px-2.5 py-1 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1"
                    >
                      <Plus size={12} /> Assign
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 p-3 border border-border rounded-md bg-white">
                <Lock size={14} className="text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Clearance Level</span>
                  <span className="text-xs font-medium text-foreground">Level {user.clearanceLevel}</span>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Activity</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Account Created</span>
                <span className="font-medium text-foreground">{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Last Active</span>
                <span className="font-medium text-foreground">
                  {user.lastActive ? new Date(user.lastActive).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-slate-50 flex items-center justify-between">
          <button 
            onClick={handleToggleStatus}
            disabled={user.status === 'INVITED'}
            className={`flex items-center gap-2 h-8 px-3 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${
              user.status === 'ACTIVE' 
                ? 'text-red-600 hover:bg-red-50' 
                : 'text-green-600 hover:bg-green-50'
            }`}
          >
            {user.status === 'ACTIVE' ? 'Suspend Access' : 'Restore Access'}
          </button>
        </div>
      </div>
    </>
  );
};
