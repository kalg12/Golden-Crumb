import type { Metadata } from 'next';

import { Container } from '@/components/shared/Container';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { OrderForm } from './OrderForm';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Order',
  description:
    'Place an order for freshly baked artisan cookies in San Francisco. Local delivery available.',
  openGraph: {
    title: 'Order — Golden Crumb',
    description:
      'Place an order for freshly baked artisan cookies in San Francisco.',
    url: `${SITE_URL}/order`,
  },
};

export default function OrderPage() {
  return (
    <main className="flex-1 py-14 sm:py-20 lg:py-24">
      <Container>
        <SectionHeader
          as="h1"
          title="Place an Order"
          subtitle="Fill out the form below and we&rsquo;ll confirm your order manually."
        />
        <OrderForm />
      </Container>
    </main>
  );
}
