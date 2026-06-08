import { Container } from '@/components/shared/Container';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { Card, CardContent } from '@/components/ui/card';
import { CONTACT } from '@/lib/constants';

export function PickupDelivery() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <SectionHeader
          title="Pickup &amp; Delivery"
          subtitle="How to get your cookies fresh and fast."
        />
        <div className="grid gap-8 sm:grid-cols-2">
          <Card>
            <CardContent className="p-6 sm:p-8">
              <h3 className="font-serif text-lg font-bold text-foreground">
                Pickup
              </h3>
              <p className="mt-3 text-sm text-secondary-foreground">
                Order ahead and pick up your cookies fresh from our kitchen in
                San Francisco. We&rsquo;ll confirm your pickup time after you order.
              </p>
              <p className="mt-3 text-sm text-secondary-foreground">
                <span className="font-semibold text-foreground">Location:</span>{' '}
                {CONTACT.location}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 sm:p-8">
              <h3 className="font-serif text-lg font-bold text-foreground">
                Delivery
              </h3>
              <p className="mt-3 text-sm text-secondary-foreground">
                We offer delivery within San Francisco. Availability may vary
                by location and date. Minimum order may apply.
              </p>
              <p className="mt-3 text-sm text-secondary-foreground">
                Have questions?{' '}
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="font-medium text-primary transition-colors hover:text-primary/80"
                >
                  Contact us
                </a>{' '}
                for details.
              </p>
            </CardContent>
          </Card>
        </div>
      </Container>
    </section>
  );
}
