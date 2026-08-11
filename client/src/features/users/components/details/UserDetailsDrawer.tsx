import React from 'react';
import { useUserStore } from '../../store/useUserStore';
import { useUsers, useReactivateUser } from '../../api/userQueries';
import { X, Shield, Building2, Lock } from 'lucide-react';

export const UserDetailsDrawer: React.FC = () => {
  const { selectedUserId, setSelectedUserId, setDeactivateAlertOpen } = useUserStore();
  const { data: users = [] } = useUsers();
  const reactivateUserMutation = useReactivateUser();
  
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
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Identity Context</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 border border-border rounded-md bg-white">
                <Building2 size={14} className="text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Organization</span>
                  <span className="text-xs font-medium text-foreground">{user.organization}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border border-border rounded-md bg-white">
                <Shield size={14} className="text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Primary Role</span>
                  <span className="text-xs font-medium text-foreground">{user.roles[0]?.replace('_', ' ')}</span>
                </div>
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
          
          <button className="h-8 px-4 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary-hover transition-colors shadow-sm focus:ring-2 focus:ring-primary focus:outline-none">
            Edit Roles
          </button>
        </div>
      </div>
    </>
  );
};
