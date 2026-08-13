import { Request, Response, NextFunction } from 'express';
import { DocumentService } from '../../application/services/DocumentService';
import { AccessSubject } from '../../domain/security/DocumentAccessPolicy';

export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  private requester(req: Request): AccessSubject {
    return {
      id: req.user!.id,
      organizationId: req.user!.organizationId,
      roles: req.user!.roles,
      departments: req.user!.departments,
      isSuperAdmin: req.user!.isSuperAdmin,
    };
  }

  public getDocuments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : 0;
      const take = req.query.take ? parseInt(req.query.take as string, 10) : 50;

      const docs = await this.documentService.getDocuments(this.requester(req), skip, take);
      res.status(200).json({ success: true, data: docs });
    } catch (error) { next(error); }
  };

  public getDocumentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doc = await this.documentService.getDocumentById(req.params.id as string, this.requester(req));
      res.status(200).json({ success: true, data: doc });
    } catch (error) { next(error); }
  };

  public createDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doc = await this.documentService.createDocument(
        this.requester(req),
        req.body
      );
      res.status(201).json({ success: true, data: doc });
    } catch (error) { next(error); }
  };

  public updateDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doc = await this.documentService.updateDocument(
        req.params.id as string,
        this.requester(req),
        req.body
      );
      res.status(200).json({ success: true, data: doc });
    } catch (error) { next(error); }
  };

  public deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.documentService.deleteDocument(req.params.id as string, this.requester(req));
      res.status(204).send();
    } catch (error) { next(error); }
  };

  public restoreDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doc = await this.documentService.restoreDocument(req.params.id as string, this.requester(req));
      res.status(200).json({ success: true, data: doc });
    } catch (error) { next(error); }
  };
}