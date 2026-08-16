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

export async function renderExportCanvas(
  canvas: HTMLCanvasElement,
  books: Book[],
  opts: { theme: ExportTheme; layout: LayoutId; statLabel: string }
) {
  canvas.width = EXPORT_WIDTH;
  canvas.height = EXPORT_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.fillStyle = opts.theme.background;
  ctx.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

  const margin = 64;
  const headerHeight = 150;

  ctx.fillStyle = opts.theme.textColor;
  ctx.font = '600 30px system-ui, -apple-system, sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText(opts.statLabel.toUpperCase(), margin, margin);

  ctx.fillStyle = opts.theme.accentColor;
  ctx.fillRect(margin, margin + 48, 72, 6);

  const contentTop = margin + headerHeight;
  const contentHeight = EXPORT_HEIGHT - contentTop - margin;
  const contentWidth = EXPORT_WIDTH - margin * 2;

  if (books.length === 0) {
    ctx.font = '400 22px system-ui, sans-serif';
    ctx.fillText('No books in this range.', margin, contentTop);
    return;
  }

  const images = await Promise.all(
    books.map((b) => loadImage(proxied(b.cover_url)).catch(() => null))
  );
  const valid = books.map((b, i) => ({ book: b, img: images[i] })).filter((x) => x.img);

  if (valid.length === 0) {
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
    const gap = 4;
    const minSpineW = 12;
    const spineW = Math.max(minSpineW, (contentWidth - gap * (valid.length - 1)) / valid.length);
    const usedWidth = Math.min(contentWidth, spineW * valid.length + gap * (valid.length - 1));
    let x = margin + (contentWidth - usedWidth) / 2;

    valid.forEach(({ img }) => {
      drawCoverFit(ctx, img!, x, contentTop, spineW, contentHeight, 4);
      x += spineW + gap;
    });
  }
}
