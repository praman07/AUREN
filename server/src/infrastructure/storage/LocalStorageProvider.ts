import * as fs from 'fs';
import * as path from 'path';
import { IStorageProvider } from './IStorageProvider';
import { BaseException } from '../../domain/exceptions/BaseException';

export class LocalStorageProvider implements IStorageProvider {
  private readonly basePath: string;

  constructor(basePath: string = path.join(process.cwd(), 'storage')) {
    this.basePath = basePath;
  }

  async upload(fileBuffer: Buffer, storagePath: string): Promise<string> {
    try {
      const fullPath = path.join(this.basePath, storagePath);
      await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.promises.writeFile(fullPath, fileBuffer);
      return storagePath; // Return relative URI
    } catch (error: any) {
      throw new BaseException(`Storage upload failed: ${error.message}`, 500);
    }
  }

  async download(storagePath: string): Promise<Buffer> {
    try {
      const fullPath = path.join(this.basePath, storagePath);
      return await fs.promises.readFile(fullPath);
    } catch (error: any) {
      throw new BaseException(`Storage download failed: ${error.message}`, 500);
    }
  }

  async delete(storagePath: string): Promise<void> {
    try {
      const fullPath = path.join(this.basePath, storagePath);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    } catch (error: any) {
      console.error(`Failed to delete orphaned file at ${storagePath}: ${error.message}`);
    }
  }
}
