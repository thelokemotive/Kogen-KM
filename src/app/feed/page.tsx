import { redirect } from 'next/navigation';
import { getCurrentUser, isStaff } from '@/lib/auth';
import { feedActivities, schoolTotals } from '@/lib/queries';
import { latestTerm, resolvePeriod } from '@/lib/terms';
import Shell from '@/components/Shell';
import ActivityCard from '@/components/ActivityCard';
import Link from 'next/link';

export const metadata = { title: 'Feed' };
export const dynamic = 'force-dynamic';

export default async function FeedPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const activities = feedActivities(user.id, isStaff(user));
  const term = latestTerm();
  const totals = schoolTotals(term ? resolvePeriod(`term:${term.id}`) : resolvePeriod('all'));

  return (
    <Shell user={user} active="/feed">
      <div className="card" style={{ background: 'var(--pine-deep)', color: '#fff' }}>
        <div className="row spread wrap">
          <div>
            <b>{term ? term.name : 'All-time'} — the school so far</b>
            <div className="tiny" style={{ opacity: 0.8 }}>
              {totals.athletes} athletes · {totals.count} activities
            </div>
          </div>
          <div className="row" style={{ gap: 18 }}>
            <div className="center">
              <b style={{ fontSize: '1.2rem' }}>{totals.km.toFixed(0)} km</b>
              <div className="tiny" style={{ opacity: 0.8 }}>together</div>
            </div>
            <div className="center">
              <b style={{ fontSize: '1.2rem' }}>{Math.round(totals.climb_m).toLocaleString()} m</b>
              <div className="tiny" style={{ opacity: 0.8 }}>climbed</div>
            </div>
          </div>
        </div>
      </div>

      {activities.length === 0 && (
        <div className="card center">
          <div style={{ fontSize: '2.4rem' }}>🌄</div>
          <h2>The mountain is waiting</h2>
          <p className="muted">No activities yet. Be the first name on the board.</p>
          <Link href="/activities/new" className="btn btn-primary">
            Log your first activity
          </Link>
        </div>
      )}
      {activities.map((a) => (
        <ActivityCard key={a.id} a={a} />
      ))}
    </Shell>
  );
}
