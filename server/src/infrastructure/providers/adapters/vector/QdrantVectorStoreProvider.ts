import { IVectorStoreProvider, VectorPayload } from '../../interfaces/IVectorStoreProvider';
import { QdrantClient } from '@qdrant/js-client-rest';
import { env } from '../../../../shared/config/env';

export class QdrantVectorStoreProvider implements IVectorStoreProvider {
  private client: QdrantClient;

  constructor() {
    this.client = new QdrantClient({ url: env.QDRANT_URL || 'http://localhost:6333', checkCompatibility: false });
  }

  async ensureCollection(collection: string, dimension: number): Promise<void> {
    try {
      const exists = await this.client.collectionExists(collection);
      if (exists.exists) {
        const info = await this.client.getCollection(collection);
        const existingSize = (info.config?.params?.vectors as any)?.size;
        if (existingSize && existingSize !== dimension) {
          console.warn(`[Qdrant] Collection ${collection} has dimension ${existingSize}, but requested is ${dimension}. Recreating collection...`);
          await this.client.deleteCollection(collection);
          await this.client.createCollection(collection, {
            vectors: { size: dimension, distance: 'Cosine' },
          });
          console.log(`[Qdrant] Recreated collection ${collection} with dim ${dimension}`);
          return;
        }
      } else {
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
      await this.ensureCollection(collection, vector.length);
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

  async deleteDocument(collection: string, documentId: string): Promise<void> {
    try {
      await this.client.delete(collection, {
        wait: true,
        filter: {
          must: [
            { key: 'documentId', match: { value: documentId } }
          ]
        }
      });
      console.log(`[Qdrant] Deleted points for document ${documentId} from ${collection}`);
    } catch (error) {
      console.error(`[Qdrant] Error deleting document ${documentId} from ${collection}:`, error);
    }
  }

  async updatePayloadForDocument(collection: string, documentId: string, payload: Record<string, any>): Promise<void> {
    try {
      await this.client.setPayload(collection, {
        payload,
        filter: {
          must: [
            { key: 'documentId', match: { value: documentId } }
          ]
        },
        wait: true
      });
      console.log(`[Qdrant] Updated payload for document ${documentId} in ${collection}`);
    } catch (error) {
      console.warn(`[Qdrant] Warning: Could not update payload for document ${documentId}:`, error);
    }
  }
}
