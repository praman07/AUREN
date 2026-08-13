import { Router } from 'express';
import { SuperAdminController } from '../controllers/SuperAdminController';
import { requireAuth } from '../middlewares/requireAuth';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin';
import { validateRequest } from '../middlewares/validateRequest';
import { PrismaClient } from '@prisma/client';
import { SuperAdminService } from '../../domain/security/SuperAdminService';
import {
  CreateRoleSchema,
  RenameRoleSchema,
  DeleteRoleSchema,
  AssignRoleSchema,
  RemoveRoleSchema,
  RoleIdParamSchema,
  CreateDepartmentSchema,
  RenameDepartmentSchema,
  DeleteDepartmentSchema,
  AssignDepartmentSchema,
  UpdateResourcePolicySchema,
} from '../../application/dtos/SuperAdminDTOs';

export const createSuperAdminRoutes = (prisma: PrismaClient = new PrismaClient()): Router => {
  const router = Router();
  const controller = new SuperAdminController(new SuperAdminService(prisma));

  // All routes require authentication and Super Admin privileges
  router.use(requireAuth);
  router.use(requireSuperAdmin);

  // Organization
  router.get('/organization/hierarchy', controller.getOrganizationHierarchy);

  // Roles
  router.post('/roles', validateRequest(CreateRoleSchema), controller.createRole);
  router.put('/roles/:id', validateRequest(RenameRoleSchema), controller.renameRole);
  router.delete('/roles/:id', validateRequest(DeleteRoleSchema), controller.deleteRole);
  router.post('/roles/assign', validateRequest(AssignRoleSchema), controller.assignRole);
  router.post('/roles/remove', validateRequest(RemoveRoleSchema), controller.removeRole);
  router.get('/roles/:id/users', validateRequest(RoleIdParamSchema), controller.getRoleUsers);

  // Departments
  router.post('/departments', validateRequest(CreateDepartmentSchema), controller.createDepartment);
  router.put('/departments/:id', validateRequest(RenameDepartmentSchema), controller.renameDepartment);
  router.delete('/departments/:id', validateRequest(DeleteDepartmentSchema), controller.deleteDepartment);
  router.post('/departments/assign', validateRequest(AssignDepartmentSchema), controller.assignDepartment);

  // Policies
  router.put('/documents/:documentId/policy', validateRequest(UpdateResourcePolicySchema), controller.updateResourcePolicy);

  return router;
};

export default createSuperAdminRoutes;