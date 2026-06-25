export type Classification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'SECRET';

export type AIStatus = 'Ready' | 'Processing' | 'Failed' | 'Embedding';
export type SharingStatus = 'Private' | 'Shared';

export interface Document {
  id: string;
  name: string;
  owner: string;
  department: string;
  classification: Classification;
  tags: string[];
  version: string;
  size: string; // e.g., '2.4 MB'
  uploadedAt: string; // ISO Date
  modifiedAt: string; // ISO Date
  aiStatus: AIStatus;
  sharingStatus: SharingStatus;
}
