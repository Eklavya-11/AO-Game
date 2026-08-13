const imageCache = new Map<string, HTMLImageElement>();
const pending = new Map<string, Promise<HTMLImageElement>>();

export function getCachedImage(url: string): HTMLImageElement | null {
  const img = imageCache.get(url);
  if (img?.complete && img.naturalWidth > 0) return img;
  return null;
}

export function preloadImage(url: string): Promise<HTMLImageElement> {
  const cached = getCachedImage(url);
  if (cached) return Promise.resolve(cached);

  const inflight = pending.get(url);
  if (inflight) return inflight;

  const p = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    if (url.startsWith("http://") || url.startsWith("https://")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      pending.delete(url);
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = (e) => {
      pending.delete(url);
      imageCache.delete(url);
      console.warn(`[ImageCache] Error loading image: ${url}`);
      reject(e);
    };
    img.src = url;
  });

  pending.set(url, p);
  return p;
}
