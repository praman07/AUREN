import React from 'react';
import { useUserStore } from '../../store/useUserStore';
import { useUsers } from '../../api/userQueries';

export const UsersTable: React.FC = () => {
  const { selectedUserId, setSelectedUserId } = useUserStore();
  const { data: users = [], isLoading, error } = useUsers();

  const getInitials = (first: string, last: string) => {
    if (!first && !last) return '??';
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="border border-border rounded-md bg-white overflow-hidden shadow-sm">
      <table className="w-full text-xs text-left">
        <thead className="bg-slate-50 border-b border-border">
          <tr>
            <th className="px-4 py-3 font-medium text-muted-foreground uppercase tracking-wider">User</th>
            <th className="px-4 py-3 font-medium text-muted-foreground uppercase tracking-wider">Role</th>
            <th className="px-4 py-3 font-medium text-muted-foreground uppercase tracking-wider">Department</th>
            <th className="px-4 py-3 font-medium text-muted-foreground uppercase tracking-wider text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {isLoading ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                Loading users...
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-danger">
                Failed to load users: {error.message}
              </td>
            </tr>
          ) : users.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                No users found.
              </td>
            </tr>
          ) : users.map(user => {
            const isSelected = selectedUserId === user.id;
            
            return (
              <tr 
                key={user.id} 
                onClick={() => setSelectedUserId(user.id)}
                className={`cursor-pointer transition-colors ${isSelected ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-slate-50'}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 border border-border flex items-center justify-center shrink-0 text-[10px] font-semibold text-slate-600">
                      {getInitials(user.firstName, user.lastName)}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {user.firstName || user.lastName ? `${user.firstName} ${user.lastName}` : 'Pending User'}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                    user.roles.includes('SUPER_ADMIN') ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    user.roles.includes('ORG_ADMIN') ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                    'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {user.roles[0]?.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {user.department}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                    user.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' :
                    user.status === 'LOCKED' ? 'bg-red-50 text-red-700 border-red-200' :
                    user.status === 'INVITED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {user.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
