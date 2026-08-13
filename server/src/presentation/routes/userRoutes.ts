import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { validateRequest } from '../middlewares/validateRequest';
import { requireAuth } from '../middlewares/requireAuth';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin';
import { InviteUserSchema, UserIdParamSchema } from '../../application/dtos/UserDTOs';
import { userService } from '../../di';

const router = Router();
const userControllerInstance = new UserController(userService);

// Apply auth middleware to all user routes
router.use(requireAuth);

router.get('/', userControllerInstance.getUsers);
router.post('/invite', requireSuperAdmin, validateRequest(InviteUserSchema), userControllerInstance.inviteUser);
router.patch('/:id/deactivate', requireSuperAdmin, validateRequest(UserIdParamSchema), userControllerInstance.deactivateUser);
router.patch('/:id/reactivate', requireSuperAdmin, validateRequest(UserIdParamSchema), userControllerInstance.reactivateUser);

export default router;
