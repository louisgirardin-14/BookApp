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

const HANDWRITTEN_FONT = 'Caveat';
const POETIC_FONT = 'Playfair Display';

let fontsReady: Promise<void> | null = null;

// The decorative fonts are linked via <link> on the Export page; canvas
// text silently falls back to a default font unless the exact style is
// already loaded at draw time, so this must be awaited first.
function ensureDecorativeFontsLoaded(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  if (!fontsReady) {
    fontsReady = Promise.all([
      document.fonts.load(`700 56px "${HANDWRITTEN_FONT}"`),
      document.fonts.load(`italic 400 24px "${POETIC_FONT}"`),
    ]).then(() => undefined);
  }
  return fontsReady;
}

const POETIC_CAPTIONS = [
  'a few more chapters of you',
  'stories that stayed with me',
  'pages turned, worlds found',
  'quiet hours, good books',
  'between the covers',
  'this season in words',
  'a little softer with every page',
];

function pickCaption() {
  return POETIC_CAPTIONS[Math.floor(Math.random() * POETIC_CAPTIONS.length)];
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

// A tilted, white-bordered "polaroid" card with a soft drop shadow --
// the scrapbook/bookstagram look, in place of a clean rounded rect.
function drawScrapbookCard(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  rotationDeg: number
) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const borderSide = Math.min(14, w * 0.06);
  const borderTop = borderSide;
  const borderBottom = Math.min(36, h * 0.14);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotationDeg * Math.PI) / 180);
  ctx.translate(-cx, -cy);

  ctx.save();
  ctx.shadowColor = 'rgba(30, 20, 15, 0.28)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = '#fffdfb';
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  const imgX = x + borderSide;
  const imgY = y + borderTop;
  const imgW = w - borderSide * 2;
  const imgH = h - borderTop - borderBottom;

  ctx.save();
  ctx.beginPath();
  ctx.rect(imgX, imgY, imgW, imgH);
  ctx.clip();
  const imgRatio = img.width / img.height;
  const boxRatio = imgW / imgH;
  let drawW = imgW;
  let drawH = imgH;
  let dx = imgX;
  let dy = imgY;
  if (imgRatio > boxRatio) {
    drawH = imgH;
    drawW = imgH * imgRatio;
    dx = imgX - (drawW - imgW) / 2;
  } else {
    drawW = imgW;
    drawH = imgW / imgRatio;
    dy = imgY - (drawH - imgH) / 2;
  }
  ctx.drawImage(img, dx, dy, drawW, drawH);
  ctx.restore();

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

// Draws a single horizontal line running the width of the spine row,
// with tick marks + labels dropping from it at each point the month (or
// year, for multi-year ranges) changes -- a real timeline axis linking
// the books together, rather than floating disconnected labels.
function drawTimeline(
  ctx: CanvasRenderingContext2D,
  valid: { book: Book }[],
  margin: number,
  spineW: number,
  rowWidth: number,
  lineY: number,
  theme: ExportTheme
) {
  const dates = valid.map((v) => v.book.date_read);
  const spansMultipleYears = new Set(dates.map(yearKeyOf)).size > 1;

  ctx.strokeStyle = theme.mutedColor;
  ctx.fillStyle = theme.mutedColor;
  ctx.font = '500 18px system-ui, -apple-system, sans-serif';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(margin, lineY);
  ctx.lineTo(margin + rowWidth, lineY);
  ctx.stroke();

  if (!spansMultipleYears && new Set(dates.map(monthKeyOf)).size === 1) {
    // Everything falls in a single month: one centered marker is enough.
    drawTick(ctx, margin + rowWidth / 2, lineY, yearKeyOf(dates[0]));
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
    drawTick(ctx, x, lineY, showLabel ? labelFn(v.book.date_read) : null);
    if (showLabel) lastLabelX = x;
  });
}

export interface RenderExportOptions {
  theme: ExportTheme;
  layout: LayoutId;
  title: string;
  subtitle: string;
  handwrittenTitle?: boolean;
  poeticCaption?: boolean;
  scrapbookPhotos?: boolean;
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

  if (opts.handwrittenTitle || opts.poeticCaption) {
    await ensureDecorativeFontsLoaded();
  }

  ctx.fillStyle = opts.theme.background;
  ctx.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

  const margin = 64;
  const headerHeight = 128;

  ctx.textBaseline = 'top';
  ctx.fillStyle = opts.theme.textColor;
  if (opts.handwrittenTitle) {
    ctx.font = `700 58px "${HANDWRITTEN_FONT}", cursive`;
    ctx.fillText(opts.title, margin, margin - 6);
  } else {
    ctx.font = '700 36px system-ui, -apple-system, sans-serif';
    ctx.fillText(opts.title, margin, margin);
  }

  const titleBottom = opts.handwrittenTitle ? margin + 46 : margin + 44;

  if (opts.poeticCaption) {
    ctx.fillStyle = opts.theme.accentColor;
    ctx.font = `italic 400 22px "${POETIC_FONT}", Georgia, serif`;
    ctx.fillText(pickCaption(), margin, titleBottom);
  } else if (opts.layout !== 'spines') {
    // The spines layout tells its own story through the timeline below --
    // a book count here reads as a cold stat rather than a keepsake.
    ctx.fillStyle = opts.theme.mutedColor;
    ctx.font = '400 22px system-ui, -apple-system, sans-serif';
    ctx.fillText(opts.subtitle, margin, titleBottom);
  }

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
      if (opts.scrapbookPhotos) {
        const rotation = (i % 2 === 0 ? 1 : -1) * (3 + (i % 3) * 1.5);
        drawScrapbookCard(ctx, img!, x, y, cellW, cellH, rotation);
      } else {
        drawCoverFit(ctx, img!, x, y, cellW, cellH, 10);
      }
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
      drawTimeline(ctx, valid, margin, spineW, contentWidth, contentTop + contentHeight, opts.theme);
    }
  }
}
