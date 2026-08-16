import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { signOutAction } from './actions';
import VisibilityToggle from './VisibilityToggle';
import InviteFriendForm from './InviteFriendForm';
import ChangePasswordForm from './ChangePasswordForm';
import DeleteAccountButton from './DeleteAccountButton';

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_public')
    .eq('id', user.id)
    .single();

  const isOwner = user.email === process.env.OWNER_EMAIL;

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section className="space-y-2">
        <p className="text-sm text-ink/60">Signed in as {user.email}</p>
        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-lg border border-ink/15 px-4 py-2 text-sm hover:bg-ink/5"
          >
            Sign out
          </button>
        </form>
      </section>

      <section className="space-y-2 border-t border-ink/10 pt-6">
        <h2 className="text-sm font-medium">Change password</h2>
        <ChangePasswordForm />
      </section>

      <section className="space-y-2 border-t border-ink/10 pt-6">
        <h2 className="text-sm font-medium">Shelf visibility</h2>
        <p className="text-sm text-ink/60">
          Public shelves can be viewed (read-only) by other accounts on this app, like an
          Instagram profile.
        </p>
        <VisibilityToggle initialIsPublic={profile?.is_public ?? false} />
      </section>

      {isOwner && (
        <section className="space-y-2 border-t border-ink/10 pt-6">
          <h2 className="text-sm font-medium">Invite a friend</h2>
          <p className="text-sm text-ink/60">
            Signup is invite-only. Only your account can send invites.
          </p>
          <InviteFriendForm />
        </section>
      )}

      <section className="space-y-2 border-t border-ink/10 pt-6">
        <h2 className="text-sm font-medium text-red-600">Danger zone</h2>
        <p className="text-sm text-ink/60">
          Permanently deletes your account, books, and photos. This cannot be undone.
        </p>
        <DeleteAccountButton />
      </section>
    </div>
  );
}
