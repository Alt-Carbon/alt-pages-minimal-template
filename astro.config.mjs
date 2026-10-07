import { defineConfig } from "astro/config";

// Static output. Pages are written as /now.html and served at /now by Cloudflare's
// asset handling, so there are no trailing slashes in the addresses.
export default defineConfig({
  output: "static",
  build: { format: "file" },
  trailingSlash: "never",
  compressHTML: true,
  // Code in essays: a light and a dark theme; site.css picks one to match the page theme.
  markdown: { shikiConfig: { themes: { light: "github-light", dark: "github-dark" }, defaultColor: false } },
});
