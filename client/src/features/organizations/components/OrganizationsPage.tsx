import React from 'react';
import { OrganizationsToolbar } from './data-table/Toolbar';
import { OrganizationsTable } from './data-table/OrganizationsTable';
import { OrganizationDetailsDrawer } from './details/OrganizationDetailsDrawer';
import { ArchiveOrgAlert } from './forms/ArchiveOrgAlert';

export const OrganizationsPage: React.FC = () => {
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-1">Organizations</h1>
        <p className="text-sm text-muted-foreground">Manage multi-tenant isolation, billing, and storage quotas.</p>
      </div>

      <OrganizationsToolbar />
      <OrganizationsTable />

      {/* Global Modals for this module */}
      <OrganizationDetailsDrawer />
      <ArchiveOrgAlert />
    </div>
  );
};
