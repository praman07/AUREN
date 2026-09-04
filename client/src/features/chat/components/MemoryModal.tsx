import React, { useEffect, useState } from 'react';
import { X, Brain, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { chatService } from '../services/chatService';

export const MemoryModal: React.FC = () => {
  const { isMemoryModalOpen, memories, toggleMemoryModal } = useChatStore();
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isMemoryModalOpen) {
      chatService.fetchMemories();
    }
  }, [isMemoryModalOpen]);

  if (!isMemoryModalOpen) return null;

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;
    setIsSubmitting(true);
    await chatService.createMemory(newKey.trim(), newValue.trim());
    setNewKey('');
    setNewValue('');
    setIsSubmitting(false);
  };

  const handleDeleteMemory = async (id: string) => {
    await chatService.deleteMemory(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
              <Brain size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">User Memory & Preferences</h3>
              <p className="text-[11px] text-slate-500">Persistent user facts & preferences stored per organization.</p>
            </div>
          </div>
          <button
            onClick={toggleMemoryModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Add Memory Form */}
        <form onSubmit={handleCreateMemory} className="p-4 border-b border-slate-200 bg-purple-50/30 flex flex-col gap-3">
          <div className="text-xs font-semibold text-slate-700">Add New Personal Memory</div>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Key (e.g. Job Role)"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="col-span-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white outline-none focus:border-purple-500 text-slate-900"
            />
            <input
              type="text"
              placeholder="Value (e.g. Senior Software Architect)"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="col-span-2 px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white outline-none focus:border-purple-500 text-slate-900"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !newKey.trim() || !newValue.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-medium transition-colors shadow-xs"
            >
              <Plus size={14} />
              <span>Save Fact</span>
            </button>
          </div>
        </form>

        {/* Memory Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <span>Saved Personal Facts ({memories.length})</span>
            <div className="flex items-center gap-1 text-emerald-600 font-medium">
              <ShieldAlert size={12} />
              <span>Tenant Isolated</span>
            </div>
          </div>

          {memories.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No long-term memories stored yet. The AI can automatically record preferences during chat, or you can add them manually above.
            </div>
          ) : (
            memories.map((mem) => (
              <div
                key={mem.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">{mem.key}</span>
                  <span className="text-xs text-slate-800 font-medium truncate">{mem.value}</span>
                </div>
                <button
                  onClick={() => handleDeleteMemory(mem.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                  title="Delete memory item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={toggleMemoryModal}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
