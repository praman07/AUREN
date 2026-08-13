import { Request, Response } from 'express';
import { AuditLogService } from '../../application/services/AuditLogService';
import { AuditLogQueryDTO } from '../../application/dtos/AuditLogDTOs';

export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

getLogs = async (req: Request, res: Response, next: any): Promise<void> => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      res.status(401).json({ error: 'Organization context required' });
      return;
    }

    const query = req.query as unknown as AuditLogQueryDTO;

    const logs = await this.auditLogService.getLogs(organizationId, query);
    res.status(200).json(logs);
  };

  getLogById = async (req: Request, res: Response): Promise<void> => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      res.status(401).json({ error: 'Organization context required' });
      return;
    }
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const log = await this.auditLogService.getLogById(organizationId, id);
    if (!log) {
      res.status(404).json({ success: false, error: 'Audit log entry not found' });
      return;
    }
    res.status(200).json({ success: true, data: log });
  };
}
