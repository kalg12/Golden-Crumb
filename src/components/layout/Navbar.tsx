'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { SITE_NAME, NAV_LINKS } from '@/lib/constants';
import { cn } from '@/lib/utils';

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6 shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="9.5" fill="#D99A4E" />
        <circle cx="8.5" cy="9" r="1.8" fill="#2B140D" />
        <circle cx="14.5" cy="9.5" r="1.5" fill="#2B140D" />
        <circle cx="10.5" cy="14.5" r="1.6" fill="#2B140D" />
        <circle cx="15" cy="14" r="1.3" fill="#2B140D" />
        <circle cx="12" cy="11" r="1" fill="#2B140D" />
      </svg>
      <span className="font-serif text-lg font-bold tracking-tight text-foreground">
        {SITE_NAME}
      </span>
    </Link>
  );
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-card/90 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Logo />

        <div className="flex items-center gap-1">
          <div className="hidden items-center gap-1 sm:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'text-primary'
                    : 'text-foreground/75 hover:text-primary',
                )}
                {...(pathname === link.href ? { 'aria-current': 'page' as const } : {})}
              >
                {link.label}
              </Link>
            ))}
            <Button asChild size="sm" className="ml-2">
              <Link href="/order">Order Now</Link>
            </Button>
          </div>

          <ThemeToggle />

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="sm:hidden">
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-60 sm:w-75">
              <div className="mt-8 flex flex-col gap-2">
                {NAV_LINKS.map((link) => (
                  <Button
                    key={link.href}
                    variant="ghost"
                    asChild
                    className={cn(
                      'justify-start text-base',
                      pathname === link.href && 'text-primary',
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <Link
                      href={link.href}
                      {...(pathname === link.href ? { 'aria-current': 'page' as const } : {})}
                    >
                      {link.label}
                    </Link>
                  </Button>
                ))}
                <Button
                  asChild
                  className="mt-4 bg-primary text-primary-foreground hover:bg-primary/80"
                  onClick={() => setIsOpen(false)}
                >
                  <Link href="/order">Order Now</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
