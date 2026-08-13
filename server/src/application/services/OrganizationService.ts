import { prisma } from '../../infrastructure/database/prisma';

export class OrganizationService {
  public async getOrganization(organizationId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: {
            users: true,
            departments: true,
            documents: true,
          },
        },
      },
    });
    if (!org) {
      const err: any = new Error('Organization not found');
      err.statusCode = 404;
      throw err;
    }
    return org;
  }

  public async updateOrganization(organizationId: string, data: { name?: string; domain?: string; industry?: string }) {
    return prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.domain ? { domain: data.domain } : {}),
        ...(data.industry ? { industry: data.industry as any } : {}),
      },
    });
  }

  public async getMembers(organizationId: string) {
    return prisma.user.findMany({
      where: { organizationId },
      include: {
        department: true,
        userRoles: {
          include: { role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
