import {setRequestLocale} from 'next-intl/server';
import {getInfoBySlug} from '@/lib/notion';
import Image from 'next/image';

export const revalidate = 300;

export default async function InfoDetail({
  params
}: { params: Promise<{locale:'fi'|'en'; slug:string}> }) {
  const {locale, slug} = await params;
  setRequestLocale(locale);

  const page = await getInfoBySlug(locale, slug);
  if (!page) return null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {page.coverUrl && (
        <div className="relative w-full h-60 mb-6 rounded-xl overflow-hidden">
          <Image src={page.coverUrl} alt="" fill className="object-cover" />
        </div>
      )}
      <h1 className="text-3xl font-bold">{page.title}</h1>
      {page.excerpt && <p className="mt-4 text-lg text-gray-700">{page.excerpt}</p>}

      {page.html && (
        <article
          className="prose prose-neutral mt-6"
          dangerouslySetInnerHTML={{__html: page.html}}
        />
      )}
    </main>
  );
}
