import Link from 'next/link';

import { Container } from '@/components/shared/Container';
import { RevealOnScroll } from '@/components/shared/RevealOnScroll';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const faqs = [
  {
    question: 'Do you use fresh ingredients?',
    answer:
      'Yes! Every cookie is made with premium ingredients — real butter, fresh eggs, and high-quality chocolate. We bake in small batches daily.',
  },
  {
    question: 'Can I place a large order?',
    answer:
      'Absolutely. We cater events, parties, and corporate gatherings. Contact us with your needs and we&rsquo;ll make it happen.',
  },
  {
    question: 'Do you accommodate dietary restrictions?',
    answer:
      'We&rsquo;re working on expanding our menu. Currently, all cookies contain wheat, dairy, and eggs. Some may contain peanuts or tree nuts. Please contact us for detailed allergen information.',
  },
];

export function FaqPreview() {
  return (
    <section className="py-14 sm:py-20 lg:py-24">
      <Container>
        <SectionHeader
          title="Frequently Asked Questions"
          subtitle="Quick answers to common questions."
        />
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {faqs.map((faq, i) => (
            <RevealOnScroll key={faq.question} delay={i * 120}>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-serif text-lg font-bold text-foreground">
                  {faq.question}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-secondary-foreground">
                  {faq.answer}
                </p>
              </CardContent>
            </Card>
            </RevealOnScroll>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button variant="link" asChild>
            <Link href="/faq">View all FAQs &rarr;</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
