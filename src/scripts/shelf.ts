// Renders the bookshelf from /reading/view.json: the slice the site's own reading
// sync writes (or the sample file shipped in public/ until Goodreads is connected).
// Spine colour and size come from a hash of the title, so a book keeps its look.

type Book = { id: string; title: string; author: string; cover: string | null; rating: number | null;
  readAt: string | null; shelves: string[]; review: string | null; url: string };
type View = { sample?: boolean; syncing?: boolean; syncedAt: string | null; reading: Book[]; read: Book[]; profile?: { url?: string } | null };

const CLOTH: [string, string][] = [["#1f2a36", "#e9e4d8"], ["#b8862b", "#1c1710"], ["#e4ded0", "#2a2723"], ["#27354d", "#ece6d6"],
  ["#6d5a7e", "#f1ecf4"], ["#3b3b38", "#e8e3d6"], ["#1f3b2e", "#e6e0cc"], ["#efe3c8", "#3a2f1e"],
  ["#a23b2a", "#f6e9dc"], ["#d9622b", "#1d120b"], ["#35495e", "#e9eef3"], ["#2f6fa7", "#f2f6fa"],
  ["#4a4a2f", "#ece8d4"], ["#c97b6d", "#2a1512"], ["#9c9481", "#1e1c17"], ["#15222c", "#dfe6ea"],
  ["#4b1d2a", "#f0dfe3"], ["#5d6f5a", "#eef1ea"]];

let table: Uint32Array | null = null;
function crc32(s: string): number {
  if (!table) {
    table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
  }
  const bytes = new TextEncoder().encode(s);
  let crc = 0xffffffff;
  for (const b of bytes) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
const h = (s: string, n: number) => crc32(s) % n;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function spine(title: string, author: string, scale = 1) {
  const [c, t] = CLOTH[h(title, CLOTH.length)];
  const style = `--c:${c};--t:${t};--h:${Math.round((196 + h(title + "h", 54)) * scale)}px;--w:${Math.round((28 + h(author, 16)) * scale)}px`;
  const short = title.split(":")[0];
  const surname = (author.split(" and ")[0].trim().split(" ").pop() || "?")[0];
  return { short, surname, style };
}

const human = (slug: string) => slug.replace(/[-_]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());
const year = (b: Book) => (b.readAt ? b.readAt.slice(0, 4) : null);

// Shelves if the person uses custom Goodreads shelves; otherwise years.
export function group(books: Book[]): [string, Book[]][] {
  const byShelf = books.some((b) => b.shelves?.length);
  const groups = new Map<string, Book[]>();
  for (const b of books) {
    const key = byShelf ? (b.shelves?.[0] ? human(b.shelves[0]) : "Everything else") : year(b) || "Not dated";
    (groups.get(key) || groups.set(key, []).get(key)!).push(b);
  }
  const keys = [...groups.keys()];
  if (!byShelf) keys.sort((a, b) => b.localeCompare(a));
  else keys.sort((a, b) => (a === "Everything else" ? 1 : b === "Everything else" ? -1 : 0));
  return keys.map((k) => [k, groups.get(k)!]);
}

export async function load(): Promise<View | null> {
  try {
    const r = await fetch("/reading/view.json", { headers: { accept: "application/json" } });
    if (!r.ok) return null;
    return (await r.json()) as View;
  } catch {
    return null;
  }
}

export function renderShelves(view: View, root: HTMLElement) {
  const books = [...view.reading, ...view.read];
  let n = 0;
  let html = '<input class="vh" type="radio" name="book" id="b0" checked>';
  for (const [topic, bs] of group(books)) {
    let spines = "";
    for (const b of bs) {
      n++;
      const { short, surname, style } = spine(b.title, b.author);
      const fav = b.rating === 5 ? '<span title="Would press into your hands">■</span>' : "";
      const read = view.reading.includes(b) ? "Reading now" : b.readAt ? `Read ${b.readAt.slice(0, 4)}` : "Not dated";
      const cover = b.cover ? `<img src="${esc(b.cover)}" alt="" loading="lazy">` : '<span class="o"></span>';
      spines += `<div class="bk" style="${style}"><input class="vh" type="radio" name="book" id="b${n}">`
        + `<label for="b${n}"><span class="sp"><b>${esc(short)}</b><i>${esc(surname)}</i></span>`
        + `<span class="cv v${h(b.title, 3)}${b.cover ? " has-img" : ""}" aria-hidden="true">${cover}<small>${esc(topic)}</small><strong>${esc(short)}</strong><em>${esc(b.author)}</em></span></label>`
        + `<div class="cap"><span class="no">${String(n).padStart(2, "0")}</span><a class="ti" href="${esc(b.url)}">${esc(b.title)}</a>`
        + `<span>${esc(b.author)}</span><span>${read}</span>${fav}<label for="b0">Put back</label>`
        + (b.review ? `<span class="nt">${esc(b.review)}</span>` : "") + "</div></div>";
    }
    html += `<h2>${esc(topic)}</h2><div class="shelf-wrap"><div class="shelf">${spines}</div></div>`;
  }
  html += '<ul class="rows plist">' + books.map((b) => `<li><span>${esc(b.title)}<span class="n">${esc(b.author)}</span></span><span class="r">${year(b) || ""}</span></li>`).join("") + "</ul>";
  root.innerHTML = html;
  return n;
}

export function renderMini(view: View, root: HTMLElement) {
  const latest = [...view.reading, ...view.read.filter((b) => b.readAt).sort((a, b) => (b.readAt || "").localeCompare(a.readAt || ""))].slice(0, 7);
  root.innerHTML = latest.map((b) => {
    const { short, style } = spine(b.title, b.author, 0.72);
    return `<span style="${style}">${esc(short)}</span>`;
  }).join("");
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function dayOf(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
