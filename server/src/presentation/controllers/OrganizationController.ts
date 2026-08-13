import { Request, Response, NextFunction } from 'express';
import { OrganizationService } from '../../application/services/OrganizationService';
import { UserService } from '../../application/services/UserService';
import { toPublicUser } from '../../application/dtos/UserDTOs';

export class OrganizationController {
  constructor(
    private readonly orgService: OrganizationService,
    private readonly userService: UserService
  ) {}

  public getOrganization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.user!.organizationId;
      const org = await this.orgService.getOrganization(orgId);
      res.status(200).json({ success: true, data: org });
    } catch (error) {
      next(error);
    }
  };

  public updateSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.user!.organizationId;
      const { name, domain, industry } = req.body;
      const updated = await this.orgService.updateOrganization(orgId, { name, domain, industry });
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  };

  public getMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.user!.organizationId;
      const members = await this.orgService.getMembers(orgId);
      res.status(200).json({ success: true, data: members.map(toPublicUser) });
    } catch (error) {
      next(error);
    }
  };

  public inviteMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.user!.organizationId;
      const data = req.body;
      const user = await this.userService.createUser(
        orgId,
        {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          departmentId: data.departmentId,
          roles: data.roles,
          password: data.password,
          isSuperAdmin: data.isSuperAdmin,
        },
        req.user!.id
      );
      res.status(201).json({ success: true, data: toPublicUser(user) });
    } catch (error) {
      next(error);
    }
  };

  public updateMemberStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.user!.organizationId;
      const memberId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { active } = req.body;

      const user = active
        ? await this.userService.reactivateUser(orgId, memberId, req.user!.id)
        : await this.userService.deactivateUser(orgId, memberId, req.user!.id);

      res.status(200).json({ success: true, data: toPublicUser(user) });
    } catch (error) {
      next(error);
    }
  };
}
