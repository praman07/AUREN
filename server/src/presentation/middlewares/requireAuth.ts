import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ClerkExpressWithAuth, LooseAuthProp } from '@clerk/clerk-sdk-node';
import { env } from '../../shared/config/env';

const prisma = new PrismaClient();

// Extends Request to include user context
declare global {
  namespace Express {
    interface Request extends LooseAuthProp {
      user?: { 
        id: string; 
        organizationId: string;
        industry: string;
        role: string; 
        departments: string[];
        clearanceLevel: string;
      };
    }
  }
}

export const requireAuth = [
  // First, let Clerk try to authenticate the request.
  // It populates req.auth if successful, but doesn't throw if not (WithAuth).
  ClerkExpressWithAuth(),
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Unauthorized: No token provided' });
      return;
    }
    
    const token = authHeader.split(' ')[1];

    try {
      let clerkUserId: string | null = null;
      let email: string | null = null;

      if (env.NODE_ENV !== 'production' && env.DEV_AUTH_MOCK === 'true') {
        // Development mode override to allow local testing without valid Clerk keys.
        try {
          const payloadBase64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
          clerkUserId = payload.sub;
          email = payload.email || payload.primary_email_address || null;
        } catch (err) {
          res.status(401).json({ success: false, error: 'Unauthorized: Invalid token format' });
          return;
        }
      } else {
        // Production JWT verification relies on ClerkExpressWithAuth
        if (!req.auth || !req.auth.userId) {
          res.status(401).json({ success: false, error: 'Unauthorized: Invalid token claims' });
          return;
        }
        clerkUserId = req.auth.userId;
      }

      if (!clerkUserId) {
        res.status(401).json({ success: false, error: 'Unauthorized: Missing user ID' });
        return;
      }

      // Lookup local User by provider ID (clerkUserId)
      let user = await prisma.user.findUnique({
        where: { clerkUserId },
        include: {
          userRoles: { include: { role: true } },
          organization: true,
        }
      });

      // Fallback: Link seeded user if matched by email
      if (!user && email) {
        user = await prisma.user.findFirst({
          where: { email },
          include: {
            userRoles: { include: { role: true } },
            organization: true,
          }
        });

        if (user) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { clerkUserId },
            include: {
              userRoles: { include: { role: true } },
              organization: true,
            }
          });
        }
      }

      if (!user) {
        res.status(403).json({ success: false, error: 'Forbidden: User not found in EKOS local database' });
        return;
      }

      // Construct server-derived req.user
      req.user = {
        id: user.id,
        organizationId: user.organizationId,
        industry: user.organization.industry,
        role: user.userRoles[0]?.role.name || 'MEMBER',
        departments: user.departmentId ? [user.departmentId] : [],
        clearanceLevel: user.clearanceLevel
      };
      
      next();
    } catch (error: any) {
      console.error('Authentication Error:', error.message);
      res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token' });
    }
  }
] as any;
