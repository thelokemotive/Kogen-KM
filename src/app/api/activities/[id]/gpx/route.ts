import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDb, UPLOADS_DIR } from '@/lib/db';
import { isStaff } from '@/lib/auth';
import { requireUser } from '@/lib/api';

/**
 * Download the original GPX file — for the owner, and for staff so they can
 * inspect any upload they want to verify.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const { id } = await ctx.params;

  const activity = getDb()
    .prepare('SELECT user_id, gpx_path, title FROM activities WHERE id = ?')
    .get(Number(id)) as { user_id: number; gpx_path: string | null; title: string } | undefined;
  if (!activity || !activity.gpx_path) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (activity.user_id !== user.id && !isStaff(user))
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });

  const p = path.join(UPLOADS_DIR, path.basename(activity.gpx_path));
  if (!fs.existsSync(p)) return NextResponse.json({ error: 'File missing' }, { status: 404 });
  return new NextResponse(new Uint8Array(fs.readFileSync(p)), {
    headers: {
      'Content-Type': 'application/gpx+xml',
      'Content-Disposition': `attachment; filename="activity-${id}.gpx"`,
    },
  });
}
