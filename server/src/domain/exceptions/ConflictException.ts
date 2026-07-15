import { BaseException } from './BaseException';

export class ConflictException extends BaseException {
  constructor(message: string) {
    super(message, 409);
  }
}
