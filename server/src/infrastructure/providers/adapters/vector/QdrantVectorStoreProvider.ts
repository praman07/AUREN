import { IVectorStoreProvider, VectorPayload } from '../../interfaces/IVectorStoreProvider';

export class QdrantVectorStoreProvider implements IVectorStoreProvider {
  async upsert(collection: string, points: VectorPayload[]): Promise<void> {}
  async search(collection: string, vector: number[], limit: number, filter?: any): Promise<any[]> { return []; }
  async delete(collection: string, ids: string[]): Promise<void> {}
}
