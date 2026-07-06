import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDb, DATA_DIR } from '@/lib/db';
import { redirectTo, requireStaffUser, str } from '@/lib/api';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireStaffUser(req);
  if (user instanceof NextResponse) return user;
  const { id } = await ctx.params;

  const db = getDb();
  const photo = db.prepare('SELECT id, path FROM photos WHERE id = ?').get(Number(id)) as
    | { id: number; path: string }
    | undefined;
  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  db.prepare('DELETE FROM photos WHERE id = ?').run(photo.id);
  const p = path.join(DATA_DIR, 'photos', path.basename(photo.path));
  if (fs.existsSync(p)) fs.unlinkSync(p);

  const form = await req.formData().catch(() => null);
  return redirectTo(req, (form && str(form, 'back')) || '/feed');
}
