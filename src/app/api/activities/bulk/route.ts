import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { refreshBadges } from '@/lib/badges';
import { num, redirectTo, redirectWithError, requireStaffUser, str } from '@/lib/api';

/**
 * Time-efficient mass logging for academy sessions: staff pick any number of
 * registered athletes, enter one distance/elevation, and an activity is
 * created for every selected athlete.
 */
export async function POST(req: NextRequest) {
  const user = await requireStaffUser(req);
  if (user instanceof NextResponse) return user;

  const form = await req.formData();
  const sport = str(form, 'sport') === 'BIKE' ? 'BIKE' : 'RUN';
  const title = str(form, 'title', 100) || (sport === 'BIKE' ? 'Academy MTB session' : 'Academy trail run');
  const notes = str(form, 'notes', 1000);
  const distanceKm = num(form, 'distance_km');
  const elevationM = num(form, 'elevation_m') ?? 0;
  const durationMin = num(form, 'duration_min');
  const date = str(form, 'date', 10);
  const ids = form
    .getAll('user_ids')
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0);

  if (ids.length === 0) return redirectWithError(req, '/staff/bulk', 'Select at least one athlete.');
  if (!distanceKm || distanceKm <= 0 || distanceKm > 300)
    return redirectWithError(req, '/staff/bulk', 'Please enter a distance between 0 and 300 km.');
  if (elevationM < 0 || elevationM > 10000)
    return redirectWithError(req, '/staff/bulk', 'Elevation must be between 0 and 10,000 m.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return redirectWithError(req, '/staff/bulk', 'Please choose a date.');

  const db = getDb();
  const durationS = durationMin && durationMin > 0 ? Math.round(durationMin * 60) : null;
  const distanceM = Math.round(distanceKm * 1000);
  const ins = db.prepare(
    `INSERT INTO activities (user_id, created_by, sport, source, title, notes, distance_m, elevation_m,
       duration_s, moving_s, avg_kmh, started_at, status)
     VALUES (?, ?, ?, 'MANUAL', ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED')`
  );

  const insertAll = db.transaction((userIds: number[]) => {
    let n = 0;
    for (const id of userIds) {
      const exists = db.prepare('SELECT id FROM users WHERE id = ? AND is_active = 1').get(id);
      if (!exists) continue;
      ins.run(
        id,
        user.id,
        sport,
        title,
        notes,
        distanceM,
        Math.round(elevationM),
        durationS,
        durationS,
        durationS ? Math.round((distanceM / durationS) * 36) / 10 : null,
        `${date}T09:00:00.000Z`
      );
      n++;
    }
    return n;
  });
  const count = insertAll(ids);
  for (const id of ids) refreshBadges(id);

  return redirectTo(req, `/staff/bulk?done=${count}`);
}
