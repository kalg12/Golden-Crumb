'use client';

import { useEffect } from 'react';
import Link from 'next/link';

import { Container } from '@/components/shared/Container';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled route error:', error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center py-20">
      <Container>
        <div className="mx-auto max-w-md text-center">
          <p className="font-serif text-8xl font-bold text-primary">Oops</p>
          <h1 className="mt-6 font-serif text-2xl font-bold text-foreground">
            Something Went Wrong
          </h1>
          <p className="mt-3 text-secondary-foreground">
            We hit an unexpected error loading this page. Please try again.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button onClick={reset}>Try Again</Button>
            <Button asChild variant="outline">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </Container>
    </main>
  );
}
