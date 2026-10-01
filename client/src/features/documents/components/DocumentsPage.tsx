import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LibraryView } from '../../../components/library/LibraryView';
import { api } from '../../../services/api';
import type { AurenDocument, Connector, ConnectorDataItem } from '../../../types';

export const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<AurenDocument[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);

  const loadData = async () => {
    try {
      const [docs, conns] = await Promise.all([
        api.getDocuments(),
        api.getConnectors(),
      ]);
      setDocuments(docs);
      setConnectors(conns);
    } catch (err) {
      console.error('Failed to load documents for LibraryView:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAskAuren = (doc: AurenDocument) => {
    navigate('/chat', { state: { initialAttachedDoc: doc } });
  };

  const handleAskAurenAboutConnectorData = (item: ConnectorDataItem) => {
    const doc: AurenDocument = {
      id: item.id,
      title: item.title || 'Connector Resource',
      filename: item.title || 'connector_file',
      fileSize: item.sizeOrCount || '100 KB',
      scope: 'organization',
      updatedAt: item.syncedAt || new Date().toISOString(),
      createdAt: item.syncedAt || new Date().toISOString(),
      type: 'text',
      status: 'ready',
      source: 'github',
      accessPolicy: {
        ownerId: item.author || 'system',
        ownerName: item.connectorName || 'Connector',
        scope: 'organization',
        allowedRoles: [],
        allowedDepartments: [],
        isRestricted: false,
      },
      versionHistory: [],
      activityLog: [],
    };
    navigate('/chat', { state: { initialAttachedDoc: doc } });
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await api.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  return (
    <LibraryView
      documents={documents}
      connectors={connectors}
      onRefreshDocuments={loadData}
      onAskAuren={handleAskAuren}
      onAskAurenAboutConnectorData={handleAskAurenAboutConnectorData}
      onDeleteDocument={handleDeleteDocument}
      onNavigateToRbac={() => navigate('/departments')}
    />
  );
};

