import React, { useState, useEffect } from 'react';
import { mockDashboardData, DashboardData } from '../mock/dashboard.mock';
import { DashboardHeader } from './DashboardHeader';
import { KPIGrid } from './widgets/KPIGrid';
import { RecentDocumentsWidget } from './widgets/RecentDocumentsWidget';
import { AIUsageWidget } from './widgets/AIUsageWidget';
import { StorageAnalyticsWidget } from './widgets/StorageAnalyticsWidget';
import { RecentActivityWidget } from './widgets/RecentActivityWidget';
import { NotificationsWidget } from './widgets/NotificationsWidget';
import { UploadDialog } from '../../documents/components/upload/UploadDialog';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);

  // Simulate network latency for BFF fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      setData(mockDashboardData);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  if (!data) {
    return (
      <div className="h-full flex items-center justify-center animate-pulse">
        <span className="text-muted-foreground text-sm">Loading enterprise dashboard...</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full animate-in fade-in duration-300 pb-6 overflow-y-auto pr-2">
        <DashboardHeader />
        
        <KPIGrid metrics={data.kpis} />

        {/* 12-Column Main Grid */}
        <div className="grid grid-cols-12 gap-4 flex-1">
          {/* Main Content Area (8 cols) */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-64 shrink-0">
              <AIUsageWidget stats={data.aiUsage} />
              <StorageAnalyticsWidget storage={data.storage} />
            </div>
            <div className="flex-1 min-h-[300px]">
              <RecentDocumentsWidget docs={data.recentDocuments} />
            </div>
          </div>

          {/* Sidebar Area (4 cols) */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
            <div className="h-64 shrink-0">
              <NotificationsWidget notifications={data.notifications} />
            </div>
            <div className="flex-1 min-h-[300px]">
              <RecentActivityWidget activity={data.recentActivity} />
            </div>
          </div>
        </div>
      </div>

      {/* Global Modals for Quick Actions */}
      <UploadDialog />
    </>
  );
};
