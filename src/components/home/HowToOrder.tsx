import { Container } from '@/components/shared/Container';
import { SectionHeader } from '@/components/shared/SectionHeader';

const steps = [
  {
    number: '01',
    title: 'Browse Our Menu',
    description:
      'Choose from our selection of freshly baked artisan cookies.',
  },
  {
    number: '02',
    title: 'Place Your Order',
    description:
      'Tell us what you need and when. We&rsquo;ll confirm your order promptly.',
  },
  {
    number: '03',
    title: 'Pick Up or Delivery',
    description:
      'Pick up your cookies fresh or have them delivered in San Francisco.',
  },
];

export function HowToOrder() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <SectionHeader
          title="How to Order"
          subtitle="Enjoying Golden Crumb cookies is easy."
        />
        <div className="grid gap-8 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
                <span className="font-serif text-xl font-bold text-primary">
                  {step.number}
                </span>
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-secondary-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
