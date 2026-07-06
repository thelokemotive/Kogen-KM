import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Shell from '@/components/Shell';

export const metadata = { title: 'Edit profile' };
export const dynamic = 'force-dynamic';

export default async function EditProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const { error } = await searchParams;

  return (
    <Shell user={user} active="/profile">
      <h1>✏️ Edit your profile</h1>
      <p className="muted small">
        Keep it simple: a name, a photo, and where you love to run. Only school members can see it.
      </p>
      {error && <div className="error">{error}</div>}
      <form method="post" action="/api/profile" encType="multipart/form-data" className="card">
        <label className="field">
          <span>Display name</span>
          <input type="text" name="display_name" defaultValue={user.display_name} required maxLength={60} />
        </label>
        <label className="field">
          <span>Profile photo (JPG/PNG/WebP, max 4 MB)</span>
          <input type="file" name="avatar" accept="image/jpeg,image/png,image/webp" />
        </label>
        <label className="field">
          <span>About you as a runner / rider (max 300 characters)</span>
          <textarea
            name="bio"
            rows={3}
            maxLength={300}
            defaultValue={user.bio}
            placeholder="Trail runner since Year 9. Chasing the Iwate-san badge."
          />
        </label>
        <label className="field">
          <span>Favourite place to run or ride</span>
          <input
            type="text"
            name="fav_spot"
            maxLength={120}
            defaultValue={user.fav_spot}
            placeholder="The beech forest loop behind campus"
          />
        </label>
        <button className="btn btn-primary" type="submit">
          Save
        </button>
      </form>
    </Shell>
  );
}
