'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Store, Truck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { RevealOnScroll } from '@/components/shared/RevealOnScroll';
import { SOCIAL } from '@/lib/constants';
import { products } from '@/data/products';

interface FormData {
  name: string;
  phone: string;
  email: string;
  pickupOrDelivery: 'pickup' | 'delivery';
  deliveryAddress: string;
  selectedCookies: string[];
  quantity: number;
  preferredDate: string;
  preferredTime: string;
  notes: string;
  allergyConfirmed: boolean;
}

const initialForm: FormData = {
  name: '',
  phone: '',
  email: '',
  pickupOrDelivery: 'pickup',
  deliveryAddress: '',
  selectedCookies: [],
  quantity: 1,
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

  const toggleCookie = (id: string) => {
    setForm((prev) => ({
      ...prev,
      selectedCookies: prev.selectedCookies.includes(id)
        ? prev.selectedCookies.filter((c) => c !== id)
        : [...prev.selectedCookies, id],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const selectedProducts = useMemo(
    () => products.filter((p) => form.selectedCookies.includes(p.id)),
    [form.selectedCookies],
  );

  const totalEstimate = useMemo(() => {
    if (selectedProducts.length === 0 || form.quantity < 1) return null;
    const qty = form.quantity;
    if (selectedProducts.length === 1) {
      return `~$${(selectedProducts[0].price * qty).toFixed(2)}`;
    }
    const min = Math.min(...selectedProducts.map((p) => p.price)) * qty;
    const max = Math.max(...selectedProducts.map((p) => p.price)) * qty;
    if (min === max) return `~$${min.toFixed(2)}`;
    return `~$${min.toFixed(2)} – $${max.toFixed(2)}`;
  }, [selectedProducts, form.quantity]);

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
              <div className="flex flex-col gap-2">
                <Label htmlFor="deliveryAddress">
                  Delivery address <span className="text-primary">*</span>
                </Label>
                <Textarea
                  id="deliveryAddress"
                  value={form.deliveryAddress}
                  onChange={(e) => update('deliveryAddress', e.target.value)}
                  required
                  placeholder="Street, city, ZIP code"
                />
              </div>
            )}

            {/* Cookie selection */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-foreground">
                Select your cookies
              </Label>
              <div className="flex flex-col gap-2">
                {products.map((product) => {
                  const isSelected = form.selectedCookies.includes(product.id);
                  return (
                    <Label
                      key={product.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-input bg-background px-4 py-3 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleCookie(product.id)}
                      />
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 font-serif text-sm font-bold text-primary">
                        {product.name.charAt(0)}
                      </div>
                      <div className="flex flex-1 items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {product.name}
                        </span>
                        <span className="text-sm font-semibold text-primary">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>
                    </Label>
                  );
                })}
              </div>
            </div>

            {/* Quantity + running total */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="quantity">
                Total cookies
              </Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) =>
                  update('quantity', Math.max(1, parseInt(e.target.value) || 1))
                }
                className="max-w-[120px]"
              />
            </div>

            {selectedProducts.length > 0 && form.quantity > 0 && (
              <div className="rounded-lg bg-muted px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {selectedProducts.length}
                  </span>{' '}
                  {selectedProducts.length === 1 ? 'type' : 'types'} selected
                  <span className="mx-1.5">&middot;</span>
                  <span className="font-medium text-foreground">
                    {form.quantity}
                  </span>{' '}
                  {form.quantity === 1 ? 'cookie' : 'cookies'}
                  {totalEstimate && (
                    <>
                      <span className="mx-1.5">&middot;</span>
                      <span className="font-semibold text-primary">
                        {totalEstimate}
                      </span>
                    </>
                  )}
                </p>
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
                    <Checkbox
                      id="allergy"
                      checked={form.allergyConfirmed}
                      onCheckedChange={(checked) =>
                        update('allergyConfirmed', checked === true)
                      }
                      required
                      className="mt-0.5"
                    />
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
