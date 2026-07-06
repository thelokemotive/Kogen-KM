import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { schoolTotals } from '@/lib/queries';
import { resolvePeriod } from '@/lib/terms';
import {
  DISTANCE_JOURNEY,
  ELEVATION_LADDER,
  distanceProgress,
  elevationProgress,
} from '@/lib/equivalence';
import Shell from '@/components/Shell';

export const metadata = { title: 'School Journey' };
export const dynamic = 'force-dynamic';

export default async function JourneyPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const all = schoolTotals(resolvePeriod('all'));
  const year = schoolTotals(resolvePeriod('year'));
  const dist = distanceProgress(all.km);
  const elev = elevationProgress(all.climb_m);

  return (
    <Shell user={user} active="/journey">
      <h1>🗾 The School Journey</h1>
      <p className="muted small">
        Every run and ride by every member of the school adds up here. Together, we go far.
      </p>

      <div className="grid3">
        <div className="stat">
          <b>{all.km.toFixed(0)}</b>
          <span>km together</span>
        </div>
        <div className="stat">
          <b>{Math.round(all.climb_m).toLocaleString()}</b>
          <span>m climbed</span>
        </div>
        <div className="stat">
          <b>{all.athletes}</b>
          <span>athletes</span>
        </div>
      </div>

      <div className="card mt">
        <h2>📏 How far have we travelled?</h2>
        {dist.next ? (
          <>
            <p className="small">
              {dist.done ? (
                <>
                  We have passed <b>{dist.done.emoji} {dist.done.name}</b>.{' '}
                </>
              ) : null}
              Next stop: <b>{dist.next.emoji} {dist.next.name}</b> — {dist.remaining.toFixed(0)} km to go.
            </p>
            <div className="progress orange">
              <div style={{ width: `${dist.pctToNext}%` }} />
            </div>
          </>
        ) : (
          <p>🌍 We have run around the entire planet. There is nothing left to prove.</p>
        )}
        <div className="mt">
          {DISTANCE_JOURNEY.map((m) => (
            <div key={m.name} className={`journey-step ${all.km >= m.at ? 'done' : 'todo'}`}>
              <span className="je">{all.km >= m.at ? '✅' : m.emoji}</span>
              <div>
                <b>{m.name}</b> <span className="tiny muted">({m.at.toLocaleString()} km)</span>
                <div className="tiny muted">{m.blurb}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>⛰️ How high have we climbed?</h2>
        {elev.next ? (
          <>
            <p className="small">
              {elev.done ? (
                <>
                  We have climbed past <b>{elev.done.emoji} {elev.done.name}</b>.{' '}
                </>
              ) : null}
              Next: <b>{elev.next.emoji} {elev.next.name}</b> — {Math.ceil(elev.remaining).toLocaleString()} m of
              climbing to go.
            </p>
            <div className="progress">
              <div style={{ width: `${elev.pctToNext}%` }} />
            </div>
          </>
        ) : (
          <p>👨‍🚀 We have climbed to the International Space Station. Incredible.</p>
        )}
        <div className="mt">
          {ELEVATION_LADDER.map((m) => (
            <div key={m.name} className={`journey-step ${all.climb_m >= m.at ? 'done' : 'todo'}`}>
              <span className="je">{all.climb_m >= m.at ? '✅' : m.emoji}</span>
              <div>
                <b>{m.name}</b> <span className="tiny muted">({m.at.toLocaleString()} m)</span>
                <div className="tiny muted">{m.blurb}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>📅 This school year</h2>
        <p className="small muted">
          {year.km.toFixed(0)} km and {Math.round(year.climb_m).toLocaleString()} m climbed since September —{' '}
          {year.count} activities by {year.athletes} athletes.
        </p>
      </div>
    </Shell>
  );
}
