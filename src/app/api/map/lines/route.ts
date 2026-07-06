import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireUser } from '@/lib/api';

/** GPX polylines for the school heat map (logged-in members only). */
export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;

  const rows = getDb()
    .prepare(
      `SELECT polyline, sport FROM activities
       WHERE status = 'APPROVED' AND polyline IS NOT NULL
       ORDER BY started_at DESC LIMIT 800`
    )
    .all() as { polyline: string; sport: string }[];

  const lines = rows
    .map((r) => {
      try {
        return { sport: r.sport, points: JSON.parse(r.polyline) as [number, number][] };
      } catch {
        return null;
      }
    })
    .filter((l): l is { sport: string; points: [number, number][] } => !!l && l.points.length > 1);

  return NextResponse.json({ lines });
}
