/**
 * HubSpot API Client with OAuth Token Management
 *
 * Automatically handles OAuth token retrieval, caching, and refresh.
 * Stores tokens in Supabase and refreshes them when expired.
 */

import { createClient } from 'npm:@supabase/supabase-js@2'

export interface HubSpotClientConfig {
  supabaseUrl: string;
  supabaseKey: string;
  portalId: number;
}

/**
 * HubSpot API client that manages OAuth tokens automatically
 */
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
   * Gets a valid access token, refreshing if necessary
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
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

    const expiresAt = new Date(tokenRecord.expires_at);
    const now = new Date();

    // Refresh if expired
    if (now >= expiresAt) {
      await this.refreshToken();
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

    if (!this.accessToken) {
      throw new Error('Failed to retrieve access token');
    }

    return this.accessToken;
  }

  /**
   * Refreshes the OAuth token using the refresh token
   */
  private async refreshToken(): Promise<void> {
    const CLIENT_ID = Deno.env.get('HUBSPOT_CLIENT_ID');
    const CLIENT_SECRET = Deno.env.get('HUBSPOT_CLIENT_SECRET');
    const REDIRECT_URI = Deno.env.get('HUBSPOT_REDIRECT_URI');

    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
      throw new Error('Missing required environment variables');
    }

    const { data: tokenRecord } = await this.supabase
      .from('oauth_tokens')
      .select('refresh_token')
      .eq('portal_id', this.portalId)
      .single();

    if (!tokenRecord) {
      throw new Error('No refresh token found');
    }

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

    // Update tokens in database
    await this.supabase
      .from('oauth_tokens')
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: expiresAt.toISOString(),
      })
      .eq('portal_id', this.portalId);

    this.accessToken = data.access_token;
    this.tokenExpiry = expiresAt;
  }

  /**
   * Makes an authenticated request to the HubSpot API
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

    // Retry once with refreshed token on 401
    if (response.status === 401) {
      await this.refreshToken();
      const newAccessToken = await this.getAccessToken();

      headers.Authorization = `Bearer ${newAccessToken}`;
      return fetch(url, { ...options, headers });
    }

    return response;
  }

  /**
   * Performs a GET request to the HubSpot API
   */
  async get(endpoint: string): Promise<unknown> {
    const response = await this.request(endpoint);
    return response.json();
  }

  /**
   * Performs a POST request to the HubSpot API
   */
  async post(endpoint: string, body: unknown): Promise<unknown> {
    const response = await this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return response.json();
  }

  /**
   * Performs a PATCH request to the HubSpot API
   */
  async patch(endpoint: string, body: unknown): Promise<unknown> {
    const response = await this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return response.json();
  }

  /**
   * Performs a DELETE request to the HubSpot API
   */
  async delete(endpoint: string): Promise<unknown> {
    const response = await this.request(endpoint, {
      method: 'DELETE',
    });
    return response.json();
  }
}
