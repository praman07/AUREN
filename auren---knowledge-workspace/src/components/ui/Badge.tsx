import React from 'react';
import { ProcessingState, Scope, DocumentType } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'neutral' | 'scope' | 'status' | 'type' | 'outline';
  scope?: Scope;
  status?: ProcessingState;
  docType?: DocumentType;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  scope,
  status,
  docType,
  size = 'sm',
  className = '',
}) => {
  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 leading-none font-medium rounded',
    sm: 'text-xs px-2 py-0.5 leading-normal font-medium rounded-md',
    md: 'text-xs px-2.5 py-1 leading-normal font-medium rounded-md',
  };

  // 1. Scope Badge
  if (scope || variant === 'scope') {
    const s = scope || 'personal';
    if (s === 'personal') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 whitespace-nowrap bg-neutral-100 text-neutral-700 dark:bg-[#1C1D21] dark:text-neutral-300 border border-neutral-200/80 dark:border-neutral-800 ${sizeClasses[size]} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80 dark:bg-amber-400" />
          <span>Personal</span>
        </span>
      );
    }
    if (s === 'organization') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 whitespace-nowrap bg-neutral-100 text-neutral-700 dark:bg-[#1C1D21] dark:text-neutral-300 border border-neutral-200/80 dark:border-neutral-800 ${sizeClasses[size]} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 dark:bg-emerald-400" />
          <span>Organization</span>
        </span>
      );
    }
  }

  // 2. Status Badge
  if (status || variant === 'status') {
    const st = status || 'ready';
    const statusConfig: Record<
      ProcessingState,
      { label: string; dot: string; bg: string; text: string; animate?: boolean }
    > = {
      ready: {
        label: 'Ready',
        dot: 'bg-emerald-500',
        bg: 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40',
        text: 'text-emerald-700 dark:text-emerald-400',
      },
      uploading: {
        label: 'Uploading',
        dot: 'bg-amber-500 animate-pulse',
        bg: 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40',
        text: 'text-amber-700 dark:text-amber-400',
        animate: true,
      },
      processing: {
        label: 'Processing',
        dot: 'bg-blue-500 animate-pulse',
        bg: 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-900/40',
        text: 'text-blue-700 dark:text-blue-400',
        animate: true,
      },
      extracting: {
        label: 'Extracting',
        dot: 'bg-blue-500 animate-pulse',
        bg: 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-900/40',
        text: 'text-blue-700 dark:text-blue-400',
        animate: true,
      },
      building_knowledge: {
        label: 'Indexing Knowledge',
        dot: 'bg-purple-500 animate-pulse',
        bg: 'bg-purple-50/60 dark:bg-purple-950/20 border-purple-200/60 dark:border-purple-900/40',
        text: 'text-purple-700 dark:text-purple-400',
        animate: true,
      },
      generating_overview: {
        label: 'Synthesizing',
        dot: 'bg-indigo-500 animate-pulse',
        bg: 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-200/60 dark:border-indigo-900/40',
        text: 'text-indigo-700 dark:text-indigo-400',
        animate: true,
      },
      failed: {
        label: 'Failed',
        dot: 'bg-red-500',
        bg: 'bg-red-50/60 dark:bg-red-950/20 border-red-200/60 dark:border-red-900/40',
        text: 'text-red-700 dark:text-red-400',
      },
    };

    const cfg = statusConfig[st] || statusConfig.ready;
    return (
      <span
        className={`inline-flex items-center gap-1.5 whitespace-nowrap border ${cfg.bg} ${cfg.text} ${sizeClasses[size]} ${className}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
        <span>{cfg.label}</span>
      </span>
    );
  }

  // 3. Document Type Badge
  if (docType || variant === 'type') {
    const t = docType || 'markdown';
    return (
      <span
        className={`inline-flex items-center font-mono uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 dark:bg-neutral-800/80 dark:text-neutral-400 border border-neutral-200/50 dark:border-neutral-700/50 ${className}`}
      >
        {t}
      </span>
    );
  }

  // 4. Default Neutral Badge
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap bg-neutral-100 text-neutral-700 dark:bg-[#1E2024] dark:text-neutral-300 border border-neutral-200/70 dark:border-neutral-800 ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
};
