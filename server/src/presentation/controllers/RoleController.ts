import { Request, Response } from 'express';
import { RoleService } from '../../application/services/RoleService';
import { TogglePermissionDTO } from '../../application/dtos/RoleDTOs';

export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  getRoles = async (req: Request, res: Response): Promise<void> => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      res.status(401).json({ error: 'Organization context required' });
      return;
    }

    const roles = await this.roleService.getRoles(organizationId);
    res.status(200).json(roles);
  };

  togglePermission = async (req: Request, res: Response): Promise<void> => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      res.status(401).json({ error: 'Organization context required' });
      return;
    }

    const roleId = req.params.id as string;
    const data: TogglePermissionDTO = req.body;

    const role = await this.roleService.togglePermission(
      organizationId,
      roleId,
      data.permission,
      data.enabled
    );

    res.status(200).json(role);
  };
}
