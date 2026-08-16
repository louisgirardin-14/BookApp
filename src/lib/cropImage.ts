export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

function createImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Crops `imageSrc` (a data: URL or same-origin URL) to `crop` and returns a
// data: URL of the result. Used by the manual crop override.
export async function getCroppedImageDataUrl(
  imageSrc: string,
  crop: PixelCrop,
  outputSize?: { width: number; height: number }
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const targetWidth = outputSize?.width ?? crop.width;
  const targetHeight = outputSize?.height ?? crop.height;
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  return canvas.toDataURL('image/jpeg', 0.92);
}
