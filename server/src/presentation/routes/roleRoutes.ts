import { Router } from 'express';
import { RoleController } from '../controllers/RoleController';
import { requireAuth } from '../middlewares/requireAuth';
import { validateRequest } from '../middlewares/validateRequest';
import { TogglePermissionSchema, RoleIdParamSchema } from '../../application/dtos/RoleDTOs';
import { unitOfWork, eventPublisher } from '../../di';
import { RoleService } from '../../application/services/RoleService';

const router = Router();
const roleService = new RoleService(unitOfWork, eventPublisher);
const roleController = new RoleController(roleService);

router.use(requireAuth);

router.get('/', roleController.getRoles);

router.patch(
  '/:id/permissions/toggle',
  /* requireClearance('INTERNAL'), */
  validateRequest(TogglePermissionSchema),
  roleController.togglePermission
);

export default router;
