// Lazily loads OpenCV.js (WASM) from a CDN, once per page load.
// Only ever called client-side (from the camera/auto-crop flow).

declare global {
  interface Window {
    cv: any;
  }
}

let loadingPromise: Promise<any> | null = null;

export function loadOpenCV(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('OpenCV.js can only load in the browser'));
  }
  if (window.cv?.Mat) {
    return Promise.resolve(window.cv);
  }
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.9.0/opencv.js';
    script.async = true;
    script.onload = () => {
      const cv = window.cv;
      if (!cv) {
        reject(new Error('OpenCV.js failed to initialize'));
        return;
      }
      if (typeof cv.onRuntimeInitialized === 'function' || !cv.Mat) {
        cv['onRuntimeInitialized'] = () => resolve(cv);
      } else {
        resolve(cv);
      }
    };
    script.onerror = () => reject(new Error('Failed to load OpenCV.js'));
    document.body.appendChild(script);
  });

  return loadingPromise;
}
