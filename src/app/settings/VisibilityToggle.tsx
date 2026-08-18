'use client';

import { useState, useTransition } from 'react';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { updateVisibility } from './actions';

export default function VisibilityToggle({ initialIsPublic }: { initialIsPublic: boolean }) {
  const { dict } = useLocale();
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !isPublic;
    setIsPublic(next);
    startTransition(async () => {
      await updateVisibility(next);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      className={`rounded-lg border px-4 py-2 text-sm transition ${
        isPublic ? 'border-ink bg-ink text-cream' : 'border-ink/15 hover:bg-ink/5'
      }`}
    >
      {isPublic ? dict.settings.public : dict.settings.private}
    </button>
  );
}
