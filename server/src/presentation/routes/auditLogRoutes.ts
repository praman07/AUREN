import { Router } from 'express';
import { AuditLogController } from '../controllers/AuditLogController';
import { requireAuth } from '../middlewares/requireAuth';
import { validateRequest } from '../middlewares/validateRequest';
import { AuditLogQuerySchema } from '../../application/dtos/AuditLogDTOs';
import { unitOfWork, eventPublisher } from '../../di';
import { AuditLogService } from '../../application/services/AuditLogService';

const router = Router();
const auditLogService = new AuditLogService(unitOfWork, eventPublisher);
const auditLogController = new AuditLogController(auditLogService);

router.use(requireAuth);

router.get(
  '/',
  validateRequest(AuditLogQuerySchema),
  auditLogController.getLogs
);

export default router;
