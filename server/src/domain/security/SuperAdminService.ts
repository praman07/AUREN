import { PrismaClient, Role, User, Department, Document } from '@prisma/client';

export class SuperAdminService {
  constructor(private prisma: PrismaClient) {}

  // ---------------------------------------------------------------------------
  // ROLE MANAGEMENT
  // ---------------------------------------------------------------------------

  async createRole(organizationId: string, name: string, description?: string): Promise<Role> {
    return this.prisma.role.create({
      data: {
        organizationId,
        name,
        description
      }
    });
  }

  async renameRole(roleId: string, newName: string, organizationId?: string): Promise<Role> {
    if (organizationId) {
      const role = await this.prisma.role.findUnique({ where: { id: roleId }, select: { organizationId: true } });
      if (!role || role.organizationId !== organizationId) {
        throw new Error('Role not found in this organization');
      }
    }
    return this.prisma.role.update({
      where: { id: roleId },
      data: { name: newName }
    });
  }

  async deleteRole(roleId: string, organizationId?: string): Promise<void> {
    if (organizationId) {
      const role = await this.prisma.role.findUnique({ where: { id: roleId }, select: { organizationId: true } });
      if (!role || role.organizationId !== organizationId) {
        throw new Error('Role not found in this organization');
      }
    }
    await this.prisma.role.delete({
      where: { id: roleId }
    });
  }

  async assignRoleToUser(userId: string, roleId: string, organizationId?: string): Promise<void> {
    if (organizationId) {
      const [user, role] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: userId }, select: { organizationId: true } }),
        this.prisma.role.findUnique({ where: { id: roleId }, select: { organizationId: true } })
      ]);
      if (!user || user.organizationId !== organizationId || !role || role.organizationId !== organizationId) {
        throw new Error('User or Role not found in this organization');
      }
    }
    await this.prisma.userRole.upsert({
      where: {
        userId_roleId: { userId, roleId }
      },
      update: {},
      create: { userId, roleId }
    });
  }

  async removeRoleFromUser(userId: string, roleId: string, organizationId?: string): Promise<void> {
    if (organizationId) {
      const [user, role] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: userId }, select: { organizationId: true } }),
        this.prisma.role.findUnique({ where: { id: roleId }, select: { organizationId: true } })
      ]);
      if (!user || user.organizationId !== organizationId || !role || role.organizationId !== organizationId) {
        throw new Error('User or Role not found in this organization');
      }
    }
    await this.prisma.userRole.delete({
      where: {
        userId_roleId: { userId, roleId }
      }
    });
  }

  async getRoleUsers(roleId: string, organizationId?: string): Promise<User[]> {
    if (organizationId) {
      const role = await this.prisma.role.findUnique({ where: { id: roleId }, select: { organizationId: true } });
      if (!role || role.organizationId !== organizationId) {
        throw new Error('Role not found in this organization');
      }
    }
    const userRoles = await this.prisma.userRole.findMany({
      where: { roleId },
      include: { user: true }
    });
    return userRoles.map(ur => ur.user);
  }

  // ---------------------------------------------------------------------------
  // DEPARTMENT & DESIGNATION
  // ---------------------------------------------------------------------------

  async createDepartment(organizationId: string, name: string, description?: string): Promise<Department> {
    return this.prisma.department.create({
      data: {
        organizationId,
        name,
        description
      }
    });
  }

  async assignDepartment(userId: string, departmentId: string, organizationId?: string): Promise<User> {
    if (organizationId) {
      const [user, dept] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: userId }, select: { organizationId: true } }),
        this.prisma.department.findUnique({ where: { id: departmentId }, select: { organizationId: true } })
      ]);
      if (!user || user.organizationId !== organizationId || !dept || dept.organizationId !== organizationId) {
        throw new Error('User or Department not found in this organization');
      }
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { departmentId }
    });
  }

  async renameDepartment(departmentId: string, newName: string, organizationId?: string): Promise<Department> {
    if (organizationId) {
      const dept = await this.prisma.department.findUnique({ where: { id: departmentId }, select: { organizationId: true } });
      if (!dept || dept.organizationId !== organizationId) {
        throw new Error('Department not found in this organization');
      }
    }
    return this.prisma.department.update({
      where: { id: departmentId },
      data: { name: newName }
    });
  }

  async deleteDepartment(departmentId: string, organizationId?: string): Promise<void> {
    if (organizationId) {
      const dept = await this.prisma.department.findUnique({ where: { id: departmentId }, select: { organizationId: true } });
      if (!dept || dept.organizationId !== organizationId) {
        throw new Error('Department not found in this organization');
      }
    }
    await this.prisma.department.delete({
      where: { id: departmentId }
    });
  }

  async getDepartmentMembers(departmentId: string): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { departmentId }
    });
  }

  // ---------------------------------------------------------------------------
  // ORGANIZATION
  // ---------------------------------------------------------------------------

  async getOrganizationHierarchy(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        departments: {
          include: { users: true }
        },
        users: {
          include: { userRoles: { include: { role: true } } }
        },
        roles: true,
      }
    });
    return org;
  }

  // ---------------------------------------------------------------------------
  // RESOURCE POLICIES (OVERRIDES & EXPLICIT RULES)
  // ---------------------------------------------------------------------------

  async defineRoleAccess(documentId: string, allowedRoles: string[], deniedRoles: string[], organizationId?: string): Promise<Document> {
    if (organizationId) {
      await this.assertDocumentInOrganization(documentId, organizationId);
    }
    const doc = await this.prisma.document.update({
      where: { id: documentId },
      data: {
        allowedRoles,
        deniedRoles
      }
    });
    await this.propagatePolicyToQdrant(documentId);
    return doc;
  }

  async defineUserExceptions(documentId: string, allowedUsers: string[], deniedUsers: string[], organizationId?: string): Promise<Document> {
    if (organizationId) {
      await this.assertDocumentInOrganization(documentId, organizationId);
    }
    const doc = await this.prisma.document.update({
      where: { id: documentId },
      data: {
        allowedUsers,
        deniedUsers
      }
    });
    await this.propagatePolicyToQdrant(documentId);
    return doc;
  }

  async defineDepartmentAccess(documentId: string, allowedDepartments: string[], deniedDepartments: string[], organizationId?: string): Promise<Document> {
    if (organizationId) {
      await this.assertDocumentInOrganization(documentId, organizationId);
    }
    const doc = await this.prisma.document.update({
      where: { id: documentId },
      data: {
        allowedDepartments,
        deniedDepartments
      }
    });
    await this.propagatePolicyToQdrant(documentId);
    return doc;
  }

  private async assertDocumentInOrganization(documentId: string, organizationId: string): Promise<void> {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: { organizationId: true }
    });
    if (!doc || doc.organizationId !== organizationId) {
      throw new Error('Document not found in this organization');
    }
  }

  private async propagatePolicyToQdrant(documentId: string): Promise<void> {
    // Note: We use QdrantClient here to update payloads for all chunks of this document
    const { QdrantClient } = require('@qdrant/js-client-rest');
    const qdrant = new QdrantClient({ url: process.env.QDRANT_URL || 'http://localhost:6333' });
    
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { versions: { include: { chunks: true } } }
    });

    if (!doc) return;

    const collectionName = `org_${doc.organizationId.replace(/[^a-zA-Z0-9]/g, '_')}_docs`;

    for (const version of doc.versions) {
      for (const chunk of version.chunks) {
        if (chunk.qdrantPointId) {
          try {
            await qdrant.setPayload(collectionName, {
              points: [chunk.qdrantPointId],
              payload: {
                allowedRoles: doc.allowedRoles,
                allowedUsers: doc.allowedUsers,
                allowedDepartments: doc.allowedDepartments,
                deniedRoles: doc.deniedRoles,
                deniedUsers: doc.deniedUsers,
                deniedDepartments: doc.deniedDepartments
              }
            });
          } catch (error) {
            console.error(`Failed to propagate policy for chunk ${chunk.id}`, error);
          }
        }
      }
    }
  }
}
