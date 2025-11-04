-- Create OAuth tokens table
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id INTEGER NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scopes TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on portal_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_portal_id ON oauth_tokens(portal_id);

-- Create index on expires_at for token cleanup
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires_at ON oauth_tokens(expires_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_oauth_tokens_updated_at BEFORE UPDATE ON oauth_tokens
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role access (for Edge Functions)
CREATE POLICY "Allow service role full access" ON oauth_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE oauth_tokens IS 'Stores HubSpot OAuth tokens for each portal';
COMMENT ON COLUMN oauth_tokens.portal_id IS 'HubSpot portal/account ID';
COMMENT ON COLUMN oauth_tokens.access_token IS 'Current OAuth access token';
COMMENT ON COLUMN oauth_tokens.refresh_token IS 'OAuth refresh token for getting new access tokens';
COMMENT ON COLUMN oauth_tokens.expires_at IS 'Timestamp when the access token expires';
COMMENT ON COLUMN oauth_tokens.scopes IS 'Array of granted OAuth scopes';

