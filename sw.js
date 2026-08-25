/* ================================================================
   CHECKLISTE - Service Worker
   Skrbi za offline delovanje in namestljivost (PWA).
   Ob spremembi datotek povecaj CACHE_VERSION.
   ================================================================ */

"use strict";

const CACHE_VERSION = "v1";
const SHELL_CACHE   = `checkliste-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `checkliste-runtime-${CACHE_VERSION}`;

/* Datoteke aplikacije - poti so relativne, da deluje tudi na GitHub Pages
   v podmapi (npr. /Checkliste/). */
const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./style.css?v=15",
  "./script.js?v=15",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png"
];

/* ---------- Namestitev: predpomni lupino aplikacije ---------- */
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    // Vsako datoteko dodamo posebej, da ena napaka ne razveljavi vsega.
    await Promise.all(SHELL_ASSETS.map(async (url) => {
      try {
        await cache.add(new Request(url, { cache: "reload" }));
      } catch (err) {
        console.warn("[sw] ni bilo mogoce predpomniti:", url, err);
      }
    }));
    await self.skipWaiting();
  })());
});

/* ---------- Aktivacija: pobrisi stare predpomnilnike ---------- */
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
    );
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }
    await self.clients.claim();
  })());
});

/* ---------- Sporocila iz strani ---------- */
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

/* ---------- Strategije ---------- */

/** Navigacija: najprej omrezje, ob izpadu predpomnjeni index.html. */
async function handleNavigation(event) {
  try {
    const preload = await event.preloadResponse;
    if (preload) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put("./index.html", preload.clone());
      return preload;
    }
    const fresh = await fetch(event.request);
    const cache = await caches.open(SHELL_CACHE);
    cache.put("./index.html", fresh.clone());
    return fresh;
  } catch (err) {
    const cached = (await caches.match("./index.html")) || (await caches.match("./"));
    if (cached) return cached;
    return new Response(
      "<h1>Ni povezave</h1><p>Aplikacija se ni shranjena za offline uporabo.</p>",
      { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

/** Ostalo: najprej predpomnilnik, v ozadju osvezimo. */
async function handleAsset(request) {
  const cached = await caches.match(request, { ignoreSearch: false });
  if (cached) {
    // Tiha osvezitev v ozadju (stale-while-revalidate).
    fetch(request).then(async (res) => {
      if (res && (res.ok || res.type === "opaque")) {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, res.clone());
      }
    }).catch(() => {});
    return cached;
  }

  try {
    const res = await fetch(request);
    if (res && (res.ok || res.type === "opaque")) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, res.clone());
    }
    return res;
  } catch (err) {
    // Zadnji poskus: enak URL brez razlicice v poizvedbi (?v=...).
    const loose = await caches.match(request, { ignoreSearch: true });
    if (loose) return loose;
    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Ne prestrezaj drugih shem (npr. chrome-extension:).
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(event));
    return;
  }

  event.respondWith(handleAsset(request));
});
