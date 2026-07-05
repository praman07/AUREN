import { BullMQJobQueue } from './BullMQJobQueue';

export class QueueManager {
  public readonly documentProcessingQueue = new BullMQJobQueue<any>('document-processing');
  public readonly ocrQueue = new BullMQJobQueue<any>('ocr');
  public readonly chunkingQueue = new BullMQJobQueue<any>('chunking');
  public readonly embeddingQueue = new BullMQJobQueue<any>('embedding');
  public readonly qdrantIndexingQueue = new BullMQJobQueue<any>('qdrant-indexing');
  public readonly notificationsQueue = new BullMQJobQueue<any>('notifications');
}
