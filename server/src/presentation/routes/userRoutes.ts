import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { validateRequest } from '../middlewares/validateRequest';
import { requireAuth } from '../middlewares/requireAuth';
import { InviteUserSchema, UserIdParamSchema } from '../../application/dtos/UserDTOs';
import { userService } from '../../di';

const router = Router();
const userControllerInstance = new UserController(userService);

// Apply auth middleware to all user routes
router.use(requireAuth);

router.get('/', userControllerInstance.getUsers);
router.post('/invite', validateRequest(InviteUserSchema), userControllerInstance.inviteUser);
router.patch('/:id/deactivate', validateRequest(UserIdParamSchema), userControllerInstance.deactivateUser);
router.patch('/:id/reactivate', validateRequest(UserIdParamSchema), userControllerInstance.reactivateUser);

export default router;
