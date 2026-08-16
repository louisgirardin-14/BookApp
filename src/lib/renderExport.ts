import type { Book } from './types';
import { EXPORT_WIDTH, EXPORT_HEIGHT, type ExportTheme, type LayoutId } from './exportThemes';

function proxied(url: string) {
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawCoverFit(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
  ctx.clip();

  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let drawW = w;
  let drawH = h;
  let dx = x;
  let dy = y;
  if (imgRatio > boxRatio) {
    drawH = h;
    drawW = h * imgRatio;
    dx = x - (drawW - w) / 2;
  } else {
    drawW = w;
    drawH = w / imgRatio;
    dy = y - (drawH - h) / 2;
  }
  ctx.drawImage(img, dx, dy, drawW, drawH);
  ctx.restore();
}

function parseDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00');
}

function yearKeyOf(dateStr: string) {
  return String(parseDate(dateStr).getFullYear());
}

function monthKeyOf(dateStr: string) {
  const d = parseDate(dateStr);
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function monthLabelOf(dateStr: string) {
  return parseDate(dateStr).toLocaleString('en-US', { month: 'short' });
}

function drawTick(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string | null
) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + 16);
  ctx.stroke();
  if (label) {
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y + 22);
    ctx.textAlign = 'left';
  }
}

// Draws tick marks + labels under the spine row at each point the
// month (or year, if the range spans multiple years) changes, so the
// row reads as a chronological timeline rather than an undated stack.
function drawTimeline(
  ctx: CanvasRenderingContext2D,
  valid: { book: Book }[],
  margin: number,
  spineW: number,
  markerBottom: number,
  theme: ExportTheme
) {
  const dates = valid.map((v) => v.book.date_read);
  const spansMultipleYears = new Set(dates.map(yearKeyOf)).size > 1;

  ctx.strokeStyle = theme.mutedColor;
  ctx.fillStyle = theme.mutedColor;
  ctx.font = '500 18px system-ui, -apple-system, sans-serif';
  ctx.lineWidth = 1.5;

  if (!spansMultipleYears && new Set(dates.map(monthKeyOf)).size === 1) {
    // Everything falls in a single month: one centered marker is enough.
    drawTick(ctx, margin + (spineW * valid.length) / 2, markerBottom, yearKeyOf(dates[0]));
    return;
  }

  const keyFn = spansMultipleYears ? yearKeyOf : monthKeyOf;
  const labelFn = spansMultipleYears ? yearKeyOf : monthLabelOf;
  const minLabelGap = 48;

  let lastKey: string | null = null;
  let lastLabelX = -Infinity;

  valid.forEach((v, i) => {
    const key = keyFn(v.book.date_read);
    if (key === lastKey) return;
    lastKey = key;

    const x = margin + i * spineW;
    const showLabel = x - lastLabelX > minLabelGap;
    drawTick(ctx, x, markerBottom, showLabel ? labelFn(v.book.date_read) : null);
    if (showLabel) lastLabelX = x;
  });
}

export interface RenderExportOptions {
  theme: ExportTheme;
  layout: LayoutId;
  title: string;
  subtitle: string;
}

export async function renderExportCanvas(
  canvas: HTMLCanvasElement,
  books: Book[],
  opts: RenderExportOptions
) {
  canvas.width = EXPORT_WIDTH;
  canvas.height = EXPORT_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.fillStyle = opts.theme.background;
  ctx.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

  const margin = 64;
  const headerHeight = 128;

  ctx.textBaseline = 'top';
  ctx.fillStyle = opts.theme.textColor;
  ctx.font = '700 36px system-ui, -apple-system, sans-serif';
  ctx.fillText(opts.title, margin, margin);

  ctx.fillStyle = opts.theme.mutedColor;
  ctx.font = '400 22px system-ui, -apple-system, sans-serif';
  ctx.fillText(opts.subtitle, margin, margin + 52);

  const hasTimeline = opts.layout === 'spines' && books.length > 0;
  const bottomReserve = hasTimeline ? 56 : 0;

  const contentTop = margin + headerHeight;
  const contentHeight = EXPORT_HEIGHT - contentTop - margin - bottomReserve;
  const contentWidth = EXPORT_WIDTH - margin * 2;

  if (books.length === 0) {
    ctx.fillStyle = opts.theme.mutedColor;
    ctx.font = '400 22px system-ui, sans-serif';
    ctx.fillText('No books in this range.', margin, contentTop);
    return;
  }

  // The spines layout prefers a real spine photo over squishing the
  // front cover art, when one has been added for that book.
  const images = await Promise.all(
    books.map((b) => {
      const sourceUrl = opts.layout === 'spines' && b.spine_url ? b.spine_url : b.cover_url;
      return loadImage(proxied(sourceUrl)).catch(() => null);
    })
  );
  const valid = books.map((b, i) => ({ book: b, img: images[i] })).filter((x) => x.img);

  if (valid.length === 0) {
    ctx.fillStyle = opts.theme.mutedColor;
    ctx.font = '400 22px system-ui, sans-serif';
    ctx.fillText('Covers could not be loaded.', margin, contentTop);
    return;
  }

  if (opts.layout === 'grid') {
    const idealCols = Math.ceil(Math.sqrt(valid.length * (contentWidth / contentHeight)));
    const cols = Math.max(2, Math.min(5, idealCols));
    const rows = Math.ceil(valid.length / cols);
    const gap = 20;
    const cellW = (contentWidth - gap * (cols - 1)) / cols;
    const cellH = Math.min((contentHeight - gap * (rows - 1)) / rows, cellW * 1.5);
    const gridHeight = rows * cellH + (rows - 1) * gap;
    const yOffset = contentTop + (contentHeight - gridHeight) / 2;

    valid.forEach(({ img }, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = margin + col * (cellW + gap);
      const y = yOffset + row * (cellH + gap);
      drawCoverFit(ctx, img!, x, y, cellW, cellH, 10);
    });
  } else {
    // Edge-to-edge "spine wall": no gaps, no rounding, full-bleed across the row.
    const spineW = contentWidth / valid.length;
    let x = margin;

    valid.forEach(({ img }) => {
      drawCoverFit(ctx, img!, x, contentTop, spineW, contentHeight, 0);
      x += spineW;
    });

    if (hasTimeline) {
      drawTimeline(ctx, valid, margin, spineW, contentTop + contentHeight, opts.theme);
    }
  }
}
