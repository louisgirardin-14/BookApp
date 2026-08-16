'use client';

interface StarRatingProps {
  value: number | null;
  onChange?: (value: number | null) => void;
  size?: 'sm' | 'md';
}

export default function StarRating({ value, onChange, size = 'md' }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];
  const textSize = size === 'sm' ? 'text-sm' : 'text-2xl';
  const readOnly = !onChange;

  return (
    <div className={`flex gap-1 ${textSize}`}>
      {stars.map((star) => {
        const filled = value !== null && star <= value;
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(value === star ? null : star)}
            className={readOnly ? 'cursor-default' : 'cursor-pointer'}
            aria-label={`${star} star`}
          >
            <span className={filled ? 'text-kraft' : 'text-ink/20'}>★</span>
          </button>
        );
      })}
    </div>
  );
}
