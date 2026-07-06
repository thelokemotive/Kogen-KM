import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getDb, DATA_DIR } from '@/lib/db';
import { redirectTo, redirectWithError, requireUser, str } from '@/lib/api';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;

  const form = await req.formData();
  const name = str(form, 'display_name', 60);
  const bio = str(form, 'bio', 300);
  const favSpot = str(form, 'fav_spot', 120);
  if (!name) return redirectWithError(req, '/profile/edit', 'Please enter a display name.');

  const db = getDb();
  let avatarPath = user.avatar_path;
  const avatar = form.get('avatar');
  if (avatar instanceof File && avatar.size > 0) {
    if (avatar.size > MAX_IMAGE_BYTES)
      return redirectWithError(req, '/profile/edit', 'Profile photo is too big (max 4 MB).');
    const ext = IMAGE_TYPES[avatar.type];
    if (!ext) return redirectWithError(req, '/profile/edit', 'Profile photo must be a JPG, PNG or WebP image.');
    const fname = `${user.id}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    fs.writeFileSync(path.join(DATA_DIR, 'avatars', fname), Buffer.from(await avatar.arrayBuffer()));
    if (avatarPath) {
      const old = path.join(DATA_DIR, 'avatars', path.basename(avatarPath));
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    avatarPath = `avatars/${fname}`;
  }

  db.prepare('UPDATE users SET display_name = ?, bio = ?, fav_spot = ?, avatar_path = ? WHERE id = ?').run(
    name,
    bio,
    favSpot,
    avatarPath,
    user.id
  );
  return redirectTo(req, `/profile/${user.id}`);
}
