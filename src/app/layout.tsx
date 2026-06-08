import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';

import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

const playfairDisplay = Playfair_Display({
  variable: '--font-serif-family',
  subsets: ['latin'],
});

const inter = Inter({
  variable: '--font-sans-family',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Golden Crumb — Artisan Cookies',
  description:
    'Freshly baked artisan cookies made for sweet moments, thoughtful gifts, and everyday cravings.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfairDisplay.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col">
        <ThemeProvider>
          <Navbar />
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
