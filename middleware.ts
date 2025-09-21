// middleware.ts
import createMiddleware from 'next-intl/middleware';
import {locales, defaultLocale} from './src/i18n/routing';

export default createMiddleware({
  locales,
  defaultLocale,
  localeDetection: true
});

export const config = {
  matcher: [
    '/((?!_next|.*\\.(?:png|jpg|jpeg|gif|svg|webp)|favicon.ico|images|admin).*)'
  ]
};
