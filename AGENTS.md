# AGENTS.md

## Project

Golden Crumb — artisan cookie brand based in San Francisco. MVP landing page (not full e-commerce).

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript 5 (strict)
- Tailwind CSS 4, PostCSS
- ESLint 9 (eslint-config-next/core-web-vitals, eslint-config-next/typescript)
- pnpm (package manager)
- ShadCN UI (planned), MDX (planned)
- Deployed on Vercel

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build (includes type-check) |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint across the project |

No test runner is configured yet. When adding one, use Vitest (recommended) and add scripts: `pnpm test` for all tests, `pnpm test -- --watch` for watch mode, `pnpm test -- --run <path>` for single-file mode.

TypeScript config: strict mode enabled. Path alias `@/*` maps to `./src/*`.

## Code style

**Imports**: Group by: 1) external packages, 2) `@/` internal aliases, 3) relative imports. Use `import type` for type-only imports. No default exports except pages/layouts.

**Formatting**: No Prettier config — rely on ESLint. Use single quotes. Semicolons required. 2-space indent. 80-100 char line length.

**Types**: Strict TypeScript. Avoid `any` — use `unknown` then narrow. Prefer explicit return types on functions. Use `interface` for public API shapes, `type` for unions/utility types.

**Naming**: PascalCase for components/types/interfaces. camelCase for variables/functions/hooks/files. kebab-case for directories. File name matches exported name (e.g., `CookieCard.tsx` exports `CookieCard`). Use `.tsx` extension for files with JSX.

## Component patterns

- Server Components by default. Client Components (`"use client"`) only when using hooks, event handlers, or browser APIs.
- Props typed with `interface` (not inline). Use `React.ReactNode` for children.
- Keep components small — extract sub-components when a file exceeds ~150 lines.
- Use semantic HTML (`<nav>`, `<main>`, `<section>`, `<article>`, etc.).
- Use Tailwind classes directly — avoid CSS modules or styled-components.

## Error handling

- Use `try/catch` in Server Components for data fetching.
- Use `error.tsx` files (Next.js App Router convention) for per-route error boundaries.
- Use `not-found.tsx` for 404 states.
- Do not catch errors silently — always log or rethrow.

## Data patterns

- Define static data in `src/data/` as typed arrays.
- Use `generateStaticParams` for static routes.
- MDX content goes in `src/content/`.
- Do not add server-side state management unless needed.

## File organization

```
src/
  app/          -- Next.js App Router pages/layouts
  components/   -- Reusable UI components
    layout/     -- Navbar, Footer
    home/       -- HeroSection, FeaturedCookies, etc.
    menu/       -- CookieCard, CookieGrid
    shared/     -- SectionHeader, Container
  data/         -- Static product data
  content/      -- MDX page content
  lib/          -- Utilities, constants
public/images/  -- Static assets
```

## Brand identity

- **Name**: Golden Crumb · **Tagline**: Artisan Cookies
- **Tone**: Warm, premium, friendly, conversion-focused. English copy.
- **Personality**: Boutique bakery — elegant, handmade, trustworthy, modern.

## Content strategy

- Write in English (San Francisco based). Friendly, warm, short, clear.
- Avoid generic filler, exaggerated claims, health/legal claims, marketing hype.
- Include simple allergen disclaimers (may contain milk, eggs, wheat, soy, peanuts, tree nuts).
- Do not invent permits, certifications, or licenses.

## MVP scope

**Include**: Home page, menu page, order page, FAQ, contact section, Instagram/WhatsApp links, simple order form UI, allergen notice, responsive layout, light/dark theme.

**Exclude unless asked**: Stripe, cart, auth, accounts, admin, inventory, delivery routing, coupons, subscriptions, complex backend.

## Color system (Tailwind theme)

**Light**: bg `#F0E0D0`, surface `#FFF7EC`, card `#F8EBDD`, text `#4A2718`, accent `#D49A55`
**Dark**: bg `#3A1D10`, surface `#482612`, card `#5A3019`, text `#F7EADD`, accent `#D49A55`
No cold colors. Accent reserved for CTAs, prices, badges, highlights.

## Typography

- Headings: `Playfair Display` or `Cormorant Garamond` (serif)
- Body: `Inter`, `Lato`, or `Nunito Sans` (sans-serif)
- Max 2 font families. Currently using Geist (Vercel default) — replace per brand guide.

## Responsive

Mobile-first. Hero stacks vertically on mobile, 2-column on desktop. Product grid: 1-col mobile, 3-col desktop. Use generous whitespace. Max-width containers.

## Git conventions

- Commits: imperative mood, lowercase, no period. Prefix with type (e.g., `feat:`, `fix:`, `refactor:`, `style:`, `chore:`).
- Branch from `main`. Use descriptive kebab-case branch names.
- Do not push to main/master. Do not force-push without explicit instruction.

## Agent notes

- Read AGENTS.md fully before starting any task.
- Run `pnpm lint` after completing any work to verify no regressions.
- Run `pnpm build` before marking a task complete.
- When adding dependencies, prefer tools listed in the "Optional later" section of the project context above.
- Do not modify files outside the scope of the task. Do not remove existing functionality.
