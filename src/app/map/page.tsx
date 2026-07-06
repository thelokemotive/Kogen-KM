import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Shell from '@/components/Shell';
import HeatMap from '@/components/HeatMap';

export const metadata = { title: 'School Map' };
export const dynamic = 'force-dynamic';

export default async function MapPage() {
  if (process.env.DISABLE_MAPS === '1') notFound();
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return (
    <Shell user={user} active="/map" wide>
      <h1>🗺️ Where the school runs &amp; rides</h1>
      <p className="muted small">Every uploaded route, drawn together. Only school members can see this.</p>
      <HeatMap />
    </Shell>
  );
}
