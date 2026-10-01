import multer from 'multer';
import { BaseException } from '../../domain/exceptions/BaseException';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const allowedMimeTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'text/plain',
  'text/markdown',
  'text/csv',
  'text/html',
  'application/json',
  'application/xml',
  'text/xml',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/svg+xml',
  'application/octet-stream'
];

const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    const ext = file.originalname ? file.originalname.split('.').pop()?.toLowerCase() : '';
    const isValidExt = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'txt', 'md', 'csv', 'json', 'xml', 'html', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'svg'].includes(ext || '');

    if (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('text/') || isValidExt) {
      cb(null, true);
    } else {
      cb(new BaseException('Unsupported file type. Allowed: PDF, DOCX, DOC, XLSX, PPTX, TXT, MD, CSV, JSON, XML, Images', 400));
    }
  }
});
