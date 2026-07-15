import { BaseException } from './BaseException';

export class NotFoundException extends BaseException {
  constructor(resource: string, id: string) {
    super(`${resource} with ID ${id} not found`, 404);
  }
}
