import { prisma } from '../../infrastructure/database/prisma';
import { ConnectorRegistry } from './ConnectorRegistry';
import { ConnectorProvider, SourceType } from '@prisma/client';
import { DocumentProcessingOrchestrator } from '../services/DocumentProcessingOrchestrator';
import { PipelineEventType } from '../../domain/events/PipelineEvents';
import { EncryptionService } from '../services/EncryptionService';
import * as crypto from 'crypto';

import { IStorageProvider } from '../../infrastructure/storage/IStorageProvider';

export interface ConnectorSyncResult {
  accountId: string;
  provider: ConnectorProvider;
  resourcesFetched: number;
  documentsUpserted: number;
  versionsCreated: number;
  syncedAt: Date;
}

export class ConnectorService {
  constructor(
    private orchestrator: DocumentProcessingOrchestrator,
    private storageProvider: IStorageProvider
  ) {}

  public async syncConnectedAccount(accountId: string, requestedProvider?: ConnectorProvider): Promise<ConnectorSyncResult> {
    const account = await prisma.connectedAccount.findUnique({
      where: { id: accountId }
    });

    if (!account) {
      throw new Error(`ConnectedAccount ${accountId} not found`);
    }

    if (requestedProvider && account.provider !== requestedProvider) {
      throw new Error(`Provider mismatch: account ${accountId} belongs to ${account.provider}`);
    }

    // Mark sync as pending
    await prisma.connectedAccount.update({
      where: { id: accountId },
      data: { lastSyncStatus: 'PENDING', status: 'ACTIVE' }
    });

    const connector = ConnectorRegistry.getInstance().getConnector(account.provider);

    let accessToken = account.accessToken;
    if (account.tokenIv) {
      accessToken = EncryptionService.decrypt(account.accessToken, account.tokenIv);
    }

    const result: ConnectorSyncResult = {
      accountId,
      provider: account.provider,
      resourcesFetched: 0,
      documentsUpserted: 0,
      versionsCreated: 0,
      syncedAt: new Date()
    };

    try {
      // Never log the token; the connector only sees it in-memory.
      const resources = await connector.fetchResources(accessToken, account.organizationId, account.userId || '');
      result.resourcesFetched = resources.length;

      for (const resource of resources) {
        // Validate that resource-level restrictions do not exceed the account's tenant.
        // The userId used for ownership must be a real user of the org.
        let ownerId = account.userId;
        if (!ownerId) {
          // Fall back to the first active user of the organization (system-owner pattern).
          const systemUser = await prisma.user.findFirst({
            where: { organizationId: account.organizationId, deletedAt: null },
            orderBy: { createdAt: 'asc' },
            select: { id: true }
          });
          if (!systemUser) {
            throw new Error(`Organization ${account.organizationId} has no users; cannot ingest connector data`);
          }
          ownerId = systemUser.id;
        }

        // Upsert Document (Canonical Knowledge), preserving resource-level RBAC from the source.
        let doc = await prisma.document.findFirst({
          where: {
            connectedAccountId: account.id,
            externalId: resource.externalId,
            organizationId: account.organizationId
          }
        });

        if (!doc) {
          doc = await prisma.document.create({
            data: {
              organizationId: account.organizationId,
              ownerId,
              title: resource.title,
              mimeType: resource.mimeType,
              sizeBytes: resource.sizeBytes,
              sourceType: this.mapProviderToSourceType(account.provider),
              externalId: resource.externalId,
              sourceUrl: resource.sourceUrl,
              connectedAccountId: account.id,
              visibility: resource.allowedUsers?.length || resource.allowedRoles?.length ? 'PRIVATE' : 'ORG_WIDE',
              allowedUsers: resource.allowedUsers || [],
              allowedRoles: resource.allowedRoles || [],
              allowedDepartments: resource.allowedDepartments || [],
              deniedUsers: resource.deniedUsers || [],
              deniedRoles: resource.deniedRoles || [],
              deniedDepartments: resource.deniedDepartments || []
            }
          });
          result.documentsUpserted += 1;
        } else {
          doc = await prisma.document.update({
            where: { id: doc.id },
            data: {
              title: resource.title,
              sizeBytes: resource.sizeBytes,
              allowedUsers: resource.allowedUsers || [],
              allowedRoles: resource.allowedRoles || [],
              allowedDepartments: resource.allowedDepartments || [],
              deniedUsers: resource.deniedUsers || [],
              deniedRoles: resource.deniedRoles || [],
              deniedDepartments: resource.deniedDepartments || []
            }
          });
        }

        // Only re-process if content changed (new hash)
        const contentHash = crypto.createHash('sha256').update(resource.content).digest('hex');
        const existingVersion = await prisma.documentVersion.findFirst({
          where: { documentId: doc.id, hash: contentHash }
        });

        if (existingVersion) {
          continue;
        }

        // Write the raw text to the local storage provider and create a DocumentVersion.
        const versionId = crypto.randomUUID();
        const safeExternalId = resource.externalId.replace(/[^a-zA-Z0-9_-]/g, '_');
        const s3Key = `connectors/${account.provider.toLowerCase()}/${account.id}/${safeExternalId}`;

        await this.storageProvider.upload(Buffer.from(resource.content, 'utf8'), s3Key + '.txt');

        await prisma.documentVersion.create({
          data: {
            id: versionId,
            documentId: doc.id,
            version: (await prisma.documentVersion.count({ where: { documentId: doc.id } })) + 1,
            s3Key,
            hash: contentHash
          }
        });
        result.versionsCreated += 1;

        // Emit event to start processing pipeline
        await this.orchestrator.handleEvent(PipelineEventType.DOCUMENT_UPLOADED, {
          documentId: doc.id,
          versionId,
          organizationId: account.organizationId,
        });
      }

      // Deletion Purging: Identify documents previously ingested under this connectedAccount that are no longer in fetched resources
      const fetchedExternalIds = new Set(resources.map(r => r.externalId));
      const existingDocs = await prisma.document.findMany({
        where: {
          connectedAccountId: account.id,
          organizationId: account.organizationId,
          deletedAt: null
        },
        select: { id: true, externalId: true }
      });

      for (const existingDoc of existingDocs) {
        if (existingDoc.externalId && !fetchedExternalIds.has(existingDoc.externalId)) {
          console.log(`[ConnectorService] Soft-deleting document ${existingDoc.id} (${existingDoc.externalId}) removed from source`);
          await prisma.document.update({
            where: { id: existingDoc.id },
            data: { deletedAt: new Date() }
          });

          // Purge Qdrant points if QdrantVectorStoreProvider is available
          try {
            const { QdrantVectorStoreProvider } = await import('../../infrastructure/providers/adapters/vector/QdrantVectorStoreProvider');
            const qdrant = new QdrantVectorStoreProvider();
            // Delete points associated with this document ID in the org collection
            const collectionName = `org_${account.organizationId}_docs`;
            await qdrant.deleteDocument(collectionName, existingDoc.id);
          } catch (qErr: any) {
            console.warn(`[ConnectorService] Vector purge warning for doc ${existingDoc.id}:`, qErr.message);
          }
        }
      }

      // Update sync diagnostics (success)
      await prisma.connectedAccount.update({
        where: { id: account.id },
        data: { lastSyncAt: result.syncedAt, lastSyncStatus: 'SUCCESS', lastError: null, status: 'ACTIVE' }
      });

      await prisma.auditLog.create({
        data: {
          organizationId: account.organizationId,
          actorId: account.userId,
          action: 'UPDATE',
          resourceId: account.id,
          metadata: { event: 'CONNECTOR_SYNC_COMPLETED', ...result }
        }
      });

      return result;

    } catch (error: any) {
      // Never log the token or raw connector payloads.
      const safeMessage = error?.message?.length ? String(error.message).substring(0, 500) : 'Unknown sync error';

      await prisma.connectedAccount.update({
        where: { id: account.id },
        data: { lastSyncStatus: 'ERROR', lastError: safeMessage, lastErrorAt: new Date(), status: 'ERROR' }
      });

      await prisma.auditLog.create({
        data: {
          organizationId: account.organizationId,
          actorId: account.userId,
          action: 'UPDATE',
          resourceId: account.id,
          metadata: { event: 'CONNECTOR_SYNC_FAILED', error: safeMessage }
        }
      });

      throw error;
    }
  }

  private mapProviderToSourceType(provider: ConnectorProvider): SourceType {
    switch (provider) {
      case 'GITHUB': return 'GITHUB';
      case 'NOTION': return 'NOTION';
      case 'GMAIL': return 'GMAIL';
      case 'GOOGLE_DRIVE': return 'GOOGLE_DRIVE' as SourceType;
      default: return 'UPLOAD';
    }
  }
}