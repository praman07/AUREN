import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../application/services/AuthService';
import { LoginSchema } from '../../application/dtos/AuthDTOs';
import { extractBearerToken } from '../middlewares/requireAuth';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = LoginSchema.parse({ body: req.body });
      const { email, password } = parsed.body;

      const ipAddress = req.ip || undefined;
      const userAgent = req.headers['user-agent'] as string | undefined;

      const result = await this.authService.login(email, password, ipAddress, userAgent);
      if (!result) {
        res.status(401).json({ success: false, error: 'Invalid email or password' });
        return;
      }

      // Also expose the token as an httpOnly cookie for cookie-based clients.
      res.cookie('session_token', result.token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 3600 * 1000,
      });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = extractBearerToken(req);
      if (!token) {
        res.status(401).json({ success: false, error: 'Unauthorized: No session token provided' });
        return;
      }

      const revoked = await this.authService.logout(token, req.ip, req.headers['user-agent'] as string | undefined);
      res.clearCookie('session_token');
      res.status(200).json({ success: true, data: { revoked } });
    } catch (error) {
      next(error);
    }
  };

  public me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      res.status(200).json({ success: true, data: req.user });
    } catch (error) {
      next(error);
    }
  };
}