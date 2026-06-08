'use client';

import { useSyncExternalStore } from 'react';
import { Sun, Moon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme/ThemeProvider';

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <Button variant="ghost" size="icon" aria-label="Toggle theme">
        <div className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  );
}
