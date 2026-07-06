import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export const metadata = { title: 'Log in' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect('/feed');
  const { error } = await searchParams;
  return (
    <div className="auth-wrap">
      <div className="center" style={{ marginBottom: 18 }}>
        <div style={{ fontSize: '2.4rem' }}>⛰️</div>
        <h1>Welcome back</h1>
        <p className="muted small">Kogen KM · Harrow Appi trail club</p>
      </div>
      {error && <div className="error">{error}</div>}
      <form method="post" action="/api/auth/login" className="card">
        <label className="field">
          <span>School email</span>
          <input type="email" name="email" required autoComplete="email" placeholder="you@harrowappi.jp" />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" name="password" required autoComplete="current-password" />
        </label>
        <button className="btn btn-primary btn-block" type="submit">
          Log in
        </button>
      </form>
      <p className="center small muted">
        New here?{' '}
        <Link href="/signup" style={{ fontWeight: 700, color: 'var(--pine)' }}>
          Create your account
        </Link>
      </p>
    </div>
  );
}
