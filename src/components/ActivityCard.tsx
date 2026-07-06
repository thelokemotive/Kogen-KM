import Link from 'next/link';
import type { ActivityRow } from '@/lib/queries';
import { fmtDate, fmtDuration, fmtKm, fmtPace } from '@/lib/queries';
import Avatar from './Avatar';
import KudosButton from './KudosButton';

export default function ActivityCard({ a }: { a: ActivityRow }) {
  const isBike = a.sport === 'BIKE';
  return (
    <article className="card">
      <div className="row">
        <Link href={`/profile/${a.user_id}`}>
          <Avatar name={a.display_name} path={a.avatar_path} />
        </Link>
        <div style={{ minWidth: 0 }}>
          <Link href={`/profile/${a.user_id}`}>
            <b>{a.display_name}</b>
          </Link>{' '}
          {a.role !== 'STUDENT' && <span className="chip staff">Staff</span>}
          <div className="tiny muted">
            {fmtDate(a.started_at)}
            {a.source === 'MANUAL' && ' · logged by staff'}
          </div>
        </div>
        <span className={`chip ${isBike ? 'bike' : 'run'}`} style={{ marginLeft: 'auto' }}>
          {isBike ? '🚵 Ride' : '🏃 Run'}
        </span>
      </div>

      {a.status === 'FLAGGED' && (
        <div className="flagged-banner mt">⏳ Waiting for staff review — not counted yet.</div>
      )}

      <Link href={`/activities/${a.id}`}>
        <h3 className="mt">{a.title}</h3>
        <div className="act-stats">
          <div>
            <b>{fmtKm(a.distance_m)} km</b>
            <span>Distance</span>
          </div>
          <div>
            <b>{Math.round(a.elevation_m)} m</b>
            <span>Climb</span>
          </div>
          <div>
            <b>{fmtDuration(a.moving_s ?? a.duration_s)}</b>
            <span>Time</span>
          </div>
          <div>
            <b>{fmtPace(a.distance_m, a.moving_s ?? a.duration_s, a.sport)}</b>
            <span>{isBike ? 'Speed' : 'Pace'}</span>
          </div>
        </div>
      </Link>

      {a.status === 'APPROVED' && (
        <div className="row mt">
          <KudosButton activityId={a.id} count={a.kudos_count} mine={a.my_kudos > 0} />
        </div>
      )}
    </article>
  );
}
