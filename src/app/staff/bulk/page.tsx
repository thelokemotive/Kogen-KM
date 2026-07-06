import { redirect } from 'next/navigation';
import { getCurrentUser, isStaff } from '@/lib/auth';
import { todayIso } from '@/lib/terms';
import Shell from '@/components/Shell';
import UserPicker from '@/components/UserPicker';

export const metadata = { title: 'Bulk entry' };
export const dynamic = 'force-dynamic';

export default async function BulkPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; done?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!isStaff(user)) redirect('/feed');
  const { error, done } = await searchParams;

  return (
    <Shell user={user} active="/staff">
      <h1>📋 Bulk session entry</h1>
      <p className="muted small">
        One academy session, many athletes: tick everyone who took part, enter the shared distance and climb,
        and an activity is created for each of them.
      </p>
      {error && <div className="error">{error}</div>}
      {done && <div className="notice">✅ Logged for {done} athlete{done === '1' ? '' : 's'}.</div>}

      <form method="post" action="/api/activities/bulk" className="card">
        <label className="field">
          <span>Who took part?</span>
          <UserPicker multi name="user_ids" />
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
            <span>Session title</span>
            <input type="text" name="title" maxLength={100} placeholder="Tuesday academy — ridge loop" />
          </label>
        </div>
        <label className="field">
          <span>Notes (optional)</span>
          <textarea name="notes" rows={2} maxLength={1000} />
        </label>
        <button className="btn btn-primary" type="submit">
          Log session for selected athletes
        </button>
      </form>
    </Shell>
  );
}
