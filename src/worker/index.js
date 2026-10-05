// This site's Worker. The pages are static assets, served before this script
// runs; the script owns /reading, where the owner's Goodreads shelves are kept.
// The sync itself runs in the ShelfSync Durable Object (sync-object.js).
//
// GET  /reading/view.json         the shelf, for the Reading page and the home page
// GET  /reading/books.json        every book synced so far
// GET  /reading/status            the object's report: last run, next alarm
// POST /reading/sync              run a sync now (at most one every 30 s)
// GET  /reading/covers/<stamp>/<id>.jpg   a cover, fetched from Goodreads once and kept
// cron                            a nudge every 12 hours; the object's own alarm is the real schedule
//
// Which profile: scripts/prepare.mjs writes the Goodreads id from content/site.json
// to /reading/config.json at build time, so changing it in the editor is an
// ordinary publish. With no profile, the sample shelf in public/ is served.

import { coverSource } from "./core/feed.js";
import { UA } from "./core/sync.js";
import { allBooks } from "./store.js";

export { ShelfSync } from "./sync-object.js";

const BASE = "/reading";
const YEAR = "public, max-age=31536000, immutable";
const SYNC_GAP = 30 * 1000;
const CONFIG_TTL = 60 * 1000;

const json = (body, status = 200, cache = "no-store") =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": cache },
  });

const age = (iso) => (iso ? Date.now() - Date.parse(iso) : Infinity);
const object = (env, userId) => env.SYNC.get(env.SYNC.idFromName(userId));

// The built config, cached per isolate for a minute.
let config = { at: 0, userId: null };
async function profileId(env, request) {
  if (Date.now() - config.at < CONFIG_TTL) return config.userId;
  let userId = null;
  try {
    const res = await env.ASSETS.fetch(new URL(`${BASE}/config.json`, request.url));
    if (res.ok) userId = (await res.json()).userId || null;
  } catch {
    /* no config: no profile */
  }
  config = { at: Date.now(), userId };
  return userId;
}

// Serves an image from KV, fetching it from Goodreads the first time.
async function image(env, ctx, key, source) {
  const kept = await env.BOOKS.getWithMetadata(key, "arrayBuffer");
  if (kept.value) return new Response(kept.value, { headers: { "content-type": kept.metadata?.type || "image/jpeg", "cache-control": YEAR } });
  const res = await fetch(source, { headers: { "user-agent": UA, accept: "image/*" } });
  const type = res.headers.get("content-type") || "";
  if (!res.ok || !type.startsWith("image/")) return new Response("Not found", { status: 404, headers: { "cache-control": "public, max-age=3600" } });
  const bytes = await res.arrayBuffer();
  ctx.waitUntil(env.BOOKS.put(key, bytes, { metadata: { type } }));
  return new Response(bytes, { headers: { "content-type": type, "cache-control": YEAR } });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith(`${BASE}/`)) return env.ASSETS.fetch(request);
    const path = url.pathname.slice(BASE.length).replace(/\/$/, "");

    const cover = /^\/covers\/(\d+[a-z]?\/\d+)\.jpg$/.exec(path);
    if (cover) return image(env, ctx, `img:cover:${cover[1]}`, coverSource(cover[1]));

    const userId = await profileId(env, request);
    // No profile connected: the sample shelf and the other static files under /reading.
    if (!userId) {
      if (path === "/status") return json({ profile: null, syncedAt: null });
      if (path === "/sync") return json({ error: "No Goodreads profile is set. Add one in the editor under Site settings." }, 409);
      return env.ASSETS.fetch(request);
    }
    const stub = object(env, userId);

    if (path === "/sync") {
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: { allow: "POST" } });
      const st = await stub.status();
      const started = !st.running && age(st.lastRun?.at) > SYNC_GAP ? await stub.kick(userId, "sync now", "refresh") : "too soon";
      return json({ started, status: st });
    }
    if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405 });

    if (path === "/status") return json({ profile: userId, ...(await stub.status()) });
    if (path === "/books.json") {
      const st = await stub.status();
      return st.syncedAt ? json(await allBooks(env.BOOKS, userId, st.pages), 200, "public, max-age=300") : json({ error: "Not synced yet" }, 404);
    }
    if (path === "/view.json") {
      const view = (await env.BOOKS.get(`view:${userId}`, "json")) || (await stub.view());
      if (view) return json(view, 200, "public, max-age=300");
      // Nothing yet: start the first sync and say so.
      const st = await stub.status();
      if (!st.running && !st.lastRun) ctx.waitUntil(stub.kick(userId, "first visit", "walk"));
      return json({ userId, syncing: true, syncedAt: null, lastRun: st.lastRun, reading: [], read: [] }, 200, "no-store");
    }
    return env.ASSETS.fetch(request);
  },

  // The object keeps its own alarm. The cron only makes sure a profile that was
  // set while nothing visited the site still gets its first sync.
  async scheduled(event, env) {
    const res = await env.ASSETS.fetch("https://assets.local/reading/config.json").catch(() => null);
    const userId = res?.ok ? (await res.json()).userId : null;
    if (userId) await object(env, userId).kick(userId, `cron ${event.cron}`);
  },
};
