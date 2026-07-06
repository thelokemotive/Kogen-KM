import { redirect } from 'next/navigation';
import { getCurrentUser, isStaff } from '@/lib/auth';
import Shell from '@/components/Shell';
import UserPicker from '@/components/UserPicker';

export const metadata = { title: 'Upload photo' };
export const dynamic = 'force-dynamic';

export default async function StaffPhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!isStaff(user)) redirect('/feed');
  const { error } = await searchParams;

  return (
    <Shell user={user} active="/staff">
      <h1>📸 Upload an academy photo</h1>
      <p className="muted small">
        Photos are staff-uploaded only and appear on the tagged student&apos;s profile — visible to school
        members, never public.
      </p>
      {error && <div className="error">{error}</div>}
      <form method="post" action="/api/photos" encType="multipart/form-data" className="card">
        <label className="field">
          <span>Who is in the photo?</span>
          <UserPicker multi={false} name="subject_user_id" />
        </label>
        <label className="field">
          <span>Photo (JPG/PNG/WebP, max 8 MB)</span>
          <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required />
        </label>
        <label className="field">
          <span>Caption (optional)</span>
          <input type="text" name="caption" maxLength={200} placeholder="Summit of the ridge loop, October academy" />
        </label>
        <button className="btn btn-primary" type="submit">
          Upload
        </button>
      </form>
    </Shell>
  );
}
