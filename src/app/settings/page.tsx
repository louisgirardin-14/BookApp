import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDictionary } from '@/lib/i18n/getLocale';
import { signOutAction } from './actions';
import VisibilityToggle from './VisibilityToggle';
import InviteFriendForm from './InviteFriendForm';
import ChangePasswordForm from './ChangePasswordForm';
import ManageAccountsSection from './ManageAccountsSection';
import DeleteAccountButton from './DeleteAccountButton';

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const dict = getDictionary();

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_public')
    .eq('id', user.id)
    .single();

  const isOwner = user.email === process.env.OWNER_EMAIL;

  let otherAccounts: { id: string; email: string | null }[] = [];
  if (isOwner) {
    const { data } = await supabase
      .from('profiles')
      .select('id, email')
      .neq('id', user.id)
      .order('email', { ascending: true });
    otherAccounts = data ?? [];
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <h1 className="text-2xl font-semibold">{dict.settings.heading}</h1>

      <section className="space-y-2">
        <p className="text-sm text-ink/60">
          {dict.settings.signedInAs} {user.email}
        </p>
        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-lg border border-ink/15 px-4 py-2 text-sm hover:bg-ink/5"
          >
            {dict.settings.signOut}
          </button>
        </form>
      </section>

      <section className="space-y-2 border-t border-ink/10 pt-6">
        <h2 className="text-sm font-medium">{dict.settings.changePassword}</h2>
        <ChangePasswordForm />
      </section>

      <section className="space-y-2 border-t border-ink/10 pt-6">
        <h2 className="text-sm font-medium">{dict.settings.shelfVisibility}</h2>
        <p className="text-sm text-ink/60">{dict.settings.shelfVisibilityDescription}</p>
        <VisibilityToggle initialIsPublic={profile?.is_public ?? false} />
      </section>

      {isOwner && (
        <section className="space-y-2 border-t border-ink/10 pt-6">
          <h2 className="text-sm font-medium">{dict.settings.inviteAFriend}</h2>
          <p className="text-sm text-ink/60">{dict.settings.inviteDescription}</p>
          <InviteFriendForm />
        </section>
      )}

      {isOwner && (
        <section className="space-y-2 border-t border-ink/10 pt-6">
          <h2 className="text-sm font-medium">{dict.settings.manageAccounts}</h2>
          <p className="text-sm text-ink/60">{dict.settings.manageAccountsDescription}</p>
          <ManageAccountsSection accounts={otherAccounts} />
        </section>
      )}

      <section className="space-y-2 border-t border-ink/10 pt-6">
        <h2 className="text-sm font-medium text-red-600">{dict.settings.dangerZone}</h2>
        <p className="text-sm text-ink/60">{dict.settings.deleteAccountDescription}</p>
        <DeleteAccountButton />
      </section>
    </div>
  );
}
