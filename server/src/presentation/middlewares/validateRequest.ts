import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';

export const validateRequest = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error: any) {
      const issues = error?.issues || error?.errors || [];
      if (issues.length > 0 || error instanceof ZodError) {
        const details = issues.map((e: any) => ({
          path: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
          message: e.message || 'Invalid input',
        }));
        const firstMessage = details[0]?.message || 'Validation failed';
        return res.status(400).json({
          success: false,
          error: firstMessage,
          details,
        });
      }
      return next(error);
    }
  };
};
