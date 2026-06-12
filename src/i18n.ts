import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// Supported locales
export const locales = ['en', 'es'];
export const defaultLocale = 'en';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;

  // Validate that the incoming locale is supported
  if (!locales.includes(locale as any)) {
    notFound();
  }

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
