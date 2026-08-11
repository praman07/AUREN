import { Request, Response } from 'express';
import { DepartmentService } from '../../application/services/DepartmentService';
import { CreateDepartmentDTO, UpdateDepartmentDTO } from '../../application/dtos/DepartmentDTOs';

export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  getDepartments = async (req: Request, res: Response): Promise<void> => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      res.status(401).json({ error: 'Organization context required' });
      return;
    }

    const departments = await this.departmentService.getDepartments(organizationId);
    res.status(200).json(departments);
  };

  createDepartment = async (req: Request, res: Response): Promise<void> => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      res.status(401).json({ error: 'Organization context required' });
      return;
    }

    const data: CreateDepartmentDTO = req.body;
    
    const dept = await this.departmentService.createDepartment(
      organizationId,
      data.name,
      data.description
    );

    res.status(201).json(dept);
  };

  updateDepartment = async (req: Request, res: Response): Promise<void> => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      res.status(401).json({ error: 'Organization context required' });
      return;
    }

    const deptId = req.params.id as string;
    const data: UpdateDepartmentDTO = req.body;
    const dept = await this.departmentService.updateDepartment(organizationId, deptId, data);
    res.status(200).json(dept);
  };

  archiveDepartment = async (req: Request, res: Response): Promise<void> => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      res.status(401).json({ error: 'Organization context required' });
      return;
    }

    const deptId = req.params.id as string;
    await this.departmentService.archiveDepartment(organizationId, deptId);
    res.status(204).send();
  };

  restoreDepartment = async (req: Request, res: Response): Promise<void> => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      res.status(401).json({ error: 'Organization context required' });
      return;
    }

    const deptId = req.params.id as string;
    await this.departmentService.restoreDepartment(organizationId, deptId);
    res.status(204).send();
  };
}
