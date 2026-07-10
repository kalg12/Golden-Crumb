import { Container } from '@/components/shared/Container';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { Card, CardContent } from '@/components/ui/card';
import { getSiteSettings } from '@/lib/siteSettings';

export async function PickupDelivery() {
  const settings = await getSiteSettings();

  return (
    <section className="py-14 sm:py-20 lg:py-24">
      <Container>
        <SectionHeader
          title="Local Delivery"
          subtitle="How to get your cookies fresh and fast."
        />
        <div className="grid gap-8 sm:grid-cols-2">
          <Card>
            <CardContent className="p-6 sm:p-8">
              <h3 className="font-serif text-lg font-bold text-foreground">
                Delivery Area
              </h3>
              <p className="mt-3 text-sm text-secondary-foreground leading-relaxed">
                We offer delivery exclusively within the city of San Francisco, CA.
                All cookies are carefully packaged to ensure they arrive at your door in perfect condition.
              </p>
              <p className="mt-3 text-sm text-secondary-foreground">
                <span className="font-semibold text-foreground">Service Zone:</span>{' '}
                San Francisco, CA
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 sm:p-8">
              <h3 className="font-serif text-lg font-bold text-foreground">
                Delivery Timing
              </h3>
              <p className="mt-3 text-sm text-secondary-foreground leading-relaxed">
                Availability may vary by location and date. We manually confirm every order&rsquo;s details and scheduling to coordinate the best delivery window for you.
              </p>
              <p className="mt-3 text-sm text-secondary-foreground">
                Have questions?{' '}
                <a
                  href={`mailto:${settings.contactEmail}`}
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
