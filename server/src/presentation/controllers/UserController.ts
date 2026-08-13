import { Request, Response, NextFunction } from 'express';
import { UserService } from '../../application/services/UserService';
import { toPublicUser } from '../../application/dtos/UserDTOs';

export class UserController {
  constructor(private readonly userService: UserService) {}

  getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({ success: false, error: 'Organization context required' });
        return;
      }

      const users = await this.userService.getUsers(organizationId);
      // Redact password hashes and other secrets from API responses
      res.status(200).json({ success: true, data: users.map(toPublicUser) });
    } catch (error) {
      next(error);
    }
  };

  inviteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({ success: false, error: 'Organization context required' });
        return;
      }

      const data = req.body;

      const user = await this.userService.createUser(
        organizationId,
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

  deactivateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({ success: false, error: 'Organization context required' });
        return;
      }

      const userId = req.params.id as string;
      const user = await this.userService.deactivateUser(organizationId, userId, req.user!.id);
      res.status(200).json({ success: true, data: toPublicUser(user) });
    } catch (error) {
      next(error);
    }
  };

  reactivateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({ success: false, error: 'Organization context required' });
        return;
      }

      const userId = req.params.id as string;
      const user = await this.userService.reactivateUser(organizationId, userId, req.user!.id);
      res.status(200).json({ success: true, data: toPublicUser(user) });
    } catch (error) {
      next(error);
    }
  };
}