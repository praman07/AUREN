import { SourceType, ConnectorProvider } from '@prisma/client';

export interface ConnectorResource {
  externalId: string;
  title: string;
  content: string; // The normalized canonical text
  sourceUrl?: string;
  mimeType: string;
  sizeBytes: number;
  metadata?: Record<string, any>;
  allowedRoles?: string[];
  allowedUsers?: string[];
  allowedDepartments?: string[];
  deniedRoles?: string[];
  deniedUsers?: string[];
  deniedDepartments?: string[];
}

export interface IConnector {
  getProvider(): ConnectorProvider;
  
  /**
   * Fetches resources from the external provider and normalizes them into Canonical knowledge.
   * @param accessToken The decrypted access token for the provider
   * @param organizationId The organization context
   * @param userId The ID of the user authorizing this connector
   */
  fetchResources(accessToken: string, organizationId: string, userId: string): Promise<ConnectorResource[]>;

  /**
   * Optional: Can implement incremental sync by accepting a lastSyncAt timestamp
   */
  fetchIncremental?(accessToken: string, organizationId: string, userId: string, lastSyncAt: Date): Promise<ConnectorResource[]>;
}
