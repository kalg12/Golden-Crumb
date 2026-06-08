import Link from 'next/link';

import { Container } from '@/components/shared/Container';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { products } from '@/data/products';

export function FeaturedCookies() {
  const featured = products.filter((p) => p.featured);

  return (
    <section className="py-14 sm:py-20 lg:py-24">
      <Container>
        <SectionHeader
          title="Our Signature Cookies"
          subtitle="Handcrafted with premium ingredients, baked fresh daily."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((cookie) => (
            <Card key={cookie.id} className="group flex flex-col overflow-hidden">
              <div className="aspect-[4/3] flex items-center justify-center bg-gradient-to-br from-primary/30 to-primary/10">
                <span className="font-serif text-5xl text-primary/60">
                  {cookie.name.charAt(0)}
                </span>
              </div>
              <CardContent className="flex flex-1 flex-col p-5">
                <h3 className="font-serif text-xl font-bold text-foreground">
                  {cookie.name}
                </h3>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-secondary-foreground">
                  {cookie.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    ${cookie.price.toFixed(2)}
                  </span>
                  <Button asChild size="sm">
                    <Link href="/order">Order Now</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
