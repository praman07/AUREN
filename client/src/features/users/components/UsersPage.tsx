import React from 'react';
import { UsersToolbar } from './data-table/Toolbar';
import { UsersTable } from './data-table/UsersTable';
import { UserDetailsDrawer } from './details/UserDetailsDrawer';
import { InviteUserDialog } from './forms/InviteUserDialog';
import { DeactivateUserAlert } from './forms/DeactivateUserAlert';

export const UsersPage: React.FC = () => {
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-1">Users & Roles</h1>
        <p className="text-sm text-muted-foreground">Manage organizational access, roles, and security clearances.</p>
      </div>

      <UsersToolbar />
      <UsersTable />

      {/* Global Modals for this module */}
      <UserDetailsDrawer />
      <InviteUserDialog />
      <DeactivateUserAlert />
    </div>
  );
};
