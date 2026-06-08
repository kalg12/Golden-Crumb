'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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

  if (submitted) {
    return (
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
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-xl flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-5 p-6 sm:p-8">
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
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <h3 className="mb-4 font-serif text-lg font-bold text-foreground">
            Pickup or Delivery
          </h3>
          <RadioGroup
            value={form.pickupOrDelivery}
            onValueChange={(value: 'pickup' | 'delivery') =>
              update('pickupOrDelivery', value)
            }
            className="flex gap-4"
          >
            <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-3 has-[:checked]:border-primary has-[:checked]:bg-primary/10">
              <RadioGroupItem value="pickup" id="pickup" />
              <Label htmlFor="pickup" className="font-medium text-foreground">
                Pickup
              </Label>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-3 has-[:checked]:border-primary has-[:checked]:bg-primary/10">
              <RadioGroupItem value="delivery" id="delivery" />
              <Label htmlFor="delivery" className="font-medium text-foreground">
                Delivery
              </Label>
            </div>
          </RadioGroup>

          {form.pickupOrDelivery === 'delivery' && (
            <div className="mt-4 flex flex-col gap-2">
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
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <h3 className="mb-4 font-serif text-lg font-bold text-foreground">
            Select Cookies
          </h3>
          <div className="flex flex-col gap-3">
            {products.map((product) => (
              <label
                key={product.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-input bg-background px-4 py-3 transition-colors hover:border-primary/50"
              >
                <Checkbox
                  checked={form.selectedCookies.includes(product.id)}
                  onCheckedChange={() => toggleCookie(product.id)}
                />
                <div className="flex flex-1 items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {product.name}
                  </span>
                  <span className="text-sm font-semibold text-primary">
                    ${product.price.toFixed(2)}
                  </span>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Label htmlFor="quantity">
              Quantity (approx. number of cookies)
            </Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) =>
                update('quantity', Math.max(1, parseInt(e.target.value) || 1))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <h3 className="mb-4 font-serif text-lg font-bold text-foreground">
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

      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Special notes or requests</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Any special requests, dietary concerns, or notes..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <Checkbox
              id="allergy"
              checked={form.allergyConfirmed}
              onCheckedChange={(checked) =>
                update('allergyConfirmed', checked === true)
              }
              required
            />
            <Label
              htmlFor="allergy"
              className="text-sm leading-relaxed text-secondary-foreground"
            >
              I confirm that I have reviewed the allergen information. Our
              cookies may contain milk, eggs, wheat, soy, peanuts, or tree nuts.
              Contact us before ordering if you have food allergies.
            </Label>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
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
    </form>
  );
}
