'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  LogOut,
  MapPin,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutAction } from '@/app/actions/authActions';

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip?: string;
}

export interface OrderData {
  _id: string;
  items: OrderItem[];
  totalPrice: number;
  lat: number;
  lng: number;
  address: Address;
  addressReference?: string;
  preferredDate: string;
  preferredTime: string;
  notes?: string;
  status:
    | 'pending'
    | 'kitchen_prep'
    | 'ready_for_delivery'
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

interface MyOrdersDashboardProps {
  customerName: string;
  initialOrders: OrderData[];
}

interface LeafletMap {
  remove: () => void;
  fitBounds: (bounds: unknown, options?: unknown) => void;
}

interface LeafletMarker {
  remove: () => void;
  addTo: (map: LeafletMap) => LeafletMarker;
  bindPopup: (html: string) => LeafletMarker;
}

interface LeafletPolyline {
  remove: () => void;
  addTo: (map: LeafletMap) => LeafletPolyline;
}

interface LeafletWindow extends Window {
  L?: {
    map: (el: HTMLDivElement | null, options: unknown) => LeafletMap;
    tileLayer: (url: string, options: unknown) => { addTo: (map: LeafletMap) => void };
    divIcon: (options: unknown) => unknown;
    marker: (coords: [number, number], options: unknown) => LeafletMarker;
    polyline: (coords: [number, number][], options: unknown) => LeafletPolyline;
    latLngBounds: (coords: [number, number][]) => unknown;
  };
}

const BAKERY_LAT = 37.7749;
const BAKERY_LNG = -122.4194;

export function MyOrdersDashboard({ customerName, initialOrders }: MyOrdersDashboardProps) {
  const router = useRouter();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    initialOrders.length > 0 ? initialOrders[0]._id : null
  );

  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<LeafletMap | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const bakeryMarkerRef = useRef<LeafletMarker | null>(null);
  const lineRef = useRef<LeafletPolyline | null>(null);

  // Retrieve currently selected order details
  const selectedOrder = initialOrders.find((o) => o._id === selectedOrderId) || null;

  // Handle logout
  const handleLogout = async () => {
    await logoutAction();
    router.push('/');
    router.refresh();
  };

  // Load Leaflet resources dynamically on client mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const win = window as unknown as LeafletWindow;
    if (win.L) {
      setTimeout(() => setMapLoaded(true), 0);
      return;
    }

    const cssId = 'leaflet-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const jsId = 'leaflet-js';
    if (!document.getElementById(jsId)) {
      const script = document.createElement('script');
      script.id = jsId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        setMapLoaded(true);
      };
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (win.L) {
          setMapLoaded(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  // Update Leaflet map rendering on order change
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || !selectedOrder) return;

    const win = window as unknown as LeafletWindow;
    const L = win.L;
    if (!L) return;

    const targetCoords: [number, number] = [selectedOrder.lat, selectedOrder.lng];

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: targetCoords,
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      mapRef.current = map;
    }

    const map = mapRef.current;

    // Clear previous elements
    if (markerRef.current) markerRef.current.remove();
    if (bakeryMarkerRef.current) bakeryMarkerRef.current.remove();
    if (lineRef.current) lineRef.current.remove();

    // Create custom icons
    const bakeryIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-7 h-7 bg-amber-500/25 rounded-full animate-ping"></div>
          <div class="relative w-6 h-6 bg-amber-500 border-2 border-white rounded-full flex items-center justify-center shadow font-black text-white text-[9px]">
            ★
          </div>
        </div>
      `,
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const destIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-7 h-7 bg-[#D49A55]/25 rounded-full animate-pulse"></div>
          <div class="relative w-6 h-6 bg-primary border-2 border-white rounded-full flex items-center justify-center shadow font-bold text-white text-[9px]">
            🍪
          </div>
        </div>
      `,
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    // Place Markers
    bakeryMarkerRef.current = L.marker([BAKERY_LAT, BAKERY_LNG], { icon: bakeryIcon })
      .addTo(map)
      .bindPopup(
        `<div style="font-family:sans-serif; font-size:11px;"><strong>Golden Crumb Bakery Hub</strong></div>`
      );

    markerRef.current = L.marker(targetCoords, { icon: destIcon })
      .addTo(map)
      .bindPopup(
        `<div style="font-family:sans-serif; font-size:11px;"><strong>Your Delivery Destination</strong><br/>${selectedOrder.address.line1}</div>`
      );

    // Draw route vector line
    lineRef.current = L.polyline([[BAKERY_LAT, BAKERY_LNG], targetCoords], {
      color: '#D49A55',
      weight: 3.5,
      opacity: 0.8,
      dashArray: '5, 8',
    }).addTo(map);

    // Adjust view bounding box
    const bounds = L.latLngBounds([[BAKERY_LAT, BAKERY_LNG], targetCoords]);
    map.fitBounds(bounds, { padding: [50, 50] });

  }, [mapLoaded, selectedOrderId, selectedOrder]);

  // Clean map resource on destroy
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Compute status timeline steps states
  const getStatusStepIndex = (status: string) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'kitchen_prep':
        return 1;
      case 'ready_for_delivery':
        return 2;
      case 'out_for_delivery':
        return 3;
      case 'delivered':
        return 4;
      default:
        return -1;
    }
  };

  const steps = [
    { title: 'Requested', desc: 'Bakers review order request', icon: Clock },
    { title: 'Baking', desc: 'Cookies baking in ovens', icon: Package },
    { title: 'Ready', desc: 'Baked, cooled & packed', icon: Package },
    { title: 'Courier Dispatched', desc: 'Out for delivery in SF', icon: Truck },
    { title: 'Delivered', desc: 'Arrived at your door!', icon: CheckCircle2 },
  ];

  const currentStepIdx = selectedOrder ? getStatusStepIndex(selectedOrder.status) : -1;

  return (
    <div className="flex flex-col gap-6 text-[#4A2718] dark:text-[#F7EADD]">
      {/* Header */}
      <header className="flex items-center justify-between bg-[#FFF7EC] dark:bg-[#5A3019] p-4 sm:p-5 rounded-2xl border border-primary/10 shadow-sm">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight">
            Hello, <span className="text-[#D49A55]">{customerName}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor and track your artisan cookie requests live
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="px-3 py-2 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <LogOut className="size-4" /> Log Out
        </button>
      </header>

      {initialOrders.length === 0 ? (
        <div className="bg-[#FFF7EC] dark:bg-[#5A3019] border border-dashed border-primary/20 rounded-2xl py-16 px-4 text-center flex flex-col items-center gap-3">
          <Package className="size-12 text-[#D49A55] opacity-60" />
          <p className="font-serif font-bold text-lg">No orders found</p>
          <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
            You haven&rsquo;t submitted any cookie requests yet. Place your first order to begin tracking!
          </p>
          <a
            href="/order"
            className="mt-2 px-4 py-2 bg-[#D49A55] text-white rounded-xl text-xs font-bold shadow-sm"
          >
            Order Cookies Now
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Orders History List */}
          <div className="flex flex-col gap-4">
            <h3 className="font-serif text-base font-bold tracking-tight px-1">
              Your Orders Request History
            </h3>
            <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
              {initialOrders.map((o) => {
                const isSelected = o._id === selectedOrderId;
                const itemsCount = o.items.reduce((acc, curr) => acc + curr.quantity, 0);
                return (
                  <button
                    key={o._id}
                    onClick={() => setSelectedOrderId(o._id)}
                    className={cn(
                      'text-left p-4 rounded-2xl border transition-all flex flex-col gap-2 shadow-sm',
                      isSelected
                        ? 'bg-[#D49A55]/15 border-[#D49A55]/40 shadow-inner'
                        : 'bg-[#FFF7EC] border-primary/5 hover:bg-[#FFF7EC]/60 dark:bg-[#5A3019] dark:hover:bg-[#5A3019]/60'
                    )}
                  >
                    <div className="flex items-center justify-between w-full border-b border-primary/5 pb-1.5">
                      <span className="font-mono font-bold text-[10px] text-muted-foreground">
                        Order #{o._id.substring(o._id.length - 6)}
                      </span>
                      <span className="text-[10px] text-[#D49A55] font-bold">
                        {o.preferredDate}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs leading-none">
                      <span className="text-muted-foreground">
                        {itemsCount} {itemsCount === 1 ? 'cookie' : 'cookies'}
                      </span>
                      <span className="font-mono font-bold text-sm">
                        ${o.totalPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      {o.status === 'delivered' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-500/10 text-green-600 capitalize">
                          Delivered
                        </span>
                      ) : o.status === 'cancelled' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-600 capitalize">
                          Cancelled
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 capitalize flex items-center gap-1">
                          <Clock className="size-3 animate-spin" /> {o.status.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right 2 Columns: Selected Order Status Tracker */}
          {selectedOrder && (
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Order Status Stepper Card */}
              <div className="bg-[#FFF7EC] dark:bg-[#5A3019] p-6 rounded-2xl border border-primary/10 shadow-sm flex flex-col gap-6">
                <div>
                  <h3 className="font-serif text-lg font-bold">
                    Order request #{selectedOrder._id.substring(selectedOrder._id.length - 8)}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Live cookie status timeline and delivery information
                  </p>
                </div>

                {selectedOrder.status === 'cancelled' ? (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-xl flex items-start gap-3">
                    <XCircle className="size-5 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm">Request Cancelled</h4>
                      <p className="text-xs leading-relaxed mt-0.5">
                        This order request has been cancelled. If you believe this was an error, please contact us on WhatsApp.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Horizontal timeline stepper for desktop, vertical for mobile */
                  <div className="flex flex-col md:flex-row items-start justify-between gap-6 md:gap-4 relative">
                    {steps.map((st, idx) => {
                      const Icon = st.icon;
                      const isCompleted = idx < currentStepIdx;
                      const isActive = idx === currentStepIdx;
                      return (
                        <div
                          key={idx}
                          className="flex flex-row md:flex-col items-center md:items-center gap-3.5 md:text-center md:flex-1 relative z-10"
                        >
                          <div
                            className={cn(
                              'size-9 rounded-full flex items-center justify-center border-2 transition-all shrink-0',
                              isCompleted
                                ? 'bg-green-600 border-green-600 text-white'
                                : isActive
                                ? 'bg-[#D49A55] border-[#D49A55] text-white animate-pulse'
                                : 'bg-[#F8EBDD] dark:bg-[#64371F] border-[#D49A55]/30 text-muted-foreground'
                            )}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="size-5" />
                            ) : (
                              <Icon className="size-4" />
                            )}
                          </div>
                          <div className="leading-tight">
                            <span
                              className={cn(
                                'text-xs font-bold block',
                                isActive ? 'text-[#D49A55]' : 'text-inherit'
                              )}
                            >
                              {st.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5 max-w-[120px] md:mx-auto">
                              {st.desc}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Items & Address Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-primary/5 pt-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                      Baking list:
                    </span>
                    <ul className="flex flex-col gap-1.5 text-xs">
                      {selectedOrder.items.map((it, idx) => (
                        <li key={idx} className="flex justify-between items-center font-medium">
                          <span>{it.name}</span>
                          <span className="font-mono font-bold text-[#D49A55]">
                            &times;{it.quantity}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                      Delivery Window:
                    </span>
                    <div className="text-xs flex flex-col gap-1">
                      <p className="font-semibold text-[#D49A55] flex items-center gap-1.5">
                        <Calendar className="size-3.5" /> {selectedOrder.preferredDate} (
                        {selectedOrder.preferredTime})
                      </p>
                      <p className="font-medium text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="size-3.5" /> {selectedOrder.address.line1}
                      </p>
                      {selectedOrder.addressReference && (
                        <p className="text-[10px] italic bg-[#F8EBDD] dark:bg-[#64371F] p-2 rounded-lg text-muted-foreground leading-normal mt-1 border border-primary/5">
                          Landmark: {selectedOrder.addressReference}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Map view for active deliveries */}
              {selectedOrder.status !== 'cancelled' && (
                <div className="bg-[#FFF7EC] dark:bg-[#5A3019] p-6 rounded-2xl border border-primary/10 shadow-sm flex flex-col gap-4">
                  <div>
                    <h4 className="font-serif text-base font-bold flex items-center gap-2">
                      <MapPin className="size-4.5 text-[#D49A55]" /> Delivery Transit Route
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Visualizing shipping path vectors in San Francisco
                    </p>
                  </div>
                  <div className="border border-primary/10 rounded-xl overflow-hidden shadow-inner h-64 bg-background relative z-0">
                    <div ref={mapContainerRef} className="h-full w-full" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
