import type { Metadata } from 'next';

import { Container } from '@/components/shared/Container';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { Card, CardContent } from '@/components/ui/card';
import { ALLERGEN_NOTICE, CONTACT } from '@/lib/constants';
import { products } from '@/data/products';

export const metadata: Metadata = {
  title: 'Allergen Information — Golden Crumb',
  description: 'Detailed allergen information for all our artisan cookies.',
};

export default function AllergensPage() {
  return (
    <main className="flex-1 py-14 sm:py-20 lg:py-24">
      <Container>
        <SectionHeader
          as="h1"
          title="Allergen Information"
          subtitle="We believe in transparency. Here is everything you need to know about allergens in our cookies."
        />
        <div className="mx-auto max-w-3xl">
          <Card className="mb-8">
            <CardContent className="p-6 sm:p-8">
              <h3 className="font-serif text-lg font-bold text-foreground">
                General Notice
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-secondary-foreground">
                {ALLERGEN_NOTICE}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-secondary-foreground">
                Our kitchen handles milk, eggs, wheat, soy, peanuts, and tree
                nuts. While we take precautions, cross-contamination is
                possible. If you have severe allergies, please contact us before
                ordering.
              </p>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            {products.map((product) => (
              <Card key={product.id}>
                <CardContent className="flex items-center justify-between p-5 sm:p-6">
                  <div>
                    <h4 className="font-serif text-base font-bold text-foreground">
                      {product.name}
                    </h4>
                    <p className="mt-1 text-sm text-secondary-foreground">
                      {product.description}
                    </p>
                  </div>
                  <div className="ml-4 flex shrink-0 flex-wrap gap-1.5">
                    {product.allergens?.map((allergen) => (
                      <span
                        key={allergen}
                        className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      >
                        {allergen}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-10 rounded-xl bg-primary/10 p-6 text-center sm:p-8">
            <h3 className="font-serif text-lg font-bold text-foreground">
              Have Questions?
            </h3>
            <p className="mt-2 text-sm text-secondary-foreground">
              Contact us at{' '}
              <a
                href={`mailto:${CONTACT.email}`}
                className="font-medium text-primary transition-colors hover:text-primary/80"
              >
                {CONTACT.email}
              </a>{' '}
              and we&rsquo;ll be happy to help.
            </p>
          </div>
        </div>
      </Container>
    </main>
  );
}
