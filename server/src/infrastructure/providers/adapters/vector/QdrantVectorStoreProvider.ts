import { IVectorStoreProvider, VectorPayload } from '../../interfaces/IVectorStoreProvider';
import { QdrantClient } from '@qdrant/js-client-rest';
import { env } from '../../../../shared/config/env';

export class QdrantVectorStoreProvider implements IVectorStoreProvider {
  private client: QdrantClient;

  constructor() {
    this.client = new QdrantClient({ url: env.QDRANT_URL || 'http://localhost:6333' });
  }

  async ensureCollection(collection: string, dimension: number): Promise<void> {
    try {
      const exists = await this.client.collectionExists(collection);
      if (!exists.exists) {
        await this.client.createCollection(collection, {
          vectors: { size: dimension, distance: 'Cosine' },
        });
        console.log(`[Qdrant] Created collection ${collection} with dim ${dimension}`);
      }
    } catch (error) {
      console.error(`[Qdrant] Error checking/creating collection ${collection}:`, error);
      throw error;
    }
  }

  async upsert(collection: string, points: VectorPayload[]): Promise<void> {
    try {
      await this.client.upsert(collection, {
        wait: true,
        points: points.map(p => ({
          id: p.id,
          vector: p.vector,
          payload: p.payload
        }))
      });
      console.log(`[Qdrant] Upserted ${points.length} points into ${collection}`);
    } catch (error) {
      console.error(`[Qdrant] Error upserting points to ${collection}:`, error);
      throw error;
    }
  }

  async search(collection: string, vector: number[], limit: number, filter?: any): Promise<any[]> {
    try {
      console.log(`[Qdrant] Searching collection ${collection}`);
      const response = await this.client.query(collection, {
        query: vector,
        limit: limit,
        filter: filter,
        with_payload: true,
        with_vector: false
      });
      
      return response.points.map(r => ({
        id: r.id,
        score: r.score,
        payload: r.payload
      }));
    } catch (error) {
      console.error(`[Qdrant] Error searching collection ${collection}:`, error);
      return [];
    }
  }

  async delete(collection: string, ids: string[]): Promise<void> {
    try {
      await this.client.delete(collection, {
        wait: true,
        points: ids
      });
    } catch (error) {
      console.error(`[Qdrant] Error deleting points from ${collection}:`, error);
    }
  }
}
