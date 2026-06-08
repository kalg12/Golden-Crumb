import { Container } from '@/components/shared/Container';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { CookieGrid } from '@/components/menu/CookieGrid';
import { products } from '@/data/products';

export default function MenuPage() {
  return (
    <main className="flex-1 py-16 sm:py-20">
      <Container>
        <SectionHeader
          title="Our Menu"
          subtitle="Every cookie is handcrafted with premium ingredients and baked fresh daily in San Francisco."
        />
        <CookieGrid products={products} />
      </Container>
    </main>
  );
}
