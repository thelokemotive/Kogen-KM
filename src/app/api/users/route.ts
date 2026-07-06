import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireStaffUser } from '@/lib/api';

/** Athlete list for the staff bulk-entry and photo pickers. */
export async function GET(req: NextRequest) {
  const user = await requireStaffUser(req);
  if (user instanceof NextResponse) return user;

  const users = getDb()
    .prepare(
      `SELECT id, display_name, email, role FROM users WHERE is_active = 1 ORDER BY role = 'STUDENT' DESC, display_name COLLATE NOCASE`
    )
    .all();
  return NextResponse.json({ users });
}
