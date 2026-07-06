import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { leaderboard } from '@/lib/queries';
import { allTerms, latestTerm, resolvePeriod } from '@/lib/terms';
import Shell from '@/components/Shell';
import Avatar from '@/components/Avatar';

export const metadata = { title: 'Leaderboard' };
export const dynamic = 'force-dynamic';

const MEDALS = ['🥇', '🥈', '🥉'];

interface Params {
  period?: string;
  sport?: string;
  metric?: string;
  who?: string;
}

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<Params> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const sp = await searchParams;

  const periodKey = sp.period || 'term';
  const sport = (['RUN', 'BIKE'].includes(sp.sport || '') ? sp.sport : 'ALL') as 'ALL' | 'RUN' | 'BIKE';
  const metric = sp.metric === 'elevation' ? 'elevation' : 'distance';
  const who = sp.who === 'STAFF' ? 'STAFF' : 'STUDENT';

  const period = resolvePeriod(periodKey);
  const rows = leaderboard({ period, sport, cohort: who, metric });
  const terms = allTerms();
  const current = latestTerm();

  const link = (patch: Partial<Params>) => {
    const q = new URLSearchParams({ period: periodKey, sport, metric, who, ...patch } as Record<string, string>);
    return `/leaderboard?${q.toString()}`;
  };

  return (
    <Shell user={user} active="/leaderboard">
      <h1>🏆 Leaderboard</h1>
      <p className="muted small">{period.label} · most {metric === 'elevation' ? 'metres climbed' : 'kilometres covered'}</p>

      <div className="filterbar">
        <Link href={link({ period: 'term' })} className={periodKey === 'term' || periodKey.startsWith('term:') ? 'active' : ''}>
          {current ? current.name : 'This term'}
        </Link>
        <Link href={link({ period: 'year' })} className={periodKey === 'year' ? 'active' : ''}>
          School year
        </Link>
        <Link href={link({ period: 'all' })} className={periodKey === 'all' ? 'active' : ''}>
          All-time
        </Link>
      </div>
      <div className="filterbar">
        <Link href={link({ metric: 'distance' })} className={metric === 'distance' ? 'active' : ''}>
          📏 Distance
        </Link>
        <Link href={link({ metric: 'elevation' })} className={metric === 'elevation' ? 'active' : ''}>
          ⛰️ Vertical
        </Link>
        <Link href={link({ sport: 'ALL' })} className={sport === 'ALL' ? 'active' : ''}>
          All sports
        </Link>
        <Link href={link({ sport: 'RUN' })} className={sport === 'RUN' ? 'active' : ''}>
          🏃 Run
        </Link>
        <Link href={link({ sport: 'BIKE' })} className={sport === 'BIKE' ? 'active' : ''}>
          🚵 Bike
        </Link>
        <Link href={link({ who: 'STUDENT' })} className={who === 'STUDENT' ? 'active' : ''}>
          Students
        </Link>
        <Link href={link({ who: 'STAFF' })} className={who === 'STAFF' ? 'active' : ''}>
          Staff
        </Link>
      </div>

      {periodKey.startsWith('term') && terms.length > 1 && (
        <div className="filterbar">
          {terms.map((t) => (
            <Link
              key={t.id}
              href={link({ period: `term:${t.id}` })}
              className={periodKey === `term:${t.id}` || (periodKey === 'term' && current?.id === t.id) ? 'active' : ''}
            >
              {t.name}
            </Link>
          ))}
        </div>
      )}

      <div className="card" style={{ padding: '6px 4px' }}>
        {rows.length === 0 && (
          <p className="center muted" style={{ padding: 20 }}>
            Nothing logged for this period yet. The podium is wide open. 🏁
          </p>
        )}
        {rows.map((r, i) => (
          <div key={r.user_id} className={`lb-row${r.user_id === user.id ? ' lb-me' : ''}`}>
            <span className={`lb-rank${i < 3 ? ' top' : ''}`}>{MEDALS[i] ?? i + 1}</span>
            <Link href={`/profile/${r.user_id}`} className="row" style={{ minWidth: 0 }}>
              <Avatar name={r.display_name} path={r.avatar_path} />
              <span style={{ fontWeight: 700 }}>{r.display_name}</span>
            </Link>
            <span className="lb-value">
              <b>{metric === 'elevation' ? `${Math.round(r.climb_m).toLocaleString()} m` : `${r.km.toFixed(1)} km`}</b>
              <div className="tiny muted">
                {metric === 'elevation' ? `${r.km.toFixed(0)} km` : `${Math.round(r.climb_m).toLocaleString()} m`} · {r.count}×
              </div>
            </span>
          </div>
        ))}
      </div>
      <p className="tiny muted center">
        Term and year champions get school recognition — distance and vertical are separate crowns. 👑
      </p>
    </Shell>
  );
}
