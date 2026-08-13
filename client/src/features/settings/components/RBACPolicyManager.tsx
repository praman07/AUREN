import React, { useState } from 'react';
import { Shield, Users, Lock, ChevronDown, Check } from 'lucide-react';

interface PolicyRule {
  id: string;
  target: string;
  type: 'ALLOW' | 'DENY';
  roles: string[];
  description: string;
}

const initialPolicies: PolicyRule[] = [
  {
    id: 'rule-1',
    target: 'GitHub (Private)',
    type: 'ALLOW',
    roles: ['Engineering', 'CTO'],
    description: 'Allow engineering team access to private repositories'
  },
  {
    id: 'rule-2',
    target: 'Notion (HR)',
    type: 'DENY',
    roles: ['Contractor'],
    description: 'Deny contractors access to HR workspaces'
  }
];

export const RBACPolicyManager: React.FC = () => {
  const [policies, setPolicies] = useState<PolicyRule[]>(initialPolicies);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-foreground">RBAC Policy Manager</h3>
          <p className="text-sm text-muted-foreground">
            Configure Role-Based Access Control override policies for the Universal Knowledge Core.
          </p>
        </div>
        <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium">
          New Policy
        </button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Target Resource</th>
              <th className="px-4 py-3 font-medium">Rule Type</th>
              <th className="px-4 py-3 font-medium">Assigned Roles</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {policies.map(policy => (
              <tr key={policy.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    <DatabaseIcon className="w-4 h-4 text-muted-foreground" />
                    {policy.target}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    policy.type === 'ALLOW' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {policy.type === 'ALLOW' ? <Check className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    {policy.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {policy.roles.map(role => (
                      <span key={role} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-secondary text-secondary-foreground border border-border">
                        <Shield className="w-3 h-3 mr-1" />
                        {role}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {policy.description}
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-primary hover:underline text-xs font-medium">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {policies.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No RBAC policies defined. Default permissions will apply.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-muted border border-border rounded-lg text-sm text-muted-foreground">
        <div className="flex gap-2 items-start">
          <Users className="w-5 h-5 text-foreground shrink-0 mt-0.5" />
          <div>
            <strong className="text-foreground block mb-1">How permissions are calculated:</strong>
            <p className="mb-2">AUREN uses a Zero-Trust evaluation matrix when users query the RAG pipeline:</p>
            <ol className="list-decimal pl-4 space-y-1 text-xs">
              <li>Check explicit <span className="text-red-500 font-medium">DENY</span> policies matching the user or their roles.</li>
              <li>Check explicit <span className="text-green-500 font-medium">ALLOW</span> policies matching the user or their roles.</li>
              <li>Fallback to origin connector permissions (e.g. GitHub repo visibility).</li>
              <li>Enforce Organization and Department boundaries.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for icon
function DatabaseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
}
