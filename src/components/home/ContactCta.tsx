import { Container } from '@/components/shared/Container';
import { Button } from '@/components/ui/button';
import { getSiteSettings } from '@/lib/siteSettings';

export async function ContactCta() {
  const settings = await getSiteSettings();

  return (
    <section className="py-14 sm:py-20 lg:py-24">
      <Container>
        <div className="rounded-2xl bg-primary/10 p-8 text-center sm:p-12 lg:p-14">
          <h2 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
            Ready to Order?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-secondary-foreground">
            Follow us on Instagram for the latest flavors, or send us a message
            on WhatsApp to place your order.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button variant="outline" asChild>
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Follow on Instagram
              </a>
            </Button>
            <Button asChild>
              <a
                href={settings.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Message on WhatsApp
              </a>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Or email us at{' '}
            <a
              href={`mailto:${settings.contactEmail}`}
              className="font-medium text-primary transition-colors hover:text-primary/80"
            >
              {settings.contactEmail}
            </a>
          </p>
        </div>
      </Container>
    </section>
  );
}
