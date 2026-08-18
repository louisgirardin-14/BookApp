import { ImageResponse } from 'next/og';
import { NextResponse } from 'next/server';
import { EXPORT_THEMES, EXPORT_WIDTH, EXPORT_HEIGHT, type ThemeId } from '@/lib/exportThemes';
import { buildConnectorPath, type ConnectorStyle, type PathPoint } from '@/lib/timelinePath';

export const runtime = 'edge';

interface TimelineEntry {
  cover_url: string;
  date_read: string;
}

const MAX_ENTRIES = 8;

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    books: TimelineEntry[];
    themeId: ThemeId;
    title: string;
    connectorStyle: ConnectorStyle;
  };

  const theme = EXPORT_THEMES.find((t) => t.id === body.themeId) ?? EXPORT_THEMES[0];
  const entries = (body.books ?? []).slice(0, MAX_ENTRIES);

  if (entries.length === 0) {
    return NextResponse.json({ error: 'No books in this range.' }, { status: 400 });
  }

  const margin = 64;
  const topY = margin + 140;
  const bottomY = EXPORT_HEIGHT - margin;
  const centerX = EXPORT_WIDTH / 2;
  const amplitude = 130;
  const rowGap = (bottomY - topY) / (entries.length + 1);

  const points: PathPoint[] = [
    { x: centerX, y: topY },
    ...entries.map((_, i) => ({
      x: centerX + (i % 2 === 0 ? -amplitude : amplitude),
      y: topY + rowGap * (i + 1),
    })),
    { x: centerX, y: bottomY },
  ];

  const pathD = buildConnectorPath(points, body.connectorStyle ?? 'wave');
  const coverW = 90;
  const coverH = 135;
  const entryWidth = 260;
  const gapFromSpine = 24;

  return new ImageResponse(
    (
      <div
        style={{
          width: EXPORT_WIDTH,
          height: EXPORT_HEIGHT,
          display: 'flex',
          backgroundColor: theme.background,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: margin,
            left: margin,
            fontSize: 36,
            fontWeight: 700,
            color: theme.textColor,
            display: 'flex',
          }}
        >
          {body.title}
        </div>

        <svg
          width={EXPORT_WIDTH}
          height={EXPORT_HEIGHT}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <path d={pathD} stroke={theme.mutedColor} strokeWidth={3} fill="none" />
          <circle cx={centerX} cy={topY} r={9} fill={theme.mutedColor} />
          <circle cx={centerX} cy={bottomY} r={9} fill={theme.mutedColor} />
        </svg>

        {entries.map((entry, i) => {
          const point = points[i + 1];
          const onLeft = i % 2 === 0;
          const left = onLeft ? point.x - gapFromSpine - entryWidth : point.x + gapFromSpine;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: point.y - coverH / 2,
                left,
                width: entryWidth,
                display: 'flex',
                flexDirection: onLeft ? 'row' : 'row-reverse',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div
                style={{
                  width: coverW,
                  height: coverH,
                  borderRadius: 6,
                  overflow: 'hidden',
                  display: 'flex',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={entry.cover_url}
                  width={coverW}
                  height={coverH}
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div style={{ fontSize: 22, color: theme.mutedColor, display: 'flex' }}>
                {formatDate(entry.date_read)}
              </div>
            </div>
          );
        })}
      </div>
    ),
    { width: EXPORT_WIDTH, height: EXPORT_HEIGHT }
  );
}
