import { IConnector, ConnectorResource } from '../../domain/connectors/IConnector';
import { ConnectorProvider } from '@prisma/client';

export class NotionConnector implements IConnector {
  getProvider(): ConnectorProvider {
    return 'NOTION';
  }

  async fetchResources(accessToken: string, organizationId: string, userId: string): Promise<ConnectorResource[]> {
    console.log('NotionConnector: fetchResources called');
    
    // We use the Notion API to search for all pages the integration has access to
    try {
      const response = await fetch('https://api.notion.com/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: '', // empty query searches everything
          filter: {
            value: 'page',
            property: 'object'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Notion API returned ${response.status} ${response.statusText}`);
      }

      const data: any = await response.json();
      const results = data.results || [];
      const resources: ConnectorResource[] = [];

      for (const page of results) {
        // Extract title (heuristic since Notion page titles can be in different properties)
        let title = 'Untitled Notion Page';
        if (page.properties) {
          const titleProp = Object.values(page.properties).find((p: any) => p.type === 'title') as any;
          if (titleProp && titleProp.title && titleProp.title.length > 0) {
            title = titleProp.title.map((t: any) => t.plain_text).join('');
          }
        }

        // We would ideally fetch the blocks for the page here to get the full content
        // For this implementation, we will fetch the page blocks and convert to simple markdown text
        const content = await this.fetchPageBlocksText(page.id, accessToken);

        resources.push({
          externalId: `notion://${page.id}`,
          title: title,
          content: content,
          sourceUrl: page.url,
          mimeType: 'text/markdown', // We normalize Notion to markdown
          sizeBytes: Buffer.byteLength(content, 'utf8'),
          metadata: {
            externalCreatedAt: page.created_time,
            externalUpdatedAt: page.last_edited_time
          },
          // For MVP, assume Notion workspaces are ORG_WIDE shared spaces
          allowedUsers: [],
          allowedRoles: []
        });
      }

      return resources;
    } catch (err: any) {
      console.error(`NotionConnector fetch failed:`, err.message);
      throw err;
    }
  }

  private async fetchPageBlocksText(pageId: string, accessToken: string): Promise<string> {
    try {
      const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Notion-Version': '2022-06-28'
        }
      });

      if (!response.ok) return '';

      const data: any = await response.json();
      let textContent = '';

      for (const block of data.results || []) {
        const type = block.type;
        if (block[type] && block[type].rich_text) {
          const plainText = block[type].rich_text.map((t: any) => t.plain_text).join('');
          textContent += plainText + '\n\n';
        }
      }

      return textContent.trim();
    } catch (err) {
      return ''; // fallback if blocks fail
    }
  }
}
