# alt-pages-minimal-template

A small personal website: a sidebar, a handful of pages, an editor at `/admin`, and your Goodreads shelf on the Reading page. Built with Astro, edited with Sveltia CMS, hosted as a Cloudflare Worker. MIT licensed.

## Run it locally

```
npm install
npm run dev        # http://localhost:4321
npm run build      # writes dist/
npm run preview    # serves dist/ the way Cloudflare will, at http://localhost:8787
npm test           # parser, sign-in, update and hello tests, no network
```

`npm run dev` and `npm run build` first run `scripts/prepare.mjs`, which reads the repository name from git, writes the editor's configuration to `public/admin/config.yml`, the Goodreads profile id to `public/reading/config.json`, the Medium and Substack feeds to `public/writing/elsewhere/config.json` and the dashboard address to `public/hello/config.json`. None of these are committed.

In `npm run dev` the editor at `/admin` offers "Work with Local Repository" (Chrome, Edge and other Chromium browsers) and edits the files on your computer; GitHub sign-in is only needed on the published site.

## Deploy

`wrangler.jsonc` describes the Worker: the built pages as static assets, the reading sync script, a KV namespace, a Durable Object and a 12-hour cron. `workers_dev` is set so the free `<name>.<account>.workers.dev` address stays on after the Deploy button. `npm run deploy` builds and deploys to whichever Cloudflare account wrangler is logged into.

## Content

Everything on the site is a file under `content/`. The editor at `/admin` edits these files for you; you can also edit them by hand.

| File | Page |
| --- | --- |
| `content/site.json` | Name, greeting, one-liner, social links, photo, accent colour, Goodreads, Medium and Substack addresses, settings |
| `content/now.json` | Now |
| `content/about.json` | About |
| `content/writing/*.md` | Writing: one Markdown file per piece, footnotes supported |
| `content/writing.json` | Writing: the intro line, and posts from Medium or Substack to leave out |
| `content/reading.json` | Reading: the intro line. Books come from Goodreads |
| `content/research.json` | Research: papers, talks, datasets |

Short text fields accept `*italics*`, `**bold**` and `[links](https://example.com)`. The shapes are defined once in `src/lib/schemas.ts`; the build checks every file against them and fails with a readable message if something is off.

Dates are stored as `YYYY-MM-DD` and shown as `11 Aug 2026`. The page changed most recently gets a dot in the menu, and its date is the site's "Updated" date.

## Search and link previews

Nothing to fill in: the build makes all of it from the content.

- Titles, descriptions (an essay without a blurb gets the opening of its first paragraph), canonical links, Open Graph and Twitter tags, and structured data for search engines.
- A 1200×630 preview card per page under `/og/`, a favicon (a circle of the accent colour) and an Apple touch icon (`src/lib/cards.ts`).
- `/rss.xml` (full text), `/sitemap.xml` and `/robots.txt`.

The site's address isn't known at build time, so these carry `https://__origin__` and the Worker replaces it with the address the visitor used. Set Advanced → Site address in the editor only if previews show the wrong address.

## Reading sync

`src/worker/` is the site's Worker. It reads the public Goodreads shelves named in `content/site.json` (`read` and `currently-reading`) on a schedule, keeps them in KV, and serves them at `/reading/view.json` with covers under `/reading/covers/`. Each run is owned by a Durable Object with its own 12-hour alarm; the first sync and then a weekly one walk every page. With no profile set, the sample shelf in `public/reading/view.json` is served. `GET /reading/status` reports the last run; `POST /reading/sync` asks for one now.

The Reading page draws the shelf in the browser from that JSON, so books change without a rebuild, in the style picked in the editor under Reading → Bookshelf style (one module each in `src/scripts/shelf/`; `shared.ts` loads the data and samples each cover's colour, `list.ts` is the plain list used for print). Until a profile is connected, a sample shelf is shown: a real public profile, regenerated with `npm run sample:shelf`. Everything else is static HTML.

## Posts from Medium and Substack

Set a Medium handle or address and a Substack address in the editor (Writing → Elsewhere), and the Worker reads their public RSS feeds (`medium.com/feed/@handle`, `<name>.substack.com/feed`) every 12 hours, keeps the newest posts in KV, and serves them at `/writing/elsewhere.json` (`src/worker/core/posts.js` parses, `posts-store.js` runs a sync, `posts-object.js` is the Durable Object with the alarm). The Writing page and the home page add those posts to their lists in the browser (`src/scripts/posts.ts`), each with a small chip saying where it lives and a link to the post there. A feed that fails keeps its last good posts. Medium shares its 10 newest stories and Substack its 20 newest posts, so older pieces still need an entry under Writing with "Published elsewhere" set; those get the same chip. Posts to leave out are listed under Writing page → Posts to leave out. With nothing set, the sample posts in `public/writing/elsewhere.json` are served, regenerated with `npm run sample:posts`. `GET /writing/elsewhere/status` reports the last run; `POST /writing/elsewhere/sync` asks for one now.

## Editor sign-in

The editor signs in with GitHub, which needs a small server to turn a login code into a token. That server is the site's own Worker (`src/worker/auth.js`), so signing in depends on nothing run by the company. The first time, open `/auth/setup` on your site and press the button (pressing "Sign in with GitHub" in the editor before then shows the same page). GitHub creates a private GitHub App on your account through its app manifest flow, sends the app's keys back to your Worker, which keeps them in its KV namespace, and then asks you to install the app on this repository. From then on `/admin` signs in through your own site. Only the owner of the repository named in the editor's config can complete setup, and a token is only ever handed to this site's own origin. If sign-in stops working, open `/auth/setup` again and create a new app.

Advanced → Other sign-in service points the editor at a different sign-in server instead, for someone who runs their own. Empty is the normal setting.

## Telling the dashboard where the site lives

Once a day, after answering a page, the Worker sends the company dashboard the site's address, its repository, its owner's GitHub login and which template it was made from (`src/worker/hello.js`: a POST of `{ host, origin, repo, owner, template }` to `<dashboard>/api/hello`, then a `hello:sent` key in KV that expires after a day, or after an hour if the dashboard could not be reached). Nothing about visitors is sent, nothing waits for it, and if the dashboard is down the page is unaffected. The address is Advanced → Company dashboard (`advanced.dashboard` in `content/site.json`), written into `public/hello/config.json` at build time; empty it and the site never reports. A `site.json` without that key at all reports to the company's dashboard.

## Layout

| Path | What |
| --- | --- |
| `src/pages/` | One file per address: `/`, `/now`, `/reading`, `/about`, `/writing`, `/writing/<slug>`, 404, and the generated `/rss.xml`, `/sitemap.xml`, `/robots.txt`, `/favicon.svg`, `/apple-touch-icon.png`, `/og/*.png` |
| `src/layouts/Base.astro` | Head, rail, footer |
| `src/components/` | The rail, the bookshelf, the home page's mini shelf, a writing row, the theme switcher, a dev-only font switch |
| `src/scripts/shelf.ts` | Renders books from `/reading/view.json` in the browser |
| `src/styles/site.css` | The whole stylesheet |
| `src/lib/` | Content schemas, the loader every page uses, accent colours, the preview-card renderer |
| `src/worker/` | The reading sync (Worker entry, sync object, Goodreads feed parser), the posts sync (Medium and Substack) and the address stamping for pages and feeds |
| `src/worker/auth.js`, `src/worker/hello.js` | The editor's sign-in; the daily note to the dashboard |
| `public/admin/` | The editor's entry page; bundle and config are generated |
| `scripts/` | `prepare.mjs` (runs before every build), `update-from-template.mjs` (the weekly update), the sample shelf and posts generators |
| `.github/workflows/update.yml` | The weekly update |
| `test/` | Parser, sync, sign-in, update and hello tests |

## Updates

Once a week, GitHub runs `.github/workflows/update.yml` on your repository, with nothing run by the company involved. `scripts/update-from-template.mjs` fetches the main branch of the template named in `package.json` (`portfolio.templateRepo`) and copies its files over yours, except:

- `content/` (your words and settings) and `public/media/` (your photos and files) are never touched;
- `.github/` is never touched, because GitHub does not let a workflow change workflow files;
- `wrangler.jsonc` becomes the template's, with your Worker's name, your KV namespace id and any routes you added put back; `package.json` and `package-lock.json` keep your package name.

Files the template no longer has are removed, again except those above, so changes made by hand to the site's code are replaced. The workflow then runs `npm ci`, `npm run build` and `npm test`; only if all three pass does it commit "Update from the template (<commit>)" to main, which redeploys the site. If nothing changed, it does nothing. If the build or tests fail, nothing is pushed and the run shows as failed on GitHub's Actions tab; the site stays as it was. Turn updates off in the editor under Site settings → Advanced → Get improvements automatically, or run one now from the Actions tab (Update from the template → Run workflow). `node scripts/update-from-template.mjs --dry-run` lists what an update would change.

The template repository must be public for this to work, as it must for the Deploy button.

## Changing the look

Your own styles go in `content/custom.css`. Every page loads it after the template's styles, and template updates never touch it, so changes there last. `AGENTS.md` lists the colours, fonts and parts you can change, and the rules for coding assistants (Claude Code, Codex, Copilot) working in this repository: above all, that anything outside `content/`, `public/media/` and `.github/` is replaced by the weekly update.
