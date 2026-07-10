/**
 * Resolves the public base URL for building absolute links (emails, etc).
 * Prefers an explicit NEXT_PUBLIC_BASE_URL, falls back to Vercel's
 * auto-provided deployment URL so production emails never point at
 * localhost just because the env var wasn't configured manually.
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}
