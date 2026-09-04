import { Router } from 'express';
import { ConnectorController } from '../controllers/ConnectorController';
import { requireAuth } from '../middlewares/requireAuth';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin';
import { validateRequest } from '../middlewares/validateRequest';
import { ConnectorService } from '../../application/connectors/ConnectorService';
import { connectorService } from '../../di';
import { ConnectConnectorSchema, ConnectorIdParamSchema } from '../../application/dtos/ConnectorDTOs';

const router = Router();
const controller = new ConnectorController(connectorService as ConnectorService);

// Google OAuth callback endpoint
router.get('/google/callback', controller.handleGoogleCallback);

router.use(requireAuth);

router.get('/', controller.list);
router.get('/google/auth-url', controller.getGoogleAuthUrl);
router.post('/connect', requireSuperAdmin, validateRequest(ConnectConnectorSchema), controller.connect);
router.post('/:id/sync', requireSuperAdmin, validateRequest(ConnectorIdParamSchema), controller.sync);
router.get('/:id', validateRequest(ConnectorIdParamSchema), controller.details);
router.get('/:id/errors', validateRequest(ConnectorIdParamSchema), controller.errors);
router.post('/:id/disconnect', requireSuperAdmin, validateRequest(ConnectorIdParamSchema), controller.disconnect);

export default router;