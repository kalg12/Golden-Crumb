import type { Product } from '@/data/products';

import { CookieCard } from '@/components/menu/CookieCard';

interface CookieGridProps {
  products: Product[];
}

export function CookieGrid({ products }: CookieGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <CookieCard key={product.id} product={product} />
      ))}
    </div>
  );
}
