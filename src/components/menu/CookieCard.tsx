'use client';

import Image from 'next/image';
import { Minus, Plus, ShoppingBag } from 'lucide-react';

import type { Product } from '@/data/products';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/cart/CartProvider';

interface CookieCardProps {
  product: Product;
}

export function CookieCard({ product }: CookieCardProps) {
  const { quantities, addOne, setQuantity } = useCart();
  const qty = quantities[product.id] ?? 0;

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/30 to-primary/10">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-contain p-4"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
      <CardContent className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-xl font-bold text-foreground">
          {product.name}
        </h3>
        <div className="mt-1 flex flex-1 flex-col justify-between gap-2">
          <p className="text-sm leading-relaxed text-secondary-foreground">
            {product.description}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {product.allergens?.map((allergen) => (
              <span
                key={allergen}
                className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
              >
                {allergen}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xl font-bold text-primary">
            ${product.price.toFixed(2)}
          </span>
          {qty === 0 ? (
            <Button size="sm" onClick={() => addOne(product.id)}>
              <ShoppingBag className="size-3.5" /> Add to Cart
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full border bg-background px-1 py-1">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="rounded-full"
                onClick={() => setQuantity(product.id, qty - 1)}
                aria-label={`Decrease ${product.name} quantity`}
              >
                <Minus className="size-3.5" />
              </Button>
              <span className="min-w-5 text-center text-sm font-semibold tabular-nums text-foreground">
                {qty}
              </span>
              <Button
                type="button"
                variant="default"
                size="icon-sm"
                className="rounded-full"
                onClick={() => addOne(product.id)}
                aria-label={`Increase ${product.name} quantity`}
              >
                <Plus className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
