import { Router } from 'express';
import { requireAuth } from '../middlewares/requireAuth';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin';
import { OrganizationController } from '../controllers/OrganizationController';
import { OrganizationService } from '../../application/services/OrganizationService';
import { userService } from '../../di';

const router = Router();
const orgService = new OrganizationService();
const controller = new OrganizationController(orgService, userService);

router.use(requireAuth);

router.get('/', controller.getOrganization);
router.patch('/settings', requireSuperAdmin, controller.updateSettings);
router.get('/members', controller.getMembers);
router.post('/members/invite', requireSuperAdmin, controller.inviteMember);
router.patch('/members/:id/status', requireSuperAdmin, controller.updateMemberStatus);

export default router;
