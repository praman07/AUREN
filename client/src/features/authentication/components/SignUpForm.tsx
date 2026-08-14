import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthSplitLayout } from './layout/AuthSplitLayout';
import { Building2, ShieldCheck, UserPlus, ArrowRight } from 'lucide-react';

export const SignUpForm: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AuthSplitLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">Enterprise Workspace Access</h1>
        <p className="text-sm text-muted-foreground">AUREN enforces zero-trust organization membership.</p>
      </div>

      <div className="space-y-4">
        {/* Option 1: Onboard New Organization */}
        <div className="p-4 border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-semibold text-sm">
            <Building2 size={16} />
            <span>New Organization Setup</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Initialize a new enterprise tenant workspace, select your industry template, and configure the initial Super Admin account.
          </p>
          <button
            onClick={() => navigate('/onboarding')}
            className="w-full h-9 mt-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <span>Initialize Organization Workspace</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Option 2: Invited Team Member */}
        <div className="p-4 border border-border bg-slate-50/50 dark:bg-slate-900/50 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <UserPlus size={16} className="text-emerald-500" />
            <span>Invited Team Member</span>
          </div>
          <p className="text-xs text-muted-foreground">
            User accounts are provisioned exclusively by your Organization Super Admin. Please use the credentials provided in your invitation email.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full h-9 mt-2 border border-border bg-background hover:bg-muted text-foreground rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2"
          >
            <span>Sign In to Existing Account</span>
          </button>
        </div>
      </div>

      <div className="mt-8 text-center border-t border-border pt-4">
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck size={14} className="text-blue-500" />
          <span>Multi-Tenant Zero-Trust Architecture</span>
        </div>
      </div>
    </AuthSplitLayout>
  );
};
