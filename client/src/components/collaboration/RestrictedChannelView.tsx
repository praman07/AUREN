import React from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import type { CollaborationChannel } from '../../types/collaboration';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';

interface RestrictedChannelViewProps {
  channel: CollaborationChannel;
  onOpenRbacPolicy?: () => void;
}

export const RestrictedChannelView: React.FC<RestrictedChannelViewProps> = ({
  channel,
  onOpenRbacPolicy,
}) => {
  const { user } = useAuth();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none bg-neutral-50/50 dark:bg-[#0E0F12]">
      <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mb-4 shadow-sm">
        <Lock className="w-8 h-8" />
      </div>

      <h2 className="text-base font-bold text-neutral-900 dark:text-white">
        Restricted Knowledge Channel
      </h2>

      <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mt-1.5 leading-relaxed">
        Access to <strong>#{channel.name}</strong> is restricted by organizational governance policy.
        Viewing this technical stream requires verified security clearance.
      </p>

      {/* Clearance Comparison Card */}
      <div className="my-6 p-4 rounded-xl bg-white dark:bg-[#15171C] border border-neutral-200 dark:border-neutral-800 shadow-sm w-full max-w-sm space-y-3 text-left">
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-500">Required Clearance:</span>
          <span className="font-bold font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            {channel.minClearance ? channel.minClearance.toUpperCase() : 'SENIOR+'}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-500">Your Active Role:</span>
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
            {user?.role === 'super_admin' ? 'Super Admin' : user?.title || 'Engineer'}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-500">Department:</span>
          <span className="font-mono text-neutral-700 dark:text-neutral-300">
            {user?.department || 'Platform Engineering'}
          </span>
        </div>
      </div>

      {onOpenRbacPolicy && (
        <Button
          variant="secondary"
          size="md"
          icon={<ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
          onClick={onOpenRbacPolicy}
        >
          View Access Policy in RBAC
        </Button>
      )}
    </div>
  );
};
