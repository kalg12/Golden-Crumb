import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
  children?: ReactNode;
}

export function SectionHeader({
  title,
  subtitle,
  centered = true,
  className,
  children,
}: SectionHeaderProps) {
  return (
    <div className={cn('mb-12 lg:mb-16', centered && 'text-center', className)}>
      <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto mt-3 max-w-2xl text-lg text-secondary-foreground">
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}
