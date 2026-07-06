import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireUser } from '@/lib/api';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const { id } = await ctx.params;
  const activityId = Number(id);

  const db = getDb();
  const activity = db.prepare(`SELECT id FROM activities WHERE id = ? AND status = 'APPROVED'`).get(activityId);
  if (!activity) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const existing = db.prepare('SELECT 1 FROM kudos WHERE activity_id = ? AND user_id = ?').get(activityId, user.id);
  if (existing) {
    db.prepare('DELETE FROM kudos WHERE activity_id = ? AND user_id = ?').run(activityId, user.id);
  } else {
    db.prepare('INSERT INTO kudos (activity_id, user_id) VALUES (?, ?)').run(activityId, user.id);
  }
  const count = (
    db.prepare('SELECT COUNT(*) AS n FROM kudos WHERE activity_id = ?').get(activityId) as { n: number }
  ).n;
  return NextResponse.json({ kudos: count, mine: !existing });
}
