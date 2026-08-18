'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from '@/lib/i18n/LocaleProvider';

export default function CameraCapture({
  onCapture,
  onCancel,
}: {
  onCapture: (dataUrl: string) => void;
  onCancel: () => void;
}) {
  const { dict } = useLocale();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setError(dict.camera.cameraError));

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [dict.camera.cameraError]);

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    onCapture(canvas.toDataURL('image/jpeg', 0.95));
  }

  return (
    <div className="rounded-xl border border-ink/10 bg-white p-4">
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg bg-black" />
      )}
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={capture}
          disabled={!!error}
          className="rounded-lg bg-ink px-4 py-2 text-sm text-cream hover:opacity-90 disabled:opacity-50"
        >
          {dict.camera.capture}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-ink/15 px-4 py-2 text-sm hover:bg-ink/5"
        >
          {dict.camera.cancel}
        </button>
      </div>
    </div>
  );
}
