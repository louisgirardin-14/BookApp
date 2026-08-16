'use client';

import { useCallback, useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { getCroppedImageDataUrl } from '@/lib/cropImage';

export default function ManualCropper({
  imageSrc,
  onConfirm,
  onCancel,
}: {
  imageSrc: string;
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function confirm() {
    if (!croppedAreaPixels) return;
    setBusy(true);
    try {
      const dataUrl = await getCroppedImageDataUrl(imageSrc, croppedAreaPixels, {
        width: 1000,
        height: 1500,
      });
      onConfirm(dataUrl);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-ink/10 bg-white p-4">
      <div className="relative h-80 w-full overflow-hidden rounded-lg bg-ink/5">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={2 / 3}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>
      <input
        type="range"
        min={1}
        max={3}
        step={0.05}
        value={zoom}
        onChange={(e) => setZoom(Number(e.target.value))}
        className="mt-3 w-full"
      />
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={confirm}
          disabled={busy}
          className="rounded-lg bg-ink px-4 py-2 text-sm text-cream hover:opacity-90 disabled:opacity-50"
        >
          Use this crop
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-ink/15 px-4 py-2 text-sm hover:bg-ink/5"
        >
          Back
        </button>
      </div>
    </div>
  );
}
