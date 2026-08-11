import { create } from 'zustand';

export type UploadStatus = 'Queued' | 'Uploading' | 'Uploaded' | 'Failed' | 'Cancelled';

export interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: UploadStatus;
  errorMessage?: string;
  documentId?: string;
}

interface UploadState {
  isOpen: boolean;
  files: UploadFile[];
  setIsOpen: (isOpen: boolean) => void;
  addFiles: (newFiles: File[]) => void;
  updateFile: (id: string, updates: Partial<UploadFile>) => void;
  removeFile: (id: string) => void;
  cancelUpload: (id: string) => void;
  retryUpload: (id: string) => void;
  clearCompleted: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  isOpen: false,
  files: [],
  setIsOpen: (isOpen) => set({ isOpen }),
  
  addFiles: (newFiles) => {
    const validExtensions = ['pdf', 'docx', 'txt', 'md', 'csv'];
    
    const mappedFiles: UploadFile[] = newFiles.map((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isTooLarge = file.size > 50 * 1024 * 1024; // 50MB
      const isInvalidType = !validExtensions.includes(ext);
      
      let status: UploadStatus = 'Queued';
      let errorMessage = undefined;

      if (isTooLarge) {
        status = 'Failed';
        errorMessage = 'File exceeds 50MB limit';
      } else if (isInvalidType) {
        status = 'Failed';
        errorMessage = 'Unsupported file type';
      }

      return {
        id: crypto.randomUUID(),
        file,
        progress: 0,
        status,
        errorMessage,
      };
    });

    set((state) => ({ files: [...state.files, ...mappedFiles] }));
  },

  updateFile: (id, updates) => set((state) => ({
    files: state.files.map((f) => f.id === id ? { ...f, ...updates } : f)
  })),

  removeFile: (id) => set((state) => ({ files: state.files.filter((f) => f.id !== id) })),
  
  cancelUpload: (id) => set((state) => ({
    files: state.files.map((f) => f.id === id && f.status === 'Uploading' ? { ...f, status: 'Cancelled' } : f)
  })),

  retryUpload: (id) => set((state) => ({
    files: state.files.map((f) => f.id === id ? { ...f, status: 'Queued', progress: 0, errorMessage: undefined } : f)
  })),

  clearCompleted: () => set((state) => ({
    files: state.files.filter((f) => f.status !== 'Uploaded')
  })),
}));
