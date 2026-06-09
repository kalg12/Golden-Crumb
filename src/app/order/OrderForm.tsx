'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, Loader2, Minus, Plus, Store, Truck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { RevealOnScroll } from '@/components/shared/RevealOnScroll';
import { SOCIAL } from '@/lib/constants';
import { products } from '@/data/products';
import { US_STATES } from '@/data/locations';
import { cn } from '@/lib/utils';

interface CityInfo {
  city: string;
  county: string;
  population: number;
}

interface AddressFields {
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  pickupOrDelivery: 'pickup' | 'delivery';
  address: AddressFields;
  quantities: Record<string, number>;
  preferredDate: string;
  preferredTime: string;
  notes: string;
  allergyConfirmed: boolean;
}

const initialAddress: AddressFields = {
  line1: '',
  line2: '',
  city: '',
  state: '',
  zip: '',
};

const initialQuantities = Object.fromEntries(
  products.map((p) => [p.id, 0]),
);

const initialForm: FormData = {
  name: '',
  phone: '',
  email: '',
  pickupOrDelivery: 'pickup',
  address: initialAddress,
  quantities: initialQuantities,
  preferredDate: '',
  preferredTime: '',
  notes: '',
  allergyConfirmed: false,
};

const today = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

export function OrderForm() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [submitted, setSubmitted] = useState(false);

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateAddress = (field: keyof AddressFields, value: string) => {
    setForm((prev) => {
      const next = { ...prev.address, [field]: value };
      if (field === 'state') {
        next.city = '';
      }
      return { ...prev, address: next };
    });
  };

  const setQuantity = (id: string, qty: number) => {
    setForm((prev) => ({
      ...prev,
      quantities: { ...prev.quantities, [id]: Math.max(0, qty) },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const selectedProducts = useMemo(
    () => products.filter((p) => (form.quantities[p.id] ?? 0) > 0),
    [form.quantities],
  );

  const totalCookies = useMemo(
    () => Object.values(form.quantities).reduce((a, b) => a + b, 0),
    [form.quantities],
  );

  const [cities, setCities] = useState<CityInfo[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citiesError, setCitiesError] = useState(false);
  const citiesCache = useRef<Record<string, CityInfo[]>>({});

  useEffect(() => {
    const state = form.address.state;
    if (!state) return;

    if (citiesCache.current[state]) {
      setCities(citiesCache.current[state]);
      return;
    }

    setCitiesLoading(true);
    setCitiesError(false);

    let cancelled = false;

    fetch(`/api/cities?state=${state}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json() as Promise<{ cities: CityInfo[] }>;
      })
      .then((data) => {
        if (cancelled) return;
        citiesCache.current[state] = data.cities;
        setCities(data.cities);
        setCitiesLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setCitiesError(true);
        setCitiesLoading(false);
      });

    return () => { cancelled = true; };
  }, [form.address.state]);

  const citySuggestions = form.address.state ? cities : [];
  const cityOptions = citySuggestions.map((c) => ({ name: c.city, county: c.county }));

  const totalEstimate = useMemo(() => {
    if (selectedProducts.length === 0) return null;
    const total = selectedProducts.reduce(
      (sum, p) => sum + p.price * (form.quantities[p.id] ?? 0),
      0,
    );
    return `~$${total.toFixed(2)}`;
  }, [selectedProducts, form.quantities]);

  if (submitted) {
    return (
      <RevealOnScroll>
        <Card className="mx-auto max-w-xl">
          <CardContent className="p-8 text-center">
            <h2 className="font-serif text-2xl font-bold text-foreground">
              Thanks for your order!
            </h2>
            <p className="mt-3 text-secondary-foreground">
              We&rsquo;ve received your request and will confirm it shortly. If
              you have urgent questions, reach out on{' '}
              <a
                href={SOCIAL.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:text-primary/80"
              >
                WhatsApp
              </a>{' '}
              or{' '}
              <a
                href={SOCIAL.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:text-primary/80"
              >
                Instagram
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </RevealOnScroll>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-2xl flex-col gap-8"
    >
      {/* Card 1 — Contact Info */}
      <RevealOnScroll>
        <Card>
          <CardContent className="flex flex-col gap-5 p-6 sm:p-8">
            <h3 className="font-serif text-lg font-bold text-foreground">
              Your Contact Info
            </h3>
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">
                Full name <span className="text-primary">*</span>
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
                placeholder="Your name"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">
                  Phone number <span className="text-primary">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  required
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">
                  Email <span className="text-primary">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  required
                  placeholder="hello@example.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </RevealOnScroll>

      {/* Card 2 — Order Details */}
      <RevealOnScroll delay={100}>
        <Card>
          <CardContent className="flex flex-col gap-6 p-6 sm:p-8">
            <h3 className="font-serif text-lg font-bold text-foreground">
              Order Details
            </h3>

            {/* Pickup / Delivery */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-foreground">
                How would you like to receive your order?
              </Label>
              <RadioGroup
                value={form.pickupOrDelivery}
                onValueChange={(value: 'pickup' | 'delivery') =>
                  update('pickupOrDelivery', value)
                }
                className="grid grid-cols-2 gap-3"
              >
                <Label
                  htmlFor="pickup"
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-input bg-background px-4 py-5 text-center transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:[&_svg]:text-primary"
                >
                  <RadioGroupItem value="pickup" id="pickup" className="sr-only" />
                  <Store className="size-6 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Pickup</span>
                </Label>
                <Label
                  htmlFor="delivery"
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-input bg-background px-4 py-5 text-center transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:[&_svg]:text-primary"
                >
                  <RadioGroupItem value="delivery" id="delivery" className="sr-only" />
                  <Truck className="size-6 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Delivery</span>
                </Label>
              </RadioGroup>
            </div>

            {form.pickupOrDelivery === 'delivery' && (
              <fieldset className="flex flex-col gap-4">
                <legend className="text-sm font-medium text-foreground">
                  Delivery address <span className="text-primary">*</span>
                </legend>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="addressLine1">
                    Street address
                  </Label>
                  <Input
                    id="addressLine1"
                    value={form.address.line1}
                    onChange={(e) => updateAddress('line1', e.target.value)}
                    required
                    placeholder="123 Main St"
                    autoComplete="address-line1"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="addressLine2">
                    Apt, suite, unit <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="addressLine2"
                    value={form.address.line2}
                    onChange={(e) => updateAddress('line2', e.target.value)}
                    placeholder="Apt 4B"
                    autoComplete="address-line2"
                  />
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="w-[130px] shrink-0">
                    <Label htmlFor="addressState">State</Label>
                    <Select
                      value={form.address.state}
                      onValueChange={(value) => updateAddress('state', value)}
                    >
                      <SelectTrigger id="addressState" className="px-2">
                        <SelectValue placeholder="State" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            <span className="font-medium">{s.label}</span>
                            <span className="ml-1.5 text-muted-foreground">
                              ({s.value})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-0 flex-1 basis-[160px]">
                    <Label htmlFor="addressCity" className={cn(!form.address.state && 'text-muted-foreground')}>
                      City
                    </Label>
                    <Select
                      value={form.address.city}
                      onValueChange={(value) => updateAddress('city', value)}
                      disabled={!form.address.state || citiesLoading}
                    >
                      <SelectTrigger id="addressCity">
                        {citiesLoading ? (
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="size-3.5 animate-spin" />
                            Loading...
                          </span>
                        ) : (
                          <SelectValue
                            placeholder={
                              citiesError
                                ? 'Failed to load'
                                : form.address.state
                                  ? 'Select city'
                                  : 'Select state first'
                            }
                          />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {cityOptions.map((c) => (
                          <SelectItem key={c.name} value={c.name}>
                            {c.name}
                            {c.county && (
                              <span className="ml-1.5 text-muted-foreground">
                                ({c.county})
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-[120px] shrink-0">
                    <Label htmlFor="addressZip">ZIP</Label>
                    <Input
                      id="addressZip"
                      value={form.address.zip}
                      onChange={(e) => updateAddress('zip', e.target.value)}
                      required
                      placeholder="94102"
                      maxLength={10}
                      autoComplete="postal-code"
                    />
                  </div>
                </div>
              </fieldset>
            )}

            {/* Cookie selection with per-product quantity */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-foreground">
                Select your cookies
              </Label>
              <div className="flex flex-col gap-2">
                {products.map((product) => {
                  const qty = form.quantities[product.id] ?? 0;
                  return (
                    <div
                      key={product.id}
                      className={cn(
                        'flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors',
                        qty > 0
                          ? 'border-primary bg-primary/5'
                          : 'border-input bg-background',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setQuantity(product.id, qty > 0 ? 0 : 1)}
                        className={cn(
                          'flex size-5 shrink-0 items-center justify-center rounded border transition-colors',
                          qty > 0
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-input bg-background',
                        )}
                        aria-label={qty > 0 ? `Remove ${product.name}` : `Add ${product.name}`}
                      >
                        {qty > 0 ? (
                          <Minus className="size-3" />
                        ) : (
                          <Plus className="size-3" />
                        )}
                      </button>
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 font-serif text-sm font-bold text-primary">
                        {product.name.charAt(0)}
                      </div>
                      <div className="flex flex-1 items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {product.name}
                        </span>
                        <span className="text-sm font-semibold text-primary">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>
                      {qty > 0 && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setQuantity(product.id, qty - 1)}
                            className="flex size-7 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:text-foreground"
                            aria-label={`Decrease ${product.name} quantity`}
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium tabular-nums text-foreground">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQuantity(product.id, qty + 1)}
                            className="flex size-7 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:text-foreground"
                            aria-label={`Increase ${product.name} quantity`}
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order summary */}
            {selectedProducts.length > 0 && (
              <div className="rounded-lg bg-muted px-4 py-3">
                <div className="flex flex-col gap-2">
                  {selectedProducts.map((p) => {
                    const qty = form.quantities[p.id] ?? 0;
                    if (qty === 0) return null;
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {p.name}
                          <span className="mx-1 font-medium text-foreground">
                            &times;{qty}
                          </span>
                        </span>
                        <span className="font-medium text-foreground">
                          ${(p.price * qty).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-sm">
                  <span className="font-medium text-foreground">
                    {totalCookies} {totalCookies === 1 ? 'cookie' : 'cookies'}
                  </span>
                  {totalEstimate && (
                    <span className="font-semibold text-primary">
                      {totalEstimate}
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </RevealOnScroll>

      {/* Card 3 — Date & Time */}
      <RevealOnScroll delay={200}>
        <Card>
          <CardContent className="flex flex-col gap-5 p-6 sm:p-8">
            <h3 className="font-serif text-lg font-bold text-foreground">
              Preferred Date &amp; Time
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.preferredDate}
                  onChange={(e) => update('preferredDate', e.target.value)}
                  min={today()}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={form.preferredTime}
                  onChange={(e) => update('preferredTime', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </RevealOnScroll>

      {/* Card 4 — Additional Info */}
      <RevealOnScroll delay={300}>
        <Card>
          <CardContent className="flex flex-col gap-5 p-6 sm:p-8">
            <h3 className="font-serif text-lg font-bold text-foreground">
              Additional Info
            </h3>
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Special notes or requests</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="Any special requests, dietary concerns, or notes..."
              />
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-950/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Allergen notice
                  </p>
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={form.allergyConfirmed}
                      onClick={() => update('allergyConfirmed', !form.allergyConfirmed)}
                      className={cn(
                        'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border transition-colors',
                        form.allergyConfirmed
                          ? 'border-amber-500 bg-amber-500 text-white'
                          : 'border-amber-300 bg-white dark:border-amber-600 dark:bg-amber-950/40',
                      )}
                    >
                      {form.allergyConfirmed && <Check className="size-3.5" />}
                    </button>
                    <Label
                      htmlFor="allergy"
                      className="text-sm leading-relaxed text-amber-700 dark:text-amber-400"
                    >
                      I confirm that I have reviewed the allergen information.
                      Our cookies may contain milk, eggs, wheat, soy, peanuts,
                      or tree nuts. Contact us before ordering if you have food
                      allergies.
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </RevealOnScroll>

      {/* Submit */}
      <div className="flex flex-col gap-4 text-center">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Orders are manually confirmed before preparation. We&rsquo;ll reach
          out via email or phone to confirm your pickup or delivery time.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button type="submit" size="lg">
            Submit Order Request
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a
              href={SOCIAL.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
            >
              Message on WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </form>
  );
}
