import fetch from 'node-fetch';
import { EncryptionService } from '../../application/services/EncryptionService';

export interface GitHubOAuthResult {
  accessToken: string;
  scope?: string;
  tokenType?: string;
  githubAccountId: string;
  githubLogin: string;
  githubEmail?: string;
}

export interface OAuthStatePayload {
  organizationId: string;
  userId: string;
  timestamp: number;
  nonce: string;
}

export class GitHubOAuthService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.GITHUB_CLIENT_ID || '';
    this.clientSecret = process.env.GITHUB_CLIENT_SECRET || '';
    this.redirectUri = process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/v1/connectors/github/callback';
  }

  /**
   * Generates a cryptographically secure, encrypted state string containing tenant and user identity.
   */
  public generateState(organizationId: string, userId: string): string {
    const payload: OAuthStatePayload = {
      organizationId,
      userId,
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(2, 15),
    };

    const jsonStr = JSON.stringify(payload);
    const encrypted = EncryptionService.encrypt(jsonStr);
    return Buffer.from(JSON.stringify(encrypted)).toString('base64url');
  }

  /**
   * Decrypts and validates the state parameter.
   */
  public verifyState(stateStr: string): OAuthStatePayload {
    try {
      const decodedJson = Buffer.from(stateStr, 'base64url').toString('utf8');
      const encryptedData = JSON.parse(decodedJson);
      
      if (!encryptedData.encrypted || !encryptedData.iv) {
        throw new Error('Invalid state structure');
      }

      const decryptedJson = EncryptionService.decrypt(encryptedData.encrypted, encryptedData.iv);
      const payload: OAuthStatePayload = JSON.parse(decryptedJson);

      if (!payload.organizationId || !payload.userId) {
        throw new Error('State payload missing context identifiers');
      }

      // Expire state after 15 minutes to prevent replay attacks
      const maxAgeMs = 15 * 60 * 1000;
      if (Date.now() - payload.timestamp > maxAgeMs) {
        throw new Error('OAuth state expired');
      }

      return payload;
    } catch (err: any) {
      throw new Error(`Invalid OAuth state token: ${err?.message || 'Verification failed'}`);
    }
  }

  /**
   * Generates the GitHub OAuth 2.0 Authorization URL.
   */
  public getAuthUrl(state: string): string {
    if (!this.clientId) {
      throw new Error(
        'GitHub OAuth credentials are not configured. Please add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to server/.env'
      );
    }

    const scopes = ['repo', 'read:user', 'user:email'];

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scopes.join(' '),
      state,
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchanges authorization code for GitHub access token and retrieves user identity.
   */
  public async exchangeCodeForTokens(code: string): Promise<GitHubOAuthResult> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('GitHub OAuth credentials (GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET) are not configured');
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      redirect_uri: this.redirectUri,
    });

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'AUREN-Knowledge-OS',
      },
      body: params.toString(),
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      throw new Error(`GitHub token exchange failed: ${tokenRes.status} ${errorText}`);
    }

    const tokenData: any = await tokenRes.json();

    if (tokenData.error) {
      throw new Error(`GitHub OAuth error: ${tokenData.error_description || tokenData.error}`);
    }

    const accessToken = tokenData.access_token;
    if (!accessToken) {
      throw new Error('GitHub token exchange returned empty access token');
    }

    // Retrieve GitHub User Profile
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AUREN-Knowledge-OS',
      },
    });

    if (!userRes.ok) {
      throw new Error(`Failed to fetch GitHub user identity: ${userRes.status} ${userRes.statusText}`);
    }

    const userData: any = await userRes.json();

    let githubEmail: string | undefined = userData.email || undefined;

    // If primary email is null/private, fetch from /user/emails
    if (!githubEmail) {
      try {
        const emailsRes = await fetch('https://api.github.com/user/emails', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'AUREN-Knowledge-OS',
          },
        });
        if (emailsRes.ok) {
          const emails: any = await emailsRes.json();
          if (Array.isArray(emails)) {
            const primaryObj = emails.find((e: any) => e.primary && e.verified) || emails[0];
            if (primaryObj?.email) {
              githubEmail = primaryObj.email;
            }
          }
        }
      } catch (e) {
        console.warn('GitHubOAuthService: Warning fetching user emails:', e);
      }
    }

    return {
      accessToken,
      scope: tokenData.scope,
      tokenType: tokenData.token_type,
      githubAccountId: String(userData.id),
      githubLogin: userData.login,
      githubEmail,
    };
  }

  /**
   * Fetches repositories accessible to the connected GitHub access token (handles pagination up to 500 repos).
   */
  public async fetchAccessibleRepositories(accessToken: string): Promise<GitHubRepoDto[]> {
    const repos: GitHubRepoDto[] = [];
    const perPage = 100;
    const maxPages = 5;

    for (let page = 1; page <= maxPages; page++) {
      const response = await fetch(`https://api.github.com/user/repos?per_page=${perPage}&page=${page}&sort=updated`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'AUREN-Knowledge-OS',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('GitHub access token expired or revoked. Please reconnect your account.');
        }
        if (response.status === 403) {
          throw new Error('GitHub API rate limit exceeded. Please try again later.');
        }
        const errText = await response.text();
        throw new Error(`GitHub API error (${response.status}): ${errText}`);
      }

      const pageData: any = await response.json();
      if (!Array.isArray(pageData) || pageData.length === 0) {
        break;
      }

      for (const item of pageData) {
        repos.push({
          id: item.id,
          name: item.name,
          fullName: item.full_name,
          owner: {
            login: item.owner?.login || '',
            avatarUrl: item.owner?.avatar_url,
          },
          private: Boolean(item.private),
          defaultBranch: item.default_branch || 'main',
          description: item.description || null,
          htmlUrl: item.html_url,
        });
      }

      if (pageData.length < perPage) {
        break;
      }
    }

    return repos;
  }
}
export interface GitHubRepoDto {
  id: number;
  name: string;
  fullName: string;
  owner: {
    login: string;
    avatarUrl?: string;
  };
  private: boolean;
  defaultBranch: string;
  description: string | null;
  htmlUrl: string;
}
