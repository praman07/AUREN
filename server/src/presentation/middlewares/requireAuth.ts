import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../application/services/AuthService';

// Extends Request to include user context
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        organizationId: string;
        industry: string;
        role: string;
        roles: string[];
        departments: string[];
        departmentId: string | null;
        isSuperAdmin: boolean;
      };
    }
  }
}

const authService = new AuthService();

export const extractBearerToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1]?.trim() || null;
  }
  const cookieToken = (req as any).cookies?.session_token;
  if (typeof cookieToken === 'string' && cookieToken.length > 0) {
    return cookieToken;
  }
  return null;
};

/**
 * First-party session authentication.
 * Resolves the bearer token (or session_token cookie) to a live Session row,
 * derives the server-side user context (organization, roles, departments,
 * super-admin flag), and attaches it to req.user.
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ success: false, error: 'Unauthorized: No session token provided' });
    return;
  }

  try {
    const user = await authService.resolveSession(token);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired session' });
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired session' });
  }
};