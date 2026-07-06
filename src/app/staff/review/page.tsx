import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser, isStaff } from '@/lib/auth';
import { flaggedActivities, fmtDate, fmtKm, fmtPace } from '@/lib/queries';
import Shell from '@/components/Shell';
import Avatar from '@/components/Avatar';

export const metadata = { title: 'Review queue' };
export const dynamic = 'force-dynamic';

export default async function ReviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!isStaff(user)) redirect('/feed');

  const flagged = flaggedActivities(user.id);

  return (
    <Shell user={user} active="/staff">
      <h1>⏳ Review queue</h1>
      <p className="muted small">
        Uploads that tripped the fair-play checks. Open the GPX if you want proof, then approve or reject.
        Nothing here counts on any leaderboard until you decide.
      </p>
      {flagged.length === 0 && (
        <div className="card center">
          <div style={{ fontSize: '2rem' }}>✅</div>
          <p className="muted">All clear — nothing waiting for review.</p>
        </div>
      )}
      {flagged.map((a) => (
        <div key={a.id} className="card">
          <div className="row">
            <Avatar name={a.display_name} path={a.avatar_path} />
            <div>
              <b>{a.display_name}</b>
              <div className="tiny muted">
                {fmtDate(a.started_at)} · {a.sport === 'BIKE' ? '🚵 Ride' : '🏃 Run'} ·{' '}
                {a.source === 'GPX' ? 'GPX upload' : 'Manual'}
              </div>
            </div>
          </div>
          <p className="mt">
            <Link href={`/activities/${a.id}`} style={{ fontWeight: 700 }}>
              {a.title}
            </Link>{' '}
            — {fmtKm(a.distance_m)} km, {Math.round(a.elevation_m)} m climb,{' '}
            {fmtPace(a.distance_m, a.moving_s ?? a.duration_s, a.sport)}
          </p>
          <div className="flagged-banner">🚩 {a.flag_reason}</div>
          <div className="row wrap">
            {a.gpx_path && (
              <a className="btn btn-sm" href={`/api/activities/${a.id}/gpx`}>
                ⬇️ Inspect GPX
              </a>
            )}
            <form method="post" action={`/api/activities/${a.id}/review`}>
              <input type="hidden" name="action" value="approve" />
              <button className="btn btn-sm btn-primary">✅ Approve</button>
            </form>
            <form method="post" action={`/api/activities/${a.id}/review`}>
              <input type="hidden" name="action" value="reject" />
              <button className="btn btn-sm btn-danger">❌ Reject</button>
            </form>
          </div>
        </div>
      ))}
    </Shell>
  );
}
