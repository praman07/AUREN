import { Request, Response, NextFunction } from 'express';
import { BaseException } from '../../domain/exceptions/BaseException';

// Extends Request to include user context
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; organizationId: string; role: string };
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // In a real app, this validates the JWT from Clerk and fetches the User from DB.
  // For the vertical slice implementation without full auth wiring yet:
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'Unauthorized: No token provided' });
  }
  
  // MOCK: Assuming the token itself is JSON containing user details for dev
  try {
    const mockUser = JSON.parse(Buffer.from(authHeader.split(' ')[1], 'base64').toString());
    req.user = mockUser;
    next();
  } catch (error) {
    req.user = { id: 'mock-user-id', organizationId: 'mock-org-id', role: 'MEMBER' };
    next();
  }
};
