import type { Product } from '@/data/products';

import { CookieCard } from '@/components/menu/CookieCard';
import { RevealOnScroll } from '@/components/shared/RevealOnScroll';

interface CookieGridProps {
  products: Product[];
}

export function CookieGrid({ products }: CookieGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product, i) => (
        <RevealOnScroll key={product.id} delay={i * 100}>
          <CookieCard product={product} />
        </RevealOnScroll>
      ))}
    </div>
  );
}
