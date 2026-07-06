import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getDb } from '@/lib/db';
import { getCurrentUser, isStaff, type User } from '@/lib/auth';
import { userActivities, userPeriodTotals } from '@/lib/queries';
import { latestTerm, resolvePeriod } from '@/lib/terms';
import { userBadges } from '@/lib/badges';
import { distanceLines, distanceProgress, elevationLines, elevationProgress } from '@/lib/equivalence';
import Shell from '@/components/Shell';
import Avatar from '@/components/Avatar';
import ActivityCard from '@/components/ActivityCard';

export const dynamic = 'force-dynamic';

interface PhotoRow {
  id: number;
  path: string;
  caption: string;
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await getCurrentUser();
  if (!viewer) redirect('/login');
  const { id } = await params;

  const db = getDb();
  const athlete = db
    .prepare(
      'SELECT id, email, display_name, role, bio, fav_spot, avatar_path, is_active, created_at FROM users WHERE id = ?'
    )
    .get(Number(id)) as User | undefined;
  if (!athlete || (!athlete.is_active && !isStaff(viewer))) notFound();

  const mine = athlete.id === viewer.id;
  const staff = isStaff(viewer);
  const term = latestTerm();
  const termTotals = userPeriodTotals(athlete.id, term ? resolvePeriod(`term:${term.id}`) : resolvePeriod('all'));
  const yearTotals = userPeriodTotals(athlete.id, resolvePeriod('year'));
  const allTotals = userPeriodTotals(athlete.id, resolvePeriod('all'));
  const badges = userBadges(athlete.id);
  const photos = db
    .prepare('SELECT id, path, caption FROM photos WHERE subject_user_id = ? ORDER BY created_at DESC LIMIT 12')
    .all(athlete.id) as PhotoRow[];
  const activities = userActivities(athlete.id, viewer.id, mine || staff);

  const dist = distanceProgress(allTotals.km);
  const elev = elevationProgress(allTotals.climb_m);
  const funLines = [...distanceLines(allTotals.km), ...elevationLines(allTotals.climb_m)];

  return (
    <Shell user={viewer} active={mine ? '/profile' : ''}>
      <div className="card">
        <div className="row">
          <Avatar name={athlete.display_name} path={athlete.avatar_path} size="lg" />
          <div style={{ minWidth: 0 }}>
            <h1 style={{ marginBottom: 2 }}>{athlete.display_name}</h1>
            <div className="row wrap" style={{ gap: 6 }}>
              {athlete.role !== 'STUDENT' && <span className="chip staff">Staff</span>}
              {!athlete.is_active && <span className="chip">Deactivated</span>}
              {badges.length > 0 && <span className="chip gold">🏅 {badges.length} badges</span>}
            </div>
          </div>
          {mine && (
            <Link href="/profile/edit" className="btn btn-sm" style={{ marginLeft: 'auto' }}>
              ✏️ Edit
            </Link>
          )}
        </div>
        {athlete.bio && <p className="mt">{athlete.bio}</p>}
        {athlete.fav_spot && (
          <p className="small muted">
            📍 Favourite place to run/ride: <b>{athlete.fav_spot}</b>
          </p>
        )}
        {mine && (
          <form method="post" action="/api/auth/logout" className="mt">
            <button className="btn btn-sm">Log out</button>
          </form>
        )}
      </div>

      <div className="card">
        <h2>Stats</h2>
        <div className="grid3">
          <div className="stat">
            <b>{termTotals.km.toFixed(1)}</b>
            <span>km · {term ? term.name.replace(/ \d{4}$/, '') : 'all-time'}</span>
          </div>
          <div className="stat">
            <b>{yearTotals.km.toFixed(1)}</b>
            <span>km · this year</span>
          </div>
          <div className="stat">
            <b>{allTotals.km.toFixed(1)}</b>
            <span>km · all-time</span>
          </div>
          <div className="stat">
            <b>{Math.round(termTotals.climb_m).toLocaleString()}</b>
            <span>m climb · term</span>
          </div>
          <div className="stat">
            <b>{Math.round(yearTotals.climb_m).toLocaleString()}</b>
            <span>m climb · year</span>
          </div>
          <div className="stat">
            <b>{Math.round(allTotals.climb_m).toLocaleString()}</b>
            <span>m climb · all-time</span>
          </div>
        </div>

        {funLines.length > 0 && (
          <div className="notice mt">
            {funLines.map((l) => (
              <div key={l}>{l}</div>
            ))}
          </div>
        )}

        {dist.next && (
          <div className="mt">
            <p className="small" style={{ marginBottom: 4 }}>
              📏 Next distance milestone: <b>{dist.next.emoji} {dist.next.name}</b> ({dist.remaining.toFixed(1)} km to
              go)
            </p>
            <div className="progress orange">
              <div style={{ width: `${dist.pctToNext}%` }} />
            </div>
          </div>
        )}
        {elev.next && (
          <div className="mt">
            <p className="small" style={{ marginBottom: 4 }}>
              ⛰️ Next climbing milestone: <b>{elev.next.emoji} {elev.next.name}</b> (
              {Math.ceil(elev.remaining).toLocaleString()} m to go)
            </p>
            <div className="progress">
              <div style={{ width: `${elev.pctToNext}%` }} />
            </div>
          </div>
        )}
      </div>

      {badges.length > 0 && (
        <div className="card">
          <h2>🏅 Badges</h2>
          <div className="badges">
            {badges.map((b) => (
              <div key={b.id} className="badge">
                <div className="be">{b.emoji}</div>
                <b>{b.name}</b>
                <span>{b.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {photos.length > 0 && (
        <div className="card">
          <h2>📸 Photos</h2>
          <p className="tiny muted">Taken by academy staff during sessions.</p>
          <div className="photo-grid">
            {photos.map((p) => (
              <figure key={p.id}>
                <img src={`/api/files/${p.path}`} alt={p.caption || 'Academy photo'} />
                {(p.caption || staff) && (
                  <figcaption className="row spread">
                    <span>{p.caption}</span>
                    {staff && (
                      <form method="post" action={`/api/photos/${p.id}/delete`}>
                        <input type="hidden" name="back" value={`/profile/${athlete.id}`} />
                        <button className="kudos-btn" style={{ padding: '2px 8px' }}>🗑️</button>
                      </form>
                    )}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </div>
      )}

      <h2>Recent activities</h2>
      {activities.length === 0 && (
        <div className="card center muted">No activities yet.</div>
      )}
      {activities.map((a) => (
        <ActivityCard key={a.id} a={a} />
      ))}
    </Shell>
  );
}
