import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, destroySession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) destroySession(token);
  const res = NextResponse.redirect(new URL('/login', req.url), 303);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
