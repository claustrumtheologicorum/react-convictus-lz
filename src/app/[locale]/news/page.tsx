import {setRequestLocale} from 'next-intl/server';
import {getNews} from '@/lib/notion';
import SwipeStack from '@/components/SwipeStack';

export const revalidate = 60;

export default async function News({
  params
}: { params: Promise<{locale:'fi'|'en'}> }) {
  const {locale} = await params;
  setRequestLocale(locale);

  const items = await getNews(locale);
  const cards = items.map(p => ({
    key: p.slug,
    title: p.title,
    subtitle: p.date,
    excerpt: p.excerpt,
    coverUrl: p.coverUrl
  }));

  return (
    <main className="pt-4">
      <SwipeStack cards={cards} />
    </main>
  );
}
