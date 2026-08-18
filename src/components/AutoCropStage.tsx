'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { autoDetectAndCropCover } from '@/lib/autoDetectCover';
import ManualCropper from './ManualCropper';

export default function AutoCropStage({
  capturedImage,
  aspect = 2 / 3,
  outputSize,
  onConfirm,
  onRetake,
}: {
  capturedImage: string;
  aspect?: number;
  outputSize?: { width: number; height: number };
  onConfirm: (dataUrl: string) => void;
  onRetake: () => void;
}) {
  const { dict } = useLocale();
  const [status, setStatus] = useState<'detecting' | 'preview' | 'manual'>('detecting');
  const [autoCropped, setAutoCropped] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    autoDetectAndCropCover(capturedImage)
      .then((result) => {
        if (cancelled) return;
        if (result) {
          setAutoCropped(result);
          setStatus('preview');
        } else {
          setStatus('manual');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('manual');
      });
    return () => {
      cancelled = true;
    };
  }, [capturedImage]);

  if (status === 'detecting') {
    return (
      <div className="rounded-xl border border-ink/10 bg-white p-8 text-center text-sm text-ink/60">
        {dict.crop.detecting}
      </div>
    );
  }

  if (status === 'manual') {
    return (
      <ManualCropper
        imageSrc={capturedImage}
        aspect={aspect}
        outputSize={outputSize}
        onConfirm={onConfirm}
        onCancel={onRetake}
      />
    );
  }

  return (
    <div className="rounded-xl border border-ink/10 bg-white p-4">
      <p className="mb-3 text-sm text-ink/60">{dict.crop.autoDetectedCrop}</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={autoCropped!} alt={dict.crop.autoCropAlt} className="mx-auto max-h-80 rounded-lg" />
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onConfirm(autoCropped!)}
          className="rounded-lg bg-ink px-4 py-2 text-sm text-cream hover:opacity-90"
        >
          {dict.crop.looksGood}
        </button>
        <button
          type="button"
          onClick={() => setStatus('manual')}
          className="rounded-lg border border-ink/15 px-4 py-2 text-sm hover:bg-ink/5"
        >
          {dict.crop.adjustManually}
        </button>
        <button
          type="button"
          onClick={onRetake}
          className="rounded-lg border border-ink/15 px-4 py-2 text-sm hover:bg-ink/5"
        >
          {dict.crop.retake}
        </button>
      </div>
    </div>
  );
}
