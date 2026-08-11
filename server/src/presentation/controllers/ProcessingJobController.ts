import { Request, Response } from 'express';
import { ProcessingJobService } from '../../application/services/ProcessingJobService';
import { ProcessingJobQueryDTO } from '../../application/dtos/ProcessingJobDTOs';

export class ProcessingJobController {
  constructor(private readonly processingJobService: ProcessingJobService) {}

  getJobs = async (req: Request, res: Response): Promise<void> => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      res.status(401).json({ error: 'Organization context required' });
      return;
    }

    const query = req.query as unknown as ProcessingJobQueryDTO;
    
    const jobs = await this.processingJobService.getJobs(organizationId, query);
    res.status(200).json(jobs);
  };
}
