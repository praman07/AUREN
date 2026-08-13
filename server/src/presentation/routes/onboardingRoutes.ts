import { Router } from 'express';
import { OnboardingController } from '../controllers/OnboardingController';
import { OnboardingService } from '../../application/services/OnboardingService';
import { validateRequest } from '../middlewares/validateRequest';
import { OnboardOrganizationSchema } from '../../application/dtos/OnboardingDTOs';

const router = Router();
const controller = new OnboardingController(new OnboardingService());

router.post('/onboard', validateRequest(OnboardOrganizationSchema), controller.onboard);
router.get('/templates', controller.getIndustryTemplates);

export default router;
