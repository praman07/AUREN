export interface IStorageProvider {
  upload(fileBuffer: Buffer, path: string): Promise<string>;
  download(path: string): Promise<Buffer>;
  delete(path: string): Promise<void>;
}
