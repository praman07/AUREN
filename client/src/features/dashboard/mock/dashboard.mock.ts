export interface DashboardKPIs {
  totalDocuments: number;
  indexedDocuments: number;
  pendingEmbeddings: number;
  aiConversations: number;
  activeUsers: number;
  storageUsedGB: number;
}

export interface RecentDocument {
  id: string;
  name: string;
  department: string;
  updatedAt: string;
  status: 'Ready' | 'Processing' | 'Failed';
}

export interface ActivityEvent {
  id: string;
  type: 'UPLOAD' | 'CHAT' | 'PERMISSION' | 'INVITE';
  user: string;
  description: string;
  timestamp: string;
}

export interface AIUsageStats {
  requestsToday: number;
  tokensUsed: string; // e.g., "1.2M"
  avgResponseTimeMs: number;
  successRate: number; // percentage
  hourlyRequests: number[]; // 24 data points for a mock chart
}

export interface StorageStats {
  totalGB: number;
  usedGB: number;
  departments: { name: string; percentage: number; color: string }[];
}

export interface Notification {
  id: string;
  type: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
  title: string;
  message: string;
  time: string;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  recentDocuments: RecentDocument[];
  recentActivity: ActivityEvent[];
  aiUsage: AIUsageStats;
  storage: StorageStats;
  notifications: Notification[];
}

export const mockDashboardData: DashboardData = {
  kpis: {
    totalDocuments: 14592,
    indexedDocuments: 14201,
    pendingEmbeddings: 391,
    aiConversations: 842,
    activeUsers: 156,
    storageUsedGB: 412.5,
  },
  recentDocuments: [
    { id: '1', name: 'Q3 Financial Overview.pdf', department: 'Finance', updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), status: 'Ready' },
    { id: '2', name: 'Security Audit 2026.docx', department: 'Security', updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), status: 'Ready' },
    { id: '3', name: 'Project Alpha Spec.md', department: 'Engineering', updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), status: 'Processing' },
    { id: '4', name: 'Board Deck Final.pptx', department: 'Executive', updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), status: 'Ready' },
    { id: '5', name: 'Corrupted_Archive.zip', department: 'Legal', updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), status: 'Failed' },
  ],
  recentActivity: [
    { id: 'a1', type: 'UPLOAD', user: 'Sarah Jenkins', description: 'uploaded 5 documents', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
    { id: 'a2', type: 'CHAT', user: 'Elena Rodriguez', description: 'started a new AI session', timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString() },
    { id: 'a3', type: 'PERMISSION', user: 'Admin System', description: 'changed visibility on Board Deck', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
    { id: 'a4', type: 'INVITE', user: 'Michael Scott', description: 'invited 2 new users to HR Group', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString() },
  ],
  aiUsage: {
    requestsToday: 1245,
    tokensUsed: '2.4M',
    avgResponseTimeMs: 412,
    successRate: 99.8,
    hourlyRequests: [12, 5, 2, 8, 15, 45, 120, 210, 340, 290, 250, 180, 190, 220, 310, 280, 150, 90, 60, 40, 25, 18, 10, 5]
  },
  storage: {
    totalGB: 1000,
    usedGB: 412.5,
    departments: [
      { name: 'Engineering', percentage: 45, color: 'bg-blue-500' },
      { name: 'Marketing', percentage: 25, color: 'bg-purple-500' },
      { name: 'Finance', percentage: 15, color: 'bg-green-500' },
      { name: 'Legal', percentage: 10, color: 'bg-amber-500' },
      { name: 'Other', percentage: 5, color: 'bg-slate-300' },
    ]
  },
  notifications: [
    { id: 'n1', type: 'SUCCESS', title: 'Batch Embedding Complete', message: 'Processed 391 documents successfully.', time: '10m ago' },
    { id: 'n2', type: 'WARNING', title: 'Storage Alert', message: 'Legal department is nearing its quota.', time: '1h ago' },
    { id: 'n3', type: 'ERROR', title: 'Sync Failure', message: 'Failed to sync Active Directory users.', time: '2h ago' },
    { id: 'n4', type: 'INFO', title: 'System Update', message: 'v1.4.2 deployment scheduled for midnight.', time: '5h ago' },
  ]
};
