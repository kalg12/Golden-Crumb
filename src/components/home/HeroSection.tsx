import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { SITE_TAGLINE, SITE_DESCRIPTION } from '@/lib/constants';

function CookieVisual() {
  return (
    <div className="relative flex animate-float items-center justify-center">
      <div className="absolute h-115 w-115 rounded-full bg-primary/10 blur-3xl" />
      <svg
        viewBox="0 0 400 400"
        className="relative h-72 w-72 sm:h-80 sm:w-80 lg:h-96 lg:w-96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="cookieMain" cx="42%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#E8A84C" />
            <stop offset="45%" stopColor="#D99A4E" />
            <stop offset="100%" stopColor="#B87A30" />
          </radialGradient>
          <radialGradient id="cookieGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D99A4E" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#D99A4E" stopOpacity="0" />
          </radialGradient>
          <filter id="heroShadow">
            <feDropShadow dx="0" dy="10" stdDeviation="16" floodColor="#1F0E08" floodOpacity="0.45" />
          </filter>
        </defs>
        <circle cx="200" cy="200" r="200" fill="url(#cookieGlow)" />
        <ellipse cx="200" cy="340" rx="135" ry="14" fill="#1F0E08" opacity="0.3" />
        <circle cx="200" cy="188" r="145" fill="url(#cookieMain)" filter="url(#heroShadow)" />
        <circle cx="160" cy="160" r="2.5" fill="#A06828" opacity="0.35" />
        <circle cx="235" cy="150" r="2" fill="#A06828" opacity="0.3" />
        <circle cx="180" cy="235" r="2.5" fill="#A06828" opacity="0.3" />
        <circle cx="255" cy="205" r="2" fill="#A06828" opacity="0.25" />
        <circle cx="135" cy="205" r="2" fill="#A06828" opacity="0.3" />
        <circle cx="220" cy="265" r="2" fill="#A06828" opacity="0.25" />
        <path d="M148 142 Q158 122 172 138 Q162 155 148 142Z" fill="#2B140D" />
        <path d="M150 140 Q158 128 168 140" fill="#1A0A05" opacity="0.5" />
        <path d="M238 162 Q252 154 250 175 Q234 172 238 162Z" fill="#2B140D" />
        <path d="M240 165 Q248 158 246 172" fill="#1A0A05" opacity="0.5" />
        <path d="M172 240 Q164 255 185 258 Q190 242 172 240Z" fill="#2B140D" />
        <path d="M176 243 Q168 252 182 254" fill="#1A0A05" opacity="0.5" />
        <path d="M250 228 Q265 222 260 242 Q245 240 250 228Z" fill="#2B140D" />
        <path d="M253 231 Q262 226 258 238" fill="#1A0A05" opacity="0.5" />
        <path d="M200 138 Q210 128 215 140 Q205 148 200 138Z" fill="#2B140D" />
        <path d="M125 202 Q135 192 140 204 Q128 210 125 202Z" fill="#2B140D" />
        <path d="M265 178 Q278 170 275 188 Q262 186 265 178Z" fill="#2B140D" />
        <path d="M215 285 Q224 276 230 285 Q220 294 215 285Z" fill="#2B140D" />
        <path d="M136 265 Q146 255 152 265 Q142 274 136 265Z" fill="#2B140D" />
        <circle cx="178" cy="118" r="5.5" fill="#2B140D" />
        <circle cx="275" cy="215" r="6.5" fill="#2B140D" />
        <circle cx="152" cy="295" r="5.5" fill="#2B140D" />
        <circle cx="295" cy="150" r="4.5" fill="#2B140D" />
        <path d="M118 225 Q138 212 160 228" stroke="#E8A84C" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
        <path d="M232 118 Q255 132 248 156" stroke="#E8A84C" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
        <path d="M285 242 Q262 255 250 278" stroke="#E8A84C" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
      </svg>
      <div className="absolute -right-2 top-8 h-10 w-10 rounded-full border border-primary/20 lg:h-14 lg:w-14" />
      <div className="absolute -bottom-1 left-6 h-6 w-6 rounded-full border border-primary/15 lg:h-9 lg:w-9" />
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-secondary">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="py-16 sm:py-20 lg:py-28">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              {SITE_TAGLINE}
            </p>
            <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {SITE_DESCRIPTION}
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Small-batch cookies baked fresh daily in San Francisco. Perfect for
              everyday treats, thoughtful gifts, and sweet moments.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg" className="rounded-full px-8">
                <Link href="/menu">View Our Menu</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8">
                <Link href="/order">Place an Order</Link>
              </Button>
            </div>
          </div>
          <div className="hidden lg:flex">
            <CookieVisual />
          </div>
        </div>
      </div>
      <div className="flex justify-center pb-16 lg:hidden">
        <CookieVisual />
      </div>
    </section>
  );
}
