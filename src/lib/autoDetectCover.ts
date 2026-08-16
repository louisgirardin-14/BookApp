import { loadOpenCV } from './opencvLoader';

function distance(a: number[], b: number[]) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

// Orders 4 arbitrary points as [top-left, top-right, bottom-right, bottom-left].
function orderCorners(points: number[][]): number[][] {
  const sums = points.map((p) => p[0] + p[1]);
  const diffs = points.map((p) => p[0] - p[1]);
  const tl = points[sums.indexOf(Math.min(...sums))];
  const br = points[sums.indexOf(Math.max(...sums))];
  const tr = points[diffs.indexOf(Math.max(...diffs))];
  const bl = points[diffs.indexOf(Math.min(...diffs))];
  return [tl, tr, br, bl];
}

// Finds the largest rectangular (book-shaped) contour in the image,
// straightens it via a perspective warp, and returns a data URL of the
// result. Returns null if no confident quadrilateral is found, so the
// caller can fall back to manual cropping.
export async function autoDetectAndCropCover(imageSrc: string): Promise<string | null> {
  const cv = await loadOpenCV();

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = imageSrc;
  });

  const src = cv.imread(img);
  const gray = new cv.Mat();
  const blurred = new cv.Mat();
  const edged = new cv.Mat();
  const dilated = new cv.Mat();
  const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    cv.Canny(blurred, edged, 50, 150);
    cv.dilate(edged, dilated, kernel);

    cv.findContours(dilated, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let best: { points: number[][]; area: number } | null = null;
    const imageArea = src.rows * src.cols;

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const peri = cv.arcLength(contour, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(contour, approx, 0.02 * peri, true);

      if (approx.rows === 4) {
        const area = Math.abs(cv.contourArea(approx));
        if (area > imageArea * 0.15 && (!best || area > best.area)) {
          const points: number[][] = [];
          for (let j = 0; j < 4; j++) {
            points.push([approx.data32S[j * 2], approx.data32S[j * 2 + 1]]);
          }
          best = { points, area };
        }
      }
      approx.delete();
      contour.delete();
    }

    if (!best) return null;

    const ordered = orderCorners(best.points);
    const outWidth = Math.round(Math.max(distance(ordered[0], ordered[1]), distance(ordered[3], ordered[2])));
    const outHeight = Math.round(Math.max(distance(ordered[0], ordered[3]), distance(ordered[1], ordered[2])));

    if (outWidth < 40 || outHeight < 40) return null;

    const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, ordered.flat());
    const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0, 0, outWidth - 1, 0, outWidth - 1, outHeight - 1, 0, outHeight - 1,
    ]);
    const M = cv.getPerspectiveTransform(srcTri, dstTri);
    const dst = new cv.Mat();
    cv.warpPerspective(src, dst, M, new cv.Size(outWidth, outHeight));

    const outCanvas = document.createElement('canvas');
    outCanvas.width = outWidth;
    outCanvas.height = outHeight;
    cv.imshow(outCanvas, dst);

    srcTri.delete();
    dstTri.delete();
    M.delete();
    dst.delete();

    return outCanvas.toDataURL('image/jpeg', 0.92);
  } finally {
    src.delete();
    gray.delete();
    blurred.delete();
    edged.delete();
    dilated.delete();
    kernel.delete();
    contours.delete();
    hierarchy.delete();
  }
}
