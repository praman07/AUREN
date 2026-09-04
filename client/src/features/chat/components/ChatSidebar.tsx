import React, { useEffect, useState } from 'react';
import { Plus, MessageSquare, Trash2, Edit2, Check, X, Brain, Globe, Shield, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import type { ConversationItem } from '../store/useChatStore';
import { chatService } from '../services/chatService';

export const ChatSidebar: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    activeMode,
    isSidebarOpen,
    setActiveMode,
    clearHistory,
    toggleSidebar,
    toggleMemoryModal,
  } = useChatStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    chatService.fetchConversations();
  }, []);

  const handleSelectConversation = (conv: ConversationItem) => {
    if (activeConversationId === conv.id) return;
    chatService.loadConversation(conv.id);
  };

  const handleStartNewChat = () => {
    clearHistory();
  };

  const handleStartEdit = (e: React.MouseEvent, conv: ConversationItem) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveEdit = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      await chatService.renameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      await chatService.deleteConversation(id);
    }
  };

  if (!isSidebarOpen) {
    return (
      <div className="p-2 border-r border-slate-200 bg-slate-50 flex flex-col items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-200/60 transition-colors"
          title="Expand Sidebar"
        >
          <PanelLeft size={18} />
        </button>
        <button
          onClick={handleStartNewChat}
          className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-sm"
          title="New Chat"
        >
          <Plus size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 border-r border-slate-200/80 bg-slate-50 flex flex-col h-full shrink-0 select-none">
      {/* Sidebar Header */}
      <div className="p-3 border-b border-slate-200/80 flex items-center justify-between gap-2">
        <button
          onClick={handleStartNewChat}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Plus size={16} />
          <span>New Chat</span>
        </button>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-200/60 transition-colors"
          title="Collapse Sidebar"
        >
          <PanelLeftClose size={18} />
        </button>
      </div>

      {/* Mode & Memory Control Bar */}
      <div className="p-3 border-b border-slate-200/80 flex flex-col gap-2 bg-white/50">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Search Mode</div>
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/60 rounded-xl">
          <button
            onClick={() => setActiveMode('hybrid')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeMode === 'hybrid'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe size={13} className={activeMode === 'hybrid' ? 'text-blue-600' : ''} />
            <span>Hybrid</span>
          </button>

          <button
            onClick={() => setActiveMode('local')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeMode === 'local'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield size={13} className={activeMode === 'local' ? 'text-emerald-600' : ''} />
            <span>Local</span>
          </button>
        </div>

        {/* User Memory Management Button */}
        <button
          onClick={toggleMemoryModal}
          className="mt-1 flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-medium transition-colors"
        >
          <div className="flex items-center gap-2">
            <Brain size={14} className="text-purple-600" />
            <span>User Memory</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 font-semibold">Active</span>
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Recent Chats</div>
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400 italic">No conversations yet</div>
        ) : (
          conversations.map((conv) => {
            const isActive = activeConversationId === conv.id;
            const isEditing = editingId === conv.id;

            return (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                  isActive
                    ? 'bg-slate-200/90 text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                  <MessageSquare size={14} className={isActive ? 'text-blue-600 shrink-0' : 'text-slate-400 shrink-0'} />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs outline-none text-slate-900 w-full"
                      autoFocus
                    />
                  ) : (
                    <span className="truncate">{conv.title}</span>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isEditing ? (
                    <>
                      <button
                        onClick={(e) => handleSaveEdit(e, conv.id)}
                        className="p-1 hover:text-emerald-600 rounded text-slate-400"
                        title="Save"
                      >
                        <Check size={13} />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 hover:text-rose-600 rounded text-slate-400"
                        title="Cancel"
                      >
                        <X size={13} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => handleStartEdit(e, conv)}
                        className="p-1 hover:text-slate-900 rounded text-slate-400"
                        title="Rename"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, conv.id)}
                        className="p-1 hover:text-rose-600 rounded text-slate-400"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
