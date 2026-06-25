import { create } from 'zustand';

export type UploadStatus = 'Queued' | 'Uploading' | 'Uploaded' | 'Failed' | 'Cancelled';

export interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: UploadStatus;
  errorMessage?: string;
}

interface UploadState {
  isOpen: boolean;
  files: UploadFile[];
  setIsOpen: (isOpen: boolean) => void;
  addFiles: (newFiles: File[]) => void;
  removeFile: (id: string) => void;
  cancelUpload: (id: string) => void;
  retryUpload: (id: string) => void;
  clearCompleted: () => void;
}

export const useUploadStore = create<UploadState>((set, get) => ({
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
    
    // Auto-start valid uploads
    mappedFiles.filter(f => f.status === 'Queued').forEach(f => {
      simulateUpload(f.id, set);
    });
  },

  removeFile: (id) => set((state) => ({ files: state.files.filter((f) => f.id !== id) })),
  
  cancelUpload: (id) => set((state) => ({
    files: state.files.map((f) => f.id === id && f.status === 'Uploading' ? { ...f, status: 'Cancelled' } : f)
  })),

  retryUpload: (id) => {
    set((state) => ({
      files: state.files.map((f) => f.id === id ? { ...f, status: 'Queued', progress: 0, errorMessage: undefined } : f)
    }));
    simulateUpload(id, set);
  },

  clearCompleted: () => set((state) => ({
    files: state.files.filter((f) => f.status !== 'Uploaded')
  })),
}));

// Mock upload simulator
function simulateUpload(id: string, set: any) {
  set((state: UploadState) => ({
    files: state.files.map((f) => f.id === id ? { ...f, status: 'Uploading' } : f)
  }));

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.floor(Math.random() * 20) + 5; // Simulate chunking
    
    // Simulate random failure (10% chance)
    if (progress > 50 && Math.random() < 0.1) {
      clearInterval(interval);
      set((state: UploadState) => ({
        files: state.files.map((f) => f.id === id ? { ...f, status: 'Failed', errorMessage: 'Network timeout' } : f)
      }));
      return;
    }

    if (progress >= 100) {
      clearInterval(interval);
      set((state: UploadState) => ({
        files: state.files.map((f) => f.id === id ? { ...f, progress: 100, status: 'Uploaded' } : f)
      }));
    } else {
      set((state: UploadState) => {
        // Stop if cancelled
        const file = state.files.find(f => f.id === id);
        if (file?.status === 'Cancelled') {
          clearInterval(interval);
          return state;
        }
        return {
          files: state.files.map((f) => f.id === id ? { ...f, progress } : f)
        };
      });
    }
  }, 400);
}
