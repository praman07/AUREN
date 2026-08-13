import * as crypto from 'crypto';
import { prisma } from '../../infrastructure/database/prisma';
import { PasswordService } from '../../shared/security/password';
import { env } from '../../shared/config/env';
import { PublicUserView } from '../dtos/AuthDTOs';

export class AuthService {
  public static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  public static toPublicUser(user: any): PublicUserView {
    const roles: string[] = (user.userRoles || []).map((ur: any) => ur.role.id);
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      organizationId: user.organizationId,
      industry: user.organization?.industry || 'CORPORATE',
      departmentId: user.departmentId,
      departments: user.departmentId ? [user.departmentId] : [],
      role: roles.length > 0 ? user.userRoles[0].role.name : 'MEMBER',
      roles,
      isSuperAdmin: user.isSuperAdmin,
    };
  }

  /**
   * Logs a user in with their first-party session credentials.
   * On success: creates a revocable Session row and returns a bearer token.
   */
  public async login(email: string, password: string, ipAddress?: string, userAgent?: string): Promise<{ token: string; user: PublicUserView } | null> {
    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase().trim(), deletedAt: null },
      include: {
        userRoles: { include: { role: true } },
        organization: true,
      },
    });

    // Same error for unknown user and wrong password — no account enumeration.
    if (!user || !user.passwordHash || !PasswordService.verify(password, user.passwordHash)) {
      return null;
    }

    const token = crypto.randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + env.SESSION_TTL_HOURS * 3600 * 1000);

    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: AuthService.hashToken(token),
        expiresAt,
        ipAddress: ipAddress || null,
        userAgent: userAgent ? userAgent.substring(0, 300) : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        actorId: user.id,
        action: 'LOGIN',
        ipAddress: ipAddress || null,
        userAgent: userAgent ? userAgent.substring(0, 300) : null,
        metadata: { method: 'session' },
      },
    });

    return { token, user: AuthService.toPublicUser(user) };
  }

  public async logout(token: string, ipAddress?: string, userAgent?: string): Promise<boolean> {
    const tokenHash = AuthService.hashToken(token);
    const session = await prisma.session.findUnique({ where: { tokenHash } });
    if (!session) return false;

    await prisma.auditLog.create({
      data: {
        organizationId: (await prisma.user.findUnique({ where: { id: session.userId }, select: { organizationId: true } }))?.organizationId || '',
        actorId: session.userId,
        action: 'LOGOUT',
        ipAddress: ipAddress || null,
        userAgent: userAgent ? userAgent.substring(0, 300) : null,
      },
    });

    await prisma.session.delete({ where: { id: session.id } });
    return true;
  }

  public async revokeAllSessions(userId: string, exceptTokenHash?: string): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: { userId, ...(exceptTokenHash ? { NOT: { tokenHash: exceptTokenHash } } : {}) },
    });
    return result.count;
  }

  public async resolveSession(token: string): Promise<PublicUserView | null> {
    const tokenHash = AuthService.hashToken(token);
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            userRoles: { include: { role: true } },
            organization: true,
          },
        },
      },
    });

    if (!session || !session.user || session.user.deletedAt) return null;
    if (session.expiresAt.getTime() < Date.now()) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    return AuthService.toPublicUser(session.user);
  }
}