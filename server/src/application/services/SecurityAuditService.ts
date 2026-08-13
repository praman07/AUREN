import { prisma } from '../../infrastructure/database/prisma';

export class SecurityAuditService {
  /**
   * Retrieves the full effective security policy for a specific document.
   */
  public async getDocumentPolicy(documentId: string, organizationId: string) {
    const doc = await prisma.document.findUnique({
      where: {
        id: documentId,
        organizationId: organizationId
      },
      include: {
        owner: {
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        department: {
          select: { id: true, name: true }
        }
      }
    });

    if (!doc) {
      throw new Error(`Document ${documentId} not found`);
    }

    // Resolve explicit users
    const allowedUsers = await prisma.user.findMany({
      where: { id: { in: doc.allowedUsers } },
      select: { id: true, email: true, firstName: true, lastName: true }
    });

    const deniedUsers = await prisma.user.findMany({
      where: { id: { in: doc.deniedUsers } },
      select: { id: true, email: true, firstName: true, lastName: true }
    });

    // Resolve explicit roles
    const allowedRoles = await prisma.role.findMany({
      where: { id: { in: doc.allowedRoles } },
      select: { id: true, name: true }
    });

    const deniedRoles = await prisma.role.findMany({
      where: { id: { in: doc.deniedRoles } },
      select: { id: true, name: true }
    });

    return {
      document: {
        id: doc.id,
        title: doc.title,
        classification: doc.classification,
        visibility: doc.visibility,
        sourceType: doc.sourceType,
        createdAt: doc.createdAt
      },
      policy: {
        owner: doc.owner,
        department: doc.department,
        allowedUsers,
        deniedUsers,
        allowedRoles,
        deniedRoles
      }
    };
  }

  public async logEvent(params: {
    actorId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: any
  }) {
    // Get organizationId from user
    const user = await prisma.user.findUnique({
      where: { id: params.actorId },
      select: { organizationId: true }
    });
    return prisma.auditLog.create({
      data: {
        organizationId: user?.organizationId || '',
        action: params.action as any,
        actorId: params.actorId,
        resourceId: params.resourceId,
        metadata: params.details
      }
    });
  }
}
