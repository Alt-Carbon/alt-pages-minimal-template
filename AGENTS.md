# AGENTS.md

This repository is one person's website, made from the Alt Pages **Minimal** template: plain text, a rail of pages on the left, a bookshelf on the Reading page. It is an Astro site served by a Cloudflare Worker, and Cloudflare builds and publishes it about two minutes after anything is pushed to `main`.

The owner is probably not a developer. Explain what you are about to change in plain words, change one thing at a time, show them the result, and ask before anything on the "ask first" list below.

## The rule that matters most: updates replace the code

Once a week (and whenever the owner presses Site updates → Update now in the editor), the site's Worker copies the latest version of the template into this repository as one commit. That replaces every file **except**:

- `content/`: the words, settings and the owner's own styles
- `public/media/`: photos and files
- `.github/`

(`wrangler.jsonc`, `package.json` and `package-lock.json` are merged, so the site keeps its own name and storage.)

So a change anywhere else, such as `src/`, `public/` or `scripts/`, is undone at the next update.

## Where each kind of change goes

| The owner wants | Change | Survives updates |
|---|---|---|
| Colours, fonts, sizes, spacing, hiding something | `content/custom.css` | Yes |
| Words, links, photos | `content/*.json`, `content/writing/*.md`, or the editor at `/admin` | Yes |
| Hiding a page | its `"show": false` (`content/about.json`, `writing.json`, `research.json`, `reading.json`, `now.json`), or the page's switch in the editor | Yes |
| A new page (Projects, Talks…) | a Markdown file in `content/pages/` (`title`, optional `show`, `photo`, `description`, then the text), or Your pages in the editor | Yes |
| A setting the template already has (accent colour, …) | `content/site.json`, or the editor | Yes |
| Which page a field is edited on, in the editor | `site_pages` in `scripts/prepare.mjs` | **No** (template code) |
| A different layout or new behaviour | `src/` | **No**, see below |

If what they ask for needs `src/`, tell them, before you change anything, that the weekly update will undo it. Their choice is to keep updates (and lose the change), or turn updates off and keep the change: `"advanced": { "autoUpdate": false }` in `content/site.json`, or Site settings → Advanced → "Get improvements automatically" in the editor. Updates off means no more fixes from the template. Never turn them off without asking.

## content/custom.css

Every page loads it after the template's own styles (it is the first thing in `<body>`), so a rule here wins over the template's rule with the same selector. Prefer changing the variables below over rewriting the template's rules: it is shorter, and it keeps working when the template changes. Keep the file small and add a short comment above each change, so the owner can read it. Emptying the file brings back the template's look.

Example:

```css
/* Pale green page with green links (light and dark) */
:root { --bg: light-dark(#eef3ee, #12261b); --accent-light: #1f7a4d; --accent-dark: #4fc28a; }
```

## Minimal: what you can change

Files: `src/layouts/Base.astro` (every page), `src/styles/site.css` (most styles), `src/styles/shelf/` (the Reading page's shelves), `src/components/` (`Rail.astro` is the left menu), `src/pages/`.

### Colours

Visitors can switch between light and dark (the buttons at the bottom of the rail), so colours are written as `light-dark(<light>, <dark>)`. Keep both values when you change one.

| Variable | What it colours |
|---|---|
| `--bg` | the page |
| `--ink` | text |
| `--mute` | secondary text: dates, captions |
| `--rule` | lines and borders |
| `--rail` | the left menu's background |
| `--panel`, `--raised` | cards and raised surfaces |
| `--accent` | links, the selected menu item, focus rings. Comes from Site settings → Accent colour; override `--accent-light` and `--accent-dark` to choose your own |
| `--grain` | the faint paper texture; `--grain: none` removes it (Site settings → Background grain does the same) |

### Type

`--font-display` (the name and headings; a serif), `--font-text` (what you read), `--font-ui` (menu, tabs, buttons). Sizes: `--fs-xs` 12px … `--fs-base` 16px … `--fs-3xl` (the big headings). `--rail-w` is the left menu's width.

### Parts of the page

`.rail` the left menu · `.home` the home page · `.essay` a piece of writing · `.rows` lists of recent things · `.xp` Experience on About · `.pubs` Research · `.booklist` and the shelf styles for Reading · `.photo` the photo

## The editor's marks: data-field

The editor at `/admin` shows the site beside its form. Hovering a field outlines the part of the page that shows it, and clicking a part of the page opens its field. It finds them by a `data-field` attribute on the element that shows the value:

- `data-field="site.greeting"`: a field of a content file, as `<file's name in the editor config>.<field>` (`site`, `about`, `now`, `research`, `reading`, `writing_page`).
- `data-field="writing:<slug>"`: one piece of writing (a row, a card); `data-field="writing:<slug>.title"` its title. Your pages use `pages:<slug>`.

When you change markup in `src/`, keep these attributes on the element that shows the value. An element whose only content is the value's text (no child elements) also shows what the owner types, live. Missing marks break nothing; that part just doesn't light up.

## Ask first, or leave alone

- `wrangler.jsonc`: the Worker's name, storage ids and routes. Changing them breaks the site or loses the owner's data.
- `src/worker/`: sign-in for the editor, the reading and posts sync, the weekly update.
- `public/admin/` (the editor) and `scripts/prepare.mjs` (writes the editor's settings at build time).
- Never commit passwords, tokens or keys.

## Check your work

```sh
npm ci
npm run build   # runs scripts/prepare.mjs first; must succeed, or Cloudflare won't publish
npm test
npm run dev     # look at it; it prints the address
```

The shape of every content file is in `src/content.config.ts`. A build that fails on Cloudflare leaves the live site as it was, but tell the owner.

## Publishing

Pushing to `main` publishes. For anything bigger than a small style change, work on a branch, show the owner screenshots from `npm run dev`, and merge when they are happy. If Cloudflare is set to build other branches, it also gives each branch its own preview address.
