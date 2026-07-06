import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect('/feed');
  return (
    <div className="auth-wrap">
      <div className="hero center">
        <div style={{ fontSize: '3rem' }}>⛰️</div>
        <h1>Kogen KM</h1>
        <p>
          Trail running &amp; mountain biking at
          <br />
          <b>Harrow Appi International School</b>
        </p>
        <p className="small">Every kilometre counts. Every metre climbed counts double in your heart.</p>
      </div>
      <Link href="/login" className="btn btn-primary btn-block">
        Log in
      </Link>
      <div style={{ height: 10 }} />
      <Link href="/signup" className="btn btn-block">
        Create account with school email
      </Link>
      <p className="tiny muted center mt">
        Private to the school community. You need a school email address to join.
      </p>
    </div>
  );
}
