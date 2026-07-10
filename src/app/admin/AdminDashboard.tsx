'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  TrendingUp,
  Users,
  ShoppingBag,
  Clock,
  Printer,
  MapPin,
  CheckCircle,
  Truck,
  RotateCcw,
  Search,
  DollarSign,
  User,
  Phone,
  Mail,
  Navigation,
  X,
  Shield,
  UserPlus,
  Trash2,
  Pencil,
  LogOut,
  AlertTriangle,
  Check,
  Send,
  Settings,
  Eye,
  Code,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  startPreparation,
  completePreparation,
  updateOrderStatus,
  toggleLabelPrinted,
  getDashboardData,
  getTodayDeliveries,
} from '@/app/actions/dbActions';
import {
  logoutAction,
  getStaffUsersAction,
  createStaffUserAction,
  updateStaffUserAction,
  deleteStaffUserAction,
} from '@/app/actions/authActions';
import {
  updateEmailSettingsAction,
  sendTestEmailAction,
  resetEmailSettingsAction,
} from '@/app/actions/emailActions';
import { updateSiteSettingsAction } from '@/app/actions/settingsActions';
import type { SiteContactSettings } from '@/lib/siteSettings';

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
  customerId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
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
  labelPrinted: boolean;
  prepStartedAt?: string | null;
  prepCompletedAt?: string | null;
  prepDuration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerData {
  _id: string;
  name: string;
  phone: string;
  email: string;
  totalSpent: number;
  orderCount: number;
  orders: string[];
  createdAt: string;
}

interface SalesHistoryItem {
  date: string;
  amount: number;
}

export interface RouteStop extends OrderData {
  distanceFromLastStop: number;
}

interface StaffUser {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'kitchen' | 'courier';
  createdAt: string;
}

interface AdminDashboardProps {
  initialStats: {
    totalRevenue: number;
    activeOrders: number;
    totalOrders: number;
    totalCustomers: number;
  };
  initialOrders: OrderData[];
  initialCustomers: CustomerData[];
  salesHistory: SalesHistoryItem[];
  initialRoute: RouteStop[];
  bakeryCoords: { lat: number; lng: number };
  currentUser: {
    name: string;
    email: string;
    role: 'admin' | 'kitchen' | 'courier';
  };
  initialStaffUsers: StaffUser[];
  initialEmailSettings: any;
  initialSiteSettings: SiteContactSettings;
  initialTab?: string;
}

// Map custom marker icons type declaration for window context
interface LeafletWindow extends Window {
  L?: {
    map: (el: HTMLDivElement | null, options: Record<string, unknown>) => {
      remove: () => void;
      fitBounds: (bounds: unknown, options?: Record<string, unknown>) => void;
    };
    tileLayer: (url: string, options: Record<string, unknown>) => { addTo: (map: unknown) => void };
    divIcon: (options: Record<string, unknown>) => unknown;
    marker: (coords: [number, number], options: Record<string, unknown>) => {
      addTo: (map: unknown) => { bindPopup: (html: string) => { remove: () => void } };
    };
    polyline: (coords: [number, number][], options: Record<string, unknown>) => {
      addTo: (map: unknown) => { remove: () => void };
    };
    latLngBounds: (coords: [number, number][]) => unknown;
  };
}

export function AdminDashboard({
  initialStats,
  initialOrders,
  initialCustomers,
  salesHistory,
  initialRoute,
  bakeryCoords,
  currentUser,
  initialStaffUsers,
  initialEmailSettings,
  initialSiteSettings,
  initialTab,
}: AdminDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Roles toggler: admin, kitchen, courier, staff, email_settings, site_settings
  const [activeRole, setActiveRole] = useState<'admin' | 'kitchen' | 'courier' | 'staff' | 'email_settings' | 'site_settings'>(() => {
    const validTabs = ['admin', 'kitchen', 'courier', 'staff', 'email_settings', 'site_settings'];
    if (initialTab && validTabs.includes(initialTab)) {
      if (currentUser.role === 'admin' || initialTab === currentUser.role) {
        return initialTab as any;
      }
    }
    return currentUser.role === 'admin' ? 'admin' : currentUser.role;
  });

  // Sync state if URL search param 'tab' changes (e.g. browser back/forward buttons)
  useEffect(() => {
    const tab = searchParams.get('tab');
    const validTabs = ['admin', 'kitchen', 'courier', 'staff', 'email_settings', 'site_settings'];
    if (tab && validTabs.includes(tab)) {
      if (currentUser.role === 'admin' || tab === currentUser.role) {
        setActiveRole(tab as any);
      }
    }
  }, [searchParams, currentUser.role]);

  // Set default tab parameter in URL if it is not present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('tab')) {
      const defaultTab = currentUser.role === 'admin' ? 'admin' : currentUser.role;
      params.set('tab', defaultTab);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [router, pathname, currentUser.role]);

  // Update tab in state and URL search params
  const handleTabChange = (tab: 'admin' | 'kitchen' | 'courier' | 'staff' | 'email_settings' | 'site_settings') => {
    setActiveRole(tab);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Local data states that sync with server actions
  const [stats, setStats] = useState(initialStats);
  const [orders, setOrders] = useState<OrderData[]>(initialOrders);
  const [customers, setCustomers] = useState<CustomerData[]>(initialCustomers);
  const [history, setHistory] = useState<SalesHistoryItem[]>(salesHistory);
  const [route, setRoute] = useState<RouteStop[]>(initialRoute);

  // Calculate active kitchen prep orders count for switcher badge notification
  const kitchenPrepCount = useMemo(() => {
    return orders.filter((o) => o.status === 'kitchen_prep').length;
  }, [orders]);

  // Selected customer for CRM details pane
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Kitchen label printer modal simulation
  const [printingOrder, setPrintingOrder] = useState<OrderData | null>(null);

  // Search & Filters states for Admin view
  const [orderSearch, setOrderSearch] = useState('');
  const [crmSearch, setCrmSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Loading flag for backend refreshing
  const [loading, setLoading] = useState(false);

  // Handle logout
  const handleLogout = async () => {
    await logoutAction();
    router.push('/');
    router.refresh();
  };

  // Function to refresh dashboard data from database
  const refreshData = async () => {
    setLoading(true);
    try {
      const res = await getDashboardData();
      if (res.success && res.stats) {
        setStats(res.stats);
        setOrders(res.orders as OrderData[]);
        setCustomers(res.customers as CustomerData[]);
        if (res.salesHistory) {
          setHistory(res.salesHistory);
        }
      }
      const routeRes = await getTodayDeliveries();
      if (routeRes.success && routeRes.route) {
        setRoute(routeRes.route as RouteStop[]);
      }
    } catch (err) {
      console.error('Failed to sync data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Poll database every 10 seconds to keep KDS & Map live
  useEffect(() => {
    const timer = setInterval(() => {
      refreshData();
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Update order status trigger helper
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setLoading(true);
    try {
      let res;
      if (newStatus === 'kitchen_prep') {
        res = await startPreparation(orderId);
      } else if (newStatus === 'ready_for_delivery') {
        res = await completePreparation(orderId);
      } else {
        res = await updateOrderStatus(orderId, newStatus);
      }

      if (res.success) {
        await refreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle label printed status helper
  const handleToggleLabel = async (orderId: string) => {
    try {
      const res = await toggleLabelPrinted(orderId);
      if (res.success) {
        await refreshData();
        // Update printing modal instance state if open
        if (printingOrder && printingOrder._id === orderId) {
          setPrintingOrder((prev) => (prev ? { ...prev, labelPrinted: !prev.labelPrinted } : null));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered orders list for Admin
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o._id.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.customerPhone.includes(orderSearch);
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, orderSearch, statusFilter]);

  // Filtered customers list for Admin CRM
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      return (
        c.name.toLowerCase().includes(crmSearch.toLowerCase()) ||
        c.email.toLowerCase().includes(crmSearch.toLowerCase()) ||
        c.phone.includes(crmSearch)
      );
    });
  }, [customers, crmSearch]);

  // Active customer for CRM detail pane
  const activeCustomer = useMemo(() => {
    return customers.find((c) => c._id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Active customer's order history details
  const activeCustomerOrders = useMemo(() => {
    if (!activeCustomer) return [];
    return orders.filter((o) => o.customerId === activeCustomer._id);
  }, [orders, activeCustomer]);

  return (
    <div className="flex flex-col gap-6 font-sans text-[#4A2718] dark:text-[#F7EADD]">
      {/* Role SWITCHER Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#FFF7EC] dark:bg-[#482612] p-4 rounded-2xl shadow-sm border border-primary/10">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">
            Golden Crumb · <span className="text-[#D49A55]">HQ Portal</span>
          </h1>
          <p className="text-xs text-[#4A2718]/70 dark:text-[#F7EADD]/70 mt-0.5">
            Logged in as <strong className="text-inherit">{currentUser.name}</strong> ({currentUser.role.toUpperCase()})
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {currentUser.role === 'admin' ? (
            <>
              <button
                onClick={() => handleTabChange('admin')}
                className={cn(
                  'px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-sm',
                  activeRole === 'admin'
                    ? 'bg-[#D49A55] text-[#FFF7EC]'
                    : 'bg-[#F8EBDD] dark:bg-[#5A3019] hover:bg-[#D49A55]/10 text-inherit border border-[#D49A55]/20'
                )}
              >
                <TrendingUp className="size-4" /> Admin Dashboard
              </button>
              <button
                onClick={() => handleTabChange('kitchen')}
                className={cn(
                  'px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-sm relative overflow-visible',
                  activeRole === 'kitchen'
                    ? 'bg-[#D49A55] text-[#FFF7EC]'
                    : 'bg-[#F8EBDD] dark:bg-[#5A3019] hover:bg-[#D49A55]/10 text-inherit border border-[#D49A55]/20'
                )}
              >
                <Clock className="size-4" /> Kitchen Screen (KDS)
                {kitchenPrepCount > 0 && (
                  <span className="relative flex items-center justify-center ml-1">
                    <span className={cn(
                      "animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full opacity-75",
                      activeRole === 'kitchen' ? "bg-[#FFF7EC]" : "bg-[#D49A55]"
                    )}></span>
                    <span className={cn(
                      "relative inline-flex items-center justify-center h-4.5 min-w-4.5 px-1.5 rounded-full text-[9px] font-extrabold shadow-sm border transition-all duration-300 animate-pulse",
                      activeRole === 'kitchen'
                        ? "bg-[#FFF7EC] text-[#D49A55] border-[#FFF7EC]/20"
                        : "bg-[#D49A55] text-[#FFF7EC] border-[#D49A55]/20"
                    )}>
                      {kitchenPrepCount}
                    </span>
                  </span>
                )}
              </button>
              <button
                onClick={() => handleTabChange('courier')}
                className={cn(
                  'px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-sm',
                  activeRole === 'courier'
                    ? 'bg-[#D49A55] text-[#FFF7EC]'
                    : 'bg-[#F8EBDD] dark:bg-[#5A3019] hover:bg-[#D49A55]/10 text-inherit border border-[#D49A55]/20'
                )}
              >
                <Truck className="size-4" /> Courier Routing
              </button>
              <button
                onClick={() => handleTabChange('staff')}
                className={cn(
                  'px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-sm',
                  activeRole === 'staff'
                    ? 'bg-[#D49A55] text-[#FFF7EC]'
                    : 'bg-[#F8EBDD] dark:bg-[#5A3019] hover:bg-[#D49A55]/10 text-inherit border border-[#D49A55]/20'
                )}
              >
                <Shield className="size-4" /> Staff & Permissions
              </button>
              <button
                onClick={() => handleTabChange('email_settings')}
                className={cn(
                  'px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-sm',
                  activeRole === 'email_settings'
                    ? 'bg-[#D49A55] text-[#FFF7EC]'
                    : 'bg-[#F8EBDD] dark:bg-[#5A3019] hover:bg-[#D49A55]/10 text-inherit border border-[#D49A55]/20'
                )}
              >
                <Mail className="size-4" /> Email Config
              </button>
              <button
                onClick={() => handleTabChange('site_settings')}
                className={cn(
                  'px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-sm',
                  activeRole === 'site_settings'
                    ? 'bg-[#D49A55] text-[#FFF7EC]'
                    : 'bg-[#F8EBDD] dark:bg-[#5A3019] hover:bg-[#D49A55]/10 text-inherit border border-[#D49A55]/20'
                )}
              >
                <Settings className="size-4" /> Site Settings
              </button>
            </>
          ) : (
            <div className="px-3 py-1.5 rounded-xl border border-primary/10 bg-primary/5 text-xs font-bold capitalize flex items-center gap-1.5">
              {currentUser.role === 'kitchen' ? (
                <>
                  <Clock className="size-4 text-[#D49A55]" /> Kitchen Station
                </>
              ) : (
                <>
                  <Truck className="size-4 text-[#D49A55]" /> Courier Station
                </>
              )}
            </div>
          )}
          <button
            onClick={refreshData}
            disabled={loading}
            className="p-2 bg-[#F8EBDD] dark:bg-[#5A3019] border border-[#D49A55]/20 rounded-xl hover:bg-[#D49A55]/10 active:scale-95 transition-all text-[#D49A55]"
            title="Refresh database"
          >
            <RotateCcw className={cn('size-4', loading && 'animate-spin')} />
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-2 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <LogOut className="size-4" /> Log Out
          </button>
        </div>
      </header>
 
      {/* Conditionally Render active roles view */}
      {activeRole === 'admin' && (
        <AdminView
          stats={stats}
          orders={orders}
          filteredOrders={filteredOrders}
          customers={customers}
          filteredCustomers={filteredCustomers}
          history={history}
          activeCustomer={activeCustomer}
          activeCustomerOrders={activeCustomerOrders}
          selectedCustomerId={selectedCustomerId}
          setSelectedCustomerId={setSelectedCustomerId}
          orderSearch={orderSearch}
          setOrderSearch={setOrderSearch}
          crmSearch={crmSearch}
          setCrmSearch={setCrmSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
 
      {activeRole === 'kitchen' && (
        <KitchenView
          orders={orders}
          onUpdateStatus={handleUpdateStatus}
          onPrintLabel={(o) => setPrintingOrder(o)}
        />
      )}
 
      {activeRole === 'courier' && (
        <CourierView
          route={route}
          bakeryCoords={bakeryCoords}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
 
      {activeRole === 'staff' && currentUser.role === 'admin' && (
        <StaffManagementView
          initialUsers={initialStaffUsers}
          currentUserEmail={currentUser.email}
        />
      )}
 
      {activeRole === 'email_settings' && currentUser.role === 'admin' && (
        <EmailSettingsView
          initialSettings={initialEmailSettings}
        />
      )}

      {activeRole === 'site_settings' && currentUser.role === 'admin' && (
        <SiteSettingsView
          initialSettings={initialSiteSettings}
        />
      )}

      {/* Shipping Label Preview Modal */}
      {printingOrder && (
        <LabelPrinterModal
          order={printingOrder}
          onClose={() => setPrintingOrder(null)}
          onPrintToggle={() => handleToggleLabel(printingOrder._id)}
        />
      )}
    </div>
  );
}

/* ==========================================================================
   SUB-COMPONENT: ADMIN VIEW
   ========================================================================== */
interface AdminViewProps {
  stats: {
    totalRevenue: number;
    activeOrders: number;
    totalOrders: number;
    totalCustomers: number;
  };
  orders: OrderData[];
  filteredOrders: OrderData[];
  customers: CustomerData[];
  filteredCustomers: CustomerData[];
  history: SalesHistoryItem[];
  activeCustomer: CustomerData | null;
  activeCustomerOrders: OrderData[];
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
  orderSearch: string;
  setOrderSearch: (s: string) => void;
  crmSearch: string;
  setCrmSearch: (s: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  onUpdateStatus: (id: string, s: string) => void;
}

function AdminView({
  stats,
  filteredOrders,
  filteredCustomers,
  history,
  activeCustomer,
  activeCustomerOrders,
  selectedCustomerId,
  setSelectedCustomerId,
  orderSearch,
  setOrderSearch,
  crmSearch,
  setCrmSearch,
  statusFilter,
  setStatusFilter,
  onUpdateStatus,
}: AdminViewProps) {
  // SVG Sales Chart layout parameters
  const chartHeight = 160;
  const chartWidth = 500;
  const padding = 30;

  const points = useMemo(() => {
    if (history.length === 0) return '';
    const maxVal = Math.max(...history.map((h) => h.amount), 100);
    const stepX = (chartWidth - padding * 2) / Math.max(history.length - 1, 1);

    return history
      .map((h, i) => {
        const x = padding + i * stepX;
        const y = chartHeight - padding - (h.amount / maxVal) * (chartHeight - padding * 2);
        return `${x},${y}`;
      })
      .join(' ');
  }, [history]);

  const fillPoints = useMemo(() => {
    if (history.length === 0) return '';
    const maxVal = Math.max(...history.map((h) => h.amount), 100);
    const stepX = (chartWidth - padding * 2) / Math.max(history.length - 1, 1);
    const startX = padding;
    const endX = padding + (history.length - 1) * stepX;
    const baseY = chartHeight - padding;

    const basePoints = history
      .map((h, i) => {
        const x = padding + i * stepX;
        const y = chartHeight - padding - (h.amount / maxVal) * (chartHeight - padding * 2);
        return `${x},${y}`;
      })
      .join(' ');

    return `${startX},${baseY} ${basePoints} ${endX},${baseY}`;
  }, [history]);

  return (
    <div className="flex flex-col gap-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FFF7EC] dark:bg-[#482612] p-5 rounded-2xl border border-primary/10 shadow-sm flex items-center gap-4">
          <div className="size-11 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center shrink-0">
            <DollarSign className="size-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Revenue</span>
            <span className="text-xl font-bold font-mono text-[#4A2718] dark:text-[#F7EADD]">
              ${stats.totalRevenue.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="bg-[#FFF7EC] dark:bg-[#482612] p-5 rounded-2xl border border-primary/10 shadow-sm flex items-center gap-4">
          <div className="size-11 rounded-xl bg-[#D49A55]/10 text-[#D49A55] flex items-center justify-center shrink-0">
            <ShoppingBag className="size-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Active Orders</span>
            <span className="text-xl font-bold font-mono text-[#4A2718] dark:text-[#F7EADD]">
              {stats.activeOrders}
            </span>
          </div>
        </div>

        <div className="bg-[#FFF7EC] dark:bg-[#482612] p-5 rounded-2xl border border-primary/10 shadow-sm flex items-center gap-4">
          <div className="size-11 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="size-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Total Orders</span>
            <span className="text-xl font-bold font-mono text-[#4A2718] dark:text-[#F7EADD]">
              {stats.totalOrders}
            </span>
          </div>
        </div>

        <div className="bg-[#FFF7EC] dark:bg-[#482612] p-5 rounded-2xl border border-primary/10 shadow-sm flex items-center gap-4">
          <div className="size-11 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <Users className="size-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Total Customers</span>
            <span className="text-xl font-bold font-mono text-[#4A2718] dark:text-[#F7EADD]">
              {stats.totalCustomers}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Orders & Charts + CRM Directory */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left 2 Columns: Trend Chart & Live Queue */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          {/* Trend Chart Card */}
          <div className="bg-[#FFF7EC] dark:bg-[#482612] p-6 rounded-2xl border border-primary/10 shadow-sm flex flex-col gap-4">
            <div>
              <h3 className="font-serif text-lg font-bold flex items-center gap-2">
                <TrendingUp className="size-5 text-[#D49A55]" /> Weekly Sales Trend
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Revenue aggregates by preferred delivery dates (last 7 dates)
              </p>
            </div>

            <div className="w-full overflow-x-auto">
              {history.length > 1 ? (
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full min-w-[400px]">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D49A55" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#D49A55" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Grid Lines */}
                  <line
                    x1={padding}
                    y1={padding}
                    x2={chartWidth - padding}
                    y2={padding}
                    stroke="#D49A55"
                    strokeOpacity="0.1"
                    strokeDasharray="4"
                  />
                  <line
                    x1={padding}
                    y1={chartHeight / 2}
                    x2={chartWidth - padding}
                    y2={chartHeight / 2}
                    stroke="#D49A55"
                    strokeOpacity="0.1"
                    strokeDasharray="4"
                  />
                  <line
                    x1={padding}
                    y1={chartHeight - padding}
                    x2={chartWidth - padding}
                    y2={chartHeight - padding}
                    stroke="#D49A55"
                    strokeOpacity="0.2"
                  />

                  {/* Gradient Area Fill */}
                  <polygon points={fillPoints} fill="url(#chartGrad)" />

                  {/* Line Draw */}
                  <polyline
                    fill="none"
                    stroke="#D49A55"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                  />

                  {/* Intersect Dots & Axis Values */}
                  {history.map((h, i) => {
                    const maxVal = Math.max(...history.map((hi) => hi.amount), 100);
                    const stepX = (chartWidth - padding * 2) / (history.length - 1);
                    const x = padding + i * stepX;
                    const y =
                      chartHeight - padding - (h.amount / maxVal) * (chartHeight - padding * 2);

                    return (
                      <g key={i}>
                        <circle
                          cx={x}
                          cy={y}
                          r="5"
                          className="fill-[#FFF7EC] dark:fill-[#482612] stroke-[#D49A55] stroke-[2.5]"
                        />
                        {/* Text Date Label */}
                        <text
                          x={x}
                          y={chartHeight - 10}
                          textAnchor="middle"
                          className="fill-[#4A2718]/60 dark:fill-[#F7EADD]/60 text-[9px] font-mono"
                        >
                          {h.date.substring(5)}
                        </text>
                        {/* Tooltip Amount */}
                        <text
                          x={x}
                          y={y - 10}
                          textAnchor="middle"
                          className="fill-[#4A2718] dark:fill-[#F7EADD] text-[9px] font-mono font-bold"
                        >
                          ${h.amount.toFixed(0)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              ) : (
                <div className="h-[120px] flex items-center justify-center text-xs text-muted-foreground">
                  Not enough sales data to chart trends yet.
                </div>
              )}
            </div>
          </div>

          {/* Active Orders Queue Card */}
          <div className="bg-[#FFF7EC] dark:bg-[#482612] p-6 rounded-2xl border border-primary/10 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-serif text-lg font-bold flex items-center gap-2">
                  <ShoppingBag className="size-5 text-[#D49A55]" /> Live Order Queue
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Manage incoming client requests and fulfillment states
                </p>
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 bg-[#F8EBDD] dark:bg-[#5A3019] p-1 rounded-xl border border-primary/10">
                {['all', 'pending', 'kitchen_prep', 'ready_for_delivery', 'delivered'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={cn(
                      'px-2.5 py-1 text-[11px] font-semibold rounded-lg capitalize transition-all',
                      statusFilter === st
                        ? 'bg-[#D49A55] text-[#FFF7EC]'
                        : 'hover:bg-[#D49A55]/10 text-inherit'
                    )}
                  >
                    {st === 'kitchen_prep' ? 'Prep' : st === 'ready_for_delivery' ? 'Ready' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search orders by customer name, phone, or order ID..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full bg-[#F8EBDD]/60 dark:bg-[#5A3019]/40 border border-[#D49A55]/20 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[#D49A55]"
              />
            </div>

            {/* Table layout for desktop, list for mobile */}
            <div className="overflow-x-auto border border-primary/10 rounded-xl bg-[#F8EBDD]/20">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F8EBDD] dark:bg-[#5A3019] border-b border-primary/10 text-muted-foreground font-semibold">
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Items</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Slot / Address</th>
                    <th className="p-3 text-right">Status Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((o) => (
                      <tr key={o._id} className="hover:bg-[#D49A55]/5 transition-colors">
                        <td className="p-3 font-mono font-bold text-[10px] text-muted-foreground">
                          {o._id.substring(o._id.length - 6)}
                        </td>
                        <td className="p-3">
                          <span className="font-semibold block">{o.customerName}</span>
                          <span className="text-[10px] text-muted-foreground">{o.customerPhone}</span>
                        </td>
                        <td className="p-3">
                          <div className="max-w-[150px] truncate" title={o.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}>
                            {o.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                          </div>
                        </td>
                        <td className="p-3 font-semibold font-mono">${o.totalPrice.toFixed(2)}</td>
                        <td className="p-3">
                          <span className="font-medium text-[#D49A55] block">
                            {o.preferredDate} ({o.preferredTime})
                          </span>
                          <span className="text-[10px] text-muted-foreground block truncate max-w-[150px]">
                            {o.address.line1}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {o.status === 'pending' && (
                              <button
                                onClick={() => onUpdateStatus(o._id, 'kitchen_prep')}
                                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg text-[10px] shadow-sm transition-all"
                              >
                                Send to Kitchen
                              </button>
                            )}
                            {o.status === 'kitchen_prep' && (
                              <span className="px-2.5 py-1.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 font-semibold rounded-lg text-[10px]">
                                Prepping...
                              </span>
                            )}
                            {o.status === 'ready_for_delivery' && (
                              <button
                                onClick={() => onUpdateStatus(o._id, 'out_for_delivery')}
                                className="px-2.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-[10px] shadow-sm transition-all"
                              >
                                Send Out
                              </button>
                            )}
                            {o.status === 'out_for_delivery' && (
                              <button
                                onClick={() => onUpdateStatus(o._id, 'delivered')}
                                className="px-2.5 py-1.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg text-[10px] shadow-sm transition-all"
                              >
                                Complete
                              </button>
                            )}
                            {o.status === 'delivered' && (
                              <span className="px-2.5 py-1.5 bg-green-500/10 text-green-600 font-semibold rounded-lg text-[10px] flex items-center gap-1">
                                <CheckCircle className="size-3" /> Delivered
                              </span>
                            )}
                            {o.status === 'cancelled' && (
                              <span className="px-2.5 py-1.5 bg-red-500/10 text-red-600 font-semibold rounded-lg text-[10px]">
                                Cancelled
                              </span>
                            )}
                            {o.status !== 'cancelled' && o.status !== 'delivered' && (
                              <button
                                onClick={() => onUpdateStatus(o._id, 'cancelled')}
                                className="p-1.5 bg-[#FFF7EC] hover:bg-red-500/10 text-red-600 rounded-lg text-[10px] border border-red-500/10"
                                title="Cancel order"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground text-xs">
                        No orders match the selected filters or search terms.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Column: CRM Customer Directory */}
        <div className="bg-[#FFF7EC] dark:bg-[#482612] p-6 rounded-2xl border border-primary/10 shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="font-serif text-lg font-bold flex items-center gap-2">
              <Users className="size-5 text-[#D49A55]" /> Customer CRM Database
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Auto-deduplicated clients group directory
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={crmSearch}
              onChange={(e) => setCrmSearch(e.target.value)}
              className="w-full bg-[#F8EBDD]/60 dark:bg-[#5A3019]/40 border border-[#D49A55]/20 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-[#D49A55]"
            />
          </div>

          {/* Directory Listings */}
          <div className="flex-1 overflow-y-auto max-h-[300px] xl:max-h-[480px] border border-primary/10 rounded-xl bg-[#F8EBDD]/20 divide-y divide-primary/5">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((c) => (
                <button
                  key={c._id}
                  onClick={() => setSelectedCustomerId(selectedCustomerId === c._id ? null : c._id)}
                  className={cn(
                    'w-full text-left p-3 flex items-center justify-between transition-colors',
                    selectedCustomerId === c._id ? 'bg-[#D49A55]/15' : 'hover:bg-[#D49A55]/5'
                  )}
                >
                  <div className="min-w-0">
                    <span className="font-semibold text-xs block truncate">{c.name}</span>
                    <span className="text-[10px] text-muted-foreground block truncate">{c.email}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs font-bold block text-[#D49A55]">
                      ${c.totalSpent.toFixed(2)}
                    </span>
                    <span className="text-[9px] text-muted-foreground block">
                      {c.orderCount} {c.orderCount === 1 ? 'order' : 'orders'}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-6 text-center text-muted-foreground text-xs">
                No customers found.
              </div>
            )}
          </div>

          {/* CRM Details Overlay Panel */}
          {activeCustomer && (
            <div className="p-4 bg-[#F8EBDD] dark:bg-[#5A3019] rounded-xl border border-[#D49A55]/30 flex flex-col gap-3 shadow-inner text-xs">
              <div className="flex items-center justify-between border-b border-primary/10 pb-2">
                <span className="font-serif font-bold text-sm text-[#4A2718] dark:text-[#F7EADD]">
                  Customer Profile
                </span>
                <button
                  onClick={() => setSelectedCustomerId(null)}
                  className="p-1 hover:bg-[#D49A55]/10 rounded-lg text-muted-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <User className="size-3.5 text-[#D49A55] shrink-0" />
                  <span className="font-medium truncate">{activeCustomer.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="size-3.5 text-[#D49A55] shrink-0" />
                  <span className="font-mono">{activeCustomer.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="size-3.5 text-[#D49A55] shrink-0" />
                  <span className="truncate">{activeCustomer.email}</span>
                </div>
              </div>

              {/* Order history summary */}
              <div className="mt-2 flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground block">
                  Order history links ({activeCustomerOrders.length})
                </span>
                <div className="flex flex-col gap-1 max-h-[120px] overflow-y-auto pr-1">
                  {activeCustomerOrders.map((o) => (
                    <div
                      key={o._id}
                      className="p-2 bg-[#FFF7EC]/60 dark:bg-[#482612]/60 rounded-lg border border-primary/5 flex items-center justify-between text-[10px]"
                    >
                      <div>
                        <span className="font-semibold block font-mono text-[9px]">
                          #{o._id.substring(o._id.length - 6)}
                        </span>
                        <span className="text-muted-foreground">{o.preferredDate}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold block">${o.totalPrice.toFixed(2)}</span>
                        <span
                          className={cn(
                            'text-[9px] font-semibold capitalize',
                            o.status === 'delivered' ? 'text-green-600' : 'text-amber-600'
                          )}
                        >
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   SUB-COMPONENT: KITCHEN DISPLAY SYSTEM (KDS)
   ========================================================================== */
interface KitchenViewProps {
  orders: OrderData[];
  onUpdateStatus: (id: string, s: string) => void;
  onPrintLabel: (o: OrderData) => void;
}

function KitchenView({ orders, onUpdateStatus, onPrintLabel }: KitchenViewProps) {
  // Group orders by their active kitchen stages
  const pendingOrders = useMemo(() => {
    return orders
      .filter((o) => o.status === 'pending')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [orders]);

  const prepOrders = useMemo(() => {
    return orders
      .filter((o) => o.status === 'kitchen_prep')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [orders]);

  const readyOrders = useMemo(() => {
    return orders
      .filter((o) => o.status === 'ready_for_delivery')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [orders]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-serif text-lg font-bold flex items-center gap-2">
            <Clock className="size-5 text-[#D49A55]" /> Kitchen Display Screen (KDS)
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time preparation columns, baking timers, and packaging checks.
          </p>
        </div>

        {/* Counts overview */}
        <div className="flex flex-wrap items-center gap-3 text-xs bg-[#FFF7EC] dark:bg-[#482612] p-3 rounded-2xl border border-primary/10 shadow-sm font-semibold text-inherit shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-400"></span>
            <span>Queue: {pendingOrders.length}</span>
          </div>
          <div className="h-3 w-px bg-primary/10"></div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-600 animate-pulse"></span>
            <span>Baking: {prepOrders.length}</span>
          </div>
          <div className="h-3 w-px bg-primary/10"></div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-green-500"></span>
            <span>Ready: {readyOrders.length}</span>
          </div>
        </div>
      </div>

      {/* 3-Column Kanban Board Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Queue (Pending) */}
        <div className="flex flex-col gap-4 bg-[#F8EBDD]/40 dark:bg-[#5A3019]/20 p-4 rounded-2xl border border-primary/5 min-h-[400px]">
          <div className="flex items-center justify-between border-b border-primary/10 pb-2 mb-1">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-400"></span> Queued for Baking
            </h4>
            <span className="font-mono text-xs bg-[#FFF7EC] dark:bg-[#482612] px-2.5 py-0.5 rounded-full border border-primary/5 font-bold shadow-sm">
              {pendingOrders.length}
            </span>
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto max-h-[600px] pr-1">
            {pendingOrders.length > 0 ? (
              pendingOrders.map((o) => (
                <KitchenOrderCard
                  key={o._id}
                  order={o}
                  onUpdateStatus={onUpdateStatus}
                  onPrintLabel={onPrintLabel}
                />
              ))
            ) : (
              <div className="bg-[#FFF7EC]/30 dark:bg-[#482612]/10 border border-dashed border-primary/10 rounded-2xl py-12 text-center text-muted-foreground text-xs italic">
                No orders waiting.
              </div>
            )}
          </div>
        </div>

        {/* Column 2: In Preparation (Baking) */}
        <div className="flex flex-col gap-4 bg-[#F8EBDD]/40 dark:bg-[#5A3019]/20 p-4 rounded-2xl border border-primary/5 min-h-[400px]">
          <div className="flex items-center justify-between border-b border-primary/10 pb-2 mb-1">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-600 animate-pulse"></span> In Ovens (Baking)
            </h4>
            <span className="font-mono text-xs bg-[#FFF7EC] dark:bg-[#482612] px-2.5 py-0.5 rounded-full border border-primary/5 font-bold shadow-sm">
              {prepOrders.length}
            </span>
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto max-h-[600px] pr-1">
            {prepOrders.length > 0 ? (
              prepOrders.map((o) => (
                <KitchenOrderCard
                  key={o._id}
                  order={o}
                  onUpdateStatus={onUpdateStatus}
                  onPrintLabel={onPrintLabel}
                />
              ))
            ) : (
              <div className="bg-[#FFF7EC]/30 dark:bg-[#482612]/10 border border-dashed border-primary/10 rounded-2xl py-12 text-center text-muted-foreground text-xs italic">
                Ovens are empty.
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Ready / Completed */}
        <div className="flex flex-col gap-4 bg-[#F8EBDD]/40 dark:bg-[#5A3019]/20 p-4 rounded-2xl border border-primary/5 min-h-[400px]">
          <div className="flex items-center justify-between border-b border-primary/10 pb-2 mb-1">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-green-500"></span> Ready / Packaged
            </h4>
            <span className="font-mono text-xs bg-[#FFF7EC] dark:bg-[#482612] px-2.5 py-0.5 rounded-full border border-primary/5 font-bold shadow-sm">
              {readyOrders.length}
            </span>
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto max-h-[600px] pr-1">
            {readyOrders.length > 0 ? (
              readyOrders.map((o) => (
                <KitchenOrderCard
                  key={o._id}
                  order={o}
                  onUpdateStatus={onUpdateStatus}
                  onPrintLabel={onPrintLabel}
                />
              ))
            ) : (
              <div className="bg-[#FFF7EC]/30 dark:bg-[#482612]/10 border border-dashed border-primary/10 rounded-2xl py-12 text-center text-muted-foreground text-xs italic">
                No ready orders.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface KitchenOrderCardProps {
  order: OrderData;
  onUpdateStatus: (id: string, s: string) => void;
  onPrintLabel: (o: OrderData) => void;
}

function KitchenOrderCard({ order, onUpdateStatus, onPrintLabel }: KitchenOrderCardProps) {
  const prepDurationText = useMemo(() => {
    if (order.prepDuration) {
      const mins = Math.floor(order.prepDuration / 60);
      const secs = order.prepDuration % 60;
      return `${mins}m ${secs}s`;
    }
    return '';
  }, [order.prepDuration]);

  return (
    <div
      className={cn(
        'rounded-2xl border p-4 flex flex-col gap-3.5 shadow-sm transition-all bg-[#FFF7EC] dark:bg-[#482612]',
        order.status === 'kitchen_prep'
          ? 'border-[#D49A55]/40 shadow-inner'
          : 'border-primary/10'
      )}
    >
      {/* Card Header: Client Name, time slot & custom timer */}
      <div className="flex items-start justify-between border-b border-primary/5 pb-2.5 text-inherit">
        <div className="min-w-0">
          <h4 className="font-bold text-xs truncate">{order.customerName}</h4>
          <p className="text-[9px] text-[#D49A55] font-semibold mt-0.5">
            Slot: {order.preferredDate} ({order.preferredTime})
          </p>
        </div>
        <div>
          {order.status === 'kitchen_prep' && order.prepStartedAt ? (
            <KdsTimer prepStartedAt={order.prepStartedAt} />
          ) : order.status === 'ready_for_delivery' && prepDurationText ? (
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-green-500/10 text-green-600 border border-green-500/10">
              {prepDurationText}
            </span>
          ) : (
            <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-[#F8EBDD] text-muted-foreground dark:bg-[#5A3019]">
              Queued
            </span>
          )}
        </div>
      </div>

      {/* Items list */}
      <div className="flex flex-col gap-1.5 text-inherit">
        <span className="text-[9px] font-bold text-muted-foreground tracking-wider uppercase">
          Items to Bake:
        </span>
        <ul className="flex flex-col gap-1 text-xs">
          {order.items.map((it, idx) => (
            <li key={idx} className="flex items-center justify-between font-medium text-[11px]">
              <span>{it.name}</span>
              <span className="font-bold text-xs text-[#D49A55] font-mono">
                &times;{it.quantity}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Notes / Landmark Address details */}
      {(order.notes || order.addressReference) && (
        <div className="bg-[#F8EBDD]/40 dark:bg-[#5A3019]/20 p-2.5 rounded-xl border border-primary/5 text-[10px] leading-relaxed flex flex-col gap-1 text-inherit">
          {order.notes && (
            <p>
              <span className="font-semibold text-inherit">Note:</span> {order.notes}
            </p>
          )}
          {order.addressReference && (
            <p className="text-muted-foreground text-[9px]">
              <span className="font-semibold text-inherit">Drop instructions:</span>{' '}
              {order.addressReference}
            </p>
          )}
        </div>
      )}

      {/* Kitchen triggers */}
      <div className="mt-auto pt-2.5 border-t border-primary/5 flex items-center justify-between gap-2.5 text-inherit">
        {/* Print Label popup trigger */}
        <button
          onClick={() => onPrintLabel(order)}
          className={cn(
            "px-2 py-1.5 border rounded-xl transition-all flex items-center justify-center gap-1.5 text-[9px] font-semibold shadow-2xs",
            order.labelPrinted
              ? "bg-green-500/5 text-green-600 border-green-500/20 hover:bg-green-500/10"
              : "bg-[#D49A55]/5 text-[#D49A55] border-[#D49A55]/20 hover:bg-[#D49A55]/10 animate-pulse"
          )}
          title={order.labelPrinted ? "Label printed" : "Print Label"}
        >
          <Printer className="size-3.5 shrink-0" />
          {order.labelPrinted ? 'Printed' : 'Print Label'}
        </button>

        {order.status === 'pending' && (
          <button
            onClick={() => onUpdateStatus(order._id, 'kitchen_prep')}
            className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-[#FFF7EC] font-bold rounded-xl text-[10px] shadow-sm transition-all"
          >
            Start Baking
          </button>
        )}
        {order.status === 'kitchen_prep' && (
          <button
            onClick={() => onUpdateStatus(order._id, 'ready_for_delivery')}
            className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 text-[#FFF7EC] font-bold rounded-xl text-[10px] shadow-sm transition-all"
          >
            Ready / Completed
          </button>
        )}
        {order.status === 'ready_for_delivery' && (
          <span className="flex-1 py-1.5 bg-green-500/10 text-green-600 border border-green-500/20 font-bold rounded-xl text-[10px] text-center block">
            Ready
          </span>
        )}
      </div>
    </div>
  );
}

// Live timer tick hook component
function KdsTimer({ prepStartedAt }: { prepStartedAt: string }) {
  const [elapsed, setElapsed] = useState(() => {
    const startMs = new Date(prepStartedAt).getTime();
    return Math.max(0, Math.floor((Date.now() - startMs) / 1000));
  });

  useEffect(() => {
    const startMs = new Date(prepStartedAt).getTime();

    const interval = setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [prepStartedAt]);

  const formatSeconds = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLate = elapsed >= 300; // red timer warning after 5 minutes (300 seconds)

  return (
    <span
      className={cn(
        'font-mono font-bold text-[10px] px-2 py-1 rounded-lg border',
        isLate
          ? 'bg-red-500/10 text-red-600 border-red-500/20 animate-pulse'
          : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
      )}
    >
      {formatSeconds(elapsed)}
    </span>
  );
}

/* ==========================================================================
   SUB-COMPONENT: SHIPPING LABEL PRINTER PREVIEW MODAL
   ========================================================================== */
interface LabelPrinterModalProps {
  order: OrderData;
  onClose: () => void;
  onPrintToggle: () => void;
}

function LabelPrinterModal({ order, onClose, onPrintToggle }: LabelPrinterModalProps) {
  const handlePrintAction = () => {
    onPrintToggle();
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#FFF7EC] text-black w-full max-w-sm rounded-2xl shadow-xl flex flex-col border border-primary/20 overflow-hidden print:shadow-none print:border-none">
        {/* Modal controls, hidden during printer prints */}
        <div className="p-4 bg-[#FFF7EC] border-b border-primary/10 flex items-center justify-between print:hidden text-[#4A2718]">
          <span className="font-serif font-bold text-xs flex items-center gap-1">
            <Printer className="size-4" /> Shipping Label Simulator
          </span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#D49A55]/10 rounded-lg text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Printable Label Wrapper */}
        <div className="p-8 flex flex-col gap-6 print:p-0 bg-white font-sans text-black select-none">
          {/* Header Label Details */}
          <div className="flex justify-between items-start border-b-2 border-black pb-3">
            <div>
              <h2 className="font-serif font-black tracking-tighter text-lg leading-none uppercase">
                GOLDEN CRUMB
              </h2>
              <span className="text-[8px] font-bold tracking-wider uppercase block mt-1">
                Artisan Cookies · SF Hub
              </span>
            </div>
            <div className="text-right">
              <span className="font-mono text-[9px] font-bold border border-black px-1.5 py-0.5 rounded leading-none block">
                PRIORITY COOKIE
              </span>
            </div>
          </div>

          {/* Delivery Coordinates & Date Grid */}
          <div className="grid grid-cols-2 gap-4 border-b border-dashed border-black/30 pb-3 text-xs leading-tight">
            <div>
              <span className="text-[8px] font-bold uppercase text-black/60 block">
                Preferred delivery date:
              </span>
              <span className="font-bold text-[#D49A55] print:text-black">
                {order.preferredDate}
              </span>
            </div>
            <div>
              <span className="text-[8px] font-bold uppercase text-black/60 block">
                Requested time slot:
              </span>
              <span className="font-bold text-[#D49A55] print:text-black">
                {order.preferredTime}
              </span>
            </div>
          </div>

          {/* Address and Client Details */}
          <div className="flex flex-col gap-1.5 text-xs">
            <span className="text-[8px] font-bold uppercase text-black/60 block">Deliver to:</span>
            <div className="font-bold leading-tight">
              <p className="text-sm font-black">{order.customerName}</p>
              <p className="mt-0.5">{order.address.line1}</p>
              {order.address.line2 && <p>{order.address.line2}</p>}
              <p>
                {order.address.city}, {order.address.state}
              </p>
              <p className="font-mono text-[10px] text-black/70 mt-0.5">{order.customerPhone}</p>
            </div>
          </div>

          {/* Drop-off Instructions landmarks */}
          {order.addressReference && (
            <div className="p-2.5 bg-black/5 border border-black/10 rounded text-[10px] leading-relaxed">
              <span className="font-bold block uppercase text-[8px] text-black/60">
                Landmarks / delivery notes:
              </span>
              <p className="font-medium italic mt-0.5">{order.addressReference}</p>
            </div>
          )}

          {/* Content Checklist */}
          <div className="flex flex-col gap-1.5 border-t border-b border-black py-3 text-xs leading-none">
            <span className="text-[8px] font-bold uppercase text-black/60 block">Contents:</span>
            <ul className="flex flex-col gap-1">
              {order.items.map((it, idx) => (
                <li key={idx} className="flex justify-between items-center font-bold">
                  <span>{it.name}</span>
                  <span className="font-mono">QTY: {it.quantity}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Barcode and Order ID */}
          <div className="flex flex-col items-center gap-1 border-t-2 border-black pt-4">
            {/* Mock CSS Barcode */}
            <div className="h-10 w-full flex items-center justify-between px-4 select-none shrink-0">
              {[2, 1, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 2].map(
                (w, idx) => (
                  <div
                    key={idx}
                    className="h-full bg-black shrink-0"
                    style={{ width: `${w}px`, opacity: idx % 3 === 0 ? 0 : 1 }}
                  />
                )
              )}
            </div>
            <span className="font-mono text-[9px] font-bold mt-1 text-black/80 tracking-widest uppercase">
              *{order._id.substring(order._id.length - 8)}*
            </span>
          </div>
        </div>

        {/* Modal triggers, hidden during printing */}
        <div className="p-4 bg-[#FFF7EC] border-t border-primary/10 flex items-center justify-between gap-4 print:hidden text-[#4A2718]">
          <span
            className={cn(
              'text-[10px] font-bold px-2 py-1 rounded border',
              order.labelPrinted
                ? 'bg-green-500/10 text-green-600 border-green-500/20'
                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
            )}
          >
            {order.labelPrinted ? 'Printed status: Yes' : 'Printed status: No'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-[#F8EBDD] border border-primary/20 rounded-xl hover:bg-[#D49A55]/10 text-xs font-semibold"
            >
              Close
            </button>
            <button
              onClick={handlePrintAction}
              className="px-3.5 py-1.5 bg-[#D49A55] text-white rounded-xl hover:bg-[#D49A55]/90 text-xs font-bold shadow-sm"
            >
              Print Simulated
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   SUB-COMPONENT: COURIER DELIVERY SCREEN (WITH OPTIMIZED SEQUENCING ROUTE)
   ========================================================================== */
interface CourierViewProps {
  route: RouteStop[];
  bakeryCoords: { lat: number; lng: number };
  onUpdateStatus: (id: string, s: string) => void;
}

function CourierView({ route, bakeryCoords, onUpdateStatus }: CourierViewProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<{ remove: () => void; fitBounds: (bounds: unknown, options?: Record<string, unknown>) => void } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ remove: () => void }[]>([]);
  const lineRef = useRef<{ remove: () => void } | null>(null);

  // Load leaflet css and javascript dynamically in courier screen
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
      const script = document.createElement("script");
      script.id = jsId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
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

  // Update Map visual markers and sequencing lines
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current) return;

    const win = window as unknown as LeafletWindow;
    const L = win.L;
    if (!L) return;

    // Initialize Map if not present
    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [bakeryCoords.lat, bakeryCoords.lng],
        zoom: 12,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      mapRef.current = map;
    }

    const map = mapRef.current;

    // Clear previous markers & lines
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (lineRef.current) {
      lineRef.current.remove();
      lineRef.current = null;
    }

    // Coordinates points list for the polyline route path
    const pathCoords: [number, number][] = [[bakeryCoords.lat, bakeryCoords.lng]];

    // 1. Add bakery star icon marker
    const bakeryIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 bg-amber-500/30 rounded-full animate-ping"></div>
          <div class="relative w-7 h-7 bg-amber-500 border-2 border-white rounded-full flex items-center justify-center shadow-lg font-black text-white text-[10px]">
            ★
          </div>
        </div>
      `,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const bakeryMarker = L.marker([bakeryCoords.lat, bakeryCoords.lng], {
      icon: bakeryIcon,
    })
      .addTo(map)
      .bindPopup(
        `<div style="font-family: sans-serif; font-size: 11px; padding: 2px;">
          <strong>Golden Crumb Kitchen</strong><br/>
          Bakery Hub & Kitchen Dispatch
        </div>`
      );

    markersRef.current.push(bakeryMarker);

    // 2. Add sequential Stop markers
    route.forEach((stop, index) => {
      const stopLat = typeof stop.lat === 'number' ? stop.lat : bakeryCoords.lat;
      const stopLng = typeof stop.lng === 'number' ? stop.lng : bakeryCoords.lng;
      pathCoords.push([stopLat, stopLng]);

      const isOutForDelivery = stop.status === 'out_for_delivery';

      const stopIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            ${isOutForDelivery ? '<div class="absolute w-8 h-8 bg-[#D49A55]/30 rounded-full animate-ping"></div>' : ''}
            <div class="relative w-6 h-6 ${isOutForDelivery ? 'bg-[#D49A55]' : 'bg-[#4A2718]'} border-2 border-white rounded-full flex items-center justify-center shadow-md font-bold text-white text-[10px]">
              ${index + 1}
            </div>
          </div>
        `,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const stopMarker = L.marker([stopLat, stopLng], {
        icon: stopIcon,
      })
        .addTo(map)
        .bindPopup(
          `<div style="font-family: sans-serif; font-size: 11px; padding: 2px; line-height: 1.3;">
            <strong>Stop #${index + 1}: ${stop.customerName}</strong><br/>
            Address: ${stop.address.line1}<br/>
            Time Slot: ${stop.preferredTime}<br/>
            Status: <span style="text-transform: capitalize; font-weight: bold; color: #D49A55">${stop.status}</span>
          </div>`
        );

      markersRef.current.push(stopMarker);
    });

    // 3. Draw route connecting polylines
    if (pathCoords.length > 1) {
      const routeLine = L.polyline(pathCoords, {
        color: '#D49A55',
        weight: 3.5,
        opacity: 0.8,
        dashArray: '5, 8',
      }).addTo(map);

      lineRef.current = routeLine;

      // Fit map view bound bounds to fit bakery and all points
      const bounds = L.latLngBounds(pathCoords);
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    return () => {
      // Don't fully remove map on re-render to avoid flashing,
      // just ensure cleanup markers are cleared.
    };
  }, [mapLoaded, route, bakeryCoords]);

  // Handle map cleanup on component destroy
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Route Stops Sequence list */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div>
          <h3 className="font-serif text-lg font-bold flex items-center gap-2">
            <Navigation className="size-5 text-[#D49A55]" /> Optimized Route Dispatch
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Deliveries sequenced by proximity (Nearest Neighbor routing)
          </p>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto max-h-[500px] pr-1">
          {route.length > 0 ? (
            route.map((stop, index) => {
              const kmDistance = (stop.distanceFromLastStop / 1000).toFixed(2);
              return (
                <div
                  key={stop._id}
                  className="bg-[#FFF7EC] dark:bg-[#482612] border border-primary/10 rounded-2xl p-4 flex flex-col gap-3 shadow-sm"
                >
                  {/* Sequence Marker Header */}
                  <div className="flex items-center justify-between border-b border-primary/5 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="size-6 bg-[#D49A55] text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="font-bold text-xs font-serif block">
                        Stop #{index + 1}: {stop.customerName}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg bg-green-500/10 text-green-600">
                      +{kmDistance} km
                    </span>
                  </div>

                  {/* Stop Details */}
                  <div className="flex flex-col gap-1.5 text-xs">
                    <p className="font-semibold">{stop.address.line1}</p>
                    {stop.address.line2 && <p className="text-muted-foreground">{stop.address.line2}</p>}
                    <p className="text-[#D49A55] font-semibold mt-0.5">
                      Requested time: {stop.preferredDate} ({stop.preferredTime})
                    </p>
                    {stop.addressReference && (
                      <p className="text-[10px] bg-[#F8EBDD] dark:bg-[#5A3019] p-2 rounded-lg italic text-muted-foreground mt-1">
                        Landmark: {stop.addressReference}
                      </p>
                    )}
                  </div>

                  {/* Courier State Controls */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-primary/5">
                    {stop.status === 'ready_for_delivery' && (
                      <button
                        onClick={() => onUpdateStatus(stop._id, 'out_for_delivery')}
                        className="w-full py-1.5 bg-[#D49A55] hover:bg-[#D49A55]/90 text-white font-bold rounded-xl text-[11px] shadow-sm flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Truck className="size-3.5" /> Depart for Delivery
                      </button>
                    )}
                    {stop.status === 'out_for_delivery' && (
                      <button
                        onClick={() => onUpdateStatus(stop._id, 'delivered')}
                        className="w-full py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-[11px] shadow-sm flex items-center justify-center gap-1.5 transition-all"
                      >
                        <CheckCircle className="size-3.5" /> Mark Delivered
                      </button>
                    )}
                    {stop.status === 'pending' && (
                      <span className="text-[10px] text-muted-foreground py-1 bg-muted px-2.5 rounded-lg font-semibold block text-center w-full border border-primary/5">
                        In Kitchen Prep Queue
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-[#FFF7EC]/50 dark:bg-[#482612]/50 border border-dashed border-primary/20 rounded-2xl py-12 text-center text-muted-foreground text-xs">
              No pending deliveries left on route.
            </div>
          )}
        </div>
      </div>

      {/* Map visual, occupies right 3 columns */}
      <div className="lg:col-span-3 flex flex-col gap-4">
        <div>
          <h3 className="font-serif text-lg font-bold flex items-center gap-2">
            <MapPin className="size-5 text-[#D49A55]" /> Routing Sequence Map
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Interactive routing pins display inside the city of San Francisco
          </p>
        </div>

        {/* Leaflet container */}
        <div className="border border-primary/10 rounded-2xl overflow-hidden shadow-inner bg-[#FFF7EC] dark:bg-[#482612] relative z-0 h-[480px]">
          <div ref={mapContainerRef} className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   SUB-COMPONENT: STAFF & PERMISSIONS MANAGEMENT VIEW
   ========================================================================== */

interface StaffManagementViewProps {
  initialUsers: StaffUser[];
  currentUserEmail: string;
}

function StaffManagementView({ initialUsers, currentUserEmail }: StaffManagementViewProps) {
  const [users, setUsers] = useState<StaffUser[]>(initialUsers);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form toggles
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);

  // Input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'kitchen' | 'courier'>('kitchen');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getStaffUsersAction();
      if (res.success && res.users) {
        setUsers(res.users);
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to sync staff list.' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);

    try {
      const res = await createStaffUserAction(name, email, password, role);
      if (res.success) {
        setFeedback({ type: 'success', message: `Staff member ${name} created successfully!` });
        setName('');
        setEmail('');
        setPassword('');
        setRole('kitchen');
        setShowAddForm(false);
        await fetchUsers();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to create staff member.' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditInit = (user: StaffUser) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setPassword('');
    setFeedback(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setFeedback(null);
    setLoading(true);

    try {
      const res = await updateStaffUserAction(
        editingUser._id,
        name,
        email,
        role,
        password.trim() ? password : undefined
      );
      if (res.success) {
        setFeedback({ type: 'success', message: `Staff member ${name} updated successfully!` });
        setEditingUser(null);
        setName('');
        setEmail('');
        setPassword('');
        await fetchUsers();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to update staff member.' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}?`)) return;
    setFeedback(null);
    setLoading(true);

    try {
      const res = await deleteStaffUserAction(userId);
      if (res.success) {
        setFeedback({ type: 'success', message: `Staff member deleted successfully.` });
        await fetchUsers();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to delete staff member.' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FFF7EC] dark:bg-[#482612] p-6 rounded-2xl border border-primary/10 shadow-sm flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold flex items-center gap-2">
            <Shield className="size-5 text-[#D49A55]" /> Staff &amp; Permissions Directory
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage bakery administrator, kitchen baking staff, and courier accounts.
          </p>
        </div>
        {!showAddForm && !editingUser && (
          <button
            onClick={() => {
              setShowAddForm(true);
              setName('');
              setEmail('');
              setPassword('');
              setRole('kitchen');
              setFeedback(null);
            }}
            className="px-4 py-2 bg-[#D49A55] hover:bg-[#D49A55]/95 text-[#FFF7EC] rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 shrink-0"
          >
            <UserPlus className="size-4" /> Add Staff Member
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={cn(
            'p-3.5 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed border',
            feedback.type === 'success'
              ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300'
              : 'bg-red-500/10 border-red-500/20 text-red-600'
          )}
        >
          {feedback.type === 'success' ? (
            <Check className="size-4 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Forms Section */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="bg-[#F8EBDD] dark:bg-[#5A3019] p-5 rounded-2xl border border-primary/5 flex flex-col gap-4">
          <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Create Staff Account
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="staff-name" className="text-xs font-semibold text-muted-foreground">Full Name</label>
              <input
                id="staff-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. John Doe"
                className="w-full bg-[#FFF7EC] dark:bg-[#482612] border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-[#D49A55] placeholder-muted-foreground/60"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="staff-email" className="text-xs font-semibold text-muted-foreground">Email Address</label>
              <input
                id="staff-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="e.g. john@goldencrumb.com"
                className="w-full bg-[#FFF7EC] dark:bg-[#482612] border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-[#D49A55] placeholder-muted-foreground/60"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="staff-pass" className="text-xs font-semibold text-muted-foreground">Password</label>
              <input
                id="staff-pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Minimum 6 characters"
                className="w-full bg-[#FFF7EC] dark:bg-[#482612] border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-[#D49A55] placeholder-muted-foreground/60"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="staff-role" className="text-xs font-semibold text-muted-foreground">System Role &amp; Permissions</label>
              <select
                id="staff-role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'kitchen' | 'courier')}
                className="w-full bg-[#FFF7EC] dark:bg-[#482612] border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-[#D49A55]"
              >
                <option value="admin">Admin (Full Control)</option>
                <option value="kitchen">Kitchen (KDS View Only)</option>
                <option value="courier">Courier (Routing View Only)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3.5 mt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-[#D49A55]/20 hover:bg-[#D49A55]/10 text-inherit text-xs font-semibold rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#D49A55] hover:bg-[#D49A55]/95 text-[#FFF7EC] text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Create Account'}
            </button>
          </div>
        </form>
      )}

      {editingUser && (
        <form onSubmit={handleUpdate} className="bg-[#F8EBDD] dark:bg-[#5A3019] p-5 rounded-2xl border border-primary/5 flex flex-col gap-4">
          <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Edit Staff Account: {editingUser.name}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-name" className="text-xs font-semibold text-muted-foreground">Full Name</label>
              <input
                id="edit-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[#FFF7EC] dark:bg-[#482612] border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-[#D49A55]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-email" className="text-xs font-semibold text-muted-foreground">Email Address</label>
              <input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#FFF7EC] dark:bg-[#482612] border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-[#D49A55]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-pass" className="text-xs font-semibold text-muted-foreground flex justify-between">
                <span>Update Password</span>
                <span className="text-[10px] text-muted-foreground font-normal italic">(leave blank to keep current)</span>
              </label>
              <input
                id="edit-pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password (optional)"
                className="w-full bg-[#FFF7EC] dark:bg-[#482612] border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-[#D49A55] placeholder-muted-foreground/60"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-role" className="text-xs font-semibold text-muted-foreground">System Role &amp; Permissions</label>
              <select
                id="edit-role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'kitchen' | 'courier')}
                className="w-full bg-[#FFF7EC] dark:bg-[#482612] border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-[#D49A55]"
              >
                <option value="admin">Admin (Full Control)</option>
                <option value="kitchen">Kitchen (KDS View Only)</option>
                <option value="courier">Courier (Routing View Only)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3.5 mt-2">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="px-4 py-2 border border-[#D49A55]/20 hover:bg-[#D49A55]/10 text-inherit text-xs font-semibold rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#D49A55] hover:bg-[#D49A55]/95 text-[#FFF7EC] text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Update Details'}
            </button>
          </div>
        </form>
      )}

      {/* Users Directory Table */}
      <div className="border border-primary/5 rounded-2xl overflow-hidden shadow-sm bg-[#FFF7EC]/40 dark:bg-[#482612]/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8EBDD]/60 dark:bg-[#5A3019]/40 border-b border-primary/5 font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">System Role</th>
                <th className="py-3.5 px-4">Registered</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {users.map((user) => {
                const isSelf = user.email.toLowerCase() === currentUserEmail.toLowerCase();
                return (
                  <tr key={user._id} className="hover:bg-primary/5 transition-all">
                    <td className="py-3.5 px-4 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span>{user.name}</span>
                        {isSelf && (
                          <span className="text-[9px] bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded font-mono font-bold font-sans">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground font-mono">{user.email}</td>
                    <td className="py-3.5 px-4">
                      {user.role === 'admin' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/20 uppercase tracking-tight">
                          <Shield className="size-3" /> Admin
                        </span>
                      )}
                      {user.role === 'kitchen' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D49A55]/10 text-[#D49A55] border border-[#D49A55]/20 uppercase tracking-tight">
                          <Clock className="size-3" /> Kitchen
                        </span>
                      )}
                      {user.role === 'courier' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 uppercase tracking-tight">
                          <Truck className="size-3" /> Courier
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditInit(user)}
                          className="p-1.5 border border-[#D49A55]/20 hover:bg-[#D49A55]/10 text-[#D49A55] rounded-lg transition-all"
                          title="Edit staff account"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id, user.name)}
                          disabled={isSelf}
                          className={cn(
                            'p-1.5 border border-red-500/20 text-red-600 rounded-lg transition-all',
                            isSelf
                              ? 'opacity-30 cursor-not-allowed'
                              : 'hover:bg-red-500/10'
                          )}
                          title={isSelf ? 'Cannot delete yourself' : 'Delete staff account'}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   SUB-COMPONENT: EMAIL CONFIGURATION & TEMPLATE DESIGNER
   ========================================================================== */

interface EmailSettingsViewProps {
  initialSettings: any;
}

function renderMockTemplate(subject: string, body: string): string {
  const mockTable = `
    <table class="item-list" style="width: 100%; border-collapse: collapse; margin: 15px 0;">
      <thead>
        <tr style="border-bottom: 2px solid #482612; text-align: left; background-color: #F8EBDD;">
          <th style="padding: 8px; font-size: 12px; text-transform: uppercase;">Cookie</th>
          <th style="padding: 8px; font-size: 12px; text-transform: uppercase; text-align: center;">Quantity</th>
          <th style="padding: 8px; font-size: 12px; text-transform: uppercase; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding: 8px; font-size: 13px;">Chocolate Chip Pecan</td>
          <td style="padding: 8px; font-size: 13px; text-align: center;">6</td>
          <td style="padding: 8px; font-size: 13px; text-align: right;">$24.00</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-size: 13px;">Salted Caramel Toffee</td>
          <td style="padding: 8px; font-size: 13px; text-align: center;">4</td>
          <td style="padding: 8px; font-size: 13px; text-align: right;">$18.00</td>
        </tr>
      </tbody>
    </table>
  `;

  const vars = {
    orderId: '5D9F2B',
    customerName: 'Jane Doe',
    customerEmail: 'jane.doe@example.com',
    totalPrice: '$42.00',
    preferredDate: '2026-06-25',
    preferredTime: '10:00 AM - 12:00 PM',
    deliveryAddress: '123 Golden Gate Ave, San Francisco, CA',
    itemsTable: mockTable,
    trackingUrl: '#',
    adminUrl: '#',
    statusTitle: 'Baking in Progress',
    statusDescription: 'Your artisan cookies have entered the kitchen prep stage and are now being freshly rolled and baked by our team.',
  };

  let renderedBody = body;
  for (const [key, value] of Object.entries(vars)) {
    renderedBody = renderedBody.split(`{{${key}}}`).join(value);
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #F0E0D0;
            color: #4A2718;
            margin: 0;
            padding: 15px;
          }
          .container {
            max-width: 100%;
            background-color: #FFF7EC;
            border: 1px solid #D49A55;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          }
          .header {
            background-color: #482612;
            padding: 16px;
            text-align: center;
            border-bottom: 3px solid #D49A55;
          }
          .header h1 {
            color: #F7EADD;
            font-family: Georgia, serif;
            margin: 0;
            font-size: 20px;
            letter-spacing: 1px;
          }
          .content {
            padding: 24px 20px;
            line-height: 1.5;
            font-size: 13px;
          }
          .footer {
            background-color: #F8EBDD;
            padding: 12px;
            text-align: center;
            font-size: 10px;
            color: #4A2718;
            border-top: 1px solid #EAEAEA;
          }
          .footer a {
            color: #D49A55;
            text-decoration: none;
            font-weight: bold;
          }
          .button {
            display: inline-block;
            background-color: #D49A55;
            color: #FFF7EC !important;
            padding: 10px 20px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            margin: 12px 0;
            font-size: 12px;
          }
          .item-list {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          .item-list th {
            border-bottom: 2px solid #482612;
            text-align: left;
            padding: 6px;
            font-size: 11px;
            text-transform: uppercase;
          }
          .item-list td {
            border-bottom: 1px solid #F8EBDD;
            padding: 6px;
            font-size: 12px;
          }
          .total {
            text-align: right;
            font-weight: bold;
            font-size: 14px;
            margin-top: 12px;
            color: #D49A55;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>GOLDEN CRUMB</h1>
          </div>
          <div class="content">
            ${renderedBody}
          </div>
          <div class="footer">
            <p>Golden Crumb · Artisan Cookies · San Francisco, CA</p>
            <p>Questions? Contact us on <a href="https://wa.me/15551234567">WhatsApp</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function EmailSettingsView({ initialSettings }: EmailSettingsViewProps) {
  const [provider, setProvider] = useState<'smtp' | 'resend' | 'mock'>(
    initialSettings?.provider || 'mock'
  );
  const [resendApiKey, setResendApiKey] = useState(initialSettings?.resendApiKey || '');
  const [smtpHost, setSmtpHost] = useState(initialSettings?.smtpHost || '');
  const [smtpPort, setSmtpPort] = useState(Number(initialSettings?.smtpPort) || 587);
  const [smtpSecure, setSmtpSecure] = useState(Boolean(initialSettings?.smtpSecure));
  const [smtpUser, setSmtpUser] = useState(initialSettings?.smtpUser || '');
  const [smtpPass, setSmtpPass] = useState(initialSettings?.smtpPass || '');
  const [fromAddress, setFromAddress] = useState(
    initialSettings?.fromAddress || 'Golden Crumb <orders@golden-crumb.com>'
  );
  const [adminAddress, setAdminAddress] = useState(
    initialSettings?.adminAddress || 'admin@golden-crumb.com'
  );

  // Initialize templates map safely
  const [templatesState, setTemplatesState] = useState<Record<string, { subject: string; body: string }>>(() => {
    const defaults = {
      customerConfirmation: { subject: '', body: '' },
      adminConfirmation: { subject: '', body: '' },
      statusKitchenPrep: { subject: '', body: '' },
      statusReadyForDelivery: { subject: '', body: '' },
      statusOutForDelivery: { subject: '', body: '' },
      statusDelivered: { subject: '', body: '' },
      statusCancelled: { subject: '', body: '' },
    };
    if (initialSettings?.templates) {
      return { ...defaults, ...initialSettings.templates };
    }
    return defaults;
  });

  const [activeTemplateKey, setActiveTemplateKey] = useState<string>('customerConfirmation');
  const [testRecipient, setTestRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Available templates labels and list
  const templatesList = [
    { key: 'customerConfirmation', label: 'Order Confirmed (Customer)' },
    { key: 'adminConfirmation', label: 'New Order Alert (Admin)' },
    { key: 'statusKitchenPrep', label: 'Status: Baking (Customer)' },
    { key: 'statusReadyForDelivery', label: 'Status: Ready (Customer)' },
    { key: 'statusOutForDelivery', label: 'Status: Out for Delivery' },
    { key: 'statusDelivered', label: 'Status: Delivered' },
    { key: 'statusCancelled', label: 'Status: Cancelled' },
  ];

  // Map of placeholders by template
  const getPlaceholders = (key: string) => {
    if (key === 'customerConfirmation' || key === 'adminConfirmation') {
      return [
        'orderId',
        'customerName',
        'customerEmail',
        'itemsTable',
        'totalPrice',
        'preferredDate',
        'preferredTime',
        'deliveryAddress',
        key === 'customerConfirmation' ? 'trackingUrl' : 'adminUrl',
      ];
    }
    return [
      'orderId',
      'customerName',
      'customerEmail',
      'preferredDate',
      'preferredTime',
      'statusTitle',
      'statusDescription',
      'trackingUrl',
    ];
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);

    try {
      const payload = {
        provider,
        resendApiKey,
        smtpHost,
        smtpPort,
        smtpSecure,
        smtpUser,
        smtpPass,
        fromAddress,
        adminAddress,
        templates: templatesState,
      };

      const res = await updateEmailSettingsAction(payload);
      if (res.success) {
        setFeedback({ type: 'success', message: 'Email configuration and templates saved successfully!' });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to save email configuration.' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'An unexpected error occurred while saving.' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all email configurations and templates to default values? This will wipe your custom configurations.')) {
      return;
    }

    setFeedback(null);
    setLoading(true);

    try {
      const res = await resetEmailSettingsAction();
      if (res.success) {
        setFeedback({ type: 'success', message: 'Email settings reset to system defaults!' });
        // Reload fresh settings
        window.location.reload();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to reset settings.' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'An unexpected error occurred while resetting.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient.trim()) return;

    setFeedback(null);
    setTesting(true);

    try {
      const res = await sendTestEmailAction(testRecipient);
      if (res.success) {
        setFeedback({ type: 'success', message: `Test email dispatched to ${testRecipient}! Check your inbox or the mock preview directory.` });
        setTestRecipient('');
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to dispatch test email.' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'An unexpected error occurred while testing.' });
    } finally {
      setTesting(false);
    }
  };

  const insertPlaceholder = (ph: string) => {
    const textarea = document.getElementById('template-body-textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newBody = before + `{{${ph}}}` + after;

      setTemplatesState((prev) => ({
        ...prev,
        [activeTemplateKey]: {
          ...prev[activeTemplateKey],
          body: newBody,
        },
      }));

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + ph.length + 4, start + ph.length + 4);
      }, 0);
    }
  };

  // Generate preview HTML dynamically
  const activeTemplate = templatesState[activeTemplateKey] || { subject: '', body: '' };
  const previewHtml = renderMockTemplate(activeTemplate.subject, activeTemplate.body);

  return (
    <div className="bg-[#FFF7EC] dark:bg-[#482612] p-6 rounded-2xl border border-primary/10 shadow-sm flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold flex items-center gap-2">
            <Mail className="size-5 text-[#D49A55]" /> Email &amp; SMTP Configuration
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure SMTP, Resend, or local file mock previews. Customize subject lines and responsive HTML templates.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={cn(
            'p-3.5 rounded-xl text-xs flex items-start gap-2.5 border leading-relaxed',
            feedback.type === 'success'
              ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300'
              : 'bg-red-500/10 border-red-500/20 text-red-600'
          )}
        >
          {feedback.type === 'success' ? (
            <Check className="size-4 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Connection Configuration: Occupies left 2 columns */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <form onSubmit={handleSave} className="bg-[#F8EBDD] dark:bg-[#5A3019] p-5 rounded-2xl border border-primary/5 flex flex-col gap-5">
            <div>
              <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-muted-foreground">
                1. Delivery Method Settings
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Choose how Golden Crumb sends customer notification emails.
              </p>
            </div>

            {/* Provider Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              {(['mock', 'resend', 'smtp'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  className={cn(
                    'p-3.5 rounded-xl border text-center font-bold text-xs capitalize transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-95',
                    provider === p
                      ? 'bg-[#D49A55] text-white border-transparent'
                      : 'bg-[#FFF7EC] dark:bg-[#482612] border-[#D49A55]/20 hover:bg-[#D49A55]/10 text-inherit'
                  )}
                >
                  {p === 'mock' && <Code className="size-4" />}
                  {p === 'resend' && <Send className="size-4" />}
                  {p === 'smtp' && <Settings className="size-4" />}
                  <span className="text-[10px] tracking-tight">
                    {p === 'mock' ? 'Local File' : p === 'resend' ? 'Resend' : 'SMTP Server'}
                  </span>
                </button>
              ))}
            </div>

            {/* Provider Instructions */}
            <div className="text-[11px] bg-[#FFF7EC] dark:bg-[#482612] p-3 rounded-xl border border-[#D49A55]/10 italic text-[#4A2718]/80 dark:text-[#F7EADD]/80">
              {provider === 'mock' && (
                <p>
                  <strong>Mock Preview Mode:</strong> No actual emails will be sent. Dispatched emails will be saved locally inside <code>artifacts/mock-emails/</code> as HTML preview files for easy styling inspection.
                </p>
              )}
              {provider === 'resend' && (
                <p>
                  <strong>Resend API Mode:</strong> Sends transactional emails via Resend's high-delivery API endpoints. Requires a valid API Key.
                </p>
              )}
              {provider === 'smtp' && (
                <p>
                  <strong>SMTP Mode:</strong> Connects to a standard custom SMTP mail relay (e.g. Gmail SMTP, SendGrid, Amazon SES, or local mail servers).
                </p>
              )}
            </div>

            {/* Resend Fields */}
            {provider === 'resend' && (
              <div className="flex flex-col gap-1.5 animate-fadeIn animate-duration-200">
                <label htmlFor="resend-api-key" className="text-xs font-semibold text-muted-foreground">Resend API Key</label>
                <input
                  id="resend-api-key"
                  type="password"
                  value={resendApiKey}
                  onChange={(e) => setResendApiKey(e.target.value)}
                  placeholder="re_123456789..."
                  className="w-full bg-[#FFF7EC] dark:bg-[#482612] border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-[#D49A55]"
                />
              </div>
            )}

            {/* SMTP Fields */}
            {provider === 'smtp' && (
              <div className="flex flex-col gap-3.5 animate-fadeIn animate-duration-200">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <label htmlFor="smtp-host" className="text-xs font-semibold text-muted-foreground">SMTP Host</label>
                    <input
                      id="smtp-host"
                      type="text"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="smtp.example.com"
                      className="w-full bg-[#FFF7EC] dark:bg-[#482612] border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-[#D49A55]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="smtp-port" className="text-xs font-semibold text-muted-foreground">Port</label>
                    <input
                      id="smtp-port"
                      type="number"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(Number(e.target.value))}
                      placeholder="587"
                      className="w-full bg-[#FFF7EC] dark:bg-[#482612] border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-[#D49A55]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 py-0.5">
                  <input
                    id="smtp-secure"
                    type="checkbox"
                    checked={smtpSecure}
                    onChange={(e) => setSmtpSecure(e.target.checked)}
                    className="rounded border-gray-300 text-[#D49A55] focus:ring-[#D49A55]"
                  />
                  <label htmlFor="smtp-secure" className="text-xs font-semibold text-muted-foreground">
                    Use Secure SSL Connection (usually Port 465)
                  </label>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="smtp-user" className="text-xs font-semibold text-muted-foreground">SMTP Username</label>
                  <input
                    id="smtp-user"
                    type="text"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-[#FFF7EC] dark:bg-[#482612] border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-[#D49A55]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="smtp-pass" className="text-xs font-semibold text-muted-foreground">SMTP Password</label>
                  <input
                    id="smtp-pass"
                    type="password"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    placeholder="••••••••••••••"
                    className="w-full bg-[#FFF7EC] dark:bg-[#482612] border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-[#D49A55]"
                  />
                </div>
              </div>
            )}

            {/* Sender / Receivers addresses */}
            <div className="flex flex-col gap-3.5 border-t border-primary/5 pt-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="from-address" className="text-xs font-semibold text-muted-foreground">From Address (Sender Display)</label>
                <input
                  id="from-address"
                  type="text"
                  value={fromAddress}
                  onChange={(e) => setFromAddress(e.target.value)}
                  placeholder="Golden Crumb <orders@golden-crumb.com>"
                  required
                  className="w-full bg-[#FFF7EC] dark:bg-[#482612] border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-[#D49A55]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="admin-address" className="text-xs font-semibold text-muted-foreground">Admin Alert Recipient</label>
                <input
                  id="admin-address"
                  type="email"
                  value={adminAddress}
                  onChange={(e) => setAdminAddress(e.target.value)}
                  placeholder="admin@golden-crumb.com"
                  required
                  className="w-full bg-[#FFF7EC] dark:bg-[#482612] border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-[#D49A55]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-1.5 pt-4 border-t border-primary/5">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-[#D49A55] hover:bg-[#D49A55]/95 text-[#FFF7EC] text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                {loading ? 'Saving Settings...' : 'Save Settings'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="px-3.5 py-2.5 border border-red-500/20 hover:bg-red-500/10 text-red-600 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 flex items-center justify-center"
                title="Reset to defaults"
              >
                <RotateCcw className="size-4" />
              </button>
            </div>
          </form>

          {/* Test email module */}
          <form onSubmit={handleSendTest} className="bg-[#F8EBDD] dark:bg-[#5A3019] p-5 rounded-2xl border border-primary/5 flex flex-col gap-4">
            <div>
              <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-muted-foreground">
                2. Delivery Diagnostics
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Send a live test message to confirm server or Resend API response.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="test-recipient" className="text-xs font-semibold text-muted-foreground">Recipient Email Address</label>
              <div className="flex gap-2">
                <input
                  id="test-recipient"
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="test@example.com"
                  required
                  className="flex-1 bg-[#FFF7EC] dark:bg-[#482612] border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-xs focus:outline-none focus:border-[#D49A55]"
                />
                <button
                  type="submit"
                  disabled={testing || !testRecipient}
                  className="px-4 py-2 bg-[#D49A55] hover:bg-[#D49A55]/95 text-[#FFF7EC] text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {testing ? 'Sending...' : 'Send Test'} <Send className="size-3.5" />
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Templates Customization Canvas: Occupies right 3 columns */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          <div className="bg-[#F8EBDD] dark:bg-[#5A3019] p-5 rounded-2xl border border-primary/5 flex flex-col gap-5">
            <div>
              <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-muted-foreground">
                3. HTML Template Canvas
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Edit responsive layout content and dynamic subject lines. Changes will take effect once saved.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Select template */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="active-template-select" className="text-xs font-semibold text-muted-foreground">Choose Template</label>
                <select
                  id="active-template-select"
                  value={activeTemplateKey}
                  onChange={(e) => setActiveTemplateKey(e.target.value)}
                  className="w-full bg-[#FFF7EC] dark:bg-[#482612] border border-[#D49A55]/20 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-[#D49A55] font-bold text-inherit"
                >
                  {templatesList.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="template-subject" className="text-xs font-semibold text-muted-foreground">Email Subject Line</label>
                <input
                  id="template-subject"
                  type="text"
                  value={activeTemplate.subject}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTemplatesState((prev) => ({
                      ...prev,
                      [activeTemplateKey]: { ...prev[activeTemplateKey], subject: val },
                    }));
                  }}
                  className="w-full bg-[#FFF7EC] dark:bg-[#482612] border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-xs focus:outline-none focus:border-[#D49A55] font-semibold text-inherit"
                />
              </div>
            </div>

            {/* Editor vs Preview Tabs */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-1">
              {/* Column A: Body Editor */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="template-body-textarea" className="text-xs font-semibold text-muted-foreground">HTML Body</label>
                  <span className="text-[10px] text-muted-foreground/60 italic font-mono">&lt;body&gt; wrapper applied</span>
                </div>
                <textarea
                  id="template-body-textarea"
                  rows={14}
                  value={activeTemplate.body}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTemplatesState((prev) => ({
                      ...prev,
                      [activeTemplateKey]: { ...prev[activeTemplateKey], body: val },
                    }));
                  }}
                  className="w-full bg-[#FFF7EC] dark:bg-[#482612] border border-[#D49A55]/20 rounded-xl p-3.5 text-xs focus:outline-none focus:border-[#D49A55] font-mono leading-relaxed text-inherit"
                />

                {/* Clickable Placeholders helper */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Available variables:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {getPlaceholders(activeTemplateKey).map((ph) => (
                      <button
                        key={ph}
                        type="button"
                        onClick={() => insertPlaceholder(ph)}
                        className="px-2 py-1 bg-[#FFF7EC] dark:bg-[#482612] hover:bg-[#D49A55]/10 border border-[#D49A55]/10 hover:border-[#D49A55]/30 rounded-lg text-[10px] font-mono font-semibold transition-all active:scale-95 text-inherit"
                        title="Click to insert at cursor"
                      >
                        {`{{${ph}}}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column B: Live Canvas Preview */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Eye className="size-4 text-[#D49A55]" /> Live Render Preview
                  </span>
                  <span className="text-[9px] bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                    Sandbox Mock
                  </span>
                </div>
                <div className="border border-[#D49A55]/20 rounded-2xl overflow-hidden shadow-inner bg-[#F0E0D0] h-[340px] xl:h-[390px] relative">
                  <iframe
                    title="Live Preview frame"
                    srcDoc={previewHtml}
                    className="w-full h-full border-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   SUB-COMPONENT: SITE SETTINGS VIEW
   ========================================================================== */
interface SiteSettingsViewProps {
  initialSettings: SiteContactSettings;
}

function SiteSettingsView({ initialSettings }: SiteSettingsViewProps) {
  const [contactEmail, setContactEmail] = useState(initialSettings.contactEmail);
  const [contactPhone, setContactPhone] = useState(initialSettings.contactPhone);
  const [location, setLocation] = useState(initialSettings.location);
  const [instagramUrl, setInstagramUrl] = useState(initialSettings.instagramUrl);
  const [whatsappUrl, setWhatsappUrl] = useState(initialSettings.whatsappUrl);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);

    try {
      const res = await updateSiteSettingsAction({
        contactEmail,
        contactPhone,
        location,
        instagramUrl,
        whatsappUrl,
      });
      if (res.success) {
        setFeedback({ type: 'success', message: 'Site contact information updated. Changes go live across the site immediately.' });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to save site settings.' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'An unexpected error occurred while saving.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div>
        <h2 className="font-serif text-xl font-bold">Site Settings</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Update the contact details and social links shown across the public site (footer, contact section, FAQ, order page) without touching code.
        </p>
      </div>

      {feedback && (
        <div
          className={cn(
            'p-3 rounded-xl text-xs font-semibold border',
            feedback.type === 'success'
              ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400'
              : 'bg-red-500/10 border-red-500/20 text-red-600'
          )}
        >
          {feedback.message}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-[#F8EBDD] dark:bg-[#5A3019] p-5 rounded-2xl border border-primary/5 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-email" className="text-xs font-semibold text-muted-foreground">Contact Email</label>
          <input
            id="contact-email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="hello@goldencrumb.com"
            required
            className="w-full bg-[#FFF7EC] dark:bg-[#482612] border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-[#D49A55]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-phone" className="text-xs font-semibold text-muted-foreground">Contact Phone</label>
          <input
            id="contact-phone"
            type="text"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="(415) 555-0100"
            required
            className="w-full bg-[#FFF7EC] dark:bg-[#482612] border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-[#D49A55]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="location" className="text-xs font-semibold text-muted-foreground">Location</label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="San Francisco, CA"
            required
            className="w-full bg-[#FFF7EC] dark:bg-[#482612] border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-[#D49A55]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="instagram-url" className="text-xs font-semibold text-muted-foreground">Instagram URL</label>
          <input
            id="instagram-url"
            type="url"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            placeholder="https://instagram.com/goldencrumb"
            required
            className="w-full bg-[#FFF7EC] dark:bg-[#482612] border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-[#D49A55]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="whatsapp-url" className="text-xs font-semibold text-muted-foreground">WhatsApp Link</label>
          <input
            id="whatsapp-url"
            type="url"
            value={whatsappUrl}
            onChange={(e) => setWhatsappUrl(e.target.value)}
            placeholder="https://wa.me/14155550100"
            required
            className="w-full bg-[#FFF7EC] dark:bg-[#482612] border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-[#D49A55]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2.5 bg-[#D49A55] hover:bg-[#D49A55]/95 text-[#FFF7EC] text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Site Settings'}
        </button>
      </form>
    </div>
  );
}
