import React from 'react';
import { useUserStore } from '../../store/useUserStore';
import { useAuthStore } from '../../../../core/auth/store/useAuthStore';
import { UserPlus, Search, Filter } from 'lucide-react';
import { Button } from '../../../../components/ui/button';

export const UsersToolbar: React.FC = () => {
  const { setInviteModalOpen } = useUserStore();
  const isSuperAdmin = useAuthStore((state) => state.user?.isSuperAdmin);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search users by name or email..." 
            className="w-full h-10 pl-9 pr-3 text-xs bg-white border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
          />
        </div>
        <Button variant="outline" size="sm" className="h-10 px-3.5 border-slate-200 text-slate-700 rounded-xl">
          <Filter size={14} className="mr-1.5 text-slate-500" />
          Filters
        </Button>
      </div>
      
      {isSuperAdmin && (
        <Button 
          onClick={() => setInviteModalOpen(true)}
          size="sm"
          className="h-10 px-4 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 shadow-xs"
        >
          <UserPlus size={14} className="mr-1.5" />
          Invite User
        </Button>
      )}
    </div>
  );
};

