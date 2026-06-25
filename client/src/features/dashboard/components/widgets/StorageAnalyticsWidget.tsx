import React from 'react';
import { StorageStats } from '../../mock/dashboard.mock';
import { HardDrive } from 'lucide-react';

export const StorageAnalyticsWidget: React.FC<{ storage: StorageStats }> = ({ storage }) => {
  const percentage = (storage.usedGB / storage.totalGB) * 100;
  
  return (
    <div className="bg-white border border-border rounded-lg shadow-sm p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">Storage Analytics</h2>
        <HardDrive size={14} className="text-muted-foreground" />
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-2xl font-semibold text-foreground">{storage.usedGB.toFixed(1)} <span className="text-base font-medium text-muted-foreground">GB</span></span>
          <span className="text-xs text-muted-foreground">of {storage.totalGB} GB ({percentage.toFixed(1)}%)</span>
        </div>
        
        {/* Unified Progress Bar */}
        <div className="h-2 w-full bg-slate-100 rounded-full flex overflow-hidden">
          <span className="sr-only">{percentage.toFixed(1)}% used</span>
          {storage.departments.map(dept => (
            <div 
              key={dept.name} 
              className={`h-full ${dept.color}`} 
              style={{ width: `${dept.percentage}%` }}
              title={`${dept.name}: ${dept.percentage}%`}
            />
          ))}
        </div>
      </div>

      {/* Breakdown List */}
      <div className="space-y-3 mt-auto">
        {storage.departments.map(dept => (
          <div key={dept.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${dept.color}`} />
              <span className="font-medium text-foreground">{dept.name}</span>
            </div>
            <span className="text-muted-foreground font-mono">{((storage.usedGB * dept.percentage) / 100).toFixed(1)} GB</span>
          </div>
        ))}
      </div>
    </div>
  );
};
