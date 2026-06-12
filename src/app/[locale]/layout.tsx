import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import React from 'react';

const locales = ['en', 'es'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }> | { locale: string };
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  // Resolve params as per Next.js 15+ dynamic api rules
  const resolvedParams = await params;
  const { locale } = resolvedParams;

  // Validate that the incoming locale is supported
  if (!locales.includes(locale)) {
    notFound();
  }

  // Set the request locale for static page rendering
  setRequestLocale(locale);

  // Fetch the translation dictionaries
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <title>NexaSphere</title>
        <meta name="description" content="GL Bajaj Tech Community Platform" />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
