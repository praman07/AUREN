import { prisma } from '../../infrastructure/database/prisma';
import { PipelineState, ProcessingStateMachine } from '../../domain/state/ProcessingStateMachine';
import { BaseException } from '../../domain/exceptions/BaseException';
import { IAuditLogRepository } from '../../infrastructure/repositories/AuditLogRepository';
import { UnitOfWork } from '../../infrastructure/database/UnitOfWork';

// Note: To implement this purely, we'd add 'pipelineState' to the Document model. 
// For now, we simulate this by querying the latest ProcessingJob status or adding a metadata field to Document.
export class PipelineStatusService {
  constructor(
    private readonly auditLogRepository: IAuditLogRepository,
    private readonly unitOfWork: UnitOfWork
  ) {}

  async getCurrentState(documentId: string): Promise<PipelineState> {
    // In a real implementation, 'pipelineState' should be a column on Document or DocumentVersion
    // Mocking the lookup for now:
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw new BaseException('Document not found', 404);
    
    // Fallback if not tracked yet
    return PipelineState.UPLOADED; 
  }

  async transitionState(documentId: string, organizationId: string, targetState: PipelineState, reason?: string): Promise<void> {
    await this.unitOfWork.execute(async (tx) => {
      const currentState = await this.getCurrentState(documentId);
      const newState = ProcessingStateMachine.transition(currentState, targetState);

      // 1. Update Document state (assuming we add this column later, mocking with audit for now)
      // await tx.document.update({ where: { id: documentId }, data: { pipelineState: newState } });

      // 2. Write Audit Log
      await this.auditLogRepository.create({
        action: 'UPDATE',
        organization: { connect: { id: organizationId } },
        resourceId: documentId,
        metadata: { previousState: currentState, newState, reason }
      }, tx);
    });
  }
}
