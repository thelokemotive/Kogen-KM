import Link from 'next/link';
import { redirect } from 'next/navigation';
import { allowedDomains, getCurrentUser } from '@/lib/auth';

export const metadata = { title: 'Sign up' };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect('/feed');
  const { error } = await searchParams;
  const domains = allowedDomains();
  return (
    <div className="auth-wrap">
      <div className="center" style={{ marginBottom: 18 }}>
        <div style={{ fontSize: '2.4rem' }}>🏃</div>
        <h1>Join the club</h1>
        <p className="muted small">
          Open to everyone with a school email (@{domains.join(', @')}).
        </p>
      </div>
      {error && <div className="error">{error}</div>}
      <form method="post" action="/api/auth/signup" className="card">
        <label className="field">
          <span>Your name (shown on leaderboards)</span>
          <input type="text" name="display_name" required maxLength={60} placeholder="e.g. Kenji T." />
        </label>
        <label className="field">
          <span>School email</span>
          <input type="email" name="email" required autoComplete="email" placeholder={`you@${domains[0]}`} />
        </label>
        <label className="field">
          <span>Password (8+ characters)</span>
          <input type="password" name="password" required minLength={8} autoComplete="new-password" />
        </label>
        <button className="btn btn-primary btn-block" type="submit">
          Create account
        </button>
      </form>
      <p className="center small muted">
        Already have an account?{' '}
        <Link href="/login" style={{ fontWeight: 700, color: 'var(--pine)' }}>
          Log in
        </Link>
      </p>
    </div>
  );
}
