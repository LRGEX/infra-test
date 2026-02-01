import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authentikUrl = process.env.AUTHENTIK_URL || 'http://authentik:9000';
  const clientId = process.env.AUTHENTIK_CLIENT_ID || '';
  const redirectUri = process.env.AUTHENTIK_REDIRECT_URI || 'http://localhost:3000/api/auth/callback';
  
  const state = crypto.randomUUID();
  
  const authUrl = new URL(`${authentikUrl}/application/o/authorize/`);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid profile email');
  authUrl.searchParams.set('state', state);
  
  return NextResponse.redirect(authUrl.toString());
}
