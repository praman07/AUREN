export type ProcessingJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface ProcessingJob {
  id: string;
  organizationId: string;
  documentId: string;
  queueName: string;
  status: ProcessingJobStatus;
  attempts: number;
  maxAttempts: number;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  createdAt: string;
  updatedAt: string;
  document?: {
    id: string;
    title: string;
  };
}

export interface PaginatedProcessingJobs {
  data: ProcessingJob[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
