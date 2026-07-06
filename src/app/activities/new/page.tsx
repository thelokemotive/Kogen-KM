import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser, isStaff } from '@/lib/auth';
import { todayIso } from '@/lib/terms';
import Shell from '@/components/Shell';
import UserPicker from '@/components/UserPicker';

export const metadata = { title: 'Log activity' };
export const dynamic = 'force-dynamic';

export default async function NewActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const { error } = await searchParams;
  const staff = isStaff(user);

  return (
    <Shell user={user} active="/activities/new">
      <h1>➕ Log an activity</h1>
      {error && <div className="error">{error}</div>}

      <form method="post" action="/api/activities" encType="multipart/form-data" className="card">
        <h2>📡 Upload a GPX file</h2>
        <p className="small muted">
          Export from your watch or app (Garmin, Apple Watch, Strava, Suunto, COROS, Fitbit…) and upload the
          .gpx file. Distance, climbing and time are read automatically.
        </p>
        <input type="hidden" name="mode" value="gpx" />
        <label className="field">
          <span>GPX file</span>
          <input type="file" name="gpx" accept=".gpx,application/gpx+xml,application/xml" required />
        </label>
        <div className="grid2">
          <label className="field">
            <span>Sport</span>
            <select name="sport" defaultValue="RUN">
              <option value="RUN">🏃 Trail run</option>
              <option value="BIKE">🚵 Mountain bike</option>
            </select>
          </label>
          <label className="field">
            <span>Title (optional)</span>
            <input type="text" name="title" maxLength={100} placeholder="Morning loop above school" />
          </label>
        </div>
        <label className="field">
          <span>Notes (optional)</span>
          <textarea name="notes" rows={2} maxLength={1000} placeholder="How did it feel?" />
        </label>
        <button className="btn btn-primary" type="submit">
          Upload
        </button>
        <p className="tiny muted mt">
          Fair play: staff can open any GPX file to check it. Unusual uploads go to staff review before they
          count. Walking doesn&apos;t count — this is not a stepometer race. 😉
        </p>
      </form>

      {staff && (
        <form method="post" action="/api/activities" className="card">
          <h2>✍️ Manual entry (staff)</h2>
          <p className="small muted">
            For academy sessions without GPS. Logging for many athletes at once?{' '}
            <Link href="/staff/bulk" style={{ fontWeight: 700, color: 'var(--pine)' }}>
              Use bulk entry →
            </Link>
          </p>
          <input type="hidden" name="mode" value="manual" />
          <div className="grid2">
            <label className="field">
              <span>Sport</span>
              <select name="sport" defaultValue="RUN">
                <option value="RUN">🏃 Trail run</option>
                <option value="BIKE">🚵 Mountain bike</option>
              </select>
            </label>
            <label className="field">
              <span>Date</span>
              <input type="date" name="date" defaultValue={todayIso()} required />
            </label>
            <label className="field">
              <span>Distance (km)</span>
              <input type="number" name="distance_km" step="0.01" min="0.1" max="300" required />
            </label>
            <label className="field">
              <span>Climb (m)</span>
              <input type="number" name="elevation_m" step="1" min="0" max="10000" defaultValue={0} />
            </label>
            <label className="field">
              <span>Time (minutes, optional)</span>
              <input type="number" name="duration_min" step="1" min="1" />
            </label>
            <label className="field">
              <span>Title (optional)</span>
              <input type="text" name="title" maxLength={100} />
            </label>
          </div>
          <label className="field">
            <span>Athlete (leave empty to log for yourself)</span>
            <UserPicker multi={false} name="user_id" />
          </label>
          <button className="btn btn-primary" type="submit">
            Save entry
          </button>
        </form>
      )}
    </Shell>
  );
}
