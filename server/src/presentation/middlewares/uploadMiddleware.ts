import multer from 'multer';
import { BaseException } from '../../domain/exceptions/BaseException';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const allowedMimeTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'text/csv',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/svg+xml'
];

const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new BaseException('Unsupported file type. Allowed: PDF, DOCX, TXT, MD, CSV, Images (PNG, JPG, WEBP, GIF, BMP, TIFF, SVG)', 400));
    }
  }
});
