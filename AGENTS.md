# AGENTS.md

## Project context

This is a Next.js project for **Golden Crumb**, an artisan cookie brand based in San Francisco, California.

The first version must be an MVP landing page, not a full e-commerce platform yet.

The project should be designed to grow later into:

- Product catalog
- Online ordering
- Stripe Checkout
- Admin dashboard
- Order management
- Pickup/delivery scheduling
- Customer notifications
- Blog or content pages
- SEO-focused marketing pages

For now, prioritize:

- Premium landing page
- Cookie menu
- Simple order page
- FAQ
- Contact section
- WhatsApp / Instagram links
- Mobile-first experience
- Markdown/MDX content where useful

Do not build a full e-commerce system unless explicitly requested.

---

## Brand identity

Brand name:

**Golden Crumb**

Tagline:

**Artisan Cookies**

Brand personality:

- Warm
- Premium
- Elegant
- Handmade
- Friendly
- Trustworthy
- Modern
- Appetizing
- Boutique bakery style

The website should feel like a high-quality artisan cookie brand, not a generic bakery template.

The design should communicate:

- Freshly baked cookies
- Small-batch quality
- Homemade warmth
- Premium presentation
- Simple and trustworthy ordering

---

## Visual references

The brand has two logo versions:

1. Light version:
   - Cream / beige background
   - Dark chocolate typography
   - Golden cookie illustration
   - Warm, soft, elegant feel

2. Dark version:
   - Deep chocolate brown background
   - Cream typography
   - Golden cookie illustration
   - Premium, rich, elegant feel

Use these references as the main visual direction.

---

## Color system

Use a warm cookie-inspired palette.

### Light theme

Recommended colors:

- Background: `#F0E0D0`
- Surface: `#FFF7EC`
- Card: `#F8EBDD`
- Primary text: `#4A2718`
- Secondary text: `#8A5D3B`
- Muted text: `#A87954`
- Accent: `#D49A55`
- Accent dark: `#A7642D`
- Border: `#E2CBB6`

### Dark theme

Recommended colors:

- Background: `#482612`
- Surface: `#5A3019`
- Card: `#64371F`
- Primary text: `#F7EADD`
- Secondary text: `#D7B895`
- Muted text: `#C5966C`
- Accent: `#D49A55`
- Accent light: `#F0C078`
- Border: `#7A4A2C`

### Usage rules

- Light mode should feel soft, clean, bright, and elegant.
- Dark mode should feel rich, chocolatey, premium, and cozy.
- Do not use cold colors as main colors.
- Avoid blue, purple, gray-heavy, or neon palettes.
- Use the golden accent color only for important actions, highlights, prices, badges, and CTA buttons.
- Maintain enough contrast for accessibility.
- Buttons must be clearly visible in both light and dark modes.

---

## Typography direction

Use elegant and readable typography.

Recommended style:

- Headings: elegant serif or high-quality display font.
- Body: clean sans-serif.
- Navigation: simple, readable sans-serif.
- Product names: can use serif for a premium look.

If using Google Fonts, prefer combinations like:

- `Playfair Display` or `Cormorant Garamond` for headings.
- `Inter`, `Lato`, or `Nunito Sans` for body text.

Typography rules:

- Headings should feel premium and editorial.
- Body text must remain readable on mobile.
- Avoid overly decorative fonts for long text.
- Do not use too many fonts.
- Maximum two font families.

---

## UI/UX rules

Design must be mobile-first.

The website must work beautifully on:

- Small phones
- Large phones
- Tablets
- Desktop screens

General UI rules:

- Use generous spacing.
- Use rounded cards, but avoid childish styling.
- Use soft shadows only when they improve hierarchy.
- Use clean section separation.
- Use large product images.
- Make CTA buttons obvious.
- Avoid clutter.
- Avoid too much text above the fold.
- Keep the purchase/order journey simple.
- Use consistent spacing, button styles, cards, and typography.

The UI should feel:

- Premium
- Warm
- Clean
- Appetizing
- Easy to understand

The UI should not feel:

- Cheap
- Overloaded
- Generic
- Corporate
- Too playful
- Too childish

---

## Responsive rules

### Mobile

Mobile is the priority.

On mobile:

- Navigation should be simple.
- Hero section should be clear and short.
- CTA button should appear early.
- Product cards should be stacked vertically.
- Text should not be too small.
- Buttons should be easy to tap.
- Images should load properly and not break the layout.
- Avoid horizontal scrolling.
- Use sticky or repeated CTA only if it improves conversion.

Recommended mobile sections order:

1. Navbar
2. Hero
3. Main CTA
4. Featured cookies
5. How to order
6. Pickup/delivery info
7. FAQ
8. Contact
9. Footer

### Desktop

On desktop:

- Use wider layouts with strong visual balance.
- Hero can use two columns: text + cookie image.
- Product sections can use grids.
- Cards can use 3-column layout.
- Keep max-width containers.
- Avoid stretching content too wide.
- Use whitespace to create a premium feel.

---

## Content strategy

Use English copy because the business is based in San Francisco.

Tone:

- Friendly
- Warm
- Short
- Clear
- Conversion-focused
- Premium but not arrogant

Avoid:

- Generic filler text
- Exaggerated claims
- Health claims
- Legal claims
- Too much marketing hype

Good example tone:

"Freshly baked artisan cookies made for sweet moments, thoughtful gifts, and everyday cravings."

Useful content sections:

- Hero headline
- Short brand intro
- Featured cookies
- How to order
- Pickup and delivery
- FAQ
- Allergen notice
- Contact CTA
- Instagram CTA

---

## Legal and trust content

Because this is a food business, always consider trust and safety.

Include simple disclaimers where appropriate:

- Cookies may contain milk, eggs, wheat, soy, peanuts, or tree nuts.
- Customers with allergies should contact the business before ordering.
- Pickup and delivery availability may vary by location and date.
- Orders should be confirmed manually before preparation.
- Refund/cancellation policy should be added when the business is ready.

Do not invent legal guarantees.

Do not claim permits, certifications, or licenses unless the user explicitly provides them.

---

## MVP scope

The first version should include:

- Home page
- Menu page
- Order page
- FAQ page
- Contact section
- Instagram link
- WhatsApp or direct message CTA
- Simple order form UI
- Basic policies or allergen notice
- Responsive layout
- Light/dark visual system

The first version should not include unless explicitly requested:

- Stripe
- Cart
- Authentication
- Customer accounts
- Admin dashboard
- Inventory
- Delivery routing
- Coupons
- Loyalty points
- Subscriptions
- Complex backend

---

## Future growth architecture

Build the project in a way that can grow later.

Recommended growth path:

1. Static landing page
2. Static product menu
3. Simple order form
4. Email notification
5. Database storage with Supabase or PostgreSQL
6. Stripe Checkout
7. Admin dashboard
8. Order tracking
9. Customer notifications
10. Full e-commerce features

Do not over-engineer the first version.

---

## Tech stack

Use:

- Next.js App Router
- TypeScript
- Tailwind CSS
- ShadCN UI
- MDX for editable content
- Vercel for deployment

Optional later:

- Supabase
- Stripe Checkout
- Resend
- Cloudinary or Supabase Storage
- Zod
- React Hook Form

---

## Coding rules

- Use TypeScript strictly.
- Avoid `any`.
- Prefer explicit types.
- Use reusable components.
- Keep components small and readable.
- Use Server Components by default.
- Use Client Components only when interactivity is required.
- Do not introduce unnecessary dependencies.
- Do not modify unrelated files.
- Do not remove existing functionality.
- Do not change business logic unless explicitly requested.
- Keep the code clean and easy to maintain.
- Use semantic HTML.
- Follow accessibility best practices.

---

## File organization

Recommended structure:

```txt
app/
  page.tsx
  menu/
    page.tsx
  order/
    page.tsx
  faq/
    page.tsx
  layout.tsx

components/
  layout/
    Navbar.tsx
    Footer.tsx
  home/
    HeroSection.tsx
    FeaturedCookies.tsx
    HowToOrder.tsx
    OrderCTA.tsx
  menu/
    CookieCard.tsx
    CookieGrid.tsx
  shared/
    SectionHeader.tsx
    Container.tsx

content/
  pages/
    about.mdx
    faq.mdx
    policies.mdx

data/
  products.ts

lib/
  constants.ts
  utils.ts

public/
  images/
    logo-light.png
    logo-dark.png
    cookies/
```
