import { Request, Response } from 'express';
import { AuditLogService } from '../../application/services/AuditLogService';
import { AuditLogQueryDTO } from '../../application/dtos/AuditLogDTOs';

export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  getLogs = async (req: Request, res: Response): Promise<void> => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      res.status(401).json({ error: 'Organization context required' });
      return;
    }

    const query = req.query as unknown as AuditLogQueryDTO;
    
    const logs = await this.auditLogService.getLogs(organizationId, query);
    res.status(200).json(logs);
  };
}
