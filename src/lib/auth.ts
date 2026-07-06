import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { getDb } from './db';

export type Role = 'STUDENT' | 'STAFF' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  display_name: string;
  role: Role;
  bio: string;
  fav_spot: string;
  avatar_path: string | null;
  is_active: number;
  created_at: string;
}

export const SESSION_COOKIE = 'kogen_session';
const SESSION_DAYS = 30;

function envList(name: string): string[] {
  return (process.env[name] || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function allowedDomains(): string[] {
  const domains = envList('ALLOWED_EMAIL_DOMAINS');
  return domains.length ? domains : ['harrowappi.jp'];
}

export function isAllowedEmail(email: string): boolean {
  const at = email.lastIndexOf('@');
  if (at < 1) return false;
  const domain = email.slice(at + 1).toLowerCase();
  return allowedDomains().includes(domain);
}

export function roleForNewUser(email: string): Role {
  const e = email.toLowerCase();
  if (envList('ADMIN_EMAILS').includes(e)) return 'ADMIN';
  if (envList('STAFF_EMAILS').includes(e)) return 'STAFF';
  return 'STUDENT';
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function createSession(userId: number): { token: string; expires: Date } {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000);
  getDb()
    .prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
    .run(token, userId, expires.toISOString());
  return { token, expires };
}

export function destroySession(token: string) {
  getDb().prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = getDb()
    .prepare(
      `SELECT u.id, u.email, u.display_name, u.role, u.bio, u.fav_spot, u.avatar_path, u.is_active, u.created_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > datetime('now') AND u.is_active = 1`
    )
    .get(token) as User | undefined;
  return row ?? null;
}

export function isStaff(user: User | null): boolean {
  return !!user && (user.role === 'STAFF' || user.role === 'ADMIN');
}

export function isAdmin(user: User | null): boolean {
  return !!user && user.role === 'ADMIN';
}
