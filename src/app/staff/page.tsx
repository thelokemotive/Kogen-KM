import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser, isAdmin, isStaff } from '@/lib/auth';
import { getDb } from '@/lib/db';
import Shell from '@/components/Shell';

export const metadata = { title: 'Staff' };
export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!isStaff(user)) redirect('/feed');

  const flagged = (
    getDb().prepare(`SELECT COUNT(*) AS n FROM activities WHERE status = 'FLAGGED'`).get() as { n: number }
  ).n;

  return (
    <Shell user={user} active="/staff">
      <h1>🎓 Staff tools</h1>
      <div className="card">
        <h2>⏳ Review queue</h2>
        <p className="small muted">
          {flagged === 0 ? 'Nothing waiting — all clear.' : `${flagged} upload${flagged > 1 ? 's' : ''} waiting for a decision.`}
        </p>
        <Link href="/staff/review" className="btn btn-primary btn-sm">
          Open review queue{flagged > 0 ? ` (${flagged})` : ''}
        </Link>
      </div>
      <div className="card">
        <h2>📋 Bulk session entry</h2>
        <p className="small muted">
          Log one academy session for many athletes at once — search, tick, enter distance and climb, done.
        </p>
        <Link href="/staff/bulk" className="btn btn-primary btn-sm">
          Bulk entry
        </Link>
      </div>
      <div className="card">
        <h2>📸 Upload photos</h2>
        <p className="small muted">Add academy photos to a student&apos;s profile.</p>
        <Link href="/staff/photos" className="btn btn-primary btn-sm">
          Upload a photo
        </Link>
      </div>
      {isAdmin(user) && (
        <div className="card">
          <h2>⚙️ Administration</h2>
          <p className="small muted">Manage accounts, verify instructors as staff, and edit term dates.</p>
          <Link href="/admin" className="btn btn-primary btn-sm">
            Admin panel
          </Link>
        </div>
      )}
    </Shell>
  );
}
