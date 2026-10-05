// Loads and validates every content file once per build, and gives the pages
// the few helpers they share.
import { getCollection } from "astro:content";
import siteJson from "../../content/site.json";
import nowJson from "../../content/now.json";
import aboutJson from "../../content/about.json";
import talksJson from "../../content/talks.json";
import questionsJson from "../../content/questions.json";
import readingJson from "../../content/reading.json";
import pkg from "../../package.json";
import { About, Now, Questions, Reading, Site, Talks } from "./schemas";

function load<T>(name: string, schema: { safeParse: (v: unknown) => any }, value: unknown): T {
  const r = schema.safeParse(value);
  if (!r.success) {
    const lines = r.error.issues.map((i: any) => `  ${i.path.join(".") || "(root)"}: ${i.message}`).join("\n");
    throw new Error(`content/${name}.json is not valid:\n${lines}`);
  }
  return r.data as T;
}

export const site = load<ReturnType<typeof Site.parse>>("site", Site, siteJson);
export const now = load<ReturnType<typeof Now.parse>>("now", Now, nowJson);
export const about = load<ReturnType<typeof About.parse>>("about", About, aboutJson);
export const talks = load<ReturnType<typeof Talks.parse>>("talks", Talks, talksJson);
export const questions = load<ReturnType<typeof Questions.parse>>("questions", Questions, questionsJson);
export const reading = load<ReturnType<typeof Reading.parse>>("reading", Reading, readingJson);

export const template = { name: "sidebar", version: pkg.version as string };

// Written by scripts/prepare.mjs before each build: who owns the repository.
let build: { owner: string; repo: string; builtAt: string } = { owner: "", repo: "", builtAt: new Date().toISOString() };
try {
  build = (await import("../generated/build.json")).default as typeof build;
} catch {
  /* dev without prepare: fall back to the settings file */
}
export const owner = build.owner || site.advanced.owner || site.owner;
export const repo = build.repo || site.advanced.repo || site.repo;

// Pages in menu order. The editor cannot reorder these yet.
export const pages = [
  { id: "writing", label: "Writing", href: "/writing" },
  { id: "talks", label: "Talks", href: "/talks" },
  { id: "reading", label: "Reading", href: "/reading" },
  { id: "questions", label: "Questions", href: "/questions" },
  { id: "now", label: "Now", href: "/now" },
  { id: "about", label: "About", href: "/about" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function day(d: string | Date): string {
  const dt = typeof d === "string" ? new Date(d + "T00:00:00Z") : d;
  return `${dt.getUTCDate()} ${MONTHS[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;
}
export function monthYear(d: string): string {
  const dt = new Date(d + "T00:00:00Z");
  return `${MONTHS[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;
}
const iso = (d: Date) => d.toISOString().slice(0, 10);

// Inline Markdown for short strings: *italic*, **bold**, [text](url). Everything else is escaped.
export function inline(s: string): string {
  const esc = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/(^|[^*\w])\*([^*]+)\*(?!\w)/g, "$1<i>$2</i>");
}

export async function writing() {
  const all = await getCollection("writing", (e) => !e.data.draft);
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

// The page changed most recently gets a dot in the menu, and the site's "Updated" date.
export async function freshness() {
  const w = await writing();
  const candidates: [string, string][] = [["now", now.updated]];
  if (w[0]) candidates.push(["writing", iso(w[0].data.date)]);
  if (talks.items[0]) candidates.push(["talks", [...talks.items].sort((a, b) => b.date.localeCompare(a.date))[0].date]);
  if (reading.articles[0]) candidates.push(["reading", [...reading.articles].sort((a, b) => b.date.localeCompare(a.date))[0].date]);
  candidates.sort((a, b) => b[1].localeCompare(a[1]));
  return { page: candidates[0][0], date: candidates[0][1] };
}

export const social = () => site.social.map((l) => `<a href="${l.url}">${l.label}</a>`).join("");
