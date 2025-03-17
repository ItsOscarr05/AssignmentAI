import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Providers } from './providers';
import { headers } from 'next/headers';
import { i18n } from '../i18n/settings';

export async function generateMetadata() {
  const headersList = headers();
  const domain = headersList.get('host') || 'localhost:3000';
  
  return {
    metadataBase: new URL(`https://${domain}`),
    title: {
      default: 'AssignmentAI',
      template: '%s | AssignmentAI'
    },
    description: 'Next-generation AI-powered assignment management system',
    openGraph: {
      title: 'AssignmentAI',
      description: 'Next-generation AI-powered assignment management system',
      url: `https://${domain}`,
      siteName: 'AssignmentAI',
      locale: 'en_US',
      type: 'website',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: 'your-google-verification-code',
    },
  };
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export default function RootLayout({
  children,
  params: { lang }
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  return (
    <html lang={lang} suppressHydrationWarning>
      <head />
      <body>
        <Providers>
          {children}
          <Analytics />
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  );
} 