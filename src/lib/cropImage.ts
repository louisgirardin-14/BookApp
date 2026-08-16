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

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

// Bounding box of an image after rotating it by `rotationDeg` around its center.
function rotatedBoundingBox(width: number, height: number, rotationDeg: number) {
  const rad = toRadians(rotationDeg);
  return {
    width: Math.abs(Math.cos(rad) * width) + Math.abs(Math.sin(rad) * height),
    height: Math.abs(Math.sin(rad) * width) + Math.abs(Math.cos(rad) * height),
  };
}

// Rotates `imageSrc` by `rotationDeg`, crops to `crop` (pixel coordinates in
// the *rotated* image's bounding box -- i.e. exactly what react-easy-crop's
// onCropComplete reports when a rotation is active), and resizes to
// `outputSize`. Returns a data: URL of the result.
export async function getCroppedImageDataUrl(
  imageSrc: string,
  crop: PixelCrop,
  outputSize?: { width: number; height: number },
  rotationDeg = 0
): Promise<string> {
  const image = await createImage(imageSrc);

  const { width: bboxWidth, height: bboxHeight } = rotatedBoundingBox(
    image.width,
    image.height,
    rotationDeg
  );

  const rotatedCanvas = document.createElement('canvas');
  rotatedCanvas.width = bboxWidth;
  rotatedCanvas.height = bboxHeight;
  const rotatedCtx = rotatedCanvas.getContext('2d');
  if (!rotatedCtx) throw new Error('Could not get canvas context');

  rotatedCtx.translate(bboxWidth / 2, bboxHeight / 2);
  rotatedCtx.rotate(toRadians(rotationDeg));
  rotatedCtx.translate(-image.width / 2, -image.height / 2);
  rotatedCtx.drawImage(image, 0, 0);

  const targetWidth = outputSize?.width ?? crop.width;
  const targetHeight = outputSize?.height ?? crop.height;
  const outCanvas = document.createElement('canvas');
  outCanvas.width = targetWidth;
  outCanvas.height = targetHeight;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) throw new Error('Could not get canvas context');

  outCtx.drawImage(
    rotatedCanvas,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  return outCanvas.toDataURL('image/jpeg', 0.92);
}
