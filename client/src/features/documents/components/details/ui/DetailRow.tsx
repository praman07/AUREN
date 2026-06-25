import React from 'react';

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
}

export const DetailRow: React.FC<DetailRowProps> = ({ label, value }) => {
  return (
    <div className="flex flex-col py-1.5 border-b border-border/50 last:border-0">
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
        {label}
      </span>
      <div className="text-xs text-foreground font-medium">
        {value}
      </div>
    </div>
  );
};

export const SectionHeader: React.FC<{ title: string; icon?: React.ReactNode }> = ({ title, icon }) => (
  <div className="flex items-center gap-2 mb-3 mt-6 first:mt-2 text-sm font-semibold text-foreground border-b border-border pb-1">
    {icon}
    {title}
  </div>
);
