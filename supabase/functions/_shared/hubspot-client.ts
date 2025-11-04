// Shared HubSpot API client with automatic token refresh
// Use this in your app to make authenticated HubSpot API calls

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface HubSpotClientConfig {
  supabaseUrl: string;
  supabaseKey: string;
  portalId: number;
}

export class HubSpotClient {
  private supabase;
  private portalId: number;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(config: HubSpotClientConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    this.portalId = config.portalId;
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a cached token that's still valid
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Fetch token from database
    const { data: tokenRecord, error } = await this.supabase
      .from('oauth_tokens')
      .select('*')
      .eq('portal_id', this.portalId)
      .single();

    if (error || !tokenRecord) {
      throw new Error('No OAuth tokens found for this portal');
    }

    // Check if token is expired
    const expiresAt = new Date(tokenRecord.expires_at);
    const now = new Date();

    if (now >= expiresAt) {
      // Token is expired, refresh it
      await this.refreshToken();
      // Fetch the new token
      const { data: newTokenRecord } = await this.supabase
        .from('oauth_tokens')
        .select('*')
        .eq('portal_id', this.portalId)
        .single();

      if (!newTokenRecord) {
        throw new Error('Failed to get refreshed token');
      }

      this.accessToken = newTokenRecord.access_token;
      this.tokenExpiry = new Date(newTokenRecord.expires_at);
    } else {
      this.accessToken = tokenRecord.access_token;
      this.tokenExpiry = expiresAt;
    }

    return this.accessToken;
  }

  /**
   * Refresh the access token
   */
  private async refreshToken(): Promise<void> {
    const CLIENT_ID = Deno.env.get('HUBSPOT_CLIENT_ID');
    const CLIENT_SECRET = Deno.env.get('HUBSPOT_CLIENT_SECRET');
    const REDIRECT_URI = Deno.env.get('HUBSPOT_REDIRECT_URI');

    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
      throw new Error('Missing required environment variables');
    }

    // Get current refresh token
    const { data: tokenRecord } = await this.supabase
      .from('oauth_tokens')
      .select('refresh_token')
      .eq('portal_id', this.portalId)
      .single();

    if (!tokenRecord) {
      throw new Error('No refresh token found');
    }

    // Exchange refresh token for new access token
    const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        refresh_token: tokenRecord.refresh_token,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    // Update database
    await this.supabase
      .from('oauth_tokens')
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: expiresAt.toISOString(),
      })
      .eq('portal_id', this.portalId);

    // Update cache
    this.accessToken = data.access_token;
    this.tokenExpiry = expiresAt;
  }

  /**
   * Make an authenticated API request to HubSpot
   */
  async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const accessToken = await this.getAccessToken();

    const url = endpoint.startsWith('http')
      ? endpoint
      : `https://api.hubapi.com${endpoint}`;

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If we get a 401, try refreshing the token once
    if (response.status === 401) {
      await this.refreshToken();
      const newAccessToken = await this.getAccessToken();

      headers.Authorization = `Bearer ${newAccessToken}`;
      return fetch(url, { ...options, headers });
    }

    return response;
  }

  /**
   * Convenience method for GET requests
   */
  async get(endpoint: string): Promise<any> {
    const response = await this.request(endpoint);
    return response.json();
  }

  /**
   * Convenience method for POST requests
   */
  async post(endpoint: string, body: any): Promise<any> {
    const response = await this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return response.json();
  }

  /**
   * Convenience method for PATCH requests
   */
  async patch(endpoint: string, body: any): Promise<any> {
    const response = await this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return response.json();
  }

  /**
   * Convenience method for DELETE requests
   */
  async delete(endpoint: string): Promise<any> {
    const response = await this.request(endpoint, {
      method: 'DELETE',
    });
    return response.json();
  }
}

