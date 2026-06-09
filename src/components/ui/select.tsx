import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

const SelectContext = React.createContext<{
  value: string;
  onChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

function Select({
  value,
  onValueChange,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <SelectContext.Provider value={{ value, onChange: onValueChange, open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<'button'>) {
  const ctx = React.useContext(SelectContext);

  return (
    <button
      type="button"
      data-slot="select-trigger"
      onClick={() => ctx?.setOpen(!ctx?.open)}
      className={cn(
        'flex h-8 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

function SelectValue({
  placeholder,
}: {
  placeholder?: string;
}) {
  const ctx = React.useContext(SelectContext);
  return (
    <span className={cn(!ctx?.value && 'text-muted-foreground')}>
      {ctx?.value || placeholder}
    </span>
  );
}

function SelectContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = React.useContext(SelectContext);

  if (!ctx?.open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={() => ctx?.setOpen(false)}
      />
      <div
        data-slot="select-content"
        className={cn(
          'absolute z-50 mt-1 max-h-60 w-full min-w-0 overflow-auto rounded-lg border border-border bg-card p-1 shadow-lg animate-in fade-in-0 zoom-in-95',
          className,
        )}
      >
        {children}
      </div>
    </>
  );
}

function SelectItem({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useContext(SelectContext);
  const selected = ctx?.value === value;

  return (
    <div
      role="option"
      aria-selected={selected}
      onClick={() => {
        ctx?.onChange(value);
        ctx?.setOpen(false);
      }}
      className={cn(
        'relative flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors hover:bg-muted aria-selected:bg-primary/10 aria-selected:text-primary',
        className,
      )}
    >
      <span className="flex-1">{children}</span>
      {selected && <Check className="size-4 shrink-0 text-primary" />}
    </div>
  );
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
