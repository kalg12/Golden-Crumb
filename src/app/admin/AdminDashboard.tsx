'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
}: AdminDashboardProps) {
  const router = useRouter();

  // Roles toggler: admin, kitchen, courier, staff
  const [activeRole, setActiveRole] = useState<'admin' | 'kitchen' | 'courier' | 'staff'>(
    currentUser.role === 'admin' ? 'admin' : currentUser.role
  );

  // Local data states that sync with server actions
  const [stats, setStats] = useState(initialStats);
  const [orders, setOrders] = useState<OrderData[]>(initialOrders);
  const [customers, setCustomers] = useState<CustomerData[]>(initialCustomers);
  const [history, setHistory] = useState<SalesHistoryItem[]>(salesHistory);
  const [route, setRoute] = useState<RouteStop[]>(initialRoute);

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
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#FFF7EC] dark:bg-[#5A3019] p-4 rounded-2xl shadow-sm border border-primary/10">
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
                onClick={() => setActiveRole('admin')}
                className={cn(
                  'px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-sm',
                  activeRole === 'admin'
                    ? 'bg-[#D49A55] text-[#FFF7EC]'
                    : 'bg-[#F8EBDD] dark:bg-[#64371F] hover:bg-[#D49A55]/10 text-inherit border border-[#D49A55]/20'
                )}
              >
                <TrendingUp className="size-4" /> Admin Dashboard
              </button>
              <button
                onClick={() => setActiveRole('kitchen')}
                className={cn(
                  'px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-sm',
                  activeRole === 'kitchen'
                    ? 'bg-[#D49A55] text-[#FFF7EC]'
                    : 'bg-[#F8EBDD] dark:bg-[#64371F] hover:bg-[#D49A55]/10 text-inherit border border-[#D49A55]/20'
                )}
              >
                <Clock className="size-4" /> Kitchen Screen (KDS)
              </button>
              <button
                onClick={() => setActiveRole('courier')}
                className={cn(
                  'px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-sm',
                  activeRole === 'courier'
                    ? 'bg-[#D49A55] text-[#FFF7EC]'
                    : 'bg-[#F8EBDD] dark:bg-[#64371F] hover:bg-[#D49A55]/10 text-inherit border border-[#D49A55]/20'
                )}
              >
                <Truck className="size-4" /> Courier Routing
              </button>
              <button
                onClick={() => setActiveRole('staff')}
                className={cn(
                  'px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-sm',
                  activeRole === 'staff'
                    ? 'bg-[#D49A55] text-[#FFF7EC]'
                    : 'bg-[#F8EBDD] dark:bg-[#64371F] hover:bg-[#D49A55]/10 text-inherit border border-[#D49A55]/20'
                )}
              >
                <Shield className="size-4" /> Staff & Permissions
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
            className="p-2 bg-[#F8EBDD] dark:bg-[#64371F] border border-[#D49A55]/20 rounded-xl hover:bg-[#D49A55]/10 active:scale-95 transition-all text-[#D49A55]"
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
        <div className="bg-[#FFF7EC] dark:bg-[#5A3019] p-5 rounded-2xl border border-primary/10 shadow-sm flex items-center gap-4">
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

        <div className="bg-[#FFF7EC] dark:bg-[#5A3019] p-5 rounded-2xl border border-primary/10 shadow-sm flex items-center gap-4">
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

        <div className="bg-[#FFF7EC] dark:bg-[#5A3019] p-5 rounded-2xl border border-primary/10 shadow-sm flex items-center gap-4">
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

        <div className="bg-[#FFF7EC] dark:bg-[#5A3019] p-5 rounded-2xl border border-primary/10 shadow-sm flex items-center gap-4">
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
          <div className="bg-[#FFF7EC] dark:bg-[#5A3019] p-6 rounded-2xl border border-primary/10 shadow-sm flex flex-col gap-4">
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
                          className="fill-[#FFF7EC] dark:fill-[#5A3019] stroke-[#D49A55] stroke-[2.5]"
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
          <div className="bg-[#FFF7EC] dark:bg-[#5A3019] p-6 rounded-2xl border border-primary/10 shadow-sm flex flex-col gap-4">
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
              <div className="flex items-center gap-1.5 bg-[#F8EBDD] dark:bg-[#64371F] p-1 rounded-xl border border-primary/10">
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
                className="w-full bg-[#F8EBDD]/60 dark:bg-[#64371F]/40 border border-[#D49A55]/20 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[#D49A55]"
              />
            </div>

            {/* Table layout for desktop, list for mobile */}
            <div className="overflow-x-auto border border-primary/10 rounded-xl bg-[#F8EBDD]/20">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F8EBDD] dark:bg-[#64371F] border-b border-primary/10 text-muted-foreground font-semibold">
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
        <div className="bg-[#FFF7EC] dark:bg-[#5A3019] p-6 rounded-2xl border border-primary/10 shadow-sm flex flex-col gap-4">
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
              className="w-full bg-[#F8EBDD]/60 dark:bg-[#64371F]/40 border border-[#D49A55]/20 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-[#D49A55]"
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
            <div className="p-4 bg-[#F8EBDD] dark:bg-[#64371F] rounded-xl border border-[#D49A55]/30 flex flex-col gap-3 shadow-inner text-xs">
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
                      className="p-2 bg-[#FFF7EC]/60 dark:bg-[#5A3019]/60 rounded-lg border border-primary/5 flex items-center justify-between text-[10px]"
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
  // Filters active kitchen items: pending or kitchen_prep status
  const kitchenOrders = useMemo(() => {
    return orders
      .filter((o) => ['pending', 'kitchen_prep'].includes(o.status))
      .sort((a, b) => {
        // kitchen_prep comes first, then sorted by date
        if (a.status === 'kitchen_prep' && b.status !== 'kitchen_prep') return -1;
        if (a.status !== 'kitchen_prep' && b.status === 'kitchen_prep') return 1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }, [orders]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="font-serif text-lg font-bold flex items-center gap-2">
          <Clock className="size-5 text-[#D49A55]" /> Kitchen Display Screen (KDS)
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Real-time preparation prep cards and timer triggers for baking staff
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kitchenOrders.length > 0 ? (
          kitchenOrders.map((o) => (
            <div
              key={o._id}
              className={cn(
                'rounded-2xl border p-5 flex flex-col gap-4 shadow-sm transition-all',
                o.status === 'kitchen_prep'
                  ? 'bg-[#FFF7EC] border-amber-500/40 dark:bg-[#5A3019] dark:border-amber-500/40'
                  : 'bg-[#FFF7EC]/70 border-primary/10 dark:bg-[#5A3019]/70 dark:border-primary/10'
              )}
            >
              {/* Card Header: Client Name, time slot & custom timer */}
              <div className="flex items-start justify-between border-b border-primary/10 pb-3">
                <div className="min-w-0">
                  <h4 className="font-bold text-sm truncate">{o.customerName}</h4>
                  <p className="text-[10px] text-[#D49A55] font-semibold mt-0.5">
                    Slot: {o.preferredDate} ({o.preferredTime})
                  </p>
                </div>
                <div>
                  {o.status === 'kitchen_prep' && o.prepStartedAt ? (
                    <KdsTimer prepStartedAt={o.prepStartedAt} />
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-1 rounded bg-[#F8EBDD] text-muted-foreground dark:bg-[#64371F]">
                      Pending
                    </span>
                  )}
                </div>
              </div>

              {/* Items checklist */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                  Items to Bake:
                </span>
                <ul className="flex flex-col gap-1 text-xs">
                  {o.items.map((it, idx) => (
                    <li key={idx} className="flex items-center justify-between font-medium">
                      <span>{it.name}</span>
                      <span className="font-bold text-sm text-[#D49A55] font-mono">
                        &times;{it.quantity}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Notes / Landmark Address details */}
              {(o.notes || o.addressReference) && (
                <div className="bg-[#F8EBDD]/60 dark:bg-[#64371F]/40 p-3 rounded-xl border border-primary/5 text-[11px] leading-relaxed flex flex-col gap-1">
                  {o.notes && (
                    <p>
                      <span className="font-semibold">Note:</span> {o.notes}
                    </p>
                  )}
                  {o.addressReference && (
                    <p className="text-muted-foreground text-[10px]">
                      <span className="font-semibold text-inherit">Drop instructions:</span>{' '}
                      {o.addressReference}
                    </p>
                  )}
                </div>
              )}

              {/* Kitchen triggers */}
              <div className="mt-auto pt-3 border-t border-primary/5 flex items-center justify-between gap-3">
                {/* Print Label popup trigger */}
                <button
                  onClick={() => onPrintLabel(o)}
                  className="p-2 border border-[#D49A55]/30 hover:bg-[#D49A55]/10 rounded-xl transition-all flex items-center justify-center gap-1.5 text-[10px] font-semibold text-[#D49A55]"
                >
                  <Printer className="size-4 shrink-0" />
                  {o.labelPrinted ? 'Printed' : 'Print label'}
                </button>

                {o.status === 'pending' ? (
                  <button
                    onClick={() => onUpdateStatus(o._id, 'kitchen_prep')}
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-[#FFF7EC] font-bold rounded-xl text-xs shadow-sm transition-all"
                  >
                    Start Baking
                  </button>
                ) : (
                  <button
                    onClick={() => onUpdateStatus(o._id, 'ready_for_delivery')}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-[#FFF7EC] font-bold rounded-xl text-xs shadow-sm transition-all"
                  >
                    Ready / Completed
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-[#FFF7EC]/50 dark:bg-[#5A3019]/50 border border-dashed border-primary/20 rounded-2xl py-12 text-center text-muted-foreground text-xs">
            No active kitchen orders. Everything is fully baked!
          </div>
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
                  className="bg-[#FFF7EC] dark:bg-[#5A3019] border border-primary/10 rounded-2xl p-4 flex flex-col gap-3 shadow-sm"
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
                      <p className="text-[10px] bg-[#F8EBDD] dark:bg-[#64371F] p-2 rounded-lg italic text-muted-foreground mt-1">
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
            <div className="bg-[#FFF7EC]/50 dark:bg-[#5A3019]/50 border border-dashed border-primary/20 rounded-2xl py-12 text-center text-muted-foreground text-xs">
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
        <div className="border border-primary/10 rounded-2xl overflow-hidden shadow-inner bg-[#FFF7EC] dark:bg-[#5A3019] relative z-0 h-[480px]">
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
    <div className="bg-[#FFF7EC] dark:bg-[#5A3019] p-6 rounded-2xl border border-primary/10 shadow-sm flex flex-col gap-6">
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
        <form onSubmit={handleCreate} className="bg-[#F8EBDD] dark:bg-[#64371F] p-5 rounded-2xl border border-primary/5 flex flex-col gap-4">
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
                className="w-full bg-[#FFF7EC] dark:bg-[#5A3019] border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-[#D49A55] placeholder-muted-foreground/60"
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
                className="w-full bg-[#FFF7EC] dark:bg-[#5A3019] border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-[#D49A55] placeholder-muted-foreground/60"
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
                className="w-full bg-[#FFF7EC] dark:bg-[#5A3019] border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-[#D49A55] placeholder-muted-foreground/60"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="staff-role" className="text-xs font-semibold text-muted-foreground">System Role &amp; Permissions</label>
              <select
                id="staff-role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'kitchen' | 'courier')}
                className="w-full bg-[#FFF7EC] dark:bg-[#5A3019] border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-[#D49A55]"
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
        <form onSubmit={handleUpdate} className="bg-[#F8EBDD] dark:bg-[#64371F] p-5 rounded-2xl border border-primary/5 flex flex-col gap-4">
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
                className="w-full bg-[#FFF7EC] dark:bg-[#5A3019] border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-[#D49A55]"
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
                className="w-full bg-[#FFF7EC] dark:bg-[#5A3019] border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-[#D49A55]"
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
                className="w-full bg-[#FFF7EC] dark:bg-[#5A3019] border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-[#D49A55] placeholder-muted-foreground/60"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-role" className="text-xs font-semibold text-muted-foreground">System Role &amp; Permissions</label>
              <select
                id="edit-role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'kitchen' | 'courier')}
                className="w-full bg-[#FFF7EC] dark:bg-[#5A3019] border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-[#D49A55]"
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
      <div className="border border-primary/5 rounded-2xl overflow-hidden shadow-sm bg-[#FFF7EC]/40 dark:bg-[#5A3019]/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8EBDD]/60 dark:bg-[#64371F]/40 border-b border-primary/5 font-semibold text-muted-foreground uppercase tracking-wider">
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
