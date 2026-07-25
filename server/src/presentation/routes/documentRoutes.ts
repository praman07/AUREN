import { Router } from 'express';
import { DocumentController } from '../controllers/DocumentController';
import { DocumentService } from '../../application/services/DocumentService';
import { validateRequest } from '../middlewares/validateRequest';
import { requireAuth } from '../middlewares/requireAuth';
import { CreateDocumentSchema, UpdateDocumentSchema, DocumentIdParamSchema } from '../../application/dtos/DocumentDTOs';
import { DocumentRepository } from '../../infrastructure/repositories/DocumentRepository';
import { DocumentVersionRepository } from '../../infrastructure/repositories/DocumentVersionRepository';
import { AuditLogRepository } from '../../infrastructure/repositories/AuditLogRepository';
import { UnitOfWork } from '../../infrastructure/database/UnitOfWork';
import { UploadController } from '../controllers/UploadController';
import { UploadService } from '../../application/services/UploadService';
import { LocalStorageProvider } from '../../infrastructure/storage/LocalStorageProvider';
import { uploadMiddleware } from '../middlewares/uploadMiddleware';

// Mock Event Publisher
const mockEventPublisher = { publish: async (t: string, p: any) => console.log(`[Event] ${t}`, p) };

const router = Router();

// Dependency Injection Assembly
const documentRepository = new DocumentRepository();
const documentVersionRepository = new DocumentVersionRepository();
const auditLogRepository = new AuditLogRepository();
const unitOfWork = new UnitOfWork();
const storageProvider = new LocalStorageProvider();

const documentService = new DocumentService(documentRepository, auditLogRepository, unitOfWork, mockEventPublisher);
const uploadService = new UploadService(storageProvider, documentRepository, documentVersionRepository, auditLogRepository, unitOfWork, mockEventPublisher);

const documentController = new DocumentController(documentService);
const uploadController = new UploadController(uploadService);

// Apply auth middleware to all document routes
router.use(requireAuth);

router.post('/upload', uploadMiddleware.single('file'), uploadController.uploadDocument);

router.get('/', documentController.getDocuments);
router.get('/:id', validateRequest(DocumentIdParamSchema), documentController.getDocumentById);
router.post('/', validateRequest(CreateDocumentSchema), documentController.createDocument);
router.patch('/:id', validateRequest(UpdateDocumentSchema), documentController.updateDocument);
router.delete('/:id', validateRequest(DocumentIdParamSchema), documentController.deleteDocument);
router.post('/:id/restore', validateRequest(DocumentIdParamSchema), documentController.restoreDocument);

export default router;
