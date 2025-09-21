import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import {remark} from 'remark';
import html from 'remark-html';

export type MDItem = {
  id: string;
  title: string;
  slug: string;
  date?: string;
  excerpt?: string;
  coverUrl?: string;
  html: string;
};

async function mdToHtml(s: string) {
  const processed = await remark().use(html).process(s);
  return processed.toString();
}

function listFiles(folder: string) {
  return fs.existsSync(folder) ? fs.readdirSync(folder).filter(f => f.endsWith('.md')) : [];
}

export async function loadNewsFromMD(locale: 'fi'|'en'): Promise<MDItem[]> {
  const base = path.join(process.cwd(), 'content', 'news', locale);
  const files = listFiles(base);
  const items: MDItem[] = [];
  for (const f of files) {
    const raw = fs.readFileSync(path.join(base, f), 'utf8');
    const {data, content} = matter(raw);
    items.push({
      id: f,
      title: (data.title as string) ?? f,
      slug: (data.slug as string) ?? f.replace(/\.md$/, ''),
      date: data.date as string | undefined,
      excerpt: data.description as string | undefined,
      coverUrl: data.cover as string | undefined,
      html: await mdToHtml(content)
    });
  }
  return items
    .filter(i => (dataIsPublished(dataFromFile(base, i.slug)) ?? true)) // optional
    .sort((a,b) => (a.date ?? '') < (b.date ?? '') ? 1 : -1);
}
export async function loadInfoFromMD(locale: 'fi'|'en'): Promise<MDItem[]> {
  const base = path.join(process.cwd(), 'content', 'info', locale);
  const files = listFiles(base);
  const items: MDItem[] = [];
  for (const f of files) {
    const raw = fs.readFileSync(path.join(base, f), 'utf8');
    const {data, content} = matter(raw);
    items.push({
      id: f,
      title: (data.title as string) ?? f,
      slug: (data.slug as string) ?? f.replace(/\.md$/, ''),
      excerpt: data.subtitle as string | undefined,
      coverUrl: data.cover as string | undefined,
      html: await mdToHtml(content)
    });
  }
  return items;
}

// small helpers (optional); keep simple, we already filter by hand above
function dataFromFile(base: string, slug: string) {
  const p = path.join(base, `${slug}.md`);
  if (!fs.existsSync(p)) return {};
  const {data} = matter(fs.readFileSync(p,'utf8'));
  return data as Record<string, unknown>;
}
function dataIsPublished(data: Record<string, unknown>) {
  return data?.published !== false;
}
