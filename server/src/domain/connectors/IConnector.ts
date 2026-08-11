import { SourceType, ConnectorProvider } from '@prisma/client';

export interface ConnectorResource {
  externalId: string;
  title: string;
  content: string; // The normalized canonical text
  sourceUrl?: string;
  mimeType: string;
  sizeBytes: number;
  metadata?: Record<string, any>;
}

export interface IConnector {
  getProvider(): ConnectorProvider;
  
  /**
   * Fetches resources from the external provider and normalizes them into Canonical knowledge.
   * @param accessToken The decrypted access token for the provider
   * @param organizationId The organization context
   */
  fetchResources(accessToken: string, organizationId: string): Promise<ConnectorResource[]>;

  /**
   * Optional: Can implement incremental sync by accepting a lastSyncAt timestamp
   */
  fetchIncremental?(accessToken: string, organizationId: string, lastSyncAt: Date): Promise<ConnectorResource[]>;
}
