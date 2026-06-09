import type { Metadata } from 'next';
import { Playfair_Display, Geist } from 'next/font/google';

import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import './globals.css';
import { cn } from '@/lib/utils';

const playfairDisplay = Playfair_Display({
  variable: '--font-serif-family',
  subsets: ['latin'],
});

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: {
    default: 'Golden Crumb — Artisan Cookies',
    template: '%s — Golden Crumb',
  },
  description:
    'Freshly baked artisan cookies made for sweet moments, thoughtful gifts, and everyday cravings.',
  openGraph: {
    title: 'Golden Crumb — Artisan Cookies',
    description:
      'Freshly baked artisan cookies made for sweet moments, thoughtful gifts, and everyday cravings.',
    siteName: 'Golden Crumb',
    type: 'website',
    locale: 'en_US',
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
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Bakery',
              name: 'Golden Crumb',
              description:
                'Freshly baked artisan cookies made for sweet moments, thoughtful gifts, and everyday cravings.',
              url: 'https://goldencrumb.com',
              telephone: '(555) 123-4567',
              email: 'hello@goldencrumb.com',
              areaServed: 'San Francisco, CA',
              servesCuisine: 'American',
            }),
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
