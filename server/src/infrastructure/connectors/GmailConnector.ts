import { IConnector, ConnectorResource } from '../../domain/connectors/IConnector';
import { ConnectorProvider } from '@prisma/client';

export class GmailConnector implements IConnector {
  getProvider(): ConnectorProvider {
    return 'GMAIL';
  }

  async fetchResources(accessToken: string, organizationId: string): Promise<ConnectorResource[]> {
    console.log('GmailConnector: fetchResources called');
    
    try {
      // 1. Fetch message list
      const listResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!listResponse.ok) {
        throw new Error(`Gmail API returned ${listResponse.status} ${listResponse.statusText}`);
      }

      const listData: any = await listResponse.json();
      const messages = listData.messages || [];
      const resources: ConnectorResource[] = [];

      for (const msg of messages) {
        // 2. Fetch full message
        const msgResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!msgResponse.ok) continue;
        const msgData: any = await msgResponse.json();

        // 3. Extract headers
        const headers = msgData.payload.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'No Subject';
        const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender';
        const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || new Date().toISOString();

        // 4. Extract body
        let bodyText = '';
        if (msgData.payload.parts) {
          const textPart = msgData.payload.parts.find((p: any) => p.mimeType === 'text/plain');
          if (textPart && textPart.body && textPart.body.data) {
            bodyText = Buffer.from(textPart.body.data, 'base64').toString('utf8');
          } else {
            const htmlPart = msgData.payload.parts.find((p: any) => p.mimeType === 'text/html');
            if (htmlPart && htmlPart.body && htmlPart.body.data) {
              const htmlContent = Buffer.from(htmlPart.body.data, 'base64').toString('utf8');
              bodyText = htmlContent.replace(/<[^>]+>/g, ' ').trim(); // Simple HTML stripping
            }
          }
        } else if (msgData.payload.body && msgData.payload.body.data) {
          bodyText = Buffer.from(msgData.payload.body.data, 'base64').toString('utf8');
        }

        const canonicalText = `From: ${from}\nDate: ${date}\nSubject: ${subject}\n\n${bodyText}`;

        resources.push({
          externalId: `gmail://${msg.id}`,
          title: subject,
          content: canonicalText,
          sourceUrl: `https://mail.google.com/mail/u/0/#inbox/${msg.id}`,
          mimeType: 'text/plain',
          sizeBytes: Buffer.byteLength(canonicalText, 'utf8'),
          metadata: {
            from,
            threadId: msgData.threadId,
            externalCreatedAt: new Date(parseInt(msgData.internalDate)).toISOString(),
            externalUpdatedAt: new Date(parseInt(msgData.internalDate)).toISOString()
          }
        });
      }

      return resources;
    } catch (err: any) {
      console.error(`GmailConnector fetch failed:`, err.message);
      throw err;
    }
  }
}
