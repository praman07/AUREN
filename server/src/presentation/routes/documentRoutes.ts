import { Router } from 'express';
import { DocumentController } from '../controllers/DocumentController';
import { DocumentService } from '../../application/services/DocumentService';
import { validateRequest } from '../middlewares/validateRequest';
import { requireAuth } from '../middlewares/requireAuth';
import { CreateDocumentSchema, UpdateDocumentSchema, DocumentIdParamSchema, DocumentVersionFileParamSchema } from '../../application/dtos/DocumentDTOs';
import { DocumentRepository } from '../../infrastructure/repositories/DocumentRepository';
import { DocumentVersionRepository } from '../../infrastructure/repositories/DocumentVersionRepository';
import { AuditLogRepository } from '../../infrastructure/repositories/AuditLogRepository';
import { UnitOfWork } from '../../infrastructure/database/UnitOfWork';
import { UploadController } from '../controllers/UploadController';
import { UploadService } from '../../application/services/UploadService';
import { LocalStorageProvider } from '../../infrastructure/storage/LocalStorageProvider';
import { uploadMiddleware } from '../middlewares/uploadMiddleware';

const router = Router();
import { documentService, uploadService } from '../../di';

const documentControllerInstance = new DocumentController(documentService);
const uploadControllerInstance = new UploadController(uploadService);

// Apply auth middleware to all document routes
router.use(requireAuth);

router.post('/upload', uploadMiddleware.single('file'), uploadControllerInstance.uploadDocument);

router.get('/', documentControllerInstance.getDocuments);
router.get('/:id', validateRequest(DocumentIdParamSchema), documentControllerInstance.getDocumentById);
router.get('/:id/versions/:versionId/file', validateRequest(DocumentVersionFileParamSchema), documentControllerInstance.getDocumentFile);
router.post('/', validateRequest(CreateDocumentSchema), documentControllerInstance.createDocument);
router.delete('/', documentControllerInstance.deleteAllDocuments);
router.patch('/:id', validateRequest(UpdateDocumentSchema), documentControllerInstance.updateDocument);
router.delete('/:id', validateRequest(DocumentIdParamSchema), documentControllerInstance.deleteDocument);
router.post('/:id/restore', validateRequest(DocumentIdParamSchema), documentControllerInstance.restoreDocument);
router.post('/:id/reprocess', validateRequest(DocumentIdParamSchema), documentControllerInstance.reprocessDocument);

export default router;
