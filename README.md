# The sidebar template

A personal website you own. One Astro site, edited at `/admin`, hosted as a Cloudflare Worker in your own account, with your Goodreads shelf on the Reading page. Part of The Portfolio Project at Alt Carbon; the template is MIT-licensed, so it stays yours after you leave.

## Get a site

Click the Deploy to Cloudflare button on the company dashboard (or the one below once the repository is public). Cloudflare copies this repository into your GitHub account, sets up builds, and deploys a Worker. Then open `/admin` on your new site and sign in with GitHub.

## Edit

Everything on the site is a file under `content/`:

| File | Page |
| --- | --- |
| `content/site.json` | Name, one-liner, social links, photo, Goodreads profile, settings |
| `content/now.json` | Now |
| `content/about.json` | About |
| `content/writing/*.md` | Writing: one Markdown file per piece, with footnotes |
| `content/talks.json` | Talks |
| `content/questions.json` | Questions |
| `content/reading.json` | Reading: articles and misc. Books come from Goodreads |

The editor at `/admin` is Sveltia CMS and edits these files for you. Short text fields accept `*italics*`, `**bold**` and `[links](https://example.com)`. The shapes are defined once in `src/lib/schemas.ts`; the build checks every file against them and fails with a readable message if something is off.

## Run it locally

```
npm install
npm run dev        # http://localhost:4321
npm run build      # writes dist/
npm run preview    # serves dist/ the way Cloudflare will, at http://localhost:8787
```

`npm run dev` and `npm run build` first run `scripts/prepare.mjs`, which reads the repository name from git, writes the editor's configuration to `public/admin/config.yml` and the owner meta tag's source to `src/generated/`. Neither is committed.

## Layout

| Path | What |
| --- | --- |
| `src/pages/` | One file per address: `/`, `/now`, `/reading`, `/about`, `/writing`, `/writing/<slug>`, `/talks`, `/questions`, 404 |
| `src/layouts/Base.astro` | Head, rail, footer, the meta tags the company dashboard reads |
| `src/components/` | The rail, the bookshelf, the home page's mini shelf |
| `src/scripts/shelf.ts` | Renders books from `/reading/view.json` in the browser |
| `src/styles/site.css` | The whole stylesheet, ported from the reviewed prototype |
| `src/lib/` | Content schemas and the loader every page uses |
| `public/admin/` | The editor's entry page. Bundle and config are generated |
| `public/reading/view.json` | A sample shelf, shown until a Goodreads profile is connected |
| `wrangler.jsonc` | What the Deploy button provisions |

## How the pieces fit

- **Pages are static.** Astro writes plain HTML at build time. There is no server code for the pages.
- **The shelf is live.** The Reading page and the home page fetch `/reading/view.json` and draw the spines in the browser, so books change without a rebuild. The reading sync that writes that file in your own account is the next piece of the template.
- **Dates** are stored as `YYYY-MM-DD` and shown as `11 Aug 2026`. The page changed most recently gets a dot in the menu, and its date is the site's "Updated" date.
- **Owner and version** are meta tags on every page: `portfolio-owner`, `portfolio-repo`, `portfolio-template`. The company dashboard reads them to show your site's status; nothing else depends on them.

## After you leave

Nothing changes. The repository and the Worker are yours. Two optional edits in Site settings: the employer line, and the sign-in service address if the company's sign-in worker stops serving you (deploy your own copy of [sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) with one click, or sign in with a personal access token).
