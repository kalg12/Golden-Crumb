import Link from 'next/link';

import { Container } from '@/components/shared/Container';
import { Separator } from '@/components/ui/separator';
import {
  SITE_NAME,
  NAV_LINKS,
  SOCIAL,
  CONTACT,
  ALLERGEN_NOTICE,
} from '@/lib/constants';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-secondary">
      <Container className="py-12 lg:py-16">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-foreground">
              {SITE_NAME}
            </h3>
            <p className="mt-2 text-sm text-secondary-foreground">
              Freshly baked artisan cookies in San Francisco.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground">
              Links
            </h4>
            <ul className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-secondary-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground">
              Contact
            </h4>
            <ul className="flex flex-col gap-2 text-sm text-secondary-foreground">
              <li>{CONTACT.location}</li>
              <li>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="transition-colors hover:text-primary"
                >
                  {CONTACT.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${CONTACT.phone}`}
                  className="transition-colors hover:text-primary"
                >
                  {CONTACT.phone}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground">
              Follow Us
            </h4>
            <ul className="flex flex-col gap-2 text-sm text-secondary-foreground">
              <li>
                <a
                  href={SOCIAL.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-primary"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href={SOCIAL.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-primary"
                >
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="pb-6 text-center text-xs text-muted-foreground">
          <p className="mb-2">{ALLERGEN_NOTICE}</p>
          <p>&copy; {currentYear} {SITE_NAME}. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
}
