import { Request, Response } from 'express';
import { UserService } from '../../application/services/UserService';
import { InviteUserDTO } from '../../application/dtos/UserDTOs';

export class UserController {
  constructor(private readonly userService: UserService) {}

  getUsers = async (req: Request, res: Response): Promise<void> => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      res.status(401).json({ error: 'Organization context required' });
      return;
    }

    const users = await this.userService.getUsers(organizationId);
    res.status(200).json(users);
  };

  inviteUser = async (req: Request, res: Response): Promise<void> => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      res.status(401).json({ error: 'Organization context required' });
      return;
    }

    const data: InviteUserDTO = req.body;
    
    const user = await this.userService.createUser(
      organizationId,
      data.email,
      data.firstName,
      data.lastName,
      data.departmentId,
      data.roles
    );

    res.status(201).json(user);
  };

  deactivateUser = async (req: Request, res: Response): Promise<void> => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      res.status(401).json({ error: 'Organization context required' });
      return;
    }

    const userId = req.params.id as string;
    const user = await this.userService.deactivateUser(organizationId, userId);
    res.status(200).json(user);
  };

  reactivateUser = async (req: Request, res: Response): Promise<void> => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      res.status(401).json({ error: 'Organization context required' });
      return;
    }

    const userId = req.params.id as string;
    const user = await this.userService.reactivateUser(organizationId, userId);
    res.status(200).json(user);
  };
}
