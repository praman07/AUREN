import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchView } from '../../../components/search/SearchView';
import { api } from '../../../services/api';
import type { AurenDocument } from '../../../types';

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<AurenDocument[]>([]);

  useEffect(() => {
    api.getDocuments().then(setDocuments).catch(console.error);
  }, []);

  return (
    <SearchView
      documents={documents}
      onOpenDocument={(_doc) => {
        navigate('/documents');
      }}
      onOpenConversation={(_convId) => {
        navigate('/chat');
      }}
    />
  );
};


