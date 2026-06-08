import Link from 'next/link';

import type { Product } from '@/data/products';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CookieCardProps {
  product: Product;
}

export function CookieCard({ product }: CookieCardProps) {
  return (
    <Card className="group flex flex-col overflow-hidden">
      <div className="aspect-[4/3] flex items-center justify-center bg-gradient-to-br from-primary/30 to-primary/10">
        <span className="font-serif text-5xl text-primary/60">
          {product.name.charAt(0)}
        </span>
      </div>
      <CardContent className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-xl font-bold text-foreground">
          {product.name}
        </h3>
        <p className="mt-1 flex-1 text-sm leading-relaxed text-secondary-foreground">
          {product.description}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {product.allergens?.map((allergen) => (
            <span
              key={allergen}
              className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
            >
              {allergen}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xl font-bold text-primary">
            ${product.price.toFixed(2)}
          </span>
          <Button asChild size="sm">
            <Link href="/order">Order Now</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
