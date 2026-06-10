export const SITE_NAME = 'Golden Crumb';
export const SITE_TAGLINE = 'Artisan Cookies';
export const SITE_DESCRIPTION =
  'Freshly baked artisan cookies made for sweet moments, thoughtful gifts, and everyday cravings.';
export const SITE_URL = 'https://goldencrumb.com';

export const SOCIAL = {
  instagram: 'https://instagram.com/goldencrumb',
  whatsapp: 'https://wa.me/15551234567',
} as const;

export const CONTACT = {
  email: 'hello@goldencrumb.com',
  phone: '(555) 123-4567',
  location: 'San Francisco, CA',
} as const;

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
  { href: '/order', label: 'Order' },
  { href: '/faq', label: 'FAQ' },
  { href: '/allergens', label: 'Allergens' },
] as const;

export const ALLERGEN_NOTICE =
  'Cookies may contain milk, eggs, wheat, soy, peanuts, or tree nuts. Please contact us before ordering if you have food allergies.';
