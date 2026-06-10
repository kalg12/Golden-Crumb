import type { Metadata } from 'next';

import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedCookies } from '@/components/home/FeaturedCookies';
import { AboutSection } from '@/components/home/AboutSection';
import { HowToOrder } from '@/components/home/HowToOrder';
import { PickupDelivery } from '@/components/home/PickupDelivery';
import { FaqPreview } from '@/components/home/FaqPreview';
import { ContactCta } from '@/components/home/ContactCta';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Golden Crumb | Artisan Cookies in San Francisco',
  description:
    'Freshly baked artisan cookies in San Francisco. Order small-batch cookies for gifts, events, everyday treats, and sweet moments.',
  openGraph: {
    title: 'Golden Crumb | Artisan Cookies in San Francisco',
    description:
      'Freshly baked artisan cookies in San Francisco. Order small-batch cookies for gifts, events, everyday treats, and sweet moments.',
    url: SITE_URL,
  },
};

export default function Home() {
  return (
    <main className="flex-1">
      <HeroSection />
      <AboutSection />
      <FeaturedCookies />
      <HowToOrder />
      <PickupDelivery />
      <FaqPreview />
      <ContactCta />
    </main>
  );
}
