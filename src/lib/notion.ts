// src/lib/notion.ts
import 'server-only';
import { loadNewsFromMD, loadInfoFromMD } from './md';

export type Locale = 'fi' | 'en';

export type NewsItem = {
  id: string;
  title: string;
  slug: string;
  date?: string;
  excerpt?: string;
  coverUrl?: string;
  html?: string; // filled on detail pages
};

export type InfoItem = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverUrl?: string;
  html?: string; // filled on detail pages
};

/* =========================
   CONFIG (single place)
   ========================= */
const HOUR = 60 * 60;
const REVALIDATE_SECS = Number(process.env.CONTENT_REVALIDATE ?? HOUR); // default 1h
const NOTION_VERSION = process.env.NOTION_VERSION ?? '2025-09-03';       // current API
const NEWS_TAG = 'news';
const INFO_TAG = 'info';

const token = process.env.NOTION_TOKEN;

const useNotion =
  process.env.USE_NOTION === 'true' &&
  !!token &&
  (!!process.env.NOTION_NEWS_DS || !!process.env.NOTION_NEWS_DB) &&
  (!!process.env.NOTION_INFO_DS || !!process.env.NOTION_INFO_DB);

/* =========================================
   LOW-LEVEL HTTP (no SDK; proper methods)
   ========================================= */
async function notionPost<T>(
  url: string,
  body: unknown,
  opts: { tag: string; revalidate?: number } = { tag: 'content' }
): Promise<T> {
  if (!token) throw new Error('NOTION_TOKEN missing');
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json'
    },
    next: { revalidate: opts.revalidate ?? REVALIDATE_SECS, tags: [opts.tag] }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Notion POST ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function notionGet<T>(
  url: string,
  opts: { revalidate?: number } = {}
): Promise<T> {
  if (!token) throw new Error('NOTION_TOKEN missing');
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION
    },
    next: { revalidate: opts.revalidate ?? 300 }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Notion GET ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

/* ===================================================
   DATA SOURCE resolution: DB id -> Data Source id
   =================================================== */
const dsCache = new Map<string, string>();

async function resolveDataSourceId(
  dbEnv: string | undefined,
  dsEnv: string | undefined
): Promise<string> {
  if (dsEnv) return dsEnv;
  if (!dbEnv) throw new Error('Neither NOTION_*_DS nor NOTION_*_DB provided');
  if (dsCache.has(dbEnv)) return dsCache.get(dbEnv)!;

  // GET /v1/databases/{database_id}
  const db = await notionGet<any>(`https://api.notion.com/v1/databases/${dbEnv}`);
  const ds = db?.data_sources?.[0]?.id as string | undefined;
  if (!ds) throw new Error(`No data source found for DB ${dbEnv}`);
  dsCache.set(dbEnv, ds);
  return ds;
}

/* ========================
   TYPES for Notion payload
   ======================== */
type NotionRichText = { plain_text?: string; annotations?: any; href?: string }[];
type NotionPage = {
  id: string;
  properties: Record<string, any>;
  cover?: { type: 'external'|'file'; external?: {url:string}; file?: {url:string} };
};

/* =======================
   MAPPING (single place)
   ======================= */
function plain(rt?: NotionRichText): string {
  return (rt ?? []).map(t => t?.plain_text ?? '').join('');
}
function fallbackSlugFromId(id: string) {
  return id.replace(/-/g, '');
}
function getCoverUrl(page: NotionPage): string | undefined {
  const c = page.cover;
  if (c?.type === 'external') return c.external?.url;
  if (c?.type === 'file') return c.file?.url;

  // Fallback to Files property (first file)
  const files = page.properties?.Files?.files as any[] | undefined;
  const f = files?.[0];
  if (!f) return undefined;
  if (f.type === 'external') return f.external.url;
  if (f.type === 'file') return f.file.url;
  return undefined;
}
function mapPage(page: NotionPage, kind: 'news'|'info'): NewsItem | InfoItem {
  const p = page.properties || {};
  const title = plain(p.Title?.title) || '';
  const slug = plain(p.Slug?.rich_text) || fallbackSlugFromId(page.id);
  const excerpt = plain(p.Excerpt?.rich_text) || undefined;
  const coverUrl = getCoverUrl(page);
  const base: any = { id: page.id, title, slug, excerpt, coverUrl };
  if (kind === 'news') base.date = p.Date?.date?.start as string | undefined;
  return base;
}

/* ===========================
   BLOCKS -> minimal HTML
   =========================== */
function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]!));
}
function escapeAttr(s: string) { return escapeHtml(s); }
function rtToHtml(rt: NotionRichText = []) {
  return rt.map(t => {
    let txt = escapeHtml(t.plain_text ?? '');
    const a = t.annotations ?? {};
    if (a.code) txt = `<code>${txt}</code>`;
    if (a.bold) txt = `<strong>${txt}</strong>`;
    if (a.italic) txt = `<em>${txt}</em>`;
    if (a.strikethrough) txt = `<s>${txt}</s>`;
    if (a.underline) txt = `<u>${txt}</u>`;
    if (t.href) txt = `<a href="${escapeAttr(t.href)}" target="_blank" rel="noopener noreferrer">${txt}</a>`;
    return txt;
  }).join('');
}
function firstParagraph(blocks: any[]): string | undefined {
  for (const b of blocks) if (b.type === 'paragraph') {
    const text = (b.paragraph?.rich_text ?? []).map((t:any)=>t.plain_text ?? '').join('').trim();
    if (text) return text;
  }
  return undefined;
}
async function fetchBlocksHtml(pageId: string): Promise<{ html: string; firstPara?: string }> {
  // GET /v1/blocks/{block_id}/children?start_cursor=...
  const blocks: any[] = [];
  let cursor: string | undefined = undefined;

  do {
    const url = new URL(`https://api.notion.com/v1/blocks/${pageId}/children`);
    if (cursor) url.searchParams.set('start_cursor', cursor);

    const res = await notionGet<any>(url.toString(), { revalidate: REVALIDATE_SECS });
    blocks.push(...(res.results ?? []));
    cursor = res.has_more ? res.next_cursor ?? undefined : undefined;
  } while (cursor);

  const parts: string[] = [];
  for (const b of blocks) {
    switch (b.type) {
      case 'paragraph': parts.push(`<p>${rtToHtml(b.paragraph?.rich_text)}</p>`); break;
      case 'heading_1': parts.push(`<h1>${rtToHtml(b.heading_1?.rich_text)}</h1>`); break;
      case 'heading_2': parts.push(`<h2>${rtToHtml(b.heading_2?.rich_text)}</h2>`); break;
      case 'heading_3': parts.push(`<h3>${rtToHtml(b.heading_3?.rich_text)}</h3>`); break;
      case 'bulleted_list_item': parts.push(`<ul><li>${rtToHtml(b.bulleted_list_item?.rich_text)}</li></ul>`); break;
      case 'numbered_list_item': parts.push(`<ol><li>${rtToHtml(b.numbered_list_item?.rich_text)}</li></ol>`); break;
      case 'quote': parts.push(`<blockquote>${rtToHtml(b.quote?.rich_text)}</blockquote>`); break;
      case 'callout': {
        const emoji = b.callout?.icon?.emoji ? `<span>${b.callout.icon.emoji}</span> ` : '';
        parts.push(`<div class="callout">${emoji}${rtToHtml(b.callout?.rich_text)}</div>`);
        break;
      }
      case 'image': {
        const img = b.image;
        const url = img?.type === 'external' ? img.external?.url : img?.file?.url;
        if (url) parts.push(`<p><img src="${escapeAttr(url)}" alt="" /></p>`);
        break;
      }
      case 'divider': parts.push('<hr/>'); break;
      default: /* ignore */ break;
    }
  }

  return { html: parts.join('\n'), firstPara: firstParagraph(blocks) };
}

/* =========================
   QUERY helpers (DRY)
   ========================= */
type SortOpt =
  | { property: string; direction: 'ascending' | 'descending' }
  | { timestamp: 'created_time'|'last_edited_time'; direction: 'ascending'|'descending' };

async function queryList(kind: 'news'|'info', locale: Locale) {
  if (!useNotion) return kind === 'news' ? loadNewsFromMD(locale) : loadInfoFromMD(locale);

  const dsId = await resolveDataSourceId(
    kind === 'news' ? process.env.NOTION_NEWS_DB : process.env.NOTION_INFO_DB,
    kind === 'news' ? process.env.NOTION_NEWS_DS : process.env.NOTION_INFO_DS
  );

  const sorts: SortOpt[] = kind === 'news'
    ? [{ property: 'Date', direction: 'descending' }]
    : [{ timestamp: 'last_edited_time', direction: 'descending' }];

  const payload = {
    filter: {
      and: [
        { property: 'Published', checkbox: { equals: true } },
        { property: 'Locale', select: { equals: locale } }
      ]
    },
    sorts,
    page_size: 30
  };

  // POST /v1/data_sources/{id}/query  (underscore!)
  const data = await notionPost<{ results: NotionPage[] }>(
    `https://api.notion.com/v1/data_sources/${dsId}/query`,
    payload,
    { tag: kind === 'news' ? NEWS_TAG : INFO_TAG }
  );

  return data.results.map(p => mapPage(p, kind)) as (NewsItem[] | InfoItem[]);
}

async function queryOne(kind: 'news'|'info', locale: Locale, slug: string) {
  if (!useNotion) {
    const list = (kind === 'news') ? await loadNewsFromMD(locale) : await loadInfoFromMD(locale);
    return list.find(i => i.slug === slug);
  }

  const dsId = await resolveDataSourceId(
    kind === 'news' ? process.env.NOTION_NEWS_DB : process.env.NOTION_INFO_DB,
    kind === 'news' ? process.env.NOTION_NEWS_DS : process.env.NOTION_INFO_DS
  );

  const payload = {
    filter: {
      and: [
        { property: 'Published', checkbox: { equals: true } },
        { property: 'Locale', select: { equals: locale } },
        { property: 'Slug', rich_text: { equals: slug } }
      ]
    },
    page_size: 1
  };

  const data = await notionPost<{ results: NotionPage[] }>(
    `https://api.notion.com/v1/data_sources/${dsId}/query`,
    payload,
    { tag: kind === 'news' ? NEWS_TAG : INFO_TAG }
  );

  const page = data.results[0];
  if (!page) return undefined;

  const mapped = mapPage(page, kind);
  const { html, firstPara } = await fetchBlocksHtml(page.id);
  return { ...mapped, html, excerpt: mapped.excerpt || firstPara };
}

/* ===================
   PUBLIC API (export)
   =================== */
export async function getNews(locale: Locale) {
  return (await queryList('news', locale)) as NewsItem[];
}
export async function getInfo(locale: Locale) {
  return (await queryList('info', locale)) as InfoItem[];
}
export async function getLatestNewsTitle(locale: Locale) {
  const list = (await queryList('news', locale)) as NewsItem[];
  return list[0]?.title;
}
export async function getNewsBySlug(locale: Locale, slug: string) {
  return (await queryOne('news', locale, slug)) as NewsItem | undefined;
}
export async function getInfoBySlug(locale: Locale, slug: string) {
  return (await queryOne('info', locale, slug)) as InfoItem | undefined;
}
