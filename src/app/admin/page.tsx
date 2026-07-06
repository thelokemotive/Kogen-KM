import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { allTerms, todayIso } from '@/lib/terms';
import Shell from '@/components/Shell';

export const metadata = { title: 'Admin' };
export const dynamic = 'force-dynamic';

interface UserRow {
  id: number;
  email: string;
  display_name: string;
  role: string;
  is_active: number;
  created_at: string;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!isAdmin(user)) redirect('/feed');
  const { error } = await searchParams;

  const users = getDb()
    .prepare('SELECT id, email, display_name, role, is_active, created_at FROM users ORDER BY created_at DESC')
    .all() as UserRow[];
  const terms = allTerms();

  return (
    <Shell user={user} active="/staff" wide>
      <h1>⚙️ Admin</h1>
      {error && <div className="error">{error}</div>}

      <div className="card">
        <h2>👥 Accounts ({users.length})</h2>
        <p className="small muted">
          New sign-ups start as students. Verify instructors here by giving them the Staff role — that unlocks
          manual entry, bulk logging, review and photos.
        </p>
        <div className="table-wrap">
          <table className="admin">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={u.is_active ? undefined : { opacity: 0.5 }}>
                  <td>
                    <b>{u.display_name}</b>
                  </td>
                  <td className="small">{u.email}</td>
                  <td>
                    <span className={`chip${u.role !== 'STUDENT' ? ' staff' : ''}`}>{u.role}</span>
                  </td>
                  <td className="small">{u.is_active ? 'Active' : 'Deactivated'}</td>
                  <td>
                    {u.id !== user.id && (
                      <div className="row wrap" style={{ gap: 4 }}>
                        {(['STUDENT', 'STAFF', 'ADMIN'] as const)
                          .filter((r) => r !== u.role)
                          .map((r) => (
                            <form key={r} method="post" action="/api/admin/users">
                              <input type="hidden" name="user_id" value={u.id} />
                              <input type="hidden" name="action" value={`role:${r}`} />
                              <button className="btn btn-sm">→ {r.toLowerCase()}</button>
                            </form>
                          ))}
                        <form method="post" action="/api/admin/users">
                          <input type="hidden" name="user_id" value={u.id} />
                          <input type="hidden" name="action" value={u.is_active ? 'deactivate' : 'activate'} />
                          <button className={`btn btn-sm${u.is_active ? ' btn-danger' : ''}`}>
                            {u.is_active ? 'Deactivate' : 'Reactivate'}
                          </button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>📅 Terms</h2>
        <p className="small muted">
          Two competition seasons per year — Autumn and Spring. Each term crowns its own champions.
        </p>
        <div className="table-wrap">
          <table className="admin">
            <thead>
              <tr>
                <th>Name</th>
                <th>Starts</th>
                <th>Ends</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {terms.map((t) => (
                <tr key={t.id}>
                  <td>
                    <b>{t.name}</b>
                  </td>
                  <td>{t.starts_on}</td>
                  <td>{t.ends_on}</td>
                  <td>
                    <form method="post" action="/api/admin/terms">
                      <input type="hidden" name="action" value="delete" />
                      <input type="hidden" name="term_id" value={t.id} />
                      <button className="btn btn-sm btn-danger">Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form method="post" action="/api/admin/terms" className="mt">
          <input type="hidden" name="action" value="create" />
          <div className="grid3">
            <label className="field">
              <span>Name</span>
              <input type="text" name="name" required maxLength={60} placeholder="Autumn Term 2027" />
            </label>
            <label className="field">
              <span>Starts</span>
              <input type="date" name="starts_on" defaultValue={todayIso()} required />
            </label>
            <label className="field">
              <span>Ends</span>
              <input type="date" name="ends_on" required />
            </label>
          </div>
          <button className="btn btn-primary btn-sm" type="submit">
            Add term
          </button>
        </form>
      </div>
    </Shell>
  );
}
