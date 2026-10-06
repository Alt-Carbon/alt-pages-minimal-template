# alt-pages-minimal-template

A small personal website: a sidebar, a handful of pages, an editor at `/admin`, and your Goodreads shelf on the Reading page. Built with Astro, edited with Sveltia CMS, hosted as a Cloudflare Worker. MIT licensed.

## Run it locally

```
npm install
npm run dev        # http://localhost:4321
npm run build      # writes dist/
npm run preview    # serves dist/ the way Cloudflare will, at http://localhost:8787
npm test           # parser tests, no network
```

`npm run dev` and `npm run build` first run `scripts/prepare.mjs`, which reads the repository name from git, writes the editor's configuration to `public/admin/config.yml`, and writes the Goodreads profile id to `public/reading/config.json`. None of these are committed.

## Deploy

`wrangler.jsonc` describes the Worker: the built pages as static assets, the reading sync script, a KV namespace, a Durable Object and a 12-hour cron. `npm run deploy` builds and deploys to whichever Cloudflare account wrangler is logged into.

## Content

Everything on the site is a file under `content/`. The editor at `/admin` edits these files for you; you can also edit them by hand.

| File | Page |
| --- | --- |
| `content/site.json` | Name, one-liner, social links, photo, Goodreads profile, settings |
| `content/now.json` | Now |
| `content/about.json` | About |
| `content/writing/*.md` | Writing: one Markdown file per piece, footnotes supported |
| `content/talks.json` | Talks |
| `content/questions.json` | Questions |
| `content/reading.json` | Reading: articles and misc. Books come from Goodreads |

Short text fields accept `*italics*`, `**bold**` and `[links](https://example.com)`. The shapes are defined once in `src/lib/schemas.ts`; the build checks every file against them and fails with a readable message if something is off.

Dates are stored as `YYYY-MM-DD` and shown as `11 Aug 2026`. The page changed most recently gets a dot in the menu, and its date is the site's "Updated" date.

## Reading sync

`src/worker/` is the site's Worker. It reads the public Goodreads shelves named in `content/site.json` (`read` and `currently-reading`) on a schedule, keeps them in KV, and serves them at `/reading/view.json` with covers under `/reading/covers/`. Each run is owned by a Durable Object with its own 12-hour alarm; the first sync and then a weekly one walk every page. With no profile set, the sample shelf in `public/reading/view.json` is served. `GET /reading/status` reports the last run; `POST /reading/sync` asks for one now.

The Reading page and the home page draw the shelf in the browser from that JSON, so books change without a rebuild. Everything else is static HTML.

## Layout

| Path | What |
| --- | --- |
| `src/pages/` | One file per address: `/`, `/now`, `/reading`, `/about`, `/writing`, `/writing/<slug>`, `/talks`, `/questions`, 404 |
| `src/layouts/Base.astro` | Head, rail, footer |
| `src/components/` | The rail, the bookshelf, the home page's mini shelf |
| `src/scripts/shelf.ts` | Renders books from `/reading/view.json` in the browser |
| `src/styles/site.css` | The whole stylesheet |
| `src/lib/` | Content schemas and the loader every page uses |
| `src/worker/` | The reading sync: Worker entry, the sync object, the Goodreads feed parser |
| `public/admin/` | The editor's entry page; bundle and config are generated |
| `test/` | Parser and sync tests |

## Updates

When this template changes, the Alt Pages dashboard opens a pull request on your repository with the changed files. Your content, settings and the values the Deploy button wrote into your configuration are never part of it. Merge it and your site rebuilds in about a minute; close it to skip that update.
