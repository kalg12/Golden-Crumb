"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CalendarIcon, Check, MapPin, Minus, Plus, Truck } from "lucide-react";
import { format, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SOCIAL } from "@/lib/constants";
import { products } from "@/data/products";
import { cn } from "@/lib/utils";

interface LeafletIcon {
  _leaflet_id?: number;
}

interface LeafletMarker {
  setLatLng: (coords: [number, number]) => void;
  getLatLng: () => { lat: number; lng: number };
  on: (event: string, callback: () => void) => void;
}

interface LeafletMap {
  remove: () => void;
  on: (
    event: string,
    callback: (e: { latlng: { lat: number; lng: number } }) => void
  ) => void;
}

interface LeafletWindow extends Window {
  L?: {
    map: (el: HTMLDivElement, options: { center: number[]; zoom: number; zoomControl: boolean }) => LeafletMap;
    tileLayer: (url: string, options: { attribution: string }) => { addTo: (map: LeafletMap) => void };
    divIcon: (options: { html: string; className: string; iconSize: number[]; iconAnchor: number[] }) => LeafletIcon;
    marker: (coords: number[], options: { icon: LeafletIcon; draggable: boolean }) => {
      addTo: (map: LeafletMap) => LeafletMarker;
    };
  };
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
  pickupOrDelivery: "pickup" | "delivery";
  address: AddressFields;
  addressReference?: string;
  quantities: Record<string, number>;
  preferredDate: string;
  preferredTime: string;
  notes: string;
  allergyConfirmed: boolean;
}

const initialAddress: AddressFields = {
  line1: "",
  line2: "",
  city: "San Francisco",
  state: "CA",
  zip: "",
};

const initialQuantities = Object.fromEntries(products.map((p) => [p.id, 0]));

const initialForm: FormData = {
  name: "",
  phone: "",
  email: "",
  pickupOrDelivery: "delivery",
  address: initialAddress,
  addressReference: "",
  quantities: initialQuantities,
  preferredDate: "",
  preferredTime: "",
  notes: "",
  allergyConfirmed: false,
};

const TIME_SLOTS = [
  { value: "09:00", label: "09:00 AM" },
  { value: "09:30", label: "09:30 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "10:30", label: "10:30 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "11:30", label: "11:30 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "12:30", label: "12:30 PM" },
  { value: "13:00", label: "01:00 PM" },
  { value: "13:30", label: "01:30 PM" },
  { value: "14:00", label: "02:00 PM" },
  { value: "14:30", label: "02:30 PM" },
  { value: "15:00", label: "03:00 PM" },
  { value: "15:30", label: "03:30 PM" },
  { value: "16:00", label: "04:00 PM" },
  { value: "16:30", label: "04:30 PM" },
  { value: "17:00", label: "05:00 PM" },
  { value: "17:30", label: "05:30 PM" },
  { value: "18:00", label: "06:00 PM" },
];

const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
};

const disableDate = (date: Date) => {
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  if (date < todayDate) return true;
  return !isWeekend(date);
};

export function OrderForm() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateAddress = (field: keyof AddressFields, value: string) => {
    setForm((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  const setQuantity = (id: string, qty: number) => {
    setForm((prev) => ({
      ...prev,
      quantities: { ...prev.quantities, [id]: Math.max(0, qty) },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.preferredDate) {
      setValidationError("Please select a preferred delivery date.");
      return;
    }
    if (!form.preferredTime) {
      setValidationError("Please select a preferred delivery time.");
      return;
    }
    setValidationError(null);
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

  const totalEstimate = useMemo(() => {
    if (selectedProducts.length === 0) return null;
    const total = selectedProducts.reduce(
      (sum, p) => sum + p.price * (form.quantities[p.id] ?? 0),
      0,
    );
    return `~$${total.toFixed(2)}`;
  }, [selectedProducts, form.quantities]);

  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Dynamically load Leaflet styles and script on client side
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ((window as unknown as LeafletWindow).L) {
      setTimeout(() => setMapLoaded(true), 0);
      return;
    }

    const cssId = "leaflet-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const jsId = "leaflet-js";
    if (!document.getElementById(jsId)) {
      const script = document.createElement("script");
      script.id = jsId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => {
        setMapLoaded(true);
      };
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if ((window as unknown as LeafletWindow).L) {
          setMapLoaded(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  // Initialize Map and handle marker placement/dragging
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || mapRef.current) return;

    const L = (window as unknown as LeafletWindow).L;
    if (!L) return;

    // Centered on San Francisco (latitude: 37.7749, longitude: -122.4194)
    const sfCoords = [37.7749, -122.4194];

    const map = L.map(mapContainerRef.current, {
      center: sfCoords,
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Custom marker icon using inline SVG and Tailwind styles to match the brand color
    const customIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 bg-primary/30 rounded-full animate-ping"></div>
          <div class="relative w-6 h-6 bg-primary border-2 border-white rounded-full flex items-center justify-center shadow-md">
            <div class="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>
      `,
      className: "",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker(sfCoords, {
      icon: customIcon,
      draggable: true,
    }).addTo(map);

    mapRef.current = map;
    markerRef.current = marker;

    const handleLocationChange = async (lat: number, lng: number) => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
        );
        if (response.ok) {
          const data = await response.json();
          const addressData = (data as { address?: { road?: string; house_number?: string } }).address;
          const road = addressData?.road || "";
          const houseNumber = addressData?.house_number || "";
          const streetAddress = houseNumber ? `${houseNumber} ${road}` : road;
          if (streetAddress) {
            updateAddress("line1", streetAddress);
          }
        }
      } catch (err) {
        console.error("Geocoding failed:", err);
      }
    };

    map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      handleLocationChange(lat, lng);
    });

    marker.on("dragend", () => {
      const position = marker.getLatLng();
      handleLocationChange(position.lat, position.lng);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapLoaded]);

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
              you have urgent questions, reach out on{" "}
              <a
                href={SOCIAL.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:text-primary/80"
              >
                WhatsApp
              </a>{" "}
              or{" "}
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
                onChange={(e) => update("name", e.target.value)}
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
                  onChange={(e) => update("phone", e.target.value)}
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
                  onChange={(e) => update("email", e.target.value)}
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

            {/* Delivery Alert / Badge */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex gap-3.5 items-start">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Truck className="size-5" />
              </div>
              <div className="flex-1 min-w-0 font-sans">
                <p className="text-sm font-semibold text-foreground">
                  Hand-Delivered in San Francisco
                </p>
                <p className="mt-1 text-xs text-secondary-foreground leading-relaxed">
                  We offer delivery exclusively within the city of San Francisco, California.
                  Your artisan cookies will arrive fresh and direct to your door.
                </p>
              </div>
            </div>

            <fieldset className="flex flex-col gap-4">
              <legend className="text-sm font-medium text-foreground">
                Delivery Address <span className="text-primary">*</span>
              </legend>

              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <MapPin className="size-4 text-primary" /> Pin your delivery location
                </Label>
                <div
                  ref={mapContainerRef}
                  className="h-64 w-full rounded-xl border border-input overflow-hidden shadow-inner z-0"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Drag the pin or click on the map to automatically fill your street address.
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="addressLine1">Street address</Label>
                <Input
                  id="addressLine1"
                  value={form.address.line1}
                  onChange={(e) => updateAddress("line1", e.target.value)}
                  required
                  placeholder="123 Main St"
                  autoComplete="address-line1"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="addressLine2">
                    Apt, suite, unit{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="addressLine2"
                    value={form.address.line2}
                    onChange={(e) => updateAddress("line2", e.target.value)}
                    placeholder="Apt 4B"
                    autoComplete="address-line2"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>City & State</Label>
                  <Input
                    value="San Francisco, CA"
                    disabled
                    className="bg-muted text-muted-foreground cursor-not-allowed font-medium"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="addressReference">
                  Delivery instructions / Landmarks{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="addressReference"
                  value={form.addressReference || ""}
                  onChange={(e) => update("addressReference", e.target.value)}
                  placeholder="e.g., ring bell #4, blue gate, drop at front desk"
                />
              </div>
            </fieldset>

            {/* Cookie selection with per-product quantity */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-foreground">
                Select your cookies
              </Label>
              <div className="flex flex-col gap-3">
                {products.map((product) => {
                  const qty = form.quantities[product.id] ?? 0;
                  return (
                    <div
                      key={product.id}
                      className={cn(
                        'rounded-xl border p-4 transition-colors sm:flex sm:items-center sm:gap-4 sm:p-5',
                        qty > 0
                          ? 'border-primary bg-primary/5'
                          : 'border-input bg-background',
                      )}
                    >
                      {/* Top row: icon + name + price (mobile), single row on desktop */}
                      <div className="flex items-center gap-3 sm:flex-1">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 font-serif text-sm font-bold text-primary">
                          {product.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {product.name}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-primary">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>

                      {/* Bottom row: quantity selector */}
                      <div className="mt-3 flex justify-end sm:mt-0 sm:shrink-0">
                        <div className="flex items-center gap-2 rounded-xl border bg-background px-1 py-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-lg"
                            className="rounded-full"
                            disabled={qty === 0}
                            onClick={() => setQuantity(product.id, qty - 1)}
                            aria-label={`Decrease ${product.name} quantity`}
                          >
                            <Minus />
                          </Button>
                          <span className="flex min-w-8 items-center justify-center text-sm font-semibold tabular-nums text-foreground">
                            {qty}
                          </span>
                          <Button
                            type="button"
                            variant="default"
                            size="icon-lg"
                            className="rounded-full"
                            onClick={() => setQuantity(product.id, qty + 1)}
                            aria-label={`Increase ${product.name} quantity`}
                          >
                            <Plus />
                          </Button>
                        </div>
                      </div>
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
                    {totalCookies} {totalCookies === 1 ? "cookie" : "cookies"}
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
              Preferred Delivery Date &amp; Time
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>
                  Delivery date <span className="text-primary">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal px-3 py-2 h-10 border border-input rounded-md bg-background text-sm",
                        !form.preferredDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {form.preferredDate ? (
                        format(parseISO(form.preferredDate), "PPP")
                      ) : (
                        <span>Select delivery date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.preferredDate ? parseISO(form.preferredDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const yyyy = date.getFullYear();
                          const mm = String(date.getMonth() + 1).padStart(2, "0");
                          const dd = String(date.getDate()).padStart(2, "0");
                          update("preferredDate", `${yyyy}-${mm}-${dd}`);
                          if (validationError) setValidationError(null);
                        }
                      }}
                      disabled={disableDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="time">
                  Delivery time <span className="text-primary">*</span>
                </Label>
                <Select
                  value={form.preferredTime}
                  onValueChange={(value) => {
                    update("preferredTime", value);
                    if (validationError) setValidationError(null);
                  }}
                >
                  <SelectTrigger id="time" className="w-full">
                    <SelectValue placeholder="Select delivery time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              Please specify when you would like to receive your cookies. We deliver within San Francisco on weekends (Saturday &amp; Sunday) between 9:00 AM and 6:00 PM.
            </p>
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
                onChange={(e) => update("notes", e.target.value)}
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
                      onClick={() =>
                        update("allergyConfirmed", !form.allergyConfirmed)
                      }
                      className={cn(
                        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
                        form.allergyConfirmed
                          ? "border-amber-500 bg-amber-500 text-white"
                          : "border-amber-300 bg-white dark:border-amber-600 dark:bg-amber-950/40",
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
        {validationError && (
          <div className="mx-auto max-w-md rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex gap-3 items-center justify-center text-left">
            <AlertTriangle className="size-5 text-destructive shrink-0" />
            <p className="text-sm font-medium text-destructive">{validationError}</p>
          </div>
        )}
        <p className="text-sm leading-relaxed text-muted-foreground">
          Orders are manually confirmed before preparation. We&rsquo;ll reach
          out via email or phone to confirm your delivery details and time.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button type="submit" size="lg">
            Submit Order Request
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a href={SOCIAL.whatsapp} target="_blank" rel="noopener noreferrer">
              Message on WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </form>
  );
}
