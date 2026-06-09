import Link from 'next/link';

import { Container } from '@/components/shared/Container';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center py-20">
      <Container>
        <div className="mx-auto max-w-md text-center">
          <p className="font-serif text-8xl font-bold text-primary">404</p>
          <h1 className="mt-6 font-serif text-2xl font-bold text-foreground">
            Page Not Found
          </h1>
          <p className="mt-3 text-secondary-foreground">
            This page doesn&rsquo;t exist or has been moved.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href="/">Back to Home</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/menu">View Menu</Link>
            </Button>
          </div>
        </div>
      </Container>
    </main>
  );
}
