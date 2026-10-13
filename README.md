# Terminal-Style Blog/CMS

A personal, terminal-inspired blog/CMS. Write Markdown, keep drafts, publish to a
feed, upload images/code/files, and manage it all from an admin panel that looks
like a shell session.

Built with **Next.js (App Router) + TypeScript + Tailwind CSS**. Content lives in
flat JSON files under `./data` — no database, no native modules — so the whole app
is portable to virtually any Node host.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Without `ADMIN_PASSWORD`, the admin area is open for local development. To protect
it, create `.env.local`:

```env
ADMIN_PASSWORD=<a-strong-password>
```

Copy `ADMIN_SECRET` from `.env.example` too and set a long random value for
production.

## Production

```bash
npm run build
npm start
```

Works on any Node server (VPS, Railway, Render, Fly.io, custom container). The code
is also deployable to Vercel/Netlify, but uploaded media and posts are stored on the
local filesystem (`./data`), which is ephemeral on those platforms — use a
persistent volume, or set `DATA_DIR` to a mounted path.

### Environment variables

| Variable         | Default        | Description                                      |
| ---------------- | -------------- | ------------------------------------------------ |
| `ADMIN_PASSWORD` | *(empty)*      | Password for `/admin`. Empty disables the login. |
| `ADMIN_SECRET`   | derived        | HMAC secret that signs session cookies.          |
| `DATA_DIR`       | `./data`       | Where posts, settings and uploads are stored.    |
| `MAX_UPLOAD_MB`  | `25`           | Per-file upload limit.                           |

## Features

- **Feed** — chronological, terminal-styled listing of published posts with search.
- **Posts** — Markdown with GFM (tables, task lists), syntax-highlighted code,
  sanitized HTML, draft posts hidden from the public.
- **Editor** — live preview, toolbar, autosave drafts, keyboard shortcuts
  (`Ctrl+S` save, `Ctrl+Enter` publish), drag & drop / paste image uploads.
- **Media** — upload images, code and documents; embedded automatically as
  Markdown. Served sandboxed from `/media/...`.
- **Admin** — dashboard with search + status filters, publish/unpublish, edit,
  delete, and settings (title, description, author, favicon, accent color).
- **Optional auth** — password gate on `/admin` and write APIs when
  `ADMIN_PASSWORD` is set.

## Project layout

```
app/            Next.js routes (feed, posts, admin, APIs)
components/     UI (editor, markdown, post cards, forms)
lib/            data store, auth, utils, types
data/           runtime storage (gitignored; posts.json, settings.json, uploads/)
```