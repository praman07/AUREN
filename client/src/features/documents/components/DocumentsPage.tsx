import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LibraryView } from '../../../components/library/LibraryView';
import { api } from '../../../services/api';
import type { AurenDocument, Connector } from '../../../types';

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
    navigate('/chat', { state: { initialAttachedDoc: doc, initialQuery: `Summarize key concepts in ${doc.title}` } });
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
      onDeleteDocument={handleDeleteDocument}
      onNavigateToRbac={() => navigate('/departments')}
    />
  );
};

