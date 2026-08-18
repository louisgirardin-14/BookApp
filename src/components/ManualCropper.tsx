'use client';

import { useCallback, useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { getCroppedImageDataUrl } from '@/lib/cropImage';

export default function ManualCropper({
  imageSrc,
  aspect = 2 / 3,
  outputSize = { width: 1000, height: 1500 },
  onConfirm,
  onCancel,
}: {
  imageSrc: string;
  aspect?: number;
  outputSize?: { width: number; height: number };
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}) {
  const { dict } = useLocale();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  // Rotation is split into 90-degree orientation turns (for a sideways or
  // upside-down photo) and a small fine angle (for straightening a
  // slightly crooked shot), then combined for the actual crop rotation.
  const [quarterTurns, setQuarterTurns] = useState(0);
  const [fineAngle, setFineAngle] = useState(0);
  const rotation = quarterTurns * 90 + fineAngle;
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  function rotateQuarterTurn(direction: 1 | -1) {
    setQuarterTurns((q) => (q + direction + 4) % 4);
  }

  async function confirm() {
    if (!croppedAreaPixels) return;
    setBusy(true);
    try {
      const dataUrl = await getCroppedImageDataUrl(imageSrc, croppedAreaPixels, outputSize, rotation);
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
          rotation={rotation}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={(r) => setFineAngle(r - quarterTurns * 90)}
          onCropComplete={onCropComplete}
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => rotateQuarterTurn(-1)}
          className="rounded-lg border border-ink/15 px-3 py-1.5 text-sm hover:bg-ink/5"
          aria-label="Rotate left 90 degrees"
        >
          {dict.crop.rotateLeft}
        </button>
        <button
          type="button"
          onClick={() => rotateQuarterTurn(1)}
          className="rounded-lg border border-ink/15 px-3 py-1.5 text-sm hover:bg-ink/5"
          aria-label="Rotate right 90 degrees"
        >
          {dict.crop.rotateRight}
        </button>
      </div>

      <label className="mt-3 block text-xs font-medium text-ink/60">{dict.crop.zoom}</label>
      <input
        type="range"
        min={1}
        max={3}
        step={0.05}
        value={zoom}
        onChange={(e) => setZoom(Number(e.target.value))}
        className="w-full"
      />

      <label className="mt-2 block text-xs font-medium text-ink/60">{dict.crop.straighten}</label>
      <input
        type="range"
        min={-45}
        max={45}
        step={0.5}
        value={fineAngle}
        onChange={(e) => setFineAngle(Number(e.target.value))}
        className="w-full"
      />

      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={confirm}
          disabled={busy}
          className="rounded-lg bg-ink px-4 py-2 text-sm text-cream hover:opacity-90 disabled:opacity-50"
        >
          {dict.crop.useThisCrop}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-ink/15 px-4 py-2 text-sm hover:bg-ink/5"
        >
          {dict.crop.back}
        </button>
      </div>
    </div>
  );
}
