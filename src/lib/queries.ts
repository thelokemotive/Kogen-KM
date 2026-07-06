import { getDb } from './db';
import type { Period } from './terms';

export interface ActivityRow {
  id: number;
  user_id: number;
  created_by: number;
  sport: 'RUN' | 'BIKE';
  source: 'GPX' | 'MANUAL';
  title: string;
  notes: string;
  distance_m: number;
  elevation_m: number;
  duration_s: number | null;
  moving_s: number | null;
  avg_kmh: number | null;
  started_at: string;
  gpx_path: string | null;
  polyline: string | null;
  status: 'APPROVED' | 'FLAGGED' | 'REJECTED';
  flag_reason: string | null;
  created_at: string;
  // joined
  display_name: string;
  avatar_path: string | null;
  role: string;
  kudos_count: number;
  my_kudos: number;
}

const ACTIVITY_SELECT = `
  SELECT a.*, u.display_name, u.avatar_path, u.role,
    (SELECT COUNT(*) FROM kudos k WHERE k.activity_id = a.id) AS kudos_count,
    (SELECT COUNT(*) FROM kudos k WHERE k.activity_id = a.id AND k.user_id = @viewer) AS my_kudos
  FROM activities a JOIN users u ON u.id = a.user_id`;

/** Feed: approved for everyone, plus the viewer's own / staff-visible flagged items. */
export function feedActivities(viewerId: number, viewerIsStaff: boolean, limit = 60): ActivityRow[] {
  const where = viewerIsStaff
    ? `a.status != 'REJECTED'`
    : `(a.status = 'APPROVED' OR (a.status = 'FLAGGED' AND a.user_id = @viewer))`;
  return getDb()
    .prepare(`${ACTIVITY_SELECT} WHERE ${where} ORDER BY a.started_at DESC, a.id DESC LIMIT @limit`)
    .all({ viewer: viewerId, limit }) as ActivityRow[];
}

export function userActivities(userId: number, viewerId: number, includeFlagged: boolean, limit = 30): ActivityRow[] {
  const where = includeFlagged
    ? `a.user_id = @user AND a.status != 'REJECTED'`
    : `a.user_id = @user AND a.status = 'APPROVED'`;
  return getDb()
    .prepare(`${ACTIVITY_SELECT} WHERE ${where} ORDER BY a.started_at DESC LIMIT @limit`)
    .all({ user: userId, viewer: viewerId, limit }) as ActivityRow[];
}

export function getActivity(id: number, viewerId: number): ActivityRow | null {
  return (
    (getDb().prepare(`${ACTIVITY_SELECT} WHERE a.id = @id`).get({ id, viewer: viewerId }) as ActivityRow | undefined) ??
    null
  );
}

export function flaggedActivities(viewerId: number): ActivityRow[] {
  return getDb()
    .prepare(`${ACTIVITY_SELECT} WHERE a.status = 'FLAGGED' ORDER BY a.created_at ASC`)
    .all({ viewer: viewerId }) as ActivityRow[];
}

export interface LeaderRow {
  user_id: number;
  display_name: string;
  avatar_path: string | null;
  role: string;
  km: number;
  climb_m: number;
  count: number;
}

export function leaderboard(opts: {
  period: Period;
  sport: 'ALL' | 'RUN' | 'BIKE';
  cohort: 'STUDENT' | 'STAFF';
  metric: 'distance' | 'elevation';
  limit?: number;
}): LeaderRow[] {
  const conds: string[] = [`a.status = 'APPROVED'`];
  const params: Record<string, unknown> = { limit: opts.limit ?? 100 };
  if (opts.period.start) {
    conds.push(`substr(a.started_at, 1, 10) >= @start`);
    params.start = opts.period.start;
  }
  if (opts.period.end) {
    conds.push(`substr(a.started_at, 1, 10) <= @end`);
    params.end = opts.period.end;
  }
  if (opts.sport !== 'ALL') {
    conds.push(`a.sport = @sport`);
    params.sport = opts.sport;
  }
  conds.push(opts.cohort === 'STAFF' ? `u.role IN ('STAFF','ADMIN')` : `u.role = 'STUDENT'`);
  const order = opts.metric === 'elevation' ? 'climb_m DESC, km DESC' : 'km DESC, climb_m DESC';
  return getDb()
    .prepare(
      `SELECT a.user_id, u.display_name, u.avatar_path, u.role,
              SUM(a.distance_m)/1000.0 AS km, SUM(a.elevation_m) AS climb_m, COUNT(*) AS count
       FROM activities a JOIN users u ON u.id = a.user_id
       WHERE ${conds.join(' AND ')} AND u.is_active = 1
       GROUP BY a.user_id ORDER BY ${order} LIMIT @limit`
    )
    .all(params) as LeaderRow[];
}

export function schoolTotals(period: Period): { km: number; climb_m: number; count: number; athletes: number } {
  const conds: string[] = [`status = 'APPROVED'`];
  const params: Record<string, unknown> = {};
  if (period.start) {
    conds.push(`substr(started_at, 1, 10) >= @start`);
    params.start = period.start;
  }
  if (period.end) {
    conds.push(`substr(started_at, 1, 10) <= @end`);
    params.end = period.end;
  }
  return getDb()
    .prepare(
      `SELECT COALESCE(SUM(distance_m),0)/1000.0 AS km, COALESCE(SUM(elevation_m),0) AS climb_m,
              COUNT(*) AS count, COUNT(DISTINCT user_id) AS athletes
       FROM activities WHERE ${conds.join(' AND ')}`
    )
    .get(params) as { km: number; climb_m: number; count: number; athletes: number };
}

export function userPeriodTotals(userId: number, period: Period): { km: number; climb_m: number; count: number } {
  const conds: string[] = [`status = 'APPROVED'`, `user_id = @user`];
  const params: Record<string, unknown> = { user: userId };
  if (period.start) {
    conds.push(`substr(started_at, 1, 10) >= @start`);
    params.start = period.start;
  }
  if (period.end) {
    conds.push(`substr(started_at, 1, 10) <= @end`);
    params.end = period.end;
  }
  return getDb()
    .prepare(
      `SELECT COALESCE(SUM(distance_m),0)/1000.0 AS km, COALESCE(SUM(elevation_m),0) AS climb_m, COUNT(*) AS count
       FROM activities WHERE ${conds.join(' AND ')}`
    )
    .get(params) as { km: number; climb_m: number; count: number };
}

/* ---------- formatting helpers used across pages ---------- */

export function fmtKm(m: number): string {
  const km = m / 1000;
  return km >= 100 ? km.toFixed(0) : km >= 10 ? km.toFixed(1) : km.toFixed(2);
}

export function fmtDuration(s: number | null): string {
  if (s === null || s <= 0) return '—';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

export function fmtPace(distanceM: number, movingS: number | null, sport: string): string {
  if (!movingS || movingS <= 0 || distanceM <= 0) return '—';
  if (sport === 'BIKE') return `${((distanceM / movingS) * 3.6).toFixed(1)} km/h`;
  const secPerKm = movingS / (distanceM / 1000);
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}:${String(sec).padStart(2, '0')} /km`;
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
