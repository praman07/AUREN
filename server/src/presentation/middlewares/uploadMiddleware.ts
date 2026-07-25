import multer from 'multer';
import { BaseException } from '../../domain/exceptions/BaseException';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const allowedMimeTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown'
];

const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BaseException('Unsupported file type. Allowed: PDF, DOCX, TXT, MD', 400));
    }
  }
});
