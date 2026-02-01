import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url));
  }

  try {
    const authentikUrl = process.env.AUTHENTIK_INTERNAL_URL || 'http://authentik:9000';
    const clientId = process.env.AUTHENTIK_CLIENT_ID || '';
    const clientSecret = process.env.AUTHENTIK_CLIENT_SECRET || '';
    const redirectUri = process.env.AUTHENTIK_REDIRECT_URI || 'http://localhost:3000/api/auth/callback';

    const tokenResponse = await fetch(`${authentikUrl}/application/o/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokens = await tokenResponse.json();

    const userinfoResponse = await fetch(`${authentikUrl}/application/o/userinfo/`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userinfoResponse.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userinfo = await userinfoResponse.json();

    let user = await db.select().from(users).where(eq(users.authentikId, userinfo.sub)).limit(1);

    if (user.length === 0) {
      const newUser = {
        authentikId: userinfo.sub,
        email: userinfo.email,
        name: userinfo.name || userinfo.email.split('@')[0],
        avatarUrl: userinfo.picture || null,
      };

      const inserted = await db.insert(users).values(newUser).returning();
      user = inserted;
    }

    const token = await signToken({ userId: user[0].id, email: user[0].email });

    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/login?error=server_error', request.url));
  }
}
