import { IConnector, ConnectorResource } from '../../domain/connectors/IConnector';
import { ConnectorProvider } from '@prisma/client';
import fetch from 'node-fetch';

export class GoogleDriveConnector implements IConnector {
  getProvider(): ConnectorProvider {
    return 'GOOGLE_DRIVE' as ConnectorProvider;
  }

  /**
   * Fetches document resources from Google Drive / Google Docs and normalizes them into Canonical knowledge.
   */
  async fetchResources(accessToken: string, organizationId: string, userId: string): Promise<ConnectorResource[]> {
    console.log(`[GoogleDriveConnector] Fetching resources for org=${organizationId}, user=${userId}`);

    try {
      // 1. Search non-trashed Google Docs & Text files in user's Drive
      const driveQuery = "trashed = false and (mimeType = 'application/vnd.google-apps.document' or mimeType = 'text/plain')";
      const fields = 'files(id, name, mimeType, modifiedTime, createdTime, webViewLink, size, permissions, owners, shared)';
      
      const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(driveQuery)}&fields=${encodeURIComponent(fields)}&pageSize=50`;

      const listResponse = await fetch(listUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!listResponse.ok) {
        const errText = await listResponse.text();
        throw new Error(`Google Drive API returned HTTP ${listResponse.status}: ${errText}`);
      }

      const listData: any = await listResponse.json();
      const files = listData.files || [];
      console.log(`[GoogleDriveConnector] Found ${files.length} Google Drive files to process`);

      const resources: ConnectorResource[] = [];

      for (const file of files) {
        try {
          let fileTextContent = '';

          if (file.mimeType === 'application/vnd.google-apps.document') {
            // Export Google Doc as plain text
            const exportUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`;
            const exportRes = await fetch(exportUrl, {
              headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (exportRes.ok) {
              fileTextContent = await exportRes.text();
            } else {
              console.warn(`[GoogleDriveConnector] Failed to export Google Doc ${file.id} (${file.name}): HTTP ${exportRes.status}`);
              continue;
            }
          } else if (file.mimeType === 'text/plain') {
            // Fetch raw text media
            const mediaUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
            const mediaRes = await fetch(mediaUrl, {
              headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (mediaRes.ok) {
              fileTextContent = await mediaRes.text();
            } else {
              console.warn(`[GoogleDriveConnector] Failed to download text file ${file.id} (${file.name}): HTTP ${mediaRes.status}`);
              continue;
            }
          }

          if (!fileTextContent || fileTextContent.trim().length === 0) {
            console.log(`[GoogleDriveConnector] Skipping empty file ${file.name} (${file.id})`);
            continue;
          }

          // Format canonical text with title and metadata
          const canonicalText = `# ${file.name}\n\n${fileTextContent.trim()}`;

          // Permission mapping (Fail-Closed)
          // Extract allowed user emails from Google permissions
          const allowedUserEmails: string[] = [];
          let isDomainOrPublic = false;

          if (Array.isArray(file.permissions)) {
            for (const perm of file.permissions) {
              if (perm.type === 'user' && perm.emailAddress) {
                allowedUserEmails.push(perm.emailAddress);
              } else if (perm.type === 'domain' || perm.type === 'anyone') {
                isDomainOrPublic = true;
              }
            }
          }

          if (Array.isArray(file.owners)) {
            for (const owner of file.owners) {
              if (owner.emailAddress && !allowedUserEmails.includes(owner.emailAddress)) {
                allowedUserEmails.push(owner.emailAddress);
              }
            }
          }

          // Fallback RBAC: Default to authorizing user to maintain strict privacy
          const allowedUsers = [userId];

          resources.push({
            externalId: `gdrive://${file.id}`,
            title: file.name,
            content: canonicalText,
            sourceUrl: file.webViewLink || `https://docs.google.com/document/d/${file.id}/edit`,
            mimeType: 'text/plain',
            sizeBytes: Buffer.byteLength(canonicalText, 'utf8'),
            metadata: {
              googleFileId: file.id,
              originalMimeType: file.mimeType,
              isShared: file.shared || false,
              isDomainOrPublic,
              allowedUserEmails,
              externalCreatedAt: file.createdTime || new Date().toISOString(),
              externalUpdatedAt: file.modifiedTime || new Date().toISOString()
            },
            allowedUsers,
            allowedRoles: []
          });

        } catch (fileErr: any) {
          console.error(`[GoogleDriveConnector] Error processing file ${file.id} (${file.name}):`, fileErr.message);
        }
      }

      console.log(`[GoogleDriveConnector] Successfully normalized ${resources.length} resources`);
      return resources;
    } catch (err: any) {
      console.error(`[GoogleDriveConnector] fetchResources failed:`, err.message);
      throw err;
    }
  }

  /**
   * Incremental sync for Google Drive resources modified since lastSyncAt.
   */
  async fetchIncremental?(accessToken: string, organizationId: string, userId: string, lastSyncAt: Date): Promise<ConnectorResource[]> {
    console.log(`[GoogleDriveConnector] Fetching incremental resources since ${lastSyncAt.toISOString()}`);
    // Google Drive supports modifiedTime filter in ISO string format
    const isoDate = lastSyncAt.toISOString();
    const driveQuery = `trashed = false and modifiedTime > '${isoDate}' and (mimeType = 'application/vnd.google-apps.document' or mimeType = 'text/plain')`;
    const fields = 'files(id, name, mimeType, modifiedTime, createdTime, webViewLink, size, permissions, owners, shared)';
    
    const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(driveQuery)}&fields=${encodeURIComponent(fields)}&pageSize=50`;

    const listResponse = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!listResponse.ok) {
      const errText = await listResponse.text();
      throw new Error(`Google Drive API returned HTTP ${listResponse.status}: ${errText}`);
    }

    const listData: any = await listResponse.json();
    const files = listData.files || [];

    const resources: ConnectorResource[] = [];
    for (const file of files) {
      try {
        let fileTextContent = '';
        if (file.mimeType === 'application/vnd.google-apps.document') {
          const exportUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`;
          const exportRes = await fetch(exportUrl, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          if (exportRes.ok) fileTextContent = await exportRes.text();
        } else if (file.mimeType === 'text/plain') {
          const mediaUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
          const mediaRes = await fetch(mediaUrl, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          if (mediaRes.ok) fileTextContent = await mediaRes.text();
        }

        if (!fileTextContent || fileTextContent.trim().length === 0) continue;

        const canonicalText = `# ${file.name}\n\n${fileTextContent.trim()}`;

        resources.push({
          externalId: `gdrive://${file.id}`,
          title: file.name,
          content: canonicalText,
          sourceUrl: file.webViewLink || `https://docs.google.com/document/d/${file.id}/edit`,
          mimeType: 'text/plain',
          sizeBytes: Buffer.byteLength(canonicalText, 'utf8'),
          metadata: {
            googleFileId: file.id,
            originalMimeType: file.mimeType,
            externalCreatedAt: file.createdTime || new Date().toISOString(),
            externalUpdatedAt: file.modifiedTime || new Date().toISOString()
          },
          allowedUsers: [userId],
          allowedRoles: []
        });
      } catch (e: any) {
        console.error(`[GoogleDriveConnector] Incremental file fetch failed for ${file.id}:`, e.message);
      }
    }

    return resources;
  }
}
