import { Request, Response, NextFunction } from 'express';
import { OnboardingService } from '../../application/services/OnboardingService';
import { IndustryTemplateService } from '../../domain/templates/IndustryTemplateService';
import { OnboardOrganizationSchema } from '../../application/dtos/OnboardingDTOs';

export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  public onboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = OnboardOrganizationSchema.parse({ body: req.body });
      const ipAddress = req.ip || undefined;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const result = await this.onboardingService.onboardOrganization(parsed.body, ipAddress, userAgent);

      if (result.session?.token) {
        res.cookie('session_token', result.session.token, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 3600 * 1000,
        });
      }

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  public getIndustryTemplates = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const templates = IndustryTemplateService.listAllTemplates();
      res.status(200).json({
        success: true,
        data: templates
      });
    } catch (error) {
      next(error);
    }
  };
}
