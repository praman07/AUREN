import { Request, Response, NextFunction } from 'express';
import { IRetrievalEngine } from '../../application/services/RetrievalEngine';
import { SemanticSearchSchema } from '../../application/dtos/SemanticSearchDTO';

export class SemanticSearchController {
  constructor(private readonly retrievalEngine: IRetrievalEngine) {}

  public search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Validate Payload
      const validatedData = SemanticSearchSchema.parse(req.body);

      // 2. Extract context from authenticated user (set by requireAuth middleware)
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      // 3. Map to SearchRequest
      const searchRequest = {
        query: validatedData.query,
        organizationId: user.organizationId,
        userId: user.id,
        departmentIds: validatedData.departmentIds.length > 0 
          ? validatedData.departmentIds 
          : user.departments || [], // Use explicit departments or user's allowed departments
        limit: validatedData.limit,
        filters: validatedData.filters
      };

      // 4. Execute Search
      const searchResponse = await this.retrievalEngine.search(searchRequest);

      // 5. Return Response
      res.status(200).json({
        success: true,
        data: searchResponse
      });

    } catch (error: any) {
      if (error.name === 'ZodError') {
         res.status(400).json({ success: false, error: error.errors });
         return;
      }
      next(error);
    }
  };
}
