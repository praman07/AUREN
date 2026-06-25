import React, { useState } from 'react';
import { useUserStore } from '../../store/useUserStore';
import { Mail, X } from 'lucide-react';

export const InviteUserDialog: React.FC = () => {
  const { isInviteModalOpen, setInviteModalOpen, inviteUser } = useUserStore();
  
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('USER');
  const [department, setDepartment] = useState('Engineering');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isInviteModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    await inviteUser(email, role, department);
    setIsSubmitting(false);
    setEmail('');
    setRole('USER');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-200" onClick={() => setInviteModalOpen(false)} />
      
      <div className="relative bg-white rounded-lg shadow-xl border border-border w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail size={14} className="text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Invite New User</h3>
          </div>
          <button 
            onClick={() => setInviteModalOpen(false)}
            className="p-1 text-muted-foreground hover:bg-slate-100 rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full h-8 px-3 text-xs border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Role</label>
            <select 
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full h-8 px-3 text-xs border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-white"
            >
              <option value="USER">User</option>
              <option value="DEPT_MANAGER">Department Manager</option>
              <option value="ORG_ADMIN">Organization Admin</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Department</label>
            <select 
              value={department}
              onChange={e => setDepartment(e.target.value)}
              className="w-full h-8 px-3 text-xs border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-white"
            >
              <option value="Engineering">Engineering</option>
              <option value="Legal">Legal</option>
              <option value="HR">HR</option>
              <option value="Operations">Operations</option>
              <option value="Security">Security</option>
            </select>
          </div>
          
          <div className="pt-2 flex justify-end gap-2">
            <button 
              type="button"
              onClick={() => setInviteModalOpen(false)}
              className="h-8 px-4 text-xs font-medium text-foreground bg-white border border-border rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting || !email}
              className="h-8 px-4 text-xs font-medium text-white bg-primary rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
