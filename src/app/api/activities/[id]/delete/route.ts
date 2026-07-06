import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDb, UPLOADS_DIR } from '@/lib/db';
import { isStaff } from '@/lib/auth';
import { redirectTo, requireUser } from '@/lib/api';

/** The owner (or staff) can delete an activity entirely. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const { id } = await ctx.params;

  const db = getDb();
  const activity = db.prepare('SELECT id, user_id, gpx_path FROM activities WHERE id = ?').get(Number(id)) as
    | { id: number; user_id: number; gpx_path: string | null }
    | undefined;
  if (!activity) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (activity.user_id !== user.id && !isStaff(user))
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });

  db.prepare('DELETE FROM kudos WHERE activity_id = ?').run(activity.id);
  db.prepare('DELETE FROM activities WHERE id = ?').run(activity.id);
  if (activity.gpx_path) {
    const p = path.join(UPLOADS_DIR, path.basename(activity.gpx_path));
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  return redirectTo(req, '/feed');
}
