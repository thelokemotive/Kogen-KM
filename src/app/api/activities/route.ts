import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getDb, UPLOADS_DIR } from '@/lib/db';
import { isStaff } from '@/lib/auth';
import { parseGpx, checkForCheating, type Sport } from '@/lib/gpx';
import { refreshBadges } from '@/lib/badges';
import { num, redirectTo, redirectWithError, requireUser, str } from '@/lib/api';

const MAX_GPX_BYTES = 15 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;

  const form = await req.formData();
  const mode = str(form, 'mode');
  const sport = (str(form, 'sport') === 'BIKE' ? 'BIKE' : 'RUN') as Sport;
  const title = str(form, 'title', 100);
  const notes = str(form, 'notes', 1000);
  const db = getDb();

  if (mode === 'manual') {
    // Manual distance + elevation entry is a staff privilege.
    if (!isStaff(user)) return NextResponse.json({ error: 'Only staff can add manual entries.' }, { status: 403 });
    const distanceKm = num(form, 'distance_km');
    const elevationM = num(form, 'elevation_m') ?? 0;
    const durationMin = num(form, 'duration_min');
    const date = str(form, 'date', 10);
    const targetId = num(form, 'user_id') ?? user.id;
    if (!distanceKm || distanceKm <= 0 || distanceKm > 300)
      return redirectWithError(req, '/activities/new', 'Please enter a distance between 0 and 300 km.');
    if (elevationM < 0 || elevationM > 10000)
      return redirectWithError(req, '/activities/new', 'Elevation must be between 0 and 10,000 m.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
      return redirectWithError(req, '/activities/new', 'Please choose a date.');
    const target = db.prepare('SELECT id FROM users WHERE id = ? AND is_active = 1').get(targetId);
    if (!target) return redirectWithError(req, '/activities/new', 'That athlete was not found.');

    const durationS = durationMin && durationMin > 0 ? Math.round(durationMin * 60) : null;
    const distanceM = Math.round(distanceKm * 1000);
    const info = db
      .prepare(
        `INSERT INTO activities (user_id, created_by, sport, source, title, notes, distance_m, elevation_m,
           duration_s, moving_s, avg_kmh, started_at, status)
         VALUES (?, ?, ?, 'MANUAL', ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED')`
      )
      .run(
        targetId,
        user.id,
        sport,
        title || defaultTitle(sport),
        notes,
        distanceM,
        Math.round(elevationM),
        durationS,
        durationS,
        durationS ? Math.round((distanceM / durationS) * 36) / 10 : null,
        `${date}T09:00:00.000Z`
      );
    refreshBadges(targetId as number);
    return redirectTo(req, `/activities/${info.lastInsertRowid}`);
  }

  // GPX upload — the default path for students (and anyone else).
  const file = form.get('gpx');
  if (!(file instanceof File) || file.size === 0)
    return redirectWithError(req, '/activities/new', 'Please choose a GPX file.');
  if (file.size > MAX_GPX_BYTES)
    return redirectWithError(req, '/activities/new', 'That GPX file is too big (max 15 MB).');

  const buf = Buffer.from(await file.arrayBuffer());
  const hash = crypto.createHash('sha256').update(buf).digest('hex');

  const dup = db.prepare('SELECT id FROM activities WHERE file_hash = ? AND status != ?').get(hash, 'REJECTED');
  if (dup)
    return redirectWithError(req, '/activities/new', 'This exact GPX file has already been uploaded.');

  let stats;
  try {
    stats = parseGpx(buf.toString('utf8'));
  } catch (e) {
    return redirectWithError(
      req,
      '/activities/new',
      `Could not read that file: ${e instanceof Error ? e.message : 'not a valid GPX'}.`
    );
  }
  if (stats.distanceM < 100)
    return redirectWithError(req, '/activities/new', 'That track is shorter than 100 m — too short to count.');

  const check = checkForCheating(stats, sport);
  const gpxName = `${hash.slice(0, 16)}.gpx`;
  fs.writeFileSync(path.join(UPLOADS_DIR, gpxName), buf);

  const info = db
    .prepare(
      `INSERT INTO activities (user_id, created_by, sport, source, title, notes, distance_m, elevation_m,
         duration_s, moving_s, avg_kmh, started_at, gpx_path, file_hash, polyline, status, flag_reason)
       VALUES (?, ?, ?, 'GPX', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      user.id,
      user.id,
      sport,
      title || defaultTitle(sport),
      notes,
      stats.distanceM,
      stats.elevationM,
      stats.durationS,
      stats.movingS,
      stats.avgKmh,
      stats.startedAt ?? new Date().toISOString(),
      gpxName,
      hash,
      JSON.stringify(stats.polyline),
      check.status,
      check.reasons.length ? check.reasons.join(' ') : null
    );

  if (check.status === 'APPROVED') refreshBadges(user.id);
  return redirectTo(req, `/activities/${info.lastInsertRowid}`);
}

function defaultTitle(sport: Sport): string {
  return sport === 'BIKE' ? 'Mountain bike ride' : 'Trail run';
}
