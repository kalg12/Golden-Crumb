import Link from 'next/link';
import Image from 'next/image';

import { Container } from '@/components/shared/Container';
import { RevealOnScroll } from '@/components/shared/RevealOnScroll';
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
          {featured.map((cookie, i) => (
            <RevealOnScroll key={cookie.id} delay={i * 100}>
              <Card className="group flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/30 to-primary/10">
                <Image
                  src={cookie.image}
                  alt={cookie.name}
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
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
            </RevealOnScroll>
          ))}
        </div>
      </Container>
    </section>
  );
}
