import { create } from 'zustand';
import { Document } from '../types';

interface DocumentState {
  selectedDocumentId: string | null;
  selectedDocument: Document | null; // We can cache the basic object here
  setSelectedDocument: (id: string | null, doc?: Document) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  selectedDocumentId: null,
  selectedDocument: null,
  setSelectedDocument: (id, doc) => set({ selectedDocumentId: id, selectedDocument: doc || null }),
}));
