import { Container } from '@/components/shared/Container';
import { SectionHeader } from '@/components/shared/SectionHeader';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { SOCIAL, CONTACT } from '@/lib/constants';

const faqs = [
  {
    question: 'How do I place an order?',
    answer:
      'Visit our Order page and fill out the order form. We&rsquo;ll review your request and confirm it manually via email or phone.',
  },
  {
    question: 'Do you offer pickup or delivery?',
    answer:
      'Both! You can choose pickup or delivery when placing your order. Delivery is available within San Francisco and may vary by location and date.',
  },
  {
    question: 'How will I know my order is confirmed?',
    answer:
      'We manually confirm every order. After you submit your request, we&rsquo;ll reach out by email or phone to confirm the details, timing, and availability.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'Payment is handled at pickup or delivery. We accept cash, card, and digital payments. For large orders, we may request a deposit.',
  },
  {
    question: 'What are the allergens in your cookies?',
    answer:
      'Our cookies may contain milk, eggs, wheat, soy, peanuts, or tree nuts. Each product page lists specific allergens. Please contact us if you have concerns.',
  },
  {
    question: 'Can I request custom cookies?',
    answer:
      'Absolutely. We love creating custom orders for events, parties, and corporate gifts. Reach out via our Order page or message us directly.',
  },
  {
    question: 'How far in advance should I order?',
    answer:
      'We recommend ordering at least 2-3 days in advance. For large orders or custom requests, please give us at least a week&rsquo;s notice.',
  },
  {
    question: 'What is your cancellation and refund policy?',
    answer:
      'You can cancel or modify your order up to 24 hours before your scheduled pickup or delivery. Contact us directly for cancellations. Refunds are handled on a case-by-case basis.',
  },
];

export default function FaqPage() {
  return (
    <main className="flex-1 py-16 sm:py-20">
      <Container>
        <SectionHeader
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about ordering from Golden Crumb."
        />
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardContent className="p-6 sm:p-8">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, i) => (
                  <AccordionItem key={faq.question} value={`item-${i}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        <div className="mx-auto mt-12 max-w-xl rounded-xl bg-primary/10 p-8 text-center">
          <h2 className="font-serif text-xl font-bold text-foreground">
            Still have questions?
          </h2>
          <p className="mt-2 text-sm text-secondary-foreground">
            Reach out on{' '}
            <a
              href={SOCIAL.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary transition-colors hover:text-primary/80"
            >
              Instagram
            </a>
            ,{' '}
            <a
              href={SOCIAL.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary transition-colors hover:text-primary/80"
            >
              WhatsApp
            </a>
            , or email us at{' '}
            <a
              href={`mailto:${CONTACT.email}`}
              className="font-medium text-primary transition-colors hover:text-primary/80"
            >
              {CONTACT.email}
            </a>
            .
          </p>
        </div>
      </Container>
    </main>
  );
}
