import { prisma } from '../../infrastructure/database/prisma';
import { PasswordService } from '../../shared/security/password';
import { AuthService } from './AuthService';
import { IndustryTemplateService } from '../../domain/templates/IndustryTemplateService';
import { OnboardOrganizationInput } from '../dtos/OnboardingDTOs';

export class OnboardingService {
  private templateService = new IndustryTemplateService();
  private authService = new AuthService();

  public async onboardOrganization(input: OnboardOrganizationInput, ipAddress?: string, userAgent?: string) {
    const { orgName, domain, industry, superAdmin, customDepartments, customRoles, initialMembers } = input;

    // 1. Check existing superAdmin email
    const existingUser = await prisma.user.findFirst({
      where: { email: superAdmin.email.toLowerCase().trim() }
    });
    if (existingUser) {
      const err: any = new Error('An account with this email address already exists.');
      err.statusCode = 400;
      throw err;
    }

    // 2. Check domain uniqueness if supplied
    if (domain && domain.trim()) {
      const existingOrg = await prisma.organization.findUnique({
        where: { domain: domain.toLowerCase().trim() }
      });
      if (existingOrg) {
        const err: any = new Error('An organization with this domain already exists.');
        err.statusCode = 400;
        throw err;
      }
    }

    const cleanDomain = domain ? domain.toLowerCase().trim() : `${orgName.toLowerCase().replace(/[^a-z0-9]/g, '')}.auren.app`;
    const passwordHash = PasswordService.hash(superAdmin.password);

    // Run transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create Organization
      const org = await tx.organization.create({
        data: {
          name: orgName.trim(),
          domain: cleanDomain,
          industry: industry || 'CORPORATE'
        }
      });

      // Apply Industry Template (departments & roles)
      const { departments, roles } = await this.templateService.applyTemplateToOrganization(
        tx,
        org.id,
        industry || 'CORPORATE'
      );

      // Create Custom Departments if requested
      if (customDepartments && customDepartments.length > 0) {
        for (const name of customDepartments) {
          if (name.trim()) {
            const dept = await tx.department.upsert({
              where: { organizationId_name: { organizationId: org.id, name: name.trim() } },
              update: {},
              create: { organizationId: org.id, name: name.trim() }
            });
            if (!departments.some(d => d.id === dept.id)) departments.push(dept);
          }
        }
      }

      // Create Custom Roles if requested
      if (customRoles && customRoles.length > 0) {
        for (const name of customRoles) {
          if (name.trim()) {
            const role = await tx.role.upsert({
              where: { organizationId_name: { organizationId: org.id, name: name.trim() } },
              update: {},
              create: { organizationId: org.id, name: name.trim() }
            });
            if (!roles.some(r => r.id === role.id)) roles.push(role);
          }
        }
      }

      // Pick primary admin role and department
      const primaryRole = roles.find(r => r.isSystem) || roles[0];
      const primaryDepartment = departments[0];

      // Create Super Admin User
      const adminUser = await tx.user.create({
        data: {
          organizationId: org.id,
          departmentId: primaryDepartment?.id || null,
          email: superAdmin.email.toLowerCase().trim(),
          firstName: superAdmin.firstName.trim(),
          lastName: superAdmin.lastName.trim(),
          passwordHash,
          isSuperAdmin: true
        }
      });

      // Bind Super Admin to Primary Role
      if (primaryRole) {
        await tx.userRole.create({
          data: {
            userId: adminUser.id,
            roleId: primaryRole.id
          }
        });
      }

      // Create Initial Members if provided
      const createdMembers: any[] = [];
      if (initialMembers && initialMembers.length > 0) {
        for (const m of initialMembers) {
          if (m.email && m.email.trim()) {
            const memberHash = m.password ? PasswordService.hash(m.password) : PasswordService.hash('WelcomeAuren2026!');
            const targetRole = roles.find(r => r.name.toLowerCase() === (m.roleName || '').toLowerCase()) || roles[roles.length - 1];
            const targetDept = departments.find(d => d.name.toLowerCase() === (m.departmentName || '').toLowerCase()) || primaryDepartment;

            const member = await tx.user.create({
              data: {
                organizationId: org.id,
                departmentId: targetDept?.id || null,
                email: m.email.toLowerCase().trim(),
                firstName: m.firstName?.trim() || 'Team',
                lastName: m.lastName?.trim() || 'Member',
                passwordHash: memberHash,
                isSuperAdmin: false
              }
            });

            if (targetRole) {
              await tx.userRole.create({
                data: { userId: member.id, roleId: targetRole.id }
              });
            }

            createdMembers.push(member);
          }
        }
      }

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          organizationId: org.id,
          actorId: adminUser.id,
          action: 'CREATE',
          metadata: { type: 'ORGANIZATION_ONBOARDED', industry: org.industry }
        }
      });

      return { org, adminUser, departments, roles, createdMembers };
    });

    // Create session token for the Super Admin
    const loginResult = await this.authService.login(superAdmin.email, superAdmin.password, ipAddress, userAgent);

    return {
      organization: result.org,
      departments: result.departments,
      roles: result.roles,
      superAdmin: AuthService.toPublicUser(result.adminUser),
      session: loginResult
    };
  }
}
