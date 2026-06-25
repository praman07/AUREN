import React, { useState } from 'react';
import { Shield, Key, Users, Lock, Search, Filter, Plus } from 'lucide-react';
import { DepartmentsTable } from './data-table/DepartmentsTable';
import { PermissionMatrixTable } from './data-table/PermissionMatrixTable';
import { DepartmentDetailsDrawer } from './details/DepartmentDetailsDrawer';

type TabType = 'DEPARTMENTS' | 'ROLES' | 'GROUPS' | 'POLICIES';

export const DepartmentsSecurityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('DEPARTMENTS');

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-1">Departments & Security</h1>
        <p className="text-sm text-muted-foreground">Manage organizational units, RBAC permission matrices, and security policies.</p>
      </div>

      <div className="flex items-center gap-6 border-b border-border mb-6">
        <TabButton 
          active={activeTab === 'DEPARTMENTS'} 
          onClick={() => setActiveTab('DEPARTMENTS')}
          icon={<Shield size={14} />} 
          label="Departments" 
        />
        <TabButton 
          active={activeTab === 'ROLES'} 
          onClick={() => setActiveTab('ROLES')}
          icon={<Key size={14} />} 
          label="Roles & Permissions" 
        />
        <TabButton 
          active={activeTab === 'GROUPS'} 
          onClick={() => setActiveTab('GROUPS')}
          icon={<Users size={14} />} 
          label="Groups" 
        />
        <TabButton 
          active={activeTab === 'POLICIES'} 
          onClick={() => setActiveTab('POLICIES')}
          icon={<Lock size={14} />} 
          label="Organization Policy" 
        />
      </div>

      <div className="flex-1">
        {activeTab === 'DEPARTMENTS' && (
          <div className="animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Search departments..." 
                    className="w-full h-8 pl-8 pr-3 text-xs bg-white border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                  />
                </div>
                <button className="h-8 px-3 border border-border bg-white text-foreground rounded-md text-xs font-medium hover:bg-muted transition-colors flex items-center gap-2">
                  <Filter size={14} />
                  Filters
                </button>
              </div>
              <button className="h-8 px-4 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary-hover transition-colors shadow-sm flex items-center gap-2">
                <Plus size={14} />
                New Department
              </button>
            </div>
            <DepartmentsTable />
          </div>
        )}
        
        {activeTab === 'ROLES' && (
          <div className="animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-muted-foreground">Define capabilities for each organizational role globally.</p>
              <button className="h-8 px-4 border border-border bg-white text-foreground rounded-md text-xs font-medium hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
                <Plus size={14} />
                Create Custom Role
              </button>
            </div>
            <PermissionMatrixTable />
          </div>
        )}

        {activeTab === 'GROUPS' && (
          <div className="animate-in fade-in duration-200 flex items-center justify-center h-64 border border-dashed border-border rounded-lg bg-slate-50">
            <div className="text-center">
              <Users size={24} className="mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-medium text-slate-600">Groups Feature Under Construction</p>
              <p className="text-xs text-slate-500 mt-1">Check back in the next release.</p>
            </div>
          </div>
        )}

        {activeTab === 'POLICIES' && (
          <div className="animate-in fade-in duration-200 flex items-center justify-center h-64 border border-dashed border-border rounded-lg bg-slate-50">
            <div className="text-center">
              <Lock size={24} className="mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-medium text-slate-600">Policy Engine Configuration Under Construction</p>
              <p className="text-xs text-slate-500 mt-1">Awaiting OpenFGA implementation.</p>
            </div>
          </div>
        )}
      </div>

      <DepartmentDetailsDrawer />
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 pb-3 px-1 text-xs font-medium border-b-2 transition-colors focus:outline-none ${
      active 
        ? 'border-primary text-primary' 
        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-slate-300'
    }`}
  >
    {icon}
    {label}
  </button>
);
