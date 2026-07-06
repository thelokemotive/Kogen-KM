import { getDb } from './db';

export interface Term {
  id: number;
  name: string;
  starts_on: string; // YYYY-MM-DD
  ends_on: string;
}

export interface Period {
  key: string;
  label: string;
  start: string | null; // YYYY-MM-DD inclusive, null = open
  end: string | null;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function allTerms(): Term[] {
  return getDb().prepare('SELECT * FROM terms ORDER BY starts_on').all() as Term[];
}

export function currentTerm(date = todayIso()): Term | null {
  return (
    (getDb()
      .prepare('SELECT * FROM terms WHERE starts_on <= ? AND ends_on >= ? ORDER BY starts_on LIMIT 1')
      .get(date, date) as Term | undefined) ?? null
  );
}

/** Most recent term that has started (falls back when we're between terms). */
export function latestTerm(date = todayIso()): Term | null {
  return (
    currentTerm(date) ??
    ((getDb()
      .prepare('SELECT * FROM terms WHERE starts_on <= ? ORDER BY starts_on DESC LIMIT 1')
      .get(date) as Term | undefined) ?? null)
  );
}

/** Academic year runs 1 September – 31 August. */
export function academicYear(date = todayIso()): { label: string; start: string; end: string } {
  const y = parseInt(date.slice(0, 4), 10);
  const m = parseInt(date.slice(5, 7), 10);
  const startYear = m >= 9 ? y : y - 1;
  return {
    label: `${startYear}–${String((startYear + 1) % 100).padStart(2, '0')}`,
    start: `${startYear}-09-01`,
    end: `${startYear + 1}-08-31`,
  };
}

export function resolvePeriod(key: string): Period {
  if (key === 'all') return { key, label: 'All-time', start: null, end: null };
  if (key === 'year') {
    const ay = academicYear();
    return { key, label: `School year ${ay.label}`, start: ay.start, end: ay.end };
  }
  if (key.startsWith('term:')) {
    const id = parseInt(key.slice(5), 10);
    const t = getDb().prepare('SELECT * FROM terms WHERE id = ?').get(id) as Term | undefined;
    if (t) return { key, label: t.name, start: t.starts_on, end: t.ends_on };
  }
  // default: current/most recent term
  const t = latestTerm();
  if (t) return { key: 'term', label: t.name, start: t.starts_on, end: t.ends_on };
  return { key: 'all', label: 'All-time', start: null, end: null };
}
