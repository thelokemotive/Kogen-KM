import Link from 'next/link';
import type { User } from '@/lib/auth';
import { isStaff } from '@/lib/auth';
import Avatar from './Avatar';

const TABS = [
  { href: '/feed', label: 'Feed', ico: '🏔️' },
  { href: '/leaderboard', label: 'Leaders', ico: '🏆' },
  { href: '/activities/new', label: 'Log', ico: '➕' },
  { href: '/journey', label: 'Journey', ico: '🗾' },
];

export default function Shell({
  user,
  active,
  wide,
  children,
}: {
  user: User;
  active: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  const staff = isStaff(user);
  const mapsOn = process.env.DISABLE_MAPS !== '1';
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/feed" className="brand">
            <span>⛰️</span>
            <span>
              Kogen KM
              <small>Harrow Appi trail club</small>
            </span>
          </Link>
          <nav className="topnav">
            {TABS.map((t) => (
              <Link key={t.href} href={t.href} className={active === t.href ? 'active' : ''}>
                {t.label}
              </Link>
            ))}
            {mapsOn && (
              <Link href="/map" className={active === '/map' ? 'active' : ''}>
                Map
              </Link>
            )}
            {staff && (
              <Link href="/staff" className={active === '/staff' ? 'active' : ''}>
                Staff
              </Link>
            )}
            <Link href={`/profile/${user.id}`} className={active === '/profile' ? 'active' : ''} title="My profile">
              <span className="row" style={{ gap: 6 }}>
                <Avatar name={user.display_name} path={user.avatar_path} size="sm" />
              </span>
            </Link>
          </nav>
        </div>
      </header>
      <main className={`container${wide ? ' wide' : ''}`}>{children}</main>
      <nav className="tabbar">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={active === t.href ? 'active' : ''}>
            <span className="ico">{t.ico}</span>
            {t.label}
          </Link>
        ))}
        {staff ? (
          <Link href="/staff" className={active === '/staff' ? 'active' : ''}>
            <span className="ico">🎓</span>
            Staff
          </Link>
        ) : (
          <Link href={`/profile/${user.id}`} className={active === '/profile' ? 'active' : ''}>
            <span className="ico">👤</span>
            Me
          </Link>
        )}
      </nav>
    </>
  );
}
