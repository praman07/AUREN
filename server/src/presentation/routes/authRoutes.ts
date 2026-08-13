import { Router } from 'express';
import { requireAuth } from '../middlewares/requireAuth';
import { validateRequest } from '../middlewares/validateRequest';
import { LoginSchema } from '../../application/dtos/AuthDTOs';
import { AuthController } from '../controllers/AuthController';
import { AuthService } from '../../application/services/AuthService';

const router = Router();
const authController = new AuthController(new AuthService());

router.post('/login', validateRequest(LoginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

export default router;