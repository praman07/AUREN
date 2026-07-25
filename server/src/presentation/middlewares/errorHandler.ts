import { Request, Response, NextFunction } from 'express';
import { BaseException } from '../../domain/exceptions/BaseException';
import { logger } from '../../shared/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof BaseException) {
    if (!err.isOperational) {
      logger.fatal(err, 'Programming error or unknown exception');
    } else {
      logger.warn({ err, path: req.path }, err.message);
    }
    
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Handle generic unknown errors
  logger.error(err, 'Unhandled Exception');
  return res.status(500).json({
    success: false,
    error: 'Internal Server Error',
  });
};
