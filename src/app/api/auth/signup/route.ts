import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import {
  SESSION_COOKIE,
  allowedDomains,
  createSession,
  hashPassword,
  isAllowedEmail,
  roleForNewUser,
} from '@/lib/auth';
import { redirectWithError, str } from '@/lib/api';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = str(form, 'email', 200).toLowerCase();
  const name = str(form, 'display_name', 60);
  const password = typeof form.get('password') === 'string' ? (form.get('password') as string) : '';

  if (!email || !name || !password) return redirectWithError(req, '/signup', 'Please fill in every field.');
  if (!isAllowedEmail(email))
    return redirectWithError(
      req,
      '/signup',
      `Please use your school email address (@${allowedDomains().join(' or @')}).`
    );
  if (password.length < 8) return redirectWithError(req, '/signup', 'Password must be at least 8 characters.');

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return redirectWithError(req, '/signup', 'An account with that email already exists.');

  const info = db
    .prepare('INSERT INTO users (email, password_hash, display_name, role) VALUES (?, ?, ?, ?)')
    .run(email, hashPassword(password), name, roleForNewUser(email));

  const { token, expires } = createSession(Number(info.lastInsertRowid));
  const res = NextResponse.redirect(new URL('/feed', req.url), 303);
  res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/', expires });
  return res;
}
