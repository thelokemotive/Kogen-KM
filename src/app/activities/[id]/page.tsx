import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser, isStaff } from '@/lib/auth';
import { fmtDate, fmtDuration, fmtKm, fmtPace, getActivity } from '@/lib/queries';
import { activityComparison } from '@/lib/equivalence';
import Shell from '@/components/Shell';
import Avatar from '@/components/Avatar';
import KudosButton from '@/components/KudosButton';
import MapView from '@/components/MapView';

export const dynamic = 'force-dynamic';

export default async function ActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const { id } = await params;
  const a = getActivity(Number(id), user.id);
  const staff = isStaff(user);

  if (!a) notFound();
  const mine = a.user_id === user.id;
  // Rejected activities vanish for everyone but staff; flagged ones are
  // visible only to the owner and staff until reviewed.
  if (a.status === 'REJECTED' && !staff) notFound();
  if (a.status === 'FLAGGED' && !mine && !staff) notFound();

  const isBike = a.sport === 'BIKE';
  const points: [number, number][] = a.polyline ? JSON.parse(a.polyline) : [];
  const comparison = activityComparison(a.distance_m, a.elevation_m);
  const mapsOn = process.env.DISABLE_MAPS !== '1';

  return (
    <Shell user={user} active="">
      <div className="card">
        <div className="row">
          <Link href={`/profile/${a.user_id}`}>
            <Avatar name={a.display_name} path={a.avatar_path} />
          </Link>
          <div>
            <Link href={`/profile/${a.user_id}`}>
              <b>{a.display_name}</b>
            </Link>
            <div className="tiny muted">
              {fmtDate(a.started_at)}
              {a.source === 'MANUAL' && ' · logged by staff'}
            </div>
          </div>
          <span className={`chip ${isBike ? 'bike' : 'run'}`} style={{ marginLeft: 'auto' }}>
            {isBike ? '🚵 Ride' : '🏃 Run'}
          </span>
        </div>

        <h1 className="mt">{a.title}</h1>
        {a.notes && <p className="small">{a.notes}</p>}

        {a.status === 'FLAGGED' && (
          <div className="flagged-banner">
            ⏳ <b>Waiting for staff review</b> — {a.flag_reason}
          </div>
        )}
        {a.status === 'REJECTED' && <div className="error">❌ This activity was rejected and does not count.</div>}

        <div className="grid3 mt">
          <div className="stat">
            <b>{fmtKm(a.distance_m)} km</b>
            <span>Distance</span>
          </div>
          <div className="stat">
            <b>{Math.round(a.elevation_m).toLocaleString()} m</b>
            <span>Climb</span>
          </div>
          <div className="stat">
            <b>{fmtDuration(a.moving_s ?? a.duration_s)}</b>
            <span>Moving time</span>
          </div>
          <div className="stat">
            <b>{fmtPace(a.distance_m, a.moving_s ?? a.duration_s, a.sport)}</b>
            <span>{isBike ? 'Avg speed' : 'Avg pace'}</span>
          </div>
          <div className="stat">
            <b>{a.avg_kmh ? `${a.avg_kmh} km/h` : '—'}</b>
            <span>Speed</span>
          </div>
          <div className="stat">
            <b>{a.source === 'GPX' ? '📡 GPX' : '✍️ Manual'}</b>
            <span>Source</span>
          </div>
        </div>

        {comparison && <p className="notice mt">{comparison}</p>}

        {a.status === 'APPROVED' && (
          <div className="row mt">
            <KudosButton activityId={a.id} count={a.kudos_count} mine={a.my_kudos > 0} />
          </div>
        )}
      </div>

      {mapsOn && points.length > 1 && <MapView points={points} color={isBike ? '#1465b4' : '#e8551d'} />}

      {(mine || staff) && (
        <div className="card">
          <h3>Manage</h3>
          <div className="row wrap">
            {a.gpx_path && (
              <a className="btn btn-sm" href={`/api/activities/${a.id}/gpx`}>
                ⬇️ Download GPX
              </a>
            )}
            {staff && a.status !== 'APPROVED' && (
              <form method="post" action={`/api/activities/${a.id}/review`}>
                <input type="hidden" name="action" value="approve" />
                <input type="hidden" name="back" value={`/activities/${a.id}`} />
                <button className="btn btn-sm btn-primary">✅ Approve</button>
              </form>
            )}
            {staff && a.status !== 'REJECTED' && (
              <form method="post" action={`/api/activities/${a.id}/review`}>
                <input type="hidden" name="action" value="reject" />
                <input type="hidden" name="back" value={`/activities/${a.id}`} />
                <button className="btn btn-sm btn-danger">❌ Reject</button>
              </form>
            )}
            <form method="post" action={`/api/activities/${a.id}/delete`}>
              <button className="btn btn-sm btn-danger">🗑️ Delete</button>
            </form>
          </div>
          {staff && (
            <p className="tiny muted mt">
              Staff: download the GPX to inspect it if anything looks off. Rejecting removes it from every
              leaderboard.
            </p>
          )}
        </div>
      )}
    </Shell>
  );
}
