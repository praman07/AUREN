import React from 'react';
import { AIUsageStats } from '../../mock/dashboard.mock';
import { Activity } from 'lucide-react';

export const AIUsageWidget: React.FC<{ stats: AIUsageStats }> = ({ stats }) => {
  const maxReq = Math.max(...stats.hourlyRequests);

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm flex flex-col h-full overflow-hidden p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">AI Usage Today</h2>
        <Activity size={14} className="text-muted-foreground" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Requests</p>
          <p className="text-2xl font-semibold text-foreground mt-1">{stats.requestsToday.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Tokens Generated</p>
          <p className="text-2xl font-semibold text-foreground mt-1">{stats.tokensUsed}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Avg Latency</p>
          <p className="text-base font-semibold text-foreground mt-1">{stats.avgResponseTimeMs} ms</p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Success Rate</p>
          <p className="text-base font-semibold text-green-600 mt-1">{stats.successRate}%</p>
        </div>
      </div>

      <div className="mt-auto">
        <p className="text-xs text-muted-foreground mb-2">Requests per hour (Last 24h)</p>
        <div className="flex items-end h-16 gap-[2px]" aria-label="Hourly request chart">
          <span className="sr-only">Chart showing hourly requests peaking at {maxReq}</span>
          {stats.hourlyRequests.map((val, idx) => (
            <div 
              key={idx} 
              className="flex-1 bg-primary/20 rounded-t-sm hover:bg-primary transition-colors group relative"
              style={{ height: `${Math.max((val / maxReq) * 100, 5)}%` }}
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {val} req
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
