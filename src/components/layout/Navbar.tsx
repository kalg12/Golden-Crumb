'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { SITE_NAME, NAV_LINKS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(248,235,221,0.15)] bg-[#4B2616]">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/images/logos/GoldeCrumb-light.png"
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
                  'rounded-lg px-3 py-2 text-sm font-medium text-[#F8EBDD]/75 transition-colors hover:text-[#D99A4E]',
                  pathname === link.href && 'text-[#D99A4E]',
                )}
                {...(pathname === link.href ? { 'aria-current': 'page' as const } : {})}
              >
                {link.label}
              </Link>
            ))}
            <Button
              asChild
              size="sm"
              className="ml-2 rounded-full bg-[#D99A4E] text-[#2B140D] hover:bg-[#D99A4E]/90"
            >
              <Link href="/order">Order Now</Link>
            </Button>
          </div>

          <div className="text-[#F8EBDD]">
            <ThemeToggle />
          </div>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="sm:hidden">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open menu"
                className="text-[#F8EBDD] hover:bg-[#F8EBDD]/10 hover:text-[#D99A4E]"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-60 border-l border-[rgba(248,235,221,0.15)] bg-[#4B2616] sm:w-75"
            >
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
              <div className="mt-8 flex flex-col gap-2">
                {NAV_LINKS.map((link) => (
                  <Button
                    key={link.href}
                    variant="ghost"
                    asChild
                    className={cn(
                      'justify-start text-base text-[#F8EBDD]/75 hover:bg-[#F8EBDD]/10 hover:text-[#D99A4E]',
                      pathname === link.href && 'text-[#D99A4E]',
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
                  className="mt-4 rounded-full bg-[#D99A4E] text-[#2B140D] hover:bg-[#D99A4E]/90"
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
