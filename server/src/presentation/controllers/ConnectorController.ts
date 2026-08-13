import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../infrastructure/database/prisma';
import { EncryptionService } from '../../application/services/EncryptionService';
import { ConnectorService } from '../../application/connectors/ConnectorService';
import { toConnectorDto } from '../../application/dtos/ConnectorDTOs';

const PROVIDER_LABELS: Record<string, string> = {
  GITHUB: 'GitHub',
  GMAIL: 'Gmail',
  NOTION: 'Notion',
  GOOGLE_DRIVE: 'Google Drive',
  SLACK: 'Slack',
};

const ALL_PROVIDERS = ['GITHUB', 'GMAIL', 'NOTION', 'GOOGLE_DRIVE', 'SLACK'];

export class ConnectorController {
  constructor(private readonly connectorService: ConnectorService) {}

  private paramId(req: Request): string {
    return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  }

  /** Only the owning org (and the owning user, if scoped) may touch an account. */
  private async assertAccess(req: Request, accountId: string): Promise<any> {
    const orgId = req.user!.organizationId;
    const account = await prisma.connectedAccount.findFirst({ where: { id: accountId, organizationId: orgId } });
    if (!account) {
      const err: any = new Error('Connected account not found in this organization');
      err.statusCode = 404;
      throw err;
    }
    if (account.userId && account.userId !== req.user!.id && !req.user!.isSuperAdmin) {
      const err: any = new Error('Forbidden: this account belongs to another user');
      err.statusCode = 403;
      throw err;
    }
    return account;
  }

  private async audit(req: Request, action: string, resourceId: string | null, details: any) {
    await prisma.auditLog.create({
      data: {
        organizationId: req.user!.organizationId,
        actorId: req.user!.id,
        action: action as any,
        resourceId: resourceId || undefined,
        ipAddress: req.ip || null,
        userAgent: (req.headers['user-agent'] as string | undefined)?.substring(0, 300) || null,
        metadata: details,
      },
    });
  }

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.user!.organizationId;
      const accounts = await prisma.connectedAccount.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
      });

      const byProvider = new Map<string, any>();
      for (const a of accounts) byProvider.set(a.provider, a);

      const data = ALL_PROVIDERS.map((provider) => {
        const account = byProvider.get(provider);
        return {
          provider,
          name: PROVIDER_LABELS[provider] || provider,
          configured: Boolean(account),
          account: account ? toConnectorDto(account) : null,
        };
      });

      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public connect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.user!.organizationId;
      const { provider, accountId, accountEmail, accessToken, refreshToken, scopes } = req.body;

      const encrypted = EncryptionService.encrypt(accessToken);
      const encryptedRefresh = refreshToken ? EncryptionService.encrypt(refreshToken) : null;

      const account = await prisma.connectedAccount.upsert({
        where: { provider_accountId: { provider, accountId } },
        update: {
          organizationId: orgId,
          accountEmail,
          accessToken: encrypted.encrypted,
          refreshToken: encryptedRefresh ? encryptedRefresh.encrypted : null,
          tokenIv: encrypted.iv,
          scopes: scopes || null,
          status: 'ACTIVE',
          lastSyncStatus: null,
          lastError: null,
          lastErrorAt: null,
        },
        create: {
          organizationId: orgId,
          userId: req.user!.id,
          provider,
          accountId,
          accountEmail,
          accessToken: encrypted.encrypted,
          refreshToken: encryptedRefresh ? encryptedRefresh.encrypted : null,
          tokenIv: encrypted.iv,
          scopes: scopes || null,
        },
      });

      await this.audit(req, 'CREATE', account.id, { action: 'CONNECTOR_CONNECTED', provider });

      res.status(201).json({ success: true, data: toConnectorDto(account) });
    } catch (error) {
      next(error);
    }
  };

  public disconnect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const account = await this.assertAccess(req, this.paramId(req));
      // Revoke stored credentials entirely — the account row is removed and
      // previously ingested documents keep their metadata (FK is SetNull).
      await prisma.connectedAccount.delete({ where: { id: account.id } });

      await this.audit(req, 'DELETE', account.id, { action: 'CONNECTOR_DISCONNECTED', provider: account.provider });

      res.status(200).json({ success: true, message: 'Connector disconnected' });
    } catch (error) {
      next(error);
    }
  };

  public details = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const account = await this.assertAccess(req, this.paramId(req));
      res.status(200).json({ success: true, data: toConnectorDto(account) });
    } catch (error) {
      next(error);
    }
  };

  public sync = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const account = await this.assertAccess(req, this.paramId(req));
      const result = await this.connectorService.syncConnectedAccount(account.id, account.provider);

      await this.audit(req, 'UPDATE', account.id, { action: 'CONNECTOR_SYNC_REQUESTED', ...result });

      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      next(error);
    }
  };

  public errors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const account = await this.assertAccess(req, this.paramId(req));
      const failedJobs = await prisma.processingJob.findMany({
        where: {
          organizationId: req.user!.organizationId,
          status: 'FAILED',
          document: { connectedAccountId: account.id },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          documentId: true,
          status: true,
          error: true,
          createdAt: true,
        },
      });

      res.status(200).json({
        success: true,
        data: {
          accountId: account.id,
          lastSyncStatus: account.lastSyncStatus,
          lastSyncAt: account.lastSyncAt,
          lastError: account.lastError,
          lastErrorAt: account.lastErrorAt,
          failedJobs: failedJobs.map((j: any) => ({
            id: j.id,
            documentId: j.documentId,
            status: j.status,
            error: j.error?.substring(0, 500) || null,
            createdAt: j.createdAt,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  };
}