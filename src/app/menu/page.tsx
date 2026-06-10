import type { Metadata } from 'next';

import { Container } from '@/components/shared/Container';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { CookieGrid } from '@/components/menu/CookieGrid';
import { products } from '@/data/products';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Menu',
  description:
    'Browse our menu of freshly baked artisan cookies in San Francisco. Classic Chocolate Chip, Double Chocolate, Oatmeal Raisin, and more.',
  openGraph: {
    title: 'Menu — Golden Crumb',
    description:
      'Browse our menu of freshly baked artisan cookies in San Francisco.',
    url: `${SITE_URL}/menu`,
  },
};

const menuSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Golden Crumb Menu',
  description: 'Freshly baked artisan cookies in San Francisco.',
  url: `${SITE_URL}/menu`,
  numberOfItems: products.length,
  itemListElement: products.map((product, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: {
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: `${SITE_URL}${product.image}`,
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    },
  })),
};

export default function MenuPage() {
  return (
    <main className="flex-1 py-14 sm:py-20 lg:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(menuSchema) }}
      />
      <Container>
        <SectionHeader
          as="h1"
          title="Our Menu"
          subtitle="Every cookie is handcrafted with premium ingredients and baked fresh daily in San Francisco."
        />
        <CookieGrid products={products} />
      </Container>
    </main>
  );
}
