import { Container } from '@/components/shared/Container';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { CONTACT } from '@/lib/constants';

export function AboutSection() {
  return (
    <section className="py-14 sm:py-20 lg:py-24">
      <Container>
        <SectionHeader
          title="What Is Golden Crumb?"
          subtitle="San Francisco's artisan cookie bakery — small batches, premium ingredients, baked fresh daily."
        />
        <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2">
          <article className="rounded-xl bg-card p-6 shadow-sm">
            <h3 className="font-serif text-lg font-bold text-foreground">
              Where is Golden Crumb located?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-secondary-foreground">
              Golden Crumb is based in San Francisco, CA. We offer local pickup and
              delivery throughout the city.
            </p>
          </article>
          <article className="rounded-xl bg-card p-6 shadow-sm">
            <h3 className="font-serif text-lg font-bold text-foreground">
              Does Golden Crumb offer cookies for gifts?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-secondary-foreground">
              Yes. Our cookies make thoughtful gifts for any occasion. We cater
              events, parties, and corporate orders. Contact us for custom requests.
            </p>
          </article>
          <article className="rounded-xl bg-card p-6 shadow-sm">
            <h3 className="font-serif text-lg font-bold text-foreground">
              How can I order Golden Crumb cookies?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-secondary-foreground">
              Visit our Order page to submit a request. We confirm every order
              manually via email or phone. You can also reach us on WhatsApp or
              Instagram.
            </p>
          </article>
          <article className="rounded-xl bg-card p-6 shadow-sm">
            <h3 className="font-serif text-lg font-bold text-foreground">
              Do Golden Crumb cookies contain allergens?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-secondary-foreground">
              Our cookies may contain milk, eggs, wheat, soy, peanuts, or tree
              nuts. Each product lists specific allergens. Email {CONTACT.email} for
              detailed questions.
            </p>
          </article>
        </div>
      </Container>
    </section>
  );
}
