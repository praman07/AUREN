import { Router } from 'express';
import { ProcessingJobController } from '../controllers/ProcessingJobController';
import { requireAuth } from '../middlewares/requireAuth';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin';
import { validateRequest } from '../middlewares/validateRequest';
import { ProcessingJobQuerySchema } from '../../application/dtos/ProcessingJobDTOs';
import { ProcessingJobService } from '../../application/services/ProcessingJobService';

const router = Router();
const processingJobService = new ProcessingJobService();
const processingJobController = new ProcessingJobController(processingJobService);

router.use(requireAuth);

router.get(
  '/',
  requireSuperAdmin,
  validateRequest(ProcessingJobQuerySchema),
  processingJobController.getJobs
);

export default router;
