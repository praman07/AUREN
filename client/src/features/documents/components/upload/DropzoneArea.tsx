import React, { useCallback } from 'react';
import { UploadCloud } from 'lucide-react';
import { useUploadStore } from '../../store/useUploadStore';

export const DropzoneArea: React.FC = () => {
  const { addFiles } = useUploadStore();

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  }, [addFiles]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  return (
    <div 
      className="border-2 border-dashed border-border rounded-lg p-8 bg-slate-50 hover:bg-slate-100 transition-colors flex flex-col items-center justify-center text-center cursor-pointer group"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => document.getElementById('fileUploadInput')?.click()}
    >
      <input 
        id="fileUploadInput"
        type="file" 
        multiple 
        className="hidden" 
        onChange={handleChange}
        accept=".pdf,.docx,.txt,.md,.csv,.png,.jpg,.jpeg,.webp,.gif,.bmp,.tiff,.svg,image/*"
      />
      <div className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition-transform">
        <UploadCloud size={20} className="text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
      <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT, MD, CSV, Images (max. 50MB)</p>
    </div>
  );
};
