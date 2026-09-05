import { Router } from 'express';
import { ConnectorController } from '../controllers/ConnectorController';
import { requireAuth } from '../middlewares/requireAuth';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin';
import { validateRequest } from '../middlewares/validateRequest';
import { ConnectorService } from '../../application/connectors/ConnectorService';
import { connectorService } from '../../di';
import { ConnectConnectorSchema, ConnectorIdParamSchema, SelectGitHubReposSchema } from '../../application/dtos/ConnectorDTOs';

const router = Router();
const controller = new ConnectorController(connectorService as ConnectorService);

// OAuth callback endpoints (unauthenticated browser redirect endpoints)
router.get('/google/callback', controller.handleGoogleCallback);
router.get('/github/callback', controller.handleGitHubCallback);

router.use(requireAuth);

router.get('/', controller.list);
router.get('/google/auth-url', controller.getGoogleAuthUrl);
router.get('/github/auth-url', controller.getGitHubAuthUrl);
router.get('/:id/github/repos', validateRequest(ConnectorIdParamSchema), controller.listGitHubRepos);
router.post('/:id/github/select-repos', validateRequest(SelectGitHubReposSchema), controller.selectGitHubRepos);
router.post('/:id/github/sync', validateRequest(ConnectorIdParamSchema), controller.syncGitHub);
router.post('/connect', requireSuperAdmin, validateRequest(ConnectConnectorSchema), controller.connect);
router.post('/:id/sync', requireSuperAdmin, validateRequest(ConnectorIdParamSchema), controller.sync);
router.get('/:id/policies', validateRequest(ConnectorIdParamSchema), controller.getPolicies);
router.post('/:id/policies', validateRequest(ConnectorIdParamSchema), controller.savePolicy);
router.delete('/:id/policies/:policyId', controller.deletePolicy);
router.get('/:id', validateRequest(ConnectorIdParamSchema), controller.details);
router.get('/:id/errors', validateRequest(ConnectorIdParamSchema), controller.errors);
router.post('/:id/disconnect', requireSuperAdmin, validateRequest(ConnectorIdParamSchema), controller.disconnect);

export default router;