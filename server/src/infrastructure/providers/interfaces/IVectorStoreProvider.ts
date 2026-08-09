export interface VectorPayload {
  id: string;
  vector: number[];
  payload: Record<string, any>;
}

export interface IVectorStoreProvider {
  upsert(collection: string, points: VectorPayload[]): Promise<void>;
  search(collection: string, vector: number[], limit: number, filter?: any): Promise<any[]>;
  delete(collection: string, ids: string[]): Promise<void>;
  ensureCollection(collection: string, dimension: number): Promise<void>;
}
