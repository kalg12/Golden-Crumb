'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useTheme } from '@/components/theme/ThemeProvider';
import { SITE_NAME, NAV_LINKS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { theme } = useTheme();
  const logoSrc =
    theme === 'dark'
      ? '/images/logos/GoldeCrumb-light.png'
      : '/images/logos/GoldeCrumb-dark.png';

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-sm">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src={logoSrc}
            alt={SITE_NAME}
            width={160}
            height={40}
            className="h-9 w-auto sm:h-10"
            priority
          />
        </Link>

        <div className="flex items-center gap-1">
          <div className="hidden items-center gap-1 sm:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium text-foreground/75 transition-colors hover:text-primary',
                  pathname === link.href && 'text-primary',
                )}
                {...(pathname === link.href ? { 'aria-current': 'page' as const } : {})}
              >
                {link.label}
              </Link>
            ))}
            <Button
              asChild
              size="sm"
              variant="default"
              className="ml-2 rounded-full"
            >
              <Link href="/order">Order Now</Link>
            </Button>
          </div>

          <ThemeToggle />

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="sm:hidden">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              showCloseButton={false}
              className="flex !w-[85vw] max-w-[360px] flex-col rounded-l-2xl border-l border-border bg-card p-0"
            >
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>

              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <Link href="/" onClick={() => setIsOpen(false)}>
                  <Image
                    src={logoSrc}
                    alt={SITE_NAME}
                    width={140}
                    height={35}
                    className="h-8 w-auto"
                    priority
                  />
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close menu"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="size-5" />
                </Button>
              </div>

              <nav className="flex-1 overflow-y-auto px-5 py-6">
                <div className="flex flex-col gap-1">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        'flex items-center rounded-xl px-4 py-3 text-base font-medium transition-colors',
                        pathname === link.href
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground/75 hover:bg-muted hover:text-foreground',
                      )}
                      onClick={() => setIsOpen(false)}
                      {...(pathname === link.href ? { 'aria-current': 'page' as const } : {})}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </nav>

              <div className="px-5 pb-4">
                <Button
                  asChild
                  size="lg"
                  className="w-full rounded-full"
                  onClick={() => setIsOpen(false)}
                >
                  <Link href="/order">Order Now</Link>
                </Button>
              </div>

              <div className="border-t border-border px-5 py-4">
                <p className="text-center text-xs text-muted-foreground">
                  Freshly baked daily
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
