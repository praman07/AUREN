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

  private async audit(
    req: Request, 
    action: string, 
    resourceId: string | null, 
    details: any, 
    orgIdOverride?: string, 
    actorIdOverride?: string
  ) {
    const organizationId = req.user?.organizationId || orgIdOverride || details?.organizationId;
    const actorId = req.user?.id || actorIdOverride || details?.userId || null;

    if (!organizationId) {
      console.warn('[ConnectorController] Audit log skipped: missing organizationId');
      return;
    }

    await prisma.auditLog.create({
      data: {
        organizationId,
        actorId,
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

  public getGoogleAuthUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { GoogleOAuthService } = await import('../../infrastructure/connectors/GoogleOAuthService');
      const oauthService = new GoogleOAuthService();
      const statePayload = JSON.stringify({
        organizationId: req.user!.organizationId,
        userId: req.user!.id
      });
      const state = Buffer.from(statePayload).toString('base64');
      const url = oauthService.getAuthUrl(state);

      res.status(200).json({ success: true, data: { url } });
    } catch (error) {
      next(error);
    }
  };

  public handleGoogleCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5174';

    try {
      const { code, state, error: oauthError } = req.query;

      if (oauthError) {
        res.redirect(`${frontendUrl}/settings/connectors?error=${encodeURIComponent(String(oauthError))}`);
        return;
      }

      if (!code || typeof code !== 'string') {
        res.redirect(`${frontendUrl}/settings/connectors?error=missing_authorization_code`);
        return;
      }

      let organizationId = req.user?.organizationId;
      let userId = req.user?.id;

      if (state && typeof state === 'string') {
        try {
          const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
          if (decoded.organizationId) organizationId = decoded.organizationId;
          if (decoded.userId) userId = decoded.userId;
        } catch (e) {
          console.warn('ConnectorController: Failed to decode OAuth state payload', e);
        }
      }

      if (!organizationId || !userId) {
        res.redirect(`${frontendUrl}/settings/connectors?error=unauthorized_context`);
        return;
      }

      const { GoogleOAuthService } = await import('../../infrastructure/connectors/GoogleOAuthService');
      const oauthService = new GoogleOAuthService();
      const tokens = await oauthService.exchangeCodeForTokens(code);

      const encryptedAccess = EncryptionService.encrypt(tokens.accessToken);
      const encryptedRefresh = tokens.refreshToken ? EncryptionService.encrypt(tokens.refreshToken) : null;
      const accountEmail = tokens.email || `gdrive-${userId.substring(0, 8)}@google.com`;
      const accountId = `gdrive_${accountEmail}`;

      const account = await prisma.connectedAccount.upsert({
        where: { provider_accountId: { provider: 'GOOGLE_DRIVE', accountId } },
        update: {
          organizationId,
          userId,
          accountEmail,
          accessToken: encryptedAccess.encrypted,
          refreshToken: encryptedRefresh ? encryptedRefresh.encrypted : null,
          tokenIv: encryptedAccess.iv,
          status: 'ACTIVE',
          lastSyncStatus: null,
          lastError: null,
          lastErrorAt: null,
        },
        create: {
          organizationId,
          userId,
          provider: 'GOOGLE_DRIVE',
          accountId,
          accountEmail,
          accessToken: encryptedAccess.encrypted,
          refreshToken: encryptedRefresh ? encryptedRefresh.encrypted : null,
          tokenIv: encryptedAccess.iv,
          scopes: tokens.scope || 'https://www.googleapis.com/auth/drive.readonly',
        },
      });

      // Automatically initiate initial sync asynchronously
      this.connectorService.syncConnectedAccount(account.id, 'GOOGLE_DRIVE').catch(err => {
        console.error('ConnectorController: Initial Google Drive sync failed:', err);
      });

      // Redirect back to frontend settings connectors page
      res.redirect(`${frontendUrl}/settings?tab=connectors&connected=GOOGLE_DRIVE`);
    } catch (error: any) {
      console.error('ConnectorController: Google OAuth callback error:', error);
      res.redirect(`${frontendUrl}/settings?tab=connectors&error=${encodeURIComponent(error?.message || 'OAuth authentication failed')}`);
    }
  };

  public getGitHubAuthUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { GitHubOAuthService } = await import('../../infrastructure/connectors/GitHubOAuthService');
      const oauthService = new GitHubOAuthService();
      
      const state = oauthService.generateState(req.user!.organizationId, req.user!.id);
      const url = oauthService.getAuthUrl(state);

      res.status(200).json({ success: true, data: { url } });
    } catch (error) {
      next(error);
    }
  };

  public handleGitHubCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5174';

    try {
      const { code, state, error: oauthError } = req.query;

      if (oauthError) {
        res.redirect(`${frontendUrl}/settings?tab=connectors&error=${encodeURIComponent(String(oauthError))}`);
        return;
      }

      if (!code || typeof code !== 'string') {
        res.redirect(`${frontendUrl}/settings?tab=connectors&error=missing_authorization_code`);
        return;
      }

      if (!state || typeof state !== 'string') {
        res.redirect(`${frontendUrl}/settings?tab=connectors&error=missing_oauth_state`);
        return;
      }

      const { GitHubOAuthService } = await import('../../infrastructure/connectors/GitHubOAuthService');
      const oauthService = new GitHubOAuthService();

      let statePayload;
      try {
        statePayload = oauthService.verifyState(state);
      } catch (stateErr: any) {
        console.warn('ConnectorController: GitHub OAuth state verification failed:', stateErr.message);
        res.redirect(`${frontendUrl}/settings?tab=connectors&error=${encodeURIComponent('invalid_oauth_state')}`);
        return;
      }

      const { organizationId, userId } = statePayload;

      const result = await oauthService.exchangeCodeForTokens(code);

      const encryptedAccess = EncryptionService.encrypt(result.accessToken);
      const accountEmail = result.githubEmail || `${result.githubLogin}@github.com`;
      const accountId = `github_${result.githubAccountId}`;

      const account = await prisma.connectedAccount.upsert({
        where: { provider_accountId: { provider: 'GITHUB', accountId } },
        update: {
          organizationId,
          userId,
          accountEmail,
          accessToken: encryptedAccess.encrypted,
          tokenIv: encryptedAccess.iv,
          scopes: result.scope || 'repo,read:user,user:email',
          status: 'ACTIVE',
          lastSyncStatus: null,
          lastError: null,
          lastErrorAt: null,
        },
        create: {
          organizationId,
          userId,
          provider: 'GITHUB',
          accountId,
          accountEmail,
          accessToken: encryptedAccess.encrypted,
          tokenIv: encryptedAccess.iv,
          scopes: result.scope || 'repo,read:user,user:email',
          status: 'ACTIVE',
        },
      });

      await this.audit(
        req, 
        'CREATE', 
        account.id, 
        {
          action: 'CONNECTOR_CONNECTED',
          provider: 'GITHUB',
          githubLogin: result.githubLogin,
        },
        organizationId,
        userId
      );

      res.redirect(`${frontendUrl}/settings?tab=connectors&connected=GITHUB`);
    } catch (error: any) {
      console.error('ConnectorController: GitHub OAuth callback error:', error);
      const safeErrorMessage = error?.message?.substring(0, 200) || 'OAuth authentication failed';
      res.redirect(`${frontendUrl}/settings?tab=connectors&error=${encodeURIComponent(safeErrorMessage)}`);
    }
  };

  public listGitHubRepos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const account = await this.assertAccess(req, this.paramId(req));

      if (account.provider !== 'GITHUB') {
        const err: any = new Error(`Provider mismatch: account ${account.id} belongs to ${account.provider}, not GITHUB`);
        err.statusCode = 400;
        throw err;
      }

      if (!account.accessToken || !account.tokenIv) {
        const err: any = new Error('Connected account missing credentials. Please reconnect.');
        err.statusCode = 400;
        throw err;
      }

      const accessToken = EncryptionService.decrypt(account.accessToken, account.tokenIv);
      const { GitHubOAuthService } = await import('../../infrastructure/connectors/GitHubOAuthService');
      const oauthService = new GitHubOAuthService();

      const repos = await oauthService.fetchAccessibleRepositories(accessToken);

      res.status(200).json({
        success: true,
        data: repos,
      });
    } catch (error) {
      next(error);
    }
  };

  public selectGitHubRepos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const account = await this.assertAccess(req, this.paramId(req));

      if (account.provider !== 'GITHUB') {
        const err: any = new Error(`Provider mismatch: account ${account.id} belongs to ${account.provider}, not GITHUB`);
        err.statusCode = 400;
        throw err;
      }

      const { repositories } = req.body;
      if (!Array.isArray(repositories)) {
        const err: any = new Error('Repositories must be an array of strings');
        err.statusCode = 400;
        throw err;
      }

      // Normalization & Validation of Repository Identifiers
      const repoRegex = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;
      const normalizedRepos: string[] = [];

      for (const r of repositories) {
        if (typeof r !== 'string') continue;
        const trimmed = r.trim();
        if (!repoRegex.test(trimmed)) {
          const err: any = new Error(`Invalid repository identifier format: "${r}". Must be "owner/repository".`);
          err.statusCode = 400;
          throw err;
        }
        normalizedRepos.push(trimmed);
      }

      // De-duplicate
      const uniqueRepos = Array.from(new Set(normalizedRepos));

      if (uniqueRepos.length > 50) {
        const err: any = new Error('Cannot select more than 50 repositories at once');
        err.statusCode = 400;
        throw err;
      }

      // Security check: Verify selected repositories actually belong to the connected GitHub user's accessible set
      if (!account.accessToken || !account.tokenIv) {
        const err: any = new Error('Connected account missing credentials. Please reconnect.');
        err.statusCode = 400;
        throw err;
      }

      const accessToken = EncryptionService.decrypt(account.accessToken, account.tokenIv);
      const { GitHubOAuthService } = await import('../../infrastructure/connectors/GitHubOAuthService');
      const oauthService = new GitHubOAuthService();

      const accessibleRepos = await oauthService.fetchAccessibleRepositories(accessToken);
      const accessibleSet = new Set(accessibleRepos.map((repo) => repo.fullName.toLowerCase()));

      for (const repoName of uniqueRepos) {
        if (!accessibleSet.has(repoName.toLowerCase())) {
          const err: any = new Error(`Repository "${repoName}" is not accessible to the connected GitHub account.`);
          err.statusCode = 403;
          throw err;
        }
      }

      // Update metadata on ConnectedAccount
      const currentMeta = (account.metadata as Record<string, any>) || {};
      const updatedMeta = {
        ...currentMeta,
        selectedRepos: uniqueRepos,
        lastSelectedAt: new Date().toISOString(),
      };

      const updatedAccount = await prisma.connectedAccount.update({
        where: { id: account.id },
        data: { metadata: updatedMeta },
      });

      await this.audit(req, 'UPDATE', account.id, {
        action: 'GITHUB_REPOS_SELECTED',
        selectedRepos: uniqueRepos,
      });

      res.status(200).json({
        success: true,
        data: {
          accountId: updatedAccount.id,
          provider: updatedAccount.provider,
          selectedRepos: uniqueRepos,
          updatedAt: updatedAccount.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public syncGitHub = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const account = await this.assertAccess(req, this.paramId(req));

      if (account.provider !== 'GITHUB') {
        const err: any = new Error(`Provider mismatch: account ${account.id} belongs to ${account.provider}, not GITHUB`);
        err.statusCode = 400;
        throw err;
      }

      const selectedRepos = (account.metadata as any)?.selectedRepos;
      if (!Array.isArray(selectedRepos) || selectedRepos.length === 0) {
        const err: any = new Error('No repositories selected for GitHub synchronization. Please select repositories first.');
        err.statusCode = 400;
        throw err;
      }

      const result = await this.connectorService.syncConnectedAccount(account.id, 'GITHUB');

      await this.audit(req, 'UPDATE', account.id, {
        action: 'GITHUB_CONNECTOR_SYNC_REQUESTED',
        selectedRepos,
        ...result,
      });

      res.status(200).json({
        success: true,
        data: {
          syncId: `sync_gh_${Date.now()}`,
          status: 'COMPLETED',
          accountId: account.id,
          selectedRepos,
          result,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  private isOrgAdmin(req: Request): boolean {
    return Boolean(
      req.user?.isSuperAdmin || 
      req.user?.role === 'ADMIN' || 
      req.user?.roles?.includes('ADMIN') || 
      req.user?.roles?.includes('OrgAdmin')
    );
  }

  public getPolicies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const account = await this.assertAccess(req, this.paramId(req));
      const policies = await prisma.connectorPolicy.findMany({
        where: {
          organizationId: req.user!.organizationId,
          connectedAccountId: account.id,
        },
        orderBy: { resourcePattern: 'asc' },
      });

      res.status(200).json({ success: true, data: policies });
    } catch (error) {
      next(error);
    }
  };

  public savePolicy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.isOrgAdmin(req)) {
        const err: any = new Error('Forbidden: Only organization administrators can manage connector policies');
        err.statusCode = 403;
        throw err;
      }

      const account = await this.assertAccess(req, this.paramId(req));
      const { 
        resourcePattern, 
        allowedRoles = [], 
        allowedDepartments = [], 
        allowedUsers = [], 
        deniedRoles = [], 
        deniedDepartments = [], 
        deniedUsers = [] 
      } = req.body;

      if (!resourcePattern || typeof resourcePattern !== 'string' || !resourcePattern.trim()) {
        const err: any = new Error('Resource pattern is required (e.g. "owner/repo")');
        err.statusCode = 400;
        throw err;
      }

      const normalizedPattern = resourcePattern.trim().toLowerCase();

      const policy = await prisma.connectorPolicy.upsert({
        where: {
          connectedAccountId_resourcePattern: {
            connectedAccountId: account.id,
            resourcePattern: normalizedPattern,
          },
        },
        update: {
          allowedRoles: Array.isArray(allowedRoles) ? allowedRoles : [],
          allowedDepartments: Array.isArray(allowedDepartments) ? allowedDepartments : [],
          allowedUsers: Array.isArray(allowedUsers) ? allowedUsers : [],
          deniedRoles: Array.isArray(deniedRoles) ? deniedRoles : [],
          deniedDepartments: Array.isArray(deniedDepartments) ? deniedDepartments : [],
          deniedUsers: Array.isArray(deniedUsers) ? deniedUsers : [],
        },
        create: {
          organizationId: req.user!.organizationId,
          connectedAccountId: account.id,
          resourcePattern: normalizedPattern,
          allowedRoles: Array.isArray(allowedRoles) ? allowedRoles : [],
          allowedDepartments: Array.isArray(allowedDepartments) ? allowedDepartments : [],
          allowedUsers: Array.isArray(allowedUsers) ? allowedUsers : [],
          deniedRoles: Array.isArray(deniedRoles) ? deniedRoles : [],
          deniedDepartments: Array.isArray(deniedDepartments) ? deniedDepartments : [],
          deniedUsers: Array.isArray(deniedUsers) ? deniedUsers : [],
        },
      });

      await this.audit(req, 'PERMISSION_GRANT', policy.id, {
        action: 'CONNECTOR_POLICY_UPDATED',
        provider: account.provider,
        resourcePattern: normalizedPattern,
        allowedRoles: policy.allowedRoles,
        deniedRoles: policy.deniedRoles,
        allowedUsers: policy.allowedUsers,
        deniedUsers: policy.deniedUsers,
      });

      res.status(200).json({ success: true, data: policy });
    } catch (error) {
      next(error);
    }
  };

  public deletePolicy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.isOrgAdmin(req)) {
        const err: any = new Error('Forbidden: Only organization administrators can delete connector policies');
        err.statusCode = 403;
        throw err;
      }

      const account = await this.assertAccess(req, this.paramId(req));
      const policyId = Array.isArray(req.params.policyId) ? req.params.policyId[0] : req.params.policyId;

      const policy = await prisma.connectorPolicy.findFirst({
        where: {
          id: policyId as string,
          connectedAccountId: account.id,
          organizationId: req.user!.organizationId,
        },
      });

      if (!policy) {
        const err: any = new Error('Connector policy not found');
        err.statusCode = 404;
        throw err;
      }

      await prisma.connectorPolicy.delete({ where: { id: policy.id } });

      await this.audit(req, 'PERMISSION_REVOKE', policy.id, {
        action: 'CONNECTOR_POLICY_DELETED',
        provider: account.provider,
        resourcePattern: policy.resourcePattern,
      });

      res.status(200).json({ success: true, message: 'Connector policy deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}