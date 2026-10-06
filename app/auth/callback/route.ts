import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** Exchanges Supabase auth codes / OTP hashes and sets session cookies (PKCE + email links). */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/';

  const redirectTo = new URL(next.startsWith('/') ? next : `/${next}`, origin);
  redirectTo.searchParams.delete('code');
  redirectTo.searchParams.delete('token_hash');
  redirectTo.searchParams.delete('type');
  redirectTo.searchParams.delete('next');

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (redirectTo.pathname === '/update-password') {
        redirectTo.searchParams.set('recovery', '1');
      }
      return NextResponse.redirect(redirectTo);
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      if (type === 'recovery' || redirectTo.pathname === '/update-password') {
        redirectTo.pathname = '/update-password';
        redirectTo.searchParams.set('recovery', '1');
      }
      return NextResponse.redirect(redirectTo);
    }
  }

  const login = new URL('/login', origin);
  login.searchParams.set('auth_error', 'link_expired');
  return NextResponse.redirect(login);
}
