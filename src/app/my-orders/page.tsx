import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/app/actions/authActions';
import { connectToDatabase } from '@/lib/db';
import { Order, IOrder } from '@/models/Order';
import { Types } from 'mongoose';
import { MyOrdersDashboard, OrderData } from './MyOrdersDashboard';

export const dynamic = 'force-dynamic';

export default async function MyOrdersPage() {
  const session = await getCurrentSession();
  if (!session.isLoggedIn || !session.userId) {
    redirect('/login');
  }

  await connectToDatabase();
  const rawOrders = await Order.find({ customerId: new Types.ObjectId(session.userId) })
    .sort({ createdAt: -1 })
    .lean();

  const orders = rawOrders as unknown as (IOrder & { _id: Types.ObjectId })[];

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

  return (
    <main className="min-h-screen bg-[#F0E0D0] dark:bg-[#482612] py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <MyOrdersDashboard
          customerName={session.name || 'Valued Customer'}
          initialOrders={serializedOrders as unknown as OrderData[]}
        />
      </div>
    </main>
  );
}
