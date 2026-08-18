import { ImageResponse } from 'next/og';
import { NextResponse } from 'next/server';
import { EXPORT_WIDTH, EXPORT_HEIGHT } from '@/lib/exportThemes';
import { TIMELINE_THEMES, type TimelineThemeId } from '@/lib/timelineThemes';
import { buildConnectorPath, type ConnectorStyle, type PathPoint } from '@/lib/timelinePath';

export const runtime = 'edge';

interface BookInput {
  title: string;
  cover_url: string;
  date_read: string;
}

interface DateGroup {
  date_read: string;
  books: BookInput[];
}

const MAX_STOPS = 7;
const MAX_COVERS_PER_STOP = 3;

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Books read on the same day become one timeline stop instead of one per
// book, so the date isn't repeated for every book finished that day.
function groupByDate(books: BookInput[]): DateGroup[] {
  const groups: DateGroup[] = [];
  for (const book of books) {
    const last = groups[groups.length - 1];
    if (last && last.date_read === book.date_read) {
      last.books.push(book);
    } else {
      groups.push({ date_read: book.date_read, books: [book] });
    }
  }
  return groups;
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    books: BookInput[];
    themeId: TimelineThemeId;
    connectorStyle: ConnectorStyle;
  };

  const theme = TIMELINE_THEMES.find((t) => t.id === body.themeId) ?? TIMELINE_THEMES[0];
  const groups = groupByDate(body.books ?? []).slice(0, MAX_STOPS);

  if (groups.length === 0) {
    return NextResponse.json({ error: 'No books in this range.' }, { status: 400 });
  }

  const margin = 64;
  const topY = margin + 60;
  const bottomY = EXPORT_HEIGHT - margin;
  const centerX = EXPORT_WIDTH / 2;
  const amplitude = 110;
  const branchLength = 90;
  const rowGap = (bottomY - topY) / (groups.length + 1);

  const points: PathPoint[] = [
    { x: centerX, y: topY },
    ...groups.map((_, i) => ({
      x: centerX + (i % 2 === 0 ? -amplitude : amplitude),
      y: topY + rowGap * (i + 1),
    })),
    { x: centerX, y: bottomY },
  ];

  const pathD = buildConnectorPath(points, body.connectorStyle ?? 'wave');
  const coverW = 84;
  const coverH = 126;

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
        <svg
          width={EXPORT_WIDTH}
          height={EXPORT_HEIGHT}
          viewBox={`0 0 ${EXPORT_WIDTH} ${EXPORT_HEIGHT}`}
          style={{ position: 'absolute', top: 0, left: 0, width: EXPORT_WIDTH, height: EXPORT_HEIGHT }}
        >
          <path d={pathD} stroke={theme.connector} strokeWidth={9} strokeLinecap="round" fill="none" />
          {groups.map((_, i) => {
            const point = points[i + 1];
            const onLeft = i % 2 === 0;
            const endX = onLeft ? point.x - branchLength : point.x + branchLength;
            return (
              <line
                key={i}
                x1={point.x}
                y1={point.y}
                x2={endX}
                y2={point.y}
                stroke={theme.connector}
                strokeWidth={4}
                strokeLinecap="round"
              />
            );
          })}
          <circle cx={centerX} cy={topY} r={17} fill={theme.connector} />
          <circle cx={centerX} cy={bottomY} r={17} fill={theme.connector} />
        </svg>

        {groups.map((group, i) => {
          const point = points[i + 1];
          const onLeft = i % 2 === 0;
          const branchEndX = onLeft ? point.x - branchLength : point.x + branchLength;
          const coverCount = Math.min(group.books.length, MAX_COVERS_PER_STOP);
          const blockWidth = coverCount * coverW + (coverCount - 1) * 10;
          const blockLeft = onLeft ? branchEndX - blockWidth : branchEndX;
          const blockHeight = coverH + 44;

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: point.y - blockHeight / 2,
                left: blockLeft,
                width: blockWidth,
                height: blockHeight,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div style={{ fontSize: 26, fontWeight: 700, color: theme.textColor, display: 'flex' }}>
                {formatDate(group.date_read)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'row', gap: 10 }}>
                {group.books.slice(0, MAX_COVERS_PER_STOP).map((b, j) => (
                  <div
                    key={j}
                    style={{
                      width: coverW,
                      height: coverH,
                      borderRadius: 6,
                      overflow: 'hidden',
                      display: 'flex',
                      boxShadow: '0 6px 14px rgba(0,0,0,0.28)',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={b.cover_url}
                      width={coverW}
                      height={coverH}
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    ),
    { width: EXPORT_WIDTH, height: EXPORT_HEIGHT }
  );
}
