import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getDb, DATA_DIR } from '@/lib/db';
import { num, redirectTo, redirectWithError, requireStaffUser, str } from '@/lib/api';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

/**
 * Photo uploads are staff-only (safeguarding): instructors take photos during
 * academy sessions and tag the student, who then sees them on their profile.
 */
export async function POST(req: NextRequest) {
  const user = await requireStaffUser(req);
  if (user instanceof NextResponse) return user;

  const form = await req.formData();
  const subjectId = num(form, 'subject_user_id');
  const caption = str(form, 'caption', 200);
  const photo = form.get('photo');

  if (!subjectId) return redirectWithError(req, '/staff/photos', 'Please choose an athlete.');
  if (!(photo instanceof File) || photo.size === 0)
    return redirectWithError(req, '/staff/photos', 'Please choose a photo.');
  if (photo.size > MAX_IMAGE_BYTES) return redirectWithError(req, '/staff/photos', 'Photo too big (max 8 MB).');
  const ext = IMAGE_TYPES[photo.type];
  if (!ext) return redirectWithError(req, '/staff/photos', 'Photo must be a JPG, PNG or WebP image.');

  const db = getDb();
  const subject = db.prepare('SELECT id FROM users WHERE id = ? AND is_active = 1').get(subjectId);
  if (!subject) return redirectWithError(req, '/staff/photos', 'That athlete was not found.');

  const fname = `${crypto.randomBytes(10).toString('hex')}${ext}`;
  fs.writeFileSync(path.join(DATA_DIR, 'photos', fname), Buffer.from(await photo.arrayBuffer()));
  db.prepare('INSERT INTO photos (path, uploaded_by, subject_user_id, caption) VALUES (?, ?, ?, ?)').run(
    `photos/${fname}`,
    user.id,
    subjectId,
    caption
  );
  return redirectTo(req, `/profile/${subjectId}`);
}
