import {setRequestLocale} from 'next-intl/server';
import {getNews} from '@/lib/notion';
import SwipeStack, {SwipeCard} from '@/components/SwipeStack';

export const revalidate = 300;

export default async function News({
  params
}: { params: Promise<{locale:'fi'|'en'}> }) {
  const {locale} = await params;
  setRequestLocale(locale);

  const items = await getNews(locale);
  const cards: SwipeCard[] = items.map(d => ({
  key: d.slug,
  title: d.title,
  excerpt: d.excerpt,
  coverUrl: d.coverUrl,
  href: `/${locale}/info/${d.slug}`
  }));

  return <main className="pt-4"><SwipeStack cards={cards} /></main>;
}

