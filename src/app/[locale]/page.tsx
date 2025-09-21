import {setRequestLocale} from 'next-intl/server';
import Navbar from '@/components/Navbar';
import HeroWithCards from '@/components/HeroWithCards';
import {getLatestNewsTitle} from '@/lib/notion';

export const revalidate = 60;

export default async function Home({
  params
}: { params: Promise<{locale:'fi'|'en'}> }) {
  const {locale} = await params;
  setRequestLocale(locale);

  const latest = await getLatestNewsTitle(locale);

  return (
    <main>
      <HeroWithCards
        heroSrc="/images/hero1.jpg"
        heroAlt="Konvikti"
        latestNewsTitle={latest}
        newsHref={`/${locale}/news`}
        infoHref={`/${locale}/info`}
      />
    </main>
  );
}
