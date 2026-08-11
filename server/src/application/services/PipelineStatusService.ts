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
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw new BaseException('Document not found', 404);
    
    // Look up latest audit log for this document
    const latestLog = await prisma.auditLog.findFirst({
      where: { resourceId: documentId, action: 'UPDATE' as any },
      orderBy: { createdAt: 'desc' }
    });

    if (latestLog && (latestLog.metadata as any)?.newState) {
      console.log(`[PipelineStatus] Found latest state for ${documentId}: ${(latestLog.metadata as any).newState}`);
      return (latestLog.metadata as any).newState as PipelineState;
    }

    console.log(`[PipelineStatus] No latest state found for ${documentId}, returning UPLOADED`);
    return PipelineState.UPLOADED; 
  }

  async transitionState(documentId: string, organizationId: string, targetState: PipelineState, reason?: string): Promise<void> {
    console.log(`[PipelineStatus] Transitioning ${documentId} to ${targetState}`);
    await this.unitOfWork.execute(async (tx) => {
      const currentState = await this.getCurrentState(documentId);
      const newState = ProcessingStateMachine.transition(currentState, targetState);

      // 1. Update Document state (assuming we add this column later, mocking with audit for now)
      // await tx.document.update({ where: { id: documentId }, data: { pipelineState: newState } });

      // 2. Write Audit Log
      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          organization: { connect: { id: organizationId } },
          resourceId: documentId,
          metadata: { previousState: currentState, newState, reason }
        }
      });
    });
  }
}
