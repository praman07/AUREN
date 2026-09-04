import React from 'react';
import type { AIStatus, Classification, SharingStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant: 'neutral' | 'success' | 'warning' | 'danger' | 'ai' | 'blue';
}

const Badge: React.FC<BadgeProps> = ({ children, variant }) => {
  const variants = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    ai: 'bg-purple-50 text-purple-700 border-purple-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${variants[variant]}`}>
      {children}
    </span>
  );
};

export const AIStatusBadge: React.FC<{ status: AIStatus }> = ({ status }) => {
  const map: Record<AIStatus, BadgeProps['variant']> = {
    Ready: 'success',
    Processing: 'blue',
    Embedding: 'ai',
    Failed: 'danger'
  };
  return <Badge variant={map[status]}>{status}</Badge>;
};

export const ClassificationBadge: React.FC<{ classification: Classification }> = ({ classification }) => {
  const map: Record<Classification, BadgeProps['variant']> = {
    PUBLIC: 'neutral',
    INTERNAL: 'blue',
    CONFIDENTIAL: 'warning',
    SECRET: 'danger'
  };
  return <Badge variant={map[classification]}>{classification}</Badge>;
};

export const SharingBadge: React.FC<{ status: SharingStatus }> = ({ status }) => {
  return <Badge variant={status === 'Shared' ? 'neutral' : 'warning'}>{status}</Badge>;
};

export const ScopeBadge: React.FC<{ scope?: string; visibility?: string }> = ({ scope, visibility }) => {
  const isPersonal = scope === 'PERSONAL' || visibility === 'PRIVATE';
  if (isPersonal) {
    return <Badge variant="warning">Personal</Badge>;
  }
  return <Badge variant="blue">Organization</Badge>;
};

