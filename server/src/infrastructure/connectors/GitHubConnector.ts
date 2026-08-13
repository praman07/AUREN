import { IConnector, ConnectorResource } from '../../domain/connectors/IConnector';
import { ConnectorProvider } from '@prisma/client';


export class GitHubConnector implements IConnector {
  getProvider(): ConnectorProvider {
    return 'GITHUB';
  }

  async fetchResources(accessToken: string, organizationId: string, userId: string): Promise<ConnectorResource[]> {
    try {
      // 1. Fetch accessible repositories for the authenticated user
      const reposResponse = await fetch(`https://api.github.com/user/repos?per_page=5`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'EKOS-Knowledge-OS'
        }
      });

      if (!reposResponse.ok) {
        throw new Error(`GitHub API (repos) returned ${reposResponse.status} ${reposResponse.statusText}`);
      }

      const repos: any = await reposResponse.json();
      const resources: ConnectorResource[] = [];

      // 2. Fetch READMEs for accessible repos
      for (const repo of repos) {
        const repoName = repo.full_name;
        try {
          const readmeResponse = await fetch(`https://api.github.com/repos/${repoName}/readme`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/vnd.github.v3.raw',
              'User-Agent': 'EKOS-Knowledge-OS'
            }
          });

          if (!readmeResponse.ok) continue;

          const content = await readmeResponse.text();

          resources.push({
            externalId: `github://${repoName}/README.md`,
            title: `${repoName} README`,
            content: content,
            sourceUrl: repo.html_url,
            mimeType: 'text/markdown',
            sizeBytes: Buffer.byteLength(content, 'utf8'),
            metadata: {
              repo: repoName,
              branch: repo.default_branch,
              externalCreatedAt: repo.created_at,
              externalUpdatedAt: repo.updated_at
            },
            // If the repo is private, only the authorizing user can access it.
            // If public, we allow ORG_WIDE (no restrictions) in MVP.
            allowedUsers: repo.private ? [userId] : [],
            allowedRoles: []
          });
        } catch (readmeErr) {
          console.warn(`Could not fetch README for ${repoName}`);
        }
      }

      return resources;
    } catch (err: any) {
      console.error(`GitHubConnector fetch failed:`, err.message);
      throw err;
    }
  }

  async fetchIncremental(accessToken: string, organizationId: string, userId: string, lastSyncAt: Date): Promise<ConnectorResource[]> {
    // Incremental not yet implemented for MVP proof
    return this.fetchResources(accessToken, organizationId, userId);
  }
}
