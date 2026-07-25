import { Request, Response, NextFunction } from 'express';
import { UploadService } from '../../application/services/UploadService';
import { BaseException } from '../../domain/exceptions/BaseException';

export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  public uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new BaseException('No file uploaded', 400);
      }

      const orgId = req.user!.organizationId;
      const userId = req.user!.id;
      
      const result = await this.uploadService.processUpload(
        orgId,
        userId,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        req.file.size
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
  };
}
