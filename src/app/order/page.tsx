import { Container } from '@/components/shared/Container';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { OrderForm } from './OrderForm';

export default function OrderPage() {
  return (
    <main className="flex-1 py-16 sm:py-20">
      <Container>
        <SectionHeader
          title="Place an Order"
          subtitle="Fill out the form below and we&rsquo;ll confirm your order manually."
        />
        <OrderForm />
      </Container>
    </main>
  );
}
