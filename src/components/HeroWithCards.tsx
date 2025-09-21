'use client';
import Image from 'next/image';
import Link from 'next/link';
import {useTranslations} from 'next-intl';

export default function HeroWithCards({
  heroSrc,
  heroAlt,
  latestNewsTitle,
  newsHref,
  infoHref
}: {
  heroSrc: string;
  heroAlt: string;
  latestNewsTitle?: string;
  newsHref: string;
  infoHref: string;
}) {
  const t = useTranslations();
  const tagline = t.rich('site.tagline', {strong: (c) => <strong>{c}</strong>});

  return (
    <section className="mx-auto max-w-5xl px-4 pt-6">
      <div className="grid grid-cols-1 md:grid-cols-3 md:gap-6 items-stretch">
        {/* Hero image */}
        <div className="relative h-64 md:h-[480px] md:col-span-2 rounded-2xl overflow-hidden">
          <Image src={heroSrc} alt={heroAlt} fill sizes="(max-width:768px) 100vw, 66vw" priority className="object-cover" />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-4 left-4 text-white drop-shadow">
            <h1 className="text-2xl md:text-4xl font-bold">{t('site.title')}</h1>
            <p className="text-sm md:text-base opacity-90">{tagline}</p>
          </div>
        </div>

        {/* Right stack of 2 cards */}
        <div className="mt-4 md:mt-0 flex flex-col gap-4">
          {/* Top card: latest News */}
          <Link href={newsHref} className="block group border rounded-2xl p-4 shadow-sm hover:shadow-md transition">
            <div className="text-xs uppercase tracking-wide text-gray-500">{t('home.cards.news.label')}</div>
            <h3 className="mt-1 text-lg md:text-xl font-semibold group-hover:underline">
              {latestNewsTitle ?? t('home.cards.news.fallback')}
            </h3>
            <p className="mt-2 text-sm text-blue-600">{t('home.cards.news.cta')}</p>
          </Link>
          {/* Bottom card: Info */}
          <Link href={infoHref} className="block group border rounded-2xl p-4 shadow-sm hover:shadow-md transition">
            <div className="text-xs uppercase tracking-wide text-gray-500">{t('home.cards.info.label')}</div>
            <h3 className="mt-1 text-lg md:text-xl font-semibold group-hover:underline">
              {t('home.cards.info.title')}
            </h3>
            <p className="mt-2 text-sm text-blue-600">{t('home.cards.info.cta')}</p>
          </Link>
        </div>
      </div>
    </section>
  );
}
