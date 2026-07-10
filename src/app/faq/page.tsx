import type { Metadata } from 'next';

import { Container } from '@/components/shared/Container';
import { SectionHeader } from '@/components/shared/SectionHeader';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { SITE_URL } from '@/lib/constants';
import { getSiteSettings } from '@/lib/siteSettings';

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Frequently asked questions about Golden Crumb artisan cookies in San Francisco. Learn how to order, delivery, allergens, and more.',
  openGraph: {
    title: 'FAQ — Golden Crumb',
    description:
      'Frequently asked questions about Golden Crumb artisan cookies in San Francisco.',
    url: `${SITE_URL}/faq`,
  },
};

const faqs = [
  {
    question: 'Where is Golden Crumb located?',
    answer:
      'Golden Crumb is based in San Francisco, CA. We offer fresh local delivery throughout the city.',
  },
  {
    question: 'How do I place an order?',
    answer:
      'Visit our Order page and fill out the order form. We&rsquo;ll review your request and confirm it manually via email or phone.',
  },
  {
    question: 'Do you offer cookies for gifts or events?',
    answer:
      'Yes! We cater events, parties, and corporate gatherings. Our cookies make thoughtful gifts for any occasion. Contact us with your needs and we&rsquo;ll create a custom order.',
  },
  {
    question: 'Do you offer delivery?',
    answer:
      'Yes! We offer local delivery within San Francisco. Delivery availability may vary by location and date, and we will confirm scheduling and details manually after you submit your request.',
  },
  {
    question: 'How fresh are the cookies?',
    answer:
      'We bake every batch fresh to order using premium ingredients — real butter, fresh eggs, and high-quality chocolate. Your cookies are made and delivered at peak freshness.',
  },
  {
    question: 'Can I contact Golden Crumb through WhatsApp?',
    answer:
      'Yes! Message us on WhatsApp to place an order or ask questions. You can also reach us on Instagram or email at hello@goldencrumb.com.',
  },
  {
    question: 'How will I know my order is confirmed?',
    answer:
      'We manually confirm every order. After you submit your request, we&rsquo;ll reach out by email or phone to confirm the details, timing, and availability.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'Payment is handled at delivery. We accept cash, card, and digital payments. For large orders, we may request a deposit.',
  },
  {
    question: 'Do your cookies contain allergens?',
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
      'You can cancel or modify your order up to 24 hours before your scheduled delivery. Contact us directly for cancellations. Refunds are handled on a case-by-case basis.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
};

export default async function FaqPage() {
  const settings = await getSiteSettings();

  return (
    <main className="flex-1 py-14 sm:py-20 lg:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Container>
        <SectionHeader
          as="h1"
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
              href={settings.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary transition-colors hover:text-primary/80"
            >
              Instagram
            </a>
            ,{' '}
            <a
              href={settings.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary transition-colors hover:text-primary/80"
            >
              WhatsApp
            </a>
            , or email us at{' '}
            <a
              href={`mailto:${settings.contactEmail}`}
              className="font-medium text-primary transition-colors hover:text-primary/80"
            >
              {settings.contactEmail}
            </a>
            .
          </p>
        </div>
      </Container>
    </main>
  );
}
