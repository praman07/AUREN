import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrganizationalMemoryView } from '../../../components/agents/OrganizationalMemoryView';
import { api } from '../../../services/api';
import type { AurenDocument } from '../../../types';

export const MemoryConsolePage: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<AurenDocument[]>([]);

  useEffect(() => {
    api.getDocuments().then(setDocuments).catch(console.error);
  }, []);

  return (
    <OrganizationalMemoryView
      documents={documents}
      onOpenDocument={() => navigate('/documents')}
      onOpenMeeting={() => navigate('/chat')}
      onOpenDecision={() => navigate('/chat')}
      onOpenChannel={() => navigate('/chat')}
      onAskAuren={(prompt) => {
        navigate('/chat', { state: { initialQuery: prompt } });
      }}
    />
  );
};


