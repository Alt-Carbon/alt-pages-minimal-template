// One definition of each content file. The build validates content against these,
// so a broken file fails the build with a readable message instead of publishing a
// broken page. scripts/prepare.mjs writes the editor's config from the same shapes.
import { z } from "zod";

const link = z.object({ label: z.string().min(1), url: z.string().min(1) });
const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD");

export const Site = z.object({
  name: z.string().min(1),
  pronunciation: z.string().default(""),
  oneLiner: z.string().min(1),
  intro: z.string().default(""),
  place: z.string().default(""),
  employer: z.string().default(""),
  employerUrl: z.string().default(""),
  photo: z.string().default(""),
  social: z.array(link).default([]),
  goodreads: z.string().default(""),
  owner: z.string().default(""),
  repo: z.string().default(""),
  authWorker: z.string().default(""),
});

export const Now = z.object({
  updated: isoDay,
  groups: z.array(z.object({ heading: z.string().min(1), items: z.array(z.string()) })),
});

export const About = z.object({
  paragraphs: z.array(z.string()),
  contact: z.string().default(""),
  facts: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
  shortBio: z.string().default(""),
  colophon: z.string().default(""),
});

export const Talks = z.object({
  items: z.array(z.object({
    title: z.string().min(1),
    date: isoDay,
    where: z.string().default(""),
    links: z.array(link).default([]),
  })),
});

export const Questions = z.object({
  intro: z.string().default(""),
  items: z.array(z.object({ question: z.string().min(1), answer: z.string().default("") })),
});

export const Reading = z.object({
  intro: z.string().default(""),
  articles: z.array(z.object({
    title: z.string().min(1), by: z.string().default(""), note: z.string().default(""),
    date: isoDay, url: z.string().min(1),
  })).default([]),
  misc: z.array(z.object({
    title: z.string().min(1), by: z.string().default(""), kind: z.string().default(""),
    note: z.string().default(""), url: z.string().min(1),
  })).default([]),
});
