'use server';

import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { Customer, ICustomer } from '@/models/Customer';
import { Order, IOrder } from '@/models/Order';
import { products } from '@/data/products';

// Bakery location in San Francisco (starting hub for deliveries)
const BAKERY_LAT = 37.7749;
const BAKERY_LNG = -122.4194;

interface CreateOrderInput {
  name: string;
  phone: string;
  email: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip?: string;
  };
  addressReference?: string;
  quantities: Record<string, number>;
  preferredDate: string;
  preferredTime: string;
  notes?: string;
  lat?: number;
  lng?: number;
}

/**
 * Normalizes strings for matching.
 */
function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Calculates distance in meters between two coordinates using the Haversine formula.
 */
function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Server Action: Submit a cookie order, perform CRM deduplication, and save to MongoDB.
 */
export async function createOrderAction(input: CreateOrderInput) {
  try {
    await connectToDatabase();

    const {
      name,
      phone,
      email,
      address,
      addressReference,
      quantities,
      preferredDate,
      preferredTime,
      notes,
      lat = BAKERY_LAT,
      lng = BAKERY_LNG,
    } = input;

    // 1. Calculate price and parse items
    const items = [];
    let totalPrice = 0;

    for (const [productId, qty] of Object.entries(quantities)) {
      if (qty > 0) {
        const product = products.find((p) => p.id === productId);
        if (product) {
          const itemPrice = product.price;
          const itemTotal = itemPrice * qty;
          totalPrice += itemTotal;
          items.push({
            productId,
            name: product.name,
            quantity: qty,
            price: itemPrice,
          });
        }
      }
    }

    if (items.length === 0) {
      throw new Error('Cannot create an order with empty items');
    }

    // 2. CRM De-duplication logic
    const normName = normalizeName(name);
    const normPhone = normalizePhone(phone);
    const normEmail = normalizeEmail(email);

    // Look up for matching customer by email, phone, or name
    let customer = await Customer.findOne({
      $or: [
        { email: normEmail },
        { phone: normPhone },
        { name: normName },
      ],
    });

    if (customer) {
      // Update existing customer contact details with the latest inputs
      customer.name = name;
      customer.phone = phone;
      customer.email = email;
    } else {
      // Create a new Customer profile
      customer = new Customer({
        name,
        phone,
        email,
        totalSpent: 0,
        orderCount: 0,
        orders: [],
      });
    }

    // 3. Create and Save the Order
    const order = new Order({
      customerId: customer._id,
      customerName: name,
      customerPhone: phone,
      customerEmail: email,
      items,
      totalPrice,
      lat,
      lng,
      address,
      addressReference,
      preferredDate,
      preferredTime,
      notes,
      status: 'pending',
      labelPrinted: false,
    });

    const savedOrder = await order.save();

    // 4. Update customer stats
    customer.orders.push(savedOrder._id);
    customer.orderCount = customer.orders.length;
    customer.totalSpent += totalPrice;
    await customer.save();

    return {
      success: true,
      orderId: savedOrder._id.toString(),
    };
  } catch (error: unknown) {
    console.error('Failed to create order:', error);
    const errMsg = error instanceof Error ? error.message : 'An unknown error occurred';
    return {
      success: false,
      error: errMsg,
    };
  }
}

/**
 * Server Action: Start kitchen preparation. Sets timestamp and status.
 */
export async function startPreparation(orderId: string) {
  try {
    await connectToDatabase();
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    order.status = 'kitchen_prep';
    order.prepStartedAt = new Date();
    order.prepCompletedAt = undefined;
    order.prepDuration = undefined;
    await order.save();

    return { success: true };
  } catch (error: unknown) {
    console.error('Failed to start preparation:', error);
    const errMsg = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: errMsg };
  }
}

/**
 * Server Action: Complete preparation. Sets status, final timestamp, and elapsed duration.
 */
export async function completePreparation(orderId: string) {
  try {
    await connectToDatabase();
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    order.status = 'ready_for_delivery';
    order.prepCompletedAt = new Date();

    if (order.prepStartedAt) {
      const elapsedMs = order.prepCompletedAt.getTime() - new Date(order.prepStartedAt).getTime();
      order.prepDuration = Math.max(0, Math.floor(elapsedMs / 1000)); // duration in seconds
    } else {
      order.prepDuration = 0;
    }

    await order.save();

    return { success: true };
  } catch (error: unknown) {
    console.error('Failed to complete preparation:', error);
    const errMsg = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: errMsg };
  }
}

/**
 * Server Action: Update Order Status generally.
 */
export async function updateOrderStatus(orderId: string, status: string) {
  try {
    await connectToDatabase();
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    order.status = status;
    await order.save();

    return { success: true };
  } catch (error: unknown) {
    console.error('Failed to update status:', error);
    const errMsg = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: errMsg };
  }
}

/**
 * Server Action: Toggle shipping label printed status.
 */
export async function toggleLabelPrinted(orderId: string) {
  try {
    await connectToDatabase();
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    order.labelPrinted = !order.labelPrinted;
    await order.save();

    return { success: true, labelPrinted: order.labelPrinted };
  } catch (error: unknown) {
    console.error('Failed to toggle label printed:', error);
    const errMsg = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: errMsg };
  }
}

/**
 * Server Action: Fetch all statistics, customer CRM directories, and orders list.
 */
export async function getDashboardData() {
  try {
    await connectToDatabase();

    const rawOrders = await Order.find({}).sort({ createdAt: -1 }).lean();
    const rawCustomers = await Customer.find({}).sort({ totalSpent: -1 }).lean();

    const orders = rawOrders as unknown as (IOrder & { _id: Types.ObjectId })[];
    const customers = rawCustomers as unknown as (ICustomer & { _id: Types.ObjectId })[];

    // Calculate aggregated stats
    let totalRevenue = 0;
    let activeOrdersCount = 0;

    orders.forEach((o) => {
      // Calculate revenue from all non-cancelled, non-pending orders (or just delivered? Let's say all except cancelled)
      if (o.status !== 'cancelled') {
        totalRevenue += o.totalPrice;
      }
      if (['pending', 'kitchen_prep', 'ready_for_delivery', 'out_for_delivery'].includes(o.status)) {
        activeOrdersCount++;
      }
    });

    // Sales history group by date for charts
    const salesByDate: Record<string, number> = {};
    orders.forEach((o) => {
      if (o.status !== 'cancelled') {
        const dateStr = o.preferredDate || new Date(o.createdAt).toISOString().split('T')[0];
        salesByDate[dateStr] = (salesByDate[dateStr] || 0) + o.totalPrice;
      }
    });

    const salesHistory = Object.entries(salesByDate)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7); // Last 7 unique sales dates

    // Serialization of MongoDB documents to plain objects for safe client usage
    const serializedOrders = orders.map((o) => ({
      ...o,
      _id: o._id.toString(),
      customerId: o.customerId ? o.customerId.toString() : null,
      items: o.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      prepStartedAt: o.prepStartedAt ? o.prepStartedAt.toISOString() : null,
      prepCompletedAt: o.prepCompletedAt ? o.prepCompletedAt.toISOString() : null,
    }));

    const serializedCustomers = customers.map((c) => ({
      ...c,
      _id: c._id.toString(),
      orders: c.orders.map((oid) => oid.toString()),
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    return {
      success: true,
      stats: {
        totalRevenue,
        activeOrders: activeOrdersCount,
        totalOrders: orders.length,
        totalCustomers: customers.length,
      },
      orders: serializedOrders,
      customers: serializedCustomers,
      salesHistory,
    };
  } catch (error: unknown) {
    console.error('Failed to fetch dashboard data:', error);
    const errMsg = error instanceof Error ? error.message : 'An unknown error occurred';
    return {
      success: false,
      error: errMsg,
    };
  }
}

/**
 * Server Action: Fetch delivery orders with optimized route routing (Nearest Neighbor algorithm).
 */
export async function getTodayDeliveries() {
  try {
    await connectToDatabase();

    // Fetch active delivery orders (not delivered and not cancelled)
    const rawActiveOrders = await Order.find({
      status: { $in: ['pending', 'kitchen_prep', 'ready_for_delivery', 'out_for_delivery'] },
    }).lean();

    const activeOrders = rawActiveOrders as unknown as (IOrder & { _id: Types.ObjectId })[];

    const ordersToRoute = activeOrders.map((o) => ({
      ...o,
      _id: o._id.toString(),
      customerId: o.customerId ? o.customerId.toString() : null,
      items: o.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      prepStartedAt: o.prepStartedAt ? o.prepStartedAt.toISOString() : null,
      prepCompletedAt: o.prepCompletedAt ? o.prepCompletedAt.toISOString() : null,
    }));

    // Nearest Neighbor implementation starting from bakery
    const route = [];
    const unvisited = [...ordersToRoute];
    let currLat = BAKERY_LAT;
    let currLng = BAKERY_LNG;

    while (unvisited.length > 0) {
      let closestIdx = -1;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const o = unvisited[i];
        // Ensure valid fallback coordinates are present
        const oLat = typeof o.lat === 'number' ? o.lat : BAKERY_LAT;
        const oLng = typeof o.lng === 'number' ? o.lng : BAKERY_LNG;

        const dist = getDistance(currLat, currLng, oLat, oLng);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = i;
        }
      }

      if (closestIdx !== -1) {
        const nextOrder = unvisited.splice(closestIdx, 1)[0];
        route.push({
          ...nextOrder,
          distanceFromLastStop: minDistance, // distance in meters
        });
        currLat = typeof nextOrder.lat === 'number' ? nextOrder.lat : BAKERY_LAT;
        currLng = typeof nextOrder.lng === 'number' ? nextOrder.lng : BAKERY_LNG;
      } else {
        break;
      }
    }

    return {
      success: true,
      bakeryCoords: { lat: BAKERY_LAT, lng: BAKERY_LNG },
      route,
    };
  } catch (error: unknown) {
    console.error('Failed to get sequenced route:', error);
    const errMsg = error instanceof Error ? error.message : 'An unknown error occurred';
    return {
      success: false,
      error: errMsg,
    };
  }
}
