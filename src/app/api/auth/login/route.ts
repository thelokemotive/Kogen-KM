import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { SESSION_COOKIE, createSession, verifyPassword } from '@/lib/auth';
import { redirectWithError, str } from '@/lib/api';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = str(form, 'email', 200).toLowerCase();
  const password = typeof form.get('password') === 'string' ? (form.get('password') as string) : '';

  const row = getDb()
    .prepare('SELECT id, password_hash, is_active FROM users WHERE email = ?')
    .get(email) as { id: number; password_hash: string; is_active: number } | undefined;

  if (!row || !verifyPassword(password, row.password_hash))
    return redirectWithError(req, '/login', 'Wrong email or password.');
  if (!row.is_active)
    return redirectWithError(req, '/login', 'This account has been deactivated. Please speak to a member of staff.');

  const { token, expires } = createSession(row.id);
  const res = NextResponse.redirect(new URL('/feed', req.url), 303);
  res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/', expires });
  return res;
}
