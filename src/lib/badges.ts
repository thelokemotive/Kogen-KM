import { getDb } from './db';

export interface BadgeDef {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  test: (t: Totals) => boolean;
}

export interface Totals {
  km: number;
  climbM: number;
  count: number;
  runKm: number;
  bikeKm: number;
}

export const BADGES: BadgeDef[] = [
  { id: 'first', emoji: '🌱', name: 'First Tracks', desc: 'Logged your first activity', test: (t) => t.count >= 1 },
  { id: 'ten-acts', emoji: '🔁', name: 'Regular', desc: '10 activities logged', test: (t) => t.count >= 10 },
  { id: 'fifty-acts', emoji: '📅', name: 'Part of the Furniture', desc: '50 activities logged', test: (t) => t.count >= 50 },
  { id: 'km-25', emoji: '👟', name: 'Warmed Up', desc: '25 km total', test: (t) => t.km >= 25 },
  { id: 'km-marathon', emoji: '🏅', name: 'Marathon Total', desc: '42.2 km total', test: (t) => t.km >= 42.195 },
  { id: 'km-morioka', emoji: '🚉', name: 'Morioka', desc: '45 km — the distance to Morioka', test: (t) => t.km >= 45 },
  { id: 'km-100', emoji: '💯', name: 'Century Club', desc: '100 km total', test: (t) => t.km >= 100 },
  { id: 'km-250', emoji: '🦌', name: 'Tōhoku Wanderer', desc: '250 km total', test: (t) => t.km >= 250 },
  { id: 'km-600', emoji: '🗼', name: 'Tokyo', desc: '600 km — the distance to Tokyo', test: (t) => t.km >= 600 },
  { id: 'km-1000', emoji: '🐐', name: 'The 1000 Club', desc: '1,000 km total', test: (t) => t.km >= 1000 },
  { id: 'climb-gondola', emoji: '🚡', name: 'Gondola? Never Heard of It', desc: '828 m climbed — the APPI gondola vertical', test: (t) => t.climbM >= 828 },
  { id: 'climb-hachimantai', emoji: '🌿', name: 'Hachimantai', desc: '1,613 m climbed', test: (t) => t.climbM >= 1613 },
  { id: 'climb-iwate', emoji: '⛰️', name: 'Iwate-san', desc: '2,038 m climbed', test: (t) => t.climbM >= 2038 },
  { id: 'climb-fuji', emoji: '🗻', name: 'Fuji', desc: '3,776 m climbed', test: (t) => t.climbM >= 3776 },
  { id: 'climb-everest', emoji: '🏔️', name: 'Everester', desc: '8,849 m climbed — the height of Everest', test: (t) => t.climbM >= 8849 },
  { id: 'climb-space', emoji: '🛰️', name: 'To Space', desc: '100,000 m climbed — the Kármán line', test: (t) => t.climbM >= 100000 },
  { id: 'run-100', emoji: '🏃', name: 'Trail Runner', desc: '100 km of running', test: (t) => t.runKm >= 100 },
  { id: 'bike-100', emoji: '🚵', name: 'Mountain Biker', desc: '100 km of riding', test: (t) => t.bikeKm >= 100 },
];

export function badgeById(id: string): BadgeDef | undefined {
  return BADGES.find((b) => b.id === id);
}

export function userTotals(userId: number): Totals {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(distance_m),0) AS dm, COALESCE(SUM(elevation_m),0) AS em, COUNT(*) AS n,
              COALESCE(SUM(CASE WHEN sport='RUN' THEN distance_m ELSE 0 END),0) AS rdm,
              COALESCE(SUM(CASE WHEN sport='BIKE' THEN distance_m ELSE 0 END),0) AS bdm
       FROM activities WHERE user_id = ? AND status = 'APPROVED'`
    )
    .get(userId) as { dm: number; em: number; n: number; rdm: number; bdm: number };
  return { km: row.dm / 1000, climbM: row.em, count: row.n, runKm: row.rdm / 1000, bikeKm: row.bdm / 1000 };
}

/** Award any badges the user has newly earned. Returns the new badge defs. */
export function refreshBadges(userId: number): BadgeDef[] {
  const db = getDb();
  const totals = userTotals(userId);
  const have = new Set(
    (db.prepare('SELECT badge_id FROM user_badges WHERE user_id = ?').all(userId) as { badge_id: string }[]).map(
      (r) => r.badge_id
    )
  );
  const fresh: BadgeDef[] = [];
  const ins = db.prepare('INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)');
  for (const b of BADGES) {
    if (!have.has(b.id) && b.test(totals)) {
      ins.run(userId, b.id);
      fresh.push(b);
    }
  }
  return fresh;
}

export function userBadges(userId: number): (BadgeDef & { awarded_at: string })[] {
  const rows = getDb()
    .prepare('SELECT badge_id, awarded_at FROM user_badges WHERE user_id = ? ORDER BY awarded_at')
    .all(userId) as { badge_id: string; awarded_at: string }[];
  return rows
    .map((r) => {
      const def = badgeById(r.badge_id);
      return def ? { ...def, awarded_at: r.awarded_at } : null;
    })
    .filter((b): b is BadgeDef & { awarded_at: string } => b !== null);
}
