import { IConnector, ConnectorResource } from '../../domain/connectors/IConnector';
import { ConnectorProvider } from '@prisma/client';
import { prisma } from '../database/prisma';

const ALLOWED_EXTENSIONS = new Set([
  '.md',
  '.markdown',
  '.txt',
  '.yaml',
  '.yml',
  '.json',
  '.rst',
  '.adoc',
  '.org',
]);

const ALLOWED_SPECIAL_FILENAMES = new Set([
  'readme',
  'contributing',
  'changelog',
  'license',
  'architecture',
  'design',
  'security',
]);

const DENIED_DIRECTORIES = [
  '.git/',
  '.github/',
  'node_modules/',
  'vendor/',
  'dist/',
  'build/',
  'out/',
  'target/',
  'bin/',
  'obj/',
  'coverage/',
  '.nyc_output/',
  '.venv/',
  'venv/',
  'env/',
  '__pycache__/',
  '.idea/',
  '.vscode/',
];

const DENIED_FILENAMES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'gemfile.lock',
  'cargo.lock',
  'poetry.lock',
  'composer.lock',
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  '.env.test',
  'id_rsa',
  'id_rsa.pub',
]);

const DENIED_EXTENSIONS = new Set([
  '.exe', '.dll', '.so', '.dylib', '.bin', '.iso', '.tar', '.gz', '.zip', '.7z', '.rar',
  '.pyc', '.class', '.o', '.a',
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.mp4', '.mp3', '.mov', '.pdf',
  '.pem', '.key', '.crt', '.pfx', '.keystore',
  '.map',
]);

const MAX_REPOS_PER_SYNC = 50;
const MAX_FILES_PER_REPO = 200;
const MAX_FILE_SIZE_BYTES = 1048576; // 1 MB
const MAX_TOTAL_BYTES_PER_SYNC = 20971520; // 20 MB

export class GitHubConnector implements IConnector {
  getProvider(): ConnectorProvider {
    return 'GITHUB';
  }

  private isEligibleFile(filePath: string, sizeBytes?: number): boolean {
    const normalizedPath = filePath.toLowerCase();

    if (sizeBytes !== undefined && sizeBytes > MAX_FILE_SIZE_BYTES) {
      return false;
    }

    for (const dir of DENIED_DIRECTORIES) {
      if (normalizedPath.startsWith(dir) || normalizedPath.includes('/' + dir)) {
        return false;
      }
    }

    const parts = normalizedPath.split('/');
    const filename = parts[parts.length - 1];

    if (DENIED_FILENAMES.has(filename)) {
      return false;
    }

    if (filename.startsWith('.env') || filename.endsWith('.pem') || filename.endsWith('.key')) {
      return false;
    }

    if (filename.endsWith('.min.js') || filename.endsWith('.min.css')) {
      return false;
    }

    const extIndex = filename.lastIndexOf('.');
    const ext = extIndex !== -1 ? filename.substring(extIndex) : '';

    if (DENIED_EXTENSIONS.has(ext)) {
      return false;
    }

    if (ALLOWED_EXTENSIONS.has(ext)) {
      return true;
    }

    const baseName = extIndex !== -1 ? filename.substring(0, extIndex) : filename;
    if (ALLOWED_SPECIAL_FILENAMES.has(baseName)) {
      return true;
    }

    return false;
  }

  private getMimeType(filePath: string): string {
    const lower = filePath.toLowerCase();
    if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'text/markdown';
    if (lower.endsWith('.json')) return 'application/json';
    if (lower.endsWith('.yaml') || lower.endsWith('.yml')) return 'application/x-yaml';
    return 'text/plain';
  }

  async fetchResources(
    accessToken: string,
    organizationId: string,
    userId: string,
    extraOptions?: { accountId?: string; selectedRepos?: string[] }
  ): Promise<ConnectorResource[]> {
    let targetRepos: string[] = extraOptions?.selectedRepos || [];

    if (targetRepos.length === 0 && extraOptions?.accountId) {
      const account = await prisma.connectedAccount.findUnique({
        where: { id: extraOptions.accountId },
        select: { metadata: true }
      });
      targetRepos = (account?.metadata as any)?.selectedRepos || [];
    }

    if (!Array.isArray(targetRepos) || targetRepos.length === 0) {
      throw new Error(
        'No repositories selected for GitHub synchronization. Please select target repositories in Settings -> Data Connectors.'
      );
    }

    const selectedRepos = targetRepos.slice(0, MAX_REPOS_PER_SYNC);
    const resources: ConnectorResource[] = [];
    let totalBytesSync = 0;

    for (const repoFullName of selectedRepos) {
      if (totalBytesSync >= MAX_TOTAL_BYTES_PER_SYNC) {
        console.warn(`[GitHubConnector] Max total sync byte limit reached (${MAX_TOTAL_BYTES_PER_SYNC} bytes). Stopping fetch.`);
        break;
      }

      try {
        // 1. Verify accessibility & get repo metadata
        const repoRes = await fetch(`https://api.github.com/repos/${repoFullName}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'AUREN-Knowledge-OS'
          }
        });

        if (repoRes.status === 401 || repoRes.status === 403) {
          const errText = await repoRes.text();
          if (errText.includes('Bad credentials') || errText.includes('revoked') || repoRes.status === 401) {
            throw new Error(
              `GitHub authentication failed (HTTP ${repoRes.status}). The access token may be expired or revoked. Please reconnect your GitHub account.`
            );
          }
        }

        if (!repoRes.ok) {
          console.warn(`[GitHubConnector] Skipping repository ${repoFullName}: HTTP ${repoRes.status} ${repoRes.statusText}`);
          continue;
        }

        const repoData: any = await repoRes.json();
        const defaultBranch = repoData.default_branch || 'main';
        const isPrivate = Boolean(repoData.private);
        const repoId = String(repoData.id);

        // 2. Fetch Git Tree recursively for default branch
        const treeRes = await fetch(`https://api.github.com/repos/${repoFullName}/git/trees/${defaultBranch}?recursive=1`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'AUREN-Knowledge-OS'
          }
        });

        if (!treeRes.ok) {
          console.warn(`[GitHubConnector] Failed to fetch tree for ${repoFullName} (${defaultBranch}): HTTP ${treeRes.status}`);
          continue;
        }

        const treeData: any = await treeRes.json();
        const treeItems: any[] = treeData.tree || [];

        // 3. Filter eligible blobs
        const eligibleBlobs = treeItems.filter(
          (item) => item.type === 'blob' && this.isEligibleFile(item.path, item.size)
        ).slice(0, MAX_FILES_PER_REPO);

        // 4. Fetch content for each eligible blob
        for (const blob of eligibleBlobs) {
          if (totalBytesSync >= MAX_TOTAL_BYTES_PER_SYNC) {
            break;
          }

          try {
            const encodedPath = blob.path.split('/').map(encodeURIComponent).join('/');
            const contentRes = await fetch(
              `https://api.github.com/repos/${repoFullName}/contents/${encodedPath}?ref=${defaultBranch}`,
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Accept': 'application/vnd.github.v3.raw',
                  'User-Agent': 'AUREN-Knowledge-OS'
                }
              }
            );

            if (!contentRes.ok) {
              console.warn(`[GitHubConnector] Could not fetch content for ${repoFullName}/${blob.path}: HTTP ${contentRes.status}`);
              continue;
            }

            const rawContent = await contentRes.text();
            if (!rawContent || rawContent.trim().length === 0) {
              continue;
            }

            const sizeBytes = Buffer.byteLength(rawContent, 'utf8');

            if (sizeBytes > MAX_FILE_SIZE_BYTES) {
              continue;
            }

            totalBytesSync += sizeBytes;

            const cleanPath = blob.path.replace(/^\/+/, '');
            const canonicalUrl = `https://github.com/${repoFullName}/blob/${defaultBranch}/${cleanPath}`;

            resources.push({
              externalId: `github://${repoFullName}/${cleanPath}`,
              title: `${repoFullName}: ${cleanPath}`,
              content: rawContent,
              sourceUrl: canonicalUrl,
              mimeType: this.getMimeType(cleanPath),
              sizeBytes,
              metadata: {
                sourceProvider: 'GITHUB',
                repo: repoFullName,
                repositoryFullName: repoFullName,
                repositoryId: repoId,
                branch: defaultBranch,
                path: blob.path,
                sourceUrl: canonicalUrl,
                githubFileSha: blob.sha,
              },
              allowedUsers: isPrivate ? [userId] : [],
              allowedRoles: []
            });
          } catch (fileErr: any) {
            console.warn(`[GitHubConnector] Error fetching file ${repoFullName}/${blob.path}:`, fileErr.message);
          }
        }
      } catch (err: any) {
        if (err.message && err.message.includes('authentication failed')) {
          throw err;
        }
        console.error(`[GitHubConnector] Error processing repository ${repoFullName}:`, err.message);
      }
    }

    return resources;
  }

  async fetchIncremental(
    accessToken: string,
    organizationId: string,
    userId: string,
    lastSyncAt: Date,
    extraOptions?: { accountId?: string; selectedRepos?: string[] }
  ): Promise<ConnectorResource[]> {
    return this.fetchResources(accessToken, organizationId, userId, extraOptions);
  }
}
