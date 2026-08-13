import { Request, Response, NextFunction } from 'express';
import { SuperAdminService } from '../../domain/security/SuperAdminService';
import { prisma } from '../../infrastructure/database/prisma';

/**
 * All Super Admin mutations are org-scoped: every method passes the acting
 * organization's id so a super admin token of org A can never mutate org B rows.
 * Every privileged change is audit-logged with actor, IP and user agent.
 */
export class SuperAdminController {
  constructor(private superAdminService: SuperAdminService) {}

  private async audit(req: Request, action: string, resourceId: string | null, details: any) {
    const organizationId = req.user!.organizationId;
    await prisma.auditLog.create({
      data: {
        organizationId,
        actorId: req.user!.id,
        action: action as any,
        resourceId: resourceId || undefined,
        ipAddress: req.ip || null,
        userAgent: (req.headers['user-agent'] as string | undefined)?.substring(0, 300) || null,
        metadata: details,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // ORGANIZATION
  // ---------------------------------------------------------------------------

  public getOrganizationHierarchy = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user?.organizationId!;
      const org = await this.superAdminService.getOrganizationHierarchy(orgId);
      res.json({ success: true, data: org });
    } catch (error) {
      next(error);
    }
  };

  // ---------------------------------------------------------------------------
  // ROLES
  // ---------------------------------------------------------------------------

  public createRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user?.organizationId!;
      const { name, description } = req.body;
      const role = await this.superAdminService.createRole(orgId, name, description);

      await this.audit(req, 'PERMISSION_GRANT', role.id, { action: 'ROLE_CREATED', name });

      res.status(201).json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  };

  public renameRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user?.organizationId!;
      const id = req.params.id as string;
      const { name } = req.body;
      const role = await this.superAdminService.renameRole(id, name, orgId);

      await this.audit(req, 'UPDATE', id, { action: 'ROLE_RENAMED', name });

      res.json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  };

  public deleteRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user?.organizationId!;
      const id = req.params.id as string;
      await this.superAdminService.deleteRole(id, orgId);

      await this.audit(req, 'DELETE', id, { action: 'ROLE_DELETED' });

      res.json({ success: true, message: 'Role deleted' });
    } catch (error) {
      next(error);
    }
  };

  public assignRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user?.organizationId!;
      const { userId, roleId } = req.body;
      await this.superAdminService.assignRoleToUser(userId, roleId, orgId);

      await this.audit(req, 'PERMISSION_GRANT', userId, { action: 'ROLE_ASSIGNED', roleId });

      res.json({ success: true, message: 'Role assigned' });
    } catch (error) {
      next(error);
    }
  };

  public removeRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user?.organizationId!;
      const { userId, roleId } = req.body;
      await this.superAdminService.removeRoleFromUser(userId, roleId, orgId);

      await this.audit(req, 'PERMISSION_REVOKE', userId, { action: 'ROLE_REMOVED', roleId });

      res.json({ success: true, message: 'Role removed' });
    } catch (error) {
      next(error);
    }
  };

  public getRoleUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user?.organizationId!;
      const id = req.params.id as string;
      const users = await this.superAdminService.getRoleUsers(id, orgId);
      res.json({
        success: true,
        data: users.map((u: any) => ({
          id: u.id,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          departmentId: u.departmentId,
        })),
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------------------------------------------------------------------------
  // DEPARTMENTS
  // ---------------------------------------------------------------------------

  public createDepartment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user?.organizationId!;
      const { name, description } = req.body;
      const dept = await this.superAdminService.createDepartment(orgId, name, description);

      await this.audit(req, 'CREATE', dept.id, { action: 'DEPARTMENT_CREATED', name });

      res.status(201).json({ success: true, data: dept });
    } catch (error) {
      next(error);
    }
  };

  public renameDepartment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user?.organizationId!;
      const id = req.params.id as string;
      const { name } = req.body;
      const dept = await this.superAdminService.renameDepartment(id, name, orgId);

      await this.audit(req, 'UPDATE', id, { action: 'DEPARTMENT_RENAMED', name });

      res.json({ success: true, data: dept });
    } catch (error) {
      next(error);
    }
  };

  public deleteDepartment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user?.organizationId!;
      const id = req.params.id as string;
      await this.superAdminService.deleteDepartment(id, orgId);

      await this.audit(req, 'DELETE', id, { action: 'DEPARTMENT_DELETED' });

      res.json({ success: true, message: 'Department deleted' });
    } catch (error) {
      next(error);
    }
  };

  public assignDepartment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user?.organizationId!;
      const { userId, departmentId } = req.body;
      await this.superAdminService.assignDepartment(userId, departmentId, orgId);

      await this.audit(req, 'UPDATE', userId, { action: 'DEPARTMENT_ASSIGNED', departmentId });

      res.json({ success: true, message: 'Department assigned' });
    } catch (error) {
      next(error);
    }
  };

  // ---------------------------------------------------------------------------
  // POLICIES
  // ---------------------------------------------------------------------------

  public updateResourcePolicy = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user?.organizationId!;
      const documentId = req.params.documentId as string;
      const {
        allowedRoles, deniedRoles,
        allowedUsers, deniedUsers,
        allowedDepartments, deniedDepartments,
      } = req.body;

      // Always write all six lists (undefined -> []) so a policy can be fully cleared
      await this.superAdminService.defineRoleAccess(documentId, allowedRoles || [], deniedRoles || [], orgId);
      await this.superAdminService.defineUserExceptions(documentId, allowedUsers || [], deniedUsers || [], orgId);
      await this.superAdminService.defineDepartmentAccess(documentId, allowedDepartments || [], deniedDepartments || [], orgId);

      await this.audit(req, 'PERMISSION_GRANT', documentId, {
        action: 'POLICY_UPDATED',
        allowedRoles, deniedRoles, allowedUsers, deniedUsers, allowedDepartments, deniedDepartments,
      });

      res.json({ success: true, message: 'Resource policy updated and propagated' });
    } catch (error) {
      next(error);
    }
  };
}