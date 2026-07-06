import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isStaff, isAdmin, type User } from './auth';

export async function requireUser(req: NextRequest): Promise<User | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url), 303);
  return user;
}

export async function requireStaffUser(req: NextRequest): Promise<User | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url), 303);
  if (!isStaff(user)) return NextResponse.json({ error: 'Staff only' }, { status: 403 });
  return user;
}

export async function requireAdminUser(req: NextRequest): Promise<User | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url), 303);
  if (!isAdmin(user)) return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  return user;
}

export function redirectTo(req: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, req.url), 303);
}

export function redirectWithError(req: NextRequest, path: string, message: string): NextResponse {
  const url = new URL(path, req.url);
  url.searchParams.set('error', message);
  return NextResponse.redirect(url, 303);
}

export function str(form: FormData, key: string, maxLen = 500): string {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim().slice(0, maxLen) : '';
}

export function num(form: FormData, key: string): number | null {
  const v = str(form, key);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
