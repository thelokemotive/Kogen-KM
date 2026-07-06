import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { num, redirectTo, redirectWithError, requireAdminUser, str } from '@/lib/api';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: NextRequest) {
  const admin = await requireAdminUser(req);
  if (admin instanceof NextResponse) return admin;

  const form = await req.formData();
  const action = str(form, 'action');
  const db = getDb();

  if (action === 'create') {
    const name = str(form, 'name', 60);
    const starts = str(form, 'starts_on', 10);
    const ends = str(form, 'ends_on', 10);
    if (!name || !DATE.test(starts) || !DATE.test(ends) || starts >= ends)
      return redirectWithError(req, '/admin', 'Term needs a name and valid start/end dates.');
    db.prepare('INSERT INTO terms (name, starts_on, ends_on) VALUES (?, ?, ?)').run(name, starts, ends);
  } else if (action === 'delete') {
    const id = num(form, 'term_id');
    if (id) db.prepare('DELETE FROM terms WHERE id = ?').run(id);
  } else {
    return redirectWithError(req, '/admin', 'Unknown action.');
  }
  return redirectTo(req, '/admin');
}
