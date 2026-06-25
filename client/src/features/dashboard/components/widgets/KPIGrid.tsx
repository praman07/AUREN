import React from 'react';
import { DashboardKPIs } from '../../mock/dashboard.mock';
import { FileText, Database, Clock, MessageSquare, Users, HardDrive } from 'lucide-react';

interface KPIGridProps {
  metrics: DashboardKPIs;
}

export const KPIGrid: React.FC<KPIGridProps> = ({ metrics }) => {
  const cards = [
    { title: 'Total Documents', value: metrics.totalDocuments.toLocaleString(), icon: <FileText size={16} /> },
    { title: 'Indexed (Vector DB)', value: metrics.indexedDocuments.toLocaleString(), icon: <Database size={16} /> },
    { title: 'Pending Embeddings', value: metrics.pendingEmbeddings.toLocaleString(), icon: <Clock size={16} />, alert: metrics.pendingEmbeddings > 100 },
    { title: 'AI Conversations', value: metrics.aiConversations.toLocaleString(), icon: <MessageSquare size={16} /> },
    { title: 'Active Users', value: metrics.activeUsers.toLocaleString(), icon: <Users size={16} /> },
    { title: 'Storage Used', value: `${metrics.storageUsedGB.toFixed(1)} GB`, icon: <HardDrive size={16} /> },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {cards.map((card, i) => (
        <div key={i} className="bg-white border border-border rounded-lg p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider">{card.title}</h3>
            {card.icon}
          </div>
          <div className="flex items-end justify-between mt-auto">
            <span className={`text-2xl font-semibold tracking-tight ${card.alert ? 'text-amber-600' : 'text-foreground'}`}>
              {card.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
