import React from 'react';
import { useUserStore } from '../../store/useUserStore';
import { AlertTriangle } from 'lucide-react';

export const DeactivateUserAlert: React.FC = () => {
  const { isDeactivateAlertOpen, setDeactivateAlertOpen, selectedUserId, users, deactivateUser } = useUserStore();
  
  if (!isDeactivateAlertOpen || !selectedUserId) return null;

  const user = users.find(u => u.id === selectedUserId);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleDeactivate = async () => {
    setIsSubmitting(true);
    await deactivateUser(selectedUserId);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-200" onClick={() => setDeactivateAlertOpen(false)} />
      
      <div className="relative bg-white rounded-lg shadow-xl border border-border w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 flex gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Suspend Access</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Are you sure you want to suspend access for <strong>{user?.email}</strong>? They will be immediately logged out of all active sessions.
            </p>
          </div>
        </div>
        
        <div className="p-3 border-t border-border bg-slate-50 flex items-center justify-end gap-2">
          <button 
            onClick={() => setDeactivateAlertOpen(false)}
            disabled={isSubmitting}
            className="h-8 px-4 text-xs font-medium text-foreground bg-white border border-border rounded-md hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleDeactivate}
            disabled={isSubmitting}
            className="h-8 px-4 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Suspending...' : 'Suspend User'}
          </button>
        </div>
      </div>
    </div>
  );
};
