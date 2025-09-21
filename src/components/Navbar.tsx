'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useTranslations} from 'next-intl';

export default function Navbar() {
  const t = useTranslations();
  const pathname = usePathname();

  function replaceLocale(path: string, next: 'fi'|'en') {
    return path.replace(/^\/(fi|en)/, `/${next}`);
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b">
      <nav className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold">Konvikti</Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/news" className={pathname?.endsWith('/news') ? 'font-semibold' : ''}>{t('nav.news')}</Link>
          <Link href="/info" className={pathname?.endsWith('/info') ? 'font-semibold' : ''}>{t('nav.info')}</Link>
          <div className="ml-2 flex gap-2">
            <Link href={replaceLocale(pathname ?? '/', 'fi')} className={pathname?.startsWith('/fi') ? 'underline' : ''}>FI</Link>
            <span>/</span>
            <Link href={replaceLocale(pathname ?? '/', 'en')} className={pathname?.startsWith('/en') ? 'underline' : ''}>EN</Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
