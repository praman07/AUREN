import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChatView } from '../../../components/chat/ChatView';
import { api } from '../../../services/api';
import type { ChatConversation, AurenDocument } from '../../../types';

export const ChatPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const [documents, setDocuments] = useState<AurenDocument[]>([]);

  const initialAttachedDoc = (location.state as any)?.initialAttachedDoc || null;
  const initialQuery = (location.state as any)?.initialQuery || undefined;

  const loadData = async () => {
    try {
      const [convs, docs] = await Promise.all([
        api.getConversations(),
        api.getDocuments(),
      ]);
      setConversations(convs);
      setDocuments(docs);
      if (convs.length > 0 && !activeConversationId) {
        setActiveConversationId(convs[0].id);
      }
    } catch (err) {
      console.error('Failed to load chat data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateNewChat = () => {
    const newId = `conv_${Date.now()}`;
    const newConv: ChatConversation = {
      id: newId,
      title: 'New Research Inquiry',
      scope: 'organization',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newId);
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
    try {
      await api.updateConversation(id, { title: newTitle });
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    }
  };

  const handleTogglePinConversation = async (id: string) => {
    const target = conversations.find((c) => c.id === id);
    if (!target) return;
    const newPinned = !target.pinned;
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: newPinned } : c))
    );
    try {
      await api.updateConversation(id, { pinned: newPinned });
    } catch (err) {
      console.error('Failed to pin/unpin conversation:', err);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      setActiveConversationId(remaining[0]?.id);
    }
    try {
      await api.deleteConversation(id);
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <ChatView
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => setActiveConversationId(id)}
        onNewChat={handleCreateNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePinConversation={handleTogglePinConversation}
        documents={documents}
        onOpenDocument={() => navigate('/documents')}
        initialQuery={initialQuery}

        initialAttachedDoc={initialAttachedDoc}
        onNavigateTab={(tab) => navigate(`/${tab}`)}
      />
    </div>
  );
};




