import { Router } from 'express';
import { DepartmentController } from '../controllers/DepartmentController';
import { requireAuth } from '../middlewares/requireAuth';
import { validateRequest } from '../middlewares/validateRequest';
import { CreateDepartmentSchema, UpdateDepartmentSchema, DepartmentIdParamSchema } from '../../application/dtos/DepartmentDTOs';
import { unitOfWork, departmentRepository, eventPublisher } from '../../di';
import { DepartmentService } from '../../application/services/DepartmentService';

const router = Router();
const departmentService = new DepartmentService(departmentRepository, unitOfWork, eventPublisher);
const departmentController = new DepartmentController(departmentService);

router.use(requireAuth);

router.get('/', departmentController.getDepartments);

router.post(
  '/',
  /* requireClearance('INTERNAL'), TODO: define if needed */
  validateRequest(CreateDepartmentSchema),
  departmentController.createDepartment
);

router.patch(
  '/:id',
  /* requireClearance('INTERNAL'), */
  validateRequest(UpdateDepartmentSchema),
  departmentController.updateDepartment
);

router.patch(
  '/:id/archive',
  /* requireClearance('INTERNAL'), */
  validateRequest(DepartmentIdParamSchema),
  departmentController.archiveDepartment
);

router.patch(
  '/:id/restore',
  /* requireClearance('INTERNAL'), */
  validateRequest(DepartmentIdParamSchema),
  departmentController.restoreDepartment
);

export default router;
