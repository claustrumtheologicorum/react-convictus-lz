import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({locale}) => {

  const Locale = (locale === 'fi' || locale === 'en') ? locale : 'fi';

  return {
    locale: Locale,
    messages: (await import(`../messages/${Locale}.json`)).default
  };
});
