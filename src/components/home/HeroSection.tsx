import Link from 'next/link';

import { Container } from '@/components/shared/Container';
import { Button } from '@/components/ui/button';
import { SITE_TAGLINE, SITE_DESCRIPTION } from '@/lib/constants';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28 lg:py-36">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">
            {SITE_TAGLINE}
          </p>
          <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {SITE_DESCRIPTION}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-secondary-foreground">
            Small-batch cookies baked fresh daily in San Francisco. Perfect for
            everyday treats, thoughtful gifts, and sweet moments.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link href="/menu">View Our Menu</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/order">Place an Order</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
