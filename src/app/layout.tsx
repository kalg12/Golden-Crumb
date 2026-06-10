import type { Metadata } from 'next';
import { Playfair_Display, Geist } from 'next/font/google';

import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import './globals.css';
import { cn } from '@/lib/utils';
import { SITE_URL, SOCIAL, CONTACT } from '@/lib/constants';

const playfairDisplay = Playfair_Display({
  variable: '--font-serif-family',
  subsets: ['latin'],
});

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Golden Crumb | Artisan Cookies in San Francisco',
    template: '%s | Golden Crumb',
  },
  description:
    'Freshly baked artisan cookies in San Francisco. Order small-batch cookies for gifts, events, everyday treats, and sweet moments.',
  keywords: [
    'artisan cookies',
    'San Francisco cookies',
    'fresh baked cookies',
    'cookie gifts',
    'Golden Crumb',
    'small batch cookies',
    'cookie delivery San Francisco',
  ],
  openGraph: {
    title: 'Golden Crumb | Artisan Cookies in San Francisco',
    description:
      'Freshly baked artisan cookies in San Francisco. Order small-batch cookies for gifts, events, everyday treats, and sweet moments.',
    siteName: 'Golden Crumb',
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Golden Crumb | Artisan Cookies in San Francisco',
    description:
      'Freshly baked artisan cookies in San Francisco. Order small-batch cookies for gifts, events, everyday treats, and sweet moments.',
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
};

const themeScript = `
  (function() {
    var theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(playfairDisplay.variable, "font-sans", geist.variable)}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'Bakery',
                name: 'Golden Crumb',
                description:
                  'Freshly baked artisan cookies in San Francisco. Small-batch cookies for gifts, events, everyday treats, and sweet moments.',
                url: SITE_URL,
                telephone: CONTACT.phone,
                email: CONTACT.email,
                areaServed: 'San Francisco, CA',
                servesCuisine: 'American',
                address: {
                  '@type': 'PostalAddress',
                  addressLocality: 'San Francisco',
                  addressRegion: 'CA',
                  addressCountry: 'US',
                },
                sameAs: [SOCIAL.instagram, SOCIAL.whatsapp],
                logo: `${SITE_URL}/images/logos/GoldeCrumb-dark.png`,
              },
              {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'Golden Crumb',
                url: SITE_URL,
                description:
                  'Freshly baked artisan cookies in San Francisco.',
              },
            ]),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <ThemeProvider>
          <Navbar />
          {children}
          <Footer />
          <ScrollToTop />
        </ThemeProvider>
      </body>
    </html>
  );
}
