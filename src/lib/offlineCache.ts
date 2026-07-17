const IMAGE_CACHE = "firebase-images";
const VIDEO_CACHE = "videos-offline";

async function cacheResponse(cache: Cache, url: string) {
  const cached = await cache.match(url);
  if (cached) return;

  const response = await fetch(url, { cache: "no-store" });
  if (response.ok || response.type === "opaque") {
    await cache.put(url, response);
  }
}

async function cacheUrls(cacheName: string, urls: string[], concurrency: number) {
  if (typeof window === "undefined" || !("caches" in window) || !navigator.onLine) {
    return;
  }

  const uniqueUrls = [...new Set(urls.filter(Boolean))];
  const cache = await caches.open(cacheName);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < uniqueUrls.length) {
      const url = uniqueUrls[nextIndex++];
      await cacheResponse(cache, url).catch(() => undefined);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, uniqueUrls.length) }, worker),
  );
}

export function cacheProductImages(urls: string[]) {
  return cacheUrls(IMAGE_CACHE, urls, 3);
}

export function cacheHomeVideos(urls: string[]) {
  return cacheUrls(VIDEO_CACHE, urls, 1);
}
