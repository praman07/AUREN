import { IEventPublisher } from '../../application/interfaces/IEventPublisher';
import { DocumentProcessingOrchestrator } from '../../application/services/DocumentProcessingOrchestrator';
import { PipelineEventType } from '../../domain/events/PipelineEvents';

export class LocalEventPublisher implements IEventPublisher {
  constructor(private readonly orchestrator: DocumentProcessingOrchestrator) {}

  async publish(topic: string, payload: any): Promise<void> {
    console.log(`[LocalEventPublisher] Publishing event to topic: ${topic}`);
    
    // Map topics to PipelineEventType
    if (topic === 'document.uploaded') {
      await this.orchestrator.handleEvent(PipelineEventType.DOCUMENT_UPLOADED, payload);
    } else if (topic === 'document.processing.requested') {
      // document.uploaded already starts the pipeline, so we can ignore this or map it.
      // We will just log it for now to avoid double processing.
      console.log(`[LocalEventPublisher] Ignored document.processing.requested as document.uploaded starts the pipeline`);
    } else {
      console.warn(`[LocalEventPublisher] Unknown topic: ${topic}`);
    }
  }
}
