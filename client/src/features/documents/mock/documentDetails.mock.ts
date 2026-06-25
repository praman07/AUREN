import { Document } from '../types';

export interface TimelineEvent {
  id: string;
  type: 'UPLOADED' | 'VIEWED' | 'DOWNLOADED' | 'SHARED' | 'PERMISSION_CHANGED' | 'INDEXED' | 'AI_CHAT';
  actor: string;
  timestamp: string;
  details?: string;
}

export interface VersionHistoryItem {
  id: string;
  version: string;
  author: string;
  timestamp: string;
  changes: string;
}

export interface ExtendedDocumentDetails extends Document {
  organization: string;
  clearanceLevel: string;
  visibility: string;
  sharedWithUsers: string[];
  sharedWithGroups: string[];
  indexedAt: string;
  vectorCount: number;
  embeddingModel: string;
  chunkCount: number;
  timeline: TimelineEvent[];
  versions: VersionHistoryItem[];
}

// Helper to generate mock deep data based on a base document
export const generateMockDetails = (doc: Document): ExtendedDocumentDetails => {
  return {
    ...doc,
    organization: 'Acme Corp',
    clearanceLevel: doc.classification === 'SECRET' ? 'Level 4 (Top Secret)' : 'Level 1 (General)',
    visibility: doc.sharingStatus === 'Shared' ? 'Internal' : 'Private to Owner',
    sharedWithUsers: doc.sharingStatus === 'Shared' ? ['alice@acme.com', 'bob@acme.com'] : [],
    sharedWithGroups: doc.sharingStatus === 'Shared' ? ['Engineering Team', 'Leadership'] : [],
    indexedAt: new Date(new Date(doc.uploadedAt).getTime() + 600000).toISOString(),
    vectorCount: Math.floor(Math.random() * 5000) + 100,
    embeddingModel: 'BGE-m3-large (Local)',
    chunkCount: Math.floor(Math.random() * 500) + 10,
    versions: [
      {
        id: 'v2',
        version: doc.version,
        author: doc.owner,
        timestamp: doc.modifiedAt,
        changes: 'Updated quarterly metrics and added conclusion.'
      },
      {
        id: 'v1',
        version: 'v1.0',
        author: doc.owner,
        timestamp: doc.uploadedAt,
        changes: 'Initial document upload.'
      }
    ],
    timeline: [
      {
        id: 'e4',
        type: 'AI_CHAT',
        actor: 'Jane Doe',
        timestamp: new Date().toISOString(),
        details: 'Asked 3 questions about Q3 revenue.'
      },
      {
        id: 'e3',
        type: 'INDEXED',
        actor: 'System (Qdrant)',
        timestamp: new Date(new Date(doc.uploadedAt).getTime() + 600000).toISOString(),
      },
      {
        id: 'e2',
        type: 'SHARED',
        actor: doc.owner,
        timestamp: new Date(new Date(doc.uploadedAt).getTime() + 360000).toISOString(),
        details: 'Shared with Engineering Team.'
      },
      {
        id: 'e1',
        type: 'UPLOADED',
        actor: doc.owner,
        timestamp: doc.uploadedAt,
      }
    ]
  };
};
