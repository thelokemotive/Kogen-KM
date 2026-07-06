import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { num, redirectTo, redirectWithError, requireAdminUser, str } from '@/lib/api';

/** Admin: change roles (verify instructors as STAFF/ADMIN) or deactivate accounts. */
export async function POST(req: NextRequest) {
  const admin = await requireAdminUser(req);
  if (admin instanceof NextResponse) return admin;

  const form = await req.formData();
  const userId = num(form, 'user_id');
  const action = str(form, 'action');
  const db = getDb();

  const target = db.prepare('SELECT id, role FROM users WHERE id = ?').get(userId ?? -1) as
    | { id: number; role: string }
    | undefined;
  if (!target) return redirectWithError(req, '/admin', 'User not found.');
  if (target.id === admin.id && (action === 'deactivate' || action.startsWith('role:')))
    return redirectWithError(req, '/admin', 'You cannot change your own account here.');

  if (action.startsWith('role:')) {
    const role = action.slice(5);
    if (!['STUDENT', 'STAFF', 'ADMIN'].includes(role)) return redirectWithError(req, '/admin', 'Unknown role.');
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, target.id);
  } else if (action === 'deactivate') {
    db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(target.id);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(target.id);
  } else if (action === 'activate') {
    db.prepare('UPDATE users SET is_active = 1 WHERE id = ?').run(target.id);
  } else {
    return redirectWithError(req, '/admin', 'Unknown action.');
  }
  return redirectTo(req, '/admin');
}
