import Link from 'next/link';
import Image from 'next/image';

import { Container } from '@/components/shared/Container';
import { Separator } from '@/components/ui/separator';
import {
  SITE_NAME,
  NAV_LINKS,
  ALLERGEN_NOTICE,
} from '@/lib/constants';
import { getSiteSettings } from '@/lib/siteSettings';

export async function Footer() {
  const currentYear = new Date().getFullYear();
  const settings = await getSiteSettings();

  return (
    <footer className="border-t border-border bg-card">
      <Container className="py-12 sm:py-14 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="relative h-10 w-30 lg:w-37.5">
              <Image
                src="/images/logos/GoldeCrumb-dark.png"
                alt={SITE_NAME}
                fill
                className="object-contain object-left dark:hidden"
                sizes="(max-width: 1024px) 120px, 150px"
              />
              <Image
                src="/images/logos/GoldeCrumb-light.png"
                alt={SITE_NAME}
                fill
                className="object-contain object-left hidden dark:block"
                sizes="(max-width: 1024px) 120px, 150px"
              />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Freshly baked artisan cookies in San Francisco.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-3">
            <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-foreground">
              Links
            </h4>
            <ul className="flex flex-col gap-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Track Order / Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-3">
            <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-foreground">
              Contact
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              <li>{settings.location}</li>
              <li>
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="transition-colors hover:text-primary"
                >
                  {settings.contactEmail}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${settings.contactPhone}`}
                  className="transition-colors hover:text-primary"
                >
                  {settings.contactPhone}
                </a>
              </li>
            </ul>
          </div>

          {/* Follow Us */}
          <div className="flex flex-col gap-3">
            <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-foreground">
              Follow Us
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              <li>
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-primary"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href={settings.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-primary"
                >
                  WhatsApp
                </a>
              </li>
              <li>
                <Link
                  href="/allergens"
                  className="transition-colors hover:text-primary"
                >
                  Allergen Info
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-10 lg:my-12" />

        <div className="flex flex-col gap-2 text-center text-xs text-muted-foreground/80">
          <p className="leading-relaxed">{ALLERGEN_NOTICE}</p>
          <p>&copy; {currentYear} {SITE_NAME}. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
}
