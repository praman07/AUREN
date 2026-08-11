import { prisma } from '../../infrastructure/database/prisma';
import { ConnectorRegistry } from './ConnectorRegistry';
import { ConnectorProvider, SourceType } from '@prisma/client';
import { DocumentProcessingOrchestrator } from '../services/DocumentProcessingOrchestrator';
import { PipelineEventType } from '../../domain/events/PipelineEvents';
import { EncryptionService } from '../services/EncryptionService';
import * as crypto from 'crypto';

import { IStorageProvider } from '../../infrastructure/storage/IStorageProvider';

export class ConnectorService {
  constructor(
    private orchestrator: DocumentProcessingOrchestrator,
    private storageProvider: IStorageProvider
  ) {}

  public async syncConnectedAccount(accountId: string): Promise<void> {
    const account = await prisma.connectedAccount.findUnique({
      where: { id: accountId }
    });

    if (!account) {
      throw new Error(`ConnectedAccount ${accountId} not found`);
    }

    const connector = ConnectorRegistry.getInstance().getConnector(account.provider);

    let accessToken = account.accessToken;
    if (account.tokenIv) {
      accessToken = EncryptionService.decrypt(account.accessToken, account.tokenIv);
    }

    try {
      const resources = await connector.fetchResources(accessToken, account.organizationId);

    for (const resource of resources) {
      // Upsert Document (Canonical Knowledge)
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
            ownerId: account.userId || '', // System owner if org-wide? Need to handle org vs user.
            title: resource.title,
            mimeType: resource.mimeType,
            sizeBytes: resource.sizeBytes,
            sourceType: this.mapProviderToSourceType(account.provider),
            externalId: resource.externalId,
            sourceUrl: resource.sourceUrl,
            connectedAccountId: account.id
          }
        });
      } else {
        // Update size/title if needed
        doc = await prisma.document.update({
          where: { id: doc.id },
          data: {
            title: resource.title,
            sizeBytes: resource.sizeBytes
          }
        });
      }

      // Write the raw text to the local storage provider and create a DocumentVersion.
      const versionId = crypto.randomUUID();
      const s3Key = `connectors/${account.provider.toLowerCase()}/${resource.externalId}`;
      
      await this.storageProvider.upload(Buffer.from(resource.content, 'utf8'), s3Key + '.txt');
      
      const docVersion = await prisma.documentVersion.create({
        data: {
          id: versionId,
          documentId: doc.id,
          version: 1,
          s3Key: s3Key,
          hash: crypto.createHash('sha256').update(resource.content).digest('hex')
        }
      });

      // Emit event to start processing pipeline
      await this.orchestrator.handleEvent(PipelineEventType.DOCUMENT_UPLOADED, {
        documentId: doc.id,
        versionId: docVersion.id,
        organizationId: account.organizationId,
      });
    } // End of loop

    // Update last sync time
    await prisma.connectedAccount.update({
      where: { id: account.id },
      data: { lastSyncAt: new Date(), status: 'ACTIVE' }
    });

    } catch (error: any) {
      console.error(`[ConnectorService] Sync failed for account ${accountId}:`, error);
      
      // Update account status to indicate failure
      await prisma.connectedAccount.update({
        where: { id: account.id },
        data: { status: 'ERROR' }
      });
      
      throw error;
    }
  }

  private mapProviderToSourceType(provider: ConnectorProvider): SourceType {
    switch (provider) {
      case 'GITHUB': return 'GITHUB';
      case 'NOTION': return 'NOTION';
      case 'GMAIL': return 'GMAIL';
      default: return 'UPLOAD';
    }
  }
}
