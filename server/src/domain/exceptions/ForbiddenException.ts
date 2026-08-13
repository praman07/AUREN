import { BaseException } from './BaseException';

export class ForbiddenException extends BaseException {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}