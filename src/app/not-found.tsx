import type { Metadata } from 'next';
import Link from 'next/link';

import { Container } from '@/components/shared/Container';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false },
};

function CrumbSvg() {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto h-24 w-24 text-primary opacity-60"
      aria-hidden="true"
    >
      <circle cx="60" cy="56" r="40" fill="currentColor" />
      <ellipse cx="60" cy="96" rx="28" ry="4" fill="currentColor" opacity="0.15" />
      <circle cx="45" cy="44" r="4" fill="#2B140D" />
      <circle cx="72" cy="40" r="3.5" fill="#2B140D" />
      <circle cx="55" cy="65" r="4.5" fill="#2B140D" />
      <circle cx="78" cy="58" r="3" fill="#2B140D" />
      <circle cx="40" cy="60" r="3.5" fill="#2B140D" />
    </svg>
  );
}

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center py-20">
      <Container>
        <div className="mx-auto max-w-md text-center">
          <CrumbSvg />
          <p className="mt-6 font-serif text-7xl font-bold text-primary sm:text-8xl">
            404
          </p>
          <h1 className="mt-4 font-serif text-2xl font-bold text-foreground">
            This Crumb Got Lost
          </h1>
          <p className="mt-3 text-secondary-foreground">
            The page you&rsquo;re looking for doesn&rsquo;t exist or has been
            moved. Let&rsquo;s get you back on track.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild className="rounded-full px-6">
              <Link href="/">Back to Home</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full px-6">
              <Link href="/menu">View Menu</Link>
            </Button>
            <Button asChild variant="ghost" className="rounded-full px-6">
              <Link href="/order">Place an Order</Link>
            </Button>
          </div>
        </div>
      </Container>
    </main>
  );
}
