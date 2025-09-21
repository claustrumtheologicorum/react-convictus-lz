// src/i18n/routing.ts
export const locales = ['fi', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'fi';
