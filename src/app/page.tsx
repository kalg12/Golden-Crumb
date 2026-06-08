import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedCookies } from '@/components/home/FeaturedCookies';
import { HowToOrder } from '@/components/home/HowToOrder';
import { PickupDelivery } from '@/components/home/PickupDelivery';
import { FaqPreview } from '@/components/home/FaqPreview';
import { ContactCta } from '@/components/home/ContactCta';

export default function Home() {
  return (
    <main className="flex-1">
      <HeroSection />
      <FeaturedCookies />
      <HowToOrder />
      <PickupDelivery />
      <FaqPreview />
      <ContactCta />
    </main>
  );
}
