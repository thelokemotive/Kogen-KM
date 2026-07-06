import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { refreshBadges } from '@/lib/badges';
import { redirectTo, requireStaffUser, str } from '@/lib/api';

/** Staff approve or reject a flagged (or any) activity. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireStaffUser(req);
  if (user instanceof NextResponse) return user;
  const { id } = await ctx.params;
  const form = await req.formData();
  const action = str(form, 'action');
  if (action !== 'approve' && action !== 'reject')
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  const db = getDb();
  const activity = db.prepare('SELECT id, user_id FROM activities WHERE id = ?').get(Number(id)) as
    | { id: number; user_id: number }
    | undefined;
  if (!activity) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  db.prepare('UPDATE activities SET status = ?, reviewed_by = ? WHERE id = ?').run(
    action === 'approve' ? 'APPROVED' : 'REJECTED',
    user.id,
    activity.id
  );
  if (action === 'approve') refreshBadges(activity.user_id);
  return redirectTo(req, str(form, 'back') || '/staff/review');
}
