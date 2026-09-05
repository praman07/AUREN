import { BaseException } from '../exceptions/BaseException';

export enum PipelineState {
  UPLOADED = 'UPLOADED',
  QUEUED = 'QUEUED',
  OCR_PENDING = 'OCR_PENDING',
  OCR_COMPLETED = 'OCR_COMPLETED',
  CHUNKING_PENDING = 'CHUNKING_PENDING',
  CHUNKING_COMPLETED = 'CHUNKING_COMPLETED',
  EMBEDDING_PENDING = 'EMBEDDING_PENDING',
  EMBEDDING_COMPLETED = 'EMBEDDING_COMPLETED',
  INDEXING_PENDING = 'INDEXING_PENDING',
  READY = 'READY',
  FAILED = 'FAILED',
  PARTIALLY_FAILED = 'PARTIALLY_FAILED',
  CANCELLED = 'CANCELLED'
}

export class ProcessingStateMachine {
  // Define valid state transitions (from -> [allowed to])
  private static readonly transitions: Record<PipelineState, PipelineState[]> = {
    [PipelineState.UPLOADED]: [PipelineState.QUEUED, PipelineState.CANCELLED],
    [PipelineState.QUEUED]: [PipelineState.OCR_PENDING, PipelineState.CANCELLED],
    [PipelineState.OCR_PENDING]: [PipelineState.OCR_COMPLETED, PipelineState.FAILED, PipelineState.CANCELLED],
    [PipelineState.OCR_COMPLETED]: [PipelineState.CHUNKING_PENDING, PipelineState.CANCELLED],
    [PipelineState.CHUNKING_PENDING]: [PipelineState.CHUNKING_COMPLETED, PipelineState.FAILED, PipelineState.CANCELLED],
    [PipelineState.CHUNKING_COMPLETED]: [PipelineState.EMBEDDING_PENDING, PipelineState.CANCELLED],
    [PipelineState.EMBEDDING_PENDING]: [PipelineState.EMBEDDING_COMPLETED, PipelineState.PARTIALLY_FAILED, PipelineState.CANCELLED],
    [PipelineState.EMBEDDING_COMPLETED]: [PipelineState.INDEXING_PENDING, PipelineState.CANCELLED],
    [PipelineState.INDEXING_PENDING]: [PipelineState.READY, PipelineState.PARTIALLY_FAILED, PipelineState.CANCELLED],
    [PipelineState.READY]: [PipelineState.CHUNKING_PENDING, PipelineState.EMBEDDING_PENDING, PipelineState.INDEXING_PENDING, PipelineState.PARTIALLY_FAILED, PipelineState.FAILED], // Allow reprocessing/reindexing
    [PipelineState.FAILED]: [PipelineState.QUEUED], // Allow retry/resume
    [PipelineState.PARTIALLY_FAILED]: [PipelineState.CHUNKING_PENDING, PipelineState.EMBEDDING_PENDING, PipelineState.INDEXING_PENDING], // Allow resume
    [PipelineState.CANCELLED]: [PipelineState.QUEUED] // Allow restart
  };

  public static canTransition(currentState: PipelineState, targetState: PipelineState): boolean {
    const allowed = this.transitions[currentState] || [];
    return allowed.includes(targetState);
  }

  public static transition(currentState: PipelineState, targetState: PipelineState): PipelineState {
    if (currentState === targetState) {
      return currentState; // Idempotent
    }
    
    if (!this.canTransition(currentState, targetState)) {
      throw new BaseException(`Invalid state transition from ${currentState} to ${targetState}`, 409);
    }
    return targetState;
  }
}
