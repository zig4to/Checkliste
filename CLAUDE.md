# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Nam Puzabu" (repo name: Checkliste) — a vanilla JS/CSS/HTML PWA for offline-capable checklists (hiking, splitboarding, SUP, etc.), in Slovenian. No framework, no bundler, no `package.json`. Backed by Supabase for auth, sync, and sharing.

## Commands

There is no build step, package manager, linter, or test suite — this is plain static HTML/CSS/JS served as-is.

**Running locally:** the service worker and PWA behavior require the app be served over `http://`, not opened via `file://`. Use any static file server, e.g.:
```
npx serve .          # or
python -m http.server 8000
```
No `npm install` is needed or possible (no `package.json`).

**Sanity-checking JS changes:** `node --check script.js` catches syntax errors quickly without a browser.

## Critical workflow: cache-busting on every edit

The app is a PWA (`sw.js`) that precaches `script.js`/`style.css` by their exact `?v=N` query string into a versioned Cache Storage bucket (`CACHE_VERSION`). Its `handleAsset` strategy is cache-first, so **editing `script.js`, `style.css`, or `index.html` alone is not enough for a browser that already has the PWA installed/cached to see the change** — it keeps serving the old cached assets indefinitely.

After ANY edit to `script.js`, `style.css`, or `index.html`, bump in lockstep:
- `index.html`: `<link rel="stylesheet" href="style.css?vN">` and `<script src="script.js?vN">`
- `sw.js`: the `CACHE_VERSION` constant, and the matching `?v=` numbers for `./style.css` and `./script.js` in the `SHELL_ASSETS` array

A browser with the old service worker installed typically needs **two reloads** to pick up a change (one to activate the new worker, one to load the freshly cached assets).

## Architecture

### Files
Single-page app: `index.html` (markup + inline pre-paint script for SSO), `style.css`, `script.js` (all logic, ~2700 lines), `config.js` (Supabase URL + public anon key — safe to expose, protected by RLS), `sw.js` (service worker), `manifest.webmanifest`, `SUPABASE-SETUP.md` (the SQL/RLS setup a fresh Supabase project needs — keep this in sync whenever the DB schema changes).

`script.js` is organized into banner-commented sections (search for `/* ====`): data/state, modal helpers, render, checklist/category/item actions, search, import/export, theme, OCR scan (see below), event bindings (`bindTopbar`, called once from `bootApp`), PWA install prompt, **Supabase auth/sync** (the largest section — auth, personal sync, sharing, group checklists, realtime, preview), and boot (`init()` → `document.addEventListener("DOMContentLoaded", ...)`).

### Data model
A `store` is `{ activeId, checklists: [{ id, name, categories: [{ id, name, collapsed, items: [{ id, text, done }] }] }] }`. `getActive()` returns either the live preview checklist or the user's own active one (`ownActive()`). Local persistence key is per-user: `` `checkliste.v1.${userId}` `` (see `userStoreKey()`).

### Supabase sync model
Three tables (schemas + RLS policies documented in `SUPABASE-SETUP.md`):
- **`user_checklists`** — one row per user (`data` jsonb = the whole `store`). Personal sync: edits call `save()` → `persistLocal()` (sync, localStorage) + `Auth.queuePush()` (debounced ~1.5s push to Supabase).
- **`shared_checklists`** — one row per user who is sharing (`checklists` jsonb array, snapshot-based). `mySharedIds` tracks the user's own shared checklist IDs; `queueSharedResync()`/`resyncShared()` keep the shared snapshot in sync with local edits (same debounce pattern as personal sync).
- **`group_checklists`** — one row **per checklist** (`id` = the checklist's own local id, so the row is addressable/joinable). Unlike sharing, this is meant to be live and multi-writer: `markActiveAsGroup()` marks the active checklist as group; `myGroupIds` tracks which local checklists are group-linked; `queueGroupResync()`/`resyncGroup()` push edits (same debounce). A DB trigger (`group_checklists_keep_creator`) pins `created_by`/`email` to the original creator even though the RLS update policy allows any authenticated user to write, so multiple people can co-edit one group checklist without stealing attribution.

`cleanChecklistForShare()` strips `done`/`collapsed` before anything is pushed to `shared_checklists` or `group_checklists` — personal check/collapse state is never synced between users, only structure (category/item names).

**Group checklist freshness has two independent mechanisms** — don't assume one covers the other:
1. **Realtime** (`updateGroupRealtimeSubscription`, called from `renderSelect()` on every render): subscribes to `postgres_changes` UPDATE for the currently *active* checklist only, if it's group-linked. Only catches edits that happen while this client is actively subscribed.
2. **Catch-up pull** (`refreshAllMyGroupChecklists()` on boot/login, `refreshGroupChecklist(id)` when switching to a checklist in the picker): explicitly re-fetches from `group_checklists` and merges. Needed because realtime never retroactively delivers changes made while the client was closed/on a different checklist — this was a real bug found via user testing (group edits appeared to "not save" because nothing ever pulled fresh state on load).

Both mechanisms funnel through `applyRemoteGroupUpdate(row)`, which merges incoming structure while preserving each category/item's local `done`/`collapsed` by id.

`resolveUserStore()` (called once at boot) compares the local timestamp against the remote `user_checklists` timestamp and keeps whichever is newer, then re-queues a push if local won — this guards against a refresh happening before a debounced push completed (data loss).

### Preview vs. group-open
Opening someone else's **shared** checklist (`openPreview()`) is read-only — sets the module-level `preview` variable, shows a "Shrani checklisto" bar to copy it into your own list, and `save()` no-ops while `preview` is set. Opening a **group** checklist (`openGroupChecklist()`) is different: it's copied directly into the user's own `store.checklists` (same `id` as the group row) and immediately becomes fully editable, no preview step — that's how live co-editing works.

### Auth / SSO
Supabase email+password auth (see `authGate`/`Auth.start()`). Also supports SSO handoff from an external "TomsStudios" hub: a URL hash of `#sb_at=<access_token>&sb_rt=<refresh_token>` is exchanged for a session (`Auth._trySsoLogin()`); `index.html` has an inline pre-paint `<script>` that shows a loader (`.sso-pending`) before this resolves, to avoid a login-form flash.

### Other notes
- Theme (light/dark) is stored per-device (`localStorage`), not synced to the account.
- The OCR scan-from-image feature (Tesseract.js, `startScan()`/`confirmScan()`, the `#scanOverlay` modal) still exists in the code but its toolbar button was intentionally removed — it's dead code kept for easy re-enabling, not a bug.
- `own(fn)` (defined inline in `bindTopbar`) wraps handlers that operate on the user's own checklists, forcing an exit from preview mode first.
