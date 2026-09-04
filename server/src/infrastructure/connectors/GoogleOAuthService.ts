import fetch from 'node-fetch';

export interface GoogleOAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  scope?: string;
  tokenType?: string;
  email?: string;
}

export class GoogleOAuthService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID || '';
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    this.redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/v1/connectors/google/callback';
  }

  /**
   * Generates the Google OAuth 2.0 Authorization URL.
   * @param state Encoded payload (e.g. JSON with { organizationId, userId })
   */
  getAuthUrl(state: string): string {
    if (!this.clientId) {
      console.warn('GoogleOAuthService: GOOGLE_CLIENT_ID is not configured');
    }

    const scopes = [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'openid'
    ];

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline', // Requests refresh_token
      prompt: 'consent',     // Forces consent prompt to ensure refresh_token is returned
      state
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchanges authorization code for access and refresh tokens.
   */
  async exchangeCodeForTokens(code: string): Promise<GoogleOAuthTokens> {
    const params = new URLSearchParams({
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      grant_type: 'authorization_code'
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to exchange Google OAuth code: ${response.status} ${errorText}`);
    }

    const data: any = await response.json();

    let email: string | undefined;
    if (data.access_token) {
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${data.access_token}` }
        });
        if (userInfoRes.ok) {
          const userInfo: any = await userInfoRes.json();
          email = userInfo.email;
        }
      } catch (err) {
        console.warn('GoogleOAuthService: Failed to fetch user email after token exchange', err);
      }
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scope: data.scope,
      tokenType: data.token_type,
      email
    };
  }

  /**
   * Refreshes an expired access token using a valid refresh token.
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to refresh Google OAuth token: ${response.status} ${errorText}`);
    }

    const data: any = await response.json();

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in
    };
  }
}
