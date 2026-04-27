const CACHE_VERSION = "v4";
const SHELL_CACHE = `beyond-hangeul-shell-${CACHE_VERSION}`;
const PDF_CACHE = `beyond-hangeul-pdf-${CACHE_VERSION}`;
const OFFLINE_PAGE = "/offline.html";
const STATIC_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/offline.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-icon-512.png",
  "/icons/apple-touch-icon.png",
];

function isNavigationRequest(request) {
  return request.mode === "navigate" || (request.method === "GET" && request.headers.get("accept")?.includes("text/html"));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE && key !== PDF_CACHE)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return caches.match(OFFLINE_PAGE);
  }
}

async function networkFirst(request, { fallbackToOfflinePage = false } = {}) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    if (fallbackToOfflinePage && isNavigationRequest(request)) {
      const offlinePage = await caches.match(OFFLINE_PAGE);
      if (offlinePage) {
        return offlinePage;
      }
    }
    return Response.error();
  }
}

async function pdfHandler(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(PDF_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response("PDF not available offline.", {
      status: 503,
      statusText: "PDF not available offline",
      headers: { "Content-Type": "text/plain" },
    });
  }
}

function isLikelyDownloadRequest(url) {
  return /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|csv|txt|zip)$/i.test(url.pathname);
}

function isStorageFileRequest(url) {
  return url.pathname.includes("/storage/v1/object/");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  const origin = self.location.origin;

  // Do not intercept external domains so file/CDN requests are never blocked.
  if (url.origin !== origin) {
    return;
  }

  if (url.pathname.endsWith(".pdf")) {
    event.respondWith(pdfHandler(request));
    return;
  }

  if (isStorageFileRequest(url) || isLikelyDownloadRequest(url)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (request.destination === "document" || isNavigationRequest(request)) {
    event.respondWith(networkFirst(request, { fallbackToOfflinePage: true }));
    return;
  }

  if (url.origin === origin && url.pathname.startsWith("/_next/")) {
    // Never return offline HTML for JS/CSS chunks.
    event.respondWith(networkFirst(request));
    return;
  }

  if (
    url.origin === origin &&
    (url.pathname.startsWith("/icons/") ||
      url.pathname === "/manifest.webmanifest" ||
      url.pathname === "/offline.html")
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.origin === origin && url.pathname.startsWith("/api/")) {
    return;
  }
});
