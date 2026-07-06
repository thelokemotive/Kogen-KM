import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { DATA_DIR } from '@/lib/db';
import { requireUser } from '@/lib/api';

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};
const ALLOWED_DIRS = new Set(['avatars', 'photos']);

/** All uploaded images are served behind login — nothing is publicly reachable. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const { path: parts } = await ctx.params;

  if (parts.length !== 2 || !ALLOWED_DIRS.has(parts[0]))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const file = path.join(DATA_DIR, parts[0], path.basename(parts[1]));
  if (!fs.existsSync(file)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const mime = MIME[path.extname(file).toLowerCase()];
  if (!mime) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return new NextResponse(new Uint8Array(fs.readFileSync(file)), {
    headers: { 'Content-Type': mime, 'Cache-Control': 'private, max-age=3600' },
  });
}
