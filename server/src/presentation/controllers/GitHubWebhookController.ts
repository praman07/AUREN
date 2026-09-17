import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import { prisma } from '../../infrastructure/database/prisma';
import { ConnectorService } from '../../application/connectors/ConnectorService';

export class GitHubWebhookController {
  constructor(private readonly connectorService: ConnectorService) {}

  /**
   * HMAC SHA-256 Signature Verification for GitHub Webhooks
   */
  private verifySignature(req: Request, secret: string): boolean {
    const signature = req.headers['x-hub-signature-256'] as string;
    if (!signature) return false;

    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const hmac = crypto.createHmac('sha256', secret);
    const digest = `sha256=${hmac.update(rawBody).digest('hex')}`;

    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
    } catch {
      return false;
    }
  }

  public handleWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const event = req.headers['x-github-event'] as string;
      const deliveryId = req.headers['x-github-delivery'] as string;

      if (!event) {
        res.status(400).json({ success: false, error: 'Missing X-GitHub-Event header' });
        return;
      }

      const payload = req.body;
      const repositoryFullName = payload.repository?.full_name?.toLowerCase();

      if (!repositoryFullName) {
        res.status(200).json({ success: true, message: 'Event ignored: no repository full_name in payload' });
        return;
      }

      console.log(`[GitHubWebhook] Received event "${event}" (delivery: ${deliveryId}) for repo "${repositoryFullName}"`);

      // Find matching ConnectedAccount in Prisma DB where provider = 'GITHUB'
      const accounts = await prisma.connectedAccount.findMany({
        where: { provider: 'GITHUB', status: 'ACTIVE' },
      });

      const matchingAccounts = accounts.filter(acc => {
        const selectedRepos = (acc.metadata as any)?.selectedRepos;
        if (Array.isArray(selectedRepos)) {
          return selectedRepos.some((r: string) => r.toLowerCase() === repositoryFullName);
        }
        return false;
      });

      if (matchingAccounts.length === 0) {
        console.log(`[GitHubWebhook] No active connected account subscribed to repo "${repositoryFullName}"`);
        res.status(200).json({ success: true, message: 'Repository not currently subscribed by any active connected account' });
        return;
      }

      // Handle specific webhook events idempotently
      if (event === 'push') {
        const headCommit = payload.head_commit;
        if (headCommit) {
          console.log(`[GitHubWebhook] Push event: commit ${headCommit.id} by ${headCommit.author?.username} in ${repositoryFullName}`);
        }

        // Trigger incremental sync for each matching account
        for (const acc of matchingAccounts) {
          this.connectorService.syncConnectedAccount(acc.id, 'GITHUB').catch(err => {
            console.error(`[GitHubWebhook] Incremental sync failed for account ${acc.id}:`, err?.message || err);
          });
        }

        res.status(200).json({ success: true, message: 'Push event processed: incremental synchronization scheduled', repo: repositoryFullName });
        return;
      }

      if (event === 'repository' && (payload.action === 'deleted' || payload.action === 'archived' || payload.action === 'privatized')) {
        console.log(`[GitHubWebhook] Repository ${payload.action}: "${repositoryFullName}" — purging indexed documents and vectors`);

        for (const acc of matchingAccounts) {
          const orgId = acc.organizationId;
          const collectionName = `org_${orgId.replace(/[^a-zA-Z0-9]/g, '_')}_docs`;

          const docsToPurge = await prisma.document.findMany({
            where: {
              connectedAccountId: acc.id,
              deletedAt: null,
              externalId: { startsWith: repositoryFullName }
            },
            select: { id: true }
          });

          if (docsToPurge.length > 0) {
            const docIds = docsToPurge.map(d => d.id);
            await prisma.document.updateMany({
              where: { id: { in: docIds } },
              data: { deletedAt: new Date() }
            });

            try {
              const { QdrantVectorStoreProvider } = await import('../../infrastructure/providers/adapters/vector/QdrantVectorStoreProvider');
              const qdrant = new QdrantVectorStoreProvider();
              for (const docId of docIds) {
                await qdrant.deleteDocument(collectionName, docId);
              }
            } catch (qErr: any) {
              console.error(`[GitHubWebhook] Vector purge error during repository deletion:`, qErr?.message || qErr);
            }
          }
        }

        res.status(200).json({ success: true, message: `Repository ${payload.action}: knowledge purged`, repo: repositoryFullName });
        return;
      }

      res.status(200).json({ success: true, message: `Webhook event "${event}" acknowledged`, repo: repositoryFullName });
    } catch (error: any) {
      console.error('[GitHubWebhook] Error handling webhook event:', error);
      next(error);
    }
  };
}
